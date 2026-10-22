# eStock: Product Requirements Document

Version 1.1 | 22 October 2026 | SDC Hackathon 2026, Domain 2 | TooGoodToBeTrue

**Status:** product requirements baseline for team review and adaptation. On 21 October the user extended authorisation from the landing page to frontend refinement and the persistent replenishment workflow. The local application now implements that journey with SQLite, labelled baseline analysis and a SIMULATED supplier channel. RunPod GPU inference and Replit deployment/proof remain unverified. This PRD does not authorise service purchases, real messaging, commits, pushes or publication. See DECISIONS.md and the actual verification report.

**Implemented clarifications, 21 October:** Node SQLite replaces the proposed hosted database for local testing; deployment needs durable storage and one instance. Demo identity uses opaque server-issued manager/staff sessions and does not claim production auth. Closing the explicit demo day marks reviewed observations complete and triggers analysis. Closed-day physical records stay immutable; manager adjustments record corrections on the open day. CSV history corrections retain source/SKU/date, increment revision and require a manager reason. An active purchasing commitment conservatively blocks additional POs. Supplier arrival changes put the order in NEEDS_REVIEW and hold receiving; the manager records cancellation and reanalyses before replacing it. Manual what-if assumes constant weekly demand, no inbound and a review due today; it never writes operational history. These are implementation choices within the user's authorised milestone, not official competition requirements.

**Product:** a replenishment assistant for SMEs managing physical stock. eStock connects transactions, sales history, inventory, purchasing policies, suppliers, manager approval and receiving records.

**Not an official Orbyte module:** eStock is the team's proposal for the Orbyte ecosystem. Do not claim integration, certification, partnership or sponsor approval that has not been granted.

## 0. Reading guide and sources of truth

Reading order for team members and AI developers:

1. Root AGENTS.md.
2. PROJECT_CONTEXT.md.
3. This document and DECISIONS.md in the same directory.
4. ../COMPLIANCE_MATRIX.md for rules and conflicts.
5. ../plans/BUILD_PLAN.md for work sequence and Tuesday–Saturday planning.
6. ../SUBMISSION_CHECKLIST.md and ../submission/PITCH_AND_DEMO.md.
7. Proposal and declaration drafts in ../submission/.

This internal PRD describes the product requirements in full. **The Markdown PRD does not replace the official-template proposal PDF or Technical & Tools Declaration PDF.**

Labels:

- **OFFICIAL:** competition-source requirement.
- **USER-APPROVED:** direction explicitly stated in the conversation.
- **RECOMMENDED DEFAULT:** planning choice the team can change before implementation.
- **TEAM INPUT REQUIRED:** unavailable facts, access or choices.
- **ROADMAP:** not part of preliminary MVP completion criteria.

Do not hide source conflicts. Check Terms & Conditions and authoritative official announcements; retain source, time and clarification outcome.

### 0.1 Primary sources

| ID | Source | Purpose |
| --- | --- | --- |
| D2 | [Domain 2 brief and rubric](https://drive.google.com/file/d/11wqbeO-HYep-DJPQ-LPZnrZfQvCgr5BU/view) | SME problem, six must-haves, workflow, data limits and rubric |
| PH | [Participant Handbook](https://drive.google.com/file/d/1fGBS-jevDj_FrF8wsbYNPzyU5TTrfk1V/view) | Preliminary round, six deliverables, platforms, proof, GitHub and video |
| OH | [Official Handbook](https://drive.google.com/file/d/1vDGxSLufFrE9h6T8-KY1ltxmAgQln23k/view) | Policy, originality, AI use and conduct |
| TC | [Terms & Conditions](https://drive.google.com/file/d/1tZOLKK-fA7Uh3zu1otdL6Z-oC_FKMtyl/view) | Binding rules, build period, IP, submission/freeze |
| PT | [Preliminary proposal template](https://drive.google.com/file/d/1jNjuMJfhMYjo3qQw_PmmeGM-INEwuleo/view) | Structure, word limits, SDG/KPI, declarations and signatures |
| TD | [Technical & Tools Declaration](https://drive.google.com/file/d/1LBXfXrFblX-dHanSP8jhUOMGfGGxY2ew/view) | All resources and usage proof |
| ORI | [Official orientation slides](https://drive.google.com/file/d/1RkT67i4TMAQ7ON7Ha9L6JOjsne0bgOWq/view) | Morning deadline, preliminary video and repository rules |
| OBI | [Orbyte Introduction, Alpha Red workshop](https://drive.google.com/file/d/1xoQj59NZr6D9rwZ_qkQwZaObKEcoXaoO/view) | Foundations, current capabilities and platform direction |
| SAMPLE | [Sample repository ZIP](https://drive.google.com/file/d/1Atfzhuehpr6zYvM0oenDOzXeNymTHow_/view) | Repository/proof organisation example, not a mandatory stack |
| WEB | [Portal](https://sdchack.my/) and [FAQ](https://sdchack.my/faq) | Submission access and public announcements |
| MODEL | [Chronos](https://github.com/amazon-science/chronos-forecasting), [model card](https://huggingface.co/amazon/chronos-bolt-small) | Candidate pretrained model, licence and inference contract |
| WA | [WhatsApp policy](https://business.whatsapp.com/policy), [pricing](https://business.whatsapp.com/products/platform-pricing) | Optional WhatsApp channel and messaging limits |

Sources were read on 20 October 2026. No claim is made that video materials were watched. Private Discord announcements and logged-in portal forms have not been inspected. The final checklist must include both.

The user's example PRD is at /Users/riakuduvittorios/Downloads/docs/product/prd.md and came from a different Sime Darby hackathon. Only its specification structure was adapted. Do not import its 23 October deadline, five-person team, ten-slide cap, five-minute-only video, flood data, rubric or competition milestones.

### 0.2 Deadline and conflicts that must remain visible

- PH §6.3.1 and ORI: **Sunday, 25 October 2026, 07:59:59 AM MYT, UTC+8**.
- WEB homepage/FAQ read on 20 October: **25 October 2026, 11:59 PM MYT**.
- This is a real conflict between official sources. No written clarification has been found. **Plan against the earlier deadline until authoritative official instruction resolves it.**
- Recommended internal team target: **Saturday, 24 October 2026, 20:00 MYT**.
- After the applicable deadline, judged source, deployment and materials are frozen unless the organisers authorise changes.

## 1. Product summary and decisions

### 1.1 One-sentence pitch

eStock helps SMEs decide when and how much stock to reorder, explains the decision using sales history and supply information, and turns manager approval into a recorded supplier request.

### 1.2 User decisions

| Topic | Value |
| --- | --- |
| Working name | eStock |
| Domain | Domain 2: Orbyte Smart SME Challenge |
| Team | TooGoodToBeTrue, four members |
| Product scope | General for SMEs managing stock; configured per business/product |
| Workflow | Outgoing transactions, demand analysis, recommendation, manager notification, approval, supplier request, receiving |
| MVP input | Synthetic CSV and outgoing-stock/receiving forms |
| Main AI task | Per-product demand estimation from sales history |
| Purchasing cycle | Weekly or approximately monthly, configured per product |
| Channels | WhatsApp preferred if feasible; Telegram additionally if time permits |
| Leader | Marco Ryan Suseno |
| Members | Marco Ryan Suseno; Riakudu Vittorios Surjoraharjos; William Christiansen; Maximillion Cang |
| Reported university | Xiamen University; verify official campus spelling against the portal |
| Reported skills | Marco: frontend; Vitto: PRD/frontend/UI/UX; William: system design; Maxi: database |
| Final assignments | Vitto frontend; Maxi data; William system/backend; Marco AI, confirmed 21 October |
| Registration contacts | Provided by the user; keep in .private/TEAM_DETAILS.md for templates, not demo data |
| Stack | Next.js/TypeScript/plain CSS, local Node SQLite and Python RunPod candidate; durable deployment still to verify |
| Accounts, credits, leader phone | TEAM INPUT REQUIRED |
| Repository language | English, as instructed by the user; preserve names, contacts, links and technical identifiers |

### 1.3 What general means in the MVP

The workflow engine can be configured for different SMEs with physical stock. eStock does not automatically understand every business process without configuration.

Generic concepts: SKU, base unit, transactions, supplier, lead time, review cycle, buffer, demand, approval, messages, receiving and audit.

Per-product configuration: unit/packaging, supplier, reference price, lead time, purchase cycle, buffer, budget and usability status.

The MVP uses one demo organisation, one location, 3–5 synthetic SKUs and one primary supplier per SKU. This is the test fixture size, not a restriction to one industry. Services without physical stock, multiple warehouses, mixed ingredients/recipes, batch expiry and complex production are roadmap items.

## 2. Problem and users

### 2.1 Problem hypothesis

A small business may record sales in one tool, stock in a spreadsheet and purchases in chat. The owner must reconcile those records to decide quantities and chase approval. A fixed low-stock threshold can also be too late when suppliers need several days to deliver.

Intended reductions: copying records, duplicate purchases, unexplained purchase quantities and late discovery of shortages.

**Evidence status:** this conversation has not validated frequency or loss through SME interviews. Do not claim customers, sales, savings or field accuracy. Interviews improve quality; they do not replace the prototype.

### 2.2 Personas and permissions

| Persona | Need | Allowed | Not allowed |
| --- | --- | --- | --- |
| Stock staff / employee | Set up inventory and record movements | Create basic items/opening stock; view stock/history; enter sales/usage; receive fractional usable/damaged quantities against valid POs | Approve purchases, import/correct aggregate history, or change supplier terms/policy/budget |
| Manager/owner | Decide with explanations | Review, change policy, edit quantity with reason, approve/reject, view costs/audit | Silently bypass data validation |
| System worker | Run authorised analysis | Aggregate, call model, create recommendations/notifications/outbox | Approve purchases itself |
| Supplier | Receive purchase requests | Receive product, quantity, schedule and order reference | Access internal sales history, stock or other businesses' costs |
| Demo judge | Test synthetic workflow | Select clearly labelled demo staff/manager sessions | Be told that demo role switching is production SSO |

The server checks permission for every mutation. Hiding buttons is insufficient. D2 permits simulated login/RBAC; demo labels and limitations must be clear. This project does not rebuild Orbyte identity.

## 3. Goals, non-goals and success measures

### 3.1 MVP goals

1. Connect sales history, stock ledger, per-SKU policy, suppliers and outstanding purchases.
2. Show traceable demand estimates and quantity recommendations.
3. Take one restock need through manager review to a recorded purchase message and receiving outcome.
4. Prevent duplicate transactions, approvals, POs and receipts.
5. Expose insufficient data, forecast failure, urgency and changes that make proposals stale.
6. Demonstrate Replit usage and actual RunPod model inference.

### 3.2 Priority boundaries

**MUST = the team's preliminary completion requirements.** SHOULD follows only after MUST works. COULD/ROADMAP must not delay submission.

| MUST | SHOULD | COULD/ROADMAP |
| --- | --- | --- |
| Synthetic CSV dataset, ledger, movement forms | Real WhatsApp Cloud API if account/templates ready | Real Telegram adapter |
| RunPod forecast and comparison baselines | Remind manager about pending cases | LLM analysis of supplier chats |
| Per-SKU 7/30-day policy and lead time | Purchasing summary export | Real POS/ERP/Orbyte integrations |
| Evidence-backed recommendations, manager notification, approval | Richer model/baseline comparison visuals | Multiple warehouses/active organisations |
| Working supplier message outbox, clear simulation | Browser notifications if delivery is unaffected | Negotiation, multiple suppliers, automatic supplier selection |
| Manual synthetic supplier confirmation/receiving and audit | | Batch/expiry, production/BOM, checkout, payments |
| Accessible prototype, documents, deck, video, source and proof | | Customer chat/orders/tracking and promotion forecasting |

The simulated outbox is a demo channel that actually stores/displays messages, not proof of WhatsApp delivery. WhatsApp is the user's preferred optional integration; Telegram is additional. Every channel's status must be truthful.

### 3.3 KPIs and targets, not results

| KPI | Planning baseline/target | Measurement |
| --- | --- | --- |
| Time to prepare one restock decision | Initial assumption: ten minutes; Phase 2 target: 50% reduction | Replace assumption with equivalent timed manual/eStock tasks; retain N and median |
| Forecast quality | Report model vs baseline MAE/WAPE; no promised accuracy percentage | Time-ordered evaluation on held-out synthetic history |
| Duplicate orders/transactions | Target: zero across duplicate-action tests | Replay CSV, approval clicks, callbacks and receipts |
| Decision traceability | Target: 100% of approvals/rejections have actor, time, version, reason and outcome | Audit fixtures and manual review |
| Ease of use | Target: new reviewer completes core journey without extra verbal instructions | Short task test; record confusion and timing |

Ten minutes and 50% are proposed assumptions/targets, not discovered business facts. The final proposal must identify evidence type and replace the baseline if measurement differs. Do not select examples solely to make AI appear superior.

Primary SDG: **8.2 and 8.3**, productivity and support for small enterprises. Claim waste reduction/SDG 12 only if measured or supported by an actual workflow; do not add SDGs merely to increase their count.

## 4. Orbyte fit and rubric

OBI describes Orbyte as a shared hub with identity, roles, notifications, approval, audit and partner integrations. Availability differs by module; Business Graph and some cross-functional AI are still development directions. No Orbyte account/API/sandbox was supplied for D2.

eStock adds business-data-driven replenishment decisions. SKU/ledger and forecasting are domain capabilities; identity/approval/audit use mock contracts that could later connect to the platform.

| D2 requirement | eStock evidence |
| --- | --- |
| One SME problem | Prepare restock decisions from disconnected records |
| Trigger | Outgoing stock or daily review identifies a condition needing attention |
| Connected data | Sales history, stock position, dated POs, policy and supplier |
| Rules/AI | Model estimates demand; rules calculate/validate purchasing |
| Human approval | Only manager approves purchase details |
| Visible outcome and log | Message/outbox/PO/receiving and decision trail |
| Accuracy/ease | Clear units, calculation explanations, exceptions, simple forms |
| Fit/reuse | Per-SKU configuration and mock platform contracts, not copied HR/admin |
| Benefit/SDG | Decision time, duplicates, traceability, SDG 8.2/8.3 |

Official preliminary rubric: Innovation 30%, Problem–Solution Fit 25%, Feasibility 25%, Clarity 20%. The innovation to demonstrate is connected, auditable replenishment decisions, not the eStock name, an approve button, a chatbot or calling multiplication AI.

**Unverified:** the sponsor has not confirmed that this exact capability is absent from partner/private roadmaps. Ask specifically about demand-aware replenishment from transaction data through supplier orders; do not assert that the feature does not exist.

## 5. Main workflow

### 5.1 Inventory onboarding and manager setup

1. Normal startup is empty. An employee or manager creates the basic item (name, unique SKU, base unit, precision, opening quantity) on the open inventory date. Opening stock posts once and is audited.
2. Employees may record sales immediately. Purchasing configuration remains absent, with **Purchasing setup required**; no actionable recommendation is created until a manager saves supplier terms and policy. Employee input is allowlisted and cannot include purchasing/budget fields.
3. The manager configures primary supplier, lead time, 7/30-day cycle, safety stock, pack/MOQ, reference costs and approval limit separately.
4. Optional manager history import is reachable at **Inventory → Import sales history**, with template, file/paste, row errors, duplicate/correction counts, preview and confirmation. Aggregate history never changes stock.
5. The supplier channel remains SIMULATED. Unknown costs are not zero: an unpriced simulated request requires visible warnings and acknowledgement; its approval limit cannot be checked. Known costs enforce the limit. Real-channel approval with unknown costs is not authorised.

### 5.2 Movements and analysis

1. Staff records outgoing stock, sales, adjustments or receiving using the appropriate type.
2. Update the ledger in a database transaction with an idempotency key.
3. Factual stock alerts may follow mutations. Daily forecasting uses completed business days.
4. The worker combines ledger snapshot, history, dated confirmed POs and policy.
5. The model returns daily forecasts; rules calculate proposals and check daily projected balances.
6. Create/update one restock case per SKU; manager notification links to the same details.

### 5.3 Review through outcome

1. Manager opens quantity, unit, estimated cost, target arrival, model status, data source and explanation.
2. Manager may change quantity with a reason or reject with a reason.
3. On approval, the server rereads ledger/PO/policy and checks versions, permissions, budget and active case.
4. If valid, one transaction creates approval, a PO awaiting message dispatch, an outbox event and audit record.
5. Worker sends/simulates the same message and records channel outcomes.
6. Record supplier confirmation explicitly. Delivered/read does not mean the supplier accepted the order.
7. Staff records actual receipts; stock increases and PO outstanding decreases atomically.
8. Complete the case when fulfilled or closed by the manager with a reason. Retain all events.

### 5.4 Blocked paths

Incomplete data, missing purchasing setup, forecast failure without valid fallback, stale proposals, invalid quantities, active commitments and late arrivals must not silently produce purchases. Unknown costs require explicit unpriced SIMULATED warnings and acknowledgement; they cannot be treated as zero or represented as budget-checked.

Allowed outcomes: normal recommendation; urgent review; no restock needed; insufficient data; waiting for supplier; or analysis failed with retry. Each status has a clear next action.

## 6. Data and stock ledger

### 6.1 General requirements

- Operational data, SKUs, suppliers, organisation names, demo contacts, history and test cases must be team-created synthetic data.
- Do not use real customer/supplier/company records or public price datasets as D2 operational data without official clarification.
- Every quantity has a base unit. Every price has a currency; default MYR, stored as integer sen.
- Quantity uses fixed decimal precision, maximum three decimal places. Countable-unit SKUs must be integers; kg/litre may be fractional. Do not convert kg to litres without an explicit manager-configured SKU factor.
- Supplier packs have an explicit base-unit quantity. Do not confuse carton prices with unit prices.
- Business dates use Asia/Kuala_Lumpur; timestamps are stored in UTC and displayed in MYT.
- Forecasts use complete days. Do not silently mix an unfinished current day into complete daily totals.

### 6.2 Movement types

| Type | Physical effect | Sales target? |
| --- | --- | --- |
| OPENING_BALANCE | Increase opening balance once | No |
| SALE | Decrease quantity | Yes, gross units sold |
| INTERNAL_USE | Decrease quantity | No; internally consumed SKUs need a separate consumption target on the roadmap |
| DAMAGE_OR_LOSS | Decrease quantity | No |
| SUPPLIER_RECEIPT | Increase received usable quantity | No |
| CUSTOMER_RETURN_USABLE | Increase quantity after inspection | Does not reduce gross-sales target |
| ADJUSTMENT_IN/OUT | Increase/decrease with manager reason | No |

The main MVP model targets SALE per SKU; do not treat damage, transfers or samples as customer demand. The UI must explain that mostly internally consumed SKUs do not have a consumption model in the MVP.

### 6.3 CSV

At least two import types: daily sales history and master/opening-balance fixtures. Supplier/PO records may be seeded; do not build a generic ETL feature.

Minimum history columns:

    source_record_id,sku,business_date,quantity_sold,data_complete,stockout_flag

Minimum movement columns:

    source_event_id,sku,occurred_at,movement_type,quantity,reference,reason

Import rules:

1. Preview headers, row count, unknown SKUs, units, dates, duplicates and errors.
2. Do not write invalid rows. Validate the whole batch before committing, with per-row errors.
3. Unique key: organisation + source + source_record_id/source_event_id.
4. Reimporting the same file must not duplicate history or decrement stock again.
5. Aggregated model history is **not automatically reposted as movements**. Opening balance/ledger is the physical-stock source.
6. Missing days are not automatically zero; accept zero only for a complete day with no sales.
7. Reject future dates beyond the demo clock. Separate future evaluation targets from operational input.
8. Do not log entire sensitive CSV files; demo data still remains synthetic.
9. Define ledger_start_date. Historical CSV dates must be before ledger_start_date; from that date onward, canonical daily sales come from ledger SALE events. Reject overlapping aggregate imports to avoid double counting.
10. Daily sales are unique per organisation/SKU/date. Historical corrections use revisions and revalidation, not addition of sources with unknown overlap.

### 6.4 Time consistency

RECOMMENDED DEFAULT: daily snapshots at business-day closing. The demo has an explicit dated clock, so input, closing balance, history and forecast share the same time reference. Approval occurs after closing and before the next day's transactions are posted.

Current local convention: End day closes T and retains the displayed demo date T; analysis uses complete history through T and forecasts start T+1. Manager review/dispatch can occur on the closed demo date, with expiry at the start of the following demo date. Next day explicitly advances the clock; analysis on the new date is allowed before new movements, using the previous cutoff. Check date/version freshness even without new stock activity; do not dispatch using an old ETA. This supersedes the earlier conceptual requirement to advance the date automatically on closing.

Forecast starts after the history cutoff; stock position uses that same cutoff. Do not silently include an unfinished current day as a complete observation.

Same-day corrections increase ledger version; recomputing the cutoff with a new version creates a new revision. If the next day's transactions have been posted, the previous closing proposal cannot be approved; close the next day and analyse a new cutoff. This is an explicit daily boundary, not an intraday decision promise.

Analysis identity includes organisation, SKU, cutoff, decision_date, data hash, ledger version, inbound/PO version, policy version, model revision and horizon. Identical runs are idempotent; data corrections must not return stale cached results.

Intraday remaining-hour analysis, multinational timezones and supplier holiday calendars are outside MVP. Factual stock-threshold alerts may still follow outgoing movements without claiming intraday forecasts.

### 6.5 Invariants

- No negative movement quantity; type determines direction.
- Block outgoing stock that would make physical stock negative until data is corrected.
- Ledger is append-only; corrections use linked reversals/adjustments, not deleted history.
- Never import an opening balance twice.
- Receipts must reference an active PO and cannot exceed remaining quantity without manager review.
- In one transaction, decrement PO remaining by usable plus damaged quantities and increment on-hand by usable quantity only. Both employee and manager receiving enforce product precision. Damage opens a manager exception; it creates no automatic replacement stock.
- Supplier offers or unreceived POs do not increase on-hand.
- Customer reservations/backorders are outside MVP; do not subtract reserved quantities and then count the same demand twice.

## 7. Forecasting and replenishment policy

### 7.1 Three separate decisions

1. **Demand estimate:** expected units sold over future days.
2. **Need for attention:** whether projected balance breaches buffer/minimum stock before supplies arrive.
3. **Purchase quantity:** units to add after accounting for stock and existing supply.

The model handles item 1 only. Policy/arithmetic handle items 2–3. Notifications and review scheduling are automation rules.

### 7.2 Per-SKU parameters

| Parameter | Meaning | Recommended MVP default |
| --- | --- | --- |
| lead_time_days L | Calendar days from dispatch to usable goods, including supplier acknowledgement allowance | 1–14 days; new ETA = decision_date + L; confirmed ETA replaces the assumption |
| review_interval_days R | Routine purchase-review interval | 7 or 30 days |
| safety_stock_units SS | Absolute buffer in base units | Set by manager, not an AI confidence percentage |
| pack_size | Base units per purchase pack | Positive and explicit |
| minimum_order_qty MOQ | Supplier minimum quantity | Configured, not guessed |
| unit/pack price | Reference price for draft request | Synthetic, timestamped |
| max_order_amount | Ordinary approval limit | Manager configuration |
| next_review_at | Next scheduled review | Derived from last policy |
| supplier_id | Primary supplier | One per SKU in MVP |

Thirty days is a fixed interval in this version, not a calendar month. UI labels use 7 days/30 days. Fixed-date monthly calendars may be added later.

### 7.3 Horizon and quantity

For routine review, protection horizon:

    H = L + R
    forecast_horizon = max(30, H)
    D_H = sum of daily median forecast for the next H days
    eligible_inbound = remaining quantity on supplier-confirmed POs arriving within H
    inventory_position = usable_on_hand + eligible_inbound
    Q_raw = max(0, D_H + SS - inventory_position)
    Q_order = pack_size * ceil(max(Q_raw, MOQ) / pack_size), only if Q_raw > 0

For emergency reviews between scheduled reviews, use remaining days until the next review as R_effective and display it. Do not silently use a full thirty days when coverage is needed only until the next review.

A routine review completes when its valid outcome is NO_ORDER_NEEDED or the manager records approval/rejection of the case. PENDING_APPROVAL does not complete a review. On completion, advance next_review_at from its previous schedule anchor by multiples of R to the first date after decision_date. Failed review does not advance the schedule; retry does not advance it twice. Dispatch time does not become a new calendar anchor.

The forecast begins the day after its cutoff. Requested arrival is decision_date + L; confirmed inbound uses each PO's dated ETA. End day keeps the demo decision date as described in §6.4. H=L+R controls the demand window; daily projections use explicit dates. Display these assumptions without promising an arrival hour.

If a review is due/overdue, run a routine review with full R, not zero/negative R_effective. An early emergency review uses a positive number of days until the next review. Late acknowledgement/new ETA triggers risk reanalysis; parameter L alone does not guarantee arrival.

If Q_raw = 0, do not order MOQ merely because the supplier has a minimum. Return NO_ORDER_NEEDED unless an earlier shortage before inbound needs attention.

Cost = number of packs × pack price + known shipping/other costs. Unknown costs are not automatically zero. Label costs estimate/reference, not a confirmed supplier quotation.

### 7.4 Arrival-timing checks

The total-quantity formula alone does not establish safety. Calculate daily projected balance:

    closing_balance[d] = opening_balance[d] + confirmed_inbound[d] - forecast_demand[d]

This daily boundary is an estimate, not certainty about arrival hour. Highlight the first day below safety stock and below zero.

- Unconfirmed POs are not eligible inbound.
- Late or uncertain POs are NEEDS_REVIEW; a large quantity must not suppress the alert.
- Inbound outside the horizon does not reduce this period's Q_raw.
- Goods arriving after stockout do not fix the shortage before arrival.
- Also project the balance after the proposed new arrival. If stockout remains before lead time elapses, return URGENT_REVIEW, not normal/green.
- Urgent cases require manager action such as schedule clarification/manual expediting. Do not claim a PO alone resolves the shortage.
- One open PO does not necessarily cover all SKU demand; check remaining quantity and date.

### 7.5 Required fixture

This fixture has no customer reservations.

| Input | Value |
| --- | --- |
| Review | Due at fixture cutoff |
| Constant forecast | 10 units/day |
| Lead time | 3 days |
| Review interval | 7 days |
| Demand across ten-day horizon | 100 units |
| Safety stock | 20 units |
| Usable on-hand | 45 units |
| Confirmed PO arriving on day 3 | 25 units |
| Q_raw | 100 + 20 - 45 - 25 = 50 units |
| Pack size 12, MOQ 12 | Q_order = 60 units |

If the 25-unit inbound moves to day 12, it must not reduce ten-day demand; Q_raw becomes 75 and Q_order 84.

Another fixture: on-hand 10, demand 10/day, inbound 100 on day 7. Total stock must not make the system label the first week safe; show shortage before arrival.

### 7.6 Notifications and deduplication

Daily monitoring differs from authorisation to create routine purchases. Open an actionable case only when review is due or projected lead-time balance breaches safety stock/has an urgent shortage. Otherwise show MONITORING/NO_ORDER_NEEDED with reason not_due, even if full-period target coverage exceeds stock. This prevents a weekly policy becoming daily purchasing.

A routine case pending manager action remains actionable on later runs; recompute its revision when cutoff changes. Do not hide it because the calendar advanced. Advance the calendar only under §7.3 completion rules.

Execute daily analysis using §6.4 analysis identity; retries use the same key. An outgoing event may flag factual stock concerns but must not create a PO or new daily forecast from an unfinished day.

One active case per organisation/SKU. New analysis updates/supersedes recommendations within the case rather than creating another order each day. Notify manager on first opening/severity increase; recommended ordinary reminder cooldown is 24 hours.

**Outstanding commitment differs from eligible inbound.** An approved but unconfirmed PO does not reduce forecast shortage, but remains a purchasing commitment preventing duplication. The case becomes WAITING_EXISTING_ORDER while that PO remains, including dispatch pending/unknown or a simulated message awaiting synthetic acknowledgement. A new revision must not approve the same full need again.

MVP does not automatically add orders for SKUs with unclear commitments. The manager must first resolve confirmation, change or recorded cancellation. Do not mark an order cancelled merely because no reply arrived; cancellation needs an explicit status/event.

Scheduled and demo/manual runs use the same analysis function. Manual clicks must not produce metrics suggesting a scheduler was proven.

## 8. AI and evaluation

### 8.1 Model

RECOMMENDED DEFAULT to validate during the technical spike: pretrained **amazon/chronos-bolt-small**, Apache 2.0, for numerical time-series inference on RunPod. Pin model/revision/packages after a successful spike. The team may select another model with reasons, licence evidence, evaluation and updated declaration.

This model produces numerical forecasts; it is not a chatbot reading receipts or guessing policies. No fine-tuning/from-scratch training in MVP. GPU must perform actual inference, not merely store code or support dashboard screenshots.

MODEL sources document pretrained models and GPU inference examples. RunPod deployment is a team design, not an official model integration with Orbyte.

### 8.2 Input/output

Input: opaque SKU ID, consecutive daily dates, complete quantity_sold values, cutoff, horizon and revision. Do not send supplier phones/names, customer contacts, API keys or real business data to the model.

Output: daily forecasts, median/P50, supported quantiles, model ID/revision, data hash, generated_at, cutoff, runtime and status. All values must be finite; clip negatives to zero and record the transformation.

Summed daily quantiles do not guarantee a calibrated confidence interval for a monthly total. Show ranges as indicative daily uncertainty; default decisions use median plus an explicit manager-set buffer.

### 8.3 Dataset and quality

- DEFAULT: 168 synthetic history days per SKU for main fixture, fixed seed, declared stable/weekday/trend patterns.
- RunPod application-policy minimum: 28 complete consecutive days ending at the cutoff, at most 168; this is not a claim about model architecture minimums.
- One to 27 consecutive complete days use DEMO_ESTIMATE: the average of available recorded sales, with the exact evidence period/count and a limited-history warning. This local estimate may produce a manager-review suggestion after purchasing setup, but is not live AI or a validated forecast. It is never divided by 28. No observations, unresolved gaps, incomplete days or absent purchasing setup return NEEDS_DATA with no actionable quantity.
- A missing date is not zero sales.
- Stockout days censor observed sales below potential demand; flag them and do not claim recovery of true demand.
- The model does not automatically know promotions/unusual events absent from history.
- Record new target dataset, generator, seed, schema, cutoff and split in the data card/declaration.

### 8.4 Baselines and result selection

Compare against 28-day mean and 7-day seasonal-naive using only pre-cutoff information. DEFAULT 168-day fixture: final test origin after day 124; hold out days 125–168 as targets. Validation origins after days 58 and 72, with horizon max(30,H)≤44 so validation targets end before day 125. Evaluate all methods on identical dates/horizons.

Per SKU, select lowest pooled validation MAE; ties within 1e-9 choose the simpler baseline, and baseline ties choose the 28-day mean. Freeze selection before final test. Record invalid/censored days and exclusion rules.

If the model is not better on validation, use the selected baseline with label BASELINE_SELECTED while showing model evaluation and actual inference proof. Report final test without retrospective reselection. Do not call fallback AI prediction.

On RunPod timeout/outage, do not invent numbers. Show ERROR or labelled fallback, allow bounded retry, and retain the last result as timestamped history. Label replay/cache; these are not live-inference proof.

Runtime fallback requires ≥28 complete days and valid units/cutoff. Invalid-data forecast errors remain NEEDS_DATA/ERROR. Timeout may use 28-day mean with source BASELINE_FALLBACK and reason; do not claim an unevaluated validation-selected model was used.

### 8.5 Evaluation plan

1. Generate a fixed-seed fixture before experiments.
2. Use time splits and rolling-origin cutoffs toward the end of history.
3. Forecasts receive only values before cutoff. The generator may know the full series, but the inference worker must not receive future targets.
4. Evaluate forecasting separately from policy: compare forecasts to held-out synthetic actuals and quantities to arithmetic fixtures.
5. Report MAE, WAPE where denominator is nonzero, number of SKUs/days/cutoffs and inference time. Zero denominator is N/A, not division by zero.
6. Report model and both baselines; save result CSV/method in submission/evidence/.
7. Do not present synthetic success percentages as real-store savings/accuracy.
8. Demonstrate one actual Replit→RunPod run end to end. Provide a labelled backup recording if service fails; backup does not replace the required prototype.

## 9. State machines and important transactions

### 9.1 Restock case / proposal

    DETECTED
      → ANALYZING
      → NO_ORDER_NEEDED | NEEDS_DATA | NEEDS_REVIEW | WAITING_EXISTING_ORDER | PENDING_APPROVAL
      → APPROVED | REJECTED | SUPERSEDED

Rejection retains reason and re-review policy/cooldown. New recommendations after data changes have new revisions. Do not edit an approved proposal in place.

### 9.2 Purchase order

    APPROVED_PENDING_DISPATCH
      → SENT_SIMULATED | SENT_AWAITING_SUPPLIER | DISPATCH_FAILED | DISPATCH_UNKNOWN
      → SUPPLIER_CONFIRMED
      → PARTIALLY_RECEIVED
      → RECEIVED

Additional status: CANCELLED only by manager, without deleting receipts/audit. Price/quantity/date changes beyond approval return NEEDS_REVIEW, not automatic replacement.

SENT_SIMULATED is not real supplier confirmation. Label the demo supplier-confirmation button as a synthetic event.

### 9.3 Approval

Approval snapshot includes SKU, supplier, quantity/unit/pack, complete cost estimate, target date, policy version, ledger version, inbound version, forecast ID/cutoff, actor and override reason.

Atomic approval:

1. Check manager role, expected revision, case status, decision_date and expires_at against server/demo clock.
2. Lock/reread stock, active POs and policy; block additional POs while commitment is awaiting supplier or dispatch is unknown.
3. Reject stale revision with conflict; UI retains input and offers recomputation.
4. Validate quantity/MOQ/pack/budget and supplier information.
5. Create one approval/PO using a unique proposal-revision key.
6. Create one outbox event and audit entry in the same transaction.
7. Worker sends after commit.

Dispatch failure must not create a new PO. Retry uses the same business reference. Before dispatch, worker compares actual date with approved dispatch date. If the day changed, hold for ETA/revision review instead of sending with an old arrival date.

### 9.4 Receiving

Staff selects a supplier-confirmed PO, enters received quantity and synthetic evidence source. Partial receipt is allowed. Duplicate source_event_id returns the same result without adding stock again.

Each receipt records usable_qty and damaged_qty; total_received = usable_qty + damaged_qty. PO remaining = ordered_qty - sum(total_received) from valid receipts, while on-hand increases only by usable_qty. Validate against remaining using total_received so damaged goods do not remain recorded as future inbound.

Damaged_qty > 0 opens a manager exception: physical receiving may be complete while damage remains unresolved. Replacement/return needs a new recorded decision/reference; do not automatically create replacement POs or usable stock. Receipt cannot exceed remaining without manager review. Default MVP fixture has no damage, but these fields retain consistent meaning.

## 10. Functional requirements

These are acceptance criteria, not claims of implemented features.

| ID | Requirement | Priority | Acceptance |
| --- | --- | --- | --- |
| DATA-01 | Versioned synthetic dataset | MUST | Data card, seed, schema, UI labels and declared source available |
| DATA-02 | CSV import with preview/per-row errors | MUST | Handle unknown SKUs, units, duplicates, future dates and missing days |
| DATA-03 | Separate history from physical ledger | MUST | Repeated history import does not change stock |
| STOCK-01 | Append-only ledger and derived balance | MUST | Sales/receipts/adjustments form a traceable balance |
| STOCK-02 | Transaction forms validate type/unit | MUST | Reject wrong units, qty≤0 and negative stock |
| STOCK-03 | Transaction/import/receipt idempotency | MUST | Event replay does not change the result again |
| POLICY-01 | SKU settings: 7/30 days, lead time, buffer, pack/MOQ/budget | MUST | Validated changes invalidate old proposals |
| ANALYSIS-01 | Consistent-cutoff daily analysis | MUST | Snapshot and forecast share cutoff |
| ANALYSIS-02 | Actual RunPod worker contract | MUST | Request→job/result stored with model/version/source |
| ANALYSIS-03 | Explicit baseline and error states | MUST | No fallback labelled AI |
| ANALYSIS-04 | Recommendation includes lead time/cycle | MUST | §7.5 fixture yields raw 50/rounded 60 |
| ANALYSIS-05 | Dated inbound and projected balance | MUST | Late arrivals do not hide earlier shortage |
| CASE-01 | One active case per SKU | MUST | Identical analyses do not create two requests |
| CASE-02 | Deduplicated manager notifications | MUST | New case/severity increase visible; retries do not spam |
| APPROVAL-01 | Manager approves/rejects/edits with reason | MUST | Staff gets 403; changes/reasons recorded |
| APPROVAL-02 | Stale approval/double-click protection | MUST | Stale/expired approval returns 409; two clicks yield one PO |
| ORDER-01 | Purchase-message outbox from approved snapshot | MUST | No purchase message before approval |
| ORDER-02 | Separate delivery, supplier confirmation and receipt | MUST | Delivered/read does not automatically mean SUPPLIER_CONFIRMED |
| ORDER-03 | Retry/unknown state without duplicate orders | MUST | Channel failure creates no additional PO |
| RECEIVE-01 | Partial/full receiving | MUST | Stock/outstanding quantity change atomically |
| AUDIT-01 | Activity timeline | MUST | Actor, time, source, revision, action, before/after and outcome visible |
| ROLE-01 | Server-side demo staff/manager | MUST | Incorrect-role mutations rejected even through direct endpoint calls |
| UX-01 | Simple desktop/mobile workflow | MUST | Recommendation review through outcome needs no verbal instructions |
| UX-02 | Loading/empty/error/stale states | MUST | Do not substitute zero for errors |
| DEPLOY-01 | Replit prototype and persistent database | MUST | Judge can run a synthetic case in a fresh session |
| EVAL-01 | Model/baseline evaluation report | MUST | Split/method/N/results available; no leakage |
| MSG-01 | Real WhatsApp | SHOULD | If ready: provider message ID/status and valid template/permission |
| MSG-02 | Real Telegram | COULD | Configured bot/chat destination; status and permission proven |
| JOB-01 | Scheduled daily job | SHOULD | Cutoff/run logs; manual run always available for demo |
| EXPORT-01 | Decision-summary export | SHOULD | Same facts/sources as the screen |

MVP needs a working trigger. If JOB-01 is incomplete, STOCK-01 triggers analysis after input/day closing so the core journey remains event-driven; static charts alone are insufficient.

## 11. UX and screens

These are interaction requirements, not final visual design. Follow AGENTS.md: both ui-ux-pro-max and antislop in during mode. Use Orbyte screenshots as references for familiar workflows without claiming official status or duplicating branding.

| Screen | Main content | Main action |
| --- | --- | --- |
| Stock overview | SKU, usable stock, confirmed inbound, data status, estimated coverage | Record outgoing stock/receipt; open case |
| Import/stock entry | CSV preview/form, unit, unique reference, field errors | Validate and save |
| Restock detail | History/forecast, cutoff, model/baseline label, quantity calculation, inbound dates, warnings | Manager reviews proposal |
| Approval review | Supplier, qty/pack, costs, dates, reason, version, warning | Approve, edit with reason or reject |
| Orders/outbox | Message, channel, dispatch status, supplier confirmation, remaining quantity | Controlled retry; record confirmation/receipt |
| Activity/policy | Audit and SKU parameters | Manager changes policy or views history |

MVP may combine related screens in pages/detail drawers; six separate applications are unnecessary.

Required UX:

- Explain recommendations with concrete numbers/units; avoid undefined labels such as AI score.
- Show synthetic, simulated-channel and baseline labels in relevant context.
- One primary action per context, labelled forms, inline errors and preserved input on failure.
- Async buttons have loading/disabled/success/error states; disabled UI does not replace server idempotency.
- Keyboard/focus work; status is not colour-only; normal text contrast is 4.5:1.
- Test at least 375 px and desktop; wide tables must not hide essential data.
- Charts have dates/units/legends and text summaries. Distinguish history from forecasts; do not present future data as observed.
- Do not expose keys/provider IDs/debug details to staff unless needed for their task.
- Repository documentation is English by user instruction. English UI/pitch remains the recommended demo language; no spoken pitch language requirement was verified in reviewed sources, and the team can choose a language it can explain.
- Agree visual direction before UI build. Antislop Delivery Gate applies to actual UI; this document does not claim build, accessibility or click-through checks passed.

## 12. Architecture and contracts

### 12.1 Current local components and outstanding deployment

    CSV / forms
        → web application + backend on Replit
        → persistent database + ledger + policies + cases
        → GPU forecast worker on RunPod
        → deterministic replenishment rules
        → manager approval
        → transactional outbox
        → simulated supplier / optional WhatsApp / optional Telegram
        → supplier confirmation + receipt + audit

The authorised local implementation extends Next.js App Router/TypeScript/plain CSS with Node SQLite and a Python RunPod queue worker candidate. Replit must provide durable storage and one instance, or use a hosted persistent database. Real Replit/RunPod access, live inference and persistence across redeployment remain unverified.

Do not build two backends with duplicate business logic. RunPod is only a forecast worker; ledger, policy and approval authority remain in the application backend.

### 12.2 Conceptual database

All domain tables include org_id for data boundaries even with one demo organisation.

| Entity | Important fields |
| --- | --- |
| products | sku,name,base_uom,quantity_precision,active |
| suppliers | synthetic_name,channel,destination_reference,active |
| product_policies | product,supplier,L,R,SS,MOQ,pack_size,price_sen,budget_sen,next_review,version |
| stock_movements | event_id,product,type,quantity,occurred_at,reference,actor,reason,reversal_of |
| daily_sales | product,business_date,gross_sold,complete,stockout_flag,source_id |
| analysis_runs | cutoff,input_hash,ledger_version,policy_version,job_id,model_revision,status |
| forecasts | analysis,product,date,p50,optional_quantiles,source |
| restock_cases | product,status,severity,current_revision,notification_at |
| recommendations | case,revision,cutoff,forecast_id,qty_raw,qty_rounded,cost,warnings,explanation_facts |
| approvals | recommendation_revision,actor,decision,qty,reason,approved_snapshot |
| purchase_orders | approval,product,supplier,ordered_qty,remaining_qty,expected_date,status |
| receipts | po,event_id,usable_qty,damaged_qty,received_at,actor |
| outbox_messages | business_event_id,po,channel,payload_snapshot,status,provider_id,attempts |
| activity_events | actor,event_type,entity,time,before_after,version,outcome,correlation_id |

Ledger snapshots may be calculated/cached, but cache must not become a second source modified outside transactions. Test foreign keys, unique events, numeric precision and status constraints.

### 12.3 Conceptual API

Paths below are conceptual team contracts, not actual Orbyte APIs. The local app uses `/api/demo` actions for onboarding, CSV, analysis, policy, approvals and receiving, `/api/demo/controls` for the demo day, plus the dedicated products/movements routes. See README for implemented entry points.

| Endpoint | Permission | Purpose |
| --- | --- | --- |
| GET /api/products | staff/manager | Stock and permitted policy fields |
| POST /api/imports/validate | manager | Preview without mutation |
| POST /api/imports/commit | manager | Idempotent validated batch commit |
| POST /api/movements | staff/manager | Record movement |
| POST /api/analysis-runs | worker/manager | Analyse cutoff, job status |
| GET /api/analysis-runs/:id | staff/manager with field permissions | Result, pending, error |
| GET /api/restock-cases/:id | staff/manager with field permissions | Case/recommendation |
| POST /api/recommendations/:id/approve | manager | Approval with expected_revision and idempotency_key |
| POST /api/recommendations/:id/reject | manager | Reject with reason |
| POST /api/purchase-orders/:id/supplier-confirmation | manager | Record synthetic/real acknowledgement |
| POST /api/purchase-orders/:id/receipts | staff/manager | Atomic receiving |
| POST /api/outbox/:id/retry | manager/worker | Status-appropriate retry |
| GET /api/activity | manager | Organisation-filtered timeline |

Errors: validation 400/422, unauthorised 401, forbidden 403, conflict 409, provider unavailable 503. User messages explain next actions without exposing secrets/stack traces.

### 12.4 Forecast worker contract

Implemented queue request (`POST /run`, followed by `GET /status/{jobId}`):

```json
{
  "input": {
    "requestId": "saved-analysis-id",
    "productId": "opaque-product-id",
    "cutoffDate": "2026-10-20",
    "horizonDays": 33,
    "inputHash": "saved-history-hash",
    "dates": ["...28–168 consecutive ISO dates..."],
    "values": ["...matching finite nonnegative numerical quantities..."],
    "stockoutFlags": ["...matching boolean flags..."],
    "modelId": "amazon/chronos-bolt-small",
    "modelRevision": "<40-character commit shared by app and worker>"
  }
}
```

The arrays illustrate schema, not executable data. The actual adapter sends numbers/booleans and excludes contacts, supplier terms and prices. Completed output echoes requestId/productId/inputHash/cutoffDate and includes status, source, modelId/modelRevision, generatedAt, runtimeMs, device, aligned dates, p50, modelP50, warnings and evaluation. Forecast horizon is 30–44 days. Negative finite worker predictions are clipped with a warning; malformed shape/nonfinite values are rejected. Identity, dates, horizon and revision are validated before recommendation creation.

The saved request retains the submitted model revision. Analysis identity also includes forecast configuration. Data/policy/stock/inbound/date/configuration changes make a pending result stale; a stale result may remain in history but cannot create an actionable recommendation. Pending, completed and failed job records survive restart. Repeated clicks reuse the saved analysis, including failed/unknown submissions, and do not blindly submit another billed job. Configuration/invalid output errors do not silently fall back; an allowed provider outage fallback is labelled BASELINE_FALLBACK.

The Python handler and TypeScript contract pass a local round trip using fake Torch/Chronos dependencies. **No model was downloaded or executed and no GPU inference is proven.** Endpoint, credentials, pinned revision, exact dependency/image lock, resource limits and own-account evidence still require a controlled live spike. See worker/README.md and the current integration verification report.

## 13. Supplier channels and notifications

### 13.1 Message content

Create purchase messages only from the approval snapshot: PO reference, SKU/specification, quantity/unit/pack, reference price or price-confirmation request, target arrival and acknowledgement request. Do not include all sales history/internal stock levels.

If price is only a reference and unconfirmed by supplier, request confirmation of terms; PO remains awaiting acknowledgement. Increases beyond approval return to manager.

### 13.2 Mandatory and optional channels

- **MUST:** persistent outbox and supplier simulator. UI shows demo message text and SIMULATED label.
- **SHOULD:** official WhatsApp Cloud API if account/prerequisites ready. Inbound/outbound API uses server webhooks, signature validation, provider message IDs/status.
- **COULD:** Telegram Bot API if time remains. Correct configuration/platform permission must allow the bot to contact the supplier destination. Telegram must not silently substitute for a WhatsApp claim.

For WhatsApp: business-initiated/outside-24-hour-window messages use approved templates under applicable policy; check recipient permission/pricing. Do not promise Meta approval or zero cost. Retain actual usage proof and include it in the declaration if the real channel is used.

Do not make browser scraping/QR automation an MVP dependency without a team decision and terms review. Timebox real-channel work; core workflow/submission must not wait for external platform approval.

### 13.3 Retry and status

Outbox distinguishes QUEUED, PROCESSING, SENT_SIMULATED, SENT, DELIVERED, FAILED, UNKNOWN. UNKNOWN means provider outcome is unclear; do not blindly retry purchase messages and imply two orders to the supplier.

Retries retain the same business reference. Replacement channels still use the same PO. Outbox carries approved purchase requests only; no real payments.

## 14. Non-functional requirements

| Area | Team requirement/target |
| --- | --- |
| Correctness | All invariants/arithmetic fixtures pass; no uncontrolled money/quantity rounding |
| Persistence | Restart/redeploy preserves ledger, approvals, outbox and audit |
| Responsiveness | Local actions give immediate feedback; model calls have pending/status/retry |
| Latency target | Warm forecast ≤15 seconds for small fixture; measure/explain cold start, not an SLA |
| Freshness | Timestamp/cutoff/version visible; a forecast older than current cutoff is not automatically reused |
| Resilience | Model/provider errors cannot produce fake quantities, duplicate orders or fake receipts |
| Security | Server secrets, HTTPS, payload validation, permissions on every mutation, tenant filtering, rate limits |
| Privacy | Synthetic operational data; minimal logs; no secrets in screenshots/video/source |
| Observability | Correlation ID links movement, run, case, approval, outbox and receipt |
| Accessibility | Keyboard/focus, form labels, feedback, non-colour-only status and checked contrast |
| Reproducibility | Seed, dependency lock, model revision, configuration example and documented run instructions |
| Cost | Record platform usage; do not leave GPUs idle unnecessarily or claim all costs are free |

Fifteen seconds and 28-day history are team targets/defaults, not competition rules or model guarantees.

## 15. Acceptance and testing

Testing focuses on business decisions and failures that can corrupt stock/purchasing.

| ID | Scenario | Required result |
| --- | --- | --- |
| AT-01 | Import identical history twice | No duplicate history; stock unchanged |
| AT-02 | Send identical SALE event twice | Stock decreases once |
| AT-03 | Outgoing quantity exceeds stock | Rejected without partial ledger writes |
| AT-04 | Missing day and known zero | Missing blocked/flagged; complete zero accepted |
| AT-05 | Damage/receipt appears in history | Not counted as sales |
| AT-06 | Fixture 10/day,L 3,R 7,SS 20,S 45,inbound 25 | Raw 50, pack 12→60 |
| AT-07 | Same inbound moved to day 12 | Raw 75, pack 12→84 |
| AT-08 | Large but late inbound | Shortage alert remains before arrival |
| AT-09 | Q_raw zero with positive MOQ | No order merely to satisfy MOQ |
| AT-10 | Lead time 3,R 30 | Request at least 33 forecast days, not just 30 |
| AT-11 | Staff calls approve endpoint | 403 rejection |
| AT-12 | Two managers/two approval clicks | One approval/PO/outbox for the revision |
| AT-13 | Stock/policy changes before approval | 409 conflict; recomputation required |
| AT-14 | RunPod unavailable | Labelled error/fallback; no invented forecast |
| AT-15 | Outbox failure/timeout | Accurate status; no new PO |
| AT-16 | Provider delivered/read | Does not automatically confirm supplier |
| AT-17 | Partial receipt | On-hand increases by usable qty; remaining decreases by total receipt |
| AT-18 | Receipt event replay | No second stock increase |
| AT-19 | Forecast evaluation | All inputs before cutoff; no future targets sent to worker |
| AT-20 | Cached-result replay | Visible replay label; not called live |
| AT-21 | Judge accesses fresh session | Demo workflow/links work without developer account |
| AT-22 | Request for another organisation's data | Server restricts it; demo does not claim full production multitenancy |
| AT-23 | Negative/NaN forecast | Handled by policy; does not corrupt quantities |
| AT-24 | Actual RunPod roundtrip | Request/result/model/runtime linked to demo case |
| AT-25 | Manager rejects/edits quantity | Reason recorded; no supplier order before approval |
| AT-26 | Repeated daily event | No duplicate case/notification/order |
| AT-27 | Next-day run with unconfirmed PO | WAITING_EXISTING_ORDER; cannot approve same purchase again |
| AT-28 | Same-cutoff ledger correction | New analysis key/result; old approval version rejected |
| AT-29 | Aggregate CSV overlaps ledger_start_date | Rejected; no double-counted demand |
| AT-30 | Overdue review/retry | R is not negative; schedule advances once on success |
| AT-31 | History shorter than 28 days | 1–27 consecutive complete days: labelled DEMO_ESTIMATE; zero/gapped/incomplete history: NEEDS_DATA. No invalid 28-day mean or RunPod call |
| AT-32 | Late supplier acknowledgement | Recalculate ETA/projection; do not retain old assumed date |
| AT-33 | Time passes expires_at with no new movement | Reject approval; update decision date/ETA |
| AT-34 | Receipt of 8 usable + 2 damaged against PO 10 | On-hand +8; remaining 0; damage exception stays open |
| AT-35 | Routine review still PENDING_APPROVAL next day | Case remains actionable with a new revision; schedule does not hide it |

Record actual results, date, environment, model, case count and limitations. Empty checklists mean unverified. No claim is made that acceptance tests passed when the PRD was written.

## 16. Implementation, team and definition of done

Detailed plan: ../plans/BUILD_PLAN.md.

Recommended workstreams, not final named assignments:

- A: product, UX, proposal and usability testing.
- B: web application, approval and audit.
- C: data/ledger, rules and transactions.
- D: model, RunPod, deployment and evaluation.

Reported skills are in DECISIONS.md; the team selects owners. Every member must understand workflow, data, rules, model and limitations beyond their own directory.

Preliminary definition of done:

1. Actual core journey through outcome/log in the application.
2. Real RunPod inference and transparent fallback sources.
3. Critical acceptance AT-01/02/06/08/11/12/13/14/17/18/19/21/24 pass.
4. All six deliverables prepared using required templates, not only this PRD.
5. Replit/RunPod proof, Apache LICENSE, source and judge access available.
6. Demo/video/deck/proposal describe the same features.
7. Team reviews/adapts AI-assisted work and can explain every decision.
8. Authorised humans check latest official announcements, deadline, workshops and portal.

## 17. Submission and pitch

Details/ownership: ../SUBMISSION_CHECKLIST.md and ../COMPLIANCE_MATRIX.md.

Six preliminary deliverables:

1. Official-template proposal/PRD **PDF**, named SDC2026_TooGoodToBeTrue_Preliminary.pdf.
2. Pitch deck: problem, solution, technical approach and impact; ten slides is a practical team recommendation if chosen, not an official rule.
3. Accessible deployed prototype link; video/static mockup does not replace it.
4. SDC2026_TooGoodToBeTrue_TechDeclaration.pdf, all resources/proof included.
5. Public GitHub repository with required access.
6. **5–7-minute YouTube** pitch/demo video.

Six-minute video target. Rundown/narrative draft: ../submission/PITCH_AND_DEMO.md. Mention synthetic data, prediction/uncertainty, human approval and channel simulation where applicable. Overtime may incur one point/30 seconds under handbook rules; do not aim at exactly seven minutes.

Do not sign or tick attendance, licences, proof or test outcomes before they are true. Contacts, university, deployment links, actual proof, model/dependency versions and results still require facts.

## 18. Risks and scope cuts

| Risk | Mitigation/cut decision |
| --- | --- |
| Model fails/is too slow | Early spike, small model, limited input; labelled baseline fallback; no additional LLM |
| Model loses to baseline | Report it; allow baseline-selected policy; no fabricated AI-accuracy claim |
| Synthetic data is too easy | Freeze seed/scenarios; time-ordered evaluation; explain generalisation limits |
| Duplicate purchasing | Unique case/revision, transaction recheck, idempotent outbox |
| Late inbound hides stockout | Daily projected balance and urgent review |
| WhatsApp not activated | Working outbox/simulator; timebox integration; Telegram only after MUST |
| Team builds full ERP | Defer checkout, multiple warehouses, production, customer orders and negotiation |
| Stack/access undecided | Close M0; no conflicting parallel implementations |
| Rules/portal differ | Retain provenance/clarification; use earlier deadline meanwhile |
| Submission falls behind coding | Documents/declaration/evidence from day one |
| AI drafts used without review | Mandatory team review; do not call this a final signed submission prematurely |

Cut order: Telegram → real WhatsApp → additional exports/reports → additional reminders → secondary charts. Do not cut approval, audit, data integrity, actual RunPod evidence, prototype access or six deliverables.

## 19. Roadmap

After preliminary/authorisation for the next phase: POS/ERP connectors; real Orbyte integration when access exists; multiple suppliers; AI interpretation of supplier replies; shelf-life/batches; consumption forecasting; supplier calendars; multiple warehouses; customer-order dependencies; tiered budget routing.

Each roadmap item needs its own validation, data contracts and permission. It is not automatically mandatory MVP backlog.

If shortlisted, the final round has different deliverables/deadlines. See the compliance matrix appendix; do not replace preliminary obligations with final-round pitch format.

## 20. Handoff for the next AI

1. Read documents in §0 order and check Git status before editing.
2. eStock is selected; earlier customer-order/catering ideas are not mandatory features.
3. Extend the existing authorised application; do not rebuild it. Normal startup remains empty, and tests use explicit temporary synthetic fixtures.
4. After implementation is authorised, close M0: stack, accounts/credits, model endpoint, channels, demo roles and workstream owners.
5. Build one vertical slice before extra features.
6. Use §15 business tests; record actual outcomes, not invented checklist results.
7. Update PROJECT_CONTEXT.md and DECISIONS.md when decisions change; align proposal, deck, video and declaration.
8. Do not send real messages, buy goods/services, change repository visibility or publish deployments without appropriate authorisation.
9. Do not fabricate attendance, signatures, impact, customer validation, sponsor APIs, real datasets or proof.
10. AI development assistance must be declared; the team reviews/adapts/understands it.
11. Keep all repository documentation in English. For UI/UX, use both ui-ux-pro-max and antislop in during mode under AGENTS.md.

## 21. Document review status

Product requirements and written sources have been organised as a complete baseline. Names, emails and university were supplied; leader phone and portal matching still need completion. Stack approval, platform activation, evaluation results, judge access, workshop status, latest announcements, links and signatures remain actual work before submission.

Document completeness does not establish that all videos/Discord/portal instructions were reviewed or that a prototype exists. Record every unverifiable rule as an open item rather than removing it.
