# Inventory integration verification, 22 October 2026

This report describes local synthetic verification, not deployment, model accuracy, GPU execution or competition completion.

## Starting evidence and confirmed findings

Started on `main`, remote `git@github.com:Swiftny/sdc2026-TooGoodToBeTrue-domain2.git`. Existing uncommitted landing/login, demo, contracts, store/service/forecast, test fixture and worker changes were preserved. No concurrent editor, agent, branch switch, commit, push or publication was used.

The review's 19-pass/41-fail result did **not** reproduce against this working tree: the pre-edit suites passed **69 Node tests and 3 Python tests**. Those existing changes already added explicit fixtures, basic employee creation, fractional receiving, a history importer and forecast identity checks. Lint still reported four formatting errors; typecheck passed.

Browser reproduction found a remaining employee defect: Add Item was visible but `AddItemDialog` still rendered only for managers. Removed that leftover guard. Failed onboarding also refocused the name field after an error; it now keeps the focused error summary and preserves input. The older production HTTP harness still assumed seeded startup; it now tests empty startup and explicitly loads the test fixture into its own temporary database.

## Implemented and retained behaviour

- Normal startup has zero products, movements, analyses, orders, outbox messages, receipts and activity. Blank initialisation creates only metadata and a simulated supplier setting. No sample inventory was restored.
- `tests/synthetic-fixture.ts` explicitly creates deterministic products, history, policies and ledger records. Relevant suites each allocate their own temporary database, remove real forecast configuration, block external fetches, restore prior environment/fetch and clean up. No dependency on local inventory, provider credentials, network or test order was introduced.
- Employee onboarding allowlists basic fields, records opening stock once, checks the open date, unit/precision, unique SKU and idempotency, and retains audit. Purchasing fields are manager-only. Missing policy stays absent in storage and produces an inactive draft/read state labelled Purchasing setup required. It cannot generate an actionable purchase quantity.
- Manager policy remains a separate form. History import is reachable under Inventory, with template, file/paste, row validation, preview, duplicate/correction counts, confirmation and feedback. It reuses existing transactional backend validation. History before the ledger start never posts physical stock; missing days remain unknown. Corrections retain source/SKU/date, revisions and reasoned before/after audit.
- Receiving follows product precision for both roles. Usable goods add on-hand; usable plus damaged reduces outstanding quantity atomically. Invalid units, precision, order/organisation, dates, overage, duplicate/conflicting requests and unauthorised actions are checked. Damage remains a manager exception even after full delivery and creates no replacement stock.
- One to 27 complete consecutive days ending at cutoff use DEMO_ESTIMATE, the available-days average with an explicit limited-history/no-AI label. Gaps/incompleteness/no history remain blocked. At least 28 complete days are required for RunPod; MOCK uses an identified statistical baseline. Unknown reference costs remain null. Only the simulated channel permits an unpriced approval after warning acknowledgement; known costs still enforce limits.
- Calculation and model/evaluation details use native disclosures. Product, stock, coverage, labelled sales evidence, source/cutoff, supplier, order quantity, arrival and warnings remain available before approval. No broad screen redesign was performed.

## Actual checks

Environment: Node **22.23.3**, npm **10.9.9**, Python **3.9.6**. The expected experimental Node SQLite warning is present.

| Check | Actual result |
| --- | --- |
| `npm run lint` | PASS, 36 source files |
| `npm run typecheck` | PASS |
| `npm test` | **74 passed, 0 failed, 0 skipped** |
| `npm run test:worker` | **7 passed** |
| `npm run build` | PASS, standard Next.js/Turbopack production build |
| `node scripts/verify-stock-tracking.mjs` | **25 scenario groups passed, 0 failed**; three fresh server processes; temporary DB/listeners cleaned up |
| `git diff --check` | PASS |
| Explicit demo/data/backend/AI scope checks | PASS, 1/3/2/5 paths respectively |
| Whole-tree single-area scope check | Expected rejection: this is the user-authorised cross-area integration, including shared files and preserved earlier frontend work |

Production routes retained: `/`, `/login`, `/demo`, `/api/demo`, `/api/demo/controls`, `/api/session`, `/api/products`, `/api/movements`. Next.js regenerated `next-env.d.ts` from development route types to production route types. No existing route or integration was removed.

Scope checks used `python3 scripts/check_scope.py <area> --files ...` for demo component; store/template; service/workflow tests; forecast/tests/worker files. Shared contracts, inventory/fixture tests, HTTP harness and documentation were edited serially by the sole editor. The scope tool is opt-in validation, not remote enforcement.

## Browser evidence

Playwright used a production server on **port 3011**, with only `/private/tmp/estock-integration-browser-20261022.sqlite`. The normal database was not opened for the browser journey, reset or populated. The task restarted only its own server; restart preserved the same database. Screenshots are local ignored artifacts under `.artifacts/integration-20261022/`.

| Scenario | Observed result |
| --- | --- |
| Empty startup | No items; employee Add Item is reachable and now opens |
| Employee creation | Synthetic rice, `SYN-RICE`, kg/precision 3, opening 5; Purchasing setup required |
| Sale | 0.125 kg sale saved once, on-hand **4.875**; two ledger records including opening |
| Refresh and process restart | Balance, history, two receipts, one order and damage state survived |
| CSV errors | Row 2 future date and row 3 invalid 0.0001 kg precision displayed |
| File import | 28 dated 1 kg synthetic observations; preview/confirmation/commit succeeded; stock stayed **4.875** |
| Reimport | Browser preview and confirmed second commit both skipped all 28 identical rows; stock stayed 8.625 and history stayed at 30 rows after the later day closing |
| Template | Reachable download returned HTTP 200 |
| Manager setup/analysis | Explicit supplier policy saved; End day persisted labelled baseline result and recommendation |
| Review | Supplier, 4.875 stock, 3.875 kg proposal, order/arrival, source and unpriced/budget warning visible; complete sales week explicitly dated |
| Approval | **1 order and 1 outbox**; stock remained **4.875** |
| Supplier steps | Simulated dispatch and explicit acknowledgement; Next day opened the confirmed delivery date |
| Employee precision | Both receipt inputs have step **0.001**; 0.0001 disables submission |
| Partial damaged receipt | Usable **2.5**, damaged **0.125**; on-hand **7.375**, remaining **1.25**, damage exception open |
| Full receipt | Usable **1.25**; on-hand **8.625**, remaining **0**, status RECEIVED; damage exception remained open |
| Manager damage resolution | Later explicit synthetic credit/inspection reason closed the exception; no stock or replacement order added |
| Short history / integer item | Separate synthetic countable item used labelled one-day DEMO_ESTIMATE; 8.5-unit purchase edit was invalid; rejection retained reason and created no order |
| Duplicate SKU | HTTP 409 shown in form; input preserved; error focused; Escape returned to Add Item |
| Unauthorised APIs | Staff approval, policy update and CSV preview returned 403; injected item policy rejected on the closed day (409); open-day injection 403 is covered by Node tests |
| Role controls | Staff has inventory/orders; purchasing policy/import/approval controls absent; keyboard role switch works |

Viewport checks: **320, 375, 768 and 1440 px**, with no document horizontal overflow for inventory and manager review. Dialogs scroll internally on small screens; mobile decision capture verifies quantity/arrival/warnings/approval remain reachable. Checked native precision selection, custom role/menu keyboard controls, visible focus, dialog wrapping, Escape and focus return, disclosures, disabled invalid submission, success/error feedback and reduced motion. Rendered review text contrast sampled **32 visible text elements**, minimum **5.43:1**, no failures. No physical phone, screen-reader session or full accessibility certification was performed.

Screenshots visually inspected:

- `.artifacts/integration-20261022/employee-onboarding-desktop.png`
- `.artifacts/integration-20261022/employee-error-mobile.png`
- `.artifacts/integration-20261022/import-errors-desktop.png`
- `.artifacts/integration-20261022/import-preview-desktop.png`
- `.artifacts/integration-20261022/fractional-receipt-mobile.png`
- `.artifacts/integration-20261022/inventory-mobile.png`
- `.artifacts/integration-20261022/manager-review-desktop.png`
- `.artifacts/integration-20261022/manager-review-mobile.png`
- `.artifacts/integration-20261022/manager-decision-mobile.png`
- `.artifacts/integration-20261022/import-success-mobile.png`
- `.artifacts/integration-20261022/load-error-desktop.png`

Final normal browser console: zero errors/warnings. Earlier network records include the expected anonymous 401 before automatic session creation, deliberate duplicate-SKU 409 and a deliberately intercepted 500 used to verify load failure/Retry loading. Loading was observed; retry recovered the saved workspace and a subsequent normal reload had no console errors. No unexpected failed application request was found. Controlled rejected API requests are verification, not successful workflow operations. Some automation attempts used the wrong exact accessible label and timed out; snapshots were used to correct selectors. The employee dialog guard was a reproduced application defect, not a selector problem.

## Forecast contract and external blocker

The server submits only request/product identity, complete dated numerical history, flags, cutoff/hash, a 30–44-day horizon and fixed model/revision. Request identity and pinned revision persist. Completed synchronous responses retain provider job IDs; malformed pending job IDs fail without actionable fallback. Polling rejects mismatched provider job identity. Returned product/request/hash/cutoff/revision/model, daily dates, horizon and finite bounded quantities are checked.

New regression checks cover a real application request through the Python handler with **fake** Torch/Chronos modules, then back through TypeScript validation into a saved analysis/recommendation. They also cover pinned revision changes, configuration staleness, malformed job identity, matching censored baseline targets, CUDA-unavailable failure, tensor dimensions, nonfinite predictions, negative clipping, short evaluation and origins excluding future targets. Actual handler execution with fakes is local contract evidence only.

Context7 resolved RunPod and Chronos, then fetched primary documentation. Chronos-Bolt documents `predict_quantiles` as `(batch, horizon, quantiles)`, matching the worker's `(1, H, 1)` median extraction. RunPod documents asynchronous queue states and output polling. References: [Chronos-Bolt API](https://github.com/amazon-science/chronos-forecasting/blob/main/_autodocs/api-reference/chronos-bolt.md), [RunPod SDK](https://github.com/runpod/runpod-python/blob/main/README.md), [queue requests](https://docs.runpod.io/serverless/endpoints/send-requests).

No `RUNPOD_ENDPOINT_ID`, `RUNPOD_API_KEY` or `CHRONOS_MODEL_REVISION` was configured in the inspected environment/local environment files. Only variable-name/presence checks were output. **No live request, model download, GPU execution, package/image provisioning or spending occurred.** A controlled live spike still needs the team's configured endpoint/credentials, matching immutable model revision, authorised resource limits, exact image/package lock and retained numerical result/runtime/device/own-account proof. RunPod and Replit usage requirements remain open. Setup is in worker/README.md; no key should be pasted into chat.

Failed/unknown analysis identities are deliberately retained to avoid duplicate billing. Review provider outcome before introducing a new identity; repeatedly clicking Analyse does not retry the same submission. Valid provider outages may create a clearly labelled mean fallback; configuration/invalid-output failures cannot. Stock/policy/inbound/date or forecast-configuration changes keep stale results from creating actionable recommendations.

## Antislop Delivery Gate

Scope: changed inventory, import, receiving and manager-review surfaces. Existing landing identity and user-requested labels were retained. Mode: **during (session override)**. Design Read: operational light-blue ledger, **ENERGY 1 / RHYTHM 2 / MOTION 1**.

- R-02 PASS: changed demo text uses plain punctuation; unavailable numerical values use N/A.
- R-03 PASS: 320/375/768/1440 overflow checks and inspected mobile form/decision captures.
- R-17/R-18 PASS: no testimonials or invented customer/performance statistics; operational examples are explicitly synthetic.
- R-23 PASS: no new logo, imagery, navigation hierarchy or generated assets; requested controls extend existing screens.
- R-24 PASS: existing navigation reaches inventory/replenishment/orders/activity; CSV template returns 200.
- R-25 PASS: review's 32 sampled visible text elements meet AA, minimum 5.43:1; form/error screenshots use existing checked tokens.
- R-26 PASS: changed create/import/receipt controls submit real requests; disclosures expand; no placeholder action added.
- R-27 PASS: observed empty startup, pending save/day-analysis states, saved success, row errors and duplicate-SKU failure with retained input.
- R-28 PASS: no FAQ introduced.
- R-32 PASS: Tab/Shift+Tab, native select, keyboard role/menu, dialog wrapping, Escape/focus return and visible focus checked.
- R-33 PASS: functionality is implemented in normal application source; no runtime DOM/CSS injection adds features.
- R-34 PASS: existing required light theme retained; no theme switch introduced.
- R-35 PASS: production built/run; changed workflow clicked through, with API/Node regressions for duplicate and forbidden paths.
- R-36/R-38 PASS: simulated channel, baseline, short estimate and fake handler tests identified honestly; no live-AI/security/customer claims added.
- R-37 PASS: existing direction and dials read before edits; layout identity preserved.
- R-01/R-07/R-10/R-13/R-22 PASS: no gradient/glow/grid/glass/illustration added.
- R-04/R-08/R-09 PASS: existing contextual controls/disclosure symbols; no decorative icon, arrow or marketing badge added.
- R-06 PASS: existing local Manrope and tabular quantities preserve readable ledger identity; no new typography system.
- R-12 PASS: existing modal elevation identifies the active task; no floating card treatment added.
- R-14 PASS: inventory rows, compact form and approval sheet follow their content; no uniform feature-card grid added.
- R-19 PASS: no new animation; reduced-motion browser checks retain visible controls and content.
- Liveliness PASS: explicit dials; item/quantity focal point; structural form spacing; blue action accent; repeated ledger rows and tabular numbers remain the identity motif.
- C-1/C-3/R-05/R-31 PASS: separate basic setup from purchasing authority, secondary import and expandable evidence serve specific inventory tasks; no filler sections or new template composition.
- C-2/C-4 PASS: complete changed workflow, mobile/internal dialog scroll, keyboard and failure recovery verified in browser.
- C-5 PASS: test totals and synthetic stock chain are actual local observations; limitations are explicit.
- R-11/R-29 PASS: existing control radii and shared restrained blue/neutral/status tokens retained.
- R-15/R-16 PASS: changed actions name tasks (Add Item, Preview import, Receive goods); no new AI marketing copy.
- R-20/R-30 PASS: eStock's quantity ledger and approval sheet remain specific to replenishment; no reference assets or design-system replacement.
- R-21 PASS: user-selected light theme retained.

These scoped checks do not claim a manual click-through of every unrelated existing feature or physical-device accessibility testing.

## Handoff and next actions

Files touched by this integration: README, PROJECT_CONTEXT, PRD, decisions, build plan, synthetic data card, tools declaration, this report, demo component, shared contracts, service/store/forecast, inventory/workflow/forecast tests and synthetic helper, production HTTP harness, worker handler/tests/README, `.gitignore`, plus generated Next.js type references. The ignore rule `data/` also hid `docs/data/`; it is now anchored to `/data/` so the data card can be tracked. Runtime databases and SQLite files remain ignored. Prior landing/header/login/CSS/template changes remain preserved in the uncommitted tree. No database/schema migration, package addition or real integration replacement was needed.

Use README's empty-start journey to rehearse locally. The optional CSV step improves history; a short-history suggestion is explicitly a demo estimate. Worker setup requires a full valid history and actual provider configuration before a live inference attempt. Do not use local screenshots as GPU or Replit proof.

Priorities before submission:

1. Configure and run one controlled own-account RunPod inference; retain request/result/model/revision/hash/runtime/device and exact image/package lock. Show its saved recommendation in manager review.
2. Run the app in the team's Replit project with durable storage/one instance (or hosted DB), and verify restart/redeploy persistence and judge access.
3. Team review of permissions, synthetic fixtures, limitations and this uncommitted integration; user-authorised meaningful commits and committee access.
4. Align proposal/declaration/deck/video with actual capabilities, include platform proof and all six artifacts, and resolve/check official submission requirements. Use the earlier deadline pending authoritative clarification.

No commit, push, external publication, purchase, real supplier message or deletion of existing user inventory was performed.
