# eStock: draft Technical & Tools Declaration

**DRAFT TO COMPLETE FROM ACTUAL USAGE.** The local landing page and persistent synthetic inventory workflow are implemented. Default runtime demand uses a labelled local baseline; RunPod GPU inference and Replit deployment remain unverified. Use the [official template](https://drive.google.com/file/d/1LBXfXrFblX-dHanSP8jhUOMGfGGxY2ew/view), then export one PDF: **SDC2026_TooGoodToBeTrue_TechDeclaration.pdf**.

Non-applicable categories must say No/None. Do not replace unknown facts with None. Complete before signing.

Optional SKU follow-up, 22 October: Codex used shell/Git, apply_patch, Node tests, Biome, TypeScript, the Next.js production build and installed client-component guide, ui-ux-pro-max form guidance/search, antislop during and Playwright to implement and verify automatic demo codes. Actual checks: 76 Node tests, lint/typecheck/build, isolated browser creation/persistence/manual-code/duplicate/keyboard/responsive checks. No new library, generated visual asset or external service was used. [Verification](../verification/AUTO_SKU_2026_10_22.md).

**Current integration usage, 22 October:** Codex reviewed and extended the existing application serially, preserving prior changes. Tools actually used: shell/Git, Node built-in SQLite/test/assert/child_process, Python unittest with fake Torch/Chronos modules, Biome, TypeScript, Next.js production build, Context7 CLI for RunPod and Chronos-Bolt, installed Next.js form/config guides, ui-ux-pro-max local search, the catalog's readable antislop core in during mode, and Playwright for isolated desktop/mobile/keyboard/browser checks and screenshots. No sub-agents, generated raster assets, new runtime dependencies, cloud provisioning, real supplier messages, model download or GPU execution were used. Local environment: Node 22.23.3, npm 10.9.9, Python 3.9.6. Actual checks: 74 Node tests, 7 Python worker tests, 25 production HTTP scenario groups, lint/typecheck/build. The handler contract is simulated; real RunPod/Replit proof and exact worker lock remain unavailable. The [integration report](../verification/INTEGRATION_2026_10_22.md) supersedes historical totals and setup claims below. Human team review/signature remains outstanding.

Header/login follow-up, 22 October: Codex added `/login` using the existing access-code/session endpoint, aligned the landing header with the workspace and removed repeated workspace/synthetic-data labels. Tools: shell/Git, ui-ux-pro-max local guidance/search, antislop during, installed Next.js route documentation, Context7 Next.js library/docs queries and Playwright. New login loading/error/success states, keyboard interaction, contrast and responsive layouts were verified. No dependency, personal-account identity provider or external service was added.

Follow-up, 22 October: Codex implemented direct Manager demo entry using the existing session API, removed “Stay ahead.” and restored the prior demo-header layout at the user's request. React effect cleanup guidance was fetched through Context7; installed Next.js guidance, shell and Playwright were used. Tests covered automatic entry, selected-role persistence, protected-entry fallback, request error/retry, responsive layout and a clean separate preview. No runtime AI inference or new dependency was introduced.

Development update, 22 October: Codex used shell/Git, the installed Next.js CSS guide, ui-ux-pro-max local search, the catalog's readable antislop core in during mode and Playwright to refine landing copy, remove review prices and prevent activity role names splitting. Lint, typecheck, production build and browser verification passed using a separate synthetic database. No new dependency, hosted service, raster asset or live inference was used. [Verification](../verification/UI_2026_10_22.md).

## 1. Team and Project Overview

| Field | Value |
| --- | --- |
| Team Name | TooGoodToBeTrue |
| Project | eStock |
| Leader | Marco Ryan Suseno |
| Email/Phone | .private/TEAM_DETAILS.md; phone not provided |
| University | Xiamen University; check official spelling against portal |
| Live Prototype URL | NOT DEPLOYED; local landing page and persistent /demo workspace |
| Code Repository | https://github.com/Swiftny/sdc2026-TooGoodToBeTrue-domain2 |

The repository must be public for submission; a correct URL does not itself prove visibility/access.

## 2. Architecture & Technology Stack

### 2.1 Architecture Overview: maximum 200 words

Current implementation, 21 October. The paragraph below describes actual local behaviour and the unverified external adapter:

<!-- WORDCOUNT:declaration_architecture:200 -->
eStock uses Next.js, TypeScript and plain CSS. Node's built-in SQLite stores products, purchasing policies, an append-only stock ledger, dated sales history, analysis jobs, recommendations, approvals, purchase orders, simulated messages, receipts and activity. SQL migrations and a transactional synthetic seed run locally. Quantities use integer thousandths; prices use MYR sen.

Server-issued demo sessions distinguish manager and staff permissions. Validated forms and CSV imports use request/source idempotency. Human day closing defines a consistent history/stock cutoff. A local mock adapter computes a labelled saved-history baseline. Deterministic purchasing rules handle delivery dates, review timing, safety stock, inbound, packs/MOQ and costs. A separate manual what-if calculator writes no operational history.

Manager approval atomically creates one PO/outbox without increasing stock. Simulated dispatch, synthetic supplier acknowledgement and physical receiving remain distinct. Receipts add usable stock and retain damaged-goods exceptions and before/after audit.

A RunPod queue adapter and Python CUDA Chronos-Bolt worker are implemented, including validation/evaluation and fallback, but actual inference is unverified. Replit deployment and durable deployment storage still require own-account setup and evidence.
<!-- END_WORDCOUNT -->

### 2.2 Languages, Frameworks & Libraries

| Name & Version | Purpose | Licence | Status |
| --- | --- | --- | --- |
| Next.js 16.4.2 | Landing-page framework | MIT | USED LOCALLY |
| React / React DOM 19.3.1 | UI and local preview state | MIT | USED LOCALLY |
| TypeScript 6.0.3 | Types and compiler | Apache-2.0 | USED LOCALLY |
| @fontsource-variable/manrope 5.3.0 | Locally served variable font | OFL-1.1; full licence in public/licenses/manrope-OFL.txt | USED LOCALLY |
| @biomejs/biome 2.5.15 | Lint and formatting | MIT OR Apache-2.0 | USED LOCALLY |
| @types/node 26.6.5; @types/react and @types/react-dom 19.3.0 | Development types | MIT | USED LOCALLY |
| node:sqlite (Node 22.23.3 built-in), no ORM | SQLite ledger, transactions and persistence | Node MIT and bundled third-party notices; SQLite public-domain dedication | USED LOCALLY |
| Python 3 | Worker contract/evaluation logic tests and skill searches | PSF and bundled notices | USED LOCALLY; CUDA worker runtime not executed |
| chronos-forecasting | Pretrained forecast inference | Verify pinned version/licence | PLANNED |
| PyTorch/dependencies | Model execution | Verify actual versions/licences | PLANNED |
| RunPod SDK, if used | Worker handler | Verify actual version/licence | PLANNED |
| Additional component/chart/animation/test library | None added | Not applicable | Native controls, CSS/IntersectionObserver motion, node:test/assert and Python unittest used |

Local verification environment: Node.js 24.16.0, npm 11.13.0 and Python 3 for skill search/contrast checks. Runtime dependencies and direct-package licences were read from installed metadata; see package-lock.json and THIRD_PARTY_NOTICES.md. Transitive packages retain their own notices. An initial ESLint/eslint-config-next attempt was removed after development-tool audit advisories; it is absent from the final dependency set. Reading model documentation is not evidence that the model has run.

## 3. APIs & Cloud Services

### 3.1 External APIs

| API / Provider | Purpose | Access Tier | Status |
| --- | --- | --- | --- |
| RunPod queue endpoint | Numerical forecasting | Sponsor credit if redeemed; actual account tier unknown | ADAPTER IMPLEMENTED; mock HTTP contract verified; no real round trip |
| WhatsApp Cloud API / Meta | Supplier messaging if completed | Record actual pricing/tier | OPTIONAL, NOT ACTIVE |
| Telegram Bot API | Additional channel if completed | Verify actual terms/tier | OPTIONAL |
| Other API | Complete if used | Actual tier | Do not leave blank if used |

No API keys in this table. Mock Orbyte endpoints are team-created contracts, not resources/APIs supplied by Orbyte.

### 3.2 Cloud Platforms & Deployment

| Service / Provider | Purpose | Plan / Region | Actual proof |
| --- | --- | --- | --- |
| Replit | App/backend/deployment | NOT PROVIDED | Live URL/project history |
| SQLite local file | Ledger/forecast/workflow | Local disk, no paid service | Restart persistence verified; durable hosted storage still unconfigured |
| RunPod | GPU inference | NOT PROVIDED | Dashboard Pod ID/endpoint, GPU, runtime |
| GitHub | Source/history | Team repository; actual plan | URL/commit |
| YouTube | Preliminary pitch/demo | Visibility allows judge access | Video URL |

## 4. AI Tools, Models & Datasets

### 4.1 Runtime Models

| Model & Version | Source | Usage | Licence/Terms | Status |
| --- | --- | --- | --- | --- |
| amazon/chronos-bolt-small; revision not pinned | Amazon, HuggingFace/model card | Pretrained inference; no fine-tuning planned | Apache 2.0; verify artifact | CANDIDATE |
| Other model | Complete only if actually used | Actual usage | Actual terms | If none, enter None in final version |

The 28-day mean and 7-day seasonal-naive baselines are simple statistical methods, not LLMs. State when runtime recommendations use a baseline.

### 4.2 Datasets

| Dataset | Source / URL | Type | Licence | Personal Data |
| --- | --- | --- | --- | --- |
| eStock synthetic sales/movements/master/PO fixtures | src/lib/server/seed.ts; docs/data/SYNTHETIC_DATA.md | Project-created deterministic synthetic | Repository Apache 2.0 | No |
| Validation/test fixtures | Documented generator seed/cutoffs | Synthetic | Same, according to team decision | No |

Do not treat public/private options in the general template as permission to use real operational data in Domain 2. No real SME dataset was supplied.

### 4.3 AI-Assisted Development Tools

Startup repair, 21 October: Codex used local shell/Git inspection, the find-docs skill, Context7 CLI and installed Next.js documentation to diagnose the root documentation folder being detected as application routes. It moved the team guides to `docs/team/` and updated links and scope mappings. Standard root dev startup, the existing HTTP smoke checks, production build/TypeScript, moved-document links and explicit scope checks passed. No new dependency, hosted service, runtime model or external publication was used. This resolves the root folder blocker mentioned in earlier development notes below.

**Used generative AI in development/documentation: Yes.** Codex was used for planning/documentation, M0 recommendations, English translation, landing-page design/refinement, persistent backend, rules, adapter/worker, tests, reference inspection and local verification. Runtime neural model usage remains unverified. Codex also assisted the team work pages, assignment updates, parallel-work instructions and local change-scope checker on 21 October using local repository and shell inspection; no runtime model or external service was used for that documentation task.

| Tool & Version | Used For | Extent | Status |
| --- | --- | --- | --- |
| OpenAI Codex; exact model identifier not independently verified | Requirements, English documentation, design, frontend, SQLite backend, purchasing rules, worker/adapter, tests and browser verification | Major during planning and implementation; team review still required | USED |
| Additional development AI | List all code/design/text tools used afterward | Actual minor/moderate/major extent | Do not omit |

Do not invent a development AI model ID when the UI/session does not provide it; state the product and verifiable information.

Landing-page work on 21 October used repository reads, shell/Git inspection, web retrieval and Safari review of the actual [Attio](https://attio.com/) site as the user-requested reference. No Attio assets or text were imported. Codex computer-use tools operated Safari 27.0.1 and Chrome 155.0.8059.85 for local UI checks. No generated raster assets or stock imagery were used.

At the user's request, `antislop@anti-slop` version `3.2.21` from [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop), MIT per its plugin manifest, was installed and verified as enabled. Its core and relevant UI, copy, accessibility, mobile and code-comment guidance were read/applied in `during` mode. The bundled contrast checker was run. Delivery Gate evidence is in [LANDING_PAGE.md](../verification/LANDING_PAGE.md).

The repository-provided ui-ux-pro-max skill at `.agents/skills/ui-ux-pro-max/` was read and its Python design-system/Next.js searches were used. The installed copy has no version/licence metadata; confirm its exact upstream provenance and licence before the final signed declaration. Other pre-existing `.agents/` skills were preserved; their presence alone does not mean they were used. The Sites skill's local-project guidance was read; no hosted Sites project or deployment was created.

Clean installation, lint, types, production build, PRD fixture assertions, HTTP checks and browser interaction/visual checks were performed. The verification report states actual results and limitations. They do not establish full inventory acceptance, real AI accuracy, Replit/RunPod usage or human team review.

The persistent-workflow stage used shell/Git inspection, the installed Next.js documentation, Node built-in SQLite/test/assert/crypto/fs, Python unittest, web retrieval of official RunPod and Chronos source documentation, and Codex computer-use tools for Safari/Chrome desktop/mobile checks. No new JavaScript dependency or hosted service was installed. No image generation, sub-agents, external publication or real supplier messaging was used. RunPod configuration was absent; tests used explicit mocked HTTP responses. The unavailable plugin path was replaced by the catalog's readable antislop core at `~/.agents/skills/antislop/SKILL.md`, in during mode. Actual results and limitations are in [WORKFLOW_2026_10_21.md](../verification/WORKFLOW_2026_10_21.md).

Team review: maximum 100 words. Use only after actually performed:

<!-- WORDCOUNT:declaration_review:100 -->
Registered team members will review and adapt AI-assisted documentation and implementation. They will verify the requirements against official sources, inspect generated code, test stock and purchasing invariants, and reproduce model evaluation. Each member must explain the complete workflow, including forecast limitations, baseline selection, approval, data handling and simulated integrations. The team remains responsible for correctness, originality, security and licensing. This paragraph must be updated to describe review and tests actually completed before signing.
<!-- END_WORDCOUNT -->

Additional stock-tracking stage, 21 October: Codex inspected the pulled source and local Git state, created the local `feat/stock-tracking` branch, and implemented dedicated stock routes, shared response types, ledger-backed queries, a movement adapter and the frontend handoff. Existing SQLite/service logic was reused; no additional library or cloud resource was installed. The installed Next.js route-handler guide was read. The user subsequently requested runtime verification: 60 Node tests and 24 production HTTP scenario groups passed, including isolated-database server restart and duplicate protection. Tests used Node's built-in test/assert/fs/child_process utilities, native fetch and the existing SQLite dependency. Both HTTP server processes stopped and their temporary database was removed. Evidence and limits are in [STOCK_TRACKING_2026_10_21.md](../verification/STOCK_TRACKING_2026_10_21.md). No browser/computer-control session, real inference, external messaging, staging, commit, push or publication was initiated. Team review remains required.

## 5. Sponsor-Provided Resources

Final Yes/No depends on actual usage.

| Sponsor | Resource | How Used | Status |
| --- | --- | --- | --- |
| Replit | Core/platform/credit | Actual app/project deployment | Activation/usage unconfirmed |
| RunPod | Preliminary credit, GPU | Actual forecast inference | Activation/usage unconfirmed |
| Alpha Red / Orbyte | Domain brief/introduction | Capability context and mock-integration design | Written sources read; no live API/data |
| Mentoring/other resource | Complete if applicable | Actual session/use | INPUT REQUIRED |

Essential/replaceable: maximum 100 words.

<!-- WORDCOUNT:declaration_replaceability:100 -->
Replit and RunPod are the planned competition deployment and inference services. Their roles must be demonstrated using the team's own accounts. The application workflow, persistent data model and numerical forecast interface are intended to remain portable to equivalent infrastructure. Orbyte integration is simulated because live platform access was not supplied. Any actual dependency on sponsor-only features, credits or mentoring must be stated after implementation. Portability is an architectural intention, not evidence that another deployment has been tested.
<!-- END_WORDCOUNT -->

### Required proof appendix, inside final declaration PDF

1. Own Replit live URL/project history link or other allowed PH §10.6 proof.
2. Own RunPod dashboard with Pod ID/GPU type/runtime, or serverless endpoint replacing Pod ID.
3. Additional actual request/result/runtime evidence if useful.
4. Redacted secrets; do not fabricate logs or screenshots.

Separate REPLIT PROOF OF USE.pdf / RUNPOD PROOF OF USE.pdf are useful sample-style copies, not a replacement for proof included here.

## 6. Security, Privacy & Responsible Use

### 6.1 Data Handling & Privacy: maximum 150 words

<!-- WORDCOUNT:declaration_privacy:150 -->
The prototype is designed to use only team-created synthetic business, inventory, sales and supplier records. Runtime forecasting receives numerical daily histories, opaque product identifiers and required dates; it does not need customer or supplier personal records. Team registration contacts are kept separately from the operational dataset.

The planned application stores its ledger and workflow records in persistent storage, checks roles on server actions and keeps provider credentials in server-side secrets. Logs and proof materials must exclude keys, passwords and payment details. Real messaging, if implemented, requires appropriate recipient permission and must be declared separately.

Before submission, the team must replace these planned controls with an accurate description of implemented controls, actual account/session or telemetry data, retention, deployment regions and any third-party transfers. The prototype does not establish production PDPA compliance.
<!-- END_WORDCOUNT -->

### 6.2 Known Limitations & Risks: maximum 150 words

<!-- WORDCOUNT:declaration_risks:150 -->
Forecasts are uncertain and synthetic evaluation does not prove accuracy or savings for real SMEs. Observed sales may understate demand during stockouts. Missing history, changing demand and late supplier deliveries can invalidate a recommendation.

The design uses historical-only baselines, explicit data cutoffs, manager approval, version checks and duplicate-action protection. Proposed incoming stock is separated from physical receipts. Provider outages may require a clearly labelled baseline fallback or replay; neither may be described as live model inference.

WhatsApp activation, templates and account readiness are external dependencies. The mandatory demo outbox is simulated unless real messaging is completed and verified. This section must be updated with actual test outcomes and implemented mitigations before the declaration is signed.
<!-- END_WORDCOUNT -->

## 7. Compliance & Readiness

- [ ] All runtime/development resources declared.
- [ ] Versions/licences/attribution verified.
- [ ] No exposed secrets.
- [ ] AI output reviewed/adapted by team.
- [ ] Sponsor resources declared.
- [ ] Accessible prototype/source links tested.
- [ ] Every field complete, word limits checked.
- [ ] Proof appendix included.

Latest landing refinement, 21 October 2026: the user requested removal of purchase previews and a simpler, bolder text-first page. Codex used the same UI guidance and Playwright to inspect Jack & Jill/Attio references, inspect Vogelhaus text (reference screenshots timed out loading fonts), and verify the local page. No reference assets or text were copied. Only frontend application files changed; the previously documented root runtime-folder blocker remains. Lint, TypeScript and an isolated webpack production build passed; current evidence is in `docs/team/frontend.md` and `.artifacts/simple-landing/`. The earlier 38-test result was not rerun for this presentation-only follow-up.

## 8. Declaration

Development usage update, 21 October 2026: Codex refined the existing landing-page copy, spacing, navigation labels and shared blue palette. The agent used ui-ux-pro-max local guidance, antislop in during mode, Context7 CLI for Next.js documentation, installed Next.js documentation, shell checks and Playwright for Attio reference inspection and local browser verification. No Attio assets or copy were incorporated. Lint, TypeScript and 38 existing tests passed; the root build has a documented folder-layout blocker, while an isolated application copy passed a webpack production build. Browser screenshots are local evidence, not deployment or RunPod proof. Human team review remains required.

Leader: Marco Ryan Suseno.

Signature: **LEADER TO COMPLETE AFTER ACTUAL REVIEW**.

Date: **ACTUAL DATE**.

Replace the planned-tense text above with an actual-usage report; do not sign it as fact for implementation that has not happened.
