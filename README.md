# eStock

A replenishment assistant for SMEs managing physical stock. Record sales, analyse complete daily history, review a purchase, and follow it through to receiving.

**TooGoodToBeTrue · SDC Hackathon 2026 · Domain 2: Orbyte Smart SME Challenge.** eStock is a team proposal, not an official Orbyte module or a connected Orbyte integration.

**Implemented locally, 21 October 2026:** refined landing page and a persistent synthetic workspace at `/demo`. SQLite stores stock, policies, sales history, analyses, recommendations, decisions, purchase orders, a simulated supplier outbox, receipts and audit. The default forecasting adapter computes a labelled baseline from saved history. Actual RunPod GPU inference and Replit deployment are still unverified.

## Run locally

Requires **Node.js 22.18+** with built-in SQLite. This implementation was checked on **Node 22.23.3**. Node emits an experimental SQLite warning on this version. Python 3 is needed only for worker contract tests, not for running the local app.

```sh
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

Open [localhost:3000](http://localhost:3000), then **Open demo**. Choose a labelled demo manager or staff session. No cloud credentials are required. Migrations and the seed are also applied on first access; rerunning them preserves existing records.

The default database is `data/estock.sqlite`, ignored by Git. **Records survive page refresh and application restart.** An optional `.env.local`, based on `.env.example`, can change `ESTOCK_DB_PATH`, gate role selection with `ESTOCK_DEMO_ACCESS_CODE`, or configure the forecast provider. Never commit credentials. To try a separate fresh fixture without deleting data, stop the server and use another database path in `.env.local`, then restart and seed.

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

1. Open `/demo` as **Manager**. **Needs attention** is the actionable review list; calculations and history are expandable.
2. Go to **Stock records**, select **Takeaway cartons**, and save a dated sale of 5 units with a synthetic reference. Starting stock is 45 units; it becomes 40. A movement posts once and the form clears after success.
3. Expand **Close the day and prepare analysis**. Confirm that all products’ sales records, including actual zero-sales days, are complete. Closing advances the explicit demo date and triggers analysis from the closing balance. It never invents unfinished days. Stockout flags can be recorded when closing; a zero closing balance is flagged automatically.
4. Return to **Needs attention** and **Review purchase**. Inspect the supplier, quantity/unit, estimated cost, packaging, arrival and warnings. The default result is a **mock adapter using a saved-history baseline**, not AI. The app's seed has no pre-existing inbound, so its quantity can differ from the landing page's fixed 60-unit fixture.
5. Keep the suggested quantity, acknowledge warnings and **Confirm approval**. A change needs a reason and must satisfy packaging, MOQ and the configured approval limit. Rejection also needs a reason. Approval creates exactly one PO and outbox message and leaves physical stock unchanged.
6. Go to **Purchase orders**, then **Dispatch to simulator**. Expand the **SIMULATED supplier outbox** to inspect the persisted message. Optional failure controls save a simulated dispatch failure; retry keeps the same business reference.
7. Record a **synthetic supplier acknowledgement**, keeping the approved date and terms. Dispatch is separate from acknowledgement. A changed arrival date places the commitment on hold for manager review; cancel with evidence and reanalyse before replacing it. Late deliveries do not quietly reduce the purchase need.
8. Record a partial usable receipt with a synthetic evidence reference, then receive the remainder. Only usable goods add stock; usable plus damaged goods reduce PO remaining. Damage opens a manager exception, even if physical receiving is complete. No replacement stock is invented.
9. Inspect **Stock records** and **Activity**, then refresh or restart. Saved balances, orders, messages, receipts and audit remain. The date is a synthetic demo clock, not your computer's current day.

Staff can record stock and receive confirmed orders. Manager-only actions are checked on the server, including approval, policy changes, imports, dispatch and synthetic supplier events. Demo role selection simulates identity; it is **not production authentication or Orbyte SSO**. Every demo session shares one synthetic organisation/location.

## Everyday screens

- **Needs attention:** product, review timing, suggested order, short reason and next action. Expand calculations, daily projections, complete/partial weekly totals and model metadata when needed.
- **Stock records:** movement form first; daily closing, purchasing configuration, product creation, CSV and history are separate disclosures. Products have explicit base units and 0–3 quantity decimal places. Unit and precision cannot be changed after creation.
- **Purchase orders:** dispatch, acknowledgement and receiving follow their actual order state. Existing commitments prevent additional purchase approvals until resolved. Cancellation keeps previous receipts and audit.
- **What-if:** enter stock, weekly sales, lead time, review interval, safety stock and packaging. This **Manual estimate** uses constant demand, no inbound and review due today. It never writes scenario inputs into operational records or fabricates daily history. Costs remain uncertain when reference price or shipping is unknown.
- **Activity:** actor, MYT display time, action, explanation and expandable before/after record.

The landing page retains its original browser-memory scenario/review demonstration under **Inspect the synthetic 60-unit example**. That example resets on refresh; it does not write stock, POs or messages. `/demo` is the persistent app.

## CSV and data conventions

Download the small example from the import disclosure or [public/fixtures/history-example.csv](public/fixtures/history-example.csv). Preview validates the full batch with row errors; commit revalidates it in one transaction. Identical source IDs are skipped. A historical correction requires the same source ID/SKU/date, an explicit correction option and a manager reason; it increments the revision and retains a before/after audit.

Daily history headers:

```csv
source_record_id,sku,business_date,quantity_sold,data_complete,stockout_flag
```

Opening fixture headers:

```csv
source_event_id,sku,occurred_at,movement_type,quantity,reference,reason
```

Dates in these imports are `YYYY-MM-DD` business dates. Flags are `true`/`false`. Quantities must be explicit decimal values; blank does not mean zero. Optional `unit` must match the product. History must precede `ledger_start_date`; from that date, gross SALE movements are the canonical demand source. History imports never post stock. Opening imports accept only `OPENING_BALANCE` for a product created with **Create this opening balance now** unchecked, on its ledger start date. An existing opening balance cannot be replaced; use a reasoned stock adjustment.

Quantities use integer thousandths internally, with each product's stricter precision enforced. Money uses integer **MYR sen**, reference price **per base unit** and explicit shipping. A blank cost is unknown, not zero, and blocks approval. The ledger is append-only; closed-day physical corrections use manager adjustments on the open day. See the [synthetic data card](docs/data/SYNTHETIC_DATA.md).

## Forecasting and purchasing rules

The server separates demand estimation from purchasing arithmetic. `max(30, lead time + effective review interval)` forecast days are requested. Routine and urgent review timing differ. Confirmed inbound is considered on its actual date; overdue/unconfirmed goods never masquerade as on-hand. Raw need is clamped to zero before pack/MOQ rounding. Daily projections show shortages that a proposed arrival cannot resolve.

The fixed **PRD test**, not a model result, uses demand 10/day, lead time 3, review interval 7, safety stock 20, usable stock 45 and confirmed inbound 25 in the horizon. Raw need is 50; packs/MOQ 12 give 60. Moving that inbound to day 12 gives raw 75 and packaged 84.

`FORECAST_MODE=MOCK` is the default. It uses the 28-day mean or seasonal-naive baseline from saved history and exposes its source. Fewer than 28 complete consecutive days or unresolved gaps return **More complete history needed**, with no forecast purchase quantity. A server-side RunPod queue adapter and CUDA Python worker are implemented, with pending/completed/failed jobs, saved results, model/version validation and explicit fallback. **No live GPU inference was performed.** Configuration, dependency-lock and own-account proof steps: [worker/README.md](worker/README.md).

## Replit and submission implications

SQLite needs a **durable writable disk and one application instance**. A Replit workspace can run this application with Node 22.18+ and the commands above. Do not claim an ephemeral/autoscale deployment preserves its filesystem across redeployment. Before publishing, provide a persistent volume with a verified restart/redeploy test, or migrate the repository layer to a hosted persistent database. Configure server secrets through Replit, never public client variables. No paid resources were provisioned and no site was published here.

Remaining submission work includes actual Replit usage/proof, real RunPod inference/evaluation and account evidence, team review, committee access, meaningful authorised commits, live judge access, official signed PDFs, deck and 5–7-minute video. No real supplier messaging is required for the core simulator. No commit, push, publication, service purchase or real message was performed by this implementation task.

Use the earlier deadline pending authoritative clarification: **25 October 2026, 07:59:59 AM MYT**. Internal target: **24 October, 20:00 MYT**. Preserve the source conflict and freeze judged materials after the applicable deadline.

## Team and project documents

| Member | Reported skills | University |
| --- | --- | --- |
| Marco Ryan Suseno | Team leader; frontend | Xiamen University |
| Riakudu Vittorios Surjoraharjos | PRD, frontend, UI/UX | Xiamen University |
| Maximillion Cang | Database | Xiamen University |
| William Christiansen | System design | Xiamen University |

Reported skills are not final assignments. Registration contacts stay in ignored `.private/TEAM_DETAILS.md`.

- [Context and handoff](PROJECT_CONTEXT.md), [PRD](docs/product/prd.md), [decisions](docs/product/DECISIONS.md), [build plan](docs/plans/BUILD_PLAN.md).
- [Implementation plan](docs/plans/IMPLEMENTATION_2026_10_21.md), [visual rationale](DESIGN.md), [actual verification and Delivery Gate](docs/verification/WORKFLOW_2026_10_21.md).
- [Compliance matrix](docs/COMPLIANCE_MATRIX.md), [submission checklist](docs/SUBMISSION_CHECKLIST.md), [pitch/demo guide](docs/submission/PITCH_AND_DEMO.md).
- [Proposal draft](docs/submission/PROPOSAL_DRAFT.md), [tools declaration draft](docs/submission/TECH_DECLARATION_DRAFT.md), [AI handoff](docs/AI_HANDOFF.md).

Live prototype, Replit/RunPod proof, official PDFs, pitch deck and YouTube video are still unavailable. Repository remote: [Swiftny/sdc2026-TooGoodToBeTrue-domain2](https://github.com/Swiftny/sdc2026-TooGoodToBeTrue-domain2).

## Licence

The original [Apache 2.0 LICENSE](LICENSE) and Git history are preserved. Dependencies retain their own licences; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Synthetic operational data is created within this project; no real customer, supplier or registration contacts are used.
