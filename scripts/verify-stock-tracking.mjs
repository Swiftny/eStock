import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
assert.ok(existsSync(join(root, ".next/BUILD_ID")), "Run npm run build before this check.");
const directory = mkdtempSync(join(tmpdir(), "estock-stock-http-"));
const database = join(directory, "records.sqlite");
const accessCode = "synthetic-stock-verification-only";
const results = [];
const ports = [];
let sequence = 0;
let server;
let base;
let staff = "";
let manager = "";
let expectedCartons = 45;

function key() {
  return `stock-http-${sequence++}`;
}

function movement(changes = {}) {
  return {
    productId: "product-cartons",
    sourceEventId: key(),
    type: "SALE",
    quantity: 5,
    unit: "units",
    date: "2026-10-21",
    reference: "SYN-HTTP-STOCK-CHECK",
    ...changes,
  };
}

async function startServer() {
  let output = "";
  let failure;
  base = undefined;
  server = spawn(
    process.execPath,
    [join(root, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", "0"],
    {
      cwd: root,
      env: {
        ...process.env,
        ESTOCK_DB_PATH: database,
        ESTOCK_DEMO_ACCESS_CODE: accessCode,
        FORECAST_MODE: "MOCK",
        FORECAST_ALLOW_FALLBACK: "false",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  server.on("error", (error) => { failure = error; });
  for (const stream of [server.stdout, server.stderr]) {
    stream.on("data", (chunk) => {
      output = (output + chunk.toString()).slice(-10_000);
      const address = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (address) base = address[0];
    });
  }
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    if (failure) throw failure;
    if (server.exitCode !== null) throw new Error(`Test server exited early: ${output}`);
    if (base) {
      try {
        const response = await fetch(`${base}/api/products`, { signal: AbortSignal.timeout(1000) });
        if (response.status === 401) {
          ports.push(new URL(base).port);
          return;
        }
      } catch {}
    }
    await delay(100);
  }
  throw new Error(`Test server did not become ready: ${output}`);
}

async function stopServer() {
  const current = server;
  server = undefined;
  if (!current || current.exitCode !== null || current.signalCode !== null) return;
  const exited = once(current, "exit");
  const timeout = setTimeout(() => current.kill("SIGKILL"), 5000);
  current.kill("SIGTERM");
  try {
    await exited;
  } finally {
    clearTimeout(timeout);
  }
}

async function request(path, { cookie = staff, method = "GET", body, headers = {}, requestKey = key() } = {}) {
  const fields = { Origin: base, ...headers };
  if (cookie) fields.Cookie = cookie;
  if (method === "POST") {
    fields["Content-Type"] ??= "application/json";
    if (requestKey !== null) fields["Idempotency-Key"] = requestKey;
  }
  const response = await fetch(base + path, {
    method,
    headers: fields,
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const raw = await response.text();
  const json = raw ? JSON.parse(raw) : null;
  return { status: response.status, headers: response.headers, body: json };
}

async function session(role) {
  const response = await request("/api/session", {
    method: "POST", cookie: "", body: { role, accessCode },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /HttpOnly/i);
  return response.headers.get("set-cookie").split(";")[0];
}

async function check(name, action) {
  try {
    await action();
    results.push({ name, status: "PASS" });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, status: "FAIL" });
    throw error;
  }
}

async function product(id = "product-cartons") {
  const response = await request("/api/products");
  assert.equal(response.status, 200);
  const result = response.body.products.find((entry) => entry.id === id);
  assert.ok(result);
  return result;
}

async function save(input, options = {}) {
  return request("/api/movements", { method: "POST", body: input, ...options });
}

async function cancelled() {
  await stopServer();
  rmSync(directory, { recursive: true, force: true });
  process.exit(130);
}
process.once("SIGINT", cancelled);
process.once("SIGTERM", cancelled);

try {
  await startServer();
  await check("anonymous and forged sessions are rejected", async () => {
    for (const path of ["/api/products", "/api/movements"])
      assert.equal((await request(path, { cookie: "" })).status, 401);
    assert.equal((await request("/api/products", { cookie: "estock-demo-session=manager" })).status, 401);
    assert.equal((await save(movement(), { cookie: "" })).status, 401);
  });

  await check("server-issued staff and manager demo sessions work", async () => {
    staff = await session("staff");
    manager = await session("manager");
    assert.notEqual(staff, manager);
  });

  await check("normal startup has no inventory, history or orders", async () => {
    const response = await request("/api/demo");
    assert.equal(response.status, 200);
    for (const name of ["products", "movements", "orders", "outbox", "analyses", "receipts", "activity"])
      assert.equal(response.body[name].length, 0, name);
  });
  await stopServer();
  const fixture = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", "import { syntheticFixture } from './tests/synthetic-fixture.ts'; syntheticFixture();"], {
    cwd: root,
    env: { ...process.env, ESTOCK_DB_PATH: database, FORECAST_MODE: "MOCK" },
    encoding: "utf8",
  });
  assert.equal(fixture.status, 0, fixture.stderr);
  await startServer();

  await check("products return synthetic stock, units and private no-store responses", async () => {
    const response = await request("/api/products");
    assert.equal(response.status, 200);
    assert.equal(response.body.synthetic, true);
    assert.equal(response.body.role, "staff");
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.deepEqual(response.body.products.map((entry) => entry.stock), [45, 22, 75]);
    assert.ok(response.body.products.every((entry) => !("policy" in entry)));
  });

  let savedInput;
  let savedKey;
  let savedId;
  await check("sale posts once and returns 45 to 40 with signed history", async () => {
    savedInput = movement();
    savedKey = key();
    const response = await save(savedInput, { requestKey: savedKey });
    assert.equal(response.status, 200);
    assert.equal(response.body.product.stock, 40);
    assert.equal(response.body.movement.delta, -5);
    assert.equal(response.body.movement.sourceEventId, savedInput.sourceEventId);
    savedId = response.body.movement.id;
    expectedCartons = 40;
    const history = await request("/api/movements?productId=product-cartons&limit=1");
    assert.equal(history.status, 200);
    assert.equal(history.body.movements[0].id, savedId);
    assert.equal(history.body.movements[0].actor, "staff");
  });

  await check("same-key and same-event retries do not decrement stock again", async () => {
    const sameKey = await save(savedInput, { requestKey: savedKey });
    const sameEvent = await save(savedInput);
    assert.equal(sameKey.status, 200);
    assert.equal(sameEvent.status, 200);
    assert.equal(sameKey.body.movement.id, savedId);
    assert.equal(sameEvent.body.movement.id, savedId);
    assert.equal((await product()).stock, 40);
  });

  await check("conflicting request-key or source-event details return 409", async () => {
    assert.equal((await save({ ...savedInput, quantity: 6 }, { requestKey: savedKey })).status, 409);
    assert.equal((await save({ ...savedInput, quantity: 6 })).status, 409);
    assert.equal((await product()).stock, 40);
  });

  await check("invalid quantities, units and business dates leave stock unchanged", async () => {
    for (const changes of [
      { quantity: -1 }, { quantity: 0 }, { quantity: 1.1 }, { quantity: 41 },
      { quantity: "5" }, { quantity: 1_000_001 }, { unit: "kg" },
      { date: "2026-10-20" }, { date: "2026-10-22" }, { date: "2026-02-30" },
    ]) {
      const response = await save(movement(changes));
      assert.equal(response.status, 422, JSON.stringify(changes));
      assert.equal(typeof response.body.error, "string");
      assert.equal(typeof response.body.code, "string");
    }
    assert.equal((await product()).stock, 40);
  });

  await check("unknown products and other organisations cannot receive movements", async () => {
    assert.equal((await save(movement({ productId: "unknown-product" }))).status, 404);
    assert.equal((await save(movement({ organisationId: "other-organisation" }))).status, 403);
    assert.equal((await product()).stock, 40);
  });

  await check("staff cannot forge manager adjustments", async () => {
    for (const type of ["ADJUSTMENT_IN", "ADJUSTMENT_OUT"])
      assert.equal((await save(movement({ type, reason: "Synthetic adjustment", role: "manager" }))).status, 403);
    assert.equal((await product()).stock, 40);
  });

  await check("manager adjustment adds stock from 40 to 52", async () => {
    const response = await save(movement({
      type: "ADJUSTMENT_IN", quantity: 12, reason: "Synthetic counted-stock correction",
    }), { cookie: manager });
    assert.equal(response.status, 200);
    assert.equal(response.body.product.stock, 52);
    assert.equal(response.body.movement.delta, 12);
    expectedCartons = 52;
  });

  await check("usage, damage, usable returns and manager outgoing adjustments work", async () => {
    for (const [type, quantity, delta, cookie] of [
      ["INTERNAL_USE", 2, -2, staff],
      ["DAMAGE_OR_LOSS", 1, -1, staff],
      ["CUSTOMER_RETURN_USABLE", 3, 3, staff],
      ["ADJUSTMENT_OUT", 2, -2, manager],
    ]) {
      const response = await save(movement({ type, quantity, reason: "Synthetic movement" }), { cookie });
      assert.equal(response.status, 200);
      expectedCartons += delta;
      assert.equal(response.body.product.stock, expectedCartons);
      assert.equal(response.body.movement.delta, delta);
    }
  });

  await check("fractional product quantities remain exact", async () => {
    const response = await save(movement({ productId: "product-coffee", quantity: 0.125, unit: "kg" }));
    assert.equal(response.status, 200);
    assert.equal(response.body.product.stock, 21.875);
  });

  await check("notes and required movement fields are validated", async () => {
    for (const changes of [
      { reason: {} }, { reason: "x".repeat(501) }, { reference: "" }, { sourceEventId: "" },
      { type: "INTERNAL_USE", reason: "" },
    ])
      assert.equal((await save(movement(changes))).status, 422);
    assert.equal((await product()).stock, expectedCartons);
  });

  await check("generic movements reject opening balances and supplier receipts", async () => {
    for (const type of ["OPENING_BALANCE", "SUPPLIER_RECEIPT", "UNKNOWN"])
      assert.equal((await save(movement({ type }), { cookie: manager })).status, 422);
    assert.equal((await product()).stock, expectedCartons);
  });

  await check("movement HTTP pagination filters products without duplicate rows", async () => {
    const ids = [];
    let cursor;
    do {
      const suffix = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
      const response = await request(`/api/movements?productId=product-cartons&limit=2${suffix}`);
      assert.equal(response.status, 200);
      assert.ok(response.body.movements.every((entry) => entry.productId === "product-cartons"));
      ids.push(...response.body.movements.map((entry) => entry.id));
      cursor = response.body.nextCursor;
    } while (cursor);
    const all = await request("/api/movements?productId=product-cartons&limit=100");
    assert.deepEqual(ids, all.body.movements.map((entry) => entry.id));
    assert.equal(new Set(ids).size, ids.length);
  });

  await check("invalid pagination and unknown history filters fail cleanly", async () => {
    for (const query of ["limit=0", "limit=101", "limit=1.5", "limit=no", "cursor=0", "cursor=abc", "productId="])
      assert.equal((await request(`/api/movements?${query}`)).status, 422);
    assert.equal((await request("/api/movements?productId=unknown-product")).status, 404);
  });

  await check("JSON shape, media type, request key and byte limits are enforced", async () => {
    for (const body of ["{broken", "null", "[]", '"text"'])
      assert.equal((await save(body)).status, 400);
    assert.equal((await save(movement(), { headers: { "Content-Type": "text/plain" } })).status, 415);
    assert.equal((await save(movement(), { requestKey: null })).status, 422);
    assert.equal((await save({ ...movement(), reason: "é".repeat(9000) })).status, 413);
  });

  await check("cross-origin and cross-site mutations are rejected", async () => {
    assert.equal((await save(movement(), { headers: { Origin: "https://other.invalid" } })).status, 403);
    assert.equal((await save(movement(), { headers: { "Sec-Fetch-Site": "cross-site" } })).status, 403);
    assert.equal((await product()).stock, expectedCartons);
  });

  await check("legacy demo API reads the same ledger as the new stock API", async () => {
    const response = await request("/api/demo");
    assert.equal(response.status, 200);
    assert.equal(response.body.products.find((entry) => entry.id === "product-cartons").stock, expectedCartons);
  });

  await check("concurrent outgoing requests cannot oversell physical stock", async () => {
    const responses = await Promise.all([save(movement({ quantity: 30 })), save(movement({ quantity: 30 }))]);
    assert.deepEqual(responses.map((entry) => entry.status).sort(), [200, 422]);
    expectedCartons -= 30;
    assert.equal((await product()).stock, expectedCartons);
  });

  const beforeRestart = (await request("/api/movements?limit=100")).body.movements;
  const firstBase = base;
  await check("test server shuts down and releases its HTTP listener", async () => {
    await stopServer();
    await assert.rejects(fetch(`${firstBase}/api/products`, { signal: AbortSignal.timeout(1000) }));
  });

  await startServer();
  await check("new server process preserves stock, history and saved sessions", async () => {
    assert.equal((await product()).stock, expectedCartons);
    assert.equal((await product("product-coffee")).stock, 21.875);
    const response = await request("/api/movements?limit=100");
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.movements, beforeRestart);
  });

  await check("duplicate protection survives the server restart", async () => {
    const response = await save(savedInput, { requestKey: savedKey });
    assert.equal(response.status, 200);
    assert.equal(response.body.movement.id, savedId);
    assert.equal(response.body.product.stock, expectedCartons);
    assert.equal((await request("/api/movements?limit=100")).body.movements.length, beforeRestart.length);
  });

  const finalBase = base;
  await check("final test server stops and releases its HTTP listener", async () => {
    await stopServer();
    await assert.rejects(fetch(`${finalBase}/api/products`, { signal: AbortSignal.timeout(1000) }));
  });

  console.log(JSON.stringify({
    checks: results.length,
    passed: results.filter((entry) => entry.status === "PASS").length,
    failed: results.filter((entry) => entry.status === "FAIL").length,
    node: process.version,
    synthetic: true,
    forecastMode: "MOCK; no real inference requested",
    serverStarts: ports.length,
    finalCartonStock: expectedCartons,
    finalCoffeeStock: 21.875,
  }));
} finally {
  await stopServer();
  rmSync(directory, { recursive: true, force: true });
  process.removeListener("SIGINT", cancelled);
  process.removeListener("SIGTERM", cancelled);
  console.log(`Cleanup: test servers stopped; temporary database removed=${!existsSync(directory)}`);
}
