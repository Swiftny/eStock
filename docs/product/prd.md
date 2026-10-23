# eStock: document-assisted inventory PRD

Version 2.1 · 23 October 2026 · TooGoodToBeTrue · SDC Hackathon 2026, Domain 2

**Approved requirements with a local implementation under verification.** Later user instructions authorised the PostgreSQL/Gemini `/demo`, receipt capture and pre-handoff revisions. The SQLite forecasting/replenishment system remains preserved legacy software. Current evidence and remaining limits are in the [MVP revision verification](../verification/MVP_REVISION_VERIFICATION_2026_10_23.md). Live Gemini extraction, physical camera/device behavior and deployment are not established by source or stub tests.

The product name remains **eStock**. Canonical working documentation is English; the [complete supplied Indonesian PRD](sources/PRD_ID_2026_10_23.md) is a labelled reference. The current user clarifications and [competition corrections](../COMPLIANCE_MATRIX.md) control where that source differs. [Prior documentation](../archive/2026-10-23-before-document-intake/README.md) is historical.

## 1. Problem, users and boundaries

eStock helps **one shop manage one warehouse**. Managers manually retype supplier-document lines into inventory and translate unfamiliar descriptions, abbreviations and supplier naming into the shop's recognised products. Managers know the products and suppliers; staff may not recognise every description. This is the team's problem hypothesis, not a claim of completed interviews or measured business loss.

Manager journey: photograph/upload supplier document → Gemini proposes structured document data → application suggests official-product/alias matches → manager reviews and corrects → manager confirms quantities actually received and approves Intake → stock and movement history update together.

Staff journey: search product → **Take** or **Return** → enter quantity → **Confirm** → see updated stock.

The MVP excludes forecasting, depletion predictions, reorder recommendations, purchasing policies, supplier outboxes, purchase-order generation/management, budgets and training requirements. It also excludes prices, subtotal, tax, RM/Rp amounts, revenue, margins, payments, financial reports, barcode requirements, mandatory user-entered SKU, shelf locations, multiple warehouses, automatic package conversion, damaged goods, general stock corrections, stocktakes, reservations, exports/spreadsheet primary storage, offline use and native mobile apps. Fine-tuning, RAG, embeddings, self-hosted GPU inference and a training pipeline are outside the new MVP. Historical GPU work remains declarable.

## 2. Roles and accounts

MVP accounts: one separate Manager account and one shared Staff account. The implementation uses server-resolved opaque sessions. A later explicit demo decision permits a shared access code only with `ESTOCK_DEMO_ALLOW_SHARED_PASSWORD=true` in development; production rejects equal passwords. This deliberate exception is not individual Staff identity assurance. Backend checks enforce every permission and response field, including direct requests and guessed URLs/IDs. Hiding buttons is insufficient.

| Capability | Manager | Staff |
| --- | --- | --- |
| View/search products and current stock | Yes | Yes |
| Create/edit product catalogue | Yes | No |
| Enter Opening during creation | Yes | No |
| Capture/upload document image | Yes | No |
| Read/edit/match/approve/discard drafts | Yes | No |
| Take and Return | Yes | Yes |
| Full History, including approval details | Yes | No |

History records server-resolved account ID and role. Shared Staff attribution identifies the shared account/role, **not the individual employee**. Individual staff accounts are future work. Product editing must not become an unaudited stock-correction path; a base unit cannot change once operational history would be reinterpreted. Handling such a unit change is outside MVP.

## 3. Product setup and stock rules

Manager creates a product with official name, one base unit and Opening stock; the application generates an internal ID. No SKU, barcode or shelf location must be entered. Empty startup has no products or stock transactions. Opening is recorded once with product creation, atomically with its initial balance.

| Operation | Stock effect | Quantity / authority |
| --- | --- | --- |
| Opening | Initial balance, once | Manager at creation; nonnegative integer clarification below |
| Intake | Increase | Positive integer; approved document lines only; Manager confirms physical receipt |
| Take | Decrease | Positive integer; Manager or Staff; insufficient stock rejected |
| Return | Increase | Positive integer; Manager or Staff; usable goods physically returned into warehouse |

Final operational quantities are integers in the product's base unit. Take cannot make stock negative, including concurrent requests. Return is not a cash refund and is not linked to a previous Take in this MVP; over-return risk remains visible in History. Damaged-goods handling and general corrections are out of scope.

**Implementation clarification IC-01: zero Opening.** The source's positive-transaction rule applies to Intake/Take/Return. Permit Opening = 0 as an explicit zero-balance catalogue setup, with one zero Opening record for traceability. Normal creation accepts a nonnegative integer. During draft review, an unknown product must be created with **Opening = 0**, regardless of the line's receipt quantity. The later approved line posts that quantity once as Intake. Example: new product, receipt 24 pcs → Opening 0 → approval Intake +24 → stock 24, never 48. If the draft is discarded, its zero-balance catalogue entry may remain; no receipt stock has been posted. This exception is a clarification, not a quoted source requirement.

Inventory lists all products, unit and current quantity. Search is case-insensitive over official names and confirmed aliases, with official identity shown to distinguish variants. **Low stock means quantity < 5**, including zero; exactly 5 is not Low stock. This is an indicator, not a reorder forecast.

## 4. Documents, receipt confirmation and units

A receipt, invoice, delivery note or order-detail image can supply text for a draft. **An image does not prove physical receipt.** Before approval the Manager must explicitly confirm that every approved quantity was actually received as usable goods. An order-only document or advance invoice may remain Draft or be Discarded; it must not automatically increase available stock. No purchase-order-management feature is added to resolve this distinction. The AI cannot count hidden carton contents, verify delivery or inspect actual product condition.

Gemini extracts raw names, quantities, units, document dates and uncertainty. The application matches official names and Manager-confirmed aliases. Ambiguous or colliding aliases require Manager selection; unknown products can be created during review. Do not silently merge sizes/colours/variants. Saving an alias changes application data and **does not retrain Gemini**.

One product has one base unit. Manager manually converts boxes/cartons to that unit during review; no conversion is inferred or saved as an automatic rule. Preserve the raw document quantity/unit separately from approved base-unit quantity/unit. Illustration only: raw 2 boxes, manager verifies 12 pcs/box, approved 24 pcs. An unknown factor blocks approval until corrected; the AI must not invent it.

Preserve extracted values separately from corrected/approved values, including dates and raw supplier descriptions. Manager can edit line/date, choose/create product, confirm an alias, save progress, approve or discard. Every included line must be valid. Unresolved/unwanted lines must be explicitly resolved or excluded with traceable review before approval; no silent dropping of uncertain lines.

## 5. Draft lifecycle, dates and reliability

Business statuses: **Draft → Approved** or **Draft → Discarded**. Structured Drafts survive page closure and application restart. Closing or discarding an unapproved draft changes no stock. Approved drafts, final lines and movements are immutable; no reapproval or editing. Discarded drafts are terminal. Extraction processing/failure labels are separate from these business statuses.

Approval must recheck Manager permission, expected draft revision, status, selected products, positive integer base-unit quantities, required date and explicit actual-receipt confirmation. One transaction commits **all approved lines, stock changes, Intake movements, actor/time and Approved status**, or rolls back the complete approval. Multiple lines for one product are handled consistently within that same transaction.

A draft can affect stock only once. Persist request identity and input fingerprint; retries after a lost response return the committed result without more stock. Same key with changed input conflicts. Concurrent approvals yield one committed approval; a stale edit/approval or edit racing approval conflicts and refreshes. Draft edits use expected revision protection. Take/Return also use persistent event/request identities, transactional writes and safe retry semantics. Exact schema, locking and API paths are future coordinated decisions; see [stock specification](../engineering/STOCK_TRACKING.md) and [OCR intake specification](../engineering/OCR_INTAKE.md).

**FR-16 is P1:** a warning for similar date/lines across separate documents may follow. One-draft approval protection does not prevent a duplicate image uploaded as a new draft. Date alone is not a document identity. Until P1, Manager review/History is the operational safeguard; do not promise global duplicate-upload prevention.

**Document date** is extracted or Manager-corrected and required before approval. **Approved at** is generated by the server when approval commits. Preserve both and the source values. Ledger event time follows actual server-recorded posting; an earlier document date does not backdate inventory. Store unambiguous timestamps and present all times consistently in **Asia/Kuala_Lumpur (MYT, UTC+8)**. A date-only printed value remains a date, without invented time-of-day.

**Latest History clarification:** Manager History opens on **Receipt history**, the primary record of approved goods entering the warehouse. One entry groups every approved Intake line by its persisted draft ID, never by date or timestamp. Two receipts on the same date remain separate. Summary shows document date, official products and approved quantities; details retain raw and reviewed values/units, server approval time in MYT and Manager account. Pending/discarded documents stay in Drafts. **Stock activity** separately shows Take/Return with signed quantities, unit, event time and server-resolved Manager or Shared Staff attribution. Opening remains discoverable and explicitly labelled Manager opening balance. Both sections have simple search/filter controls; full History remains Manager-only.

## 6. AI, storage and privacy targets

Current local stack: **Next.js/TypeScript**, **PostgreSQL** through pg, and backend **Google Gen AI SDK** extraction, with a server-configurable default Gemini model. These implementation choices do not establish successful live OCR, hosted persistence or provider retention. PostgreSQL hosting/plan and deployment remain unresolved. See the lockfile and verification report for installed versions and measured checks.

Gemini runs through the backend; its API key is a server secret. It creates a draft and has no stock mutation authority. Backend validation remains mandatory even with structured-output mode. Missing/invalid quantities, dates and uncertain product selections must be corrected. Provider/network failures change no stock; persisted structured drafts stay available. Mock output must be labelled **Mock extraction**, never successful live OCR. Instructions embedded in images are untrusted document content, not commands.

Allowlist non-monetary structured fields. Ignore price, subtotal, tax, RM/Rp amounts, revenue, margin and payment data. Do not store the complete raw provider response if it would retain excluded monetary fields or image data; preserve only necessary extracted fields and safe provenance.

**No permanent uploaded images** in application database, disk, object storage, browser storage, logs, telemetry or caches. Transient upload/preview/model processing is allowed. Future implementation must verify request-body capture, temporary-file behaviour, caching and failure cleanup across app and hosting layers. Reopened drafts contain structured data without the original image; tell the Manager to **re-upload the image if needed later**. Re-upload for comparison must not silently create/post a second Intake. Team-created synthetic image fixtures are authored test assets, distinct from retained user uploads.

This eStock policy does **not** establish Gemini zero retention. Before a separate real-world pilot, verify provider terms, account tier, processing/retention, data transfers and applicable privacy obligations. No real business receipts belong in the hackathon. All receipt images, supplier details, products, operational and evaluation records must be team-created synthetic data under Domain 2.

## 7. Functional requirements and coverage

FR IDs are retained from the supplied PRD. The catalogue specifies acceptance; actual checks and Unverified behavior are recorded in the verification report. P0 is the core; P1 follows only after the core works.

| ID | Priority | Requirement / strengthened acceptance | Acceptance cases |
| --- | --- | --- | --- |
| FR-01 | P0 | Separate Manager/Staff permissions, including backend denials and full-History restriction | AC-01, AC-02, AC-17 |
| FR-02 | P0 | Manager product creation: official name/base unit/Opening/internal ID, no mandatory SKU | AC-03, AC-04 |
| FR-03 | P0 | One atomic Opening record; zero-Opening clarification explicit | AC-04, AC-12 |
| FR-04 | P0 | Manager capture/upload; failure changes no stock | AC-02, AC-07, AC-20 |
| FR-05 | P0 | Validated structured Gemini draft, monetary fields excluded | AC-07, AC-08, AC-20 |
| FR-06 | P0 | Persist structured Draft; closure/discard causes no stock | AC-09, AC-18 |
| FR-07 | P0 | Official-name/confirmed-alias matching; ambiguous match needs Manager | AC-05, AC-06 |
| FR-08 | P0 | Correct lines/date, choose/create product without rescanning | AC-05, AC-08, AC-10, AC-12 |
| FR-09 | P0 | Actual-receipt confirmation; atomic once-only approval and immutable result | AC-11, AC-13, AC-14, AC-19 |
| FR-10 | P0 | Positive integer Take; no negative stock, including concurrency | AC-15, AC-16 |
| FR-11 | P0 | Positive integer usable Return; persistent retry protection | AC-16, AC-17 |
| FR-12 | P0 | Case-insensitive product search, official identity and current stock | AC-05, AC-22 |
| FR-13 | P0 | Complete Inventory and strictly-below-5 Low stock | AC-03, AC-21 |
| FR-14 | P0 | Manager Receipt history grouped by approved draft identity, all Intake lines/raw/final values/MYT approval/account; separate searchable Stock activity and distinguishable Opening | AC-11, AC-17, AC-23 |
| FR-15 | P0 | No permanent uploaded image anywhere in application storage/log/cache chain | AC-18, AC-20 |
| FR-16 | P1 | Similar-document warning across drafts; Manager decides | AC-24 |

## 8. Acceptance catalogue for future implementation

| ID | Scenario | Required outcome |
| --- | --- | --- |
| AC-01 | Manager and shared Staff sign in separately | Backend resolves role; body/URL cannot grant Manager privileges |
| AC-02 | Staff directly calls product create/edit, upload, draft read/edit/approve/discard or full History | Denied server-side without data disclosure or mutation |
| AC-03 | Empty startup, Inventory/search | No preloaded operational products; useful empty state; Manager can start setup |
| AC-04 | Product with Opening 7, then retried creation | One product/Opening; stock 7; Opening 0 permitted under IC-01; fractions/negative rejected |
| AC-05 | Unknown name, case variation, different variants | Search/matches display official identities; Manager selects or creates; variants never silently merged |
| AC-06 | Alias collision across two products | Ambiguity shown, no automatic stock target; confirmed alias records remain traceable |
| AC-07 | Blur, missing date/quantity, invalid JSON/schema or nonfinite quantity | Clear correction/failure state; no automatic stock or invented certainty |
| AC-08 | Manager corrects draft fields | Raw values remain separate from reviewed values; required fields gate approval |
| AC-09 | Close/reopen/restart and discard Draft | Structured progress persists; no stock until approval; discard changes no stock |
| AC-10 | Raw 2 boxes, manually confirmed 24 pcs | Raw quantity/unit and final integer/base unit retained; no automatic conversion |
| AC-11 | Multi-line approval, older document date | All stock/movements/status commit together; date and server Approved at preserved; ledger not backdated |
| AC-12 | Create unknown product for line of 24 pcs | Opening 0; later Intake +24 once; discard leaves no receipt stock |
| AC-13 | Inject failure after one approval line | Complete rollback, including status/lines/movements/balances; corrected retry can commit once |
| AC-14 | Two approvals, lost response/retry, simultaneous edit, changed-payload key reuse | One stock effect; replay returns saved result; stale/changed requests conflict; Approved remains immutable |
| AC-15 | Two Takes of 4 against stock 5 | At most one succeeds; balance never negative; rejected request has no movement |
| AC-16 | Invalid/insufficient Take, retried Take/Return after lost response | Reject zero/negative/fractional; successful event posts once; changed-input replay conflicts |
| AC-17 | Shared Staff Take/usable Return | History attributes shared account/role; no individual employee claim; Return has no prior-Take linkage or refund |
| AC-18 | Reopen structured Draft after preview closure/restart | No original image available; re-upload notice; storage/log/cache inspection finds no retained upload |
| AC-19 | Order-only image or advance invoice, goods not received | Draft only; approval blocked without Manager confirmation of actual quantities received |
| AC-20 | Provider timeout/error, mock extraction, embedded image instructions | No stock change; retry/re-upload path clear; mock/live distinguished; embedded text never grants authority |
| AC-21 | Balances 0, 4, 5, 6 | Low stock at 0/4 only; no forecast or order action |
| AC-22 | Phone/desktop, keyboard, long names/errors | Search/Take/Return/upload/review usable; controls labelled; focus and status legible; no essential horizontal overflow |
| AC-23 | Approved draft then catalogue edit/history view | Approval snapshot immutable and comprehensible; all stock reconciles to movements; Manager-only full History |
| AC-24 | Separate uploads with similar dates/lines (P1) | Warning supports Manager judgement; distinguish two genuine deliveries; never claim P0 prevents all duplicate uploads |
| AC-25 | Approved Replit deployment refresh/restart/redeploy | Products, drafts, identities and ledger persist; judge access works; record own-project evidence and actual limits |
| AC-26 | Product/alias changes during review/approval; same product on several lines | Transaction uses valid selected IDs/base units, detects relevant stale revisions and applies each approved line once |

This PRD is not a test report. Local automated/browser results belong in the linked verification evidence; no live OCR accuracy, task-timing, interview, pilot or deployment result is established here.

## 9. Domain 2, measurement and delivery

Complete journey: **trigger** synthetic supplier-document upload → **connected information** extracted non-monetary lines + catalogue + aliases + current stock → **rules/AI** extraction plus deterministic matching/validation → **authorised human approval** Manager confirms physical receipt and reviewed base-unit quantities → **visible result/activity log** Inventory and immutable Intake History commit together. Staff movements continue the explainable stock record.

Reusable Orbyte-hub fit: a product catalogue, document-intake module, permission boundary and approval/activity contract could connect to hub identity and audit services for other SMEs. This is a proposed capability, not a working Orbyte integration or supplied live API. The separate verbal workspace requirement remains X-09. One-shop/one-warehouse MVP does not claim implemented multi-tenant support.

Measure field/line extraction correctness, correction rate, time from upload to reviewed approval, manual-entry comparison, invariant failures and unaided task completion using fixed synthetic cases. Publish sample size, case mix, errors, model/configuration and mock/live mode. No numerical OCR accuracy or savings result exists. [Proposal](../submission/PROPOSAL_DRAFT.md) assumptions/targets need measurement and team review. SDG 8.2/8.3 fits reduced recurring administrative effort; do not claim environmental gains without evidence.

Replit is mandatory (PH §9.2), with own-account/project proof (§10.6). PH §9.3 requires RunPod for work needing a GPU; §10.7 requires proof from teams that used it. Hosted Gemini does not resolve the sample's broader Required wording (X-03). Obtain written clarification; do not invent an exemption or introduce GPU features solely for compliance. Historical RunPod/training usage/evidence must still be declared.

The [five-stage build plan](../plans/BUILD_PLAN.md) is a handoff only. [All six preliminary deliverables](../SUBMISSION_CHECKLIST.md) remain required. Deadline conflict: PH/earlier orientation **25 October 2026, 07:59:59 AM MYT**; public website/FAQ **25 October 2026, 11:59 PM MYT**. Use the earlier cutoff; internal target **24 October 2026, 20:00 MYT**. Preserve genuine history, signatures, attendance checks, Apache 2.0 and post-deadline freeze. Private Discord, logged-in portal and recordings were not verified in this update.
