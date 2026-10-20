# SDC Hackathon 2026 — repository guidance

Read `PROJECT_CONTEXT.md` and `docs/SUBMISSION_CHECKLIST.md` before project work. These files carry the handoff from the team's planning conversation.

## Current state

- Four-person team, TooGoodToBeTrue; assigned Domain 2, Orbyte Smart SME Challenge.
- The problem, target business and technology stack are still undecided. Discussed examples are candidates, not approved features or validated demand.
- The user has authorised repository setup and context transfer. Application implementation needs a concrete direction from the team; do not treat the WhatsApp order idea as selected.
- The user requested blank problem and solution fields. Leave all undecided product fields blank until the team supplies its choice; do not fill them from earlier brainstorms.

## Working approach

- Build one complete SME workflow: trigger → connected information → decision → human approval → visible outcome and activity log.
- Use synthetic data only. Mock Orbyte interfaces and permissions are allowed. Live Orbyte access is not provided.
- Prefer a small working workflow, clear explanations and tools the team can understand. Use AI where it has a specific purpose; keep arithmetic and validation reliable.
- Preserve existing files, licence, Git history and user changes. Inspect Git status and remotes before editing; do not reset or replace an existing project.
- Remote history has not been fetched because GitHub authentication needs setup. Before the first local commit, fetch and base this branch on the remote's actual default branch; preserve its existing README/LICENSE and initial commit. Do not force-push or create an unrelated initial history.
- Keep keys and credentials out of source files and commits. Use environment secrets and a placeholder `.env.example` if configuration becomes necessary.
- Update the tools declaration as resources are used. The team must review, understand and be able to explain AI-assisted work.
- Run checks appropriate to each implementation change and describe what actually passed. Label mock integrations, estimates and synthetic test results clearly.
- Keep task updates concise and understandable to a beginner. Record material project decisions in `PROJECT_CONTEXT.md`.
- At the start of a new session, read the current handoff and inspect saved files/Git status. At a meaningful handoff, update completed work, actual verification, blockers and next actions in the context; update the README when setup, demo links or implemented behaviour change.
- Distinguish official requirements, team decisions and recommendations. Retain source links for requirements, and keep document conflicts unresolved until authoritative clarification is available.

## Competition constraints

- Replit must be used, with proof of use. Resolve the RunPod inconsistency described in the context file through the organisers.
- The repository requires an Apache 2.0 `LICENSE` file. Keep it private while building, add designated committee collaborators before submission, and make it public by submission for judging.
- Maintain meaningful commits throughout development. No post-deadline fixes or commits unless the organisers authorise them.
- Official preliminary deadline: **25 October 2026, 07:59:59 MYT (UTC+8)**. The team's recommended internal target is **24 October, 20:00 MYT**.
- Current official announcements and Terms & Conditions take precedence over this planning summary. Consult the linked sources if requirements change.
