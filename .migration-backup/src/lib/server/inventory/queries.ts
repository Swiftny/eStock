import type { SQLInputValue } from "node:sqlite";
import type { PurchaseOrder, Role } from "../../contracts.ts";
import type {
  InventoryContext,
  InventoryMovement,
  InventoryMovementQuery,
  InventoryMovementsResponse,
  InventoryProduct,
  InventoryProductsResponse,
} from "../../inventory/contracts.ts";
import { getDb, metadata, ORG } from "../db.ts";
import { seedDatabase } from "../seed.ts";
import { payloads, productRow, stock } from "../store.ts";
import { fail, integer, text } from "../validation.ts";

export function inventoryContext(role: Role): InventoryContext {
  return {
    synthetic: true,
    organisationId: ORG,
    role,
    demoDate: metadata("demo_date"),
    closedThrough: metadata("closed_through"),
  };
}

function products(productId?: string): InventoryProduct[] {
  const orders = payloads<PurchaseOrder>("purchase_orders");
  const filter = productId === undefined ? "" : " AND p.id=?";
  const parameters: SQLInputValue[] = productId === undefined ? [ORG] : [ORG, productId];
  return getDb()
    .prepare(
      `SELECT p.*,
        (SELECT MAX(m.created_at) FROM stock_movements m
          WHERE m.org_id=p.org_id AND m.product_id=p.id) AS last_movement_at
        FROM products p WHERE p.org_id=?${filter} ORDER BY p.sku,p.id`,
    )
    .all(...parameters)
    .map((row) => ({
      id: String(row.id),
      sku: String(row.sku),
      name: String(row.name),
      unit: String(row.unit),
      precision: Number(row.precision),
      stock: stock(String(row.id)),
      confirmedIncoming:
        orders
          .filter(
            (order) =>
              order.productId === row.id &&
              ["SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED"].includes(order.status),
          )
          .reduce((total, order) => total + Math.round(order.remaining * 1000), 0) / 1000,
      ledgerVersion: Number(row.ledger_version),
      ledgerStartDate: String(row.ledger_start),
      lastMovementAt: row.last_movement_at === null ? null : String(row.last_movement_at),
    }));
}

export function inventoryProduct(productId: string): InventoryProduct {
  seedDatabase();
  const product = products(productId)[0];
  if (!product) fail("Product not found in this demo organisation.", 404, "NOT_FOUND");
  return product;
}

export function inventoryProducts(role: Role): InventoryProductsResponse {
  seedDatabase();
  return { ...inventoryContext(role), products: products() };
}

function movement(row: Record<string, unknown>): InventoryMovement {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    sourceEventId: String(row.event_key),
    type: row.type as InventoryMovement["type"],
    quantity: Number(row.quantity_milli) / 1000,
    delta: Number(row.delta_milli) / 1000,
    unit: String(row.unit),
    date: String(row.business_date),
    reference: String(row.reference),
    reason: String(row.reason),
    actor: row.actor as InventoryMovement["actor"],
    createdAt: String(row.created_at),
  };
}

const movementSelect = `SELECT m.*,m.rowid AS cursor,p.unit
  FROM stock_movements m JOIN products p ON p.id=m.product_id AND p.org_id=m.org_id`;

export function inventoryMovement(id: string): InventoryMovement {
  const row = getDb().prepare(`${movementSelect} WHERE m.org_id=? AND m.id=?`).get(ORG, id);
  if (!row) fail("Stock movement not found.", 404, "NOT_FOUND");
  return movement(row);
}

export function inventoryMovements(
  role: Role,
  query: InventoryMovementQuery = {},
): InventoryMovementsResponse {
  seedDatabase();
  const limit = integer(query.limit ?? 50, "Page size", 1, 100);
  const conditions = ["m.org_id=?"];
  const parameters: SQLInputValue[] = [ORG];
  if (query.productId !== undefined) {
    const productId = text(query.productId, "Product");
    productRow(productId);
    conditions.push("m.product_id=?");
    parameters.push(productId);
  }
  if (query.cursor !== undefined) {
    if (!/^[1-9]\d*$/.test(query.cursor) || !Number.isSafeInteger(Number(query.cursor)))
      fail("Use the nextCursor returned by the movement history.");
    conditions.push("m.rowid<?");
    parameters.push(Number(query.cursor));
  }
  parameters.push(limit + 1);
  const rows = getDb()
    .prepare(`${movementSelect} WHERE ${conditions.join(" AND ")} ORDER BY m.rowid DESC LIMIT ?`)
    .all(...parameters);
  const page = rows.slice(0, limit);
  return {
    ...inventoryContext(role),
    movements: page.map(movement),
    nextCursor: rows.length > limit ? String(page[page.length - 1].cursor) : null,
  };
}
