# Stock tracking verification

21 October 2026. Local branch: `feat/stock-tracking`. Base commit: `68643df`. Node.js 24.16.0, Next.js 16.4.2, built-in Node SQLite.

## Result and scope

**Ready for the user to commit and push the stock-tracking feature branch for team review.** Stages 1 and 2 are complete for this local backend checkpoint. The agent has not staged, committed, pushed, merged or published the work.

This verifies the dedicated stock API and its compatibility with the existing local synthetic workflow. It does not establish production authentication, live POS/Orbyte integration, deployment durability or actual RunPod inference. The original frontend source, dependencies and licence remain unchanged.

## Reproduce

```sh
npm run lint
npm run typecheck
npm test
npm run build
node scripts/verify-stock-tracking.mjs
```

The HTTP script needs permission to listen on localhost. It starts two production server processes in sequence using automatically allocated ports and one temporary synthetic database, then stops them and removes the database. It sets `FORECAST_MODE=MOCK` and a test-only access code in the child environment. It does not use the normal `data/estock.sqlite`, real supplier destinations or cloud credentials. A missing production build produces a clear instruction to build first.

The initial sandboxed HTTP attempt was blocked by `listen EPERM`; its cleanup completed. The user-approved run outside the sandbox passed. That initial environment restriction was not an application failure.

## Actual outcomes

| Check | Result | Evidence |
| --- | --- | --- |
| Existing regression suite before adding stock tests | PASS | 38 tests passed, 0 failed |
| Full Node suite with stock tests | PASS | 60 tests passed, 0 failed, 0 skipped; 22 focused inventory tests plus the 38 existing tests |
| New production HTTP suite | PASS | 24 scenario groups passed, 0 failed; requests hit a running production Next.js server |
| Lint | PASS | `biome check src`; 32 source files, no fixes applied |
| TypeScript | PASS | `tsc --noEmit`, including the new inventory tests |
| Production build | PASS | Static `/` and `/demo`; dynamic `/api/products`, `/api/movements`, `/api/demo` and `/api/session` in the route output |
| Whitespace and source preservation | PASS | `git diff --check`; no frontend, dependency, configuration or LICENSE diff after restoring generated development type references |
| Test cleanup | PASS | Both listeners rejected requests after shutdown; temporary database directory removed |

Node emitted the existing `MODULE_TYPELESS_PACKAGE_JSON` warning when loading TypeScript tests. It did not fail any test. No dependency/configuration change was made merely to silence it.

## Stock behaviour exercised

- Initial API balances: cartons 45 units, coffee 22 kg, lids 75 units. Responses identify synthetic data and the server-resolved demo role.
- An actual HTTP sale of 5 cartons returned stock 40 and a ledger delta of -5. A manager's reasoned adjustment of 12 returned stock 52. These are synthetic ledger arithmetic checks.
- Usage, damage, inspected usable returns and manager outgoing adjustments produced the expected signed changes.
- A 0.125 kg coffee sale returned 21.875 kg. Excess precision was rejected in the focused unit tests.
- Negative, zero, excessive, fractional countable-unit and non-number quantities were rejected without a stock change. Wrong units and closed/future/invalid dates were rejected.
- Manager adjustments were rejected for staff, including a body claiming `role: manager`. Missing/forged sessions and another organisation's input were rejected.
- Optional sale notes accept text up to the configured bound; arbitrary objects and oversized notes were rejected. Required references, source IDs and non-sale reasons were checked.
- Identical request retries and same-business-event retries preserved one movement and one stock change. Conflicting request/event details returned HTTP 409. Replays retained ledger versions and activity; returned products reflected current stock.
- Paginated history returned each row once, newest insertion first, with product filtering. Empty history, invalid limits/cursors and missing identifiers were checked.
- JSON syntax/shape, content type, required request key and 16 KiB byte limit were exercised. The byte limit was checked with multi-byte text.
- Cross-origin and cross-site mutations were rejected. Controlled errors retained their HTTP status; unexpected error details were hidden by the unit-tested response helper.
- The legacy `/api/demo` API and the dedicated stock API read the same stock balance.
- Two simultaneous HTTP requests to sell 30 units from 50 produced one HTTP 200 and one HTTP 422. Stock became 20, with no overselling.

## Receiving and persistence

The existing synthetic workflow tests passed, including approval, partial/full/damaged receiving, imports, stale decisions and source-event deduplication. The new inventory test confirmed that approval does not increase physical stock, supplier acknowledgement contributes separate incoming quantity, and receiving 8 usable plus 2 damaged units increases stock by 8 while reducing order remaining by 10.

The HTTP harness terminated its first server process, verified that its listener was closed, and started another process against the same temporary database. Stock, complete movement responses, saved sessions and idempotency survived. Final HTTP fixture balances were cartons 20 and coffee 21.875 kg. The second listener was then closed and the temporary directory removed.

All forecast activity in these regression tests used explicit local/mock providers. Their success is not evidence of neural forecasting, GPU execution or model accuracy.

## Boundaries still requiring later work

- The frontend owner must review/connect the agreed stock API and check the resulting screens.
- No new browser/visual/accessibility audit was performed because this stage changed backend and tests. No screen-sharing, screen-capture or computer-control session was initiated.
- SQLite was checked locally in one application instance. Replit storage, restart/redeploy durability and judge access remain unverified.
- Real RunPod access, frozen model/package revisions, actual numerical inference, evaluation and own-account proof remain outstanding.
- A push makes this branch available for review. Merge conflicts against a newer remote `main` must be assessed during integration; these tests cannot guarantee conflict-free merges.
- The older pulled handoff references `WORKFLOW_2026_10_21.md`, which is absent from this checkout. This report contains fresh stock verification and does not recreate that missing report.

## Checkpoint

Stages 1 and 2: **100% of their local acceptance checks complete**. Overall milestone progress: **2 of 7, approximately 29%**. Later-stage code already exists in the pull; it is not counted as an accepted milestone until reviewed under the agreed sequence. See [MVP progress and Step 3](../plans/MVP_PROGRESS.md).
