# eStock: Technical & Tools Declaration working draft

23 October 2026. **Not signed or submission-ready.** Transfer verified facts into the [official TD template](https://drive.google.com/file/d/1LBXfXrFblX-dHanSP8jhUOMGfGGxY2ew/view) and export **SDC2026_TooGoodToBeTrue_TechDeclaration.pdf**. Declare all actual historical/current resource use, even if removed from active MVP. Planned use is not actual use. Unknown is not None; complete every category truthfully.

The existing SQLite replenishment application is legacy; landing/header/sign-in copy now introduces the new direction in the unchanged style. New PostgreSQL/Gemini document intake is a target, not implemented or tested. [Full earlier declaration](../archive/2026-10-23-before-document-intake/docs/submission/TECH_DECLARATION_DRAFT.md.txt) preserves detailed development/verification usage and old scope claims; no original report/evidence was changed.

Landing-copy follow-up, 23 October: Codex used ui-ux-pro-max, antislop during, installed Next.js page guidance, shell/Git, Biome/TypeScript and Playwright to edit text only in landing/header/metadata/sign-in files. Responsive, link, keyboard, reduced-motion, screenshot and contrast checks passed for this scope; scoped Biome passed. Full-project lint/typecheck found pre-existing errors in unchanged forecast code. No new dependency, CSS/layout/backend change, runtime Gemini call, service provisioning, publication or new workflow implementation. [Actual checks and Delivery Gate](../verification/LANDING_COPY_2026_10_23.md).

## 1. Team and project overview

| Field | Entry |
| --- | --- |
| Team / product | TooGoodToBeTrue / eStock |
| Leader | Marco Ryan Suseno |
| Email/phone | Private team record; phone needs completion |
| University | Xiamen University; verify official portal spelling |
| Prototype | Legacy local application exists; no new document-intake deployment/access link verified |
| Source | https://github.com/Swiftny/sdc2026-TooGoodToBeTrue-domain2 — public/judge/committee access still to verify |

Team: Marco leader/AI; Riakudu Vittorios Surjoraharjos frontend; Maximillion Cang data; William Christiansen system/backend.

## 2. Architecture and technology stack

### 2.1 Architecture overview: maximum 200 words

<!-- WORDCOUNT:declaration_architecture:200 -->
The preserved legacy application uses Next.js, TypeScript, plain CSS and Node SQLite for stock, sales history, numerical analysis, purchasing and simulated supplier workflows. Earlier local reports verify those scopes only. Historical RunPod artifacts record Chronos-2 fine-tuning and evaluation; a connected application-to-Serverless deployment is not established.

The new target is document-assisted inventory for one shop and warehouse. A role-scoped backend will send transient images to Gemini, validate non-monetary extraction and save structured drafts in PostgreSQL. Application logic will match official names and confirmed aliases. A Manager will correct fields, manually convert base-unit quantities and confirm actual receipt before atomic Intake and History updates. Staff will search and perform Take or Return.

Separate Manager and shared Staff accounts, saved drafts, concurrency protection and image non-retention are requirements, not verified implementations. Exact model, SDK, ORM, hosting and account tier remain unresolved. Replit is mandatory with own-project evidence. Hosted Gemini leaves the RunPod wording conflict open; historical GPU use remains declarable. No new code, migration, runtime configuration, paid API call or deployment occurred in this documentation task.
<!-- END_WORDCOUNT -->

### 2.2 Languages, frameworks and libraries

Historical local package inspection on 21 October is preserved below; no dependency/lockfile was changed or fresh package audit run here. Final declaration must match actual installed/deployed artifacts and include transitive notices where required.

| Name/version from historical record | Purpose / scope | Licence / verification |
| --- | --- | --- |
| Next.js 16.4.2 | Existing web/server foundation | MIT |
| React / react-dom 19.3.1 | Existing UI | MIT |
| TypeScript 6.0.3 | Existing compiler/types | Apache-2.0 |
| @fontsource-variable/manrope 5.3.0 | Local existing font | OFL-1.1; full licence retained under public/licenses |
| @biomejs/biome 2.5.15 | Existing lint/format tooling | MIT OR Apache-2.0 |
| @types/node 26.6.5; @types/react/@types/react-dom 19.3.0 | Development types | MIT |
| Node built-ins, including SQLite | Legacy ledger/persistence; no ORM | Node MIT/third-party notices; SQLite public-domain dedication |
| Python | Historical worker/training/check tooling | PSF and distribution notices; actual environments in reports |
| AutoGluon 1.6.3; torch 2.13.0+cu130 | Historical RunPod training/evaluation | Preserve actual package licences/resolved lock; not newly installed |
| RunPod SDK / worker dependencies | Historical model/worker tooling | Actual lock/artifact inventory, not candidate ranges; plan records runpod 1.12.0 pin |
| PostgreSQL / Gemini SDK / ORM | New target, not selected/installed here | Model/SDK/version/hosting/licence/terms unresolved; no assumed paid tier |

See [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md), existing lockfiles, `training/requirements-lock.txt` and historical reports. No new component/chart/animation/test dependency was added by the documentation task.

## 3. External APIs and cloud services

| API/provider | Use | Tier / status |
| --- | --- | --- |
| Gemini API / Google | Planned backend image extraction | **PLANNED**, model/SDK/tier/terms/retention unresolved; no live OCR call here |
| RunPod | Actual historical GPU training/evaluation; old server forecast adapter remains | Historical usage recorded; own-account/credit details and proof completeness need final team review; no new Serverless call/deployment claimed |
| WhatsApp / Telegram | Former optional messaging direction | Not active/new core; no actual messaging usage established by this update; declare if team used separately |
| Orbyte | Proposed future hub contracts | No live supplied API/sandbox or working integration; X-09 verbal workspace issue separate |

| Service | Actual or planned purpose | Plan/region/proof status |
| --- | --- | --- |
| Replit | Must form part of hackathon solution | Own account/project use/proof and actual deployment/durability unverified; mandatory, not optional |
| PostgreSQL hosting | New structured inventory storage target | Provider/plan/region/backup/ORM undecided; no migration/provisioning here |
| Local SQLite file | Existing legacy runtime storage | Earlier local persistence reports; not hosted durability proof |
| RunPod Pod | Historical RTX 4090 training run | Earlier plan records EUR-IS-2; reconcile with own dashboard/proof before signing |
| GitHub | Existing source/history repository | Visibility/committee access/final judged commit require verification; no Git mutation here |
| YouTube | Required future 5–7-minute pitch/demo | No aligned video URL verified |

Google Drive read connector and public web reads were used for documentation-source verification, not as application runtime APIs. No API key/password/payment detail belongs in this table or proof.

## 4. Models, datasets and AI-assisted development

### 4.1 Models

| Model | Usage | Evidence / terms |
| --- | --- | --- |
| `autogluon/chronos-2`, revision `60088152a34e242427b44c3100014473a0157d53` | Historical LoRA fine-tuning/evaluation on RunPod RTX 4090, run `20261021T110320Z` | `submission/evidence/run_info.json`, metrics/selection and dashboard/usage/terminal assets; prior source records Apache 2.0; preserve/verify actual upstream notices |
| Legacy Chronos-Bolt candidate/configuration and local baselines | Old adapter/worker and fake-dependency tests; candidate configuration is not proof of a live model | Reports describe their own local scope; do not confuse candidate model with historical Chronos-2 run |
| Gemini model | Planned image understanding/structured extraction | Exact model/version/account tier/terms not chosen; no successful live OCR claim |

Historical numerical metrics remain historical synthetic forecasting results. They do not establish OCR accuracy/time savings or new-product acceptance. No fine-tuning/RAG/embeddings/self-hosted GPU/training pipeline is needed by the new core.

### 4.2 Datasets

| Dataset | Provenance / purpose | Status |
| --- | --- | --- |
| Existing application/test fixtures | Team-created literal/deterministic synthetic inventory/sales data; original source and reports retained | Legacy, not new OCR dataset; repository licence subject to notices |
| Generated 168-day DEMO history | `data/generate_history.py`, seed 20261021, 840 rows | Historical training/evaluation; data-card hashes retained |
| Team 2020–2026 SYN daily/weekly/monthly history | Historical training input | Generator/seed/author provenance pending in `data/DATA_CARD.md`; do not claim verified synthetic provenance until resolved |
| New document-intake evaluation | Team-created synthetic images/suppliers/products/ground truth only | Planned, not generated/evaluated here; no real Indonesian/Malaysian business receipts |

Authored synthetic fixture images differ from transient uploaded application copies. A real-world pilot is separate future activity. All actual datasets/models used remain declarable after the pivot.

### 4.3 AI-assisted development tools

**Generative AI used: Yes.** Codex assisted planning, documentation/translation, historical UI/code/worker/test work and this documentation pivot. Exact development-model identifier is not independently verified; do not guess it. Extent: major assistance, with team review/adaptation/responsibility still required. Full earlier tool/reference/check history remains in the archived declaration and original reports.

Documentation-pivot task: local shell/Git read inspection, documentation writes/checks with Python, connected Google Drive source reads, public web reads, and reading existing skill requirements. That task used no sub-agents, UI/code edit, generated visual asset, dependency installation, running-service action, database change, paid model API, infrastructure or external messaging. The separately authorised landing-copy follow-up is recorded above; no new API-specific implementation was attempted.

Team review/responsibility: maximum 100 words.

<!-- WORDCOUNT:declaration_review:100 -->
Team review and sign-off remain required. Members must review and adapt AI-assisted documents and source, confirm product decisions and resource usage, and explain the complete workflow. Existing verification reports cover legacy scopes only. This update checks documentation consistency, requirement coverage, links, word limits and preservation; it does not establish OCR, PostgreSQL or application acceptance. Before signing, the team must supply actual implementation tests, synthetic evaluation, deployment evidence and final private-channel checks, then reconcile every claim with the submitted build.
<!-- END_WORDCOUNT -->

## 5. Sponsor-provided resources

| Resource | Actual/planned scope | Final action |
| --- | --- | --- |
| Replit | Mandatory inclusion; actual use/proof not established here | Include own-project live URL/history or permitted credit-finished proof under PH §10.6 |
| RunPod | Actual historical GPU training/evaluation | Include own-dashboard Pod ID/GPU/runtime proof under PH §10.7; endpoint replaces Pod ID only if Serverless used |
| Orbyte briefing/workspace alignment | Earlier planning reference and separate verbal requirement | Declare actual team use/mentoring only; no supplied live API/data or invented integration |
| Other sponsor resources/credits/mentoring | Team facts required | Do not infer redeemed credits/attendance from advertised benefits |

Essential/replaceable: maximum 100 words.

<!-- WORDCOUNT:declaration_replaceability:100 -->
Replit is mandatory for hackathon compliance, with own-account/project evidence still required. Historical RunPod GPU use must remain declared even though the new MVP does not require a self-hosted GPU pipeline. The conflict between GPU-conditional handbook wording and the older sample's general requirement needs written clarification for hosted Gemini. No exemption is assumed. Portable application contracts and PostgreSQL data are design intentions, not tested alternative deployments. Gemini is the target extraction provider; replacement would need fresh validation and terms review. No working Orbyte integration is claimed.
<!-- END_WORDCOUNT -->

Proof appendix must remain inside the final declaration PDF: Replit own-project evidence, historical RunPod own-dashboard proof and relevant actual run metadata, with secrets redacted. Existing artifacts require human review for completeness; no new proof was created here. Separate proof PDFs may supplement but do not replace the appendix.

## 6. Security, privacy and limitations

### 6.1 Data handling: maximum 150 words

<!-- WORDCOUNT:declaration_privacy:150 -->
Hackathon operational and evaluation records, supplier details, products and document images must be team-created synthetic data. Registration contacts remain separate and private. The existing legacy application has its earlier documented data handling; the new document-intake controls are requirements, not verified implementations.

The target backend will validate non-monetary extracted fields and keep Gemini credentials secret. Uploaded images may exist transiently for preview and processing, with no permanent copies in application database, disk, object storage, browser storage, logs, telemetry or caches. Saved drafts contain structured data without the original image; later comparison requires re-upload. Entire provider responses containing excluded amounts or images must not be retained.

This application policy does not establish Gemini zero retention. Before a separate real-world pilot, verify provider terms, account tier, processing and retention, hosting transfers and applicable privacy obligations. Final declarations must describe actual account/session and telemetry data, retention and implemented protections.
<!-- END_WORDCOUNT -->

### 6.2 Known limitations: maximum 150 words

<!-- WORDCOUNT:declaration_risks:150 -->
Gemini may misread names, dates, quantities or units, and structured output still needs backend validation. Matching aliases can be ambiguous; variants must not be silently merged. Managers must correct uncertain fields, convert package units manually and confirm actual receipt. An image cannot prove delivery, hidden carton contents or condition.

Planned safeguards include role checks, immutable approval snapshots, complete transaction rollback, persistent retries and concurrency protection. They are not yet verified for the new workflow. Single-draft protection does not prevent every duplicate image uploaded separately; similarity warnings are P1. The shared Staff account cannot identify individuals, and Return is not linked to an earlier Take.

Provider outages, image re-upload needs, hosting persistence and retention terms remain risks. Mocks must be labelled. No OCR accuracy, savings, pilot or deployment result is claimed; historical forecasting results do not transfer to this product.
<!-- END_WORDCOUNT -->

## 7. Compliance and readiness

- [ ] All actual current/historical tools/models/datasets/cloud/sponsor use declared.
- [ ] Actual versions/licences, dataset provenance and own-account proof verified.
- [ ] No secrets/private contacts exposed; app/provider retention claims accurate.
- [ ] Team reviewed/adapted and can explain AI-assisted output.
- [ ] Prototype/source/access/evidence match the actual submitted build.
- [ ] All official fields/word limits/No-None answers accurate; no unknown disguised as None.
- [ ] Private Discord/portal/workshop/attendance checks and unresolved conflicts handled honestly.
- [ ] Leader signs actual final PDF after review.

## 8. Declaration

Leader: Marco Ryan Suseno. Signature: **LEADER TO COMPLETE**. Date: **ACTUAL SIGNING DATE**. No signature, final PDF or readiness completion is produced by this task. Update target-tense passages to accurate implemented status before signing.
