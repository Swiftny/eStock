import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, mock, test } from "node:test";
import type { Role } from "../src/lib/contracts.ts";
import { closeDb, getDb, ORG } from "../src/lib/server/db.ts";
import { inventoryError, readMovementBody } from "../src/lib/server/inventory/http.ts";
import { recordStockMovement } from "../src/lib/server/inventory/mutations.ts";
import {
  inventoryMovement,
  inventoryMovements,
  inventoryProduct,
  inventoryProducts,
} from "../src/lib/server/inventory/queries.ts";
import { act, executeAction } from "../src/lib/server/service.ts";
import { state } from "../src/lib/server/store.ts";
import { DomainError } from "../src/lib/server/validation.ts";

const originalDatabasePath = process.env.ESTOCK_DB_PATH;
const originalForecastMode = process.env.FORECAST_MODE;
const cartons = "product-cartons";
let directory = "";
let sequence = 0;

function key() {
  return `inventory-check-${sequence++}`;
}

function sale(changes: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    productId: cartons,
    sourceEventId: key(),
    type: "SALE",
    quantity: 5,
    unit: "units",
    date: "2026-10-21",
    reference: "SYN-STOCK-CHECK",
    ...changes,
  };
}

function save(input = sale(), role: Role = "staff", requestKey = key()) {
  return recordStockMovement(role, input, requestKey);
}

function ledger() {
  return getDb()
    .prepare("SELECT * FROM stock_movements WHERE org_id=? ORDER BY rowid")
    .all(ORG);
}

function status(expected: number) {
  return (error: unknown) => error instanceof DomainError && error.status === expected;
}

function request(body?: string, contentType = "application/json") {
  return new Request("http://stock.invalid/api/movements", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });
}

beforeEach(() => {
  closeDb();
  directory = mkdtempSync(join(tmpdir(), "estock-inventory-unit-"));
  process.env.ESTOCK_DB_PATH = join(directory, "records.sqlite");
  process.env.FORECAST_MODE = "MOCK";
  inventoryProducts("staff");
});

afterEach(() => {
  closeDb();
  mock.restoreAll();
  rmSync(directory, { recursive: true, force: true });
  if (originalDatabasePath === undefined) delete process.env.ESTOCK_DB_PATH;
  else process.env.ESTOCK_DB_PATH = originalDatabasePath;
  if (originalForecastMode === undefined) delete process.env.FORECAST_MODE;
  else process.env.FORECAST_MODE = originalForecastMode;
});

test("inventory products expose seeded balances, units and synthetic context without costs", () => {
  const result = inventoryProducts("staff");
  assert.equal(result.synthetic, true);
  assert.equal(result.role, "staff");
  assert.equal(result.organisationId, ORG);
  assert.equal(result.demoDate, "2026-10-21");
  assert.deepEqual(result.products.map((product) => product.stock), [45, 22, 75]);
  assert.deepEqual(result.products.map((product) => product.sku), ["SYN-001", "SYN-002", "SYN-003"]);
  for (const product of result.products) {
    assert.equal(product.confirmedIncoming, 0);
    assert.equal(product.lastMovementAt, "2026-10-20T09:00:00.000Z");
    assert.equal("policy" in product, false);
    assert.equal("unitPriceSen" in product, false);
  }
});

test("inventory reads preserve stock movements and ledger versions", () => {
  const before = ledger();
  const version = inventoryProduct(cartons).ledgerVersion;
  inventoryProducts("manager");
  inventoryMovements("staff");
  inventoryMovement(String(before[0].id));
  assert.deepEqual(ledger(), before);
  assert.equal(inventoryProduct(cartons).ledgerVersion, version);
});

test("sale returns a saved signed movement, current stock and matching daily sales", () => {
  const input = sale();
  const result = save(input);
  assert.equal(result.product.stock, 40);
  assert.equal(result.product.ledgerVersion, 3);
  assert.equal(result.movement.quantity, 5);
  assert.equal(result.movement.delta, -5);
  assert.equal(result.movement.unit, "units");
  assert.equal(result.movement.actor, "staff");
  assert.equal(result.movement.sourceEventId, input.sourceEventId);
  assert.equal(result.movement.reason, "");
  assert.match(result.movement.createdAt, /^\d{4}-\d{2}-\d{2}T.*Z$/);
  assert.equal(state("manager").products[0].history.at(-1)?.quantity, 5);
});

test("fractional stock respects a product's declared base unit and precision", () => {
  const result = save(sale({ productId: "product-coffee", quantity: 0.125, unit: "kg" }));
  assert.equal(result.product.stock, 21.875);
  assert.equal(result.movement.delta, -0.125);
  assert.throws(
    () => save(sale({ productId: "product-coffee", quantity: 0.0001, unit: "kg" })),
    status(422),
  );
  assert.equal(inventoryProduct("product-coffee").stock, 21.875);
});

test("usage, damage and usable returns affect physical stock without adding customer demand", () => {
  const historyBefore = state("manager").products[0].history;
  for (const type of ["INTERNAL_USE", "DAMAGE_OR_LOSS", "CUSTOMER_RETURN_USABLE"])
    save(sale({ type, quantity: 2, reason: "Synthetic movement check" }));
  assert.equal(inventoryProduct(cartons).stock, 43);
  assert.deepEqual(state("manager").products[0].history, historyBefore);
});

test("adjustments require manager permission and retain an explicit reason", () => {
  const input = sale({ type: "ADJUSTMENT_IN", quantity: 12, reason: "Synthetic counted correction" });
  assert.throws(() => save({ ...input, role: "manager" }), status(403));
  assert.equal(inventoryProduct(cartons).stock, 45);
  assert.equal(save(input, "manager").product.stock, 57);
  assert.equal(
    save(sale({ type: "ADJUSTMENT_OUT", quantity: 5, reason: "Synthetic correction" }), "manager")
      .product.stock,
    52,
  );
});

test("invalid quantities fail atomically without changing ledger or sales history", () => {
  const before = ledger();
  for (const quantity of [-1, 0, 1.1, 46, 1_000_001, Number.NaN, Number.POSITIVE_INFINITY, "5"])
    assert.throws(() => save(sale({ quantity })), status(422));
  assert.deepEqual(ledger(), before);
  assert.equal(inventoryProduct(cartons).stock, 45);
  assert.equal(state("manager").products[0].history.length, 169);
});

test("invalid fields, dates, units and forbidden movement types never post stock", () => {
  const before = ledger();
  for (const changes of [
    { reference: "" },
    { sourceEventId: "" },
    { unit: "kg" },
    { date: "2026-10-20" },
    { date: "2026-10-22" },
    { date: "2026-02-30" },
    { type: "OPENING_BALANCE" },
    { type: "SUPPLIER_RECEIPT" },
    { type: "UNKNOWN" },
    { type: "INTERNAL_USE", reason: "" },
  ])
    assert.throws(() => save(sale(changes)), status(422));
  assert.throws(() => save(sale({ productId: "other-product" })), status(404));
  assert.throws(() => save(sale({ organisationId: "other-organisation" })), status(403));
  assert.deepEqual(ledger(), before);
});

test("optional sale notes accept bounded text and reject arbitrary objects or oversized notes", () => {
  for (const reason of [true, 17, null, {}, [], "x".repeat(501)])
    assert.throws(() => save(sale({ reason })), status(422));
  const result = save(sale({ quantity: 1, reason: "x".repeat(500) }));
  assert.equal(result.movement.reason.length, 500);
  assert.equal(result.product.stock, 44);
});

test("request and business-event replays keep one movement and reject changed details", () => {
  const input = sale();
  const requestKey = key();
  const first = save(input, "staff", requestKey);
  const firstLedger = ledger();
  const firstActivity = state("manager").activity;
  assert.equal(save(input, "staff", requestKey).movement.id, first.movement.id);
  const sourceReplay = save(input);
  assert.equal(sourceReplay.movement.id, first.movement.id);
  assert.match(sourceReplay.message, /already saved/);
  assert.equal(sourceReplay.product.ledgerVersion, first.product.ledgerVersion);
  assert.deepEqual(ledger(), firstLedger);
  assert.deepEqual(state("manager").activity, firstActivity);
  assert.throws(() => save({ ...input, quantity: 6 }, "staff", requestKey), status(409));
  assert.throws(() => save({ ...input, quantity: 6 }), status(409));
  assert.equal(inventoryProduct(cartons).stock, 40);
});

test("retry response supplies current stock after a different movement was saved", () => {
  const input = sale();
  const requestKey = key();
  const first = save(input, "staff", requestKey);
  save(sale({ quantity: 2 }));
  const replay = save(input, "staff", requestKey);
  assert.equal(replay.movement.id, first.movement.id);
  assert.equal(replay.product.stock, 38);
});

test("movement cursor pagination returns every row once in newest insertion order", () => {
  save();
  save(sale({ quantity: 1 }));
  const expected = ledger().map((row) => String(row.id)).reverse();
  const actual: string[] = [];
  let cursor: string | undefined;
  do {
    const page = inventoryMovements("staff", { limit: 2, cursor });
    actual.push(...page.movements.map((entry) => entry.id));
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  assert.deepEqual(actual, expected);
  assert.equal(new Set(actual).size, actual.length);
});

test("product-filtered history excludes other products across pages", () => {
  save();
  const first = inventoryMovements("manager", { productId: cartons, limit: 1 });
  assert.equal(first.movements.length, 1);
  assert.equal(first.movements[0].type, "SALE");
  assert.equal(first.movements[0].date, "2026-10-21");
  assert.ok(first.nextCursor);
  const next = inventoryMovements("manager", {
    productId: cartons,
    limit: 2,
    cursor: first.nextCursor,
  });
  assert.equal(next.nextCursor, null);
  assert.ok([...first.movements, ...next.movements].every((entry) => entry.productId === cartons));
});

test("invalid pagination and unknown identifiers return controlled errors", () => {
  for (const limit of [0, 101, 1.5, Number.NaN])
    assert.throws(() => inventoryMovements("staff", { limit }), status(422));
  for (const cursor of ["", "0", "-1", "1.2", "1e3", "abc", "9007199254740993"])
    assert.throws(() => inventoryMovements("staff", { cursor }), status(422));
  assert.throws(() => inventoryMovements("staff", { productId: "" }), status(422));
  assert.throws(() => inventoryMovements("staff", { productId: "missing" }), status(404));
  assert.throws(() => inventoryProduct("missing"), status(404));
  assert.throws(() => inventoryMovement("missing"), status(404));
});

test("a product awaiting an opening import has empty history and zero physical stock", () => {
  const policy = state("manager").products[0].policy;
  const created = executeAction(
    "manager",
    "createProduct",
    {
      ...policy,
      sku: "SYN-EMPTY",
      name: "Synthetic empty product",
      unit: "units",
      precision: 0,
      openingStock: 0,
      createOpening: false,
    },
    key(),
  );
  assert.ok(created.entityId);
  const product = inventoryProduct(created.entityId);
  assert.equal(product.stock, 0);
  assert.equal(product.lastMovementAt, null);
  const page = inventoryMovements("staff", { productId: product.id });
  assert.deepEqual(page.movements, []);
  assert.equal(page.nextCursor, null);
});

test("database reopening preserves balances, movement identity and duplicate protection", () => {
  const input = sale();
  const requestKey = key();
  const saved = save(input, "staff", requestKey);
  closeDb();
  assert.equal(inventoryProduct(cartons).stock, 40);
  assert.equal(inventoryMovement(saved.movement.id).sourceEventId, input.sourceEventId);
  assert.equal(save(input, "staff", requestKey).product.stock, 40);
  assert.equal(inventoryMovements("staff", { productId: cartons }).movements.length, 3);
});

test("confirmed incoming stays separate from stock and only usable receipts add physical stock", async () => {
  await act("manager", "analyse", { productId: cartons }, key());
  const recommendation = state("manager").products[0].recommendation!;
  await act(
    "manager",
    "approve",
    {
      recommendationId: recommendation.id,
      expectedRevision: recommendation.revision,
      quantity: recommendation.calculation!.suggestedQuantity,
      acknowledgeWarnings: true,
    },
    key(),
  );
  const order = state("manager").orders[0];
  assert.equal(inventoryProduct(cartons).stock, 45);
  assert.equal(inventoryProduct(cartons).confirmedIncoming, 0);
  await act("manager", "dispatch", { orderId: order.id }, key());
  await act(
    "manager",
    "confirmOrder",
    { orderId: order.id, expectedDate: order.expectedDate, reference: "SYN-ACK", confirmApprovedTerms: true },
    key(),
  );
  assert.equal(inventoryProduct(cartons).confirmedIncoming, order.quantity);
  await act(
    "staff",
    "receive",
    {
      orderId: order.id,
      unit: "units",
      usable: 8,
      damaged: 2,
      date: "2026-10-21",
      reference: "SYN-RECEIPT",
      sourceEventId: key(),
    },
    key(),
  );
  const product = inventoryProduct(cartons);
  assert.equal(product.stock, 53);
  assert.equal(product.confirmedIncoming, order.quantity - 10);
  assert.equal(inventoryMovements("staff", { productId: cartons }).movements[0].delta, 8);
});

test("JSON body reader accepts JSON objects and a charset content type", async () => {
  const input = sale();
  assert.deepEqual(await readMovementBody(request(JSON.stringify(input), "Application/JSON; charset=utf-8")), input);
});

test("JSON body reader rejects malformed JSON and non-object values", async () => {
  for (const body of ["", "{broken", "null", "[]", '"text"', "12", "true"])
    await assert.rejects(readMovementBody(request(body)), status(400));
});

test("JSON body reader rejects missing bodies and unsupported media types", async () => {
  await assert.rejects(readMovementBody(request()), status(400));
  await assert.rejects(readMovementBody(request("{}", "text/plain")), status(415));
});

test("JSON body reader enforces the byte limit for multi-byte text", async () => {
  const body = JSON.stringify({ reason: "é".repeat(9000) });
  assert.ok(body.length < 16_384);
  assert.ok(new TextEncoder().encode(body).byteLength > 16_384);
  await assert.rejects(readMovementBody(request(body)), status(413));
});

test("inventory errors retain controlled statuses and hide unexpected exception details", async () => {
  mock.method(console, "error", () => {});
  const known = inventoryError(new DomainError("Review this stock event.", 409, "CONFLICT"));
  assert.equal(known.status, 409);
  assert.equal(known.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await known.json(), { error: "Review this stock event.", code: "CONFLICT" });
  const unexpected = inventoryError(new Error("private implementation detail"));
  assert.equal(unexpected.status, 500);
  assert.deepEqual(await unexpected.json(), {
    error: "Could not complete the stock operation. Try again.",
    code: "SERVER_ERROR",
  });
});
