# eStock

Document-assisted inventory for small shops: a Manager reviews supplier-document lines, Staff confirms the goods received, and stock updates with a receipt record.

## Team Information

| Field | Details |
| --- | --- |
| Team Name | Too Good To Be True |
| Team Domain | Domain 2: Orbyte Smart SME Challenge, Less Busywork, Better Business |
| SDG Track | SDG 8: Decent Work and Economic Growth, targets 8.2 and 8.3 |
| Team Leader | Marco Ryan Suseno |
| University | Xiamen University |
| Number of Members | 4 |

## Links

| Resource | Link |
| --- | --- |
| GitHub Repository | https://github.com/Swiftny/eStock |
| Live Demo | https://e-stock-maximillionc.replit.app |
| Slide Deck | [eStock Pitch Deck](https://drive.google.com/file/d/1S-VjjdvYyiEJGxHZgxegV2yD4TMivAoN/view?usp=drive_link) |
| Demo Video | [eStock Pitching Video, 5:14](https://docs.google.com/document/d/1f2744grusTxyCZ9dpsQiQ4UE7lH2FszPg2SYox-0qlo/edit?usp=drive_link) |

The pitching video is **5 minutes 14 seconds**, within the Participant Handbook's 5–7-minute requirement. Before submission, review the full recording for the prototype demonstration and agreement with the deck, repository and live build. Confirm that judges can open both links without the team's login or an access request.

### Demo Access

Open the Live Demo, choose **Open demo**, then select Manager or Staff. The credentials below are public demo credentials for judges. Use only synthetic data in this shared demo.

| Account | Judge access instructions |
| --- | --- |
| Manager | Select **Manager** and enter password `Manager`. |
| Shared Staff | Select **Staff** and enter password `Staff`. |

The live URL is supplied by the team. The architecture and setup below describe this repository; checking that the published Replit version matches the intended GitHub revision remains part of the release checklist.

## Overview

### Problem

Small shops often copy product names and quantities from supplier documents into a spreadsheet or stock book. Re-entering the same details takes time and can introduce mistakes, especially when products use different names or deliveries arrive short. A document also cannot establish what physically arrived, so automatically treating its quantities as received stock can make the inventory inaccurate.

### Solution

eStock uses Gemini to extract a first draft of product lines from a supplier-document photo. The Manager checks the date, product matches and expected quantities, converts package quantities into the product's base unit, and sends the prepared receipt to Staff. Staff checks the physical delivery and confirms actual quantities. That confirmation updates stock and receipt History together, with a Manager notification for discrepancies.

The MVP serves one shop and one warehouse. Its product catalogue, role permissions, receipt workflow and activity records demonstrate a reusable inventory capability for the Orbyte ecosystem. This is a proposed fit; no live Orbyte API integration is claimed.

### Key Features

- **Document-assisted preparation:** camera or file upload, backend extraction, editable product lines and review cues for uncertain values.
- **Product matching:** official product names and confirmed aliases, with Manager correction when a match is ambiguous or missing.
- **Physical receiving:** frozen Manager submissions, Staff entry of actual received quantities, and recorded shortages or extras.
- **Once-only stock intake:** transactional receipt completion, stock balances, Intake movements and required discrepancy notifications.
- **Everyday stock actions:** both roles search inventory and record positive whole-number Take or Return quantities; concurrent Take cannot make stock negative.
- **Role-specific management:** Manager manages products, Opening stock, drafts and full History; shared Staff confirms receiving checks. Shared-account activity does not identify individual employees.
- **Traceable records:** receipt History separates document, sent and checked times and retains Intake details; Stock activity shows Opening, Take and Return. Manager product archive retains historical identity.

### Core Automated Journey

| Stage | eStock behavior |
| --- | --- |
| Trigger | Manager uploads a team-created synthetic supplier document. |
| Connected data | The application uses the product catalogue, confirmed aliases, current stock and receipt state. |
| AI and rules | Gemini extracts document text; application rules validate and match lines. Manager checks uncertain details and prepares base-unit quantities. |
| Human control | Manager reviews and sends expected quantities. Staff physically checks and confirms actual goods before stock increases. No later Manager approval is required. |
| Visible outcome | Actual Intake, stock and receipt History are recorded atomically; quantity differences notify the Manager. |

### Expected Benefit and SDG Contribution

The intended benefit is less repeated typing with a physical check before inventory changes. This supports SDG 8.2 through productivity tools and SDG 8.3 through a workflow designed for small businesses. No measured time-saving or OCR-accuracy percentage is claimed here.

| Measurement | Value or method |
| --- | --- |
| Core KPI | Median end-to-end completion time per synthetic 10-line document, including AI waiting time, Staff confirmation and correct stock posting; manual versus assisted |
| Manual-entry baseline | Proposal planning assumption: 10 minutes per synthetic 10-line document; not a measured result |
| Measured prototype result and sample size | Not yet measured; no timing study conducted. |
| Phase 2 improvement target (%) | At least 30% less median completion time versus the measured manual baseline; a target, not an achieved result. Planned evaluation: at least 10 synthetic documents |

These planning values follow the [Preliminary proposal, §4](submission/SDC2026_TooGoodToBeTrue_Preliminary.pdf). No timing study or achieved improvement is claimed.

### Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, CSS and Manrope |
| Backend | Next.js server routes under `/api/estock` |
| Database | PostgreSQL, `pg`, ordered SQL migrations |
| AI | Server-side Google Gemini API via `@google/genai`; explicitly required model `gemini-3.8-flash`, with no model fallback |
| Hosting | Replit live demo; repository includes `.replit` configuration |
| Local verification | Biome, TypeScript, Node tests, Playwright with Chrome/Edge |

The earlier SQLite forecasting/purchasing code and worker/training material are preserved as historical work. They are outside the active document-assisted inventory workflow. Actual historical tools and AI-assisted development belong in the Technical & Tools Declaration.

RunPod was used earlier in this project for Chronos-2 model training and evaluation. Evidence of that use is included in `submission/`: the [RunPod POU PDF](submission/SDC2026_TooGoodToBeTrue_Runpod_POU.pdf) and [Technical & Tools Declaration, Appendix C](submission/SDC2026_TooGoodToBeTrue_TechDeclaration.pdf). The current receipt-extraction workflow uses Gemini.

## Project Structure

```text
.
├── src/
│   ├── app/                     # Landing, /demo and server API routes
│   ├── components/              # Manager and Staff interfaces
│   ├── lib/server/estock/       # Auth, extraction, inventory and receiving
│   └── styles/                  # Shared design tokens and styles
├── db/estock/                   # PostgreSQL schema and ordered migrations
├── public/                      # Public assets and synthetic fixture templates
├── scripts/                     # Migration and runtime checks
├── tests/estock/                # Isolated API and browser verification
├── docs/                        # PRD, architecture, verification and team notes
├── submission/                  # Final submission PDFs and proof of use
├── worker/                      # Historical forecasting worker
├── training/                    # Historical model-training material
├── .env.example                 # Variable names, without real secrets
├── .replit                      # Replit run and deployment configuration
├── compose.estock.yml           # Optional local PostgreSQL service
├── package.json
├── LICENSE
└── README.md
```

### Architecture

```mermaid
flowchart TD
    M[Manager: upload and review] --> API[Next.js server API]
    API --> G[Gemini: extract document lines]
    G --> API
    API <--> DB[(PostgreSQL: products, drafts and stock)]
    M --> SEND[Send frozen expected quantities]
    SEND --> S[Staff: physical check and confirm actual quantities]
    S --> TX[Atomic receipt completion]
    TX --> DB
    TX --> H[Updated inventory, History and discrepancy notifications]
```

## How to Run

### Option 1: Use the Live Demo

1. Open https://e-stock-maximillionc.replit.app.
2. Select **Open demo**, then sign in using the appropriate demo account.
3. As Manager, prepare a synthetic receipt and **Send to Staff**.
4. As Staff, check actual goods and confirm receiving, then inspect the updated stock. Manager can inspect receipt History and discrepancies.

Use only team-created synthetic documents, supplier details, products and records for the hackathon demonstration.

### Option 2: Run This Repository on Replit

1. Import `https://github.com/Swiftny/eStock` using [Replit's GitHub import](https://replit.com/import).
2. Configure a hosted PostgreSQL database and the server secrets listed below. Secret values are not imported from GitHub.
3. Install dependencies and apply the eStock migrations, then use the configured **Run** command.
4. For a published server app, check production secrets and database selection, build and publish. Pulling GitHub changes does not by itself update the published app; publish the intended revision again.

The repository's [.replit](.replit) supplies the build/start configuration. See the [Replit deployment guide](docs/engineering/REPLIT_DEPLOYMENT.md) for the complete setup and hosted verification steps. The laptop's local Docker database URL cannot be used as a hosted database connection.

### Option 3: Run Locally

Requirements: Node.js **22.18 or newer**, npm, and PostgreSQL. Docker Desktop is optional when using an existing PostgreSQL instance.

```bash
git clone https://github.com/Swiftny/eStock.git
cd eStock
npm ci
cp .env.example .env.local
```

Fill in these server variables in the ignored `.env.local` file:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `GEMINI_API_KEY` | Server API key for document extraction |
| `ESTOCK_MANAGER_PASSWORD` | Manager account password |
| `ESTOCK_STAFF_PASSWORD` | Shared Staff account password; different from Manager in production |
| `ESTOCK_SESSION_SECRET` | Stable random session secret, at least 32 characters |
| `ESTOCK_GEMINI_MODEL` | Required; set exactly to `gemini-3.8-flash`. Blank or other model IDs are rejected |
| `ESTOCK_GEMINI_MEDIA_RESOLUTION` | Optional; blank, `medium` or `high` |

For the supplied local Compose service, use `postgresql://estock:estock_local_only@127.0.0.1:55432/estock` as `DATABASE_URL`, then run:

```bash
docker compose -f compose.estock.yml up -d --wait
npm run db:estock:migrate
npm run dev
```

Open http://localhost:3000/demo. If you use an existing PostgreSQL server, skip the Compose command. Migrations upgrade the schema without resetting existing inventory. Preserve the database volume and existing session secret when updating the application.

The active demo uses real backend extraction, with no mock scan fallback. A Gemini failure leaves stock unchanged. The local-only `ESTOCK_DEMO_ALLOW_SHARED_PASSWORD=true` exception is available during development; production requires separate Manager and Staff passwords. Legacy SQLite/RunPod variables in `.env.example` are not required for this workflow.

### Run Tests

```bash
npm run typecheck
npm run build
npm run test:estock
npm run test:estock:browser
```

The API/browser suites require a reachable test PostgreSQL database and permission to create their own temporary schemas. Set `ESTOCK_TEST_DATABASE_URL`, or use the configured local database. They create synthetic records in isolated schemas and clean up those owned schemas; browser OCR uses a test-only provider stub. Browser checks require installed Chrome, or Edge with `ESTOCK_BROWSER_CHANNEL=msedge`. These tests do not establish broad document OCR accuracy or hosted durability.

## How We Use Replit

- **Live prototype:** the team-provided published app is linked above.
- **Repository configuration:** `.replit` defines Node 22, the development command, deployment build/start commands and the exposed application port.
- **Server secrets:** database credentials, Gemini credentials and account/session secrets are configured outside source control.
- **Release workflow:** pull the intended GitHub revision into the Replit project, check its configuration, publish, and verify the published version.

Proof of use: [SDC2026_TooGoodToBeTrue_Replit_POU.pdf](submission/SDC2026_TooGoodToBeTrue_Replit_POU.pdf). This PDF is tracked in the repository; review it and include the proof in the final Technical & Tools Declaration. A reachable homepage alone does not verify receiving, database persistence or restart/redeploy behavior.

## Verification and Data Handling

Existing [end-to-end QC](docs/verification/END_TO_END_QC_2026_10_24.md) records local PostgreSQL/API and Chrome/Edge checks. The [skip-link report](docs/verification/SKIP_LINK_2026_10_24.md) records the later landing accessibility correction. These reports describe their own tested revisions; they are not new verification of the published Replit app.

The application processes uploaded images transiently and retains structured draft/receipt data rather than uploaded image files. Gemini provider retention and hosting logs/cache behavior require separate review. AI output can be wrong: Manager checks the document, and Staff confirms the physical goods. Package conversion is manual. There are no monetary calculations, purchasing automation or forecasting in the active workflow.

## Challenges & Learnings

- **Document text is not delivery proof:** separate expected quantities from Staff-confirmed actual quantities.
- **OCR can produce plausible mistakes:** preserve review cues and require human checks of names, dates and units.
- **Retries and concurrent actions can duplicate or corrupt stock:** use frozen revisions, request identities and transactional posting.
- **Local and hosted versions can differ:** verify the intended source revision, server secrets, database and published app together.

## Future Improvements

- [ ] Measure task time, correction rate and extraction accuracy on a declared team-created synthetic evaluation set.
- [ ] Strengthen similar-document warnings across separate uploads.
- [ ] Verify physical phone cameras, hosted receiving and persistence across restart/redeploy.
- [ ] Extend the single-shop workflow into a reusable Orbyte connector and multi-business configuration.

## Team

| Name | Role | GitHub |
| --- | --- | --- |
| Marco Ryan Suseno | Team Leader, UI, pitch slides and RunPod | [@Enkhoder](https://github.com/Enkhoder) |
| Maximillion Cang (Maxi) | Database, Backend | [@MaximillionCang](https://github.com/MaximillionCang) |
| William Christiansen | AI | [@Kurrbluu](https://github.com/Kurrbluu) |
| Riakudu Vittorios Surjoraharjo | Frontend and Replit | [@Swiftny](https://github.com/Swiftny) |

Assignments and GitHub accounts follow the team's latest confirmation. Registration contacts remain private.

## Submission Documents

| Document | File or completion field | Status |
| --- | --- | --- |
| Preliminary proposal, official template | [Preliminary PDF](submission/SDC2026_TooGoodToBeTrue_Preliminary.pdf) | Local PDF present; final template/word-limit/signature review and Git inclusion pending |
| Technical & Tools Declaration, official template | [Technical & Tools Declaration PDF](submission/SDC2026_TooGoodToBeTrue_TechDeclaration.pdf) | Local PDF present, including Appendix C RunPod proof; final signature/evidence review and Git inclusion pending |
| Replit proof of use | [Replit POU PDF](submission/SDC2026_TooGoodToBeTrue_Replit_POU.pdf) | Tracked PDF present; final evidence review and declaration inclusion pending |
| RunPod proof of use | [RunPod POU PDF](submission/SDC2026_TooGoodToBeTrue_Runpod_POU.pdf) and [Technical & Tools Declaration, Appendix C](submission/SDC2026_TooGoodToBeTrue_TechDeclaration.pdf) | Both PDFs are in `submission/`; final ownership/runtime proof review and declaration signature review remain pending |
| Pitch deck | [eStock Pitch Deck](https://canva.link/8u8hjvd6aode0fg) | Link supplied; anonymous judge access and alignment with the final pitch remain to verify |
| YouTube pitching video | [eStock Pitching Video](https://youtu.be/ntcX81K0TeE) | Link and 5:14 duration confirmed; full content, audio and prototype demonstration review pending |

The [proposal draft](docs/submission/PROPOSAL_DRAFT.md) and [declaration draft](docs/submission/TECH_DECLARATION_DRAFT.md) are working material, not signed final submissions. Review the final PDFs and remaining proof/access checks before submitting; official final forms require complete, truthful answers, including actual AI-development assistance and sponsor/tool use.

## Submission Checklist

- [x] Team name, Domain 2, SDG track and current responsibilities filled in.
- [x] GitHub repository and live demo links added.
- [x] Apache 2.0 LICENSE file retained.
- [x] Slide deck link added.
- [x] YouTube pitching video linked; reported duration 5:14, within 5–7 minutes.
- [ ] Full video reviewed for a prototype demonstration, readable screens, clear audio and agreement with the final deck/source/live build.
- [ ] Canva deck opens for judges without requesting edit access or requiring the team's login.
- [ ] Judge access instructions completed and tested in a fresh browser.
- [ ] Published demo checked against the intended GitHub revision, including receiving and database persistence.
- [ ] Replit own-account/project proof reviewed, committed and included in the declaration.
- [x] Historical RunPod use stated; proof PDFs included in `submission/`.
- [ ] RunPod ownership/runtime proof reviewed and included in the final declaration.
- [ ] Official preliminary PDF completed within word limits and genuinely signed.
- [ ] Official Technical & Tools Declaration completed, reviewed and genuinely signed.
- [ ] Required submission PDFs named with `TooGoodToBeTrue` and added to `submission/`.
- [ ] Setup steps checked on the submitted revision.
- [ ] Secrets and private records excluded from source, history, screenshots and video.
- [ ] Public repository and designated committee collaborator access verified for judging.
- [ ] Official portal submission completed and judged source/build/materials frozen at the applicable deadline.

See the full [submission checklist](docs/SUBMISSION_CHECKLIST.md) and [compliance matrix](docs/COMPLIANCE_MATRIX.md) for source-specific requirements, deadline clarification and remaining human checks. This README does not by itself establish submission readiness.

## Submission References

- [Official submission resources on Google Drive](https://drive.google.com/drive/folders/1xw7c2aN8N-at8hPEULzkcU76e_FFb0Ef)
- [GitHub submission example used for this README's structure](https://github.com/michaelzhngg/SDC_Hackathon_Submission_Template)
- [Domain 2 brief and marking rubric](https://drive.google.com/file/d/11wqbeO-HYep-DJPQ-LPZnrZfQvCgr5BU/view)
- [Participant Handbook, including deliverables and platform proof](https://drive.google.com/file/d/1fGBS-jevDj_FrF8wsbYNPzyU5TTrfk1V/view)

Project details: [PRD](docs/product/prd.md), [decisions](docs/product/DECISIONS.md), [stock tracking](docs/engineering/STOCK_TRACKING.md), [document intake](docs/engineering/OCR_INTAKE.md), [project context](PROJECT_CONTEXT.md), [build handoff](docs/plans/BUILD_PLAN.md) and [team integration](docs/team/integration.md). The [earlier archived project](docs/archive/2026-10-23-before-document-intake/README.md) remains historical.

## License

This project is licensed under the [Apache License 2.0](LICENSE). Existing third-party notices remain in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
