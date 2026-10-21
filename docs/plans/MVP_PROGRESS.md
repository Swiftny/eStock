# MVP checkpoints and next stage

Updated 21 October 2026. This tracks the seven-stage implementation sequence agreed in chat. It complements BUILD_PLAN.md; it does not replace its competition milestones.

## Current checkpoint: 29 / 100

Two of seven equally counted stages are complete: preparation and locally verified stock tracking. The percentage counts accepted stages, not time spent, test coverage or the percentage of source code written. The pull already contains code for later stages; that work is preserved and awaits stage-specific review. Manual commit/push and teammate review are still pending.

| Stage | Capability numbers | Checkpoint |
| --- | --- | --- |
| 1. Preparation, ownership and stock API agreement | Foundation | Complete for the backend handoff |
| 2. Stock tracking | 1 | Complete locally; 60 Node tests and 24 production HTTP scenario groups passed |
| 3. Demand forecast and stock coverage | 2, 3 | Next; existing adapter/worker, no real GPU result verified |
| 4. Reorder recommendations and explanation | 4, 8, 13, 23 | Existing code; stage review pending |
| 5. Manager review | 14 | Existing code; stage review pending |
| 6. Purchasing and receiving | 16, 19 | Existing code; stage review pending |
| 7. Final integration, deployment and evidence | All ten | Pending connected frontend review, platform proof and final acceptance |

Actual stock evidence: [STOCK_TRACKING_2026_10_21.md](../verification/STOCK_TRACKING_2026_10_21.md). Stock contract and ownership: [STOCK_TRACKING.md](../engineering/STOCK_TRACKING.md).

## Manual Git checkpoint

- Branch to push: `feat/stock-tracking`.
- Suggested commit message: `feat(inventory): add verified stock tracking APIs`.
- Include the inventory source/contracts/routes, shared service validation changes, regression tests, HTTP verification script, verification report, API handoff and updated project documentation.
- Keep `.env*` secrets, private contacts, local databases, dependencies and build output out of the commit. The placeholder `.env.example` is existing source and was not changed.
- Push the feature branch for teammate review. Assess integration against the latest `main` before merging. No agent commit, push or merge was requested/performed.

## Step 3: demand forecasting and stock coverage

This is the plan for the next authorised stage. No live endpoint, paid compute or Step 3 implementation has been initiated by the stock-verification task.

### 3A. Confirm access and the existing worker

Confirm the team's RunPod account access, available credit and spending limit before provisioning or running paid compute. Review the existing `src/lib/server/forecast.ts`, `worker/handler.py` and [worker setup guide](../../worker/README.md). Reuse their contract and provider adapter. The current CUDA image/dependency ranges and Chronos-Bolt Small revision are candidates that need a real spike.

Configure `RUNPOD_ENDPOINT_ID`, `RUNPOD_API_KEY`, `CHRONOS_MODEL_REVISION` and `FORECAST_MODE=RUNPOD` through server secrets. Never send keys in chat or commit them. Choose and pin an actual model commit revision, then freeze resolved worker packages/image details after the successful GPU run.

### 3B. Prepare one product's complete history

Use a known synthetic SKU and its complete daily SALE totals. Preserve the business cutoff, product unit, history completeness, stockout flags and input hash. Missing days remain missing until reviewed; adjustments, damage and internal use do not become customer demand. Use the PRD's closing snapshot so physical stock and sales inputs refer to the same cutoff.

The current contract validates 28 to 168 complete consecutive dated observations. It requests the configured horizon needed by the purchasing policy. Start with one product, then check the other seeded data/insufficient-history cases.

### 3C. Execute and save a real forecast

Submit history to the RunPod worker, save the job identity, expose pending status and poll its result. Validate product/request identity, dates, horizon, finite nonnegative values, model revision and input hash before accepting it. Persist daily demand, source, cutoff, model metadata, warnings and runtime.

The existing API currently triggers analysis through `/api/demo` actions `analyse` and `pollAnalysis`. Review that contract with the frontend owner before adding or changing endpoints. The stock API remains compatible.

### 3D. Calculate stock coverage

Project available stock against the forecast's daily demand and eligible confirmed arrivals on their dates. Estimate when stock reaches its safety level and when it may run out. Show zero-demand, insufficient-horizon and missing-data outcomes explicitly. Coverage is deterministic arithmetic using the forecast; it is not a second AI model.

Illustration only: 40 units, demand 10/day and no incoming deliveries give roughly four days of coverage. The real forecast can vary daily and will not be replaced with this fixed example. Overdue/unconfirmed deliveries must not silently hide a projected shortage.

### 3E. Agree the frontend response and failure states

Provide daily forecast dates/quantities, model versus baseline source, data cutoff, generation time, coverage, warnings and job state. The frontend owner renders these through their design. Keep source and uncertainty honest: expose supported model outputs/limitations and do not invent confidence percentages.

Check insufficient history, missing configuration, queued jobs, provider timeout, failed inference, invalid output, changed input during analysis, caching and duplicate requests. A configured fallback must be explicitly labelled as a baseline. A local/mock baseline does not satisfy the live GPU checkpoint.

### 3F. Retain real evidence and review

Save an actual own-account request/result with job/endpoint identity, input hash, model revision, timestamps, runtime, GPU evidence and redacted account proof. Check output against the declared baselines and keep the comparison honest. Deployment storage and fixed submission evaluation still need their later acceptance work.

Step 3 is complete when one SKU has an accepted real numerical RunPod result, correctly calculated coverage, saved provenance that survives refresh/restart, checked failure states and an agreed frontend response. Complete the core case first, then the other fixture/error cases. Do not count a mocked response or dashboard-only screenshot as successful inference.

## Next checkpoint after Step 3

Three accepted stages of seven give approximately **43 / 100**. Start Step 4 after the Step 3 result is reviewed. Budget allocation, seasonal modelling, richer reports, supplier comparison and the chatbot remain outside this core stage.
