# eStock: complete submission checklist

20 October 2026 | TooGoodToBeTrue | Domain 2 | All boxes remain unverified unless supported by actual evidence.

**Internal target:** Saturday, 24 October 2026, 20:00 MYT. PH/orientation set 25 October, 07:59:59 AM; website/FAQ say 11:59 PM. Use the earlier deadline until official clarification. See COMPLIANCE_MATRIX.md for sources and all conflicts.

The internal PRD is product/prd.md. Internal files do not replace official PDF templates. Names other than the two official PDFs below are team conventions, not claimed organiser filename restrictions.

## 1. Six preliminary deliverables

| No. | Artifact | Required file/URL | Complete when |
| --- | --- | --- | --- |
| 1 | Official-template proposal PDF | submission/SDC2026_TooGoodToBeTrue_Preliminary.pdf | All fields complete, word limits correct, signed/dated |
| 2 | Pitch deck | submission/eStock_Pitch_Deck.pptx; additional preview PDF | Opens correctly; problem/solution/technical/impact content matches video |
| 3 | Working prototype | Live Replit/deployment URL and access guide | Tested in a fresh session; core journey and UI work |
| 4 | Technical & Tools Declaration | submission/SDC2026_TooGoodToBeTrue_TechDeclaration.pdf | All actual resources/proof included; signed/dated |
| 5 | GitHub source | Correct public repository URL | Source matches demo; Apache LICENSE; committee access |
| 6 | Pitch/demo video | YouTube URL; optional local master submission/eStock_Pitch_Demo.mp4 | 5–7 minutes, accessible, shows prototype |

No explicit preliminary deck extension requirement was found in reviewed sources. The team chooses PPTX for editing/opening and a backup PDF. No official ten-slide cap is verified; the pitch guide's ten-slide outline is a team recommendation.

## 2. Official proposal

- [ ] Use the [PT template](https://drive.google.com/file/d/1jNjuMJfhMYjo3qQw_PmmeGM-INEwuleo/view), not just an export of the long PRD.
- [ ] Team, Domain 2, SDG 8, eStock, leader, contact, university, four members.
- [ ] Problem Context ≤250 words.
- [ ] Proposed AI Solution ≤300 words.
- [ ] Conceptual Tech Stack: framework/API/DB/cloud, block diagram, sponsor usage.
- [ ] Design-Thinking/Deployment ≤200 words.
- [ ] Exact SDG subtargets 8.2/8.3.
- [ ] Numeric baseline, core KPI, percentage Phase 2 target; distinguish assumptions from results.
- [ ] GenAI/Database/Cloud checklist for all members completed truthfully; source conflict clarified.
- [ ] Prior-owned/pre-existing work yes/no with explanation if needed.
- [ ] For significant pre-event assets, record applicability of OH §8.2.1 organiser approval, status and written reference/date if required. Clarify uncertainty before marking complete; distinguish ordinary supporting libraries.
- [ ] Third-party code/data/models and licences.
- [ ] Employment/internship IP conflicts yes/no using each member's facts.
- [ ] All members review/adapt the narrative and can explain it.
- [ ] Actual leader signature and date.
- [ ] Export one PDF with the official name; open it to check clipping, fonts and page breaks.

Source draft: submission/PROPOSAL_DRAFT.md relative to docs/. This is not yet an official PDF or signed document.

## 3. Technical & Tools Declaration

- [ ] Use the [TD template](https://drive.google.com/file/d/1LBXfXrFblX-dHanSP8jhUOMGfGGxY2ew/view).
- [ ] Team/leader/contact/university/live URL/repository URL.
- [ ] Architecture ≤200 words.
- [ ] Languages/frameworks/libraries: names, actual versions, purpose, licences.
- [ ] External APIs: provider/purpose/free-paid-sponsor tier; no keys.
- [ ] Hosting/storage/DB/auth/compute: provider, actual plan and region.
- [ ] Runtime model: ID, pinned revision, pretrained/fine-tuned/trained, source and terms.
- [ ] Dataset: generator/version/seed/synthetic/no personal records, source/licence.
- [ ] AI-assisted development: actual Codex/model/tool, purpose and extent.
- [ ] Team review/testing explanation ≤100 words.
- [ ] Sponsor resources: Replit/RunPod credit/platform and mentoring if actually used.
- [ ] Essential/replaceable explanation ≤100 words.
- [ ] Privacy/data handling ≤150 words.
- [ ] Risks/limitations ≤150 words.
- [ ] Licence/security/access/declaration checklist completed truthfully.
- [ ] Non-applicable categories marked No/None; unknowns are not disguised as None.
- [ ] Replit/RunPod proof included in this PDF.
- [ ] Leader signature and date.
- [ ] Correctly named PDF exported and inspected.

Source draft: docs/submission/TECH_DECLARATION_DRAFT.md. Do not declare planned resources as already used.

## 4. Replit and RunPod proof

- [ ] Replit actually forms part of the solution in the team's account/project.
- [ ] Include at least one PH §10.6 proof: live URL, project history link or credit-finished proof; exhausting credit is not required.
- [ ] Model actually performs inference on RunPod; merely storing code/model is insufficient.
- [ ] Own-account dashboard shows Pod ID, GPU type and runtime.
- [ ] For serverless, endpoint URL replaces Pod ID; clarify GPU/runtime/equivalent evidence if the display differs.
- [ ] Actual model request/result, revision, data hash and timestamp stored as supporting evidence.
- [ ] Redact API keys/payment details/tokens. Do not fabricate screenshots.
- [ ] Include proof in TechDecl; additional standalone PDFs may follow the sample if chosen.

Recommended team paths:

    submission/REPLIT PROOF OF USE.pdf
    submission/RUNPOD PROOF OF USE.pdf
    submission/evidence/forecast-evaluation.csv
    submission/evidence/forecast-evaluation.md
    submission/evidence/acceptance-results.md
    submission/evidence/demo-access-check.md

These files have not been created by the PRD work. Actual evidence can only be produced after implementation/testing.

## 5. Prototype and data

- [ ] Operational/evaluation dataset is team-created synthetic data, clearly labelled.
- [ ] CSV and outgoing-stock/receiving forms.
- [ ] Consistent stock ledger, canonical sales, daily cutoff and units.
- [ ] Inference/model source/fallback visible.
- [ ] Quantity accounts for lead time, cycle, buffer and dated inbound.
- [ ] Pending unconfirmed POs prevent duplicate purchasing.
- [ ] Manager notification and approval.
- [ ] Staff cannot approve by calling the endpoint directly.
- [ ] Stale/duplicate approvals handled.
- [ ] Clear outbox/PO outcomes; do not claim a mock channel is real WhatsApp.
- [ ] Supplier acknowledgement differs from message delivery.
- [ ] Working partial/full receiving and audit.
- [ ] Demonstrable errors/missing data/late inbound/rejection/fallback.
- [ ] No real payments/statutory filing/advice.
- [ ] No dependency on live Orbyte APIs; all mock contracts labelled.
- [ ] Deployment/database persist after restart/redeploy.
- [ ] Access guide/demo reset usable by judges without developer login.

## 6. GitHub and repository

- [ ] Correct repository, created after 19 October, 20:00 MYT per TC/ORI.
- [ ] Genuine history and meaningful development commits; no backdating/force rewrite/sample .git.
- [ ] Root Apache 2.0 LICENSE preserved; upstream notices available.
- [ ] README includes problem, solution, team/domain/SDG, implemented features, setup, model, demo, limitations and all links.
- [ ] .env.example contains placeholders only; .gitignore excludes secrets/cache/private contacts.
- [ ] No credentials in source, history, logs, screenshots or video.
- [ ] Committee usernames taken from official instructions and given access before deadline.
- [ ] Private during development; public before submission and accessible during judging.
- [ ] Source/deployment/documents opened incognito.
- [ ] Record judged release commit/tag and deployment snapshot URL.
- [ ] Freeze source, deployment and materials after deadline unless authorised.

## 7. Deck and video

- [ ] Outline/script follow docs/submission/PITCH_AND_DEMO.md.
- [ ] Editable PPTX opens on another machine; backup PDF available.
- [ ] Readable text/screenshots; no fabricated features/figures.
- [ ] Total video 5–7 minutes; six-minute target.
- [ ] Demo shows trigger → connected data → forecast/rules → approval → outcome/log.
- [ ] Show real RunPod inference, simulated channels and synthetic labels.
- [ ] Show one exception and uncertainty limits.
- [ ] Explain benefit/SDG, source/provenance, risk/fallback and Orbyte reuse.
- [ ] Narrative matches prototype, proposal, declaration and README.
- [ ] No API keys/private emails/payment details in the recording.
- [ ] Judges can open YouTube URL; upload/processing complete.
- [ ] Clear audio, readable cursor/window and duration checked after export.
- [ ] Local recording/backup stored; does not replace mandatory prototype link.

## 8. Team readiness and official updates

- [ ] Four members match portal; Marco is leader; phone/contact/university details match.
- [ ] All members joined Discord and checked official announcements.
- [ ] Reveal attendance and workshop checklist verified.
- [ ] All AI/framework/model/data/sponsor/prior-work usage declared.
- [ ] Every member can explain model, baselines, quantity rules, database, approval and mocks.
- [ ] Check domain-specific synthetic-only rule; general templates do not authorise real data.
- [ ] Retain any written clarification of morning vs evening deadline.
- [ ] Check submission/GitHub tutorials and portal fields; file sizes/types comply.
- [ ] No undocumented mystery dependency on prototype/demo accounts.

## 9. Final upload gate

- [ ] All six items final and aligned.
- [ ] Two official PDF names and word counts correct.
- [ ] Check every link/file/video/deck/prototype/proof in a fresh session.
- [ ] Accurate signatures/dates/declarations.
- [ ] Submit through sdchack.my before the internal target.
- [ ] Retain receipt/screenshot/portal confirmation timestamp.
- [ ] Recheck submitted links, not just clipboard values.
- [ ] Record Git commit/deployment version matching the video.
- [ ] Freeze after deadline; changes only under official instruction.

## 10. Owner and final-link tracker

Complete when the team assigns work; names have not been allocated at the PRD stage.

| Item | Owner | Target | Actual status/link |
| --- | --- | --- | --- |
| Official proposal PDF | NOT ALLOCATED | Friday draft; Saturday final | Not created |
| Technical & Tools Declaration and proof | NOT ALLOCATED | Inventory from Tuesday; Saturday final | Not created |
| PPTX and backup PDF | NOT ALLOCATED | Friday draft; final before recording | Not created |
| Prototype and access guide | NOT ALLOCATED | Full workflow Thursday; stable Friday | Not created |
| GitHub, committee access and licence | NOT ALLOCATED | Throughout development; check before submission | Repository exists; submission readiness unverified |
| Video and YouTube | NOT ALLOCATED | Friday rehearsal; Saturday upload | Not created |
| Portal submission/confirmation | NOT ALLOCATED | Saturday, 24 October, 20:00 MYT | Not submitted |
| Workshops/announcements/metadata | NOT ALLOCATED | Check Tuesday and again before submission | Unverified |

For each incomplete checkbox, record owner, blocker and next action. Do not let AI mark a checkbox complete without evidence.
