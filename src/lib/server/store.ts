import { createHash, randomUUID } from "node:crypto";
import type {
  ActivityEvent,
  Analysis,
  AppState,
  Movement,
  Policy,
  Product,
  PurchaseOrder,
  Recommendation,
  Role,
  SalesDay,
  SalesWeek,
} from "../contracts.ts";
import { getDb, metadata, ORG } from "./db.ts";
import { seedDatabase } from "./seed.ts";
import { addDays, fail } from "./validation.ts";

export const uid = () => randomUUID();
export const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function payloads<T>(table: string): T[] {
  const allowed = [
    "analysis_runs",
    "recommendations",
    "purchase_orders",
    "outbox_messages",
    "receipts",
    "activity_events",
  ];
  if (!allowed.includes(table)) throw new Error("Invalid table");
  return getDb()
    .prepare(`SELECT payload FROM ${table} WHERE org_id=? ORDER BY rowid DESC`)
    .all(ORG)
    .map((row) => JSON.parse(String(row.payload)) as T);
}
export function savePayload(table: string, id: string, payload: unknown, status?: string) {
  if (!["analysis_runs", "recommendations", "purchase_orders", "outbox_messages"].includes(table))
    throw new Error("Invalid table");
  if (status)
    getDb()
      .prepare(`UPDATE ${table} SET payload=?,status=? WHERE id=? AND org_id=?`)
      .run(JSON.stringify(payload), status, id, ORG);
  else
    getDb()
      .prepare(`UPDATE ${table} SET payload=? WHERE id=? AND org_id=?`)
      .run(JSON.stringify(payload), id, ORG);
}
export function audit(
  role: Role | "system",
  action: string,
  entityId: string,
  detail: string,
  before: unknown = null,
  after: unknown = null,
) {
  const event: ActivityEvent = {
    id: uid(),
    actor: role,
    action,
    entityId,
    detail,
    before,
    after,
    at: new Date().toISOString(),
  };
  getDb()
    .prepare("INSERT INTO activity_events VALUES(?,?,?,?,?,?,?)")
    .run(event.id, ORG, role, action, entityId, event.at, JSON.stringify(event));
}
export function stock(productId: string) {
  return (
    Number(
      getDb()
        .prepare(
          "SELECT COALESCE(SUM(delta_milli),0) AS balance FROM stock_movements WHERE org_id=? AND product_id=?",
        )
        .get(ORG, productId)?.balance,
    ) / 1000
  );
}
export function productRow(id: string) {
  const product = getDb().prepare("SELECT * FROM products WHERE id=? AND org_id=?").get(id, ORG);
  if (!product) fail("Product not found in this demo organisation.", 404);
  return product;
}
export function policy(id: string): Policy {
  const row = getDb()
    .prepare("SELECT payload FROM policies WHERE product_id=? AND org_id=?")
    .get(id, ORG);
  if (!row) fail("Purchasing policy not found.", 404);
  return JSON.parse(String(row.payload));
}
export function savePolicy(id: string, p: Policy) {
  getDb()
    .prepare(
      "UPDATE policies SET supplier_id=?,version=?,payload=? WHERE product_id=? AND org_id=?",
    )
    .run(p.supplierId, p.version, JSON.stringify(p), id, ORG);
}
export function ordersFor(id: string) {
  return payloads<PurchaseOrder>("purchase_orders").filter((order) => order.productId === id);
}
export function openOrders(id: string) {
  return ordersFor(id).filter(
    (order) => !["CANCELLED", "RECEIVED"].includes(order.status) || order.damageOpen,
  );
}
export function history(id: string): SalesDay[] {
  return getDb()
    .prepare("SELECT * FROM daily_sales WHERE org_id=? AND product_id=? ORDER BY business_date")
    .all(ORG, id)
    .map((day) => ({
      date: String(day.business_date),
      quantity: Number(day.quantity_milli) / 1000,
      complete: day.complete === 1,
      stockout: day.stockout === 1,
      source: String(day.source),
    }));
}
export function weeklySummary(days: SalesDay[]): SalesWeek[] {
  const weeks = new Map<string, SalesDay[]>();
  for (const day of days) {
    const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
    const start = addDays(day.date, -(weekday + 6) % 7);
    weeks.set(start, [...(weeks.get(start) || []), day]);
  }
  return [...weeks].map(([startDate, entries]) => ({
    startDate,
    endDate: addDays(startDate, 6),
    quantity: Math.round(entries.reduce((total, entry) => total + entry.quantity, 0) * 1000) / 1000,
    completeDays: entries.filter((entry) => entry.complete).length,
    complete: entries.length === 7 && entries.every((entry) => entry.complete),
  }));
}
export function state(role: Role): AppState {
  seedDatabase();
  const db = getDb();
  const orders = payloads<PurchaseOrder>("purchase_orders");
  const recommendations = payloads<Recommendation>("recommendations");
  const products: Product[] = db
    .prepare("SELECT * FROM products WHERE org_id=? ORDER BY rowid")
    .all(ORG)
    .map((row) => {
      const id = String(row.id);
      const sales = history(id);
      return {
        id,
        sku: String(row.sku),
        name: String(row.name),
        unit: String(row.unit),
        precision: Number(row.precision),
        stock: stock(id),
        confirmedIncoming: orders
          .filter(
            (order) =>
              order.productId === id &&
              ["SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED"].includes(order.status),
          )
          .reduce((total, order) => total + order.remaining, 0),
        ledgerVersion: Number(row.ledger_version),
        inboundVersion: Number(row.inbound_version),
        ledgerStartDate: String(row.ledger_start),
        policy: policy(id),
        history: sales,
        weeks: weeklySummary(sales),
        recommendation: recommendations.find((rec) => rec.productId === id) || null,
      };
    });
  const movements: Movement[] = db
    .prepare("SELECT * FROM stock_movements WHERE org_id=? ORDER BY rowid DESC LIMIT 500")
    .all(ORG)
    .map((row) => ({
      id: String(row.id),
      productId: String(row.product_id),
      type: row.type as Movement["type"],
      quantity: Number(row.quantity_milli) / 1000,
      date: String(row.business_date),
      reference: String(row.reference),
      reason: String(row.reason),
      actor: row.actor as Movement["actor"],
    }));
  return {
    role,
    organisation: { id: ORG, name: "Cedar Pantry · synthetic SME" },
    demoDate: metadata("demo_date"),
    closedThrough: metadata("closed_through"),
    suppliers: db
      .prepare("SELECT id,name,channel FROM suppliers WHERE org_id=?")
      .all(ORG) as unknown as AppState["suppliers"],
    products,
    movements,
    analyses: payloads<Analysis>("analysis_runs"),
    orders,
    outbox: payloads("outbox_messages"),
    receipts: payloads("receipts"),
    activity: payloads<ActivityEvent>("activity_events").slice(0, 300),
    forecastMode: process.env.FORECAST_MODE === "RUNPOD" ? "RUNPOD" : "MOCK",
  };
}

export function postMovement(input: {
  productId: string;
  eventKey: string;
  type: Movement["type"];
  milli: number;
  date: string;
  reference: string;
  reason: string;
  role: Role | "system";
}) {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM stock_movements WHERE org_id=? AND event_key=?")
    .get(ORG, input.eventKey);
  if (existing) {
    if (
      existing.product_id !== input.productId ||
      existing.type !== input.type ||
      existing.quantity_milli !== input.milli ||
      existing.business_date !== input.date ||
      existing.reference !== input.reference ||
      existing.reason !== input.reason
    )
      fail("This source event was already used with different details.", 409);
    return String(existing.id);
  }
  const delta = ["SALE", "INTERNAL_USE", "DAMAGE_OR_LOSS", "ADJUSTMENT_OUT"].includes(input.type)
    ? -input.milli
    : input.milli;
  if (Math.round(stock(input.productId) * 1000) + delta < 0)
    fail(
      "This outgoing movement would make stock negative. Check the quantity or record missing receipts first.",
    );
  if (
    input.type === "OPENING_BALANCE" &&
    db
      .prepare(
        "SELECT id FROM stock_movements WHERE org_id=? AND product_id=? AND type='OPENING_BALANCE'",
      )
      .get(ORG, input.productId)
  )
    fail("An opening balance already exists for this product.", 409);
  const id = uid();
  db.prepare("INSERT INTO stock_movements VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").run(
    id,
    ORG,
    input.productId,
    input.eventKey,
    input.type,
    input.milli,
    delta,
    input.date,
    input.reference,
    input.reason,
    input.role,
    new Date().toISOString(),
  );
  db.prepare("UPDATE products SET ledger_version=ledger_version+1 WHERE id=? AND org_id=?").run(
    input.productId,
    ORG,
  );
  if (input.type === "SALE") {
    db.prepare(
      "INSERT INTO daily_sales VALUES(?,?,?,?,0,0,?,'ledger',1) ON CONFLICT(org_id,product_id,business_date) DO UPDATE SET quantity_milli=quantity_milli+excluded.quantity_milli, revision=revision+1",
    ).run(ORG, input.productId, input.date, input.milli, `ledger:${input.productId}:${input.date}`);
  }
  audit(
    input.role,
    input.type === "SUPPLIER_RECEIPT" ? "Usable goods added" : "Stock recorded",
    input.productId,
    `${input.type}: ${input.milli / 1000} on ${input.date}. Reference: ${input.reference}`,
    { stock: (stock(input.productId) * 1000 - delta) / 1000 },
    { stock: stock(input.productId), movementId: id },
  );
  return id;
}
