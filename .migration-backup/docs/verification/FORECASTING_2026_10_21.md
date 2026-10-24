# Step 3: forecasting and stock coverage verification

21 October 2026. Branch: `feat/demand-forecasting`. Base: `2345671` (`Inventory tracking system`), the user's committed Step 2. The starting tree was clean. No agent commit/push, merge, deployment, paid resource or real external forecast was performed.

## Status: local work complete; real inference pending

Step 3 is **80/100** under the checklist below. These are equally weighted delivery checkpoints, not a measure of hours or accuracy. Overall accepted MVP stages remain **2 of 7, approximately 29/100** until the real Step 3 acceptance case and team review are complete.

| Step 3 checkpoint | Result |
| --- | --- |
| 20%: inspect committed base, branch and existing contracts/worker | Complete |
| 40%: saved forecast API, provider lifecycle and honest provenance | Complete locally |
| 60%: daily stock coverage, frozen inputs and stale-result handling | Complete locally |
| 80%: runtime/regression verification and teammate handoff | Complete locally |
| 100%: real RunPod numerical inference, evidence and acceptance | Pending endpoint/account configuration and actual execution |

## Commands and actual results

Environment: Node.js **24.16.0**, existing installed dependencies and Python 3. No dependency installation or GPU/model download was needed.

| Command/check | Actual result |
| --- | --- |
| `npm run lint` | Passed; 42 source files, no fixes applied in the final check |
| `npm run typecheck` | Passed |
| `npm test` | Passed; 101 tests, zero failures/skips: 60 prior tests plus 12 coverage and 29 forecasting tests |
| `npm run test:worker` | Passed; 7 Python contract/evaluation tests; no real Torch/CUDA inference |
| `npm run build` | Passed; new dynamic analysis list/start, detail and poll routes plus existing pages/stock/demo/session routes |
| `node scripts/verify-forecasting.mjs` | Passed; 24 production HTTP scenario groups, three server processes in sequence against one isolated database |
| `node scripts/verify-stock-tracking.mjs` | Passed; all 24 Step 2 production HTTP scenario groups, two server processes in sequence |
| `git diff --check` | Passed |
| Frontend/licence/dependency/config preservation | Git comparison passed for pages/layout/components/styles/assets, original LICENSE, manifests/lockfile and root configuration |

The build temporarily regenerated `next-env.d.ts` with production type paths. Its original development imports were restored, and type checking passed again. Node's existing module-type warning appears in tests; it did not fail execution and no package-wide module setting was changed.

The first HTTP attempts were blocked by the filesystem/network sandbox's localhost-listening restriction (`listen EPERM`). Their cleanup ran. Both harnesses were then rerun with approved localhost permission and passed. They explicitly isolate their database; the forecast harness uses MOCK, then RUNPOD with **empty credentials**, so it cannot submit real inference. Provider contract tests replace `fetch` with synthetic responses.

## New focused checks

The 12 pure coverage tests check constant and varying daily demand, fractional depletion, exact zero versus unmet demand, confirmed arrival timing, late deliveries, overdue/unconfirmed/out-of-horizon goods, horizon lower bounds, zero demand, fractional units, invalid inputs and input immutability.

The 29 forecasting tests check:

- Synthetic context, source labels, daily series, frozen stock and cutoff alignment.
- Insufficient/gapped history and explicit complete zero-sales observations.
- A 44-day policy horizon and consistent use of product units.
- Manager-only dedicated mutations, filtered reads, validation and hidden unexpected errors.
- Request replay, unchanged-input reuse and one submission under concurrent analysis requests.
- Saved results/coverage after database reopening and readable legacy runs without invented coverage snapshots.
- Staleness after ledger/history, incoming, policy/calendar and date changes, including changes during an outstanding call.
- Valid automatic no-order calendar advancement and capture of confirmed outstanding incoming without changing physical stock.
- Pending job persistence, read-only GET, explicit polling, completion, job identity and retained metadata.
- Missing configuration, configured retry, disabled/enabled fallback, rejected credentials and invalid JSON.
- Mismatched request/product/model/revision/hash/dates, nonfinite arrays, unsafe job IDs and mismatched poll IDs.
- Provider-configuration changes, interrupted submissions and explicit source/error handling.
- Consistent censored-target baseline comparison and tie preference.

The Python tests exercise request constraints, baseline tie/zero-denominator metrics, exclusion of stockout targets, short-history limitations and origins that pass no future targets to prediction. One handler serialization test substitutes **simulated CUDA and a simulated pipeline** to check request/product echoes, date/series shape, source and metadata. Its device string explicitly says it is simulated. It is not model execution or GPU evidence.

## Production HTTP scenarios

The forecast harness checks:

1. Anonymous/forged sessions rejected.
2. Saved synthetic sessions and empty forecast list.
3. Staff denied start/poll despite forged body role.
4. Manager baseline result with 45 starting units, 10/day and 4.5-day coverage.
5. Same-key/unchanged-input reuse and conflicting key rejection.
6. Staff result reads with private headers and no purchasing costs.
7. Unknown IDs/products and foreign organisation rejection.
8. JSON shape, content type, size and request-key limits.
9. Cross-origin/cross-site mutation rejection.
10. NEEDS_DATA without a fabricated forecast/coverage.
11. Fractional-unit SKU and varying daily baseline.
12. Filtered lists and bounded/validated limits.
13. Completed polling and concurrent requests without duplicate runs.
14. Stock sale causing stale coverage and close-day requirement.
15. Legacy closing creating new cutoff-aligned analyses.
16. Legacy analysis interface returning the same saved run.
17. First server stopped and its listener closed.
18. New process preserving sessions, result provenance and frozen coverage.
19. Replayed historical request still identified as stale after restart.
20. Second server stopped and its listener closed.
21. Unconfigured RUNPOD saving FAILED without fallback/inference.
22. Readable failure and explicit retry with a new run.
23. Insufficient data remaining NEEDS_DATA in provider mode.
24. Final server stopped and its listener closed.

The stock harness additionally rechecks outgoing/incoming adjustments, precision, atomic validation, cursor history, duplicate source events, concurrent overselling protection, original demo compatibility and stock/session/history persistence.

## Reproduce

```sh
npm run lint
npm run typecheck
npm test
npm run test:worker
npm run build
node scripts/verify-forecasting.mjs
node scripts/verify-stock-tracking.mjs
```

HTTP checks require localhost-listening permission. Each harness uses temporary synthetic data and cleans up automatically. No browser is required. See [the API handoff](../engineering/FORECASTING.md) for trying the feature manually and [the worker setup guide](../../worker/README.md) for the remaining real-inference task.

## Limits and cleanup

- No RunPod endpoint, API key or pinned model revision was configured. No real neural forecast, GPU runtime, accuracy, account-credit or own-account proof was obtained.
- CUDA image/dependency ranges are candidates, not a verified lock. Real package/image/model compatibility still needs the friend's spike.
- No Replit deployment, durable hosted storage/redeploy check, final fixed-split evaluation or production authentication was verified.
- The new API/coverage contract is ready for the frontend owner. Existing pages/styles and the old demo contract are preserved; connecting the new coverage display and team acceptance remain outstanding. No new UI visual/accessibility claim is made by this backend task.
- The final verification round started five temporary HTTP server processes. All five stopped, all five listeners were checked closed, and both harness database directories were removed. Earlier runs and failed sandbox attempts also cleaned up.
- No browser, screen-sharing, screen-capture, computer-control session, floating control or overlay was initiated by this task. No such session was left active by this task.

Next: configure and verify one real RunPod case with evidence and team review. Only then accept Step 3 and move to Step 4's reorder recommendation/explanation review. Do not count mocked GPU metadata as successful inference.
