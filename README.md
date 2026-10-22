# eStock

A replenishment assistant for SMEs managing physical stock. Record sales, analyse complete daily history, review a purchase, and follow it through to receiving.

**TooGoodToBeTrue · SDC Hackathon 2026 · Domain 2: Orbyte Smart SME Challenge.** eStock is a team proposal, not an official Orbyte module or a connected Orbyte integration.

**Verified locally, 22 October 2026:** refined landing page and a persistent synthetic workspace at `/demo`. SQLite stores stock, policies, sales history, analyses, recommendations, decisions, purchase orders, a simulated supplier outbox, receipts and audit. The default forecasting adapter computes a labelled baseline from saved history. Actual RunPod GPU inference and Replit deployment are still unverified.

## Run locally

Team documentation lives in [docs/team/](docs/team/README.md). Keep it out of a root `pages/` directory: Next.js treats that name as application routes, which conflicts with this project's `src/app` layout. The documentation was moved and its links and work scopes updated on 21 October to restore normal startup.

The current light-blue landing page links to the persistent workspace with **Try it now** and to `/login` with **Sign in**. The workspace retains its existing minimalist inventory, replenishment, order and activity screens.

Requires **Node.js 22.18+** with built-in SQLite. This implementation was checked on **Node 22.23.3**. Node emits an experimental SQLite warning on this version. Python 3 is needed for the full test suites, including the application-to-worker contract check; the local app runs without Python.

```sh
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

Open [localhost:3000](http://localhost:3000), then **Try it now**. A new visitor enters as Manager automatically; use the top-right **Demo role** control to switch to Staff. Existing sessions retain their selected role. If an access code is configured, enter it when prompted. No cloud credentials are required. Migrations and the blank seed are applied on first access; rerunning them preserves existing records. Page refresh does not clear inventory.

In **Add Item**, SKU is optional. Leave it blank to generate a unique code such as `DEMO-0001`, or enter your own code (up to 40 characters). Staff and managers can both use automatic codes; existing codes are skipped and saved codes survive refresh/restart.

The outlined **Sign in** action opens [`/login`](http://localhost:3000/login). It uses the existing workspace access code and Manager session; leave the field blank if no code is configured. This is local prototype access, not personal-account authentication. The landing header shares the workspace's edge alignment, with navigation left and Sign in/Try it now right. Repeated workspace/synthetic-data labels have been removed from visible chrome; supplier simulation and forecast-source disclosures remain.

UI update, 22 October: the landing tagline is “AI-assisted stock planning”. The current demo limitation remains visible. The original wide demo header is retained, with eStock left and role selection at the upper right. Unit review and replenishment quantities omit RM prices; activity role names stay intact. Approval policy checks still apply. [Verification](docs/verification/UI_2026_10_22.md).

The default database is `data/estock.sqlite`, ignored by Git. **Records survive page refresh and application restart.** An optional `.env.local`, based on `.env.example`, can change `ESTOCK_DB_PATH`, gate role selection with `ESTOCK_DEMO_ACCESS_CODE`, or configure the forecast provider. Never commit credentials. Fresh databases intentionally contain no inventory or transactions. `db:seed` creates only the blank workspace metadata and simulated supplier configuration. Tests explicitly load `tests/synthetic-fixture.ts` into temporary databases; normal startup never imports that helper. To try an isolated workspace without changing existing records, use a fresh absolute `ESTOCK_DB_PATH` and a separate port.

Production locally:

```sh
npm run lint
npm run typecheck
npm test
npm run test:worker
npm run build
npm start
```

Stop the dev server before starting production on the same port. Both server commands accept `-- --port 3001`. The build, local production server and restart persistence were tested; this is not deployment proof.

## Try the complete synthetic journey

Use only synthetic records. To open a separate empty workspace:

```sh
ESTOCK_DB_PATH=/private/tmp/estock-practice.sqlite FORECAST_MODE=MOCK npm run dev -- --port 3012
```

Use a different new filename for each empty rehearsal. Existing databases are preserved. **Reset demo deletes that workspace's records**; it is unnecessary for this journey.

1. Open `/demo`, select **Staff** using **Demo role**, then **Add Item**. Create Synthetic rice, SKU `SYN-RICE`, unit `kg`, precision **3 decimal places**, starting quantity **5**, and the displayed open date. The item saves with **Purchasing setup required**.
2. Select **Record sales**, enter **0.125**, and **Save sale**. Stock becomes **4.875 kg**. Refresh to see the saved balance.
3. Switch to **Manager**, open the item's stock records and expand **Purchasing policy**. Select the simulated supplier, lead time **1**, review **7 days**, safety stock **6**, purchase pack **0.125**, minimum **0.125**, and the current demo date for next review. Leave costs blank to test an unpriced simulated request; save the policy. These are deliberate rehearsal settings, not automatically assigned supplier terms.
4. Optionally open **Inventory → Import sales history**. Download the template, replace its SKU/date, select a CSV or paste it, then **Preview import**. Fix row errors, review duplicate/correction counts, tick confirmation, then **Confirm history import**. Historical dates must precede the opening date. Importing history never changes physical stock.
5. Select **End day** only after all sales, including genuine zero-sales days, are complete. It closes the current day and saves analysis; the date stays the same. With this one complete day the result is a **Demo estimate**, based on the recorded 0.125 kg sale, explicitly not AI or a validated forecast. Complete histories of at least 28 days use a baseline in default MOCK mode.
6. Open **Replenishment → Review suggestion**. Check remaining stock, the labelled sales period where available, coverage, supplier, quantity, order/arrival dates, demand method and warnings. Calculations/model metadata are expandable. Unknown costs are visibly **Unpriced SIMULATED** and the approval limit cannot be checked. Acknowledge warnings, then **Approve & place order**. Quantity changes and rejection require a reason. Approval creates one order/outbox and adds no stock.
7. In **Purchase orders**, open the order, **Send SIMULATED request**, then record supplier confirmation with the approved arrival date and terms. No external message is sent. A changed ETA holds receiving for manager review.
8. Select **Next day** after closing; repeat End day/Next day as needed until the confirmed delivery date is open. Switch to **Staff**, open the delivery and receive usable/damaged quantities within the remaining order. Both fields follow the item's precision. Usable stock increases on-hand; usable plus damaged reduces the remaining order. Damage opens a manager exception, with no automatic replacement stock.
9. Inspect **Inventory** and, as Manager, **Activity**. Refresh or restart using the same database path; stock, history, approvals, receipts and audit remain saved.

| Responsibility | Staff / employee | Manager |
| --- | --- | --- |
| Basic item, unit/precision and opening stock | Create on the open day | Create |
| Sales, permitted stock activity and valid PO receiving | Record | Record; reasoned stock adjustments |
| Supplier terms, packaging, costs and budgets | Cannot change | Configure |
| Approve/edit/reject purchases; dispatch/acknowledgement; damage review | Cannot perform | Authorised |
| CSV history import and reviewed corrections | Cannot perform | Authorised |

Server-side permissions enforce these boundaries. Staff cannot inject purchasing fields into item creation. Unique SKUs, one opening balance, source-event protection, request idempotency and audit prevent duplicate stock. Unit/precision stay fixed after creation. Demo role selection simulates identity; it is not production authentication or Orbyte SSO. Every session shares one synthetic organisation.

**Plan ahead** is a separate manual estimate under Replenishment. Its constant-demand inputs never write operational history. It assumes no inbound and a review due today.

## CSV and data conventions

The reachable manager importer is **Inventory → Import sales history**. The [downloadable template](public/fixtures/history-template.csv) lists:

```csv
source_record_id,sku,business_date,quantity_sold,data_complete,stockout_flag
```

Dates are `YYYY-MM-DD`; flags are `true`/`false`. Quantities must be explicit nonnegative decimals in the product's base unit and precision. Optional `unit` must match. The whole batch is revalidated atomically on commit. Identical sources are skipped; changes require the same source ID/SKU/date, reviewed corrections and a reason. Before/after values and revisions remain in audit. Missing days remain unknown. Future dates and aggregate history overlapping `ledger_start_date` are rejected; from that date, ledger SALE movements are canonical.

The manager-only backend opening-import contract remains available for products explicitly created without an opening movement. Its columns are `source_event_id,sku,occurred_at,movement_type,quantity,reference,reason`. It accepts one OPENING_BALANCE on the ledger start date. The current Add Item form records opening stock directly; there is no separate opening-import screen.

Quantities use integer thousandths and product precision 0–3; countable `units` require precision 0. Reference prices use integer MYR sen per base unit. Blank costs remain unknown. An unpriced request is allowed only for the simulated channel with explicit warning acknowledgement; known costs enforce the approval limit. Closed-day physical records remain immutable; manager adjustments use the open day. See the [data card](docs/data/SYNTHETIC_DATA.md).

## Stock tracking API

The dedicated stock endpoints reuse the existing SQLite ledger and transaction service. The `/api/demo` workflow remains supported.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/products` | Current physical stock, separate confirmed incoming, units and ledger versions |
| `GET /api/movements?productId=...&limit=50` | Movement history, newest first, with cursor pagination |
| `POST /api/movements` | Record a sale, usage, loss, usable return or authorised adjustment |

Use the existing synthetic session cookie. Mutations require JSON and an `Idempotency-Key` header; preserve the same key, source event and input on retries. Supplier receipts still use the purchase-order receiving workflow. The original `/api/demo` interface remains available.

Frontend types, sample requests, validation/error handling, file ownership and stage-specific verification are documented in [the stock tracking agreement](docs/engineering/STOCK_TRACKING.md). Updates are request-based; refresh stock/history after a save. This stage does not add server push or a live POS connection.

Current checks on Node **22.23.3**, npm **10.9.9**, Python **3.9.6**: **74 Node tests**, **7 Python worker tests**, **25 production HTTP scenario groups**, lint, typecheck and production build pass. The HTTP harness now verifies empty startup before explicitly loading its synthetic fixture; it cleans up its own servers/database. Run `node scripts/verify-stock-tracking.mjs` after building. Browser verification used only `/private/tmp/estock-integration-browser-20261022.sqlite`. [Current evidence, screenshots and Delivery Gate](docs/verification/INTEGRATION_2026_10_22.md) supersede older totals.

## Forecasting and purchasing rules

### Step 3: forecast and coverage API

Local backend work is complete on `feat/demand-forecasting`, based on the user's Step 2 commit `2345671`. Step 3 is **80/100**: actual RunPod execution/account proof and acceptance remain pending. No frontend design/source or purchasing formula was changed. The frontend owner can use these additive endpoints:

| Endpoint | Purpose |
| --- | --- |
| `POST /api/analysis-runs` | Manager starts/reuses a saved run with `{ "productId": "product-cartons" }` |
| `GET /api/analysis-runs?productId=...&limit=20` | Staff/manager reads latest saved runs |
| `GET /api/analysis-runs/:id` | Staff/manager reads status, demand, provenance and stock coverage |
| `POST /api/analysis-runs/:id/poll` | Manager checks a pending provider job with body `{}` |

Use the existing demo session cookie, JSON and an `Idempotency-Key` for mutations. HTTP 202 means pending; HTTP 200 can contain `COMPLETED`, `FAILED` or `NEEDS_DATA`, so inspect the saved status. GET never triggers inference. New coverage uses saved daily demand and eligible dated arrivals; changed inputs make it unavailable until reanalysis. The existing `/demo` still uses its previous contract; connecting the new coverage display is the frontend owner's next integration task.

On a fresh fixture, open `/demo` as manager and analyse **Takeaway cartons** before posting a new-day movement. If movements exist, close the day first. The default remains a labelled baseline. With a manager session, the API above exposes full coverage; the isolated HTTP harness tries these requests without touching your normal database:

```sh
npm test
npm run test:worker
npm run build
node scripts/verify-forecasting.mjs
node scripts/verify-stock-tracking.mjs
```

These checks passed: **101 Node tests**, **7 Python tests**, **24 forecast HTTP scenario groups** and all **24 stock HTTP regression groups**, plus lint/types/build. The harnesses require localhost-listening permission, stop their servers and remove their temporary databases. They submit no real inference. Details, response examples and friend setup: [forecast handoff](docs/engineering/FORECASTING.md), [verification](docs/verification/FORECASTING_2026_10_21.md), [worker setup](worker/README.md).

### Existing replenishment rules

The server separates demand estimation from purchasing arithmetic. `max(30, lead time + effective review interval)` forecast days are requested. Routine and urgent review timing differ. Confirmed inbound is considered on its actual date; overdue/unconfirmed goods never masquerade as on-hand. Raw need is clamped to zero before pack/MOQ rounding. Daily projections show shortages that a proposed arrival cannot resolve.

The fixed **PRD test**, not a model result, uses demand 10/day, lead time 3, review interval 7, safety stock 20, usable stock 45 and confirmed inbound 25 in the horizon. Raw need is 50; packs/MOQ 12 give 60. Moving that inbound to day 12 gives raw 75 and packaged 84.

`FORECAST_MODE=MOCK` is the default. It uses the 28-day mean or seasonal-naive baseline from saved history and exposes its source. One to 27 consecutive complete days ending at the cutoff use **DEMO_ESTIMATE**, an explicitly labelled average of the available days, never a 28-day mean or AI claim. No history, unresolved gaps, incomplete days or missing purchasing setup produce no actionable quantity. RunPod submissions require 28–168 consecutive complete observations. A server-side RunPod queue adapter and CUDA Python worker are implemented, with pending/completed/failed jobs, saved results, model/version validation and explicit fallback. **No live GPU inference was performed.** Configuration, dependency-lock and own-account proof steps: [worker/README.md](worker/README.md).

## Replit and submission implications

SQLite needs a **durable writable disk and one application instance**. A Replit workspace can run this application with Node 22.18+ and the commands above. Do not claim an ephemeral/autoscale deployment preserves its filesystem across redeployment. Before publishing, provide a persistent volume with a verified restart/redeploy test, or migrate the repository layer to a hosted persistent database. Configure server secrets through Replit, never public client variables. No paid resources were provisioned and no site was published here.

Remaining submission work includes actual Replit usage/proof, real RunPod inference/evaluation and account evidence, team review, committee access, meaningful authorised commits, live judge access, official signed PDFs, deck and 5–7-minute video. No real supplier messaging is required for the core simulator. No commit, push, publication, service purchase or real message was performed by this implementation task.

Use the earlier deadline pending authoritative clarification: **25 October 2026, 07:59:59 AM MYT**. Internal target: **24 October, 20:00 MYT**. Preserve the source conflict and freeze judged materials after the applicable deadline.

## Team and project documents

Before parallel edits, read [integration rules](docs/team/integration.md) and use the scope checker described there. Frontend landing and demo UI have separate edit boundaries; shared files require coordinated integration.

Individual work pages: [team index](docs/team/README.md), [Vitto / frontend](docs/team/frontend.md), [Maxi / data](docs/team/data.md), [William / backend and system](docs/team/backend.md), [Marco / AI](docs/team/ai.md), and [shared demo](docs/team/demo.md).

| Member | Assigned work | University |
| --- | --- | --- |
| Marco Ryan Suseno | Team leader; AI | Xiamen University |
| Riakudu Vittorios Surjoraharjos (Vitto) | Frontend | Xiamen University |
| Maximillion Cang (Maxi) | Data | Xiamen University |
| William Christiansen | System and backend | Xiamen University |

Assignments confirmed by the user on 21 October 2026. Registration contacts stay in ignored `.private/TEAM_DETAILS.md`.

- [Context and handoff](PROJECT_CONTEXT.md), [PRD](docs/product/prd.md), [decisions](docs/product/DECISIONS.md), [build plan](docs/plans/BUILD_PLAN.md).
- [Implementation plan](docs/plans/IMPLEMENTATION_2026_10_21.md), [visual rationale](DESIGN.md), [current verification and Delivery Gate](docs/verification/INTEGRATION_2026_10_22.md).
- [Compliance matrix](docs/COMPLIANCE_MATRIX.md), [submission checklist](docs/SUBMISSION_CHECKLIST.md), [pitch/demo guide](docs/submission/PITCH_AND_DEMO.md).
- [Proposal draft](docs/submission/PROPOSAL_DRAFT.md), [tools declaration draft](docs/submission/TECH_DECLARATION_DRAFT.md), [AI handoff](docs/AI_HANDOFF.md).

Live prototype, Replit/RunPod proof, official PDFs, pitch deck and YouTube video are still unavailable. Repository remote: [Swiftny/sdc2026-TooGoodToBeTrue-domain2](https://github.com/Swiftny/sdc2026-TooGoodToBeTrue-domain2).

## Licence

The original [Apache 2.0 LICENSE](LICENSE) and Git history are preserved. Dependencies retain their own licences; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Synthetic operational data is created within this project; no real customer, supplier or registration contacts are used.
