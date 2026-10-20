# SDC Hackathon 2026 — project context

Handoff prepared on 20 October 2026, Malaysia time. This is a planning summary of the sources and conversation, not a new official competition document.

## Team and repository

- Team: TooGoodToBeTrue, four members.
- Domain: **2 — Orbyte Smart SME Challenge: Less Busywork, Better Business**.
- Domain sponsor: Alpha Red Solutions Sdn Bhd.
- User-supplied GitHub remote: `git@github.com:Swiftny/sdc2026-TooGoodToBeTrue-domain2.git`.
- Intended local project folder: `/Users/riakuduvittorios/Code/SDC-Hackathon`.
- The user created the GitHub repository with README enabled, private visibility and Apache License 2.0 selected. Verify the resulting files and remote when cloning; preserve them.

### Local setup status

GitHub SSH authentication was verified on 20 October 2026 as `Swiftny`, and `origin/main` was fetched. Local setup commit `81dc491` and GitHub initial commit `79541d5` started as separate histories, which caused the first fast-forward-only pull to fail. Both histories have now been joined by a merge without rewriting or discarding either commit. The remote `README.md` and Apache 2.0 `LICENSE` were imported unchanged and their content hashes verified against the fetched remote files.

The local branch is `main`, and `origin` is the user-supplied SSH remote. Use normal fetch/push operations and verify the current branch, tracking status and working tree before work. Keep the team's problem and solution fields blank until the team decides.

## What is decided and what remains open

The repository foundation and context handoff are authorised. On 20 October the user explicitly requested leaving the project problem and solution blank until the team decides. Earlier brainstorming is not an implementation direction. No customer demand has been validated in this conversation.

| Project decision | Team's chosen value |
| --- | --- |
| Project / product name | |
| Problem | |
| Solution | |
| Target business / user | |
| Core workflow | |
| MVP features | |
| Out-of-scope features | |
| Technology stack | |
| AI's specific role | |
| Baseline / KPI / target | |
| Team member assignments | |

These blank cells are intentional. Keep them empty until the team provides a decision. Continue discovery or repository administration without selecting a product on the team's behalf.

## Current handoff

- Latest review (20 October 2026): GitHub authentication and the initial history merge are complete. Consolidated the temporary README draft into the main README and removed the duplicate file. Confirmed product sections remain blank and the README links to the context, agent guidance, checklist and licence. No application has been built.
- User direction reconfirmed: keep all undecided product fields blank and do not build an application. Record subsequent team decisions here before implementation.
- AI assistance to carry into the tools declaration: Codex reviewed the handoff and local repository, summarised requirements/setup and updated this context. No application code or product decisions were generated in this review; the team still needs to review the summary.
- Completed: local Git setup, origin configuration, SSH authentication, remote fetch, merge of the local and remote initial histories, README/LICENSE verification, Codex instructions, requirements context and submission checklist. The repository now has one README.md containing the project introduction and blank product sections; the temporary README_DRAFT.md was consolidated and removed.
- Not completed: product selection, application implementation, deployment or submission.
- Next steps: verify teammate repository access and current organiser announcements; agree on the business problem with the team; record that decision and its reason before scaffolding the application. Check Git tracking status when starting work.
- Rule provenance: the Domain 2 requirements and mandatory platform/submission items below come from linked official documents. The internal Saturday deadline, role split and daily milestones are recommendations. Product fields are team decisions.
- At meaningful handoffs, update these bullets with completed work, actual verification, blockers and the next actions. Keep estimates, mock behaviour and synthetic measurements distinct from observed real-world evidence.

## Domain 2 requirements

Target Malaysian micro and small businesses using messages, spreadsheets, paper and manual follow-ups. Add a distinct business capability that could be reused by many SMEs through Orbyte's shared hub. Existing Orbyte HR and administrative features should not be reproduced.

Demonstrate one journey:

**Business trigger → relevant connected data → rules or AI decision → approval by an appropriate person → visible completed outcome and activity log.**

Required qualities include accuracy, consistency, ease of learning, permissions, human control, fit with Orbyte, reuse across SMEs and a measurable business benefit.

- Use only team-created synthetic records; no real personal, customer or company records in the demo.
- Invent and document mock interfaces, data structures and API assumptions. No live Orbyte account, API, dataset, sandbox or production access is supplied.
- Login, user profiles and role-based permissions may be simulated.
- Real payments, statutory submissions and legal/financial advice are out of scope. Preparatory workflows may be simulated.
- Explain privacy handling and PDPA principles for a future deployment without claiming the prototype establishes legal compliance.
- Main SDG: 8, particularly targets 8.2 and 8.3. SDG 10 or 12 may be included when genuinely supported.
- Preliminary weights: innovation 30%, problem–solution fit 25%, build feasibility 25%, proposal clarity 20%.
- A rough working core feature, functional interface and accessible GitHub code are needed; a polished pitch alone is insufficient.

## Work window and milestones

All times below are Malaysia time, UTC+8.

- Official preliminary deadline: **Sunday 25 October 2026, 07:59:59 AM**.
- Recommended internal submission target: **Saturday 24 October, 8 PM**. This is advice, not the official deadline.
- Tuesday 20 October: choose the problem and scope; establish repository, platform access, roles and document outlines.
- Wednesday 21 October: build the principal feature; draft proposal, architecture and declaration in parallel.
- Thursday 22 October: complete and deploy the full workflow, including approvals and log; collect feedback and measure a synthetic baseline/comparison.
- Friday 23 October: stop expanding scope, fix problems, test judge access, finalise documents/slides and rehearse the video.
- Saturday 24 October: record and upload the video, check all six deliverables, submit and retain confirmation.

Suggested role split, subject to team skills: backend/data; interface; problem validation/proposal/testing; deployment/declaration/pitch/submission. All members should understand the full system.

## Six preliminary deliverables

1. Official-template project proposal / Product Requirement Documentation PDF.
2. Pitch slides covering problem, solution, technical approach and impact.
3. Working deployed prototype link or accessible build, with access instructions.
4. Technical & Tools Declaration PDF.
5. GitHub source repository link.
6. **5–7-minute YouTube pitching video with prototype demonstration.**

See `docs/SUBMISSION_CHECKLIST.md` for the fields, evidence and names to prepare.

## Platforms, repository and originality

- Participant Handbook §9.2 requires **Replit**, with own-project proof in the tools declaration (§10.6): use a Replit project/history or live deployment link.
- Participant Handbook §9.3 requires **RunPod for work needing a GPU**. However, the supplied sample repository README labels RunPod use and proof as required generally. Ask the organisers whether non-GPU projects must also use RunPod. Keep this explicitly unresolved.
- If RunPod is used, §10.7 requires own-account evidence showing Pod ID, GPU type and runtime; for serverless, show the endpoint URL instead of Pod ID. Exclude credentials.
- Participant Handbook §10.2 requires an Apache License 2.0 `LICENSE` file and preservation of applicable copyright.
- Repository private during hacking; committee-designated collaborators added before submission; submitted repository public and accessible throughout judging (§6.1 and §10.3).
- Maintain genuine continuous development commits. Do not fabricate or backdate history, and do not import the sample ZIP's `.git` directory.
- Terms §5.5.2 requires repository creation after official commencement, 19 October 2026, 8 PM MYT. The user's new repository was created after release.
- Do not modify the submitted repository after the official deadline unless the organisers instruct otherwise.
- Declare APIs, platforms, tools, AI assistance, models, datasets, sponsor resources and relevant reused materials. Team members must understand and review AI-generated work and own the core problem framing and solution decisions.
- Significant pre-existing work has additional declaration/approval rules. Check the official sources before introducing it.

## Source index and review limits

The following written sources were read during the planning conversation. The sample ZIP's structure and README were inspected. Video transcripts were not retrievable, so no claim is made that the recordings were watched. The workshop recordings folder was empty at the time of inspection. Review current Discord/portal announcements and submission tutorials for changes or portal-specific steps.

- [Main shared Drive folder](https://drive.google.com/drive/folders/1xw7c2aN8N-at8hPEULzkcU76e_FFb0Ef)
- [Domain 2 brief and preliminary rubric](https://drive.google.com/file/d/11wqbeO-HYep-DJPQ-LPZnrZfQvCgr5BU/view)
- [Participant Handbook](https://drive.google.com/file/d/1fGBS-jevDj_FrF8wsbYNPzyU5TTrfk1V/view)
- [Official Handbook](https://drive.google.com/file/d/1vDGxSLufFrE9h6T8-KY1ltxmAgQln23k/view)
- [Terms & Conditions](https://drive.google.com/file/d/1tZOLKK-fA7Uh3zu1otdL6Z-oC_FKMtyl/view)
- [Preliminary proposal template](https://drive.google.com/file/d/1jNjuMJfhMYjo3qQw_PmmeGM-INEwuleo/view)
- [Technical Tools Declaration template](https://drive.google.com/file/d/1LBXfXrFblX-dHanSP8jhUOMGfGGxY2ew/view)
- [Sample GitHub repository ZIP](https://drive.google.com/file/d/1Atfzhuehpr6zYvM0oenDOzXeNymTHow_/view)
- [Tutorial folders](https://drive.google.com/drive/folders/14UtBBtYZktlBhETrG0dvmdfFfwJ9zr8n)
- [Official submission portal](https://sdchack.my)

## Next session

1. Read the local repository instructions, this file and the checklist.
2. Check the repository root, Git status, remote and existing README/LICENSE; preserve all user work.
3. Summarise the known requirements and open decisions briefly.
4. If the user has selected a business problem, record it and propose the smallest full workflow. Otherwise continue problem selection.
5. Choose a stack the team can understand once that workflow is established, and implement incrementally with a deployment path involving Replit.
