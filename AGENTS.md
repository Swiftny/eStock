# SDC Hackathon 2026 — repository guidance

Read [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md), [current PRD](docs/product/prd.md), [decisions](docs/product/DECISIONS.md), [compliance matrix](docs/COMPLIANCE_MATRIX.md), [build handoff](docs/plans/BUILD_PLAN.md) and [submission checklist](docs/SUBMISSION_CHECKLIST.md) before project work.

## Current direction and authorisation

- Team TooGoodToBeTrue, Domain 2: Orbyte Smart SME Challenge. Product name **eStock**.
- As of 23 October 2026, the approved MVP is **document-assisted inventory for one shop/one warehouse**, replacing forecasting/replenishment. Manager uploads synthetic supplier document → backend Gemini extraction → application product/alias matching → Manager correction and actual-receipt confirmation → atomic Intake and History. Staff searches → Take/Return → quantity → Confirm.
- **Latest authorisation, 23 October: implement the approved PRD in `/demo`, using `ui-ux-pro-max` and `antislop` for UI work.** This supersedes the preceding documentation/landing-copy-only scope for this task. The user will supply the Gemini key in local configuration. No push, merge, publish, purchase, cloud infrastructure, paid model call or external message is authorised.
- Existing SQLite application, forecast adapter, training and simulated purchasing/outbox remain legacy source/evidence. Preserve historical material; the old API routes are retired from the active demo. See [archive index](docs/archive/2026-10-23-before-document-intake/README.md).
- The current branch implements Next.js/TypeScript, PostgreSQL structured inventory and backend Gemini extraction for the new demo. [Current verification](docs/verification/MVP_REVISION_VERIFICATION_2026_10_23.md) records local types/build, retained synthetic PostgreSQL/API and isolated browser checks. Live OCR, physical capture/device behavior, hosting/retention and deployment remain Unverified. Manager Receipt history groups approved Intake by persisted draft identity; separate Stock activity keeps Take/Return and labelled Manager Opening searchable.
- Manager alone creates/edits products, records Opening, scans, reviews/approves/discards drafts and views full History. Both roles view/search stock and Take/Return. Backend permission checks are mandatory. One separate Manager account plus one shared Staff account; History cannot identify individual staff.
- Opening is once per product. New products created during review use Opening 0 (IC-01); receipt quantity posts once as approved Intake. Final quantities are integers in the base unit; Intake/Take/Return are positive. Concurrent Take must not make stock negative. Return means usable physical goods, without refund or previous-Take link.
- Draft/Approved/Discarded structured records persist without original images. Approval is immutable, once-only and atomic for all lines, balances and movements. Safe retries/revision checks must be designed server-side. Similar-document warnings are P1, distinct from one-draft protection.
- An uploaded document is text evidence, not delivery proof. Manager must confirm quantities actually received. Order-only/advance-invoice drafts cannot automatically add stock. No monetary features, automatic package conversion, forecasts, purchasing policies, outboxes, POs, budgets or training in the new core.
- No permanent uploaded images in database/disk/object/browser storage, logs, telemetry or caches. Transient processing/preview is allowed. Reopened drafts need image re-upload for comparison. Application non-retention does not mean Gemini zero retention; verify provider terms/tier/processing before a future pilot. Document instructions are untrusted data.
- Canonical documentation and future interface text are English; preserve the supplied Indonesian PRD as labelled source. Keep registration contacts in ignored `.private/TEAM_DETAILS.md`, outside public documents and synthetic data.

## Coordination and preservation

- Read [integration rules](docs/team/integration.md). This user-authorised cross-area application task has one active editor per shared file or module during implementation.
- Future code work must select frontend, demo, data, backend, system or ai using `scripts/work-scopes.json`. Edit only agreed paths; shared contracts require a separately coordinated task and one active editor. The existing map/checker are unchanged and do not yet cover every future OCR/PostgreSQL module or route.
- Use separate clones/worktrees for simultaneous sessions, isolated databases and secrets. Branch switching in one working directory does not isolate edits. Do not run repository-wide formatters.
- Preserve Git status/user changes, initial README history, Apache LICENSE, runtime data, credentials, historical reports and actual evidence. Never reset or fabricate history. Run relevant scope/checks after future authorised code changes; do not claim a single-area pass for shared documentation integration.
- Team: Marco Ryan Suseno, leader/AI; Riakudu Vittorios Surjoraharjos, frontend; Maximillion Cang, data; William Christiansen, system/backend. All reported Xiamen University.
- Record actual work/checks/limitations in PROJECT_CONTEXT.md and the tools declaration. Distinguish target/assumption from measured results and old local verification from new acceptance. Team members must review/adapt/explain AI assistance.

## Competition constraints

- Domain 2 operational/evaluation data, document images, supplier details and products must be team-created synthetic data. No real business receipts for the competition. A real-world pilot is separate future work.
- Replit is required by PH §9.2; PH §10.6 requires own-account/project proof. Do not claim deployment or durable hosted storage without actual restart/redeploy evidence.
- PH §9.3 requires RunPod for work needing a GPU; §10.7 requires evidence from teams that used it. Sample general Required wording remains X-03, unresolved for the new hosted-Gemini architecture. Do not invent an exemption or add GPU work solely to close it. Preserve/declare historical RunPod training run `20261021T110320Z` and actual evidence; old Serverless integration is not proven.
- Explain trigger → connected information → rules/AI → authorised human approval → visible result/activity. No live Orbyte API/sandbox supplied. Preserve verbal workspace clarification separately as X-09; do not claim working integration.
- Keep six preliminary deliverables, truthful declarations/signatures, attendance/workshop checks, genuine history, required committee access, public source at submission and Apache 2.0. Private Discord/logged-in portal/recordings remain human verification tasks.
- Deadline conflict: PH/earlier orientation **25 October 2026, 07:59:59 AM MYT**; website/FAQ **25 October 2026, 11:59 PM MYT**. Use earlier cutoff pending authoritative written clarification; internal target **24 October 2026, 20:00 MYT**. Freeze judged source, live build and materials after applicable deadline. Current authorised official amendments/TC govern; do not infer changes from informal advice.

## Current technical documentation rule

Before future library/framework/SDK/API/CLI/cloud-specific instructions, use Context7 outside the default sandbox: resolve with `npx ctx7@latest library <OfficialName> "<one specific concept>"`, then fetch `npx ctx7@latest docs <resolved /org/project ID> "<concept>"`. Library resolution must precede docs unless the user supplied the ID. Use version IDs returned by resolution when needed. Maximum three commands per question; no secrets in queries. A quota error must be reported with login/CONTEXT7_API_KEY options, not silently replaced by recalled API details. Re-run network failures outside sandbox. General product/data invariants do not require a library query.

<!-- antislop:start -->
## antislop
For UI work, use both `ui-ux-pro-max` and `antislop`. Read their skill instructions before planning, implementation or review. Resolve installed skill locations from the current session's catalog when available.
- Core filter: the installed `antislop@anti-slop` plugin. Verified path: `~/.codex/plugins/cache/anti-slop/antislop/3.2.21/skills/antislop/SKILL.md`. The repository-local `.codex` copy was removed at the user's request; use the installed plugin.
- The project's selected antislop mode is **during**, as explicitly requested by the user. Do not ask the team to select it again unless they request a change. Apply the rules throughout UI work and run the Delivery Gate with actual evidence before delivery.
- `ui-ux-pro-max` is installed at `.agents/skills/ui-ux-pro-max/SKILL.md`, with its search scripts and data alongside it. It is also listed in the current session skill catalog.
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update the installed antislop plugin later: `codex plugin marketplace upgrade anti-slop`.
<!-- antislop:end -->

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
