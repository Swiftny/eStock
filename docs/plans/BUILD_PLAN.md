# eStock: build and delivery plan

Baseline: 20 October 2026; status updated 21 October. The user subsequently authorised the persistent workflow and frontend refinement. Local database, forms, rules, forecast adapter, approval/outbox/receiving and audit are now implemented. See IMPLEMENTATION_2026_10_21.md and the workflow verification report. M1/M3 are not fully complete: real RunPod inference, fixed evaluation and Replit deployment/proof still require account configuration and actual execution. The earlier landing-only pause is superseded; no publication or Git commit is authorised.

## Execution principles

- One complete workflow: movement → snapshot → forecast → recommendation → approval → outbox/PO → receiving → audit.
- The main AI task is forecasting. Chatbots and interpretation of supplier replies are roadmap items.
- Make the product general through configuration; use 3–5 synthetic SKUs and one location for the demo.
- The plan requires Replit and actual RunPod inference, with proof from the team's own accounts.
- Label synthetic data, simulated channels, fallback, cache and backup recordings.
- [PRD](../product/prd.md) requirements and acceptance control scope; competition rules are in the [compliance matrix](../COMPLIANCE_MATRIX.md).
- Keep repository documentation in English. UI work must use both ui-ux-pro-max and antislop in during mode, as required by AGENTS.md.

## M0: decisions and contracts

Complete before parallel development:

1. Select an application framework, database, migration and deployment approach the team understands.
2. Verify Replit and RunPod accounts/credits. Do not put secrets in documents.
3. Select a candidate model and provisional contract. The first M1 spike validates the choice; pin the revision/package versions after success and before evaluation.
4. Agree the SKU, unit, movement, daily-history, policy, PO, outbox and audit schemas.
5. Define ledger_start_date, business-day closing, approval window and demo clock according to the PRD.
6. Agree statuses, errors, API, idempotency, staff/manager roles and organisation boundaries.
7. Select the fixture and CSV schema. Record the seed/hash; all operational data remains synthetic.
8. Require the simulator, timebox WhatsApp, and allow Telegram only after MUST work is complete.
9. Agree visual direction before UI implementation. Follow ui-ux-pro-max and antislop during mode from AGENTS.md.
10. Use the confirmed assignments below; agree a reviewer for each change.

**M0 complete:** decisions recorded in [DECISIONS.md](../product/DECISIONS.md), diagram/API/schema aligned, and every member can begin without guessing.

## M1: model and ledger spike

Run these workstreams in parallel after agreeing initial contracts:

- AI/platform owner: perform one synthetic-data inference on RunPod; retain results, model, runtime and account proof. Test this risk on day one.
- Data owner: implement ledger, CSV validation and duplicate protection. History before ledger_start_date must not overlap ledger-derived sales.
- Application owner: create core pages against the shared contract. Label temporary fixtures; do not claim the API works before it does.
- Product/evidence owner: prepare problem narrative, source list, proposal and tools inventory from the outset.

**M1 complete:** one SKU has a correct balance, one real inference succeeds, and the constant-input arithmetic fixture produces raw 50/rounded 60 under PRD §7.5. Test the arithmetic separately from actual model output, whose values may differ.

## M2: one complete workflow

1. Record outgoing stock and close the demo business day.
2. Create an analysis run from a consistent snapshot/version.
3. Show forecast, source and cutoff; calculate demand and validate the purchase schedule.
4. Deliver a case to the manager. Staff cannot approve purchasing.
5. Approval atomically creates one PO, outbox event and audit record.
6. Record a clearly labelled synthetic supplier acknowledgement.
7. Record partial/full receipt; increase physical stock only by the usable quantity actually received.
8. Confirm application restart preserves state.

**M2 complete:** a judge in a fresh session can run the full workflow. Provider failures show actionable status.

## M3: resilience, evaluation and optional channels

MUST work:

- Test repeated imports, sales, approvals and receipts.
- Test unconfirmed POs, late inbound, stale approval and policy changes.
- Test short/gapped history, model timeout and valid fallback.
- Evaluate the model against both baselines using the agreed time split.
- Check desktop, mobile, keyboard, error states and synthetic/simulated labels.
- Test deployment and access instructions. Record actual acceptance results and limitations.

After MUST works:

- Implement WhatsApp if the account, number and templates are ready. Limit work to at most one agreed team work session.
- If activation is unavailable, record the blocker and continue with the working simulator.
- Implement Telegram only if time remains, without delaying documentation, testing or video.

## M4: artifacts and submission

- Transfer the [proposal draft](../submission/PROPOSAL_DRAFT.md) and [declaration draft](../submission/TECH_DECLARATION_DRAFT.md) into official templates.
- Fill versions, region, model, dataset, tools, licences and proof from actual usage.
- Prepare PPTX and backup PDF, a 5–7-minute YouTube video, live prototype, source and access instructions.
- All members review/adapt the content. The leader checks contacts, signs and dates it.
- Add designated committee access, make the repository public when required, and test every link in a fresh session.
- Verify portal file/field limits. Submit before the internal target and retain confirmation.

Scene, slide and recording guidance: [PITCH_AND_DEMO.md](../submission/PITCH_AND_DEMO.md). Use [SUBMISSION_CHECKLIST.md](../SUBMISSION_CHECKLIST.md) for the final check.

## Tuesday–Saturday timeline

All times MYT, UTC+8. This schedule is a team recommendation.

| Day | Priority | Minimum outcome |
| --- | --- | --- |
| Tuesday, 20 October | M0, RunPod/Replit spike, document framework | Decisions, data/API contracts, one inference, tested deployment path |
| Wednesday, 21 October | M1 and M2 | Ledger, forecast, recommendations, approval and outbox connected |
| Thursday, 22 October | Complete M2, begin M3 | Receipt, audit and deployed workflow; begin evaluation/task measurement |
| Friday, 23 October | Stop adding major features | Fix important failures; collect proof; review PDFs/deck and rehearse |
| Saturday, 24 October, morning–afternoon | Recording, exports and portal verification | Six complete deliverables, accessible links, team-approved content |
| Saturday, 24 October, 20:00 | Internal submission target | Submission sent and confirmation retained |

PH/orientation specify 25 October, 07:59:59 AM; the website/FAQ specify 11:59 PM. Use the earlier deadline until official clarification. Reserve Saturday for recording retakes, YouTube processing and PDF uploads; do not spend it on extra features.

## Assigned workstreams

Confirmed by the user on 21 October 2026. Individual task pages are in [pages/](../../pages/README.md); they separate work without imposing file ownership.

| Member | Workstream | Task page |
| --- | --- | --- |
| Vitto | Frontend | [Frontend](../../pages/frontend.md) |
| Maxi | Data | [Data](../../pages/data.md) |
| William | System and backend | [Backend](../../pages/backend.md) |
| Marco | AI inference and evaluation | [AI](../../pages/ai.md) |
| All members | Demo integration and rehearsal | [Demo](../../pages/demo.md) |

Coordinate shared contracts before edits. Submission documents still require team preparation and leader review; these assignments do not claim the artifacts are finished.

## Git and integration

- Check status/remotes before edits; preserve other people's work.
- Use small tasks/branches and integrate the complete workflow early.
- Commit real changes. Do not fabricate dates/history or import sample .git.
- Have another member review contract changes and record them in the PRD/decision register.
- Follow private/public repository and committee-access rules; prepare a secret check before publication.
- Push, merge, deploy, change visibility and send external messages only within team authorisation.
- Freeze the judged repository/live build after the deadline unless officially authorised.

## If time runs short

Cut in this order: Telegram → real WhatsApp → secondary exports/reports → additional reminders → secondary charts.

Preserve a correct ledger, approval/permissions, duplicate protection, working outbox, receiving/audit, real inference proof, deployed prototype and all six deliverables.

If the model loses to a baseline, report it and use baseline selection according to the PRD. If inference has not succeeded, record an AI blocker; screenshots/replays must not be presented as live inference.

## Session handoff

Update PROJECT_CONTEXT.md with completed work, actual checks/results, decision changes, blockers, next actions and submission risks. Update README when setup, run instructions, demo links or implemented behaviour change. Untested checklist items remain unverified.
