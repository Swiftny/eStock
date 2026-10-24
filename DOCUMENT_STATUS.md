# eStock: documentation status and verification

For the current implemented MVP, use [Staff-receiving verification](docs/verification/STAFF_RECEIVING_2026_10_24.md). This page preserves the earlier documentation-only task and its historical claims; it is not the current test summary.

23 October 2026, MYT. **Historical documentation-only handoff report.** A later user-authorised task added source for the new `/demo` workflow; see [current project context](PROJECT_CONTEXT.md) and [local setup](README.md). This report's documentation checks do not establish application acceptance or submission readiness. The [earlier status](docs/archive/2026-10-23-before-document-intake/DOCUMENT_STATUS.md.txt) is preserved as history; its no-application status and old totals no longer describe the repository.

## Files changed

Thirty existing Markdown documents updated:

- Root: [README.md](README.md), [AGENTS.md](AGENTS.md), [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md), this report, [DESIGN.md](DESIGN.md), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- Product/engineering/data: [PRD](docs/product/prd.md), [decisions](docs/product/DECISIONS.md), [AI handoff](docs/AI_HANDOFF.md), [stock specification](docs/engineering/STOCK_TRACKING.md), [synthetic data plan](docs/data/SYNTHETIC_DATA.md).
- Plans: [build handoff](docs/plans/BUILD_PLAN.md), [MVP progress](docs/plans/MVP_PROGRESS.md), [historical AI/RunPod plan](docs/plans/AI_RUNPOD_PLAN.md), [superseded dated plan](docs/plans/IMPLEMENTATION_2026_10_21.md).
- Team: [index](docs/team/README.md), [frontend](docs/team/frontend.md), [demo](docs/team/demo.md), [data](docs/team/data.md), [backend](docs/team/backend.md), [system](docs/team/system.md), [AI](docs/team/ai.md), [integration](docs/team/integration.md).
- Submission: [compliance](docs/COMPLIANCE_MATRIX.md), [checklist](docs/SUBMISSION_CHECKLIST.md), [proposal draft](docs/submission/PROPOSAL_DRAFT.md), [declaration draft](docs/submission/TECH_DECLARATION_DRAFT.md), [pitch/demo handoff](docs/submission/PITCH_AND_DEMO.md).
- Historical-status banners only: [forecast guide](docs/engineering/FORECASTING.md) and [worker README](worker/README.md). Their original bodies/commands/results remain unchanged. The AI/RunPod and dated-plan files above also received only historical-status banners.

Three focused/reference documents added: [OCR intake specification](docs/engineering/OCR_INTAKE.md), [complete Indonesian source](docs/product/sources/PRD_ID_2026_10_23.md), and [written-source verification record](docs/submission/SOURCE_VERIFICATION_2026_10_23.md).

[Archive index](docs/archive/2026-10-23-before-document-intake/README.md) plus 26 byte-for-byte `.md.txt` snapshots preserve pre-pivot active documentation, including previous plans, declarations, detailed UI evidence and handoffs. Snapshot links/references retain their original path context and are plain-text history, not current instructions. All original verification reports and real evidence remain at their original paths. Total task output: 60 documentation files, comprising 30 existing updates and 30 new reference/archive files.

## Important product changes

Active eStock is one-shop/one-warehouse document-assisted inventory: Manager uploads synthetic supplier image → Gemini draft → application official-name/confirmed-alias match → Manager correction and actual-receipt confirmation → atomic Intake/History. Staff search/Take/Return is simple. Forecasting, purchasing policies, outboxes/POs, budgets and training are outside the new core.

Specifications cover backend role denial, separate Manager/shared Staff accounts and honest shared attribution; integer base-unit stock; Opening/Intake/Take/Return; strict below-5 Low stock; raw/approved fields and manual units; persistent drafts without images; immutable atomic once-only approval; rollback/retry/concurrency; separate printed/server dates without ledger backdating; and order-only images that cannot prove delivery. IC-01 explicitly permits Opening 0 for catalogue setup so a new product is not counted again before Intake. Similar-document warnings remain P1, distinct from same-draft protection.

Next.js/TypeScript reuse, PostgreSQL and backend Gemini are target requirements, not completed integrations. The proposed teal/Linear/Shopify direction is recorded only; existing website/CSS/copy remains unchanged. UI skills/during mode and future evidence-based Delivery Gate requirements remain in AGENTS.md/DESIGN.md; no UI gate was performed now.

## Hackathon corrections and conflicts

Actual D2/PH/OH/TC/PT/TD written sources were fetched/read using connected Google Drive, and the main folder listed. Orientation slide text was subsequently re-read. Public homepage/FAQ still show the evening deadline. [Source record](docs/submission/SOURCE_VERIFICATION_2026_10_23.md) documents scope and limits.

- Synthetic-only competition data includes all images, suppliers, products and evaluation records. The user confirmed that all 122 supplier-document reference images and the five-image QA subset are team-created synthetic material. Provider/privacy review remains necessary before a future business pilot.
- Replit is mandatory (PH §9.2) with own-account/project proof (§10.6); deployment and hosted persistence remain unverified.
- X-03 remains unresolved: GPU-conditional PH §9.3/§10.7 versus older sample general Required wording under hosted Gemini. Sample connector fetch returned 404/NOT_FOUND; no exemption or source withdrawal is inferred and no GPU feature is added.
- Historical RunPod Chronos-2 run `20261021T110320Z` remains declared separately from OCR. Current proof is supplied in [RunPod POU PDF](submission/SDC2026_TooGoodToBeTrue_Runpod_POU.pdf) and [Technical & Tools Declaration, Appendix C](submission/SDC2026_TooGoodToBeTrue_TechDeclaration.pdf). Original raw artifacts remain Git history; final ownership/runtime proof and historical dataset provenance require review.
- X-01 deadline remains PH/earlier orientation **25 October 2026, 07:59:59 AM MYT**, versus website/FAQ **11:59 PM MYT**. Internal target **24 October 2026, 20:00 MYT**; use earlier cutoff pending written clarification. X-02 workshops and X-09 verbal Orbyte workspace issue remain separate, along with other matrix conflicts.
- All six deliverables, truthful signatures/declarations, attendance/workshops, genuine history, committee/public source/Apache 2.0 and post-deadline freeze are retained. Private Discord, logged-in portal, recordings, account tiers/credits and signature/attendance facts were not verified. No external clarification was sent.

## Documentation checks actually performed

Static documentation checks used local Python and read-only Git inspection. No application tests/build/lint/typecheck, database commands, package installation or runtime/browser services were run.

- Local Markdown file targets resolve across the 40 root/docs/worker Markdown files scanned, including new references/archive index. Table column consistency checked with no issues. Archived `.txt` snapshots are preserved text, not current Markdown links.
- FR-01 through FR-16 are all present once in the canonical requirement table and mapped to 26 unique future AC cases. Review covers permissions, empty startup/Opening, matching ambiguity, invalid output, units, receipt confirmation, atomic/concurrent/repeated approval, no Opening-plus-Intake duplication, concurrent/retried movements, shared attribution, image lifecycle, provider failure/mock labels, P1 similarity and responsive/deployment targets.
- All 44 compliance IDs C-01–C-44 and all nine conflict IDs X-01–X-09 are retained. Historical decision IDs remain in complete snapshots; new decisions use U-20–U-30 and labelled IC clarifications.
- Eight official-template passages checked by whitespace-delimited word count and compared with limits independently read from the actual official templates. These checks must be repeated after final edits/transfer; they are not signed-PDF verification.
- Complete supplied Indonesian text remains byte-for-byte after its English reference label; canonical docs are English. Current public Markdown contains no unwanted rename-correction wording.
- All 26 archived source snapshots match task-start hashes. All original verification reports remain byte-for-byte unchanged.
- Task-start comparison found **no non-documentation changes** and no changes to **1,199 protected source/assets/scripts/tests/worker/training/data/private/evidence/artifact files**. Original LICENSE and the pre-existing `next-env.d.ts` edit match task-start bytes. No stage/commit/push/merge/publication occurred.
- `git diff --check` passed for tracked edits. At the later user-authorised commit handoff, the staged check identified original Markdown hard-break spaces and the final blank line in the supplied Indonesian PRD. Those bytes are intentionally preserved; the staged whitespace check excluding that exact source file passes, and its content still matches the original attachment. Final source/link/hash checks are documentation evidence only; no new OCR accuracy/time savings/interviews/pilot/deployment/test passes are claimed.

| Template field | Words | Limit |
| --- | --- | --- |
| Proposal problem | 193 | 250 |
| Proposal solution | 262 | 300 |
| Proposal design/deployment | 178 | 200 |
| Declaration architecture | 173 | 200 |
| Declaration review | 79 | 100 |
| Declaration replaceability | 85 | 100 |
| Declaration privacy | 145 | 150 |
| Declaration risks | 139 | 150 |

Proposal numerical baseline/percentage are explicitly agent-suggested, unmeasured placeholders for team approval, not user-approved targets or achieved savings. Historical forecast metrics stay historical.

## Remaining decisions and stop point

After explicit implementation instruction: verify account access/quality for the explicitly required `gemini-3.8-flash`, SDK/account tier/processing terms and safe upload bounds; PostgreSQL hosting/plan/region/ORM/schema/migration/backup approach; Manager/shared Staff auth; API/revision/idempotency/alias contracts; precise new file ownership/scope-map coordination; synthetic fixture authorship/ground truth and evaluation protocol; actual Replit arrangement/proof; written RunPod/Orbyte/deadline/workshop clarifications; final artifact owners/links/contact/signature/access facts.

Existing work-scope scripts are unchanged and do not already cover new OCR routes/modules. The five-stage handoff is a proposed sequence, not permission to implement. **Website/application code, dependencies/configuration, databases, tests and running services were not changed. Stop here and wait for the user's explicit instruction before implementation.**
