# eStock

A replenishment assistant for SMEs: connect sales and stock records, estimate demand, and turn manager approval into a recorded supplier request.

**TooGoodToBeTrue — SDC Hackathon 2026, Domain 2: Orbyte Smart SME Challenge.**

**Status, 21 October 2026:** the first landing page is implemented and verified locally. It includes a clearly labelled, interactive synthetic recommendation and manager-review demo. The inventory application, real model inference, integrations, deployment and submission remain planned. eStock is the team's proposal for the Orbyte ecosystem, not an official module or an integration already approved by the sponsor.

## Implemented landing page

- Original light eStock presentation, informed by a review of the actual Attio site.
- Working navigation, six-stage workflow, four feature previews and a human-control section.
- Synthetic reorder, insufficient-history, unavailable-analysis and no-restock scenarios.
- Local approval, quantity edits with notes, rejection, validation and an activity record.
- Responsive layouts, keyboard navigation, visible focus and reduced-motion support.

Approvals exist only in browser memory. They do not create a purchase or send a message. Refresh or **Reset demo** clears the decision; available stock stays at 45 units. The 60-unit example is fixed PRD arithmetic, not a real AI forecast.

## Selected product workflow

Synthetic CSV/outgoing-stock form → daily snapshot → forecast and rules → quantity recommendation → manager notification → approve/reject → supplier outbox/PO → supplier confirmation → receiving and activity log.

The product is configurable for SMEs managing physical stock. Recommended MVP fixture: one organisation/location, 3–5 SKUs and one primary supplier per SKU.

- Input: team-created synthetic data and entry forms.
- AI: demand forecasting from sales history, compared against baselines.
- Rules: lead time, 7/30-day cycle, buffer, incoming stock, pack/MOQ and budget.
- Controls: manager approval, version validation and duplicate protection.
- Channels: mandatory outbox/simulator; real WhatsApp if feasible; Telegram if time permits.
- Proposed platforms: application on Replit and real forecast inference on RunPod. Accounts/credits have not been verified.
- The approved frontend uses Next.js App Router, TypeScript and plain CSS. Database, model revision, provider access and final assignments remain open.
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

## Run locally

Requires Node.js 22 or newer and npm. Verified with Node.js **24.16.0** and npm **11.13.0**. No credentials, environment file, database or external service is required for this stage.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The server binds to `0.0.0.0`, suitable for a later Replit preview; Replit hosting has not been tested yet.

For a production build, stop the development server first:

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

Both server commands accept another port, for example `npm run dev -- --port 3001`. The default development and production commands were run locally on port 3000. The lockfile was reinstalled successfully with `npm ci --offline --cache /private/tmp/estock-npm-cache` using the installation cache.

### Try the preview

1. Use **See how it works** and the header links to visit the page sections.
2. Change **Example scenario** to inspect data-needed, error and no-purchase states. Return to **Reorder due**.
3. Open **Review recommendation**, **Try the preview** or **Try a manager review**. Global launch buttons select the working **Reorder due** example before review.
4. Approve 60 units, or change to 72 and add a note. Invalid pack quantities and missing required notes show inline errors.
5. Reset, then reject with a reason. Inspect the local activity record and unchanged stock.
6. Close with the button or Escape. Refresh to clear the simulation.

Verification and the antislop Delivery Gate: [landing-page report](docs/verification/LANDING_PAGE.md). Design reasons: [DESIGN.md](DESIGN.md).

## Next application milestone

Pause for the user's landing-page review. After further authorisation, finish the remaining **M0** data/API, database, platform-access and owner decisions, then begin **M1: model and ledger spike** in [BUILD_PLAN.md](docs/plans/BUILD_PLAN.md). That milestone requires a correct one-SKU stock balance and actual RunPod inference with account evidence. The landing page does not complete M0, M1 or the full PRD acceptance suite.

## Results and evidence

| Item | Status |
| --- | --- |
| Time to prepare a replenishment decision | Planning assumption: 10 minutes; not measured |
| Phase 2 target | Proposed 50% reduction; not achieved/verified |
| Model vs baselines | Method planned; no results yet |
| Replit/RunPod | No runtime usage evidence yet |
| Landing-page checks | Clean install, lint, typecheck, production build, arithmetic and browser interaction checks passed; see the verification report |
| Full application acceptance | Not run; backend workflow is not implemented |

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

Project source uses the [Apache License 2.0](LICENSE). Third-party models, datasets, libraries, assets and materials retain their own licences and must be declared. See [third-party notices](THIRD_PARTY_NOTICES.md), including the bundled Manrope font licence.
