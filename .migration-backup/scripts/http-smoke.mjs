import assert from "node:assert/strict";
const base = process.env.ESTOCK_TEST_URL || "http://localhost:3000";
for (const path of ["/", "/demo", "/fixtures/history-example.csv", "/licenses/manrope-OFL.txt"]) assert.equal((await fetch(base + path)).status, 200, path);
assert.equal((await fetch(`${base}/api/demo`)).status, 401);
async function session(role) {
  const response = await fetch(`${base}/api/session`, { method: "POST", headers: { "Content-Type": "application/json", Origin: base }, body: JSON.stringify({ role, accessCode: process.env.ESTOCK_DEMO_ACCESS_CODE || "" }) });
  assert.equal(response.status, 200);
  return response.headers.get("set-cookie").split(";")[0];
}
const staff = await session("staff");
const manager = await session("manager");
const response = await fetch(`${base}/api/demo`, { headers: { Cookie: manager } }); assert.equal(response.status, 200);
const state = await response.json();
assert.equal(state.role, "manager"); assert.ok(state.products.length >= 3);
const forbidden = await fetch(`${base}/api/demo`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: staff, Origin: base }, body: JSON.stringify({ action: "approve", key: crypto.randomUUID(), input: { role: "manager", recommendationId: "synthetic-forbidden" } }) }); assert.equal(forbidden.status, 403);
const wrongOrg = await fetch(`${base}/api/demo`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: staff, Origin: base }, body: JSON.stringify({ action: "analyse", key: crypto.randomUUID(), input: { organisationId: "other", productId: state.products[0].id } }) }); assert.equal(wrongOrg.status, 403);
console.log(JSON.stringify({ routes: "4 HTTP 200", anonymous: 401, staffApproval: 403, otherOrganisation: 403, products: state.products.length, stock: state.products[0].stock, orders: state.orders.length, outbox: state.outbox.length, receipts: state.receipts.length, demoDate: state.demoDate }));
