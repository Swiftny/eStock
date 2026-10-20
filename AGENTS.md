# SDC Hackathon 2026 — repository guidance

Read `PROJECT_CONTEXT.md` and `docs/SUBMISSION_CHECKLIST.md` before project work. These files carry the handoff from the team's planning conversation.

## Current state

- Four-person team TooGoodToBeTrue; Domain 2, Orbyte Smart SME Challenge.
- The user has now selected **eStock**: a configurable replenishment assistant for SMEs managing physical inventory. This supersedes the earlier instruction to leave product fields blank.
- Read docs/product/prd.md and docs/product/DECISIONS.md after PROJECT_CONTEXT.md. Review docs/COMPLIANCE_MATRIX.md, docs/plans/BUILD_PLAN.md and docs/SUBMISSION_CHECKLIST.md before relevant work.
- Approved input: team-created synthetic CSV plus outgoing-stock and receiving forms. Workflow: movement → daily analysis/forecast → recommendation → manager approval → supplier outbox/PO → acknowledgement → receiving/audit.
- Core demo requires a persistent simulated outbox. Real WhatsApp is preferred if feasible; Telegram is optional. Label each integration honestly.
- Frameworks, active platform credits, final work assignments and visual direction remain open. Proposed technical defaults in the PRD are recommendations.
- This request authorises documentation and project handoff. **Do not build an application, purchase services, send real messages, commit or push solely because this PRD exists.** Follow subsequent user instructions for implementation or publishing.
- Names/university are recorded in the context; registration contacts live in ignored .private/TEAM_DETAILS.md. Keep personal contacts outside synthetic demo data and public source.

## Working approach

- Write all repository documentation and new explanatory text in English. Preserve proper names, contact values, URLs, file paths and technical identifiers. This language requirement does not authorise application scaffolding; agree on M0 technical choices first.
- Build one complete SME workflow: trigger → connected information → decision → human approval → visible outcome and activity log.
- Use synthetic data only. Mock Orbyte interfaces and permissions are allowed. Live Orbyte access is not provided.
- Prefer a small working workflow, clear explanations and tools the team can understand. Use AI where it has a specific purpose; keep arithmetic and validation reliable.
- Preserve existing files, licence, Git history and user changes. Inspect Git status and remotes before editing; do not reset or replace an existing project.
- GitHub SSH authentication is verified as Swiftny. The initial remote README/LICENSE and local setup history have been merged without rewriting either history. Check branch, remote and working-tree status before changes, preserve the initial files, and use normal pushes.
- Keep keys and credentials out of source files and commits. Use environment secrets and a placeholder `.env.example` if configuration becomes necessary.
- Update the tools declaration as resources are used. The team must review, understand and be able to explain AI-assisted work.
- Run checks appropriate to each implementation change and describe what actually passed. Label mock integrations, estimates and synthetic test results clearly.
- Keep task updates concise and understandable to a beginner. Record material project decisions in `PROJECT_CONTEXT.md`.
- At the start of a new session, read the current handoff and inspect saved files/Git status. At a meaningful handoff, update completed work, actual verification, blockers and next actions in the context; update the README when setup, demo links or implemented behaviour change.
- Distinguish official requirements, team decisions and recommendations. Retain source links for requirements, and keep document conflicts unresolved until authoritative clarification is available.

## Competition constraints

- Replit must be used with own-project evidence. The eStock plan requires real numerical forecast inference on RunPod with own-account evidence; merely writing a worker or taking a dashboard screenshot is insufficient. Record the handbook/sample conditionality in the compliance matrix.
- The repository requires an Apache 2.0 `LICENSE` file. Keep it private while building, add designated committee collaborators before submission, and make it public by submission for judging.
- Maintain meaningful commits throughout development. No post-deadline fixes or commits unless the organisers authorise them.
- Deadline conflict: Participant Handbook/orientation say **25 October 2026, 07:59:59 AM MYT**; website/FAQ say **11:59 PM MYT**. Use the earlier deadline pending authoritative written clarification. Internal target: **24 October, 20:00 MYT**. Freeze the judged repository and live build after the applicable deadline.
- Current official announcements and Terms & Conditions take precedence over this planning summary. Consult the linked sources if requirements change.

<!-- antislop:start -->
## Required skills for UI work

- Use both `ui-ux-pro-max` and `antislop` throughout UI planning, implementation, changes and review for this project.
- Read their `SKILL.md` instructions before UI work. Current locations: `~/.agents/skills/ui-ux-pro-max/SKILL.md` and `~/.agents/skills/antislop/SKILL.md`. If these paths change, resolve the skills from the current session's skill catalog.
- The project's selected `antislop` mode is **during**: apply its rules while working, rather than waiting for a final audit. Do not ask the team to select the mode again unless they request a change. An explicit later user instruction takes precedence.
- Use `ui-ux-pro-max` for contextual design and UX guidance, accessibility, responsive layout and implementation guidance for the chosen stack. Use `antislop` as the quality filter for visual decisions, content and working interactions; run its Delivery Gate and report evidence before delivering UI.
- Follow the team's chosen product and design direction. This skill requirement does not select a product, visual style or technology stack, or authorise application implementation before the team supplies a concrete direction.
<!-- antislop:end -->
