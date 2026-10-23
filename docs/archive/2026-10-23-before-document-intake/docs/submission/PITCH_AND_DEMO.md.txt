# eStock: pitch, deck, video and demo guide

Version 1.0 | 20 October 2026 | TooGoodToBeTrue | Domain 2

**Status:** production guidance for materials after the application is implemented and tested. No deck, recording, evaluation results, deployment or usage proof is claimed complete. The team must adapt every narrative and check it against the actual build before recording.

Product sources of truth: [PRD](../product/prd.md), [decisions](../product/DECISIONS.md), [compliance matrix](../COMPLIANCE_MATRIX.md) and [submission checklist](../SUBMISSION_CHECKLIST.md). If scope changes, update documents/materials consistently.

## 1. Official rules and team choices

| Topic | Status | Requirement |
| --- | --- | --- |
| Preliminary video | OFFICIAL: Participant Handbook §6.3.5.6 | Pitch with prototype demonstration, **5–7 minutes**, submitted as a **YouTube link** |
| Overtime | OFFICIAL: Participant Handbook §6.3.5.6 | One-point deduction per 30 seconds over allowed time, subject to final judging rules |
| Preliminary deck | OFFICIAL: Participant Handbook §6.3.5.2 | Problem, proposed solution, technical approach and expected impact; narrative matches video |
| Prototype access | OFFICIAL: Participant Handbook §6.3.5.3 | Working link or accessible build; a recording/static mockup alone does not replace it |
| Preliminary deck file format | NO EXPLICIT LIMIT FOUND | Team chooses editable PPTX and backup PDF; check portal before upload |
| Slide count | TEAM RECOMMENDATION | Ten-slide outline below is a timing aid, **not an official ten-slide limit** |
| Recording duration | TEAM RECOMMENDATION | Six-minute target; inspect total export including intro, outro and final screen |
| Language | TEAM RECOMMENDATION | Choose one language understood by team/judges; English is an option. No spoken-language rule was found in reviewed sources. Check latest announcements. Repository documentation is English by user instruction |
| Logos/integration status | PRODUCT HONESTY BOUNDARY | eStock is a team proposal for the Orbyte ecosystem, not an official module or approved live integration |
| Platform proof | OFFICIAL: Participant Handbook §10.6–10.7 | Own-team Replit project/account proof and RunPod dashboard evidence belong in Technical & Tools Declaration, not merely a brief video appearance |
| Physical final round | SEPARATE FROM PRELIMINARY | Handbook specifies ten-minute pitch/five-minute Q&A and PPTX slides for finals. Do not apply that duration to the preliminary video |

Official sources: [Participant Handbook](https://drive.google.com/file/d/1fGBS-jevDj_FrF8wsbYNPzyU5TTrfk1V/view), [Domain 2 brief](https://drive.google.com/file/d/11wqbeO-HYep-DJPQ-LPZnrZfQvCgr5BU/view), [proposal template](https://drive.google.com/file/d/1jNjuMJfhMYjo3qQw_PmmeGM-INEwuleo/view), [Technical Tools Declaration template](https://drive.google.com/file/d/1LBXfXrFblX-dHanSP8jhUOMGfGGxY2ew/view).

Official deadline sources still conflict; use the earlier plan and clarification records in the compliance matrix. Internal target: Saturday, 24 October 2026, 20:00 MYT. Do not delay uploads until the last minute.

## 2. Main story and permitted claims

One-sentence pitch:

> eStock connects sales, inventory and outstanding purchases to help managers decide when and how much stock to reorder, then records the supplier request and receiving outcome.

Problem to demonstrate: an owner switches among sales history, stock spreadsheets, purchase records and supplier messages before preparing a restock decision. A low-stock alert alone does not show how much to buy or whether supplies arrive in time.

**Validation status:** interviews, adoption, business losses and field savings cannot be treated as proven merely because they appear in a PRD. If the team conducts interviews, report number, context, date and limitations without putting real customer/company records into the operational demo dataset.

Separate three responsibilities on screen and in narration:

1. **AI:** estimates future demand units from complete daily sales history.
2. **Rules:** use forecast, lead time, review cycle, buffer, packaging, cost limits and dated confirmed POs to calculate purchase proposals.
3. **Manager:** checks explanations, edits with a note, approves or rejects. The system does not approve purchases itself.

Do not claim “eliminates stockouts”, “always accurate”, “saves 50%”, “WhatsApp automation already integrated” or “Orbyte uses eStock” without appropriate evidence. A 50% time-reduction target remains a planning target until measured. Synthetic success does not establish real-store performance.

## 3. Deck outline: recommended ten slides

One idea per slide. Combine/split the outline while preserving narrative, timing and readability. The entire appendix need not be presented.

| Slide | Title and purpose | Minimum content | Evidence/visual to prepare |
| --- | --- | --- | --- |
| 1 | eStock: what and for whom | Product, team, Domain 2, one benefit sentence | Clear title; logos must not imply sponsor approval |
| 2 | Before eStock | One restock decision needs several sources/follow-ups | Synthetic sales→stock→PO→supplier illustration; state problem hypothesis |
| 3 | One connected journey | Trigger→data→forecast/rules→manager→message→receipt/log | Short workflow diagram showing approval boundary |
| 4 | AI estimates; rules calculate | Model input/output, cutoff, comparisons; not a chatbot | History/forecast chart with source/model version; one purchase formula |
| 5 | End-to-end demo | Prototype link and three observations: recommendation, approval, outcome | Switch to actual application, not only screenshots |
| 6 | What was actually tested | Model/baseline results, workflow tests, timed task if available | Actual results, N, split, units, methods; no targets presented as achievements |
| 7 | Architecture and sponsor fit | Replit app/database→RunPod worker; proposed/simulated Orbyte integration | Actual diagram, request/result proof, clear mock scope |
| 8 | Benefits and SDG | Operational productivity, SDG 8.2/8.3, KPI/target | Measured baseline/KPI or labelled assumption; environmental claims only if tested |
| 9 | Limits and next steps | Synthetic data, forecast uncertainty, freshness, actual channels; short roadmap | Actual implementation status; do not list roadmap as completed features |
| 10 | Team and close | Four members, actual contributions, demo/repository links, one outcome sentence | Readable links; no need to show private emails/phones |

Recommended appendix: SKU parameters; formula/fixed fixture; evaluation split/details; model/licence; state machines; permissions; duplicate prevention; resource/proof list; data limits; deadline clarification. These support Q&A, not a required slide count.

## 4. Six-minute video rundown

Use the script as a guide, not a reason to speak too quickly. Rehearse transitions and cut repetition before increasing speech speed.

| Time | Duration | Screen | Message |
| --- | --- | --- | --- |
| 00:00–00:20 | 20 seconds | Slide 1 | Team, product, target SME and task addressed |
| 00:20–00:55 | 35 seconds | Slide 2 | Manual reconciliation/follow-up example; truthful hypothesis/interview status |
| 00:55–01:15 | 20 seconds | Slide 3 | One workflow; purchases still require approval |
| 01:15–01:40 | 25 seconds | Slide 4 | AI predicts demand; rules calculate purchases; model compared to baselines |
| 01:40–04:20 | 160 seconds | Slide 5→application | Ordered §5 demo including one exception |
| 04:20–04:55 | 35 seconds | Slide 6 | Actual tests with N/method; complete evaluation before final materials if results are missing |
| 04:55–05:20 | 25 seconds | Slide 7 | Actual Replit/RunPod roles, mocks and potential Orbyte reuse |
| 05:20–05:40 | 20 seconds | Slide 8 | Honest baseline, KPI and SDG target |
| 05:40–05:55 | 15 seconds | Slide 9 | Main limitation and one next priority |
| 05:55–06:00 | 5 seconds | Slide 10 | Brief close with demo/repository links on screen |

Mention team/product once in the opening if sufficient. Every member need not speak if it disrupts the flow; all must still understand and explain the product.

## 5. Demo: one restock need through receiving

### 5.1 Dataset and initial conditions

Use one fictional organisation, one location, 3–5 synthetic SKUs and one primary supplier per SKU. The main SKU must be sold in a clear unit, such as rolls of packing tape at a packaging-supplies shop, not internal consumption whose model is outside MVP.

Before recording, prepare:

- Sufficient daily history, explicit cutoff and test fixtures that do not leak into forecasting input.
- Consistent opening balance/movements; aggregate history must not decrement stock again.
- Per-SKU policy: unit, pack size, MOQ, lead time, 7/30-day interval, safety stock, supplier, dated reference costs and budget.
- A valid restock need on the actual build; do not adjust figures after seeing results merely to make the model look superior.
- Confirmed POs/inbound dates if needed, distinct from POs awaiting a reply.
- Labelled simulated staff/manager sessions when demo roles are used.
- SIMULATED outbox/supplier simulator labels. Show WhatsApp as real only after actual implementation/verification.
- A demo sandbox reset that does not delete project audit/history or write to external services without permission.

### 5.2 Screen sequence within 160 seconds

| Video time | Screen/action | Visible evidence | Key narration |
| --- | --- | --- | --- |
| 01:40–01:55 | Dashboard→SKU | Synthetic labels, demo date/cutoff, stock, sales and policy | Figures come from connected records; stock is not guessed by AI |
| 01:55–02:15 | Staff records sales on T; close day and analyse for T+1 | One stored movement, changed balance, complete day, cutoff T/decision_date T+1 | Daily forecast uses complete days; approval happens on T+1 before that day's movements |
| 02:15–02:40 | Analysis→forecast result | RunPod request/job/result, model revision, cutoff, source, forecast | Actual inference; label any edit shortening wait time |
| 02:40–03:05 | Recommendation | Horizon demand, lead time/cycle, buffer, dated inbound, raw/pack-rounded quantity, estimated cost | AI estimates demand; rules turn it into a purchase proposal |
| 03:05–03:25 | Manager review→approve | Details/reason, authorisation, approval record, one PO/outbox | Approval does not increase stock; quantity/price/supplier status visible |
| 03:25–03:45 | Supplier outbox→acknowledgement | Referenced message, simulated/provider status, separate confirmation | Delivered/read is not supplier acceptance; demo supplier confirmation is synthetic |
| 03:45–04:05 | Simulate arrival time→receipt→activity | Clearly advanced demo date, usable_qty/damaged_qty, stock change, PO remaining, actor/time | Only usable_qty increases stock; remaining decreases by usable + damaged; damage opens manager exception |
| 04:05–04:20 | One chosen exception | Real status and next action | System blocks invalid action or exposes risk |

For the fifteen-second exception, choose ONE strong implemented case:

- **Late PO:** large inbound arrives after demand; risk before arrival remains visible.
- **Repeated approval:** one approval does not create two POs/outbox events. Do not deliberately send two external messages to demonstrate this.
- **Incomplete data:** model does not turn missing days into zero; hold recommendation and show next action.
- **Stale proposal:** ledger/policy changes reject approval and request refresh.

For cutoff T, decision_date is T+1 and forecast starts then. Approval is allowed only on T+1 before that day's movements; proposal expires at the start of T+2 in MYT even if the ledger is unchanged. Approve before advancing to receipt day. If expired, recompute revision, decision date and ETA; do not dispatch with an old ETA. Clearly label demo-clock changes.

A routine PENDING_APPROVAL review remains actionable. Analysis has not completed the review and must not advance the schedule until the task disappears. On date change, retain the case with a valid new revision. Advance the schedule after valid NO_ORDER_NEEDED or recorded manager approval/rejection, using PRD anchors/rules.

For receiving, total_received = usable_qty + damaged_qty. Only usable_qty increases on-hand; subtract total_received from PO remaining so damaged goods are not still counted as future inbound. Positive damaged_qty opens a manager exception. Do not automatically create replacement, return or additional usable stock. The main demo fixture may have no damage; fields/explanations still follow this rule.

### 5.3 Separate model values from the formula example

**The fixed PRD acceptance fixture is not live AI output.** Constant 10 units/day, L=3, R=7, SS=20, stock 45, timely inbound 25 and pack size 12 produce raw quantity 50 and rounded purchase 60. This proves arithmetic/rounding only.

For live inference scenes:

1. Use the actual RunPod forecast for the shown input/model revision.
2. Recalculate the recommendation from that forecast. Quantity need not be 60 and must not be forced to 60 to match a script.
3. If runtime uses a baseline, label BASELINE_SELECTED/BASELINE_FALLBACK and name the actual method. Actual model inference proof may be shown separately as model evaluation.
4. Label replay, old recordings, cached results and simulators appropriately. Do not call them live requests.
5. If the model fails during recording, fix it or honestly use fallback/replay. Do not fabricate logs/results as replacement proof.

## 6. Presenting evaluation without invented benefits

Populate the results slide only after testing. Recommended minimum:

| Claim | Required evidence | Interpretation limit |
| --- | --- | --- |
| Forecast is useful | Model vs mean28/seasonal-naive7, temporal split, forecasts/cutoffs/SKUs, MAE/WAPE, selected method | Synthetic data proves behaviour only on test scenarios; model need not win |
| Faster decision preparation | Equivalent manual/application tasks, participants/cases, start/end times, corrections/errors, median | Not savings for all SMEs; do not mix second-attempt practice with first-attempt baseline without explaining order |
| Prevents duplicate orders | Acceptance cases and PO/outbox/receipt counts before/after repeated actions | Do not claim 100% reliability without the tested scope |
| Usable workflow | Testers complete tasks without additional guidance; record obstacles/tester count | Not proof of market adoption or production readiness |
| Actual platform use | Replit URL, own project/history, RunPod dashboard/request/result | Endpoint screenshot alone does not prove the model processed demo input |

All result tables show period/cutoff, units, sample and measured/target/assumption status. Report actual misses and implications. Do not change splits/test data/baselines after seeing test results to make the model win.

## 7. Deck and recording preparation

### 7.1 PPTX deck and PDF

- Save editable submission/eStock_Pitch_Deck.pptx; PDF preview is a compatibility copy, not an additional official format requirement from reviewed sources.
- Recommended 16:9 ratio, concise text, fonts available on other machines, charts with units/legends/sources.
- Use actual-build screenshots. Do not mix roadmap screens with implemented screens without labels.
- Provide readable/clickable links; QR is additional, not the only access route.
- Test the full PPTX on another machine/session: fonts, animation, diagrams, embedded video, hyperlinks and file size.
- Export PDF and inspect each page for clipping, small tables, symbols and layout shifts.
- Remove placeholders: example URLs, sample figures that look like results, incorrect member names, missing model versions and private notes.

### 7.2 Before recording

- Freeze a stable demo build and record commit/deployment version; this internal recording freeze differs from the post-deadline prohibition.
- Ensure prototype, database, RunPod and all evidence are actually ready; rehearse from reset.
- Prepare demo credentials without developer access; do not show passwords on video. Label simulated identities.
- Clear desktop notifications, unrelated tabs, personal bookmarks, autofill, console, terminal, billing dashboards and secret settings.
- Do not show private registration emails/phones or real supplier contacts. If real messages are demonstrated, mask destinations/sensitive account data, obtain recipient permission and do not describe synthetic contacts as real.
- Replit/RunPod proof shows required information without API keys/tokens/payment details. Keep a redacted version that still identifies the team's own account/project.
- Use readable capture quality, clear microphone, deliberate cursor and consistent zoom. 1080p is recommended, not an official requirement.
- Start with a clock/timer; rehearse unedited first to measure duration. Include cloud-job time in planning.
- If a worker is prepared before the demo, state that fact; do not promise unmeasured cold-start time. Avoid unnecessary idle GPU cost.

### 7.3 During recording/editing

- Demonstrate important actions on a working prototype. Removing pauses is a team production technique, but do not manipulate status/dates to imply automation/realtime behaviour that did not happen.
- State when simulation, accelerated demo time, shortened job waits or replay are used.
- Do not use a single screenshot as live-integration proof. Show linked request/result references without secrets.
- Do not claim AI performs rule arithmetic, approval or dispatch when ordinary code/manual demo actions do so.
- Match narration to on-screen SKU names, quantity, costs, dates, model source and outbox status. If data changes during retakes, update related scenes.
- Export recommended local master submission/eStock_Pitch_Demo.mp4; check final-file duration of 5–7 minutes, not just editor timeline.

## 8. Upload and access testing

1. Upload to YouTube early enough for processing. Unlisted usually allows judge access without search publication; this is a team recommendation, not a verified official visibility rule. Judge access is mandatory.
2. Title includes SDC 2026, TooGoodToBeTrue, Domain 2 and eStock. Brief description links prototype, GitHub, deck/access guide and relevant synthetic/simulated labels.
3. Use the correct video link, not studio/editor/private playlist. Open incognito/on another device without the owner's account. Check that private/age/login restrictions do not block judges.
4. Watch the entire YouTube version: audio, subtitles if any, processed resolution, duration, opening/ending, description links and demo. Correct local files do not guarantee a correct upload.
5. Check deck/prototype/repository separately. Video access does not replace prototype access. Do not put credentials/tokens in descriptions.
6. Copy final URL to README, proposal where relevant, Technical & Tools Declaration/access guide, deck and correct portal field. Verify submitted URLs after submission, not only clipboard values.
7. Save receipt/screenshot/submission timestamp and matching commit/deployment version. Follow applicable post-deadline freeze; changes require official instruction.

## 9. Backup and demo failures

Prepare a local backup package: PPTX, PDF, master video, synthetic fixture, access guide, source commit, evaluation and redacted proof screenshots. Store it somewhere team members can access. Backup preparation does not replace the six official artifacts.

| Problem | Action and honest explanation |
| --- | --- |
| RunPod timeout/down | Show labelled error/fallback; use labelled replay if necessary. Still provide prototype and previously created actual-inference proof |
| WhatsApp unavailable | Run labelled persistent outbox/supplier simulator; explain WhatsApp is not implemented. Do not call message preview a sent message |
| Prototype down | Restore deployment before submission; backup recording alone does not satisfy working-prototype requirement |
| Video unprocessed/access denied | Fix access and retest in a fresh session before deadline; reserve reupload time |
| Demo data changed | Reset to documented dataset version; do not delete genuine project history or resend real purchases for recording |
| Model loses to baseline | Report it and use selected baseline per evaluation. Product value remains connected workflow/decisions; do not call baseline figures AI |

For unresolved issues, record owner, status, impact and next action in the checklist. Do not mark complete without evidence.

## 10. Judge questions and evidence-based answers

These are rehearsal prompts, not facts to recite before implementation.

| Question | Answer the team must understand |
| --- | --- |
| Why AI? | AI estimates demand from history; procurement/approval use rules. Show actual mean28/seasonal-naive7 comparison, including baseline wins |
| Why not a low-stock alert? | Decisions need lead time, cycle, buffer, dated inbound and pack size; show late inbound/existing PO |
| What does RunPod do? | Explain model, revision, inference type, input/output and actual request/result. “Hosting AI” alone is insufficient |
| What does Replit do? | Actual app/backend/deployment, database/worker connections, own project/history/proof |
| Is it connected to Orbyte? | No if mocked. Explain potential identity/approval/audit reuse; stock/restock is a proposed capability, not an official sponsor-module claim |
| Where does data come from? | Team-created synthetic data with documented generator/seed/cutoff; no real business/customer/supplier operational records |
| Does zero sales during stockout mean zero demand? | No. Stock constrains sales; show stockout flags/data limits. Do not claim recovered lost sales without implementation/evaluation |
| What about different month lengths? | MVP uses fixed 7/30-day cycles. Calendar months, supplier holidays and complex policies are roadmap |
| What if manager approves twice? | Show server validation/version checks, one approval/PO/outbox and tests. Disabled buttons alone are insufficient |
| Does approval increase stock? | No. It creates commitment/request; usable_qty increases stock only at receiving. Remaining drops by usable + damaged; damage remains an exception. Supplier acknowledgement differs from message delivery |
| Is WhatsApp real? | Answer according to actual completed channel. Show provider status if real; label simulator |
| How are costs determined? | Clearly labelled price/shipping/reference status; unknown is not zero; validate packs/budget. Forecast is not a supplier quotation |
| How accurate/how much saved? | Report N, split, units, benchmark and actual results. Do not extrapolate simulation to real SME savings |
| What if AI/provider fails? | Visible error/fallback source, bounded retry, no silent purchasing or fabricated results |
| Who wrote code/materials? | Members are responsible for review/adaptation/testing; declare AI tools and extent in Technical & Tools Declaration |
| Why not a full ERP? | One replenishment loop with 3–5 demo SKUs. Defer POS/ERP connectors, multiple suppliers, expiry, production and customer orders |

## 11. Team understanding check

Reported names/skills are not automatically final assignments. Assign presenter, demo operator, evidence reviewer and upload owner in decisions/build planning. One person may hold multiple roles; final responsibility must still be clear.

Before recording, every member can explain without reading the PRD:

1. Problem, users, validation status and Domain 2 fit.
2. Stock/history sources, cutoff T, decision_date T+1, expiry at start of T+2, units, confirmed PO/receipt effects.
3. AI boundary, baselines, deterministic rules and manager approval.
4. Actual demo figures and why they may differ from the fixed 60-unit fixture.
5. PO/outbox/supplier-confirmation/receipt status, usable/damaged, pending review and duplicate protection.
6. Actual model/runtime, evaluation, uncertainty and fallback.
7. Simulated, optional, unfinished and roadmap items.
8. Six deliverables, usage proof, declarations, deadline conflict and judge access.

## 12. Final materials gate

- [ ] Resolve placeholders/unknowns or state them honestly; no fake prototype/model/deployment/results.
- [ ] Deck/video depict the same build commit as submitted prototype/source.
- [ ] Video is 5–7 minutes, demonstrates prototype and has a judge-accessible YouTube URL.
- [ ] Replit role, RunPod inference and simulation limits visible; proof also in Technical & Tools Declaration.
- [ ] Model figures come from actual runs; fixed fixture not claimed as AI output.
- [ ] Operational/demo contacts and data are synthetic; no secrets/private contacts/payment details in frames/audio/descriptions.
- [ ] Show at least one exception/audit outcome; test claimed features.
- [ ] Evaluation states N/method and separates achieved results/targets/assumptions.
- [ ] SDG/baseline/KPI match proposal; no unmeasured environmental savings.
- [ ] Reopen PPTX/PDF; verify prototype/repository/deck/video links in a fresh session.
- [ ] All members understand full workflow; presenter/upload owner assigned.
- [ ] Check portal/tutorials/latest official announcements before final upload; retain conflicts.
- [ ] Save backups, submission proof and version snapshot; follow freeze.
