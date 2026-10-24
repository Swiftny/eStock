# eStock Staff receiving revision: actual local verification

24 October 2026, MYT. This report applies to the confirmed Staff-receiving revision, not the older Manager-approval reports. [PRD](../product/prd.md), [receiving contract](../engineering/OCR_INTAKE.md), [ledger/archive contract](../engineering/STOCK_TRACKING.md), [setup](../../README.md).

## Implemented result

Manager scans/corrects/matches and prepares expected base-unit quantities, then sends a validated frozen submission to shared Staff without changing stock. Staff checks Match/Short/Extra and confirms physical goods. Actual quantities, positive Intake movements, balances, check results/completion and required discrepancy notifications commit atomically once. There is no later Manager approval; the old path returns 410. Zero actual stays in receipt/check History with no zero movement, including an entirely missing delivery. Historical APPROVED receipts retain their original Manager identity/time and never repost.

Submissions preserve product/name/unit/date/expected snapshots by revision; raw extraction remains separate. Recall/correct/resubmit invalidates old Staff checks. Background polling keeps the displayed Staff version fixed and disables confirmation when a new version appears; explicit Reopen latest check clears old differences. Archive races cannot silently post to hidden products. Both-role Take enforces current availability; Manager Delete archives remaining stock/history. Stockroom is the sole permanent app destination, with separate task screens, compact role-scoped notifications and direct Back to Stockroom.

## Isolation, preservation and documentation

One active editor performed the cross-area integration. Starting Git changes in DESIGN, context, README, Compose, declaration, landing, eStock component/CSS and the untracked palette report were preserved and extended where needed. No Git reset/stage/commit/push/merge, publication, cloud provision, purchase or external message. Existing archives, original Indonesian source, Apache LICENSE, historical RunPod evidence and legacy source were not changed. `.env.local` was read for local connections, never overwritten or printed.

Tests use task-created synthetic cases, unique owned PostgreSQL schemas, temporary source copies, fresh Chrome contexts and in-process/loopback extraction stubs. Browser and preview server external fetches are blocked. No operational inventory was used as test fixtures and no live/paid Gemini call occurred. Owned test schemas and source copies were removed. An initial preview cleanup assertion mishandled macOS `/var` versus `/private/var`; canonical-path validation was corrected, and subsequent complete cleanup is verified. The specifically owned initial leftover source folder was subsequently removed after validating its canonical temporary path; no Docker volume was removed.

Current docs were aligned across PRD/decisions, root guidance/context/README/design, permission and engineering contracts, scope map/team handoff, proposal/pitch/declaration/checklist. Official-template word-count blocks remain within their recorded limits: proposal 196/286/181 (250/300/200); declaration 195/63/85/128/137 (200/100/100/150/150). This is Markdown checking, not signed/exported submission acceptance. Historical reports remain historical.

## Commands and results

| Check | Actual result |
| --- | --- |
| `npm run test:estock` | **31/31 pass**, real isolated PostgreSQL/API tests; ledger reconciliation passes for every synthetic product, including archives; owned schemas removed |
| `npm test` | **117/117 pass**, retained Node suite |
| `npm run test:worker` | **7/7 pass**, retained Python worker tests; not OCR evidence |
| `npm run test:estock:browser` | **15/15 journeys pass**, actual headless installed Chrome, isolated source/schema/provider; final results in ignored `.artifacts/estock-mvp/results.json` |
| Scoped Biome | **33 source/test files pass**, no fixes outstanding; no repository-wide formatter |
| `npm run typecheck` | Pass |
| `npm run build` | Pass, Next.js 16.4.2 production build with receiving/notification routes |
| Area checks | Explicit path allowlists pass: demo 6, data 7, backend 10, system 2, frontend landing 1; shared layout/docs/contracts/map reviewed separately as integration, not a single-area pass |
| `git diff --check` | Pass |
| Submission Markdown blocks | Eight checked passages within their recorded limits; no PDF/signature/readiness claim |

Current documentation was fetched via Context7 outside the sandbox for Next.js route handlers, React effect cleanup, PostgreSQL 17 row/advisory locks, node-postgres client transactions and Playwright context/routing. Installed Next.js route-handler guidance was read. Existing SDK extraction behavior was preserved; no provider call was made.

### PostgreSQL/API safety coverage

The retained safety suite was adapted from Manager-final-approval to send plus Staff confirmation while keeping transactional validation, request fingerprints/replay, product version checks, failure injection and reconciliation. New scenarios cover:

- Send validation/frozen version and unchanged stock; saving/extraction/discard remain stock-neutral; a notification failure rolls back send snapshots/status/request as well.
- Match once; same-request response replay; changed-input request conflicts; different request IDs and simultaneous same/different-ID confirmations cannot repost. Stale receipt/product revisions, closed receipts and concurrent edits conflict.
- Lamp 5W Opening 10 + expected 20 − Short 2 = **28 stock**; Lamp 10W expected 20 + Extra 3 = **23 added**. Existing stock is never corrected to compensate for expected Intake.
- Fully missing line and entirely missing delivery: retained actual 0/check/history/Manager notification, with no zero/negative Intake.
- Missing/foreign/excluded/invented/duplicate IDs, invalid outcomes/differences, excessive shortage, unsafe overflow, strings, zero/negative/fractional values and missing physical declaration reject without effects.
- Injected second-line Intake failure, balance failure and required discrepancy-notification failure roll back results, checks, balances, movements, receipt state, request identity and notification resolution. Retry succeeds once after removing the injected failure.
- Role-session permissions: Staff cannot catalogue-edit/Delete/OCR/read general drafts/send/recall/see full History; Manager cannot confirm receiving; caller actor fields cannot escalate. Manager approval returns 410.
- Notification persistence/read state, role isolation, deduplication, resolution and ordinary matching receipts producing no Manager discrepancy alert. Reads do not mutate inventory.
- Archive with stock preserves identity/stock snapshot/history, excludes matching and Take/Return, blocks pending receiving and supports recall/replacement/resubmission. Take/archive and confirmation/archive races serialize safely.
- Both-role Take at availability, above availability and zero; concurrent Takes cannot go negative. Return is not bounded by current stock.
- Fresh migration and populated original-001 upgrade, repeated migration, preserved products/stock/ledger/drafts/Manager-completed attribution/synthetic sessions, no generated submission/notification or repost. Preparation product creation explicitly enforces Opening 0.

### Original Take concern reproduced

A separate owned preview substituted only the original HEAD MovementDialog into a temporary source copy. At available 5, typing **5000** left the displayed value 5000, Confirm enabled and no `aria-invalid`/inline error. Native `rangeOverflow` was true and native validation prevented posting; stock remained 5. This was a presentation/feedback concern, not a reproduced server overdraw. Local evidence: `.artifacts/estock-mvp/take-before-revision.json` and `take-before-revision.png`. The revised dialog visibly rejects excessive values, disables Confirm, retains an empty editing state, bounds ArrowUp at max, refreshes stale availability and updates the Inventory row to disable Take at zero. Return has no stock max.

### Actual browser journeys and evidence

Fifteen journeys exercise both roles, empty states, product creation/search/rename/Opening, stub OCR/loading/error/retry, temporary comparison/change/remove/reload, manual conversion/unknown product 0/exclusion, saved draft/send, Staff notifications/read/reload/direct Back/browser Back, difference validation/preview/actual posting, matching checks, all-missing History, Manager informational alerts, Take/Return/stale availability, Delete Cancel/error/pending/retry/success/history, archive conflict/recall/resubmit/explicit Staff reopen, notification loading/error/retry/Mark read and non-overlapping focus bursts, responsive/keyboard/reduced motion, preserved public hero and server restart/reload persistence. Session sign-out and owned-resource cleanup are verified.

All six feature screens are checked at 320px; Stockrooms are checked at 320/375/768/1440px and 812×375 landscape. Product checking is exercised at 375px; Receipt history at 320px. Keyboard evidence includes Tab focus, Enter activation, Escape modal dismissal, Cancel and direct home return. Sampled visible-text contrast has minimum **5.43:1**; final JSON records samples and zero unexpected page runtime errors. Deliberately induced HTTP 400/403/409/502/503 resource messages are expected test evidence, not suppressed application exceptions.

Reviewed local screenshots include [Manager Stockroom](../../.artifacts/estock-mvp/manager-stockroom-375px.png), [Staff receiving](../../.artifacts/estock-mvp/staff-receiving-375px.png), [Receipt history](../../.artifacts/estock-mvp/receipt-history-mobile-width.png), [draft review](../../.artifacts/estock-mvp/draft-mobile-width.png) and [preserved landing](../../.artifacts/estock-mvp/landing-preserved.png). Artifacts are ignored local output, not committed/public submission evidence. Old failure captures can remain from intermediate runs; final `results.json` and the named current screenshots establish this report's result.

## Actual existing-laptop upgrade and runtime smoke

The real local `npm run db:estock:migrate` command succeeded after isolated upgrade testing. Before/after aggregate counts were identical: **1 product, total stock 0, 4 movements, 0 drafts, 1 existing session**. Migration ledger lists `001_initial.sql` and `002_staff_receiving.sql`. No operational stock/draft/ledger fixture was inserted. Only additive schema changes were applied; no Docker volume deletion/reset/truncate. Existing `.env.local` credentials/session secret were preserved.

Read-only smoke on the existing local port 3000 returned `/demo` 200, unauthenticated products 401, Manager products/drafts/history/receiving/notifications 200, Staff products/receiving/notifications 200 and Staff drafts/history 403. Only the temporary smoke sign-in sessions were signed out. The user's existing session remained intact. Build-generated next-env route imports were restored to their initial development-path content after checks.

Each teammate uses their independent volume/configuration: `npm ci` → `docker compose -f compose.estock.yml up -d --wait` → `npm run db:estock:migrate` → restart `npm run dev` and open `/demo`. Explicit setup and app initialization share the same transactional/advisory-lock ordered runner. Never overwrite an existing `.env.local` or use `down -v`/resets as migration. New Gemini key usage requires separate authorisation for paid/live testing.

## UI Delivery Gate

Scope: revised app/task/navigation/receiving/notification/archive/Take/History UI and directly contradictory public copy. Existing physical-camera behavior is unchanged and outside verified device coverage. Direction was read before edits; antislop during (session override) and ui-ux-pro-max were used. ENERGY 2 / RHYTHM 2 / MOTION 2. Blue identifies the primary task/selection; spacing separates tasks/fields; the drawer keeps detail out of Stockroom; native dialogs isolate decisions; Manrope/wordmark retain eStock identity. No new asset/icon/font/dependency.

### Hard Gate

- R-02 PASS: new interface copy has no em dash; reviewed rendered new views.
- R-03 PASS: no essential horizontal overflow in the tested 320px feature screens or Stockroom width/landscape matrix.
- R-17 PASS: no unsourced metrics in UI; summary numbers come from persisted active records.
- R-18 PASS: no testimonials introduced; synthetic products are explicitly test fixtures.
- R-23 PASS: task navigation was explicitly requested; no new visual asset was created for UI.
- R-24 PASS: task buttons, notification receipt links and direct Back controls reached existing screens in Chrome.
- R-25 PASS: sampled rendered text contrast minimum 5.43:1; disabled controls excluded as inactive.
- R-26 PASS: revised actions have actual handlers/API persistence and recorded send/check/read/Delete/Take/Return/recall/reopen journeys.
- R-27 PASS: empty, loading, provider/notification/Delete errors, stale stock/version and archive conflicts exercised.
- R-28 PASS: no FAQ introduced or changed.
- R-32 PASS: native modal confinement, visible blue keyboard focus, Tab/Enter/Escape/Cancel and direct Back tested.
- R-33 PASS: implementation is authored in React/CSS source; no runtime patching in delivered app. Original-dialog substitution was isolated reproduction only.
- R-34 PASS: fixed light design retained; no theme toggle introduced.
- R-35 PASS: production build and actual isolated Chrome click-through completed; physical-camera limits remain explicit.
- R-36 PASS: no fabricated security/compliance/provider/impact claims; limitations below remain open.
- R-37 PASS: DESIGN direction and ENERGY 2 / RHYTHM 2 / MOTION 2 read/declared before UI work.
- R-38 PASS: app features are implemented; synthetic fixtures are labelled and do not imply customer adoption.

### Purpose Gate

- R-01 PASS: no gradient/glow introduced; existing blue wash separates preparation/confirmation work.
- R-04 PASS: no generic/decorative icon set introduced; labelled text actions retain clarity.
- R-06 PASS: Manrope and existing compact labels retain the supplied brand hierarchy.
- R-07 PASS: no background grid/dot/blueprint pattern introduced.
- R-08 PASS: no decorative arrows added to controls.
- R-09 PASS: unread badge reports backend role-scoped pending unread state; status labels convey actual lifecycle.
- R-10 PASS: no glassmorphism introduced.
- R-12 PASS: native modal elevation isolates Delete/notifications; no all-card shadow treatment introduced.
- R-13 PASS: no glow introduced.
- R-14 PASS: task controls, quantity rows and receipt records follow their different content purposes.
- R-19 PASS: existing page/control/dialog timing retained; reduced motion measured as animation none.
- R-22 PASS: no illustration introduced.

### Liveliness

- Dials PASS: ENERGY 2 / RHYTHM 2 / MOTION 2 recorded in DESIGN/report.
- Consistency PASS: calm blue hierarchy and compact task grouping visible in reviewed screenshots.
- Focal point PASS: Stockroom Inventory access, preparation Send and Staff physical-confirmation panel lead their screens.
- Whitespace PASS: status rows, task actions and line forms have distinct spacing/grouping at narrow widths.
- Accent PASS: blue has task/selection purpose; textual warning/error states retain amber/red roles.
- Identity PASS: shared eStock wordmark, Manrope and blue wash recur across landing and app.
- Design Read PASS: existing direction was loaded before implementation; no unrelated redesign.

### Craftsmanship and quality locks

- C-1 PASS: palette/type/layout/drawer/dialog/motion purposes documented above.
- C-2 PASS: new interactive controls complete real persisted operations and retry/Cancel routes.
- C-3 PASS: concise home statuses/tasks only; Recent activity removed; forms/history remain separate.
- C-4 PASS: mobile/landscape, keyboard, empty/loading/error/conflict, refresh and reduced-motion journeys pass within stated desktop-browser coverage.
- C-5 PASS: no fabricated evidence or customer claim; live/device/hosting limits explicit.
- R-05 PASS: content-specific stock/task/check screens retained; no generic marketing template inserted.
- R-11 PASS: existing rectangular controls and modest panel/dialog radii retained.
- R-15 PASS: specific actions include Send to Staff, Report differences, Confirm received goods, Delete and Back to Stockroom.
- R-16 PASS: no new AI marketing buzzwords.
- R-20 PASS: actual stock/receipt tasks, catalogue identities, eStock blue/Manrope and wordmark define the interface.
- R-21 PASS: fixed light appearance follows confirmed design; no forced dark mode.
- R-29 PASS: existing blue/neutral palette retained with textual status amber/red.
- R-30 PASS: visual reference remains this product's own landing, not a copied third-party app.
- R-31 PASS: all major visual choices have written role/purpose and runtime screenshots above.

## Material remaining limitations

Live OCR quality, provider model/key/tier/retention, physical-camera permission/capture and real phones/tablets are **Unverified**. Resized desktop Chrome and stubbed provider results do not establish them. Hosted/redeploy/backup durability, Replit own-project/judge access and Orbyte integration remain **Unverified**; local restart is not hosted proof. Shared Staff cannot identify individuals; Return has no previous-Take link. Separate duplicate uploads are not universally prevented by one-receipt protection. Pagination/operational-scale performance and broader assistive-technology coverage are not established here. Competition/source/signature/attendance/workshop/final-artifact and historical provenance questions remain open; no requirement is marked complete solely from these tests.
