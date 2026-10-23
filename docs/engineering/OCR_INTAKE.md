# Extraction, preparation and Staff receiving contract

24 October 2026. The [PRD](../product/prd.md) and [current verification](../verification/STAFF_RECEIVING_2026_10_24.md) replace the old new-receipt Manager-approval authority. Historical APPROVED records remain unchanged.

Manager-only extraction/matching/draft APIs retain transient images, validated allowlisted output, exact/alias matching and manual conversion. New review products use Opening 0. Sending validates date, exclusions, selected active product versions and positive expected base-unit integers. A send transaction freezes `estock_receipt_submissions` + `estock_receipt_lines`, changes DRAFT to AWAITING_STAFF and inserts a deduplicated Staff notification without stock effects.

| Endpoint | Session authority | Effect |
| --- | --- | --- |
| `POST /api/estock/drafts` | Manager | Transient image → structured preparation draft |
| `GET/PATCH /api/estock/drafts/:id` | Manager | Read/save with expected revision |
| `POST /api/estock/drafts/:id/send` | Manager | Freeze validated submission; request identity; notify Staff |
| `POST /api/estock/drafts/:id/recall` | Manager | AWAITING_STAFF + expected revision → DRAFT; resolve pending notification |
| `POST /api/estock/drafts/:id/discard` | Manager | DRAFT → DISCARDED; no stock |
| `POST /api/estock/drafts/:id/approve` | Manager | Retired, 410; cannot mutate stock |
| `GET /api/estock/receiving` | Staff / Manager | Staff pending checks / Manager completed Staff receipts |
| `GET /api/estock/receiving/:id` | Staff / Manager | Frozen checking details; Staff cannot read general drafts or recalled checks |
| `POST /api/estock/receiving/:id/confirm` | Staff only | Physical declaration; actual quantities and stock post atomically |
| `GET /api/estock/notifications` | Either | Session-role scoped notifications and unread count |
| `POST /api/estock/notifications/:id/read` | Owning role | Persist read state only |

Confirmation requires requestId, expectedRevision, confirmReceived=true and exactly every included submitted line ID with MATCH (no difference), SHORT or EXTRA (positive safe integer difference). Actual quantity is expected plus/minus difference, may be zero, cannot be negative/unsafe. Foreign/excluded/duplicate IDs and stale versions fail. Client quantities do not directly set balances. Expected values and extracted fields remain separate from actual results.

`receiving.ts` locks the receipt then all selected products in sorted ID order. It commits line outcomes, check identity, positive actual Intake, product balances, receipt completion, Staff notification resolution and required Manager discrepancy notice together. `estock_receipt_checks` has one row per draft; movements retain unique `intake:<line ID>` identity. Request keys use persisted fingerprints/results. Same-key replay returns the committed result; different keys cannot repost the receipt. Zero actual creates no movement, but keeps the line/check/completed receipt. Matching deliveries create no Manager discrepancy alert.

A deleted product blocks the entire check. Manager uses Recall to correct, selects an active replacement (or valid exclusion), saves and sends a new revision. Existing immutable submissions remain evidence. Races among recall/check/archive serialize on rows; never post to a hidden product. Catalog renames do not alter the submitted name/unit snapshot. Historical receipts use their original ledger snapshots.

Document date is separate from Manager sent time, shared Staff checked time and posting time. Only historical APPROVED rows have Manager approval attribution. New History is sourced from receipt/check records, including zero-Intake deliveries, rather than assuming every completed receipt has a movement.

Polling runs every eight seconds and on window focus, with an in-flight guard and cleanup/abort. A displayed Staff submission stays fixed across polling: a new revision disables confirmation until Staff explicitly uses Reopen latest check, clearing old difference entries. Notification reads never alter inventory. No external messaging service exists.

Application images are not retained: saved drafts contain structured fields only; comparison images are temporary and do not rescan. Provider timeout is 45 seconds, one SDK attempt; extraction is outside stock transactions. No monetary data or document instructions can grant stock authority. Live provider accuracy/retention, physical capture and hosted durability remain separate unverified work.

Migrations: `db/estock/migrate.mjs` is shared by `ready()` and `scripts/estock-migrate.mjs`; ordered numbered SQL files run once per schema under transaction/advisory lock. Existing unversioned 001 schemas are adopted via idempotent 001, then additive 002. Never edit only CREATE definitions or reset volumes. See [README](../../README.md).
