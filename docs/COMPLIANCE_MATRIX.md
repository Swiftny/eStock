# eStock: rules, sources, evidence and conflicts

Reviewed 23 October 2026 for the document-assisted inventory pivot. Connected Google Drive returned the actual D2, PH, OH, TC, PT, TD and orientation-slide text; the main resources folder was listed. Public homepage/FAQ still show the later deadline. Sample ZIP retrieval returned 404/NOT_FOUND in this update; its prior README review remains historical. No private Discord, logged-in portal or video recording was checked. See [source verification](submission/SOURCE_VERIFICATION_2026_10_23.md). Requirements are not completion claims.

## Sources

- D2: [Domain 2](https://drive.google.com/file/d/11wqbeO-HYep-DJPQ-LPZnrZfQvCgr5BU/view).
- PH: [Participant Handbook](https://drive.google.com/file/d/1fGBS-jevDj_FrF8wsbYNPzyU5TTrfk1V/view).
- OH: [Official Handbook](https://drive.google.com/file/d/1vDGxSLufFrE9h6T8-KY1ltxmAgQln23k/view).
- TC: [Terms & Conditions](https://drive.google.com/file/d/1tZOLKK-fA7Uh3zu1otdL6Z-oC_FKMtyl/view).
- PT: [Proposal template](https://drive.google.com/file/d/1jNjuMJfhMYjo3qQw_PmmeGM-INEwuleo/view).
- TD: [Technical declaration](https://drive.google.com/file/d/1LBXfXrFblX-dHanSP8jhUOMGfGGxY2ew/view).
- ORI: [Orientation slides](https://drive.google.com/file/d/1RkT67i4TMAQ7ON7Ha9L6JOjsne0bgOWq/view).
- OBI: [Orbyte introduction](https://drive.google.com/file/d/1xoQj59NZr6D9rwZ_qkQwZaObKEcoXaoO/view).
- SAMPLE: [Sample ZIP](https://drive.google.com/file/d/1Atfzhuehpr6zYvM0oenDOzXeNymTHow_/view); structure/README were inspected during earlier planning; current connector fetch returned 404/NOT_FOUND. No code run.
- WEB: [Homepage](https://sdchack.my/), [FAQ](https://sdchack.my/faq), [Handbook wrapper](https://sdchack.my/handbook), [Terms wrapper](https://sdchack.my/terms).
- [Main Drive](https://drive.google.com/drive/folders/1xw7c2aN8N-at8hPEULzkcU76e_FFb0Ef).

TC is binding where it conflicts with a handbook. Authoritative official announcements/amendments may change procedures; not every informal message changes TC. Retain the official text and time; do not infer changes from assumptions.

## Preliminary matrix

The evidence column describes what must be produced, not what is complete.

| ID | Requirement | Source | eStock implementation/evidence |
| --- | --- | --- | --- |
| C-01 | Assigned domain locked; at least one SDG | D2; OH §7.1,§7.3.2 | Domain 2, SDG 8.2/8.3 in proposal/deck/video |
| C-02 | One specific real SME problem | D2 §4,§6 | Retyping supplier-document lines and recognising supplier descriptions; problem hypothesis, no invented interviews |
| C-03 | Trigger → data → logic → approval → outcome/log | D2 §3–4 | Upload → extracted lines + catalogue/aliases → matching/validation → Manager confirms actual receipt/approval → Intake + History |
| C-04 | Accuracy, consistency, ease of learning | D2 §4 | Manual base-unit conversion, raw/final fields, uncertainty correction and simple Staff Take/Return; future tests required |
| C-05 | Permissions and human control | D2 §4 | Backend Manager-only setup/upload/drafts/approval/full History; shared Staff Take/Return; actual-receipt confirmation |
| C-06 | Orbyte fit/reuse; distinct additional capability | D2 §4,§6; OBI | Proposed reusable intake/catalogue/permission/approval/activity contracts; no working hub integration |
| C-07 | Do not replicate Orbyte HR/admin | D2 §6 | No payroll/leave/hiring/auth platform |
| C-08 | Only team-created synthetic data | D2 §6–7 | All images, products, suppliers and operational/evaluation records team-created synthetic; authored image fixtures distinct from uploads |
| C-09 | No live Orbyte dataset/API/sandbox supplied | D2 §7 | All API assumptions belong to the team; mocks explicitly labelled |
| C-10 | No real payments/statutory filing/legal-financial advice | D2 §6 | Non-monetary inventory workflow; ignore prices/tax/amounts/payment data, no financial calculations |
| C-11 | Measurable benefit and SDG | D2 §4, PT §4 | Synthetic manual-entry vs reviewed-intake timing/correction rate; assumptions/targets explicitly labelled; no OCR results |
| C-12 | Working prototype, functional UI and pitch | OH §7.4.3; PH §6.3.5 | Active link, working UI, video/deck consistent with source |
| C-13 | All six preliminary deliverables | PH §6.3.5.1–6 | Main checklist and submission folder |
| C-14 | Official proposal template and word limits | PT; PH §6.3.5.1 | Correctly named PDF; 250/300/200 words per field |
| C-15 | Declare all resources; no blank categories | TD | Complete PDF; non-applicable categories marked No/None |
| C-16 | 5–7-minute YouTube pitch/demo video | PH §6.3.5.6; ORI | Six-minute target; duration/link/access checked |
| C-17 | Overtime: 1 point/30 seconds, subject to final rules | PH §6.3.5.6; ORI | Duration margin; do not aim for exactly seven minutes |
| C-18 | Replit must form part of the solution | PH §9.2 | Mandatory part of solution; own project/account role and use must be proven, not optional hosting |
| C-19 | Replit proof in TechDecl | PH §10.6 | Own live URL, project history link or credit-finished proof |
| C-20 | GPU training/fine-tuning/inference on RunPod | PH §9.3 | Conditional GPU rule. Hosted Gemini is the new target; no new GPU/training feature. Historical Chronos-2 RunPod usage remains declared; X-03 open |
| C-21 | RunPod proof in TechDecl | PH §10.7 | Teams that used it: own dashboard Pod ID, GPU type/runtime; endpoint substitutes Pod ID for Serverless. Historical assets exist; final proof completeness to verify |
| C-22 | Respect quotas/resource terms | OH §8.1; TC §5.9 | Usage records; do not assume credits are active/sufficient |
| C-23 | Repository created after official start | TC §5.5.1–5; ORI | New repository after 19 October, 20:00 MYT; genuine history |
| C-24 | Private during build, public for submission | PH §6.1.2,§10.3; ORI | Change visibility before submission and check incognito |
| C-25 | Add committee collaborators | PH §6.1.3–4,§6.3.5.5 | Official usernames and access proof; public visibility does not automatically remove this requirement |
| C-26 | Apache 2.0 LICENSE and upstream attribution | PH §10.2; TC §5.7–8 | Root LICENSE and third-party licence manifest |
| C-27 | Genuine ongoing commits | PH §6.3.5.5; TC §5.5 | Actual development commits; no backdating or sample .git import |
| C-28 | No exposed credentials/payment details | PH §6.1.6–7 | Server secrets; review source/history/logs/video/proof |
| C-29 | Built during event; original core | TC §4.2,§5.1–5.5 | New eStock work; prior material declared; team owns the framing |
| C-30 | Declare supporting/open-source materials; trace applicable prior-work approval | OH §8.2.1; TC §5.4,§5.7–8 | Model/framework/reference/template declaration; for significant pre-event assets, record organiser-approval status and written reference/date if required |
| C-31 | AI assistance allowed; review/adapt/explain required | OH §8.5; TC §5.6 | Declare Codex and other AI; member review, not wholesale unedited output |
| C-32 | Registered members only; mentors do not create deliverables | TC §5.10,§11.6; PH §11 | Four registered members; mentorship is advice only |
| C-33 | One person per team; membership unchanged | TC §2.4,§3.6; OH §4.2 | Names match portal; no outside contributors |
| C-34 | All members join Discord/check announcements | PH FAQ 15.2–4; OH §4.2 | Human team members check announcements/committee instructions |
| C-35 | Mandatory online reveal attendance | PH §6.2.2 | Verify attendance separately from general workshops |
| C-36 | PT workshop checklist for all members | PT §5; see conflict | Truthful GenAI/Database/Cloud status; no automatic ticking |
| C-37 | Complete all fields, leader/signature/date | PT §1,§6–7; TD §1,§7–8 | Leader completes/signs; no AI signature |
| C-38 | Official portal; one official submission | TC §6.1,§6.3; ORI | sdchack.my; retain confirmation |
| C-39 | Complete accessible materials before deadline | TC §6.1.5,§6.4; PH §10.4–5 | Fresh-session file/link checks; portal timestamp |
| C-40 | No late submissions unless valid official instruction | TC §6.4 | Saturday 20:00 internal target; do not rely on an extension |
| C-41 | Freeze judged repository/deployment/materials after deadline | TC §5.5.7,§6.6; PH §6.3 | Lock release/commit; no silent live-app changes |
| C-42 | Claims, proof and metrics must be truthful | TC §6.1.5,§10.3,§11; ORI | Synthetic/mock/live-extraction labels; no false OCR/deployment/time-saving claims; legacy metrics scoped as history |
| C-43 | Third-party privacy/IP and data handling | TC §5.11,§11.7,§12.5 | Synthetic-only competition data; no retained application images or unnecessary monetary/provider dumps; provider retention separately verified before pilot |
| C-44 | Team/upstream rights and organiser showcase | TC §12.1–4 | Do not promise unwritten exclusivity or sponsor ownership |

For significant pre-event assets, record whether organiser approval under OH §8.2.1 applies, its status, and the written approval reference/date if required. If scope is unclear, seek organiser clarification and do not mark it complete merely because it has been declared. Distinguish those assets from ordinary supporting libraries/frameworks, which still need declaration and licence compliance; do not assume every dependency needs special approval. AI output created during the hacking period follows AI-use rules and is not automatically pre-existing work.

## Conflicts and actions

| ID | Conflicting sources | Interim treatment |
| --- | --- | --- |
| X-01 Deadline | PH §6.3.1/ORI: 25 October, 07:59:59 AM. Homepage/FAQ: 25 October, 11:59 PM | Use earlier cutoff, internal 24 October, 20:00; seek authoritative written clarification |
| X-02 Workshops | TC §4.2.3 says activities may be attended; PT §5 asks every member to complete mandatory GenAI/Database/Cloud | Do not call all general workshops mandatory or optional. Clarify specific checklist, tasks and accepted replay; complete using facts |
| X-03 RunPod | PH §9.3 addresses GPU work; sample README says Required generally | Unresolved. New architecture calls hosted Gemini and has no self-hosted GPU work; do not infer an exemption or force GPU features. Seek written clarification. Historical RunPod training/evaluation still requires truthful declaration/proof |
| X-04 Repository creation | PH §6.1.2 says prepare before hacking; TC §5.5.2–3/ORI say create after release | Follow TC/ORI: after start. Do not alter timestamps/history |
| X-05 Data | General template/FAQ/ORI allow certain public/open/self-collected data; D2 specifically allows only team-created synthetic data | Apply D2-specific restriction to eStock operational/evaluation data |
| X-06 Capability | OBI/website describe both platform foundations and direction | Do not assume all capabilities/APIs are available; label mocks |
| X-07 Format | No slide cap, spoken-language rule or upload limits found in reviewed sections | Do not import a ten-slide/five-minute cap from the example PRD; check the portal |
| X-08 Serverless proof | PH §10.7 substitutes endpoint for Pod ID but still mentions GPU/runtime | Capture available evidence and clarify equivalents if fields are absent |
| X-09 Orbyte access | D2 §7 (C-09): no live Orbyte dataset/API/sandbox supplied. A sponsor/mentor said verbally on or before 21 October 2026 that using Orbyte is required, via its [workspace registration](https://orbyte-xyz.alphareds.com/register-workspace) | Preserve historical workspace-alignment decision; registration/account actions need separate authorisation. Obtain written confirmation of the verbal requirement, available access and screenshot use. No live integration/supplied API claimed; document assumptions honestly |

Clarification record format:

    Issue ID:
    Official source/channel:
    Authorised sender:
    Date/time MYT:
    Exact instruction:
    Effect on PRD/submission:
    Verified by registered member:

The AI did not send questions to external parties during this documentation task.

## Materials still requiring human checks

- Latest official Discord: deadline updates, workshop tasks, committee accounts and schedule.
- Logged-in team portal: fields, file formats/sizes, submission replacement rules and credits.
- [Drive Guide video](https://drive.google.com/file/d/1N8NZYmabwHGkOp6aEDjsIGpsa9rvUq3_/view).
- [Video tutorials folder](https://drive.google.com/drive/folders/14UtBBtYZktlBhETrG0dvmdfFfwJ9zr8n).
- [Orientation recording](https://drive.google.com/file/d/1fv1O2BtKhFunS1SmvJs0G0PlcZQiVYkm/view).
- [Alpha Red workshop recording](https://drive.google.com/file/d/18WyFFDA_dXWUFHpIfXygTxfRycYXqjuZ/view).

Orientation slides were re-read on 23 October. Orbyte introduction was read during earlier planning, not reverified here. Recordings were not watched and private Discord was not audited.

## Final-round requirements, not additional preliminary MUST items

| Topic | Source/planning |
| --- | --- |
| Shortlist | PH §6.4: up to 15 teams/domain; announcement 28 October, 20:00 MYT, subject to latest announcements |
| Confirmation | PH §6.4: 29 October, 12:00 MYT for ordinary forms/visitor passes; replacement schedule requires its own notice |
| Upgrade | PH §6.5: 28–30 October for authorised teams |
| Physical event | PH §6.6: 31 October, 09:30 at XMUM; attend as instructed and bring devices/HDMI adapter |
| Final deadline | PH §6.6.4: 1 November, 07:59:59 AM MYT; check latest final-round announcements |
| Final package | Updated PRD with changes/reasons, updated TechDecl, Final Solution Report, backup YouTube video, repository, .pptx, working demo/access |
| Final pitch | PH §6.7: ten-minute pitch and five-minute Q&A, not the preliminary 5–7-minute video |
| Slot schedule | §6.7.1 prose and §7.2 rundown differ; confirm official slot if shortlisted |
| Network | Prepare large models before the physical event; no mass scraping/GB downloads on event network |

Prepare attendance, travel, visitor pass/vehicle 48-hour arrangements, equipment and final logistics if shortlisted; these are not eStock features.

## Active product and historical proof

The English [PRD](product/prd.md) is the active product. PostgreSQL/Gemini and new accounts/permissions/drafts are target requirements, not completed integrations. Existing website/SQLite forecasting/purchasing code and old reports remain unchanged. Historical RunPod run `20261021T110320Z`, metrics/selection/run metadata and screenshots in `submission/evidence/` are retained; they do not verify OCR or a connected Serverless application. The historic team-history generator/provenance gap remains open. Replit deployment, own-project proof and hosted persistence remain unverified. Do not mark readiness complete because documentation drafts exist.

## Completeness statement

This matrix covers material requirements identified from the written sources above. It does not guarantee inaccessible announcements add no requirements. Do not mark the final submission gate complete until humans check official channels and templates are correctly completed.
