# Integrated demo · all members

[Team pages](README.md) · [Pitch and video guide](../submission/PITCH_AND_DEMO.md)

## Where the demo runs

The persistent application is `/demo`; `/` is the landing page. Follow the root README to run locally. This page coordinates the demonstration, not another implementation of the workflow.

| Member | Prepare and explain |
| --- | --- |
| Vitto | Navigation, forms, readable purchase review and interface states |
| Maxi | Synthetic fixture, stock balances, CSV history and repeatable data setup |
| William | Permissions, approval transaction, persistent outbox, receiving and audit |
| Marco | Forecast source, model/baseline evaluation, limitations and real inference evidence |

## Rehearsal checklist

- [ ] Begin from a separate fresh local synthetic database using the supported database-path configuration; preserve existing work.
- [ ] Record a sale, close a complete business day and run analysis.
- [ ] Explain the forecast cutoff and visible source. The default local source is a labelled baseline, not neural inference.
- [ ] Review supplier, quantity, costs, packaging, arrival and warnings as manager.
- [ ] Approve once; verify one PO/outbox and unchanged physical stock.
- [ ] Dispatch to the simulator and record a synthetic acknowledgement.
- [ ] Receive partial then remaining usable stock; demonstrate damage handling if relevant.
- [ ] Inspect activity and refresh/restart to check saved state.
- [ ] Show that staff cannot perform manager-only operations.
- [ ] Check the approved deployed build and own-account Replit/RunPod evidence when available.
- [ ] Rehearse the 5–7-minute pitch/video using claims supported by actual results.

Use the fixed PRD arithmetic example only as a rules test. Do not promise that real model output will produce the landing fixture's 60 units. Do not send real supplier messages during rehearsal. Record blockers and actual results before calling the demo ready.

## Parallel work boundary

Read [integration rules](integration.md). For code changes, select the `demo` area and run `python3 scripts/check_scope.py demo` before handoff. Shared files require a separate coordinated task. Demo rehearsal is shared; only one active task edits the demo interface at a time.
