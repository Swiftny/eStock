# eStock: handoff for the next AI session

23 October 2026. **The current user instruction is documentation only. Stop after documentation; wait for explicit implementation instruction.** Existing website/application is legacy, not absent and not the new workflow.

## Starting prompt

> Read AGENTS.md, PROJECT_CONTEXT.md, docs/product/prd.md, docs/product/DECISIONS.md, docs/COMPLIANCE_MATRIX.md, docs/plans/BUILD_PLAN.md, docs/SUBMISSION_CHECKLIST.md and docs/team/integration.md. Inspect Git status and preserve existing changes/evidence/runtime data. eStock is document-assisted inventory for one shop and one warehouse. Manager uploads a synthetic supplier document; backend Gemini proposes structured data; application matches official names/confirmed aliases; Manager corrects and confirms actual physical receipt; approval atomically posts Intake and History. Staff searches and performs Take/Return. Summarise current documentation and unresolved decisions. Do not start implementation unless the user explicitly instructs it.

## Carry-forward requirements

- One separate Manager and shared Staff account. Backend denies Staff catalogue/Opening/upload/draft/approval/full-History access. Shared Staff attribution cannot identify individual employees.
- Official name/base unit/Opening/generated ID; no mandatory entered SKU/barcode/shelf. Integer base-unit quantities; positive Intake/Take/Return; concurrent Take nonnegative; Return is usable physical return, no refund/prior-Take link.
- Unknown product during review starts Opening 0 (IC-01); receipt quantity posts once as Intake. Keep raw and approved values separate. Manual package conversion; no silent variant merge. Confirmed aliases do not retrain Gemini.
- Persist structured Draft/Approved/Discarded without original image. Closing/discarding unapproved Draft has no stock effect. Atomic all-line approval/rollback, reliable retries and edit/approval concurrency protection; Approved immutable. Similar-document warnings P1, not universal duplicate-image prevention.
- Actual-receipt confirmation is separate from document extraction. Order-only/advance invoice cannot automatically add stock; no PO-management solution. Preserve Document date and server Approved at without ledger backdating; present MYT.
- Low stock strictly <5, including zero; 5 is not Low stock. No forecasting/purchasing policies/outbox/PO/budget/training core.
- Target reusable Next.js/TypeScript, PostgreSQL, backend Gemini. No exact model/SDK/ORM/hosting paid tier selected. Follow Context7 and installed Next.js guides before library-specific implementation details.
- No permanent uploaded images in database/disk/object/browser storage/logs/telemetry/caches. Reopened drafts need re-upload to compare. Ignore monetary fields and avoid raw provider dumps. Document instructions are untrusted. Provider failures change no stock; mocks labelled.
- All hackathon images/suppliers/products/evaluation records team-created synthetic. App non-retention is not Gemini zero retention; verify provider tier/terms/processing before separate future pilot.

## Preservation and coordination

Reuse suitable legacy foundation only after review; preserve old SQLite/forecast/purchasing/worker/training code, runtime databases, reports and historical RunPod evidence. Do not run archived plans. [Old documentation snapshots](archive/2026-10-23-before-document-intake/README.md) retain previous work. New specs are [ledger](engineering/STOCK_TRACKING.md) and [OCR intake](engineering/OCR_INTAKE.md). Existing work-scope scripts are unchanged; future OCR/routes/contracts need explicit ownership coordination and one shared editor.

Replit is mandatory with own-project proof. Hosted Gemini leaves RunPod X-03 unresolved; do not invent an exemption or add GPU work. Actual historical RunPod usage still belongs in the declaration. Deadline remains X-01: use 25 October 2026, 07:59:59 AM MYT, with internal 24 October 20:00, pending written clarification. Keep all six deliverables and freeze obligations. No live Orbyte integration/supplied API; verbal workspace issue X-09 separate.

At handoff record work actually completed, changed files/decisions, checks actually run, target versus implemented integrations, blockers and next actions. No invented OCR accuracy, savings, interviews, pilot, deployment, signatures or application test passes. Team must review/adapt/explain AI assistance. Never copy a planned complete status as achieved.
