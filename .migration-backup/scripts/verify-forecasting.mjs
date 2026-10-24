import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
assert.ok(existsSync(join(root, ".next/BUILD_ID")), "Run npm run build before this check.");
const directory = mkdtempSync(join(tmpdir(), "estock-forecast-http-"));
const database = join(directory, "records.sqlite");
const accessCode = "synthetic-forecast-verification-only";
const results = [];
const ports = [];
const cartons = "product-cartons";
const path = "/api/analysis-runs";
let sequence = 0;
let server;
let base;
let staff = "";
let manager = "";

function key() {
  return `forecast-http-${sequence++}`;
}

async function startServer(mode = "MOCK") {
  let output = "";
  let failure;
  base = undefined;
  server = spawn(
    process.execPath,
    [
      join(root, "node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "0",
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        ESTOCK_DB_PATH: database,
        ESTOCK_DEMO_ACCESS_CODE: accessCode,
        FORECAST_MODE: mode,
        FORECAST_ALLOW_FALLBACK: "false",
        RUNPOD_ENDPOINT_ID: "",
        RUNPOD_API_KEY: "",
        CHRONOS_MODEL_REVISION: "",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  server.on("error", (error) => {
    failure = error;
  });
  for (const stream of [server.stdout, server.stderr])
    stream.on("data", (chunk) => {
      output = (output + chunk.toString()).slice(-10_000);
      const address = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (address) base = address[0];
    });
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    if (failure) throw failure;
    if (server.exitCode !== null) throw new Error(`Test server exited early: ${output}`);
    if (base) {
      try {
        const response = await fetch(base + path, { signal: AbortSignal.timeout(1000) });
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

async function request(
  url,
  { cookie = staff, method = "GET", body, headers = {}, requestKey = key() } = {},
) {
  const fields = { Origin: base, ...headers };
  if (cookie) fields.Cookie = cookie;
  if (method === "POST") {
    fields["Content-Type"] ??= "application/json";
    if (requestKey !== null) fields["Idempotency-Key"] = requestKey;
  }
  const response = await fetch(base + url, {
    method,
    headers: fields,
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const raw = await response.text();
  return { status: response.status, headers: response.headers, body: raw ? JSON.parse(raw) : null };
}

async function session(role) {
  const response = await request("/api/session", {
    method: "POST",
    cookie: "",
    body: { role, accessCode },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /HttpOnly/i);
  return response.headers.get("set-cookie").split(";")[0];
}

async function start(productId = cartons, options = {}) {
  return request(path, { method: "POST", cookie: manager, body: { productId }, ...options });
}

async function poll(id, options = {}) {
  return request(`${path}/${id}/poll`, { method: "POST", cookie: manager, body: {}, ...options });
}

async function check(name, action) {
  await action();
  results.push(name);
  console.log(`PASS ${name}`);
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
  await check("anonymous and forged sessions cannot read or request forecasts", async () => {
    for (const url of [path, `${path}/unknown`])
      assert.equal((await request(url, { cookie: "" })).status, 401);
    assert.equal((await request(path, { cookie: "estock-demo-session=manager" })).status, 401);
    assert.equal((await start(cartons, { cookie: "" })).status, 401);
    assert.equal((await poll("unknown", { cookie: "" })).status, 401);
  });
  await check("server-issued sessions and empty synthetic forecast list work", async () => {
    staff = await session("staff");
    manager = await session("manager");
    const response = await request(path);
    assert.equal(response.status, 200);
    assert.equal(response.body.synthetic, true);
    assert.equal(response.body.role, "staff");
    assert.deepEqual(response.body.results, []);
  });
  await check("staff cannot start or poll by forging body role", async () => {
    assert.equal(
      (await start(cartons, { cookie: staff, body: { productId: cartons, role: "manager" } }))
        .status,
      403,
    );
    assert.equal((await poll("unknown", { cookie: staff })).status, 403);
  });

  let saved;
  const savedKey = key();
  await check(
    "manager forecast returns labelled baseline and 4.5 days of stock coverage",
    async () => {
      const response = await start(cartons, { requestKey: savedKey });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      saved = response.body.result;
      assert.equal(saved.analysis.status, "COMPLETED");
      assert.equal(saved.analysis.source, "MOCK_BASELINE");
      assert.equal(saved.input.observations, 168);
      assert.equal(saved.coverage.daysRemaining, 4.5);
      assert.equal(saved.coverage.startingStock, 45);
      assert.equal(saved.coverage.safetyDate, "2026-10-23");
      assert.equal(saved.analysis.forecast.dates[0], "2026-10-21");
      assert.ok(
        saved.analysis.forecast.warnings.some((warning) => /No AI inference/.test(warning)),
      );
      assert.equal(saved.stale, false);
    },
  );
  await check("same-key and unchanged-input requests reuse one saved analysis", async () => {
    for (const options of [{ requestKey: savedKey }, {}]) {
      const response = await start(cartons, options);
      assert.equal(response.status, 200);
      assert.deepEqual(response.body.result, saved);
    }
    assert.equal((await request(path)).body.results.length, 1);
    assert.equal((await start("product-coffee", { requestKey: savedKey })).status, 409);
  });
  await check(
    "staff reads saved results with private headers and no purchasing costs",
    async () => {
      const response = await request(`${path}/${saved.analysis.id}`);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.deepEqual(response.body.result, saved);
      assert.equal("policy" in response.body.result, false);
      assert.equal("unitPriceSen" in response.body.result, false);
      assert.equal("coverage" in response.body.result.analysis, false);
    },
  );
  await check("unknown IDs, products and other organisations fail cleanly", async () => {
    assert.equal((await request(`${path}/missing`)).status, 404);
    assert.equal((await poll("missing")).status, 404);
    assert.equal((await start("missing")).status, 404);
    assert.equal((await start("")).status, 422);
    assert.equal(
      (await start(cartons, { body: { productId: cartons, organisationId: "other" } })).status,
      403,
    );
  });
  await check("JSON shape, byte limit, media type and request key are enforced", async () => {
    for (const body of ["{broken", "null", "[]", '"text"'])
      assert.equal((await start(cartons, { body })).status, 400);
    assert.equal((await start(cartons, { body: undefined })).status, 400);
    assert.equal((await start(cartons, { requestKey: null })).status, 422);
    assert.equal((await start(cartons, { requestKey: "x".repeat(161) })).status, 422);
    assert.equal((await start(cartons, { headers: { "Content-Type": "text/plain" } })).status, 415);
    assert.equal(
      (await start(cartons, { body: { productId: cartons, extra: "é".repeat(9000) } })).status,
      413,
    );
    assert.equal((await poll(saved.analysis.id, { body: "null" })).status, 400);
  });
  await check("cross-origin and cross-site forecast mutations are rejected", async () => {
    assert.equal(
      (await start(cartons, { headers: { Origin: "https://other.invalid" } })).status,
      403,
    );
    assert.equal(
      (await poll(saved.analysis.id, { headers: { "Sec-Fetch-Site": "cross-site" } })).status,
      403,
    );
  });
  await check("insufficient-history SKU has NEEDS_DATA and no invented coverage", async () => {
    const response = await start("product-lids");
    assert.equal(response.status, 200);
    assert.equal(response.body.result.analysis.status, "NEEDS_DATA");
    assert.equal(response.body.result.analysis.forecast, null);
    assert.equal(response.body.result.coverage, null);
  });
  await check(
    "fractional product uses the same API and retains its daily demand pattern",
    async () => {
      const response = await start("product-coffee");
      assert.equal(response.status, 200);
      assert.equal(response.body.result.product.unit, "kg");
      assert.equal(response.body.result.analysis.forecast.p50.length, 30);
      assert.ok(new Set(response.body.result.analysis.forecast.p50).size > 1);
      assert.equal(response.body.result.coverage.startingStock, 22);
    },
  );
  await check("list filters, limits and invalid pagination values work", async () => {
    const filtered = await request(`${path}?productId=${cartons}&limit=1`);
    assert.equal(filtered.status, 200);
    assert.equal(filtered.body.results.length, 1);
    assert.equal(filtered.body.results[0].analysis.id, saved.analysis.id);
    for (const query of ["limit=0", "limit=101", "limit=1.5", "limit=no", "productId="])
      assert.equal((await request(`${path}?${query}`)).status, 422);
    assert.equal((await request(`${path}?productId=missing`)).status, 404);
  });
  await check(
    "completed polling and concurrent requests do not create duplicate results",
    async () => {
      assert.deepEqual((await poll(saved.analysis.id)).body.result, saved);
      const responses = await Promise.all([start(), start()]);
      for (const response of responses)
        assert.equal(response.body.result.analysis.id, saved.analysis.id);
      assert.equal((await request(path)).body.results.length, 3);
    },
  );
  await check(
    "a stock sale makes the original coverage stale and closing is required",
    async () => {
      const sale = await request("/api/movements", {
        method: "POST",
        body: {
          productId: cartons,
          sourceEventId: key(),
          type: "SALE",
          quantity: 1,
          unit: "units",
          date: "2026-10-21",
          reference: "SYN-FORECAST-HTTP",
        },
      });
      assert.equal(sale.status, 200);
      assert.equal(sale.body.product.stock, 44);
      const response = await request(`${path}/${saved.analysis.id}`);
      assert.equal(response.body.result.stale, true);
      assert.equal(response.body.result.coverage, null);
      assert.equal((await start()).status, 409);
    },
  );

  let fresh;
  await check(
    "legacy day closing triggers new cutoff-aligned analyses through the shared service",
    async () => {
      const response = await request("/api/demo", {
        method: "POST",
        body: {
          action: "closeDay",
          key: key(),
          input: { date: "2026-10-21", confirmComplete: true },
        },
      });
      assert.equal(response.status, 200);
      const list = await request(`${path}?productId=${cartons}&limit=1`);
      fresh = list.body.results[0];
      assert.notEqual(fresh.analysis.id, saved.analysis.id);
      assert.equal(fresh.analysis.cutoffDate, "2026-10-21");
      assert.equal(fresh.analysis.decisionDate, "2026-10-22");
      assert.equal(fresh.analysis.forecast.dates[0], "2026-10-22");
      assert.equal(fresh.coverage.startingStock, 44);
      assert.equal(fresh.stale, false);
    },
  );
  await check("legacy analysis callers read the same saved run as the new endpoints", async () => {
    const response = await request("/api/demo", {
      method: "POST",
      cookie: manager,
      body: { action: "analyse", key: key(), input: { productId: cartons } },
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.entityId, fresh.analysis.id);
    const analysis = response.body.state.analyses.find((entry) => entry.id === fresh.analysis.id);
    assert.deepEqual(analysis, fresh.analysis);
  });

  const beforeRestart = (await request(path)).body.results;
  const firstBase = base;
  await check("first server stops and releases its listener", async () => {
    await stopServer();
    await assert.rejects(fetch(firstBase + path, { signal: AbortSignal.timeout(1000) }));
  });
  await startServer();
  await check("new server process preserves sessions, provenance and frozen coverage", async () => {
    const response = await request(path);
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.results, beforeRestart);
    assert.deepEqual((await request(`${path}/${fresh.analysis.id}`)).body.result, fresh);
  });
  await check(
    "saved request replay survives restart and clearly labels stale historical results",
    async () => {
      const response = await start(cartons, { requestKey: savedKey });
      assert.equal(response.status, 200);
      assert.equal(response.body.result.analysis.id, saved.analysis.id);
      assert.equal(response.body.result.stale, true);
      assert.equal(response.body.result.coverage, null);
      assert.equal((await start()).body.result.analysis.id, fresh.analysis.id);
    },
  );
  const secondBase = base;
  await check("second server stops and releases its listener", async () => {
    await stopServer();
    await assert.rejects(fetch(secondBase + path, { signal: AbortSignal.timeout(1000) }));
  });

  await startServer("RUNPOD");
  let failed;
  await check(
    "unconfigured RUNPOD mode persists FAILED without fake inference or fallback",
    async () => {
      const response = await start();
      assert.equal(response.status, 200);
      failed = response.body.result;
      assert.equal(failed.analysis.status, "FAILED");
      assert.equal(failed.analysis.forecast, null);
      assert.equal(failed.analysis.source, null);
      assert.equal(failed.coverage, null);
      assert.match(failed.analysis.error, /endpoint.*API key.*revision/);
    },
  );
  await check("failed run remains readable and an explicit new request can retry", async () => {
    assert.deepEqual((await request(`${path}/${failed.analysis.id}`)).body.result, failed);
    assert.equal((await poll(failed.analysis.id)).body.result.analysis.status, "FAILED");
    const retry = await start();
    assert.equal(retry.body.result.analysis.status, "FAILED");
    assert.notEqual(retry.body.result.analysis.id, failed.analysis.id);
  });
  await check("insufficient history remains NEEDS_DATA in unconfigured provider mode", async () => {
    const response = await start("product-lids");
    assert.equal(response.body.result.analysis.status, "NEEDS_DATA");
    assert.equal(response.body.result.analysis.forecast, null);
  });
  const finalBase = base;
  await check("final server stops and releases its listener", async () => {
    await stopServer();
    await assert.rejects(fetch(finalBase + path, { signal: AbortSignal.timeout(1000) }));
  });
  console.log(
    JSON.stringify({
      checks: results.length,
      passed: results.length,
      node: process.version,
      synthetic: true,
      modes: ["MOCK", "RUNPOD with empty credentials; no external inference"],
      serverStarts: ports.length,
    }),
  );
} finally {
  await stopServer();
  rmSync(directory, { recursive: true, force: true });
  process.removeListener("SIGINT", cancelled);
  process.removeListener("SIGTERM", cancelled);
  console.log(
    `Cleanup: test servers stopped; temporary database removed=${!existsSync(directory)}`,
  );
}
