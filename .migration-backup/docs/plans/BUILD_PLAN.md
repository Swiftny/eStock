# eStock: implementation handoff and remaining acceptance

23 October 2026. **Later explicit user instructions authorised local implementation and verification.** [Current evidence](../verification/MVP_REVISION_VERIFICATION_2026_10_23.md) supersedes the earlier not-started status. [PRD](../product/prd.md) and [decisions](../product/DECISIONS.md) include the latest Receipt history/Stock activity clarification. [Old dated plan](IMPLEMENTATION_2026_10_21.md) and [prior build plan](../archive/2026-10-23-before-document-intake/docs/plans/BUILD_PLAN.md.txt) remain historical.

## Implemented local revision: 24 October 2026

Manager extracts/corrects/matches expected base-unit quantities and sends a frozen revision to shared Staff. Staff confirms physical goods with Match/Short/Extra; actual quantities immediately post once. Required discrepancy alerts commit with results/stock/movements. Historical Manager-approved receipts are preserved without reposting. [Current source and actual verification](../verification/STAFF_RECEIVING_2026_10_24.md) are separate from older evidence.

Handoff review by workstream:

- Vitto: Stockroom task navigation, direct Back controls, receiving forms/notifications, Take validation, Delete modal, responsive/keyboard/reduced-motion evidence.
- Maxi: additive 002 schema, shared ordered runner, existing-database preservation, extracted/expected/actual separation, archive stock snapshots and ledger reconciliation.
- William: server session role restrictions, send/recall/confirm endpoints, request/revision checks, sorted row locking, atomic rollback including notifications, archive/Take/check races.
- Marco: unchanged backend Gemini extraction/matching boundary, synthetic fixture review, live provider/tier/retention and OCR measurement remain future verified work.

Each teammate preserves their own `.env.local` and Docker data, runs `npm ci`, `docker compose -f compose.estock.yml up -d --wait`, `npm run db:estock:migrate`, then restarts `npm run dev`. Explicit setup and application startup share `db/estock/migrate.mjs`. No `down -v`, truncate or reset. Fresh and populated initial-schema upgrade tests run in owned synthetic schemas. No cloud/GPU/new dependency is needed for this revision.

If a product is deleted during pending receiving, Staff receives an error and no stock posts. Manager uses Drafts → Recall to correct → active product selection → Save/Send. Frozen submission evidence remains. Opening notification details never confirms goods. Ordinary matching receipts create no urgent Manager alert.

The coordinated scope map now covers active eStock modules. Shared files use one editor; source/data/contracts are integrated before dependent work. Retain original history, Apache LICENSE, archives, runtime stock and credentials. No repository-wide formatter or external messages. Use current Context7/installed framework documentation for API-specific changes.

## Remaining acceptance

Later 24 October UI clarification supersedes the Stockroom navigation above: Inventory is now home; role-appropriate feature links live in the header, followed by role and Notifications. Landing handles session-aware Sign in/Sign out. Redundant Back buttons and workspace eyebrows are removed. The camera must fit below the header on opening and preserve scroll during photo preparation; History filter placeholder styling is aligned. See the current PRD and the dated UI follow-up evidence for actual checks.

Live OCR and physical camera/real mobile-device behavior, extraction accuracy/task-time measurement, provider/hosting retention, actual Replit access/durability/redeploy evidence and competition submissions remain unverified. Local synthetic tests do not close those items. Pagination and broader duplicate-document heuristics remain outside this revision. The original SQLite forecasting/purchasing/training sources and old reports stay historical, not part of the active core.

## Delivery and evidence

D2 requires synthetic-only images/products/suppliers/test records. Measure extraction correctness, correction rate, reviewed-intake task time and invariant failures with declared N/mode/model; no invented accuracy or savings. Authored fixture images can be retained as synthetic assets; application uploads cannot be retained permanently. Verify the full storage/log/cache chain and provider terms separately.

Replit is mandatory and needs own-account/project evidence plus actual persistence/access checks. PH GPU-conditional RunPod wording versus sample general Required remains X-03; seek written clarification for hosted Gemini without inventing an exemption or adding GPU features. Preserve actual historical RunPod proof. Orbyte fit is proposed reusable hub contracts, no live supplied API; X-09 verbal workspace issue remains separate.

Prepare official-template proposal PDF, deck, working prototype, Technical & Tools Declaration with actual evidence, public GitHub source/Apache LICENSE/committee access and 5–7-minute YouTube video. Do not mark readiness complete from drafts. Human attendance/workshop/signature/portal/Discord checks remain.

PH/earlier orientation: **25 October 2026, 07:59:59 AM MYT**; website/FAQ: **11:59 PM MYT**. Internal target: **24 October 2026, 20:00 MYT**. Use earlier deadline pending written clarification; freeze judged repository/live build/materials after it. This late pivot is a delivery risk; the five stages are a sequence, not a claim they fit the remaining time.

No commit/push/merge/publication, paid API call, infrastructure or real messages are authorised. Next step: team review/adaptation and remaining real-service/submission evidence.
