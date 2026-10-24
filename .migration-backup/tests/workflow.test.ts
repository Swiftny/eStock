import assert from "node:assert/strict";
import { advanceFixtureTo, isolatedSyntheticFixture } from "./synthetic-fixture.ts";
import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, test } from "node:test";
import type { Policy, Role } from "../src/lib/contracts.ts";
import { closeDb, getDb, ORG, setMetadata } from "../src/lib/server/db.ts";
import { act } from "../src/lib/server/service.ts";
import { state, stock } from "../src/lib/server/store.ts";
import { createSession, sessionRole, checkOrigin } from "../src/lib/server/session.ts";
import { DomainError } from "../src/lib/server/validation.ts";
const id = "product-cartons";
let seq = 0;
const action = (name: Parameters<typeof act>[1], input: Record<string, unknown>, role: Role = "manager", key = `test-${seq++}`) => act(role, name, input, key);
const sale = (extra = {}) => ({ productId: id, unit: "units", type: "SALE", quantity: 5, date: state("manager").demoDate, reference: "SYN-SALE-TEST", sourceEventId: `sale-${seq++}`, ...extra });
async function analyse() { await action("analyse", { productId: id }); return state("manager").products[0].recommendation!; }
async function approve() { const rec = await analyse(); const result = await action("approve", { recommendationId: rec.id, expectedRevision: rec.revision, quantity: rec.calculation!.suggestedQuantity, acknowledgeWarnings: true }); return result.state.orders[0]; }
let cleanupFixture: () => void;
beforeEach(() => { cleanupFixture = isolatedSyntheticFixture(); });
afterEach(() => cleanupFixture());
test("blank or omitted SKU generates unique persistent demo codes for both roles and retries", async () => {
  const input = { name: "Synthetic demo item", unit: "units", precision: 0, openingStock: 3, openingDate: state("staff").demoDate };
  const manual = await action("createProduct", { ...input, sku: "DEMO-0001" });
  const first = await action("createProduct", { ...input, sku: "" }, "staff", "auto-sku-retry");
  const retry = await action("createProduct", { ...input, sku: "" }, "staff", "auto-sku-retry");
  assert.equal(retry.entityId, first.entityId);
  closeDb();
  const second = await action("createProduct", input);
  const third = await action("createProduct", { ...input, sku: "   " }, "staff");
  const products = state("manager").products;
  for (const [result, sku] of [[manual, "DEMO-0001"], [first, "DEMO-0002"], [second, "DEMO-0003"], [third, "DEMO-0004"]] as const) {
    const product = products.find((item) => item.id === result.entityId)!;
    assert.equal(product.sku, sku);
    assert.equal(product.stock, 3);
    assert.equal(products.filter((item) => item.sku === sku).length, 1);
  }
});
test("manual SKU retains validation, trimming and duplicate protection", async () => {
  const input = { name: "Synthetic manual item", unit: "units", precision: 0, openingStock: 0 };
  const result = await action("createProduct", { ...input, sku: "  SYN-CUSTOM  " });
  assert.equal(result.state.products.find((item) => item.id === result.entityId)?.sku, "SYN-CUSTOM");
  await assert.rejects(action("createProduct", { ...input, sku: "SYN-CUSTOM" }), /already exists/);
  for (const sku of [123, null, "X".repeat(41)]) {
    await assert.rejects(action("createProduct", { ...input, sku }), /SKU must be text/);
  }
});
test("complete synthetic journey: sale, closing, analysis, one approval/outbox, acknowledgement and partial/full receipt", async () => {
  const input = sale(); await action("recordMovement", input, "staff", "same-sale"); await action("recordMovement", input, "staff", "same-sale"); assert.equal(stock(id), 40);
  await assert.rejects(action("analyse", { productId: id }), /Close the day/);
  await action("closeDay", { date: "2026-10-21", confirmComplete: true }, "staff");
  const rec = state("manager").products[0].recommendation!; assert.equal(rec.cutoffDate, "2026-10-21"); assert.equal(rec.status, "PENDING_APPROVAL");
  const inputApproval = { recommendationId: rec.id, expectedRevision: rec.revision, quantity: rec.calculation!.suggestedQuantity, acknowledgeWarnings: true };
  const result = await action("approve", inputApproval, "manager", "same-approval"); await action("approve", inputApproval, "manager", "same-approval"); assert.equal(result.state.orders.length, 1); assert.equal(result.state.outbox.length, 1); assert.equal(stock(id), 40);
  await assert.rejects(action("approve", inputApproval), (e: unknown) => e instanceof DomainError && e.status === 409);
  const order = state("manager").orders[0]; await action("dispatch", { orderId: order.id }); assert.equal(state("manager").orders[0].status, "SENT_SIMULATED"); assert.equal(stock(id), 40);
  await advanceFixtureTo("2026-10-22");
  await assert.rejects(action("receive", { orderId: order.id, unit: "units", usable: 1, damaged: 0, date: "2026-10-22", reference: "receipt", sourceEventId: "early" }), /supplier-confirmed/);
  await action("confirmOrder", { orderId: order.id, expectedDate: order.expectedDate, reference: "SYN-ACK-1", confirmApprovedTerms: true }); assert.equal(stock(id), 40);
  await advanceFixtureTo(order.expectedDate);
  const receipt = { orderId: order.id, unit: "units", usable: 8, damaged: 2, date: state("manager").demoDate, reference: "SYN-RECEIPT-1", sourceEventId: "receipt-1" };
  await action("receive", receipt, "staff", "same-receipt"); await action("receive", receipt, "staff", "same-receipt"); assert.equal(stock(id), 48); assert.equal(state("manager").orders[0].remaining, order.quantity - 10); assert.equal(state("manager").orders[0].damageOpen, true);
  await action("receive", { ...receipt, usable: order.quantity - 10, damaged: 0, sourceEventId: "receipt-2" }, "staff"); assert.equal(state("manager").orders[0].status, "RECEIVED"); assert.equal(stock(id), 40 + order.quantity - 2);
  await action("resolveDamage", { orderId: order.id, reason: "Synthetic supplier credit documented; no replacement stock." }); assert.equal(state("manager").orders[0].damageOpen, false);
  assert.ok(state("manager").activity.some((e) => e.action === "Goods received"));
});
test("negative stock, invalid precision/unit and unknown organisation never write ledger", async () => { const count = state("staff").movements.length; for (const extra of [{ quantity: 1000 }, { quantity: -2 }, { quantity: 1.1 }, { unit: "kg" }, { organisationId: "another" }]) await assert.rejects(action("recordMovement", sale(extra), "staff")); assert.equal(state("staff").movements.length, count); assert.equal(stock(id), 45); });
test("business event and request key reject conflicting repeated payloads", async () => { const input = sale(); await action("recordMovement", input, "staff", "fixed-key"); await action("recordMovement", input, "staff"); assert.equal(stock(id), 40); await assert.rejects(action("recordMovement", { ...input, quantity: 6 }, "staff", "fixed-key"), /different input/); await assert.rejects(action("recordMovement", { ...input, quantity: 6 }, "staff"), /different details/); });
test("staff cannot approve, reject, configure, dispatch or forge a manager role", async () => { const rec = await analyse(); for (const operation of ["approve", "reject", "updatePolicy", "dispatch", "confirmOrder", "cancelOrder", "commitImport"] as const) await assert.rejects(action(operation, { recommendationId: rec.id, role: "manager" }, "staff"), (e: unknown) => e instanceof DomainError && e.status === 403); assert.equal(state("manager").orders.length, 0); });
test("stale ledger, stale policy and expired date reject approval", async () => {
  const rec = await analyse(); await action("recordMovement", sale(), "staff"); await assert.rejects(action("approve", { recommendationId: rec.id, expectedRevision: rec.revision, quantity: 84, acknowledgeWarnings: true }), /changed or expired/);
  await action("closeDay", { date: "2026-10-21", confirmComplete: true }); const current = state("manager").products[0].recommendation!;
  const p = state("manager").products[0].policy; await action("updatePolicy", { ...p, productId: id, expectedVersion: p.version, safetyStock: 30 }); await assert.rejects(action("approve", { recommendationId: current.id, expectedRevision: current.revision, quantity: 84, acknowledgeWarnings: true }), /changed or expired/);
  const fresh = await analyse(); setMetadata("demo_date", "2026-10-23"); await assert.rejects(action("approve", { recommendationId: fresh.id, expectedRevision: fresh.revision, quantity: fresh.calculation!.suggestedQuantity, acknowledgeWarnings: true }), /expired/);
});
test("pending commitment survives next-day analysis and prevents duplicate order", async () => { await approve(); await action("closeDay", { date: "2026-10-21", confirmComplete: true }); const rec = state("manager").products[0].recommendation!; assert.equal(rec.status, "WAITING_EXISTING_ORDER"); assert.equal(rec.calculation!.eligibleInbound, 0); assert.equal(state("manager").orders.length, 1); });
test("simulated dispatch failure retries same message; next-day dispatch is held", async () => { const order = await approve(); await action("dispatch", { orderId: order.id, simulateFailure: true }); assert.equal(state("manager").outbox[0].status, "FAILED"); await action("dispatch", { orderId: order.id }); assert.equal(state("manager").outbox[0].attempts, 2); assert.equal(state("manager").orders.length, 1); await assert.rejects(action("dispatch", { orderId: order.id }), /already been dispatched/); });
test("approved dispatch date cannot silently slide to the next day", async () => { const order = await approve(); setMetadata("demo_date", "2026-10-22"); await action("dispatch", { orderId: order.id }); assert.equal(state("manager").orders[0].status, "NEEDS_REVIEW"); assert.equal(state("manager").outbox[0].status, "HELD"); });
test("complete short history uses a labelled estimate; incomplete history blocks quantity", async () => { await action("analyse", { productId: "product-lids" }); assert.equal(state("manager").products[2].recommendation?.source, "DEMO_ESTIMATE"); assert.ok(state("manager").products[2].recommendation?.warnings.some((w) => /not AI inference/.test(w))); assert.ok(state("manager").products[2].recommendation?.calculation); getDb().prepare("UPDATE daily_sales SET complete=0 WHERE product_id=? AND business_date='2026-10-19'").run(id); const rec = await analyse(); assert.equal(rec.status, "NEEDS_DATA"); assert.equal(rec.calculation, null); });
test("history imports preview every row, remain separate from stock and deduplicate", async () => {
  const csv = "source_record_id,sku,business_date,quantity_sold,data_complete,stockout_flag\nnew-1,SYN-003,2026-09-30,0,true,false\nnew-2,SYN-003,2026-10-01,4,true,false";
  const preview = await action("previewImport", { type: "history", csv }); assert.equal(preview.preview?.valid, true); const before = stock("product-lids"); await action("commitImport", { type: "history", csv }); const again = await action("commitImport", { type: "history", csv }); assert.equal(again.preview?.duplicates, 2); assert.equal(stock("product-lids"), before);
  const invalid = csv + "\nbad,SYN-001,2026-10-20,10,true,false\nfuture,SYN-003,2026-12-01,2,true,false\nunknown,NOT-A-SKU,2026-10-01,2,true,false"; const checked = await action("previewImport", { type: "history", csv: invalid }); assert.equal(checked.preview?.errors.length, 3); const count = state("manager").products[2].history.length; await assert.rejects(action("commitImport", { type: "history", csv: invalid }), /Import blocked/); assert.equal(state("manager").products[2].history.length, count);
});
test("opening balances cannot be duplicated; fractional products preserve precision", async () => { const p: Policy = state("manager").products[1].policy; const created = await action("createProduct", { ...p, name: "Synthetic flour", sku: "SYN-NEW", unit: "kg", precision: 3, openingStock: 10.125 }); const product = created.state.products.find((p) => p.id === created.entityId)!; assert.equal(product.stock, 10.125); await action("recordMovement", sale({ productId: product.id, unit: "kg", quantity: 0.125 })); assert.equal(stock(product.id), 10); const csv = `source_event_id,sku,occurred_at,movement_type,quantity,reference,reason\ndup,SYN-NEW,2026-10-21,OPENING_BALANCE,10.125,another,duplicate`; const preview = await action("previewImport", { type: "opening", csv }); assert.equal(preview.preview?.valid, false); await assert.rejects(action("commitImport", { type: "opening", csv }), /opening balance already exists/); });
test("manager quantity edits require reason, pack/MOQ, budget and known costs", async () => { const rec = await analyse(); const base = { recommendationId: rec.id, expectedRevision: rec.revision, acknowledgeWarnings: true }; await assert.rejects(action("approve", { ...base, quantity: 85, reason: "more" }), /packs/); await assert.rejects(action("approve", { ...base, quantity: 96 }), /Reason/); await action("approve", { ...base, quantity: 96, reason: "Synthetic planned demand exception" }); assert.equal(state("manager").orders[0].quantity, 96); });
test("rejection preserves reason and advances routine calendar once", async () => { const rec = await analyse(); const input = { recommendationId: rec.id, expectedRevision: rec.revision, reason: "Synthetic supplier timing review" }; await action("reject", input, "manager", "reject-same"); const next = state("manager").products[0].policy.nextReviewDate; await action("reject", input, "manager", "reject-same"); assert.equal(state("manager").products[0].policy.nextReviewDate, next); assert.equal(next, "2026-10-28"); assert.equal(state("manager").orders.length, 0); });
test("receipt overage and wrong unit roll back atomically", async () => { const order = await approve(); await action("dispatch", { orderId: order.id }); await action("confirmOrder", { orderId: order.id, expectedDate: "2026-10-24", reference: "ACK", confirmApprovedTerms: true }); const receipt = { orderId: order.id, usable: order.quantity, damaged: 1, unit: "units", date: "2026-10-21", sourceEventId: "too-many", reference: "receipt" }; await assert.rejects(action("receive", receipt, "staff"), /cannot exceed/); await assert.rejects(action("receive", { ...receipt, usable: 1, damaged: 0, unit: "kg" }, "staff"), /unit/); assert.equal(stock(id), 45); assert.equal(state("manager").receipts.length, 0); });
test("database survives close/reopen and a fresh Node process", async () => { await action("recordMovement", sale(), "staff"); const path = process.env.ESTOCK_DB_PATH; closeDb(); assert.equal(stock(id), 40); const child = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", "import {state} from './src/lib/server/store.ts'; console.log(state('staff').products[0].stock);"], { cwd: process.cwd(), env: { ...process.env, ESTOCK_DB_PATH: path }, encoding: "utf8" }); assert.equal(child.status, 0, child.stderr); assert.equal(child.stdout.trim(), "40"); });
test("opaque server sessions reject role strings and cross-site mutation", () => { const token = createSession("staff"); assert.equal(sessionRole(token), "staff"); assert.throws(() => sessionRole("manager"), /expired/); assert.throws(() => checkOrigin(new Request("http://localhost:3000/api/demo", { headers: { origin: "https://example.com" } })), /Cross-origin/); assert.equal(getDb().prepare("SELECT COUNT(*) AS n FROM demo_sessions WHERE org_id=?").get(ORG)?.n, 1); });
test("unpriced simulated requests require warning acknowledgement; known costs enforce approval limits", async () => {
  const p = state("manager").products[0].policy;
  await action("updatePolicy", { ...p, productId: id, expectedVersion: p.version, shippingSen: null });
  let rec = await analyse();
  await assert.rejects(action("approve", { recommendationId: rec.id, expectedRevision: rec.revision, quantity: 84 }), /Acknowledge/);
  const unpriced = await action("approve", { recommendationId: rec.id, expectedRevision: rec.revision, quantity: 84, acknowledgeWarnings: true });
  assert.equal(unpriced.state.orders[0].estimatedCostSen, null);
  assert.ok(rec.warnings.some((w) => /approval limit cannot be checked/.test(w)));
  await action("cancelOrder", { orderId: unpriced.state.orders[0].id, reason: "Synthetic budget validation follows" });
  const updated = state("manager").products[0].policy;
  await action("updatePolicy", { ...updated, productId: id, expectedVersion: updated.version, shippingSen: 0, maxOrderSen: 100 });
  rec = await analyse();
  await assert.rejects(action("approve", { recommendationId: rec.id, expectedRevision: rec.revision, quantity: 84, acknowledgeWarnings: true }), /approval limit/);
  assert.equal(state("manager").orders.length, 1);
  assert.equal(state("manager").orders[0].status, "CANCELLED");
});
test("changed supplier ETA holds receiving for review and risk reanalysis", async () => {
  const order = await approve(); await action("dispatch", { orderId: order.id });
  await action("confirmOrder", { orderId: order.id, expectedDate: "2026-11-01", reference: "LATE-ACK", confirmApprovedTerms: true });
  assert.equal(state("manager").orders[0].status, "NEEDS_REVIEW");
  await assert.rejects(action("receive", { orderId: order.id, unit: "units", usable: 1, damaged: 0, date: "2026-10-21", reference: "receipt", sourceEventId: "held" }), /supplier-confirmed/);
  const rec = await analyse(); assert.equal(rec.status, "WAITING_EXISTING_ORDER"); assert.equal(rec.calculation?.eligibleInbound, 0);
});
test("historical corrections retain source/date, increment revision, preserve stock and audit", async () => {
  const header = "source_record_id,sku,business_date,quantity_sold,data_complete,stockout_flag\n";
  const initial = header + "correct-1,SYN-003,2026-10-01,4,false,false";
  const corrected = header + "correct-1,SYN-003,2026-10-01,5,true,false";
  await action("commitImport", { type: "history", csv: initial });
  await assert.rejects(action("commitImport", { type: "history", csv: corrected }), /reviewed correction/);
  const result = await action("commitImport", { type: "history", csv: corrected, allowCorrections: true, correctionReason: "Reviewed synthetic end-of-day source" });
  assert.equal(result.preview?.corrections, 1); assert.equal(stock("product-lids"), 75);
  assert.equal(getDb().prepare("SELECT revision FROM daily_sales WHERE org_id=? AND source_id=?").get(ORG, "csv:correct-1")?.revision, 2);
  assert.ok(result.state.activity.some((e) => e.action === "Historical sales corrected"));
  const blank = await action("previewImport", { type: "history", csv: header + "blank,SYN-003,2026-09-30,,true,false" }); assert.equal(blank.preview?.valid, false);
});
test("receipt business event replay after a completed order returns the existing result", async () => {
  const order = await approve(); await action("dispatch", { orderId: order.id }); await action("confirmOrder", { orderId: order.id, expectedDate: order.expectedDate, reference: "ACK", confirmApprovedTerms: true });
  await advanceFixtureTo(order.expectedDate);
  const receipt = { orderId: order.id, usable: order.quantity, damaged: 0, unit: "units", date: state("manager").demoDate, reference: "FULL", sourceEventId: "full-replay" };
  await action("receive", receipt); const before = stock(id); const replay = await action("receive", receipt); assert.equal(stock(id), before); assert.match(replay.message, /already saved/); assert.equal(replay.state.receipts.length, 1);
});
test("eight usable plus two damaged closes a ten-unit order while retaining the exception", async () => {
  const p = state("manager").products[0].policy;
  await action("updatePolicy", { ...p, productId: id, expectedVersion: p.version, packSize: 1, minimumOrder: 1 });
  const rec = await analyse();
  const approval = { recommendationId: rec.id, expectedRevision: rec.revision, quantity: 10, reason: "Synthetic small-order damage fixture" };
  await assert.rejects(action("approve", approval), /Acknowledge/);
  const approved = await action("approve", { ...approval, acknowledgeWarnings: true }); const order = approved.state.orders[0];
  assert.equal(stock(id), 45); assert.equal(order.quantity, 10);
  await action("dispatch", { orderId: order.id });
  await action("confirmOrder", { orderId: order.id, expectedDate: order.expectedDate, reference: "DAMAGE-ACK", confirmApprovedTerms: true });
  await advanceFixtureTo(order.expectedDate);
  const result = await action("receive", { orderId: order.id, unit: "units", usable: 8, damaged: 2, date: state("manager").demoDate, sourceEventId: "8-plus-2", reference: "Synthetic damage evidence" }, "staff");
  assert.equal(stock(id), 53); assert.equal(result.state.orders[0].remaining, 0); assert.equal(result.state.orders[0].status, "RECEIVED"); assert.equal(result.state.orders[0].damageOpen, true);
});

test("employees create basic inventory once, without supplier terms or purchasing authority", async () => {
  const input = { sku: "SYN-STAFF", name: "Synthetic flour", unit: "kg", precision: 3, openingStock: 10.125, openingDate: "2026-10-21" };
  const first = await action("createProduct", input, "staff", "staff-onboarding");
  const product = first.state.products.find((p) => p.id === first.entityId)!;
  assert.equal(product.stock, 10.125);
  assert.equal(product.purchasingSetupRequired, true);
  assert.equal(getDb().prepare("SELECT product_id FROM policies WHERE product_id=?").get(product.id), undefined);
  assert.equal(product.ledgerStartDate, input.openingDate);
  await action("createProduct", input, "staff", "staff-onboarding");
  await assert.rejects(action("createProduct", input, "staff"), /SKU already exists/);
  assert.equal(state("staff").movements.filter((m) => m.productId === product.id).length, 1);
  assert.ok(first.state.activity.some((event) => event.action === "Product created" && event.actor === "staff"));
  await action("closeDay", { date: "2026-10-21", confirmComplete: true }, "staff");
  const pending = state("manager").products.find((p) => p.id === product.id)!;
  assert.equal(pending.recommendation?.calculation, null);
  assert.match(pending.recommendation!.reason, /Purchasing setup required/);
  assert.equal(state("manager").analyses.find((a) => a.productId === product.id)?.source, null);
  const policy = state("manager").products[1].policy;
  await assert.rejects(action("updatePolicy", { ...policy, productId: product.id, expectedVersion: 0 }, "staff"), (e: unknown) => e instanceof DomainError && e.status === 403);
  await action("updatePolicy", { ...policy, productId: product.id, expectedVersion: 0 });
  assert.equal(state("manager").products.find((p) => p.id === product.id)?.purchasingSetupRequired, false);
});

test("employee onboarding rejects policy injection, invalid units/quantities and closed/future dates atomically", async () => {
  const input = { sku: "SYN-STAFF", name: "Synthetic flour", unit: "kg", precision: 3, openingStock: 2.5, openingDate: "2026-10-21" };
  for (const field of ["supplierId", "leadTimeDays", "reviewIntervalDays", "safetyStock", "packSize", "minimumOrder", "unitPriceSen", "shippingSen", "maxOrderSen", "nextReviewDate", "policy", "role", "createOpening"]) {
    await assert.rejects(action("createProduct", { ...input, [field]: 1 }, "staff"), (e: unknown) => e instanceof DomainError && e.status === 403);
  }
  for (const changes of [{ unit: "" }, { precision: 4 }, { openingStock: -1 }, { openingStock: 0.0001 }, { unit: "units", precision: 3 }, { openingDate: "2026-10-20" }, { openingDate: "2026-10-22" }, { openingDate: "2026-02-30" }])
    await assert.rejects(action("createProduct", { ...input, ...changes }, "staff"));
  assert.equal(state("manager").products.length, 3);
  assert.equal(state("manager").movements.length, 6);
});

test("employee fractional partial/full receiving and damage are atomic and replay safe", async () => {
  const coffee = state("manager").products[1];
  await action("updatePolicy", { ...coffee.policy, productId: coffee.id, expectedVersion: coffee.policy.version, safetyStock: 30 });
  await action("analyse", { productId: coffee.id });
  const rec = state("manager").products[1].recommendation!;
  const approved = await action("approve", { recommendationId: rec.id, expectedRevision: rec.revision, quantity: 5, reason: "Synthetic fractional receipt fixture", acknowledgeWarnings: true });
  const order = approved.state.orders[0];
  await action("dispatch", { orderId: order.id });
  await action("confirmOrder", { orderId: order.id, expectedDate: order.expectedDate, reference: "SYN-KG-ACK", confirmApprovedTerms: true });
  await advanceFixtureTo(order.expectedDate);
  const receipt = { orderId: order.id, unit: "kg", usable: 2.5, damaged: 0.125, date: state("staff").demoDate, reference: "SYN-KG-RECEIPT", sourceEventId: "fractional-partial" };
  for (const changes of [{ usable: 0.0001 }, { damaged: 0.0001 }, { usable: -1 }, { usable: 0, damaged: 0 }, { usable: 5, damaged: 0.001 }, { unit: "units" }, { organisationId: "another" }, { orderId: "another-order" }])
    await assert.rejects(action("receive", { ...receipt, ...changes }, "staff"));
  assert.equal(stock(coffee.id), 22);
  assert.equal(state("manager").receipts.length, 0);
  const result = await action("receive", receipt, "staff", "kg-request");
  assert.equal(stock(coffee.id), 24.5);
  assert.equal(result.state.orders[0].remaining, 2.375);
  assert.equal(result.state.orders[0].damageOpen, true);
  await action("receive", receipt, "staff", "kg-request");
  await action("receive", receipt, "staff");
  await assert.rejects(action("receive", { ...receipt, usable: 2 }, "staff"), /different/);
  assert.equal(stock(coffee.id), 24.5);
  await action("receive", { ...receipt, usable: 2.375, damaged: 0, sourceEventId: "fractional-full" }, "staff");
  assert.equal(stock(coffee.id), 26.875);
  assert.equal(state("manager").orders[0].remaining, 0);
  assert.equal(state("manager").orders[0].status, "RECEIVED");
  assert.equal(state("manager").orders[0].damageOpen, true);
  assert.equal(state("manager").orders.length, 1);
});

test("history preview rejects units, precision and overlaps; staff cannot import or correct", async () => {
  const header = "source_record_id,sku,business_date,quantity_sold,data_complete,stockout_flag,unit\n";
  const csv = header + "bad-unit,SYN-002,2026-10-19,1,true,false,units\nbad-precision,SYN-002,2026-10-19,0.0001,true,false,kg\noverlap,SYN-002,2026-10-20,1,true,false,kg";
  const result = await action("previewImport", { type: "history", csv });
  assert.deepEqual(result.preview?.errors.map((e) => e.row), [2, 3, 4]);
  for (const name of ["previewImport", "commitImport"] as const)
    await assert.rejects(action(name, { type: "history", csv, allowCorrections: true, correctionReason: "forged" }, "staff"), (e: unknown) => e instanceof DomainError && e.status === 403);
  assert.equal(stock("product-coffee"), 22);
});
