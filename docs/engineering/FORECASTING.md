# Demand forecasts and stock coverage: backend handoff

21 October 2026. Step 3 covers MVP capabilities **2 and 3**. All operational records and local test responses are synthetic. **Local implementation and verification are complete; actual RunPod inference is pending.**

## Ownership and starting point

The user committed Step 2 as `2345671` (`Inventory tracking system`). Work started from that commit with a clean tree and a new branch, `feat/demand-forecasting`. No merge, commit or push was performed by the agent.

| Files | Responsibility |
| --- | --- |
| `src/lib/server/forecasting/` | Forecast queries, mutation adapter, saved coverage inputs, daily coverage calculation and HTTP helpers |
| `src/lib/forecasting/contracts.ts` | Client-safe API types; coordinate changes with the frontend owner |
| `src/app/api/analysis-runs/` | Dedicated forecast routes |
| `src/lib/server/forecast.ts`, `service.ts`, `worker/` | Existing shared backend/provider lifecycle; coordinate before overlapping edits |
| `src/lib/contracts.ts` | Existing shared types, with optional request/product identity fields added |
| `src/lib/server/json.ts`, `inventory/http.ts` | Shared bounded JSON reader; stock endpoints retain their status/body contract |
| Pages, components, styles and assets | Frontend owner; no changes in this stage |
| Root README/context and shared project documents | Coordinate edits; these remain common files |

Feature folders reduce overlapping edits. They do not guarantee conflict-free merges. This branch includes Step 2 through its base commit; review the PR base with the team before merging. No comparison with newly fetched remote changes was performed during this task.

## Runtime boundary

The existing SQLite, stock ledger, history validation, analysis table, transaction service and forecast worker are reused. No new package, database service, migration or model was added. The existing `/api/demo` actions still work. Completing analysis continues to create a recommendation through the existing service; this stage does not change purchasing formulas or approval authority.

New runs save physical stock, safety stock and dated outstanding delivery inputs alongside the history/cutoff/version snapshot. Coverage reads those saved inputs. It never substitutes today's stock for an earlier run's stock. An automatic no-order review advancement records its resulting policy fingerprint; later manual policy/calendar edits invalidate coverage.

Stock/sales revisions, incoming revisions, policy changes or a changed business date/cutoff make a result stale. The API retains the historical forecast and its provenance but returns `coverage: null`, `stale: true` and reasons. Request a new analysis after closing the current day when movements have been posted. Older runs without saved coverage inputs remain readable with coverage unavailable.

## Sessions and requests

Use the existing HttpOnly synthetic session from `POST /api/session` or the role selector in `/demo`. Staff and managers can read. Dedicated start/poll routes require a server-resolved manager role. A JSON `role` field does not grant access. The existing demo interface and its day-closing automation retain their previous permissions.

Mutation headers:

```http
Content-Type: application/json
Idempotency-Key: a-unique-request-key
```

The body must be a JSON object, at most 16 KiB. Request keys are at most 160 characters. Retain a key and identical input when retrying an uncertain request. Use a new key for each later poll or intentional retry. Replaying a poll key returns the saved/current view without another provider call.

Responses use `Cache-Control: private, no-store`. Dates are explicit synthetic business dates; generation timestamps are UTC. These are team-defined endpoints, with no Orbyte integration or production identity claim.

## Endpoints

| Endpoint | Permission | Behaviour |
| --- | --- | --- |
| `POST /api/analysis-runs` | Manager | Body `{ "productId": "product-cartons" }`; starts or reuses a run |
| `GET /api/analysis-runs/:id` | Staff/manager | Reads saved status/results; never polls or submits to RunPod |
| `GET /api/analysis-runs?productId=...&limit=20` | Staff/manager | Latest runs by insertion, newest first; optional product filter; limit 1–100 |
| `POST /api/analysis-runs/:id/poll` | Manager | Body `{}`; checks a pending provider job and persists completion |

The list returns the latest limited set, without a cursor. The frontend can refresh it explicitly.

Start/poll returns HTTP **202** while the saved run is `PENDING`; otherwise **200**, including saved `FAILED` or `NEEDS_DATA` results. Read `result.analysis.status` even when HTTP is successful. Request-level failures use `{ "error": "Actionable message", "code": "..." }`: 400 JSON, 401 session, 403 permission/origin, 404 unknown ID, 409 changed input/conflicting key/day closing required, 413 size, 415 media type, 422 validation, 500 unexpected error, or 503 invalid forecast mode. Provider/configuration failures after a run is saved are represented by that run's `FAILED` state and error.

### Response fields

Import types using `import type` from `@/lib/forecasting/contracts`. Do not import server/database code in client components.

Single-run responses contain `synthetic: true`, `organisationId`, server-resolved `role`, `demoDate` and `result`. List responses use the same context with `results: ForecastAnalysisView[]`.

| `result` field | Meaning |
| --- | --- |
| `analysis` | Saved ID, product, decision/cutoff dates, status, source, model/revision, input hash, job ID, error and forecast |
| `analysis.forecast` | Accepted dated `p50`, warnings, runtime and provenance, or `null`; pending forecasts have empty demand arrays |
| `analysis.forecast.modelP50` | Optional actual worker model series, separate from the series selected for purchasing |
| `analysis.forecast.evaluation`, `device` | Optional worker diagnostics; no invented accuracy or confidence percentage |
| `product` | ID, SKU, name, base unit and precision; no purchasing prices |
| `input` | Cutoff, requested horizon, observation count and history hash |
| `stale`, `staleReasons` | Whether operational inputs changed since this run |
| `coverage` | Deterministic daily stock projection, or `null` when unsafe/unavailable |
| `coverageUnavailableReason` | Why coverage is unavailable, or `null` |

For a fresh synthetic fixture in MOCK mode, cartons produce **45 units**, **10/day**, **4.5 days** to depletion, safety level on **23 October** and first negative projected closing balance on **25 October**. This was checked in the HTTP harness. It is baseline arithmetic, not a real model result. The fixture has no confirmed incoming deliveries.

### Frontend integration example

```ts
import type { ForecastAnalysisResponse } from "@/lib/forecasting/contracts";

async function analyse(productId: string, requestKey: string) {
  const response = await fetch("/api/analysis-runs", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": requestKey,
    },
    body: JSON.stringify({ productId }),
  });
  if (!response.ok) throw new Error((await response.json()).error);
  return (await response.json()) as ForecastAnalysisResponse;
}
```

Render pending, needs-data, failed, stale and completed states separately. Show the source and cutoff beside the result. For a pending run, a manager can POST `{}` to its poll route with a fresh key, then read the returned view. GET only refreshes saved information. Keep polling bounded; this implementation has no background scheduler or webhook. The existing `/demo` UI has not been connected to the new coverage fields, so the frontend owner can adopt them without a design rewrite.

## Coverage arithmetic and assumptions

For each forecast day, starting on `decisionDate`:

```text
available = previous closing stock + confirmed arrivals on this day
closing stock = available - this day's selected demand
```

Confirmed/partially received orders contribute only their remaining quantity, on the saved confirmed ETA. Unconfirmed and overdue goods are excluded with warnings. Deliveries outside the forecast horizon do not extend its estimate. Daily arrivals are treated as usable before that day's demand; no arrival-hour certainty is implied.

- `daysRemaining` estimates fractional days to the first zero/negative balance using that day's demand. Demand is treated as uniform within the day. Quantities/projections and the estimate are rounded to three decimals.
- `depletionDate` is the first demand day reaching zero or lower. `stockoutDate` is the first negative closing balance, representing unmet demand. They can differ when stock ends exactly at zero.
- `safetyDate` is the first day at/below the configured safety stock, including the decision date if opening stock is already at/below it.
- `COVERS_HORIZON` gives `coveredDaysAtLeast`, with exact days/depletion date `null`. It does not extrapolate demand beyond the forecast.
- `NO_DEMAND` gives nullable coverage rather than infinity. Missing history gives no forecast or coverage.
- Negative projected balances show accumulated unmet demand; they never write negative physical stock to the ledger. A later arrival cannot erase an earlier shortage indicator.

This calculation is deterministic. Only a validated model demand series can be AI inference; purchasing arithmetic and coverage are rules.

## Forecast validation and honest sources

History requires 28–168 complete consecutive observations ending at the closed cutoff. Missing observations do not become zero. The policy requests 30–44 future days. Censored stockout days are flagged; lost demand is unknown. Both the TypeScript baseline selector and Python evaluation exclude censored target days from comparison and favour the simpler baseline on ties.

| Source | Meaning |
| --- | --- |
| `MOCK_BASELINE` | Local history-based mean/seasonal calculation; no GPU call |
| `RUNPOD` | Worker chose model demand; real execution still needs external proof |
| `BASELINE_SELECTED` | Worker evaluated model and baselines, then selected a baseline; model output is retained separately |
| `BASELINE_FALLBACK` | Explicit mean fallback after provider failure, or worker's short-history baseline pending evaluation; inspect warnings and metadata |

A source string in a mocked test is not evidence of real inference. Worker output must echo request/product identity and match hash, cutoff, dates, horizon, fixed model ID and pinned revision. Invalid metadata/quantities, malformed responses, missing credentials or authentication failures cannot silently become a fallback. Negative finite model values within bounds are clipped and disclosed. A provider outage may use an explicitly labelled mean fallback only when enabled.

RunPod endpoint/model configuration is part of cache identity. It cannot silently turn an old pending job into a poll against another endpoint. Immediately completed jobs retain the provider ID. Repeated/concurrent unchanged analysis requests share one run. An interrupted submission without a saved job ID is marked unknown/failed after a bounded wait; review the provider dashboard before an intentional retry.

Deploy the updated `worker/handler.py` with its request/product echoes. Earlier worker output without those fields is rejected for new provider responses; saved historical runs remain readable. The app exposes `modelP50`/device/evaluation when present, but those fields alone are not independent proof of GPU execution.

## Finish the RunPod checkpoint

Your friend can configure RunPod separately using [worker/README.md](../../worker/README.md). No frontend design change is needed to set server secrets. Obtain account/credit access and agree a spending limit before provisioning or paid inference. Set the endpoint, server key and the same pinned model revision in the correct environments; restart the application.

Then run one real synthetic SKU through the app, check pending/completed/error states, save the full request/result and verify coverage. Retain the job/endpoint ID, history hash/cutoff, model revision, actual GPU/runtime, evaluation, UTC times and redacted own-account proof. Verify a fresh application process reads the same saved result. Freeze actual image/package versions after the successful spike. No secret belongs in chat, Git, browser code or screenshots.

The queue API uses asynchronous `/run` submission and `/status` retrieval. Retrieve completion promptly: provider results have limited retention. See the [official RunPod request guide](https://docs.runpod.io/serverless/endpoints/send-requests). The worker median extraction follows the [upstream Chronos-Bolt quantile interface](https://github.com/amazon-science/chronos-forecasting/blob/main/src/chronos/chronos_bolt.py); actual pinned-package/CUDA execution remains unverified.

Actual local evidence and limits: [FORECASTING_2026_10_21.md](../verification/FORECASTING_2026_10_21.md). Stage progress: [MVP_PROGRESS.md](../plans/MVP_PROGRESS.md). Do not mark Step 3 or M1/M3 complete from mocked tests.
