# eStock: implementation handoff and remaining acceptance

23 October 2026. **Later explicit user instructions authorised local implementation and verification.** [Current evidence](../verification/MVP_REVISION_VERIFICATION_2026_10_23.md) supersedes the earlier not-started status. [PRD](../product/prd.md) and [decisions](../product/DECISIONS.md) include the latest Receipt history/Stock activity clarification. [Old dated plan](IMPLEMENTATION_2026_10_21.md) and [prior build plan](../archive/2026-10-23-before-document-intake/docs/plans/BUILD_PLAN.md.txt) remain historical.

## Five stages after authorisation

| Stage | Deliverable | Acceptance before advancing | Owners |
| --- | --- | --- | --- |
| 1. PostgreSQL and authority | New structured products, accounts, role-scoped access and movement ledger; migration/isolation decision | Separate Manager/shared Staff, direct backend denials, transaction/retry contract, preserve legacy data, empty startup | William + Maxi; shared contracts first |
| 2. Basic inventory | Manager product creation/Opening, Inventory/search/Low stock, both-role Take/Return, Manager History | Integer quantities, one Opening, <5 boundary, concurrent insufficient-stock Take, replay-safe Take/Return, shared Staff attribution | Maxi/William + Vitto |
| 3. Document capture and drafts | Manager mobile/desktop upload, backend Gemini extraction, validated allowlisted fields and saved structured Draft | No stock on extraction/failure; explicit mock/live labelling; persist Draft across restart with no retained image; re-upload explanation | Marco/William + Vitto |
| 4. Review and approval | Official/alias matching, corrections, unknown-product Opening 0, approve/discard | Manual units, actual-receipt confirmation, atomic all-line rollback, repeated/concurrent approval/edit protection, immutable Approved, distinct dates | All areas with one shared editor |
| 5. Evaluation and delivery | Fixed team-created synthetic evaluation, responsive checks, real Replit usage/proof, aligned submission | PRD acceptance evidence, errors reported honestly, restart/redeploy persistence/access, all six artifacts, historical resource declaration and official checks | All; Marco coordinates evidence |

Stages 1, 2 and 4 have local implementation and retained isolated PostgreSQL/API checks. Stage 3 has stubbed browser workflow evidence; live Gemini and physical capture remain Unverified. Stage 5 is partial: narrow desktop-browser layouts are checked, while real-device testing, extraction measurements, deployment/durability and competition proof remain open. FR-16 heuristic expansion and pagination are deferred. No forecast, purchasing/outbox, PO/budget or training stage is added.

## Reuse versus replacement

| Existing area | Future treatment to review |
| --- | --- |
| Next.js/TypeScript foundation, plain CSS, local font, reusable labelled controls | Reuse where suitable after UI/contract review; proposed teal direction is documentation only now |
| SQLite persistence/migrations and integer-thousandths quantities | Replace/adapt for target PostgreSQL and integer base units through an approved migration/isolation plan; no automatic conversion/deletion |
| Session/role primitives | Review for separate Manager/shared Staff; old role selector and Staff catalogue creation cannot be accepted unchanged |
| Inventory query/movement validation/idempotency patterns | Reuse ideas only after matching new Opening/Intake/Take/Return and read permissions; legacy endpoint behaviour differs |
| Forecast adapter/routes, purchasing engine, policies, sales-history import, outbox/PO/receiving | Preserve historical source; outside active core; do not connect to new intake workflow |
| Worker/training/history datasets and RunPod evidence | Preserve and declare actual historical usage; no new training/GPU requirement in product |
| Existing tests/reports/browser captures | Preserve as legacy evidence; design meaningful new tests only after authorisation; never relabel old results as OCR/PostgreSQL checks |

## Decisions and shared contracts before code

Agree product/base-unit identity, ledger types/actor/time, account/role permission matrix, draft/extracted/reviewed line schemas, alias collision rules, approval revision/atomicity, persistent event/request identity, error/conflict responses and image-lifecycle boundary. Agree extraction provenance and mock/live labels. Pick verified Gemini model/SDK/tier and PostgreSQL hosting/ORM/migrations only with current official documentation through Context7; do not buy or provision from this plan.

Use [integration rules](../team/integration.md): one active editor per shared contract/file, disjoint tasks, separate worktrees for simultaneous sessions. Existing `scripts/work-scopes.json` and checker are unchanged and do not cover every future route/module; coordinate a later scoped map update before new-code assignment. Do not silently expand a work area's ownership.

## Delivery and evidence

D2 requires synthetic-only images/products/suppliers/test records. Measure extraction correctness, correction rate, reviewed-intake task time and invariant failures with declared N/mode/model; no invented accuracy or savings. Authored fixture images can be retained as synthetic assets; application uploads cannot be retained permanently. Verify the full storage/log/cache chain and provider terms separately.

Replit is mandatory and needs own-account/project evidence plus actual persistence/access checks. PH GPU-conditional RunPod wording versus sample general Required remains X-03; seek written clarification for hosted Gemini without inventing an exemption or adding GPU features. Preserve actual historical RunPod proof. Orbyte fit is proposed reusable hub contracts, no live supplied API; X-09 verbal workspace issue remains separate.

Prepare official-template proposal PDF, deck, working prototype, Technical & Tools Declaration with actual evidence, public GitHub source/Apache LICENSE/committee access and 5–7-minute YouTube video. Do not mark readiness complete from drafts. Human attendance/workshop/signature/portal/Discord checks remain.

PH/earlier orientation: **25 October 2026, 07:59:59 AM MYT**; website/FAQ: **11:59 PM MYT**. Internal target: **24 October 2026, 20:00 MYT**. Use earlier deadline pending written clarification; freeze judged repository/live build/materials after it. This late pivot is a delivery risk; the five stages are a sequence, not a claim they fit the remaining time.

No commit/push/merge/publication, paid API call, infrastructure or real messages are authorised. Next step: user review and explicit implementation instruction.
