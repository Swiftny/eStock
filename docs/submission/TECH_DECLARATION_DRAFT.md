# eStock: draft Technical & Tools Declaration

**DRAFT TO COMPLETE FROM ACTUAL USAGE.** A local landing page is implemented; the inventory prototype, runtime model and deployment remain planned. Use the [official template](https://drive.google.com/file/d/1LBXfXrFblX-dHanSP8jhUOMGfGGxY2ew/view), then export one PDF: **SDC2026_TooGoodToBeTrue_TechDeclaration.pdf**.

Non-applicable categories must say No/None. Do not replace unknown facts with None. Complete before signing.

## 1. Team and Project Overview

| Field | Value |
| --- | --- |
| Team Name | TooGoodToBeTrue |
| Project | eStock |
| Leader | Marco Ryan Suseno |
| Email/Phone | .private/TEAM_DETAILS.md; phone not provided |
| University | Xiamen University; check official spelling against portal |
| Live Prototype URL | NOT DEPLOYED; local landing preview only |
| Code Repository | https://github.com/Swiftny/sdc2026-TooGoodToBeTrue-domain2 |

The repository must be public for submission; a correct URL does not itself prove visibility/access.

## 2. Architecture & Technology Stack

### 2.1 Architecture Overview: maximum 200 words

Current implementation: a Next.js landing page with browser-memory synthetic scenarios and manager decisions. No database, model endpoint or messaging integration is connected. The following architecture is for the planned inventory application; update it to actual behaviour before submission:

<!-- WORDCOUNT:declaration_architecture:200 -->
eStock will accept team-created synthetic daily sales and inventory events through CSV import and stock-entry forms. A Replit-hosted application will store its ledger, product policies, incoming purchases, recommendations, approvals and activity records in a persistent database.

The application will send only the numerical history and necessary identifiers to a RunPod forecast worker. A pretrained time-series model will return dated demand estimates and model metadata. Server-side deterministic rules will calculate replenishment quantities and identify shortages using supplier lead time, purchasing cycle, safety stock, packaging and confirmed incoming stock.

An authorised manager will review the recommendation before approval creates a purchase request and transactional outbox message. Supplier acknowledgement and receiving will be separate events. The mandatory demo channel will be explicitly simulated; WhatsApp is optional if configured, and Telegram is an optional extension.

Model errors and baseline selection will be visible. Actual deployment services, versions, regions, model revision and any additional providers must be recorded after implementation.
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
| Database driver/ORM | Ledger/transactions | Enter actual licence | NOT SELECTED |
| Python runtime | Forecast worker | Enter actual licence | PLANNED |
| chronos-forecasting | Pretrained forecast inference | Verify pinned version/licence | PLANNED |
| PyTorch/dependencies | Model execution | Verify actual versions/licences | PLANNED |
| RunPod SDK, if used | Worker handler | Verify actual version/licence | PLANNED |
| Additional component/chart/test library | None added for the landing page | Not applicable | Native controls/SVG, Node assertions and browser checks used |

Local verification environment: Node.js 24.16.0, npm 11.13.0 and Python 3 for skill search/contrast checks. Runtime dependencies and direct-package licences were read from installed metadata; see package-lock.json and THIRD_PARTY_NOTICES.md. Transitive packages retain their own notices. An initial ESLint/eslint-config-next attempt was removed after development-tool audit advisories; it is absent from the final dependency set. Reading model documentation is not evidence that the model has run.

## 3. APIs & Cloud Services

### 3.1 External APIs

| API / Provider | Purpose | Access Tier | Status |
| --- | --- | --- | --- |
| RunPod inference endpoint | Numerical forecasting | Sponsor credit if redeemed; record actual tier | PLANNED |
| WhatsApp Cloud API / Meta | Supplier messaging if completed | Record actual pricing/tier | OPTIONAL, NOT ACTIVE |
| Telegram Bot API | Additional channel if completed | Verify actual terms/tier | OPTIONAL |
| Other API | Complete if used | Actual tier | Do not leave blank if used |

No API keys in this table. Mock Orbyte endpoints are team-created contracts, not resources/APIs supplied by Orbyte.

### 3.2 Cloud Platforms & Deployment

| Service / Provider | Purpose | Plan / Region | Actual proof |
| --- | --- | --- | --- |
| Replit | App/backend/deployment | NOT PROVIDED | Live URL/project history |
| Persistent database provider | Ledger/forecast/workflow | NOT SELECTED | Dashboard/config without secrets |
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
| eStock synthetic sales/movements/master/PO fixtures | Repository generator/data card to be created by team | Team-created synthetic | Team explicitly assigns licence | No |
| Validation/test fixtures | Documented generator seed/cutoffs | Synthetic | Same, according to team decision | No |

Do not treat public/private options in the general template as permission to use real operational data in Domain 2. No real SME dataset was supplied.

### 4.3 AI-Assisted Development Tools

**Used generative AI in development/documentation: Yes.** Codex was used for planning/documentation, M0 recommendations, English translation, landing-page design/code, reference review and local verification. Runtime model usage remains planned.

| Tool & Version | Used For | Extent | Status |
| --- | --- | --- | --- |
| Codex; record exact model/version from actual session if available | Brainstorm review, requirements audit, PRD/templates, handoff, M0 recommendations, English translation, landing-page design/code and local verification | Major during planning, documentation and landing implementation | ALREADY USED |
| Additional development AI | List all code/design/text tools used afterward | Actual minor/moderate/major extent | Do not omit |

Do not invent a development AI model ID when the UI/session does not provide it; state the product and verifiable information.

Landing-page work on 21 October used repository reads, shell/Git inspection, web retrieval and Safari review of the actual [Attio](https://attio.com/) site as the user-requested reference. No Attio assets or text were imported. Codex computer-use tools operated Safari 27.0.1 and Chrome 155.0.8059.85 for local UI checks. No generated raster assets or stock imagery were used.

At the user's request, `antislop@anti-slop` version `3.2.21` from [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop), MIT per its plugin manifest, was installed and verified as enabled. Its core and relevant UI, copy, accessibility, mobile and code-comment guidance were read/applied in `during` mode. The bundled contrast checker was run. Delivery Gate evidence is in [LANDING_PAGE.md](../verification/LANDING_PAGE.md).

The repository-provided ui-ux-pro-max skill at `.agents/skills/ui-ux-pro-max/` was read and its Python design-system/Next.js searches were used. The installed copy has no version/licence metadata; confirm its exact upstream provenance and licence before the final signed declaration. Other pre-existing `.agents/` skills were preserved; their presence alone does not mean they were used. The Sites skill's local-project guidance was read; no hosted Sites project or deployment was created.

Clean installation, lint, types, production build, PRD fixture assertions, HTTP checks and browser interaction/visual checks were performed. The verification report states actual results and limitations. They do not establish full inventory acceptance, real AI accuracy, Replit/RunPod usage or human team review.

Team review: maximum 100 words. Use only after actually performed:

<!-- WORDCOUNT:declaration_review:100 -->
Registered team members will review and adapt AI-assisted documentation and implementation. They will verify the requirements against official sources, inspect generated code, test stock and purchasing invariants, and reproduce model evaluation. Each member must explain the complete workflow, including forecast limitations, baseline selection, approval, data handling and simulated integrations. The team remains responsible for correctness, originality, security and licensing. This paragraph must be updated to describe review and tests actually completed before signing.
<!-- END_WORDCOUNT -->

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

## 8. Declaration

Leader: Marco Ryan Suseno.

Signature: **LEADER TO COMPLETE AFTER ACTUAL REVIEW**.

Date: **ACTUAL DATE**.

Replace the planned-tense text above with an actual-usage report; do not sign it as fact for implementation that has not happened.
