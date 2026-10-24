import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { isolatedSyntheticFixture } from "./synthetic-fixture.ts";
import { afterEach, beforeEach, test } from "node:test";
import type { ForecastRequest } from "../src/lib/contracts.ts";
import { closeDb, getDb, ORG } from "../src/lib/server/db.ts";
import { act } from "../src/lib/server/service.ts";
import { state } from "../src/lib/server/store.ts";
import { baseline, selectBaseline, validateHistory, validateResult } from "../src/lib/server/forecast.ts";
import { addDays } from "../src/lib/server/validation.ts";
const revision = "a".repeat(40);
function output(request: ForecastRequest, changes: Record<string, unknown> = {}) {
  return { status: "COMPLETED", requestId: request.requestId, productId: request.productId,
    source: "RUNPOD", modelId: "amazon/chronos-bolt-small", modelRevision: revision,
    inputHash: request.inputHash, cutoffDate: request.cutoffDate, runtimeMs: 123,
    device: "Synthetic CUDA mock", generatedAt: "2026-10-21T01:00:00Z",
    dates: Array.from({ length: request.horizonDays }, (_, i) => addDays(request.cutoffDate, i + 1)),
    p50: Array(request.horizonDays).fill(10), modelP50: Array(request.horizonDays).fill(10), warnings: [], ...changes };
}
let requests: { url: string; body: unknown }[];
let cleanupFixture: () => void;
beforeEach(() => { cleanupFixture = isolatedSyntheticFixture("RUNPOD"); process.env.RUNPOD_ENDPOINT_ID = "test-endpoint"; process.env.RUNPOD_API_KEY = "test-only-token"; process.env.CHRONOS_MODEL_REVISION = revision; process.env.FORECAST_ALLOW_FALLBACK = "true"; requests = []; });
afterEach(() => cleanupFixture());
test("pending provider job persists, polls, validates metadata and saves result", async () => {
  let submitted: ForecastRequest;
  globalThis.fetch = async (url, options) => { requests.push({ url: String(url), body: options?.body }); if (String(url).endsWith("/run")) { const body = JSON.parse(String(options?.body)); submitted = body.input; assert.equal(submitted.values.length, 168); assert.equal(submitted.dates.at(-1), "2026-10-20"); assert.equal(body.input.modelRevision, revision); assert.ok(!("supplier" in body.input)); return Response.json({ id: "test-job", status: "IN_QUEUE" }); } return Response.json({ status: "COMPLETED", output: { status: "COMPLETED", source: "RUNPOD", modelId: "amazon/chronos-bolt-small", modelRevision: revision, requestId: submitted.requestId, productId: submitted.productId, device: "Synthetic CUDA mock", modelP50: Array(submitted.horizonDays).fill(10), inputHash: submitted.inputHash, cutoffDate: submitted.cutoffDate, runtimeMs: 123, generatedAt: new Date().toISOString(), dates: Array.from({ length: submitted.horizonDays }, (_, i) => addDays(submitted.cutoffDate, i + 1)), p50: Array(submitted.horizonDays).fill(10), warnings: [] } }); };
  const started = await act("manager", "analyse", { productId: "product-cartons" }, "job-start"); const run = started.state.analyses[0]; assert.equal(run.status, "PENDING"); assert.equal(run.jobId, "test-job");
  await act("manager", "analyse", { productId: "product-cartons" }, "another-click"); assert.equal(requests.filter((r) => r.url.endsWith("/run")).length, 1);
  const result = await act("manager", "pollAnalysis", { analysisId: run.id }, "poll-1"); assert.equal(result.state.analyses[0].status, "COMPLETED"); assert.equal(result.state.products[0].recommendation?.source, "RUNPOD"); assert.equal(result.state.analyses[0].forecast?.runtimeMs, 123);
});
test("provider outage uses explicitly labelled mean fallback with valid history", async () => { globalThis.fetch = async () => { throw new Error("Synthetic timeout"); }; const result = await act("manager", "analyse", { productId: "product-cartons" }, "outage"); assert.equal(result.state.analyses[0].source, "BASELINE_FALLBACK"); assert.ok(result.state.products[0].recommendation?.warnings.some((w) => /not AI inference/.test(w))); });
test("missing configuration remains failed, with no fabricated forecast or fallback", async () => { delete process.env.RUNPOD_API_KEY; const result = await act("manager", "analyse", { productId: "product-cartons" }, "missing-config"); assert.equal(result.state.analyses[0].status, "FAILED"); assert.equal(result.state.analyses[0].forecast, null); assert.equal(result.state.products[0].recommendation?.calculation, null); });
test("invalid provider values never become purchasing recommendations", async () => { globalThis.fetch = async (_url, options) => { const request = JSON.parse(String(options?.body)).input; return Response.json({ status: "COMPLETED", output: { status: "COMPLETED", source: "RUNPOD", modelId: "amazon/chronos-bolt-small", modelRevision: revision, requestId: request.requestId, productId: request.productId, device: "Synthetic CUDA mock", modelP50: Array(request.horizonDays).fill(10), inputHash: request.inputHash, cutoffDate: request.cutoffDate, generatedAt: new Date().toISOString(), runtimeMs: 1, dates: Array.from({ length: 30 }, (_, i) => addDays(request.cutoffDate, i + 1)), p50: Array(30).fill("NaN"), warnings: [] } }); }; const result = await act("manager", "analyse", { productId: "product-cartons" }, "invalid-model"); assert.equal(result.state.analyses[0].status, "FAILED"); assert.equal(result.state.products[0].recommendation?.calculation, null); });
test("baseline ties select mean and missing days cannot be silently zero-filled", () => { assert.equal(selectBaseline(Array(168).fill(10), 30), "mean28"); assert.deepEqual(baseline(Array(28).fill(0), 3), [0, 0, 0]); const days = state("manager").products[0].history; assert.equal(validateHistory(days, "2026-10-20").valid, true); assert.equal(validateHistory(days.filter((d) => d.date !== "2026-10-10"), "2026-10-20").valid, false); });
test("negative finite model values are clipped and disclosed", () => { const request: ForecastRequest = { requestId: "test", productId: "synthetic", cutoffDate: "2026-10-20", horizonDays: 30, inputHash: "test-hash", values: Array(28).fill(10), dates: [], stockoutFlags: [] }; const result = validateResult({ status: "COMPLETED", source: "RUNPOD", modelId: "amazon/chronos-bolt-small", modelRevision: revision, requestId: request.requestId, productId: request.productId, device: "Synthetic CUDA mock", modelP50: Array(request.horizonDays).fill(10), inputHash: request.inputHash, cutoffDate: request.cutoffDate, generatedAt: new Date().toISOString(), runtimeMs: 1, dates: Array.from({ length: 30 }, (_, i) => addDays(request.cutoffDate, i + 1)), p50: Array(30).fill(-1), warnings: [] }, request); assert.ok(result.p50.every((v) => v === 0)); assert.ok(result.warnings.some((w) => /clipped/.test(w))); });

test("provider result must match product, request, input, pinned model, horizon and valid quantities", () => {
  const request: ForecastRequest = { requestId: "test", productId: "synthetic", cutoffDate: "2026-10-20", horizonDays: 30, inputHash: "test-hash", values: Array(28).fill(10), dates: [], stockoutFlags: [] };
  assert.equal(validateResult(output(request), request).productId, request.productId);
  for (const changes of [
    { requestId: "other" }, { productId: "other" }, { inputHash: "other" }, { cutoffDate: "2026-10-19" },
    { modelId: "other/model" }, { modelRevision: "main" }, { source: "MOCK_BASELINE" }, { runtimeMs: -1 },
    { generatedAt: "invalid" }, { p50: [10] }, { dates: Array(30).fill("2026-10-22") },
    { p50: Array(30).fill(Infinity) }, { p50: Array(30).fill("10") }, { p50: Array(30).fill(1000001) },
    { modelP50: Array(30).fill(NaN) }, { modelP50: undefined }, { device: "" }, { warnings: [17] },
  ]) assert.throws(() => validateResult(output(request, changes), request), /Forecast|invalid|match/);
});

test("concurrent submissions use one saved provider job and stale inputs cannot create a recommendation", async () => {
  let submitted!: ForecastRequest;
  let count = 0;
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith("/run")) { count++; submitted = JSON.parse(String(options?.body)).input; return Response.json({ id: "stale-job", status: "IN_QUEUE" }); }
    return Response.json({ id: "stale-job", status: "COMPLETED", output: output(submitted) });
  };
  const results = await Promise.all([act("manager", "analyse", { productId: "product-cartons" }, "concurrent-1"), act("manager", "analyse", { productId: "product-cartons" }, "concurrent-2")]);
  assert.equal(count, 1);
  assert.equal(results[0].entityId, results[1].entityId);
  closeDb();
  const run = state("manager").analyses[0];
  assert.equal(run.jobId, "stale-job");
  await act("staff", "recordMovement", { productId: "product-cartons", type: "SALE", quantity: 1, unit: "units", date: "2026-10-21", reference: "SYN-STALE", sourceEventId: "stale-sale" }, "stale-sale");
  const completed = await act("manager", "pollAnalysis", { analysisId: run.id }, "stale-poll");
  assert.equal(completed.state.analyses[0].status, "COMPLETED");
  assert.equal(completed.state.products[0].recommendation, null);
  assert.ok(completed.state.activity.some((e) => e.action === "Analysis became stale"));
});

test("failed provider submissions retain identity and cannot be blindly billed again", async () => {
  process.env.FORECAST_ALLOW_FALLBACK = "false";
  let count = 0;
  globalThis.fetch = async () => { count++; throw new Error("Synthetic provider outage"); };
  const first = await act("manager", "analyse", { productId: "product-cartons" }, "failed-1");
  const again = await act("manager", "analyse", { productId: "product-cartons" }, "failed-2");
  assert.equal(count, 1);
  assert.equal(first.entityId, again.entityId);
  assert.equal(again.state.analyses[0].status, "FAILED");
  assert.equal(again.state.products[0].recommendation?.calculation, null);
});

test("horizon covers the configured lead time and remaining review interval", async () => {
  const p = state("manager").products[0].policy;
  await act("manager", "updatePolicy", { ...p, productId: "product-cartons", expectedVersion: p.version, leadTimeDays: 14, nextReviewDate: "2026-11-20" }, "long-policy");
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(String(options?.body)).input;
    assert.equal(request.horizonDays, 44);
    assert.equal(request.dates.length, request.stockoutFlags.length);
    assert.equal(request.dates.at(-1), request.cutoffDate);
    return Response.json({ status: "COMPLETED", output: output(request) });
  };
  await act("manager", "analyse", { productId: "product-cartons" }, "long-horizon");
  const saved = getDb().prepare("SELECT request FROM analysis_runs WHERE org_id=?").get(ORG)!;
  assert.equal(JSON.parse(String(saved.request)).horizonDays, 44);
  assert.equal(state("manager").analyses[0].forecast?.p50.length, 44);
});

test("application request traverses Python handler contract and persists a baseline-selected recommendation", async () => {
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(String(options?.body)).input;
    const child = spawnSync("python3", ["-c", "import sys,json; sys.path.insert(0,'worker'); from test_handler import synthetic_handler_output; print(json.dumps(synthetic_handler_output(json.load(sys.stdin))[0]))"], { input: JSON.stringify(request), encoding: "utf8", env: { ...process.env, CHRONOS_MODEL_REVISION: revision } });
    assert.equal(child.status, 0, child.stderr);
    return Response.json({ id: "synthetic-python-contract", status: "COMPLETED", output: JSON.parse(child.stdout) });
  };
  const result = await act("manager", "analyse", { productId: "product-cartons" }, "python-contract");
  closeDb();
  const saved = state("manager");
  assert.equal(saved.analyses[0].status, "COMPLETED");
  assert.equal(saved.analyses[0].jobId, "synthetic-python-contract");
  assert.equal(saved.analyses[0].forecast?.requestId, result.entityId);
  assert.equal(saved.products[0].recommendation?.source, "BASELINE_SELECTED");
  assert.ok(saved.products[0].recommendation?.calculation);
});

test("malformed pending job identities fail without an actionable fallback", async () => {
  globalThis.fetch = async () => Response.json({ status: "IN_QUEUE", id: { invalid: true } });
  const result = await act("manager", "analyse", { productId: "product-cartons" }, "malformed-job");
  assert.equal(result.state.analyses[0].status, "FAILED");
  assert.equal(result.state.analyses[0].forecast, null);
  assert.equal(result.state.products[0].recommendation?.calculation, null);
});

test("a pending run keeps its pinned revision and configuration changes make its result stale", async () => {
  let submitted!: ForecastRequest;
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith("/run")) {
      submitted = JSON.parse(String(options?.body)).input;
      return Response.json({ id: "revision-job", status: "IN_QUEUE" });
    }
    return Response.json({ id: "revision-job", status: "COMPLETED", output: output(submitted) });
  };
  const first = await act("manager", "analyse", { productId: "product-cartons" }, "revision-start");
  assert.equal(submitted.modelRevision, revision);
  process.env.CHRONOS_MODEL_REVISION = "b".repeat(40);
  assert.throws(() => validateResult(output(submitted, { modelRevision: "b".repeat(40) }), submitted), /match/);
  const result = await act("manager", "pollAnalysis", { analysisId: first.entityId }, "revision-poll");
  assert.equal(result.state.analyses[0].status, "COMPLETED");
  assert.equal(result.state.analyses[0].forecast?.modelRevision, revision);
  assert.equal(result.state.products[0].recommendation, null);
  assert.ok(result.state.activity.some((event) => event.action === "Analysis became stale"));
});

test("a response for another provider job never becomes an actionable recommendation", async () => {
  let submitted!: ForecastRequest;
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith("/run")) {
      submitted = JSON.parse(String(options?.body)).input;
      return Response.json({ id: "expected-job", status: "IN_QUEUE" });
    }
    return Response.json({ id: "wrong-job", status: "COMPLETED", output: output(submitted) });
  };
  const first = await act("manager", "analyse", { productId: "product-cartons" }, "wrong-job-start");
  const result = await act("manager", "pollAnalysis", { analysisId: first.entityId }, "wrong-job-poll");
  assert.equal(result.state.analyses[0].status, "FAILED");
  assert.equal(result.state.products[0].recommendation?.calculation, null);
});

test("baseline comparison excludes the same censored validation targets as the worker", () => {
  const weekly = Array.from({ length: 168 }, (_, i) => i % 7);
  assert.equal(selectBaseline(weekly, 30), "seasonal7");
  assert.equal(selectBaseline(weekly, 30, Array(168).fill(true)), "mean28");
});
