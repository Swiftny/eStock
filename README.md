# eStock

eStock's approved direction is **document-assisted inventory for one shop and one warehouse**: turn supplier-document lines into a reviewed stock-intake draft, then update inventory only after a Manager confirms actual receipt. Staff search products and use Take or Return.

TooGoodToBeTrue · Xiamen University · SDC Hackathon 2026 · Domain 2, Orbyte Smart SME Challenge · SDG 8.2/8.3. eStock is a team proposal, not an official Orbyte module or a working Orbyte integration.

## What exists and what is planned

| Layer | Status on 23 October 2026 |
| --- | --- |
| Existing website and application | Landing/header/sign-in text now describes the new product, retaining the existing style. The local SQLite demo still uses legacy inventory, sales/history, forecasting/baselines, replenishment, simulated PO/outbox/receiving and audit |
| New approved product | Manager image upload → Gemini draft → official-name/alias matching → Manager review and actual-receipt approval → Intake + movement History; simple shared-Staff Take/Return |
| Target stack | Reuse Next.js/TypeScript where suitable; PostgreSQL structured data and backend Gemini API. Migration, accounts, OCR and new approval workflow **not implemented or verified** |
| Verification | Existing [reports](DOCUMENT_STATUS.md) describe legacy checks only. No new application tests, live OCR, PostgreSQL migration or deployment checks were run by this documentation task |

The landing page now introduces document-assisted inventory and clearly says scanning is planned. Its Open demo links still lead to the earlier application, whose role selector permits legacy actions that differ from the new role matrix. It is not a demonstration of the new PRD. The user authorised the landing-copy follow-up only; implementing the new workflow still requires explicit instruction.

The [copy verification report](docs/verification/LANDING_COPY_2026_10_23.md) records responsive, link, keyboard and contrast checks. Scoped lint passes; full-project lint/typecheck encounter pre-existing errors in unchanged `src/lib/server/forecast.ts`. No CSS/layout or backend behaviour changed.

## Approved scope

Manager alone creates/edits products, enters Opening stock, scans/uploads, reviews/edits/matches/approves/discards drafts and sees full History. Manager and Staff view/search stock and perform Take/Return. MVP has a separate Manager account and one shared Staff account; History identifies that shared account/role, not individual employees. Backend permission checks are required.

Products have an official name, one base unit, Opening and generated internal ID; no mandatory user-entered SKU/barcode/shelf location. Final quantities are integers. Opening 0 is an explicit catalogue-setup clarification; unknown products created during review start at zero, then receive Intake once on approval. Intake/Take/Return quantities are positive. Concurrent Take cannot make stock negative. Return means usable goods physically returned, not a refund or linked reversal of a previous Take.

An image does not prove goods arrived. Manager must confirm actual receipt before stock increases, including for an invoice or order-detail image. Drafts persist as structured data, Approved is immutable and one draft posts only once atomically. Preserve raw versus approved fields and Document date versus server Approved at; an old printed date never backdates the ledger. Present MYT. Convert cartons manually to base units; aliases do not retrain Gemini. Low stock is strictly below 5, including zero; exactly 5 is not Low stock.

No prices, monetary calculations, forecasting, purchasing policies, outboxes, PO management, budgets, fine-tuning, RAG, embeddings, self-hosted GPU inference or training pipeline in the new MVP. Similar-document warnings across separate uploads are P1; single-draft protection is not universal duplicate-image prevention.

Only team-created synthetic images, products, supplier details and test records are permitted for the hackathon. Uploaded images may exist transiently but must not remain in app database/disk/object/browser storage, logs, telemetry or caches. Reopened drafts have no original image; Manager must re-upload for comparison. Gemini's own retention/terms/tier must be verified before any separate future real-world pilot.

## Existing local setup: legacy only

The existing commands/configuration remain unchanged. Historical local setup requires Node 22.18+ for built-in SQLite; Python is used by legacy worker/tests. The prior [README snapshot](docs/archive/2026-10-23-before-document-intake/README.md.txt) retains detailed setup/rehearsal/API guidance. These commands run the old application, not PostgreSQL/OCR:

```sh
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

No commands above were executed in this documentation task. Legacy default database is ignored `data/estock.sqlite`; normal startup is documented as empty. Do not reset/populate it or change running services to inspect the new concept. `/`, `/login` and `/demo` remain legacy routes. Existing cloud/secret setup is not new Gemini configuration. Historical [stock](docs/verification/STOCK_TRACKING_2026_10_21.md), [forecast](docs/verification/FORECASTING_2026_10_21.md), [integration](docs/verification/INTEGRATION_2026_10_22.md), [UI](docs/verification/UI_2026_10_22.md) and [automatic SKU](docs/verification/AUTO_SKU_2026_10_22.md) evidence remains intact.

## Read and coordinate

Start with [AGENTS.md](AGENTS.md), [context](PROJECT_CONTEXT.md), [English PRD](docs/product/prd.md), [decisions](docs/product/DECISIONS.md), [stock specification](docs/engineering/STOCK_TRACKING.md), [OCR intake specification](docs/engineering/OCR_INTAKE.md), [build handoff](docs/plans/BUILD_PLAN.md) and [team integration](docs/team/integration.md). The [Indonesian source](docs/product/sources/PRD_ID_2026_10_23.md) is preserved; [superseded documentation](docs/archive/2026-10-23-before-document-intake/README.md) is historical. Existing scope scripts are unchanged and need future coordination for new modules.

| Member | Assignment | University |
| --- | --- | --- |
| Marco Ryan Suseno | Leader / AI | Xiamen University |
| Riakudu Vittorios Surjoraharjos | Frontend | Xiamen University |
| Maximillion Cang | Data | Xiamen University |
| William Christiansen | System / backend | Xiamen University |

Private registration contacts stay outside public documentation. Repository: [Swiftny/sdc2026-TooGoodToBeTrue-domain2](https://github.com/Swiftny/sdc2026-TooGoodToBeTrue-domain2).

## Competition and submission status

[Compliance matrix](docs/COMPLIANCE_MATRIX.md) and [checklist](docs/SUBMISSION_CHECKLIST.md) retain all six preliminary deliverables: official-template proposal PDF, deck, accessible working prototype, Technical & Tools Declaration with actual proof, public GitHub source with Apache 2.0/committee access, and a 5–7-minute YouTube pitch/demo. Drafts are not completed deliverables.

Replit is mandatory with own-account/project evidence (PH §9.2/§10.6); deployment and durable hosted storage remain unverified. PH §9.3 ties RunPod to GPU work and §10.7 requires proof for teams that used it. The older sample's general Required wording remains unresolved (X-03); hosted Gemini creates no invented exemption. Historical [RunPod training/evaluation](docs/plans/AI_RUNPOD_PLAN.md) remains declarable; it is not OCR evidence or proof of a connected Serverless app.

PH/earlier orientation: **25 October 2026, 07:59:59 AM MYT**. [Website](https://sdchack.my/) and [FAQ](https://sdchack.my/faq) still show **11:59 PM MYT**. Use the earlier cutoff pending written clarification; internal target **24 October 2026, 20:00 MYT**. Freeze judged materials after the applicable deadline. Latest private announcements, portal fields, attendance, workshops, signatures and final access still require team verification.

The original [Apache 2.0 LICENSE](LICENSE), Git history and historical evidence are preserved. See [third-party notices](THIRD_PARTY_NOTICES.md). The documentation pivot changed no application files; the subsequent authorised copy update changed only text in four frontend/shared files. Dependencies, CSS, backend, database schema, configuration and tests remain unchanged. No commit/push/publication or paid model call was made. Neither task authorises implementing the new workflow.
