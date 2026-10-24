# eStock: decisions and unavailable information

Updated 22 October 2026. This document separates user decisions, implementation choices, technical recommendations and facts to supply. The local persistent workflow is implemented; real RunPod inference and Replit deployment remain unverified.

## Current integration decisions, 22 October

The user authorised a serial integration across demo, data, backend, AI and shared documentation, preserving the existing application and working tree. These decisions supersede conflicting earlier descriptions below.

- Normal startup and `db:seed` remain empty of inventory/transactions. Explicit deterministic fixtures live in `tests/synthetic-fixture.ts`; each relevant test uses a temporary database, blocked external fetches and restored environment. The production HTTP harness checks empty startup before loading that fixture.
- Employees can create a basic item and opening stock on the open demo date. The server allowlists fields; supplier terms, packaging, reference costs and budgets remain manager-owned. Missing policy is an inactive draft, labelled **Purchasing setup required**, with no actionable recommendation. Manager configuration is saved separately.
- Receiving uses product precision for both roles. Usable quantity adds stock; usable plus damaged quantity reduces the order balance atomically. Damage opens a manager exception and never automatically creates a replacement.
- Manager history import is reachable from Inventory, secondary to daily recording. File/paste, template, preview, row errors, duplicate counts, confirmation and traceable reviewed corrections reuse the existing backend. Aggregate history never changes physical stock.
- One to 27 consecutive complete days ending at the cutoff can produce **DEMO_ESTIMATE**, an available-days average with explicit limitations. This is not a 28-day mean, validated forecast or live AI. Empty, incomplete or gapped history remains blocked. RunPod requires 28–168 complete consecutive observations.
- Unpriced requests are permitted only for the simulated supplier channel after explicit warning acknowledgement. Costs remain null; budget compliance cannot be checked. Known reference costs still enforce approval limits. This supersedes older blanket statements that unknown costs always block simulated approval.
- Saved RunPod requests retain their pinned model revision and identity. Repeated/failed/unknown analysis identities are not blindly resubmitted. Configuration changes invalidate pending purchasing results. Local Python-handler/TypeScript verification uses fake Torch/Chronos dependencies; no actual model/GPU proof is claimed.
- Retain the light-blue UI. Source/cutoff and approval-critical details stay visible; quantity calculation and model/evaluation metadata use disclosures. The leftover manager-only Add Item dialog guard was found in browser verification and removed.

Current verification and limits: [integration report](../verification/INTEGRATION_2026_10_22.md). Real endpoint credentials/revision/resource limits, a controlled GPU spike, exact worker/image lock, Replit durability and own-account evidence remain external dependencies. No commit, push, publication, paid service or real supplier message is authorised.

## Team assignments

Startup repair, 21 October: the root `pages/` documentation folder caused Next.js to exit because it detected root Pages Router routes alongside `src/app`. A serial integration task moved the team guides to `docs/team/`, updated links and retained the existing work-area boundaries. This supersedes U-17's original folder location; application routes and dependencies are unchanged.

U-18, user, 21 October: prevent overlapping edits across AI, frontend, backend, demo and system. Add explicit work boundaries, a scope checker and serial shared integration rules. This supersedes U-17's no-file-ownership preference only as needed for conflict prevention. Data remains Maxi's area. Existing code stays in place; no commit, push or remote enforcement was performed.

U-17, user, 21 October: Vitto frontend, Maxi data, William system/backend, Marco AI. Create separate work pages in the root `pages/` folder without file ownership rules. [Team pages](../team/README.md) separate tasks and the shared demo. Existing application routes and worker remain in place; training is not added by this documentation change. This supersedes U-08 and earlier unallocated-workstream notes.

## Current authorised implementation

U-17, user, 21 October: proceed with stages 1 and 2 of the agreed MVP implementation plan, backend preparation and stock tracking. The user owns MVP backend implementation and has informed their frontend/demo friend. The friend's name and other final assignments are unavailable. Keep the friend's frontend files intact and use a separate local backend branch. No commit, push or publication was requested.

Verification follow-up, 21 October: the user requested Step 2 tests and push-readiness evidence, with Git commit/push reserved for the user. Added focused inventory tests and an isolated production HTTP harness; 60 Node tests and 24 HTTP scenario groups passed locally. The agent did not stage, commit, push, merge, provision infrastructure or start real inference. See [actual stock verification](../verification/STOCK_TRACKING_2026_10_21.md) and [MVP checkpoints](../plans/MVP_PROGRESS.md).

Stock-stage implementation choices: retain the pulled SQLite/ledger/service; add a dedicated inventory module and product/movement API with client-safe types. Preserve the existing `/api/demo` contract. Use the existing server-issued demo roles, per-product units/precision, atomic movement posting and two levels of duplicate protection. Provide request-based updates and paginated history. Products remain database rows. These choices are local implementation details; deployment durability and production identity remain outstanding. Contracts, ownership and actual checks: [STOCK_TRACKING.md](../engineering/STOCK_TRACKING.md).

U-16, user, 21 October: refine the existing website and implement a persistent backend through stock, recorded-data analysis, manual what-if, forecast adapter, manager approval, simulated supplier outbox, acknowledgement, receiving and audit. This supersedes the landing-only pause in U-12 and extends U-15. Routine visual/backend choices are authorised; no commit, push, external publication, purchase or real supplier message is authorised.

| Implemented choice | Reason / limits |
| --- | --- |
| Built-in Node SQLite, SQL migrations, one local file | Existing stack had no established database. Simple local persistence without an ORM, native addon or new JavaScript dependency. Requires Node 22.18+, one process and durable storage for deployment; hosted database remains necessary if the target lacks a durable disk. Supersedes proposed PostgreSQL/Drizzle for this local milestone. |
| Integer thousandths and per-product precision; MYR sen per base unit | Reliable ledger arithmetic and explicit price/pack semantics. Blank costs remain unknown; current simulated unpriced approval rules are above. |
| One synthetic organisation/location and opaque HttpOnly server sessions | Server-side manager/staff permissions are real; role selection is explicitly simulated identity. No production SSO/authentication claim. |
| Explicit synthetic business date and immutable closed days | History, closing stock, forecast cutoff and approval window stay aligned. Closing triggers analysis; unfinished-day transactions invalidate old approval. Closed physical records are corrected by open-day manager adjustments, not edits/deletion. |
| Source IDs plus request idempotency and database uniqueness | Replayed sales/receipts cannot post stock twice; one decision creates one approval/PO/outbox. |
| Reviewed historical CSV correction retains source/SKU/date | Corrections increment revisions, preserve before/after audit and invalidate prior recommendations; aggregate history never changes physical stock. |
| Active purchase commitment blocks an additional PO | Conservative single-supplier MVP. Expose any remaining demand/timing risk; resolve confirmation, receiving, damage or explicit cancellation first. |
| Supplier ETA changes hold receiving for review | A different date cannot silently become an approved term. The manager can document cancellation and reanalyse before replacing the commitment. |
| Local baseline adapter plus configurable RunPod queue worker | Honest local testing without credentials. Pending/completed/failed results and provenance persist. Invalid data/configuration does not silently produce a fallback quantity. Actual GPU and own-account proof remain outstanding. |
| Split hero, actionable workspace views and native disclosures | One clear daily task; supporting calculations/history/metadata stay accessible. Existing forest green and local Manrope are retained. Motion rationale is in DESIGN.md. |

Actual checks are in [the workflow report](../verification/WORKFLOW_2026_10_21.md). Earlier decisions below are retained as history; their landing-only implementation status is superseded by U-16.

## User decisions

| ID | Decision | Basis |
| --- | --- | --- |
| U-01 | Working name: eStock | The user proposed eStock following the Orbyte module naming pattern |
| U-02 | General product for SMEs managing stock | User response: general, not limited to one sector |
| U-03 | Outgoing-stock movement → demand → recommendation → manager approval → supplier request → receiving | User's product explanation |
| U-04 | AI estimates per-product demand from sales history | User's weekly/monthly planning explanation |
| U-05 | Synthetic CSV and outgoing-stock/receiving forms | Explicit user response |
| U-06 | Prefer WhatsApp if feasible; Telegram if time permits | Explicit user response; completing both channels is not required |
| U-07 | Marco Ryan Suseno is leader; four members listed below | Full names and university supplied by the user |
| U-08 | Historical: final assignments remained open; superseded by U-17 | Initial reported skills were not assignments |
| U-09 | Documentation first; technical agreement before scaffolding | Original documentation scope, reaffirmed by the user's M0 request; application implementation and service purchases are not authorised by the documentation |
| U-10 | All repository documents must be in English | User instruction on 20 October 2026; preserve meaning, names, contact values, identifiers and links |
| U-11 | Use both ui-ux-pro-max and antislop for UI/UX work; antislop mode is during | Existing AGENTS.md rule, reaffirmed by the user on 20 October 2026 |
| U-12 | Start with the landing page after stack approval; pause for review before application work | User instruction on 21 October 2026; backend inventory, RunPod forecasting, authentication and messaging are outside this first stage. Local synthetic approval simulation is allowed; commits, pushes and publication are not authorised |
| U-13 | Light, minimal, tidy and professional visual direction, with clear typography, generous spacing, limited accents and prominent product previews | User instruction on 21 October 2026; use the actual Attio site as a visual reference and develop an original eStock identity without copying assets, branding or copy |
| U-14 | English landing-page UI and documentation; synthetic labels and truthful capabilities | User instruction on 21 October 2026; use the supplied hero headline, supporting text and real section destinations; do not present the fixed arithmetic fixture as actual AI inference |
| U-15 | Next.js App Router, TypeScript and plain CSS for the first landing-page stage | User's 21 October go-ahead following the stack recommendation. This approves frontend scaffolding and the requested local preview; database/ORM, forecast worker, accounts and deployment remain outside this approval |
| U-16 | Register an Orbyte workspace and align eStock with Orbyte workflows; any Orbyte connection stays simulated and clearly labeled | A sponsor/mentor said verbally that using Orbyte is required; on 21 October 2026 the user chose to explore and align rather than integrate. Registration: [workspace page](https://orbyte-xyz.alphareds.com/register-workspace) (verify account, organization details, approval). No written source yet; see X-09 in [COMPLIANCE_MATRIX.md](../COMPLIANCE_MATRIX.md) |
| U-17 | MVP feature scope: stock tracking (#1), demand forecasting (#2), stock depletion (#3), reorder recommendations with their reasoning (#4, #23), low-stock and stockout detection (#8), manager approval (#14), purchase-order drafting (#16) and incoming-shipment tracking with overdue flags (#19, #9). Added: activity log, supplier outbox with simulated confirmation, staff/manager demo roles, sales-history CSV import and in-app manager notifications. Template-based weekly/monthly reports (#11) and alert prioritization (#12) come last | User decision on 21 October 2026 from a 23-item feature list. The added pieces close PRD MUST gaps (AUDIT-01, R-07, C-05, §6.3, §5.2). Only #2 uses AI; everything else is deterministic code, and reports use templates rather than a language model |
| U-18 | Fine-tune Chronos-2 (`autogluon/chronos-2`, Apache 2.0) with AutoGluon 1.6.3 LoRA on a RunPod GPU Pod, and serve forecasts from a RunPod Serverless worker | User decision on 21 October 2026, replacing the R-03 candidate and the PRD §8.1 no-fine-tuning default. Selection follows §8.4: fine-tuned, zero-shot and both baselines compete per SKU on validation MAE, and ties go to the simpler method. Code in `training/` and `worker/`; steps in [AI_RUNPOD_PLAN.md](../plans/AI_RUNPOD_PLAN.md). First run `20261021T110320Z` on an RTX 4090: the per-SKU selection's test MAE is 4.0% below the best baseline, while fine-tuning made no pooled difference against zero-shot; full results in the plan |
| U-19 | Train and evaluate on two synthetic datasets together: the generated 168-day fixture (`DEMO-*`) and the team's 2020–2026 daily history (`SYN-*`, with weekly and monthly totals) | User decision on 21 October 2026. Evaluation offsets count back from each series' end, which reproduces the PRD §8.4 split on the 168-day fixture. Provenance of the `SYN-*` files is pending; see [DATA_CARD.md](../../data/DATA_CARD.md) |

Language decision record: U-10 was made by the user on 20 October 2026 to make all files readable in English. It changes documentation language, not product scope. The Markdown documents, including ignored private notes, were translated; AGENTS.md, PROJECT_CONTEXT.md, README and this register record the requirement. U-11 reaffirms the existing UI rule without selecting a visual direction or authorising UI implementation.

## Reported skills, not assignments

| Member | Reported skills/contributions |
| --- | --- |
| Marco Ryan Suseno | Team leader; frontend |
| Riakudu Vittorios Surjoraharjos (Vitto) | PRD, frontend, UI/UX |
| William Christiansen | System design |
| Maximillion Cang (Maxi) | Database |

All members must understand the complete solution and be able to explain the core feature.

All four members reported Xiamen University. Registration emails are stored in .private/TEAM_DETAILS.md at the root and excluded from source and public packages. The leader's phone number has not been provided. Check names and university spelling against the portal without changing membership or guessing identities.

## Recommended defaults for the team to decide

| ID | Recommendation | Reason / when to review |
| --- | --- | --- |
| R-01 | One demo organisation/location, 3–5 SKUs | Small fixture; product remains configurable |
| R-02 | Lead time 1–14 days, 7/30-day cycle, absolute buffer | Bounds the model/horizon contract while retaining the core cases |
| R-03 | Pretrained Chronos-Bolt Small on RunPod | Superseded by U-18 on 21 October 2026. Originally: small candidate with an open licence; validate during the spike before pinning a revision |
| R-04 | 28-day mean and 7-day seasonal-naive baselines | Explainable comparisons; avoid unsupported AI claims |
| R-05 | 168 synthetic history days per SKU, fixed seed | Several weeks of patterns and time-ordered testing, not real market data |
| R-06 | One primary supplier per SKU | Defer supplier selection and negotiation |
| R-07 | Persistent outbox/simulator is MUST | Core journey does not depend on activating an external messaging platform |
| R-08 | WhatsApp SHOULD, Telegram COULD | Follows the user's channel preference without compromising submission |
| R-09 | PostgreSQL + Python forecast worker for the future application | Frontend TypeScript/Next.js is now selected under U-15; database, ORM and worker remain recommendations |
| R-10 | English pitch | Documentation and landing-page UI are user decisions under U-10/U-14; pitch language remains subject to team agreement and official requirements |
| R-11 | Internal submission target: 24 October, 20:00 MYT | Buffer before the earlier PH/ORI deadline |
| R-12 | Phase 2 target: 50% reduction from an assumed 10 minutes per case | Planning figures to replace or label honestly after measurement |

The M0 discussion also proposed Drizzle migrations and a RunPod serverless queue. Those remain unapproved recommendations. Frontend approval does not verify platform access or close the remaining M0 contracts.

## Landing-page implementation choices, 21 October

These are technical/design choices made while carrying out U-12 through U-15, not additional user requirements or implemented roadmap features.

| Choice | Reason and scope |
| --- | --- |
| Next.js 16.4.2, React 19.3.1, TypeScript 6.0.3 | Exact installed versions are pinned in package-lock.json. Static page content stays on the server; navigation and the synthetic demo are client components |
| Plain CSS with shared tokens, text wordmark and original SVG symbols | Small dependency set and reusable building blocks for later application screens |
| Local Manrope variable font; off-white, charcoal and restrained forest green | Readable stock records, stable tabular numerals and clear manager actions. Actual Attio hero/product/table sections were reviewed; its branding, assets and copy were not imported. Reasons are in DESIGN.md |
| Biome 2.5.15 for lint/format, plus tsc | Replaced the initially tried ESLint dependency tree after its audit reported unfixed development-tool advisories; the smaller final dependency set installed successfully |
| Native dialog with explicit Tab wrapping, outcome/reset focus and Escape | Browser checks exposed focus leaving the dialog; the fix was checked with keyboard traversal and focus return |
| Browser-memory simulation and four selectable synthetic scenarios | Demonstrates manager control and visible failure/data-needed states without implying a persistent outbox, live model, inventory backend or messaging integration |

Actual verification and the antislop Delivery Gate are recorded in [LANDING_PAGE.md](../verification/LANDING_PAGE.md). No commit, push or deployment was performed.

## Team input needed before related implementation

| ID | Information / decision | Status and action |
| --- | --- | --- |
| OPEN-01 | Application framework/language | Frontend resolved under U-15: Next.js App Router, TypeScript and plain CSS. Database/ORM, application contracts and forecast worker still require agreement before related work |
| OPEN-02 | Replit Core/project/credit active? | Not provided; check the team portal |
| OPEN-03 | RunPod account/credit/region/GPU/endpoint | Not provided; verify access and quota before the spike |
| OPEN-04 | Model/revision/dependency versions | Pin from a successful spike, not guessed versions |
| OPEN-05 | WhatsApp business account, number, template and permission ready? | Not provided; timebox and use the simulator if unavailable |
| OPEN-06 | Telegram bot/destination conversation | Optional; must not become a core dependency |
| OPEN-07 | Workstream owners and actual availability | Not allocated; select at kickoff |
| OPEN-08 | UI visual/brand direction | Resolved for the landing page on 21 October under U-13; fine visual details are routine implementation choices |
| OPEN-09 | Required UI skill locations | Resolved on 21 October: antislop@anti-slop version 3.2.21 is installed and enabled in the Codex plugin cache, verified by CLI JSON and a readable core skill. The repository-local duplicate was removed at the user's request. ui-ux-pro-max is now present at .agents/skills/ui-ux-pro-max/SKILL.md and listed in the refreshed catalog; its search CLI starts successfully. AGENTS.md records both locations |

## Facts needed before submission

| ID | Fact | How to close |
| --- | --- | --- |
| SUB-01 | Leader contact for official templates | Name, email and Xiamen University provided; use the private file. Phone not provided; leader to complete |
| SUB-02 | Member/university/GitHub details match the portal | Four names/emails/university provided; verify portal/GitHub without changing membership |
| SUB-03 | All members joined Discord and attended the reveal | Team verification |
| SUB-04 | GenAI, Database and Cloud Deployment workshops | Template asks for every member's checklist; complete honestly and clarify accepted tasks/recordings |
| SUB-05 | Authoritative final deadline | PH/ORI morning vs website evening conflict; retain latest official written instruction |
| SUB-06 | Committee GitHub usernames | Obtain from official portal/Discord, do not guess |
| SUB-07 | Prototype, Replit, public repo, deck and YouTube links | Populate from actual artifacts and test in a fresh session |
| SUB-08 | Actual RunPod/Replit proof | Capture own dashboard/project and redact secrets |
| SUB-09 | Tests/evaluation/task timing | Record actual results with N, seed, cutoff and limitations |
| SUB-10 | All actual dependencies/APIs/models/datasets/AI tools | Match lockfiles, environment and usage |
| SUB-11 | Prior work, third-party licences, employment IP | Answer yes/no using each member's facts |
| SUB-12 | Leader signature and date | Leader signs after reviewing all content |
| SUB-13 | Official announcements and portal upload limits | Human check before upload; not fully accessible during the audit |

## Change rules

Record each new decision's date, decision maker, reason, scope impact and updated documents.

Do not use None for unknown facts. None is appropriate only when a category does not apply; unavailable information must remain clearly marked for completion before final signed submission.

The PRD can serve as a product baseline while links/results/signatures are produced later. Document completeness is not evidence of implemented features.
