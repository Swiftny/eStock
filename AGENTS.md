# SDC Hackathon 2026 — repository guidance

Read `PROJECT_CONTEXT.md` and `docs/SUBMISSION_CHECKLIST.md` before project work. These files carry the handoff from the team's planning conversation.

## Current state

- Four-person team TooGoodToBeTrue; Domain 2, Orbyte Smart SME Challenge.
- The user has now selected **eStock**: a configurable replenishment assistant for SMEs managing physical inventory. This supersedes the earlier instruction to leave product fields blank.
- Read docs/product/prd.md and docs/product/DECISIONS.md after PROJECT_CONTEXT.md. Review docs/COMPLIANCE_MATRIX.md, docs/plans/BUILD_PLAN.md and docs/SUBMISSION_CHECKLIST.md before relevant work.
- Approved input: team-created synthetic CSV plus outgoing-stock and receiving forms. Workflow: movement → daily analysis/forecast → recommendation → manager approval → supplier outbox/PO → acknowledgement → receiving/audit.
- Core demo requires a persistent simulated outbox. Real WhatsApp is preferred if feasible; Telegram is optional. Label each integration honestly.
- The user approved Next.js App Router, TypeScript and plain CSS for the landing page on 21 October, with a light, minimal, professional visual direction and Attio as a reference. The local landing page is implemented. Database/worker choices, active platform credits and final work assignments remain open.
- On 21 October the user subsequently authorised frontend refinement and a persistent local stock-to-receiving workflow, including forecast adapter/RunPod worker, demo server-side permissions and a SIMULATED supplier outbox. This supersedes the earlier landing-only pause. See the current PROJECT_CONTEXT.md handoff and verification report. **Do not purchase services, send real supplier messages, commit, push or publish externally without further instruction.** Real RunPod/Replit configuration and proof remain outstanding.
- Names/university are recorded in the context; registration contacts live in ignored .private/TEAM_DETAILS.md. Keep personal contacts outside synthetic demo data and public source.

## Parallel work boundaries

- Before edits, read `pages/integration.md` and select one area from `scripts/work-scopes.json`: frontend, demo, data, backend, system or ai.
- Edit only that area's paths. Reading other areas is allowed. Report cross-area dependencies instead of silently editing them. Shared-file changes need a separate coordinated integration task with one active editor.
- Frontend landing and persistent demo UI are separate areas. Demo rehearsal is shared, but only one active task edits demo UI code at a time.
- Use a separate clone/worktree for simultaneous AI sessions; switching branches inside a shared working directory does not isolate edits. Keep local databases and secrets separate.
- Do not run repository-wide formatters for a scoped task. Run `python3 scripts/check_scope.py <area>` before handoff; use `--base <integration-ref>` to include branch commits. This checker is opt-in, not GitHub enforcement. Preserve pre-existing out-of-scope changes.
- Integrate shared contracts and dependencies one task at a time, then verify dependent areas. Existing commit/push/publication restrictions remain in effect.

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
## antislop
For UI work, use both `ui-ux-pro-max` and `antislop`. Read their skill instructions before planning, implementation or review. Resolve installed skill locations from the current session's catalog when available.
- Core filter: the installed `antislop@anti-slop` plugin. Verified path: `~/.codex/plugins/cache/anti-slop/antislop/3.2.21/skills/antislop/SKILL.md`. The repository-local `.codex` copy was removed at the user's request; use the installed plugin.
- The project's selected antislop mode is **during**, as explicitly requested by the user. Do not ask the team to select it again unless they request a change. Apply the rules throughout UI work and run the Delivery Gate with actual evidence before delivery.
- `ui-ux-pro-max` is installed at `.agents/skills/ui-ux-pro-max/SKILL.md`, with its search scripts and data alongside it. It is also listed in the current session skill catalog.
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update the installed antislop plugin later: `codex plugin marketplace upgrade anti-slop`.
<!-- antislop:end -->

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
