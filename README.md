# eStock

A replenishment assistant for SMEs: connect sales and stock records, estimate demand, and turn manager approval into a recorded supplier request.

**TooGoodToBeTrue — SDC Hackathon 2026, Domain 2: Orbyte Smart SME Challenge.**

**Status:** documentation and planning. The application, deployment, runtime model, testing and submission have not been completed. eStock is the team's proposal for the Orbyte ecosystem, not an official module or an integration already approved by the sponsor.

## Selected product workflow

Synthetic CSV/outgoing-stock form → daily snapshot → forecast and rules → quantity recommendation → manager notification → approve/reject → supplier outbox/PO → supplier confirmation → receiving and activity log.

The product is configurable for SMEs managing physical stock. Recommended MVP fixture: one organisation/location, 3–5 SKUs and one primary supplier per SKU.

- Input: team-created synthetic data and entry forms.
- AI: demand forecasting from sales history, compared against baselines.
- Rules: lead time, 7/30-day cycle, buffer, incoming stock, pack/MOQ and budget.
- Controls: manager approval, version validation and duplicate protection.
- Channels: mandatory outbox/simulator; real WhatsApp if feasible; Telegram if time permits.
- Proposed platforms: application on Replit and real forecast inference on RunPod. Accounts/credits have not been verified.
- Framework, model revision and final assignments remain undecided.
- All repository documentation must be in English. Future UI work must use both `ui-ux-pro-max` and `antislop` in `during` mode, as specified in AGENTS.md.

## Start here

| Document | Purpose |
| --- | --- |
| [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | Decisions, actual status, team, repository setup and next actions |
| [Full PRD](docs/product/prd.md) | Scope, data, workflow, AI, rules, architecture, API, UX and acceptance |
| [Decision register](docs/product/DECISIONS.md) | User decisions, recommendations and unknown facts |
| [Rules and source conflicts](docs/COMPLIANCE_MATRIX.md) | Official requirements, provenance and verification gaps |
| [Tuesday–Saturday build plan](docs/plans/BUILD_PLAN.md) | Work sequence, workstreams and scope cuts |
| [Submission checklist](docs/SUBMISSION_CHECKLIST.md) | Six deliverables, proof, exports, access and final gate |
| [Deck, pitch and demo guide](docs/submission/PITCH_AND_DEMO.md) | Slide outline, six-minute rundown, recording and upload |
| [Proposal draft](docs/submission/PROPOSAL_DRAFT.md) | Text to transfer into the official PDF template |
| [Tools declaration draft](docs/submission/TECH_DECLARATION_DRAFT.md) | Resources, AI assistance, licences, privacy and proof |
| [AI handoff](docs/AI_HANDOFF.md) / [AGENTS.md](AGENTS.md) | Instructions for future sessions and working rules |

## Team

| Member | Reported skills/contributions | University |
| --- | --- | --- |
| Marco Ryan Suseno | Team leader; frontend | Xiamen University |
| Riakudu Vittorios Surjoraharjos | PRD, frontend, UI/UX | Xiamen University |
| Maximillion Cang | Database | Xiamen University |
| William Christiansen | System design | Xiamen University |

All four members reported Xiamen University. These skills are context, not final assignments. Registration contacts are stored separately from public source.

## Running and testing

There is no application or run command yet. Once the stack is selected and implementation is authorised, add runtime requirements, installation, migration/seed instructions, configuration examples without secrets, run commands, tests and demo instructions. Do not include untested run steps.

## Results and evidence

| Item | Status |
| --- | --- |
| Time to prepare a replenishment decision | Planning assumption: 10 minutes; not measured |
| Phase 2 target | Proposed 50% reduction; not achieved/verified |
| Model vs baselines | Method planned; no results yet |
| Replit/RunPod | No runtime usage evidence yet |
| Application acceptance | Not run |

## Submission links

| Resource | URL/status |
| --- | --- |
| Live prototype and access guide | Not created |
| Replit project/proof | Not provided |
| RunPod proof | Not created |
| Official proposal PDF | Not exported/signed |
| Pitch PPTX / backup PDF | Not created |
| Tools declaration PDF | Not exported/signed |
| YouTube pitch/demo | Not recorded/uploaded |
| GitHub | [Swiftny/sdc2026-TooGoodToBeTrue-domain2](https://github.com/Swiftny/sdc2026-TooGoodToBeTrue-domain2) |

All repository drafts are working materials, not evidence of completed deliverables.

## Timing and main rules

Internal target: **Saturday, 24 October 2026, 20:00 MYT**. The handbook/orientation specify **25 October, 07:59:59 AM**; the website/FAQ specify **11:59 PM**. Use the earlier deadline until official clarification. See the compliance matrix for sources and other conflicts.

Use only synthetic operational data, human approval and audit records. The prototype must work; a deck/video alone is insufficient. Prepare all six deliverables, platform proof and judge access. Do not expose secrets or describe simulation as real messaging/integration.

## Licence

Project source uses the [Apache License 2.0](LICENSE). Third-party models, datasets, libraries, assets and materials retain their own licences and must be declared.
