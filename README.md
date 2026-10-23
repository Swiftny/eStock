# eStock

eStock's approved direction is **document-assisted inventory for one shop and one warehouse**: turn supplier-document lines into a reviewed stock-intake draft, then send a frozen receipt to shared Staff. Staff checks physical goods and immediately posts actual received quantities once. Manager receives informational alerts for differences. Both roles search Inventory and use Take or Return.

TooGoodToBeTrue · Xiamen University · SDC Hackathon 2026 · Domain 2, Orbyte Smart SME Challenge · SDG 8.2/8.3. eStock is a team proposal, not an official Orbyte module or a working Orbyte integration.

## Current demo

| Layer | Status on 24 October 2026 |
| --- | --- |
| Website | `/demo` contains separate Manager and Staff views. Staff search stock and record Take/Return. Manager can also manage products, upload documents, prepare/send/recall drafts, Delete products and inspect History. Staff receives pending checks and confirms actual goods. |
| Data and AI | New `/api/estock` backend and PostgreSQL schema implement the document-intake workflow. The image goes to Gemini from the server, and extracted lines stay in a reviewable draft until Staff physically checks and confirms actual receipt. |
| Legacy code | The earlier SQLite replenishment/forecasting source remains for historical context; it is outside this demo workflow. |
| Verification | Current types/build, retained new-demo PostgreSQL/API checks and isolated headless Chrome journeys are recorded in the [Staff-receiving verification](docs/verification/STAFF_RECEIVING_2026_10_24.md). New-demo lint passes; unrelated legacy formatting remains separate. Physical camera/mobile device, live Gemini and deployment remain unverified. The [pre-push audit](docs/verification/PRE_PUSH_PRD_AUDIT.md) is the earlier findings snapshot. |

The [copy verification report](docs/verification/LANDING_COPY_2026_10_23.md) describes the earlier landing-copy task; it does not verify the new demo.

## Approved scope

Manager alone creates/edits products, enters Opening stock, scans/uploads, prepares/edits/matches/sends/recalls/discards drafts and sees full History. Shared Staff alone confirms receiving checks. Manager Delete archives products even with remaining stock, retaining history. Manager and Staff view/search stock and perform Take/Return. MVP has a separate Manager account and one shared Staff account; History identifies that shared account/role, not individual employees. Backend permission checks are required.

Products have an official name, one base unit, Opening and generated internal ID; no mandatory user-entered SKU/barcode/shelf location. Final quantities are integers. Opening 0 is an explicit catalogue-setup clarification; unknown products created during review start at zero, then receive actual Intake once at Staff confirmation. Intake/Take/Return quantities are positive. Concurrent Take cannot make stock negative. Return means usable goods physically returned, not a refund or linked reversal of a previous Take.

An image does not prove goods arrived. Manager resolves expected quantities and sends to Staff; Staff must confirm actual physical receipt before stock increases, including for invoices/orders. Preparation, frozen submitted revisions and completed checks persist without images. Completion is immutable and once-only. Preserve extracted, expected and actual quantities, Document date, Manager sent time and shared Staff confirmation/posting time; an old printed date never backdates the ledger. Present MYT. Convert cartons manually to base units; aliases do not retrain Gemini. Low stock is strictly below 5, including zero; exactly 5 is not Low stock.

No prices, monetary calculations, forecasting, purchasing policies, outboxes, PO management, budgets, fine-tuning, RAG, embeddings, self-hosted GPU inference or training pipeline in the new MVP. Similar-document warnings across separate uploads are P1; single-draft protection is not universal duplicate-image prevention.

Only team-created synthetic images, products, supplier details and test records are permitted for the hackathon. Uploaded images may exist transiently but must not remain in app database/disk/object/browser storage, logs, telemetry or caches. Reopened drafts have no original image; Manager must re-upload for comparison. Gemini's own retention/terms/tier must be verified before any separate future real-world pilot.

## Run the new demo locally

Use Node 22.18+ and PostgreSQL. An optional local-only PostgreSQL service is provided in [`compose.estock.yml`](compose.estock.yml). Docker Desktop must be running before starting that service. Alternatively, use any PostgreSQL instance and set its connection URL.

Create an ignored `.env.local` from [`.env.example`](.env.example) in a fresh checkout. Set `DATABASE_URL`, `GEMINI_API_KEY`, `ESTOCK_MANAGER_PASSWORD`, `ESTOCK_STAFF_PASSWORD` and a long random `ESTOCK_SESSION_SECRET`. `ESTOCK_GEMINI_MODEL` is optional. For the supplied local Compose service, use `DATABASE_URL=postgresql://estock:estock_local_only@127.0.0.1:55432/estock`. The Manager and Staff passwords are for the two demo accounts. Keep this file private; the browser never needs the Gemini key.

In this working copy, `.env.local` already contains the local database URL and demo credentials. Open that ignored file to read or change the two sign-in passwords and configure your Gemini key. Preserve the existing `ESTOCK_SESSION_SECRET` when changing passwords.

Manager and Staff passwords must normally differ. For an intentional local demo, set `ESTOCK_DEMO_ALLOW_SHARED_PASSWORD=true` in `.env.local` to allow both accounts to use the same password while running `npm run dev`. This exception is disabled by default and is never accepted in production mode. Sessions still retain the selected account role, and backend Manager-only permission checks still apply. Restart the development server after changing local authentication settings.

The origin guard compares the browser Origin with the inbound Host and request scheme, including the port. This allows `http://localhost:3000` when the dev server binds to `0.0.0.0`; the bind address is not the browser's origin. Different origins and requests marked `cross-site` remain rejected. No wildcard or forwarded-host allowlist is used.

```sh
npm ci
docker compose -f compose.estock.yml up -d --wait
npm run db:estock:migrate
npm run dev
```

Run `npm ci` again after pulling dependency changes. If PostgreSQL is unavailable, open Docker Desktop and run the Compose command above; `--wait` waits for its healthcheck. The Compose project is fixed as `estock`, with database container `estock-postgres-1` and persistent named volume `estock_postgres_data`. In this working copy, the earlier database was copied from `sdc-hackathon_estock_postgres_data` without deleting that source volume. If port 3000 already serves this checkout, use that server instead of starting a second instance.

Open `http://localhost:3000/demo`, sign in as Manager or Staff, and add initial products from the Manager account. Manager document upload accepts JPEG, PNG or WebP images up to 6 MB and requires a real Gemini key; the default model is `gemini-2.5-flash`. There is no mock scan path. `npm run dev` runs the website; it does not start PostgreSQL. If the database or Gemini service is unavailable, the relevant operation will display an error instead of silently using sample inventory.

Local setup verified on 24 October 2026: PostgreSQL 17.11 in Docker is healthy on `127.0.0.1:55432`; schema setup, typecheck and all 20 isolated PostgreSQL/API tests pass. The running `/demo` server on port 3000 accepts Manager/Staff login and stock reads; Staff receives 403 for Manager-only History and drafts. No products, movements or drafts were added to the application database. Live Gemini was not called. See [project context](PROJECT_CONTEXT.md) for the runtime diagnosis and limits.

On the Manager's **Scan receipt** page, choose **Take photo** or **Upload file**. Phones use their native camera chooser; supported desktop browsers show a live preview with **Take picture** and **Cancel camera**. Desktop preview requires HTTPS or localhost and camera permission. A phone opening a plain HTTP LAN address may need a secure preview URL for browser camera APIs. Camera errors leave Upload file available. Preview the selected image, then use **Retake photo**, **Change file**, or **Remove image** as needed. Readable camera formats such as HEIC/AVIF are converted to JPEG in memory; if the browser cannot decode them, choose JPEG, PNG or WebP. Both the original selection and prepared image must be no larger than 6 MB. Images and camera streams are temporary; there is no browser-storage or server-file save.

**Create draft** sends either choice through the same server-side Gemini workflow. It does not add stock. Review the saved draft, enter quantities in the product's base unit, send to Staff. Staff opens a pending check or notification, chooses All items match or Report differences, and confirms physical goods. Actual quantities post immediately; no further Manager approval. Staff has no OCR or general draft access. Physical camera/permission behavior, real mobile devices and live Gemini remain Unverified; resized desktop-browser results and other checks are in the current revision report.

Saved drafts have **Compare with a bon image** for temporary visual comparison. Choose/change/remove the image locally; it does not call Gemini, create a draft or change stock. A blank unreadable line can be excluded with a reason before sending the valid included lines to Staff. Extraction requests are bounded to 45 seconds and SDK retries are disabled. On provider failure/timeout, read the error and press Create draft deliberately to retry; a failed extraction saves no draft or stock.

Manager **History** starts with **Receipt history**: one completed receipt per entry, grouped by persisted draft identity, including entirely missing deliveries. Details show extracted/expected/actual quantities and Manager sent, shared Staff checked and stock posting times. Historical Manager approvals retain their original attribution. Same-date receipts stay separate. Search by product/description/quantity and filter document date. **Stock activity** separately lists Take/Return with server account attribution and discoverable **Manager opening balance** records, with search/type filtering. Pending/discarded documents stay in Drafts. Shared Staff labels never identify an individual employee.

## Apply this revision on each teammate's laptop

Each teammate runs these commands against **their own** PostgreSQL Docker volume and preserves their existing ignored `.env.local`:

```sh
npm ci
docker compose -f compose.estock.yml up -d --wait
npm run db:estock:migrate
npm run dev
```

The explicit command and application initialization use the same ordered transactional migration runner, with a per-schema advisory lock and `estock_schema_migrations`. `001_initial.sql` is adopted safely for existing unversioned databases; `002_staff_receiving.sql` adds receiving snapshots/checks, notifications and archive columns. Re-running setup does not repost receipts or reset stock. Existing unsent drafts remain preparation drafts; old APPROVED receipts keep their Manager attribution. Products, movements and compatible sessions persist. **Do not use database resets, truncate or `down -v`.** Stop/restart the app after updating the source. The command needs permission to apply schema changes. It neither reads images nor calls Gemini.

Stockroom is the only permanent app destination. Manager task buttons open Inventory, Scan receipt, Drafts and History. Staff task buttons open Inventory/Take/Return and pending receiving checks. Each feature/detail has Back to Stockroom, including notification arrivals. Notifications refresh every eight seconds and on focus. A deleted product in a pending receipt blocks posting: Manager opens Drafts, uses Recall to correct, selects active products and sends a new version. Manager receives differences as information after stock posts.

[Current verification and Delivery Gate](docs/verification/STAFF_RECEIVING_2026_10_24.md) records this revision; older reports below retain their original scope. Live OCR, physical devices/cameras, provider retention and hosted persistence remain unverified.

## Repeatable local verification

`npm run test:estock` runs retained PostgreSQL/API regressions with a test-only provider stub. Set `ESTOCK_TEST_DATABASE_URL` or use private local `DATABASE_URL`; the database account needs permission to create/drop its own uniquely named schema. Tests verify their search path, create synthetic data only there and remove only that owned schema. They never reset or seed operational tables. No live Gemini call occurs.

`npm run test:estock:browser` launches a temporary source copy, unique synthetic schema, loopback provider stub and a fresh **headless Chrome** profile using the development demo credentials from the private environment. Chrome must be installed; `playwright-core` is a development-only driver and downloads no browser. Port 3107 must be free. A preview identity check prevents testing against another service. External fetches are blocked; no existing browser profile or operational data is used. The process must be allowed to stop its own child server tree for cleanup. Evidence is saved in ignored `.artifacts/estock-mvp/`. These tests resize a desktop browser; they do not verify real mobile devices or cameras.

For a manual synthetic-only browser walkthrough, `npm run test:estock:preview` exposes the same isolated preview. Its third extraction request deliberately simulates a provider outage; other calls return clearly synthetic fixture data. Use `stop` then Enter to clean up, or Ctrl+C in an interactive terminal. No mock/fallback path was added to the ordinary app. Do not mistake this test-only preview for live receipt extraction.

Only use team-created synthetic supplier documents and records for competition material. The app does not keep uploaded image files; it keeps structured draft and History records. Check Gemini service terms before processing real supplier documents. Historical [stock](docs/verification/STOCK_TRACKING_2026_10_21.md), [forecast](docs/verification/FORECASTING_2026_10_21.md), [integration](docs/verification/INTEGRATION_2026_10_22.md), [UI](docs/verification/UI_2026_10_22.md) and [automatic SKU](docs/verification/AUTO_SKU_2026_10_22.md) reports remain about the earlier system.

## Read and coordinate

Start with [AGENTS.md](AGENTS.md), [context](PROJECT_CONTEXT.md), [English PRD](docs/product/prd.md), [decisions](docs/product/DECISIONS.md), [stock specification](docs/engineering/STOCK_TRACKING.md), [OCR intake specification](docs/engineering/OCR_INTAKE.md), [build handoff](docs/plans/BUILD_PLAN.md) and [team integration](docs/team/integration.md). The [Indonesian source](docs/product/sources/PRD_ID_2026_10_23.md) is preserved; [superseded documentation](docs/archive/2026-10-23-before-document-intake/README.md) is historical. The coordinated scope map includes active eStock modules; shared contracts still require one editor.

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

The original [Apache 2.0 LICENSE](LICENSE), Git history and historical evidence are preserved. See [third-party notices](THIRD_PARTY_NOTICES.md). This implementation changes application code and local setup only; no commit, push, publication or paid model call was made in this task.
