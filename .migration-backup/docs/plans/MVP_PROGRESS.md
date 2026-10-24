# eStock: active MVP status

24 October 2026. Current local source implements Staff receiving, notifications, product archives, bounded Take and Stockroom navigation. [Actual verification and Delivery Gate](../verification/STAFF_RECEIVING_2026_10_24.md) distinguish synthetic local checks from unverified live/device/hosted behavior. No percentage is inferred from legacy checkpoints; [historical progress](../archive/2026-10-23-before-document-intake/docs/plans/MVP_PROGRESS.md.txt) remains preserved.

| Area | Current local status | Remaining evidence |
| --- | --- | --- |
| PostgreSQL, roles, products, ledger | Implemented with additive ordered migrations; fresh/populated upgrades and preserved local aggregate data checked | Hosted backup/retention/redeploy durability |
| Inventory, Take/Return, archives | Both-role Take bounds/stale/concurrent checks; Manager positive-stock soft Delete; preserved History | Physical-device/pilot behavior |
| OCR and preparation | Backend Gemini extraction, saved drafts, aliases/manual conversion, Opening 0; stubbed journeys verified | Authorised live Gemini accuracy/terms/tier; physical capture |
| Receiving and notifications | Frozen send, shared Staff actual confirmation, zero/missing checks, once-only atomic posting and discrepancy alerts, role/read scoping | Operational-scale evaluation beyond synthetic cases |
| UI/navigation | Blue/Manrope Stockroom tasks, direct Back, compact drawer, browser mobile/keyboard/errors/reduced-motion checks | Real devices and assistive-technology evaluation |
| Submission/hosting | Docs/narrative/checklists aligned; original evidence retained | Replit proof, judge access, official PDFs/deck/video/signatures/portal |

Manager preparation/send has no stock effect. Shared Staff confirmation immediately posts actual quantities; no later Manager approval. Historical Manager-approved receipts retain original attribution and never repost. Archive conflicts require Manager recall/correct/resend and explicit Staff reopen. Notifications are in-app only. No forecast, purchasing, PO, budget or training in active core.

Preserve independent laptop data and .env.local; use README migration/setup commands, never reset/truncate/delete volumes. No operational stock fixtures or paid live AI calls were used. Historical RunPod usage is real declarable evidence, not OCR or connected Serverless proof. X-01/02/03/09 and other competition requirements remain unresolved until genuine evidence. No commit, push, publication, cloud provision, purchase or external message is authorised.
