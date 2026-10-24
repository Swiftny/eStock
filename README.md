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

Open the [Live Demo](https://e-stock-maximillionc.replit.app/), click **Open demo**, select an account, and enter its password in **Access code**.

| Account to select | Password / access code |
| --- | --- |
| **Manager** | **`Manager`** |
| **Staff** | **`Staff`** |

Passwords are case-sensitive: capital **M** for `Manager`, capital **S** for `Staff`. These are public demo accounts; no registration is needed. Follow [How to Run](#how-to-run) for the complete login, account-switching and receipt walkthrough. Use only synthetic data in this shared demo.

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

Choose **Option 1** to try the published app immediately. Options 2 and 3 are for running your own copy on Replit or your computer.

### Option 1: Use the Live Demo

#### 1. Open the app and sign in

1. Open **[eStock Live Demo](https://e-stock-maximillionc.replit.app/)**.
2. On the landing page, click **Open demo**.
3. On **Sign in to eStock**, select the account you want to use.
4. Enter its password in the **Access code** field, then click **Sign in**.

| Account to select | Password / access code | What you can try |
| --- | --- | --- |
| **Manager** | **`Manager`** | Manage products, scan documents, review and send drafts, inspect receipt History and discrepancy notifications, and record Take/Return |
| **Staff** | **`Staff`** | Open Pending checks, confirm actual received quantities, view inventory, and record Take/Return |

**Manager's password is `Manager`. Staff's password is `Staff`.** Both are case-sensitive: use a capital **M** or **S**, with no spaces before or after the password. Select the matching account before signing in. No email address or account registration is needed for these demo accounts.

The published demo is ready to open in a browser; visitors do not need to install the project or provide an API key. These are the team's public demo credentials.

#### Sample synthetic receipt

The sample image is stored in **`public/fixtures/receipts/`** in this repository.

Use [synthetic-receipt-01.png](public/fixtures/receipts/synthetic-receipt-01.png) to try the scan. Open the image link, download the original PNG, then upload it under **Scan receipt**. The sample is a clearly labelled synthetic delivery note, inspired by the document shown in the pitching video.

| Printed field | Expected content |
| --- | --- |
| Document date | `2026-10-24` |
| Lamp 5W | `20 pcs` |
| Lamp 10W | `20 pcs` |
| Extension cable 3m | `5 pcs` |

The document includes example RM prices; eStock ignores monetary fields during extraction. Review the date, product matches and quantities before sending to Staff. See the [sample notes](public/fixtures/receipts/README.md) for its origin and OCR-check scope.

#### 2. Try the Manager workflow

1. Sign in as **Manager** with password **`Manager`**. The app opens **Inventory**.
2. Open **Scan receipt** and upload or photograph a **team-created synthetic supplier document**. Use a clear image with a readable date, product names and quantities. Supported upload formats are JPEG, PNG and WebP, up to 6 MB.
3. Click **Create draft** and wait for document extraction to finish.
4. In the draft, check the document date and each product line. Confirm the **Official product** selection; correct an unsuitable match or use **Create new product** for an item that is missing from the catalogue.
5. Set each expected quantity as a whole number in the product's base unit. Convert packs or boxes manually before sending.
6. Click **Send to Staff** when all details are correct. The submitted details are frozen while Staff checks the delivery.

Creating a draft or sending it to Staff does **not** increase stock. Stock increases when Staff confirms the quantities actually received.

#### 3. Try the Staff workflow

1. Switch from Manager to Staff using the account-switching steps below, or open a separate browser session. Sign in as **Staff** with password **`Staff`**.
2. Open **Pending checks** and select the receipt sent by Manager.
3. Compare each expected quantity with the delivery. Open each product line and enter the quantity actually received, including `0` if none arrived.
4. Review all lines, then click **Confirm received goods**. eStock records the actual Intake and updates inventory and receipt History together.
5. Open **Inventory** to see the stock balance. Manager can then inspect **History** and any discrepancy notification. No additional Manager approval is required after Staff confirmation.

For a synthetic demonstration, use declared sample delivery counts. **Example:** Manager expects `10` units and Staff confirms `8`; eStock adds `8` units and records a shortage of `2`.

#### 4. Switch accounts or use two devices

- To switch roles in one browser, click the **eStock logo** to return to the landing page. Click **Sign out** in the top navigation and confirm the sign-out dialog. Click **Open demo** again, select the other account and enter its password.
- To view both roles at once on one computer, use a normal browser window for Manager and a private/incognito window or another browser for Staff. Tabs in the same browser profile share the login session.
- On two laptops or phones, open the **same live demo URL** on both devices. Sign in as Manager on one and Staff on the other. Both use the published app's shared inventory database; refresh the relevant view if a recent change has not appeared yet.

Both accounts can also open Inventory, find a product and record **Take** or **Return**. Enter a positive whole-number quantity; Take cannot exceed the available stock. Return records usable goods returned to inventory.

Use synthetic documents, supplier details, products and records throughout the competition demo. The live demo is shared, so its existing products and balances may reflect another visitor's activity.

### Option 2: Run Your Own Copy on Replit

1. Import `https://github.com/Swiftny/eStock` using [Replit's GitHub import](https://replit.com/import).
2. Connect a hosted PostgreSQL database. Set `DATABASE_URL` to that database's connection string.
3. In Replit **Secrets**, add the server variables in the table below. To use the same account passwords as the public demo, set these exact values:

   ```dotenv
   ESTOCK_MANAGER_PASSWORD=Manager
   ESTOCK_STAFF_PASSWORD=Staff
   ESTOCK_GEMINI_MODEL=gemini-3.8-flash
   ```

   Also supply your `GEMINI_API_KEY` and a random `ESTOCK_SESSION_SECRET` of at least 32 characters. GitHub imports do not include your private secret values.

4. In the project Shell, install dependencies and prepare the database:

   ```bash
   npm ci
   npm run db:estock:migrate
   ```

5. Click **Run**, then open **Preview**. This repository's [.replit](.replit) runs the development server on port 3000.
6. Open **Open demo** and sign in with **Manager / `Manager`** or **Staff / `Staff`**, using the same steps as Option 1.
7. To make your copy available at a public URL, open **Publishing**, confirm the production database and production secrets, then publish. If you keep the passwords above, the published copy uses those same credentials.

Development and production can use separate databases. All visitors to one published copy use its configured production database. When updating an existing deployment, retain its production data; leave **Copy your development database to production database** unchecked unless you intend to replace the production contents.

After a GitHub update, pull the intended revision into Replit and **Republish** to update the public app. After changing a production API key or password, confirm the value in production secrets and republish. The laptop's local Docker database URL is for local development only; a hosted app needs a database reachable from Replit.

These commands describe this repository's Next.js setup. For further configuration and release checks, see the [Replit deployment guide](docs/engineering/REPLIT_DEPLOYMENT.md).

### Option 3: Run Locally

#### 1. Install the prerequisites and dependencies

You need **Node.js 22.18 or newer**, npm, Git, a Gemini API key with access to `gemini-3.8-flash`, and PostgreSQL. Install and start Docker Desktop if you want to use the supplied local PostgreSQL service.

```bash
git clone https://github.com/Swiftny/eStock.git
cd eStock
npm ci
```

#### 2. Create your local configuration

Copy `.env.example` to `.env.local` in the project root, alongside `package.json`. For a new setup, use the command for your terminal:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env.local
```

**macOS / Linux / Git Bash:**

```bash
cp .env.example .env.local
```

If `.env.local` already exists, edit that file and keep your existing connection details and secrets. For the supplied Docker database, configure these values:

```dotenv
DATABASE_URL=postgresql://estock:estock_local_only@127.0.0.1:55432/estock
GEMINI_API_KEY=REPLACE_WITH_YOUR_GEMINI_API_KEY
ESTOCK_GEMINI_MODEL=gemini-3.8-flash
ESTOCK_MANAGER_PASSWORD=Manager
ESTOCK_STAFF_PASSWORD=Staff
ESTOCK_SESSION_SECRET=REPLACE_WITH_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS
```

Replace the API-key and session-secret placeholders before starting. You can generate a session secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value into `ESTOCK_SESSION_SECRET`. Keep `.env.local` out of Git.

| Server variable | Value or purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. Use the Docker URL above for the supplied Compose service, or your own PostgreSQL connection string |
| `GEMINI_API_KEY` | Your server-side Gemini API key, used to read document images |
| `ESTOCK_GEMINI_MODEL` | Set exactly to `gemini-3.8-flash`; blank or other model IDs are rejected |
| `ESTOCK_MANAGER_PASSWORD` | Set to `Manager` to sign in as Manager with password `Manager` |
| `ESTOCK_STAFF_PASSWORD` | Set to `Staff` to sign in as Staff with password `Staff` |
| `ESTOCK_SESSION_SECRET` | A stable random secret of at least 32 characters, used for login sessions |
| `ESTOCK_GEMINI_MEDIA_RESOLUTION` | Optional: leave blank, or set `medium` or `high` |

The passwords `Manager` and `Staff` are different, so this setup does not need the shared-password development exception. Legacy SQLite/RunPod variables in `.env.example` are not required for the current inventory workflow.

#### 3. Start PostgreSQL and prepare the tables

With Docker Desktop running, start the supplied database:

```bash
docker compose -f compose.estock.yml up -d --wait
```

If you already have a PostgreSQL server, skip that command and use its connection string in `DATABASE_URL`. Then apply the eStock schema:

```bash
npm run db:estock:migrate
```

Wait for `eStock PostgreSQL schema is ready.` before continuing. Migrations prepare or upgrade the tables without resetting existing inventory.

#### 4. Start eStock and log in

```bash
npm run dev
```

Keep the terminal running and open **http://localhost:3000/demo**. Select **Manager**, enter **`Manager`** in Access code and click **Sign in**. For Staff, select **Staff** and enter **`Staff`**. Follow the Manager and Staff workflows in Option 1.

A fresh local database starts with its own records; it does not download inventory from the public Replit demo. Local Manager and Staff sessions share whichever database you configured in `DATABASE_URL`.

To stop the development server, press **Ctrl+C**. Run `npm run dev` again to restart it. Keep the Docker database volume and existing session secret when updating your local copy. After editing `.env.local`, restart the server so you can confirm it is using the intended configuration.

For a local production build, stop the development server and run:

```bash
npm run build
npm run start
```

### Troubleshooting

| What you see | What to check |
| --- | --- |
| Incorrect account password | Select Manager and enter `Manager`, or select Staff and enter `Staff`. Passwords are case-sensitive. For your own copy, check that the environment variables contain those exact values |
| Authentication is not configured | Set both account passwords and a session secret of at least 32 characters. For Replit, check the environment used by the failing app: Preview or the published deployment |
| Could not connect to the database | Start PostgreSQL, check `DATABASE_URL` and run `npm run db:estock:migrate`. Replit needs a hosted connection rather than your laptop's `127.0.0.1` address |
| Document extraction fails | Check the image format and size, `GEMINI_API_KEY`, access to `gemini-3.8-flash`, and provider quota/availability. Check Drafts before retrying in case a draft was already created |
| Staff has no pending check | Manager must finish the draft and click Send to Staff. Confirm both sessions use the same app/database and refresh Pending checks |
| Stock has not increased after scanning | Staff must confirm the actual received quantities. Scanning and Send to Staff leave stock unchanged |
| A production secret change has not appeared | Confirm the new value in production secrets and republish the Replit app |

Document extraction calls Gemini through the backend. A provider failure leaves stock unchanged; there is no mock scan fallback in the active app.

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
