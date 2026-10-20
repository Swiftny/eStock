# eStock: decisions and unavailable information

20 October 2026. This document separates user decisions, technical recommendations and facts to supply. No application has been built.

## User decisions

| ID | Decision | Basis |
| --- | --- | --- |
| U-01 | Working name: eStock | The user proposed eStock following the Orbyte module naming pattern |
| U-02 | General product for SMEs managing stock | User response: general, not limited to one sector |
| U-03 | Outgoing-stock movement → demand → recommendation → manager approval → supplier request → receiving | User's product explanation |
| U-04 | AI estimates per-product demand from sales history | User's weekly/monthly planning explanation |
| U-05 | Synthetic CSV and outgoing-stock/receiving forms | Explicit user response |
| U-06 | Prefer WhatsApp if feasible; Telegram if time permits | Explicit user response; completing both channels is not required |
| U-07 | Marco Ryan Suseno is leader; four members listed below | Full names and university supplied by the user |
| U-08 | Final assignments remain open | The user asked that reported skills not become final assignments |
| U-09 | Documentation first; technical agreement before scaffolding | Original documentation scope, reaffirmed by the user's M0 request; application implementation and service purchases are not authorised by the documentation |
| U-10 | All repository documents must be in English | User instruction on 20 October 2026; preserve meaning, names, contact values, identifiers and links |
| U-11 | Use both ui-ux-pro-max and antislop for UI/UX work; antislop mode is during | Existing AGENTS.md rule, reaffirmed by the user on 20 October 2026 |

Language decision record: U-10 was made by the user on 20 October 2026 to make all files readable in English. It changes documentation language, not product scope. The Markdown documents, including ignored private notes, were translated; AGENTS.md, PROJECT_CONTEXT.md, README and this register record the requirement. U-11 reaffirms the existing UI rule without selecting a visual direction or authorising UI implementation.

## Reported skills, not assignments

| Member | Reported skills/contributions |
| --- | --- |
| Marco Ryan Suseno | Team leader; frontend |
| Riakudu Vittorios Surjoraharjos (Vitto) | PRD, frontend, UI/UX |
| William Christiansen | System design |
| Maximillion Cang (Maxi) | Database |

All members must understand the complete solution and be able to explain the core feature.

All four members reported Xiamen University. Registration emails are stored in .private/TEAM_DETAILS.md at the root and excluded from source and public packages. The leader's phone number has not been provided. Check names and university spelling against the portal without changing membership or guessing identities.

## Recommended defaults for the team to decide

| ID | Recommendation | Reason / when to review |
| --- | --- | --- |
| R-01 | One demo organisation/location, 3–5 SKUs | Small fixture; product remains configurable |
| R-02 | Lead time 1–14 days, 7/30-day cycle, absolute buffer | Bounds the model/horizon contract while retaining the core cases |
| R-03 | Pretrained Chronos-Bolt Small on RunPod | Small candidate with an open licence; validate during the spike before pinning a revision |
| R-04 | 28-day mean and 7-day seasonal-naive baselines | Explainable comparisons; avoid unsupported AI claims |
| R-05 | 168 synthetic history days per SKU, fixed seed | Several weeks of patterns and time-ordered testing, not real market data |
| R-06 | One primary supplier per SKU | Defer supplier selection and negotiation |
| R-07 | Persistent outbox/simulator is MUST | Core journey does not depend on activating an external messaging platform |
| R-08 | WhatsApp SHOULD, Telegram COULD | Follows the user's channel preference without compromising submission |
| R-09 | TypeScript web/server + PostgreSQL + Python worker | Proposed simple architecture; not a stack already selected by the team |
| R-10 | English repository documentation and proposed English UI/pitch | Documentation language is now a user decision under U-10; UI/pitch language remains subject to team agreement and any official requirements |
| R-11 | Internal submission target: 24 October, 20:00 MYT | Buffer before the earlier PH/ORI deadline |
| R-12 | Phase 2 target: 50% reduction from an assumed 10 minutes per case | Planning figures to replace or label honestly after measurement |

The M0 discussion additionally proposed Next.js App Router, Drizzle migrations and a RunPod serverless queue. These details remain unapproved recommendations. Do not mark OPEN-01 or platform choices closed until the team agrees and relevant access is verified.

## Team input needed before related implementation

| ID | Information / decision | Status and action |
| --- | --- | --- |
| OPEN-01 | Application framework/language | User/team to confirm; do not create two parallel stacks |
| OPEN-02 | Replit Core/project/credit active? | Not provided; check the team portal |
| OPEN-03 | RunPod account/credit/region/GPU/endpoint | Not provided; verify access and quota before the spike |
| OPEN-04 | Model/revision/dependency versions | Pin from a successful spike, not guessed versions |
| OPEN-05 | WhatsApp business account, number, template and permission ready? | Not provided; timebox and use the simulator if unavailable |
| OPEN-06 | Telegram bot/destination conversation | Optional; must not become a core dependency |
| OPEN-07 | Workstream owners and actual availability | Not allocated; select at kickoff |
| OPEN-08 | UI visual/brand direction | PRD specifies interactions; agree final visual direction before UI build |

## Facts needed before submission

| ID | Fact | How to close |
| --- | --- | --- |
| SUB-01 | Leader contact for official templates | Name, email and Xiamen University provided; use the private file. Phone not provided; leader to complete |
| SUB-02 | Member/university/GitHub details match the portal | Four names/emails/university provided; verify portal/GitHub without changing membership |
| SUB-03 | All members joined Discord and attended the reveal | Team verification |
| SUB-04 | GenAI, Database and Cloud Deployment workshops | Template asks for every member's checklist; complete honestly and clarify accepted tasks/recordings |
| SUB-05 | Authoritative final deadline | PH/ORI morning vs website evening conflict; retain latest official written instruction |
| SUB-06 | Committee GitHub usernames | Obtain from official portal/Discord, do not guess |
| SUB-07 | Prototype, Replit, public repo, deck and YouTube links | Populate from actual artifacts and test in a fresh session |
| SUB-08 | Actual RunPod/Replit proof | Capture own dashboard/project and redact secrets |
| SUB-09 | Tests/evaluation/task timing | Record actual results with N, seed, cutoff and limitations |
| SUB-10 | All actual dependencies/APIs/models/datasets/AI tools | Match lockfiles, environment and usage |
| SUB-11 | Prior work, third-party licences, employment IP | Answer yes/no using each member's facts |
| SUB-12 | Leader signature and date | Leader signs after reviewing all content |
| SUB-13 | Official announcements and portal upload limits | Human check before upload; not fully accessible during the audit |

## Change rules

Record each new decision's date, decision maker, reason, scope impact and updated documents.

Do not use None for unknown facts. None is appropriate only when a category does not apply; unavailable information must remain clearly marked for completion before final signed submission.

The PRD can serve as a product baseline while links/results/signatures are produced later. Document completeness is not evidence of implemented features.
