# eStock: document-assisted inventory PRD

Version 3 · 24 October 2026 · TooGoodToBeTrue · SDC Hackathon 2026, Domain 2.

The user's confirmed Staff-receiving revision supersedes Manager physical-receipt approval for **new** receipts. One shop, one warehouse. Canonical text is English; the [supplied Indonesian source](sources/PRD_ID_2026_10_23.md) and [archived history](../archive/2026-10-23-before-document-intake/README.md) remain unchanged. Implementation evidence belongs in [revision verification](../verification/STAFF_RECEIVING_2026_10_24.md), not in this requirements document.

## Users and journey

Manager scans a synthetic supplier document → backend Gemini extracts non-monetary fields → application suggests catalogue/alias matches → Manager corrects descriptions/date, resolves products and manually converts expected quantities into base units → **Send to Staff** → shared Staff checks physical goods → **Confirm received goods** immediately posts actual received quantities once → Manager receives an informational alert for differences. **No subsequent Manager approval.**

A document is text evidence, never delivery proof. Staff confirmation declares physical receipt, including a missing line or an entirely missing delivery. Orders and advance invoices cannot automatically add stock. Manager and Staff also search Inventory and perform Take/usable Return.

## Permission matrix

Server sessions resolve one Manager account and one **shared Staff** account. The development shared-password exception remains explicit and unavailable in production; shared Staff is not an individually identified employee.

| Capability | Manager | Shared Staff |
| --- | --- | --- |
| Active Inventory/search, Take, usable Return | Yes | Yes |
| Create/edit/Delete product; Opening | Yes | No |
| OCR upload, preparation drafts, matching, aliases, discard | Yes | No |
| Send/recall/correct/resubmit prepared receipt | Yes | No |
| Pending checks and frozen checking details | Inspect own preparation | Yes |
| Confirm physical receipt and actual quantities | No | Yes |
| Full Receipt history and Stock activity | Yes | No |
| Notifications and read state | Manager scope | Staff scope |

Direct API calls and invented roles/IDs cannot broaden permissions. The retired Manager `/approve` path returns 410 and cannot post stock.

## Quantities, catalogue and deletion

Inventory rows have only Take/Return. Manager opens a secondary **Manage products** screen for Edit and individual Delete, with a visible **Back to inventory** control. A separate **Delete all inventory** action permanently removes every active/archived product, its live balance and aliases. It requires an explicit Delete/Cancel confirmation, Manager permission and server validation. No UI deletion requires typing a phrase; the frontend supplies the existing API confirmation token automatically after the final click. Receipt/activity snapshots remain with no live product link; pending checks return to Drafts with product mappings cleared so Manager can correct/resend. The entire operation is atomic and retry-safe. This later user-authorised bulk action is distinct from the single-product archive described below.

Products have a generated ID, official name and one base unit; no mandatory SKU, barcode or shelf. Opening is a nonnegative integer recorded once at creation. New products created during receipt preparation start at **Opening 0**. Intake, Take and Return movements are positive integer amounts. Balances reconcile to Opening + Intake − Take + Return.

Take is bounded by **current available stock** for both roles. Show availability, prevent the stepper exceeding the maximum, visibly invalidate typed/pasted excessive values, allow an empty intermediate input, disable submission for invalid values and disable Take at zero. The server locks and rechecks current stock. A stale request fails clearly and the dialog refreshes availability. Return has no current-stock maximum and means usable physical goods, with no refund or prior-Take linkage.

Manager Delete is soft deletion, including when stock is positive. Exactly one accessible confirmation names the product and stock and explains retained history. Cancel changes nothing; persistence succeeds before the active row disappears. Store archive actor/time and remaining-stock snapshot; retain identity, ledger and receipt references. No fabricated Take, cascade deletion or silent reactivation. Exclude archived products from active list/search/counts/Low stock, matching and Take/Return. Low stock is strictly below 5, including zero.

Deleting a pending receipt's product blocks confirmation without posting. Manager recalls, selects an active replacement or corrects lines, then resubmits a new revision. Archive and stock mutations serialize on product locks.

## Preparation and immutable submissions

Official product prefills for a unique normalized exact name/confirmed alias or one sufficiently strong similar active product. Preserve numbers and recognized size/unit/colour distinctions, leave ambiguous candidates unselected and allow Manager to override. Older unmapped drafts receive the same suggestion when opened; reading does not persist it until Save/Send. A saved manual product choice must not be replaced automatically. Matching is local and adds no Gemini request or automatic stock movement.

Statuses: **DRAFT → AWAITING_STAFF → RECEIVED**, with discrepancy flag; DRAFT may become DISCARDED. AWAITING_STAFF may be recalled to DRAFT before Staff confirmation. Historical APPROVED remains terminal with original Manager attribution and is never re-sent/reposted.

Keep extracted raw name/quantity/unit/date, Manager corrections and expected base-unit quantities, and Staff actual outcomes separately. The draft form places the extracted name and date in editable fields and prefills positive whole-number quantities in Expected quantity, even when a product is unmatched. Manager can change the quantity directly or use adjacent increment/decrement controls. Fractional or unreadable quantities remain empty. Manager resolves missing dates, unknown/ambiguous products, aliases and conversion before sending. The form uses one editable column, with a short inline cue on uncertain lines; it has no separate source-text column, product-match badge or comparison-image picker. Explicit non-stock exclusions retain reasons. Saving/extracting/sending does not add stock. Alias confirmation changes application matching, not Gemini training.

Send validates every included line and catalogue revision, freezes document date/product name/unit/expected quantity in an immutable submission revision, and creates one persisted Staff notification atomically. Submitted details cannot be edited silently. Recall resolves the old notification; correction and resubmission produce a new frozen revision. An old Staff tab cannot confirm the new version. Background polling keeps its displayed snapshot and actual-count edits fixed; explicit Reopen latest check resets counts to the new expected quantities before adopting a resubmission.

## Staff checks and atomic posting

Pending checks show compact product rows with catalogue names, base units and expected quantities. A disclosure arrow on the left of each row opens its **How much did you receive?** input, initially filled with expected. Staff edits only rows whose physical count differs, including 0 for missing goods; untouched rows use expected. Edited quantities and invalid-input cues remain visible in collapsed rows. There are no All items match/Report differences modes, per-line difference checkboxes or manual Short/Extra selectors. Editing fields never mutates stock.

The server derives MATCH when actual equals the frozen expected quantity, SHORT when actual is lower, and EXTRA when actual is higher; difference is the absolute gap. Actual may be zero but never negative, fractional or unsafe. Every included line needs an actual quantity. Reject foreign, excluded, duplicated or invented line IDs, missing quantities, unsafe/fractional/negative values and stale revisions. Persist the derived outcome/difference for History and discrepancy notifications.

Example: Lamp 5W starts at 10, expected 20, Short 2 → actual Intake 18 → stock 28. Lamp 10W expected 20, Extra 3 → actual Intake 23. Do not post expected quantities first or adjust pre-existing stock. Zero-received lines remain in check/history with no Intake movement. An entirely missing delivery remains a completed receipt and generates a discrepancy notification.

One transaction locks receipt/status/revision and products in sorted order; validates the whole check; writes actual results, positive Intake movements, balances, check identity/time, RECEIVED state, notification resolution and required Manager discrepancy notification. Any failure rolls back all of it. Same request identity/input replays its committed result; changed payload conflicts. Receipt row locking, one check per receipt and unique line Intake identities prevent different request IDs/tabs/double-clicks posting twice. No provider call occurs inside posting.

## Notifications, navigation and History

Notifications persist in PostgreSQL with role-scoped reads/counts/read timestamps. Staff receives pending-check notifications; completed/recalled checks cease being actionable and stop contributing unread work. Matching receipts do not create urgent Manager alerts. Differences create one informational Manager alert showing products, expected/difference/actual and confirmation time; stock is already updated. Opening/reading notifications never checks goods or changes stock. Compact drawer has empty/loading/error/retry states. Eight-second polling and focus refresh do not overlap; unmount cancels requests, timers and listeners.

**Latest navigation clarification, 24 October:** Inventory is the default page after sign-in and replaces Stockroom. The header contains Inventory, Scan receipt, Drafts and History for Manager, or Inventory and Pending checks for Staff. The account role appears immediately before Notifications. Sign in/Sign out controls belong on the public landing, reflecting the current session. There are no Back to Stockroom or Back to Inventory buttons; header navigation and browser Back remain available. Page headings omit Manager/Staff workspace labels and use a short, single-line description. Navigation underlines and page entrances follow the existing landing motion with reduced-motion support. No Recent activity feed or separate home dashboard.

Opening the desktop camera brings the complete preview and capture controls into view below the header, including on short viewports. Preparing/capturing a photo must preserve the viewport rather than collapsing the media area. The selected image has Retake photo and Remove image actions; cancelling a retake retains the previous image. Native mobile capture remains available. History's default Movement type text uses the same placeholder styling as Search stock activity; selecting a specific type uses normal input text styling.

Drafts shows only DRAFT and AWAITING_STAFF. Manager Receipt history groups completed receipts by persisted draft identity, including entirely missing deliveries, and shows discarded drafts. Show Manager prepared/sent time, shared Staff checked time and stock posting time. Document date remains separate from server timestamps; display MYT. Historical APPROVED records preserve original Manager approval time/account. A Manager-only Clear history action permanently deletes terminal receipt/draft records and their notifications after an explicit in-page confirmation. It retains stock balances and the minimal movement ledger, but detaches source-document fields and references from those Intake movements; old cleared receipts can no longer support duplicate-document warnings. Active drafts and pending Staff checks are not cleared. Stock activity separately shows Take/Return and Manager Opening. Archived references stay readable.

## Storage, upgrades and acceptance

Manager can permanently clear all current Stock activity after an explicit click confirmation. The application deletes individual Opening/Take/Return event details, keeps only their combined delta per product for balance reconciliation, preserves Intake/receipt evidence and current stock, and retains minimal retry identities to prevent duplicate posting. A separate **Clear notifications** action also uses click confirmation and deletes only the signed-in account's notifications, including unread ones. Pending receiving checks remain available and future notifications still arrive. Both clear actions show their consequence, a destructive final button and Cancel; no typed confirmation or automatic clearing.

Use Next.js/TypeScript, pg/PostgreSQL and backend Gemini. Uploads are transient, 6 MiB JPEG/PNG/WebP; decodable large or alternate browser formats may be resized to JPEG in memory before upload. Extraction uses one SDK attempt per operation and at most one extra operation for numeric provider HTTP 503, without an application-imposed 45-second deadline; show ongoing progress while waiting and surface provider/network/hosting failures. Show the extracted date directly in the editable Document date field, while preserving a distinct candidate in storage until Manager saves or sends. Persist structured allowlisted fields, never uploaded image bytes/full provider dumps/monetary fields in application storage, logs or caches. Embedded instructions are untrusted data. Application non-retention does not establish provider zero retention; live tier/terms/hosting need separate verification before a real-world pilot.

Versioned ordered SQL migrations run through the same transaction/advisory-lock runner for explicit setup and application initialization. Existing products, ledger, drafts, completed Manager receipts and compatible sessions survive upgrades. No reset/truncate/volume deletion. Test fresh schema and populated initial-schema upgrade using owned synthetic schemas. No operational stock fixtures or paid live AI calls.

Acceptance covers both-role Take boundaries/staleness/concurrency, Delete Cancel/success/permission/history/races, send with unchanged stock, matching and discrepancy check posting, zero lines/all missing, retry/double-click/revisions/invalid IDs, complete rollback including notifications, role/read/unread persistence, archive correction/resubmission, migration preservation, Stockroom/task/Back navigation, mobile widths, keyboard/focus/dialogs, error/loading/empty and reduced motion. Run retained tests, scoped lint, types, production build and actual isolated browser journeys; record results and limits separately. A small exploratory OCR sample does not establish all-document accuracy; physical cameras, real devices and hosted durability need actual evidence.

## Competition and measurement

Use only team-created synthetic products, documents, suppliers and evaluation data. No forecasts, purchasing/outbox/POs, prices/budgets/training, automatic package conversion, general adjustments, damaged-goods operations, multiwarehouse/offline/native app promises or external messages. Similar-document warnings remain P1 and are narrower than duplicate-upload protection.

Explain trigger → connected catalogue/extraction → rules/AI → Manager preparation and authorised Staff physical declaration → visible inventory/history. Orbyte hub integration is proposed, not connected. Preserve X-09 verbal workspace clarification and X-03 RunPod wording conflict; declare historical RunPod run `20261021T110320Z`. Replit and own-project proof remain required and unverified by local tests. Measure extraction correctness/correction rate/task times with declared sample/model/mode; no invented interview, accuracy, savings or pilot claims.

All six preliminary deliverables, genuine history, Apache 2.0, signatures/access/attendance/workshop checks remain required. Earlier cutoff **25 October 2026 07:59:59 MYT** controls pending authoritative clarification; internal target **24 October 20:00 MYT**. [Compliance](../COMPLIANCE_MATRIX.md) and [submission checklist](../SUBMISSION_CHECKLIST.md) retain unresolved requirements. No commit, push, publication, provisioning, purchase or external message is authorised.
