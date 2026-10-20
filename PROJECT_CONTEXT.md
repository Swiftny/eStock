# eStock: project context and handoff

20 October 2026, MYT. Planning summary, not an official organiser document or evidence that features are complete.

## Latest decisions

The user selected **eStock**, a general replenishment assistant for SMEs managing physical stock. This supersedes the earlier brainstorming status that required blank problem/solution fields. Previous customer-order tracking and catering directions are not mandatory parts of this MVP.

**Target problem:** owners manually combine sales, stock spreadsheets and supplier chats to decide when/how much to buy and chase approval. This hypothesis fits the Domain 2 brief; it has not been validated through customer research or field measurements.

**Workflow:** outgoing stock → daily closing/snapshot → demand forecast → quantity recommendation and explanation → manager notification → approval → supplier request → acknowledgement → physical receiving and audit.

| Topic | Decision/status |
| --- | --- |
| Team | TooGoodToBeTrue, four members |
| Domain | 2: Orbyte Smart SME Challenge: Less Busywork, Better Business |
| Domain sponsor | Alpha Red Solutions Sdn Bhd |
| Product | eStock, team proposal; not an official/certified Orbyte module |
| Target | SMEs with physical stock; configurable, not automatically suitable for every business without configuration |
| Input | Synthetic CSV and outgoing-stock/receiving forms |
| AI | Numerical forecasting from sales history; purchasing arithmetic uses rules |
| Recommended fixture | One organisation/location, 3–5 SKUs, one primary supplier per SKU |
| Recommended policy | Per-SKU lead time, 7/30-day cycle, buffer, pack/MOQ and budget |
| Channels | Persistent outbox/simulator required; real WhatsApp if feasible; Telegram if time permits |
| Stack | Not selected; TypeScript/PostgreSQL/Python are proposals |
| Model | Candidate: Chronos-Bolt Small; spike, revision and final selection not completed |
| Accounts/credits | Replit and RunPod status not provided |
| Final assignments | Not allocated |
| Work status | Documentation; no application, inference, deployment or submission |
| Repository language | English, as requested by the user; proper names and technical identifiers retained |

The PRD contains proposed technical defaults, not claims that the user has selected every option. Record material changes here and in the [decision register](docs/product/DECISIONS.md).

## Team

| Name | Reported role/skills | University |
| --- | --- | --- |
| Marco Ryan Suseno | Team leader; frontend | Xiamen University |
| Riakudu Vittorios Surjoraharjos (Vitto) | PRD, frontend, UI/UX | Xiamen University |
| Maximillion Cang (Maxi) | Database | Xiamen University |
| William Christiansen | System design | Xiamen University |

Skills are not final assignments. All four registration emails were provided and are stored in .private/TEAM_DETAILS.md; this file is ignored by Git and excluded from public packages. The leader's phone number has not been provided. Check identities and university spelling against the portal. Registration contacts are not demo operational data.

## Repository and existing work

- Actual folder: /Users/riakuduvittorios/Code/SDC-Hackathon.
- Remote: git@github.com:Swiftny/sdc2026-TooGoodToBeTrue-domain2.git.
- [GitHub](https://github.com/Swiftny/sdc2026-TooGoodToBeTrue-domain2).
- SSH was previously verified as Swiftny.
- Local setup commit 81dc491 and remote initial commit 79541d5 originated in separate histories; they were merged without resets or history rewrites. The initial README and Apache LICENSE were preserved during setup.
- Last inspected branch: main, tracking origin/main. Always check current status/remotes rather than treating this note as live state.
- Keep one primary README; do not create a duplicate README_DRAFT.
- Preserve the Apache LICENSE, history and other members' changes.

## Documents and reading order

1. [AGENTS.md](AGENTS.md): working instructions and authorisation limits.
2. This context.
3. [Full PRD](docs/product/prd.md): workflow, stock rules, model, contracts, scope and acceptance.
4. [DECISIONS.md](docs/product/DECISIONS.md): user decisions, defaults and open facts.
5. [COMPLIANCE_MATRIX.md](docs/COMPLIANCE_MATRIX.md): rules, sources, conflicts and final-round requirements.
6. [BUILD_PLAN.md](docs/plans/BUILD_PLAN.md): work sequence and Tuesday–Saturday schedule.
7. [SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md): six deliverables and final gate.
8. [PITCH_AND_DEMO.md](docs/submission/PITCH_AND_DEMO.md): deck, video, demo and rehearsal.
9. [PROPOSAL_DRAFT.md](docs/submission/PROPOSAL_DRAFT.md) and [TECH_DECLARATION_DRAFT.md](docs/submission/TECH_DECLARATION_DRAFT.md): source text, not official PDFs or signatures.
10. [AI_HANDOFF.md](docs/AI_HANDOFF.md): starting prompt and update discipline.

## Rules with the greatest effect on the work

- Only team-created synthetic operational/evaluation data. No live Orbyte API, sandbox or dataset is supplied.
- Complete one workflow with connected information, logic, human approval, outcome and activity log.
- Add a distinct SME capability; avoid rebuilding Orbyte HR/admin or an entire ERP.
- On-hand increases when usable goods are received, not when an order is approved. Unconfirmed POs do not resolve shortages, but still prevent duplicate purchasing.
- Distinguish forecasts, baselines, fallback, cache and simulation. Do not call multiplication AI or claim real savings from synthetic data.
- Replit is mandatory; the eStock plan also requires actual GPU inference on RunPod and proof in the declaration. Activation/credits have not been verified.
- Keep the repository private during development, make it public for submission as required, and add committee access using official usernames.
- Keep the root Apache 2.0 licence, respect third-party licences and create genuine development commits. Do not fabricate history.
- Declare AI development tools, models, APIs, datasets, cloud and sponsor resources. All members must review/adapt the work and understand it.
- Significant materials predating the event may require organiser approval in addition to declaration; record applicability and references.
- No real payments, statutory filing or legal/financial advice.
- UI work must use both ui-ux-pro-max and antislop in during mode; apply these requirements when UI work begins.
- All repository documents must be written in English. This language decision does not select a visual direction or authorise application implementation.

## Deadline, workshops and review limits

PH §6.3.1 and orientation: **25 October 2026, 07:59:59 AM MYT**. Website and FAQ read on 20 October: **25 October 2026, 11:59 PM MYT**. No written amendment resolving the conflict was found. Use the earlier deadline; internal target: **Saturday, 24 October, 20:00 MYT**. Freeze judged source, live build and materials after the applicable deadline unless officially authorised.

The proposal template asks for a checklist confirming all members completed GenAI, Database and Cloud Deployment workshops. TC uses general wording that workshops may be attended. Verify the specific obligations, tasks and whether recordings are accepted; do not mark them complete or ignore them without facts. Online reveal attendance and Discord participation also require verification.

Written sources, templates, orientation and the Orbyte introduction were read; the sample ZIP README/structure were inspected without running its code. No claim is made that video recordings were watched. Private Discord announcements and logged-in portal forms were not checked. Source review does not replace the team's final verification.

## Six preliminary deliverables

1. Official-template proposal PDF: SDC2026_TooGoodToBeTrue_Preliminary.pdf.
2. Presentation deck; the team plans PPTX with a backup PDF.
3. Accessible working prototype with instructions.
4. Technical & Tools Declaration PDF: SDC2026_TooGoodToBeTrue_TechDeclaration.pdf, including proof.
5. Public GitHub repository with source, LICENSE, required access and appropriate history.
6. YouTube pitch/demo video, **5–7 minutes**; recommended target: six minutes.

The documents created so far are **guides and drafts**, not those six finished deliverables. No official ten-slide preliminary limit has been verified; the ten-slide outline is a suggestion. Final-round rules are recorded separately in the compliance matrix.

## Current handoff

**Completed:** PRD planning, conceptual contracts, stock/review/approval rules, model/evaluation plan, rule matrix, checklist, official-template drafts, deck/video guide, timeline and team identities. The repository documents, including the ignored private registration notes, have now been translated into English. Existing English template passages, names, contacts, paths, technical identifiers and source links were retained.

**M0 review:** the user requested technical agreement before scaffolding. A recommendation was presented for Next.js/TypeScript on Replit, PostgreSQL with Drizzle, and a Python forecast worker on RunPod, with a persistent supplier simulator. These remain proposals, not approved stack decisions. No application implementation is authorised by the translation request.

**Not completed:** framework approval, account/credit verification, final assignments, implementation, model spike, application tests, measurements, deployment, final PPT/PDF/video, leader phone number, attendance/workshops, signatures and submission.

**AI used so far:** Codex read context, PRD references and competition sources; assisted with requirements/product review, PRD writing, templates, checklist, handoff, M0 technical recommendations and English translation. The team must adapt and review this work before signing. No runtime model usage is claimed.

**Verification for the translation:** see DOCUMENT_STATUS.md for the checks actually run and their results. Application tests are not applicable because no application exists.

**Next actions:** agree on M0 technical choices, verify platform access, allocate owners/reviewers and supply visual direction before scaffolding/UI. Do not treat this document as automatic permission for coding, paid services, supplier messages, commits/pushes or publication.

At the next handoff, replace status with actual completed work and verification. Do not copy a planned “complete” status as if it were achieved.

## Sources

Full references and section numbers are in [COMPLIANCE_MATRIX.md](docs/COMPLIANCE_MATRIX.md) and PRD §0.

- [Main Drive](https://drive.google.com/drive/folders/1xw7c2aN8N-at8hPEULzkcU76e_FFb0Ef)
- [Domain 2](https://drive.google.com/file/d/11wqbeO-HYep-DJPQ-LPZnrZfQvCgr5BU/view)
- [Participant Handbook](https://drive.google.com/file/d/1fGBS-jevDj_FrF8wsbYNPzyU5TTrfk1V/view)
- [Terms & Conditions](https://drive.google.com/file/d/1tZOLKK-fA7Uh3zu1otdL6Z-oC_FKMtyl/view)
- [Portal](https://sdchack.my/) and [FAQ](https://sdchack.my/faq)
