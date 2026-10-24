# eStock: active decisions and open items

23 October 2026. Later explicit user instructions authorised local implementation and verification of the approved MVP. [Current verification](../verification/MVP_REVISION_VERIFICATION_2026_10_23.md) distinguishes source, synthetic tests and Unverified real-device/live-provider behavior. [Complete earlier register](../archive/2026-10-23-before-document-intake/docs/product/DECISIONS.md.txt) preserves old U/R/OPEN/SUB IDs and implementation history; reused historical IDs do not override the pivot.

## Gemini model selection: 25 October 2026

The user requires `gemini-3.8-flash` as the only extraction model. `ESTOCK_GEMINI_MODEL` is mandatory and must equal that ID. Blank or different values fail validation without a provider call; no alternate-model fallback is allowed. Historical live/stub checks retain their original scope and do not verify the current model's access, latency or accuracy.

## Latest confirmed revision: 24 October 2026

| ID | Decision | Consequence |
| --- | --- | --- |
| U-34 | Manager prepares, sends frozen receipt; shared Staff physically checks and immediately posts actual quantities | Supersedes U-22/U-24 and old Manager-final-approval expectations for new receipts; no later approval |
| U-35 | Match or positive Short/Extra differences; zero actual permitted | Keep extracted/expected/actual separate; no zero Intake; entirely missing delivery remains in History/Manager alerts |
| U-36 | Persist role-scoped notifications/read state; compact drawer and lightweight refresh | Staff pending checks; Manager informational discrepancy alerts only; no external messaging |
| U-37 | Manager Delete archives even with positive stock | Retain identity/stock snapshot/ledger/receipt references; exclude active operations/matching; pending conflicts require recall/correct/resend |
| U-38 | Stockroom home and separate task screens; only Stockroom permanent navigation | Direct Back to Stockroom everywhere; no Recent activity feed; public hero preserved |
| U-39 | Additive versioned migrations via one shared runner | Adopt existing 001 schemas non-destructively; preserve drafts/completed Manager receipts/sessions; test fresh and populated upgrades |
| U-40 | Explicit Take bounds and stale availability feedback for both roles | Preserve backend locking; do not cap Return by current stock |
| U-41 | Later 24 October UI clarification replaces Stockroom with Inventory home and header feature navigation | Supersedes U-38 navigation: no separate Stockroom or Back buttons; Manager/Staff workspace eyebrows removed; short page descriptions |
| U-42 | Landing Sign in becomes Sign out for an authenticated session; demo shows role immediately before Notifications | Existing session endpoints and backend permissions remain authoritative |
| U-43 | Keep the full camera visible on opening; preserve scroll while preparing photos; Retake/Remove controls | Retake Cancel retains the prior image; physical-device acceptance still needs actual evidence |

One coordinated editor owns this cross-area implementation. Original user changes and all archives/evidence remain preserved. [Actual revision checks and limits](../verification/STAFF_RECEIVING_2026_10_24.md). Older decisions below are historical where superseded; IC-02 approval means historical APPROVED only, while RECEIVED is now the immutable completed state. OPEN-01 local versioned migrations is resolved; hosted lifecycle/retention/deployment remain open.

## New user decisions

| ID | Decision | Basis / impact |
| --- | --- | --- |
| U-20 | eStock is document-assisted inventory, one shop/one warehouse | User's 23 October source and instructions; supersedes forecasting scope U-03/04/05/06 and historical U-17/18/19 product/training plans |
| U-21 | Historical documentation-only boundary, superseded by later explicit implementation instructions | Preserve the earlier boundary as history; current user task authorises the MVP revision and non-destructive verification |
| U-22 | Manager-only catalogue/Opening/upload/drafts/approval/full History; both roles Take/Return/view/search | Separate Manager + one shared Staff account, backend enforcement; staff individual attribution unavailable |
| U-23 | Official name/base unit/Opening/generated ID; integer operations | No mandatory entered SKU, barcode or shelf; positive Intake/Take/Return, concurrent nonnegative Take |
| U-24 | Actual-receipt confirmation before Intake; atomic immutable once-only approval | Image/invoice/order text is not physical-delivery evidence; no PO-management addition |
| U-25 | Preserve raw/final names, quantities, units and dates; manual conversion and confirmed aliases | No silent variant merge, automatic conversion or Gemini retraining |
| U-26 | Target PostgreSQL + backend Gemini, reuse existing Next.js/TypeScript where appropriate | Historical target-stage status; model selection is superseded by the 25 October decision above. Hosting acceptance remains separate |
| U-27 | No permanent uploaded images or monetary features | Structured drafts persist without image; re-upload needed later; verify provider retention separately |
| U-28 | Low stock strictly below 5; similar-document warnings P1 | Zero is Low stock, 5 is not; no forecast; same-draft protection is narrower than duplicate uploads |
| U-29 | Preserve original Indonesian source; canonical English working docs | English instruction U-10 retained; source corrections documented in current PRD |
| U-30 | Retain teal/Linear/Shopify proposed direction in DESIGN.md only | No CSS/site redesign now; U-11 UI skills/during mode preserved for future UI |
| U-31 | Receipt history is the primary received-goods record; group by approved draft ID | Latest explicit History clarification supersedes the combined layout. Separate searchable Stock activity for Take/Return and labelled Manager Opening; same-date receipts stay separate |
| U-32 | Shared access code only in explicitly enabled development demo mode | Server sessions retain separate roles; equal production passwords rejected. No individual Staff identity assurance |
| U-33 | Fix justified blank-line exclusion; temporary comparison-only image; bounded provider extraction; retained isolated tests | Latest pre-handoff task. No automatic comparison scan, automatic capture, live Gemini call, operational-data reset, commit/push/deployment or heuristic/pagination expansion |

Retained identities/assignments: U-01 eStock; U-07 leader/four names; U-10 English; U-11 ui-ux-pro-max + antislop during; U-15 existing Next.js/TypeScript/plain-CSS foundation. Historical verbal Orbyte workspace decision remains X-09, separate from written D2 rules. Old channel, fine-tuning, policy and numerical-evaluation defaults are historical, not active backlog.

## Explicit implementation clarifications

| ID | Clarification | Reason |
| --- | --- | --- |
| IC-01 | Opening permits nonnegative integer, including one zero Opening record; review-created product always starts 0 | Resolves source positive-quantity wording without double-counting receipt as Opening and Intake |
| IC-02 | Approved and Discarded drafts terminal; approval/edit/discard use revision/concurrency protection | Gives reliable page/retry/race behaviour; Approved immutable |
| IC-03 | Product edits cannot mutate stock or reinterpret posted base units | General stock corrections remain out of scope; retain immutable approval snapshots |
| IC-04 | Persistent event/request identity for Take/Return and approval; changed-payload reuse conflicts | Lost responses/concurrent requests cannot post twice |

These are behavioural clarifications, not quotations from the supplied PRD. Current implementation and executed checks are linked above; no live-provider/device/deployment acceptance is implied.

## Unresolved implementation decisions

| ID | Decision to make after explicit authorisation | Evidence needed |
| --- | --- | --- |
| OPEN-01 | pg and initial SQL implemented; versioned upgrades/hosted migration lifecycle remain open | Isolated schema tests and legacy preservation verified locally; no operational data reset |
| OPEN-02 | Replit own project/account/usage and deployment arrangement | PH §9.2/10.6 evidence; restart/redeploy persistence, not assumptions |
| OPEN-03 | X-03 RunPod clarification and historical proof completeness | Written organiser interpretation for hosted Gemini; actual historical own-account proof |
| OPEN-04 | Backend Google Gen AI SDK implemented; only `gemini-3.8-flash` is permitted. Live accuracy, tier/limits and retention remain open | No configured key or live call in this verification. Supported timeout/cancellation read via Context7; provider checks use test-only stubs |
| OPEN-05 | PostgreSQL hosting/plan/region, backups and judge access | Verify actual service, persistence and approved costs; no provisioning now |
| OPEN-06 | Opaque role sessions and development exception implemented; hosted lifecycle remains open | Retained backend permission tests; shared-account limitation explicit |
| OPEN-07 | New API/types/errors/idempotency/revisions/ownership map | One shared-contract editor; existing scripts need future scoped extension |
| OPEN-08 | Proposed palette and interaction details | DESIGN.md source direction; future measured contrast/mobile/keyboard Delivery Gate |
| OPEN-09 | Confirm required skill locations in future session | Resolve current catalog; preserve ui-ux-pro-max and antislop during |
| OPEN-10 | Bounds for image size/types, extraction schema and safe integer quantities | Actual synthetic cases/provider constraints; no invented performance claims |
| OPEN-11 | Alias collision/normalisation and P1 similarity contract | Explicit Manager selection and no variant merge; no image retention |
| OPEN-12 | Synthetic receipt fixture authorship/version and measurement plan | Team-created synthetic assets/ground truth; no business-pilot claims |

Historical OPEN-05/06 messaging options are superseded by the pivot; no WhatsApp/Telegram feature is needed. Assignments are resolved, but task availability/reviewers and submission artifact owners need confirmation.

## Team and submission facts

| Member | Assignment | University |
| --- | --- | --- |
| Marco Ryan Suseno | Leader / AI | Xiamen University |
| Riakudu Vittorios Surjoraharjo | Frontend | Xiamen University |
| Maximillion Cang | Data | Xiamen University |
| William Christiansen | System / backend | Xiamen University |

Retain SUB-01 leader contact/phone, SUB-02 portal identity matching, SUB-03 Discord/reveal attendance, SUB-04 workshop facts, SUB-05 deadline clarification, SUB-06 committee usernames, SUB-07 six final artifact/access links, SUB-08 platform proof, SUB-09 actual evaluation/timing, SUB-10 full tools/resources inventory, SUB-11 prior-work/licence/employment-IP answers, SUB-12 leader signature/date and SUB-13 latest portal/announcement checks. All require actual evidence; no unknown becomes None and no AI signs on behalf of the team. Private contacts stay in ignored `.private/TEAM_DETAILS.md`.

Historical RunPod run `20261021T110320Z` remains declarable despite no training in the current receipt MVP. Current proof is supplied in [RunPod POU PDF](../../submission/SDC2026_TooGoodToBeTrue_Runpod_POU.pdf) and [Technical & Tools Declaration, Appendix C](../../submission/SDC2026_TooGoodToBeTrue_TechDeclaration.pdf); raw run records remain Git history, not current submission files. Existing provenance gaps remain open. [Compliance IDs C-01–44 and conflicts X-01–09](../COMPLIANCE_MATRIX.md) stay separate from product decisions.

Record future decisions with date, decision maker, reason, status, impact and linked files. Update context, PRD, build handoff and submission narrative together. Documentation completion does not authorise code or establish submission readiness.
