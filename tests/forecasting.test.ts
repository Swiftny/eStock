import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, mock, test } from "node:test";
import type { ForecastRequest, Role } from "../src/lib/contracts.ts";
import { closeDb, getDb, ORG, setMetadata } from "../src/lib/server/db.ts";
import {
  forecastConfigIdentity,
  selectBaseline,
  validateResult,
} from "../src/lib/server/forecast.ts";
import { forecastError } from "../src/lib/server/forecasting/http.ts";
import { pollSavedForecast, startForecast } from "../src/lib/server/forecasting/mutations.ts";
import { forecastAnalyses, forecastAnalysis } from "../src/lib/server/forecasting/queries.ts";
import { recordStockMovement } from "../src/lib/server/inventory/mutations.ts";
import { executeAction, processAnalysis } from "../src/lib/server/service.ts";
import { policy, savePolicy, state } from "../src/lib/server/store.ts";
import { addDays, DomainError } from "../src/lib/server/validation.ts";
import { syntheticFixture } from "./synthetic-fixture.ts";

const fields = [
  "ESTOCK_DB_PATH",
  "FORECAST_MODE",
  "FORECAST_ALLOW_FALLBACK",
  "RUNPOD_API_KEY",
  "RUNPOD_ENDPOINT_ID",
  "CHRONOS_MODEL_REVISION",
] as const;
const originalEnv = Object.fromEntries(fields.map((field) => [field, process.env[field]]));
const originalFetch = globalThis.fetch;
const revision = "a".repeat(40);
const cartons = "product-cartons";
let directory = "";
let sequence = 0;
let calls: string[] = [];

function key() {
  return `forecasting-unit-${sequence++}`;
}
function start(productId = cartons, role: Role = "manager", requestKey = key()) {
  return startForecast(role, { productId }, requestKey);
}
function reviewPolicy() {
  const current = policy(cartons);
  executeAction("manager", "updatePolicy", {
    ...current,
    productId: cartons,
    expectedVersion: current.version,
  }, key());
}
function runpod() {
  process.env.FORECAST_MODE = "RUNPOD";
  process.env.RUNPOD_ENDPOINT_ID = "synthetic-endpoint";
  process.env.RUNPOD_API_KEY = "synthetic-test-token";
  process.env.CHRONOS_MODEL_REVISION = revision;
}
function output(input: ForecastRequest, changes: Record<string, unknown> = {}) {
  return {
    requestId: input.requestId,
    productId: input.productId,
    status: "COMPLETED",
    source: "RUNPOD",
    modelId: "amazon/chronos-bolt-small",
    modelRevision: revision,
    inputHash: input.inputHash,
    cutoffDate: input.cutoffDate,
    generatedAt: new Date().toISOString(),
    runtimeMs: 123,
    dates: Array.from({ length: input.horizonDays }, (_, i) => addDays(input.cutoffDate, i + 1)),
    p50: Array(input.horizonDays).fill(10),
    modelP50: Array(input.horizonDays).fill(10),
    warnings: ["Synthetic provider response for contract tests; no GPU inference."],
    device: "Synthetic GPU metadata",
    evaluation: { selected: "model" },
    ...changes,
  };
}
function provider(reply: (url: string, options?: RequestInit) => Response | Promise<Response>) {
  globalThis.fetch = async (url, options) => {
    const address = String(url);
    assert.ok(address.startsWith("https://api.runpod.ai/v2/"));
    calls.push(address);
    return reply(address, options);
  };
}
function completed(changes: Record<string, unknown> = {}) {
  provider((_url, options) =>
    Response.json({
      id: "synthetic-job",
      status: "COMPLETED",
      output: output(JSON.parse(String(options?.body)).input, changes),
    }),
  );
}
function failure(status: number) {
  return (error: unknown) => error instanceof DomainError && error.status === status;
}
function movement() {
  return recordStockMovement(
    "staff",
    {
      productId: cartons,
      sourceEventId: key(),
      type: "SALE",
      quantity: 1,
      unit: "units",
      date: "2026-10-21",
      reference: "SYN-FORECAST-STALE",
    },
    key(),
  );
}
function count(table: "analysis_runs" | "recommendations" | "activity_events") {
  return Number(getDb().prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE org_id=?`).get(ORG)?.n);
}

beforeEach(() => {
  closeDb();
  directory = mkdtempSync(join(tmpdir(), "estock-forecasting-unit-"));
  process.env.ESTOCK_DB_PATH = join(directory, "records.sqlite");
  process.env.FORECAST_MODE = "MOCK";
  process.env.FORECAST_ALLOW_FALLBACK = "true";
  calls = [];
  // Every test intercepts provider calls, including accidental ones.
  provider(() => {
    throw new Error("Synthetic provider unavailable");
  });
  syntheticFixture();
  forecastAnalyses("manager");
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restoreAll();
  closeDb();
  rmSync(directory, { recursive: true, force: true });
  for (const field of fields) {
    if (originalEnv[field] === undefined) delete process.env[field];
    else process.env[field] = originalEnv[field];
  }
});

test("MOCK returns saved-history provenance, synthetic context and frozen coverage", async () => {
  const response = await start();
  const result = response.result;
  assert.equal(response.synthetic, true);
  assert.equal(response.organisationId, ORG);
  assert.equal(response.role, "manager");
  assert.equal(response.demoDate, "2026-10-21");
  assert.equal(result.analysis.status, "COMPLETED");
  assert.equal(result.analysis.source, "MOCK_BASELINE");
  assert.equal(result.input.observations, 168);
  assert.equal(result.input.horizonDays, 30);
  assert.equal(result.analysis.forecast?.dates[0], response.demoDate);
  assert.equal(result.coverage?.daysRemaining, 4.5);
  assert.equal(result.coverage?.startingStock, 45);
  assert.equal(result.coverage?.safetyDate, "2026-10-23");
  assert.equal(result.stale, false);
  assert.equal(result.coverageUnavailableReason, null);
  assert.ok(result.analysis.forecast?.warnings.some((warning) => /No AI inference/.test(warning)));
  assert.equal("policy" in result, false);
  assert.equal(calls.length, 0);
});

test("absent history saves NEEDS_DATA with no forecast or fabricated coverage", async () => {
  getDb().prepare("DELETE FROM daily_sales WHERE org_id=? AND product_id=?").run(ORG, "product-lids");
  const { result } = await start("product-lids");
  assert.equal(result.analysis.status, "NEEDS_DATA");
  assert.equal(result.analysis.forecast, null);
  assert.equal(result.coverage, null);
  assert.match(result.coverageUnavailableReason!, /complete sales records/);
  assert.equal(calls.length, 0);
});

test("explicit complete zero-sales history gives NO_DEMAND and a valid completed analysis", async () => {
  getDb()
    .prepare("UPDATE daily_sales SET quantity_milli=0 WHERE org_id=? AND product_id=?")
    .run(ORG, cartons);
  const { result } = await start();
  assert.equal(result.analysis.status, "COMPLETED");
  assert.equal(result.coverage?.status, "NO_DEMAND");
  assert.equal(result.coverage?.daysRemaining, null);
  assert.equal(result.stale, false);
});

test("a missing observation blocks demand estimation instead of becoming zero", async () => {
  getDb()
    .prepare("DELETE FROM daily_sales WHERE org_id=? AND product_id=? AND business_date=?")
    .run(ORG, cartons, "2026-10-10");
  const { result } = await start();
  assert.equal(result.analysis.status, "NEEDS_DATA");
  assert.equal(result.coverage, null);
  assert.match(result.analysis.error!, /missing sales days/);
});

test("unchanged inputs and duplicate request keys reuse one run and preserve provenance", async () => {
  const requestKey = key();
  const first = await start(cartons, "manager", requestKey);
  assert.deepEqual(await start(cartons, "manager", requestKey), first);
  assert.deepEqual(await start(), first);
  assert.equal(count("analysis_runs"), 1);
  assert.equal(count("recommendations"), 1);
  await assert.rejects(start("product-coffee", "manager", requestKey), failure(409));
});

test("reads preserve runs and audit, filter products, validate limits and hide unknown IDs", async () => {
  const saved = await start();
  await start("product-lids");
  const activity = count("activity_events");
  const result = forecastAnalyses("staff", cartons, 1);
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].analysis.id, saved.result.analysis.id);
  assert.equal(
    forecastAnalysis("staff", saved.result.analysis.id).result.coverage?.startingStock,
    45,
  );
  assert.equal(count("activity_events"), activity);
  for (const limit of [0, 101, 1.5, Number.NaN])
    assert.throws(() => forecastAnalyses("staff", undefined, limit), failure(422));
  assert.throws(() => forecastAnalyses("staff", ""), failure(422));
  assert.throws(() => forecastAnalyses("staff", "missing"), failure(404));
  assert.throws(() => forecastAnalysis("staff", "missing"), failure(404));
});

test("dedicated mutations require manager permission despite forged body fields", async () => {
  await assert.rejects(
    startForecast("staff", { productId: cartons, role: "manager" }, key()),
    failure(403),
  );
  const { result } = await start();
  await assert.rejects(pollSavedForecast("staff", result.analysis.id, key()), failure(403));
  await assert.rejects(
    startForecast("manager", { productId: cartons, organisationId: "other" }, key()),
    failure(403),
  );
});

test("a stock movement marks a saved forecast stale and removes actionable coverage", async () => {
  const { result } = await start();
  movement();
  const read = forecastAnalysis("manager", result.analysis.id).result;
  assert.equal(read.stale, true);
  assert.match(read.staleReasons.join(" "), /Stock or sales history changed/);
  assert.equal(read.coverage, null);
  assert.deepEqual(read.analysis, result.analysis);
  await assert.rejects(start(), failure(409));
});

test("policy edits, incoming revisions and business-date changes each mark runs stale", async () => {
  const { result } = await start();
  const id = result.analysis.id;
  const before = policy(cartons);
  savePolicy(cartons, {
    ...before,
    safetyStock: before.safetyStock + 1,
    version: before.version + 1,
  });
  assert.match(forecastAnalysis("manager", id).result.staleReasons.join(" "), /purchasing policy/);
  savePolicy(cartons, before);
  getDb()
    .prepare("UPDATE products SET inbound_version=inbound_version+1 WHERE org_id=? AND id=?")
    .run(ORG, cartons);
  assert.match(
    forecastAnalysis("manager", id).result.staleReasons.join(" "),
    /Incoming deliveries/,
  );
  setMetadata("demo_date", "2026-10-22");
  assert.match(forecastAnalysis("manager", id).result.staleReasons.join(" "), /business date/);
  assert.equal(forecastAnalysis("manager", id).result.coverage, null);
});

test("automatic no-order review advancement does not falsely invalidate its coverage", async () => {
  getDb()
    .prepare("UPDATE daily_sales SET quantity_milli=0 WHERE org_id=? AND product_id=?")
    .run(ORG, cartons);
  const before = policy(cartons);
  const { result } = await start();
  assert.ok(policy(cartons).version > before.version);
  assert.equal(result.stale, false);
  assert.equal(forecastAnalysis("staff", result.analysis.id).result.coverage?.status, "NO_DEMAND");
});

test("manual review-calendar changes are stale even when quantities stay unchanged", async () => {
  const { result } = await start();
  const before = policy(cartons);
  savePolicy(cartons, { ...before, nextReviewDate: "2026-10-28", version: before.version + 1 });
  assert.equal(forecastAnalysis("manager", result.analysis.id).result.stale, true);
});

test("the maximum supported purchasing horizon saves 44 daily forecast and coverage values", async () => {
  const before = policy(cartons);
  savePolicy(cartons, {
    ...before,
    leadTimeDays: 14,
    reviewIntervalDays: 30,
    version: before.version + 1,
  });
  const { result } = await start();
  assert.equal(result.input.horizonDays, 44);
  assert.equal(result.analysis.forecast?.p50.length, 44);
  assert.equal(result.coverage?.projections.length, 44);
});

test("saved forecast and coverage survive closing and reopening the database", async () => {
  const requestKey = key();
  const saved = await start(cartons, "manager", requestKey);
  closeDb();
  assert.deepEqual(forecastAnalysis("manager", saved.result.analysis.id), saved);
  assert.deepEqual(await start(cartons, "manager", requestKey), saved);
});

test("coverage snapshots only confirmed outstanding goods without adding them to physical stock", async () => {
  await start();
  const recommendation = state("manager").products[0].recommendation!;
  executeAction(
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
  executeAction("manager", "dispatch", { orderId: order.id }, key());
  executeAction(
    "manager",
    "confirmOrder",
    {
      orderId: order.id,
      expectedDate: order.expectedDate,
      reference: "SYN-FORECAST-CONFIRMATION",
      confirmApprovedTerms: true,
    },
    key(),
  );
  const { result } = await start();
  assert.equal(result.coverage?.startingStock, 45);
  assert.equal(result.coverage?.confirmedIncoming, order.quantity);
  assert.equal(
    result.coverage?.projections.find((day) => day.date === order.expectedDate)?.incoming,
    order.quantity,
  );
  assert.equal(state("manager").products[0].stock, 45);
});

test("old runs without saved coverage inputs remain readable without inventing their stock snapshot", async () => {
  const { result } = await start();
  const row = getDb()
    .prepare("SELECT request FROM analysis_runs WHERE id=?")
    .get(result.analysis.id)!;
  const request = JSON.parse(String(row.request));
  delete request.coverage;
  getDb()
    .prepare("UPDATE analysis_runs SET request=? WHERE id=?")
    .run(JSON.stringify(request), result.analysis.id);
  const read = forecastAnalysis("staff", result.analysis.id).result;
  assert.equal(read.stale, false);
  assert.equal(read.coverage, null);
  assert.match(read.coverageUnavailableReason!, /predates saved coverage/);
});

test("queued jobs persist, read without polling and complete once after an explicit poll", async () => {
  runpod();
  let submitted: ForecastRequest;
  let ready = false;
  provider((url, options) => {
    if (url.endsWith("/run")) {
      submitted = JSON.parse(String(options?.body)).input;
      assert.equal(submitted.values.length, 168);
      assert.equal(
        Object.keys(submitted).some((field) => /supplier|price|stock$|key/i.test(field)),
        false,
      );
      return Response.json({ id: "synthetic-job", status: "IN_QUEUE" });
    }
    return Response.json(
      ready
        ? { id: "synthetic-job", status: "COMPLETED", output: output(submitted) }
        : { id: "synthetic-job", status: "IN_PROGRESS" },
    );
  });
  const { result } = await start();
  const id = result.analysis.id;
  assert.equal(result.analysis.status, "PENDING");
  assert.equal(result.analysis.jobId, "synthetic-job");
  assert.equal(result.coverage, null);
  closeDb();
  assert.equal(forecastAnalysis("staff", id).result.analysis.status, "PENDING");
  assert.equal(calls.length, 1);
  await start();
  assert.equal(calls.length, 1);
  assert.equal((await pollSavedForecast("manager", id, key())).result.analysis.status, "PENDING");
  ready = true;
  const completed = await pollSavedForecast("manager", id, key());
  assert.equal(completed.result.analysis.status, "COMPLETED");
  assert.equal(completed.result.analysis.forecast?.runtimeMs, 123);
  assert.equal(completed.result.coverage?.daysRemaining, 4.5);
  assert.equal(count("recommendations"), 1);
  await pollSavedForecast("manager", id, key());
  assert.equal(calls.length, 3);
});

test("immediately completed provider responses retain their job identity", async () => {
  runpod();
  completed();
  const { result } = await start();
  assert.equal(result.analysis.status, "COMPLETED");
  assert.equal(result.analysis.jobId, "synthetic-job");
  assert.equal(result.analysis.forecast?.jobId, "synthetic-job");
  assert.equal(result.analysis.forecast?.requestId, result.analysis.id);
  assert.equal(result.analysis.forecast?.productId, cartons);
});

test("concurrent analysis requests submit only one provider job", async () => {
  runpod();
  let release: (value: Response) => void = () => {};
  let submitted: ForecastRequest;
  provider((_url, options) => {
    submitted = JSON.parse(String(options?.body)).input;
    return new Promise<Response>((resolve) => {
      release = resolve;
    });
  });
  const first = start();
  const second = await start();
  assert.equal(second.result.analysis.status, "PENDING");
  assert.equal(calls.length, 1);
  release(Response.json({ id: "synthetic-job", status: "COMPLETED", output: output(submitted!) }));
  assert.equal((await first).result.analysis.id, second.result.analysis.id);
  assert.equal(count("analysis_runs"), 1);
  assert.equal(count("recommendations"), 1);
});

test("input changes while a provider call is running prevent actionable coverage and a recommendation", async () => {
  runpod();
  provider((_url, options) => {
    const input = JSON.parse(String(options?.body)).input;
    movement();
    return Response.json({ id: "synthetic-job", status: "COMPLETED", output: output(input) });
  });
  const { result } = await start();
  assert.equal(result.analysis.status, "COMPLETED");
  assert.equal(result.stale, true);
  assert.equal(result.coverage, null);
  assert.equal(count("recommendations"), 0);
  assert.ok(state("manager").activity.some((event) => event.action === "Analysis became stale"));
});

test("changing provider configuration never polls an old job against a new endpoint", async () => {
  runpod();
  provider(() => Response.json({ id: "synthetic-job", status: "IN_QUEUE" }));
  const { result } = await start();
  process.env.RUNPOD_ENDPOINT_ID = "other-synthetic-endpoint";
  const read = await pollSavedForecast("manager", result.analysis.id, key());
  assert.equal(read.result.analysis.status, "FAILED");
  assert.equal(read.result.analysis.forecast, null);
  assert.match(read.result.analysis.error!, /configuration changed/);
  assert.equal(calls.length, 1);
});

test("missing credentials fail without fallback, then a reviewed configured retry can succeed", async () => {
  runpod();
  delete process.env.RUNPOD_API_KEY;
  const failed = await start();
  assert.equal(failed.result.analysis.status, "FAILED");
  assert.equal(failed.result.coverage, null);
  assert.equal(calls.length, 0);
  runpod();
  completed();
  assert.equal((await start()).result.analysis.id, failed.result.analysis.id);
  assert.equal(calls.length, 0);
  reviewPolicy();
  const success = await start();
  assert.equal(success.result.analysis.status, "COMPLETED");
  assert.notEqual(success.result.analysis.id, failed.result.analysis.id);
  assert.equal(count("analysis_runs"), 2);
});

test("outages use a labelled mean fallback only when fallback is enabled", async () => {
  runpod();
  const fallback = await start();
  assert.equal(fallback.result.analysis.source, "BASELINE_FALLBACK");
  assert.equal(fallback.result.coverage?.daysRemaining, 4.5);
  assert.match(fallback.result.analysis.forecast!.warnings.join(" "), /not AI inference/);
  process.env.FORECAST_ALLOW_FALLBACK = "false";
  const failed = await start("product-coffee");
  assert.equal(failed.result.analysis.status, "FAILED");
  assert.equal(failed.result.analysis.forecast, null);
  assert.equal(failed.result.coverage, null);
});

test("provider authentication failures and invalid JSON do not silently become a baseline", async () => {
  runpod();
  for (const status of [401, 403, 404]) {
    reviewPolicy();
    provider(() => new Response("Synthetic rejected request", { status }));
    const { result } = await start();
    assert.equal(result.analysis.status, "FAILED");
    assert.equal(result.analysis.forecast, null);
    assert.match(result.analysis.error!, /credentials or endpoint/);
  }
  reviewPolicy();
  provider(() => new Response("not-json", { status: 200 }));
  const { result } = await start();
  assert.equal(result.analysis.status, "FAILED");
  assert.match(result.analysis.error!, /invalid JSON/);
});

test("wrong identities, dates, metadata and nonfinite model arrays cannot pass validation", () => {
  runpod();
  const request: ForecastRequest = {
    requestId: "synthetic-request",
    productId: cartons,
    cutoffDate: "2026-10-20",
    horizonDays: 30,
    inputHash: "synthetic-hash",
    values: Array(28).fill(10),
    dates: [],
    stockoutFlags: [],
  };
  for (const changes of [
    { requestId: "other" },
    { productId: "other" },
    { requestId: undefined },
    { modelId: "other/model" },
    { modelRevision: "b".repeat(40) },
    { inputHash: "other" },
    { source: "MOCK_BASELINE" },
    { cutoffDate: "2026-10-19" },
    { generatedAt: "invalid" },
    { runtimeMs: -1 },
    { p50: Array(30).fill(Number.NaN) },
    { p50: Array(29).fill(10) },
    { dates: Array(30).fill("2026-10-21") },
    { modelP50: Array(30).fill(Number.POSITIVE_INFINITY) },
    { modelP50: [10] },
    { warnings: [17] },
    { device: {} },
    { evaluation: [] },
  ])
    assert.throws(() => validateResult(output(request, changes), request), failure(502));
  const raw = output(request, {
    p50: Array(30).fill(-1),
    unrecognised: "not part of the contract",
  });
  const saved = validateResult(raw, request);
  assert.ok(saved.p50.every((value) => value === 0));
  assert.ok(raw.p50.every((value) => value === -1));
  assert.equal("unrecognised" in saved, false);
});

test("invalid provider job identifiers or mismatched poll identities fail without coverage", async () => {
  runpod();
  provider(() => Response.json({ id: "../unsafe", status: "IN_QUEUE" }));
  assert.equal((await start()).result.analysis.status, "FAILED");
  provider(() => Response.json({ id: "synthetic-job", status: "IN_QUEUE" }));
  const { result } = await start();
  provider(() => Response.json({ id: "different-job", status: "COMPLETED" }));
  const read = await pollSavedForecast("manager", result.analysis.id, key());
  assert.equal(read.result.analysis.status, "FAILED");
  assert.equal(read.result.coverage, null);
});

test("interrupted submissions do not resubmit automatically and can be retried after review", async () => {
  const saved = executeAction("manager", "analyse", { productId: cartons }, key());
  const row = getDb()
    .prepare("SELECT payload,request FROM analysis_runs WHERE id=?")
    .get(saved.entityId!)!;
  const input = JSON.parse(String(row.request));
  const payload = JSON.parse(String(row.payload));
  input.submitted = true;
  payload.generatedAt = new Date(Date.now() - 60_000).toISOString();
  getDb()
    .prepare("UPDATE analysis_runs SET payload=?,request=? WHERE id=?")
    .run(JSON.stringify(payload), JSON.stringify(input), saved.entityId!);
  await processAnalysis(saved.entityId!);
  assert.equal(calls.length, 0);
  const failed = await pollSavedForecast("manager", saved.entityId!, key());
  assert.equal(failed.result.analysis.status, "FAILED");
  assert.match(failed.result.analysis.error!, /unknown after interruption/);
  assert.equal((await start()).result.analysis.id, saved.entityId);
  reviewPolicy();
  const next = await start();
  assert.notEqual(next.result.analysis.id, saved.entityId);
  assert.equal(next.result.analysis.status, "COMPLETED");
});

test("unknown forecast mode is a configuration error rather than implicit mock success", async () => {
  process.env.FORECAST_MODE = "RUNPOD_TYPO";
  assert.throws(forecastConfigIdentity, failure(503));
  await assert.rejects(start(), failure(503));
});

test("baseline validation excludes censored targets consistently and keeps tie preference", () => {
  const values = Array.from({ length: 168 }, (_, index) => 1 + (index % 7));
  assert.equal(selectBaseline(values, 30), "seasonal7");
  assert.equal(selectBaseline(values, 30, Array(168).fill(true)), "mean28");
});

test("forecast errors retain controlled status and hide private exception details", async () => {
  mock.method(console, "error", () => {});
  const known = forecastError(new DomainError("Review this forecast.", 409, "CONFLICT"));
  assert.equal(known.status, 409);
  assert.equal(known.headers.get("cache-control"), "private, no-store");
  const unexpected = forecastError(new Error("private implementation detail"));
  assert.equal(unexpected.status, 500);
  assert.deepEqual(await unexpected.json(), {
    error: "Could not complete the forecast operation. Try again.",
    code: "SERVER_ERROR",
  });
});
