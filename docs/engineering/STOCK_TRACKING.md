# Inventory and movement ledger: future specification

23 October 2026. **Target specification; not implemented.** The existing SQLite stock API and historical verification remain legacy. The [pre-pivot agreement](../archive/2026-10-23-before-document-intake/docs/engineering/STOCK_TRACKING.md.txt) preserves old endpoint examples and results. Do not assume those permissions, movement names, decimal quantities or endpoints satisfy this specification.

Read the [PRD](../product/prd.md), [OCR approval contract](OCR_INTAKE.md) and [integration rules](../team/integration.md). No library-specific code or migration instructions are prescribed here. Future implementation must first follow AGENTS.md Context7 rules and installed Next.js documentation.

## Data and invariants

PostgreSQL is the target structured database; hosting, ORM, schema and migration are undecided. Do not convert or delete the legacy database during planning. Products have an automatic internal ID, official name, one base unit, timestamps and catalogue revision. No mandatory SKU/barcode/shelf location. Accounts distinguish a separate Manager and one shared Staff account.

Every product balance must reconcile to its ledger: **Opening + Intake − Take + Return**. If materialised balances are used, they and movements must change in the same transaction and never form independent writable sources. Final quantities are integers in the product's base unit. Persist actor account/role from the server, event time, positive movement amount/direction, resulting balance or reproducible ordering, request/event identity, and source approval/line where relevant. Use stable server posting order to explain concurrent events; display MYT.

| Type | Rule |
| --- | --- |
| Opening | Manager creation only, once; nonnegative integer; IC-01 permits a zero Opening for zero-balance catalogue setup |
| Intake | Positive integer, from an approved document line only; Manager confirms actual usable goods received |
| Take | Positive integer; both roles; transaction must reject insufficient current stock |
| Return | Positive integer; both roles; usable goods physically returned; no refund or previous-Take link |

General adjustments, damaged goods, sales accounting, fractional stock and purchasing flows are not active-MVP operations. Catalogue edits cannot rewrite balances or approved historical identity/unit snapshots. Base-unit changes that reinterpret posted stock must be rejected. Manager may edit other catalogue details with revision/audit; do not silently remap variants or aliases.

## Permission and read contracts

These are capabilities to agree before API paths/types are chosen, not implemented routes.

| Capability | Server authority | Contract essentials |
| --- | --- | --- |
| Inventory/search | Manager, Staff | Official product ID/name/base unit/current stock, Low stock; case-insensitive names/aliases; no draft/full-History leakage |
| Create/edit product | Manager | Name/base unit/Opening on create, generated ID, expected revision on edits; no arbitrary stock field updates |
| Post Take/Return | Manager, Staff | Product ID, operation, positive integer quantity, persistent event/request identity; server actor/time |
| Full History | Manager only | Opening/Intake/Take/Return, document and approval context, raw/final values, actor account/role, server time/order |
| Draft lifecycle/Intake | Manager only | See OCR_INTAKE.md; generic movement requests cannot bypass approval |

Reject missing/expired identity, wrong role, guessed inaccessible IDs and caller-supplied role escalation. Read permissions matter as well as writes. The Staff confirmation can show its successful operation/current stock without exposing full History. Shared Staff actor identifies the shared account, not a named employee. D2 permits simulated identity foundations; the future backend role checks must still be effective and the account limitations labelled honestly.

## Transaction and retry contract

1. Resolve the authenticated account/role server-side and validate allowed fields, product and unit semantics.
2. Identify one intentional event with a persistent request/event ID and canonical input fingerprint, scoped to account/shop and operation as appropriate. Same ID + same input replays the saved committed result; same ID + changed input conflicts. A duplicate with a different transport request key must still match the original business event identity.
3. Inside a database transaction, serialise changes to the product balance or use an equivalent atomic conditional update. Check available stock **in that transaction**. Two Takes of 4 against 5 cannot both succeed.
4. Commit event identity, movement, balance and response identity together. Failure rolls back everything; an uncertain client response retains the same event ID on retry. Refetch current Inventory after replay because another event may have changed stock since the saved result.
5. Do not treat disabled buttons or a pre-request balance check as concurrency protection. Define bounded database retry/conflict handling; retry the complete transaction with the same event identity. Do not create a new event on automatic retry.

Opening/product creation is atomic and idempotent. Unknown-product creation during review uses Opening 0; the receipt quantity appears only later as Intake. Draft approval locks/checks the draft revision/status and updates all affected product balances/movements in one transaction; agree deterministic product lock order to reduce contention. Precise PostgreSQL mechanisms require current documentation and future design review.

## History and UI targets

Document date is metadata, separate from server Approved at and posting time. Earlier printed dates never backdate balance mutations. Approved line/name/unit snapshots are immutable even if product display names change. Empty startup has no operational fixtures. Low stock is **strictly <5**, including zero, with a textual indicator; exactly 5 is normal.

Manager: Inventory, Add product, draft review and full History. Staff: searchable stock list, Take/Return, quantity, Confirm and visible updated stock. Preserve submitted inputs and event identity when requests fail/are uncertain; require a new intentional confirmation for a new event. Useful loading, empty, validation, conflict and failure states are future acceptance requirements, not verified UI.

## Verification to implement later

PRD AC-01–04, AC-12–17, AC-21–23, AC-25–26 cover role denial, empty startup, Opening, integer rules, simultaneous Take, persistent retries, shared-account attribution, ledger reconciliation, responsive use and deployment durability. Include real database concurrency/failure-injection cases, not only mocked UI checks. No tests were added or run in this documentation task. Historical reports remain unchanged and do not verify PostgreSQL.
