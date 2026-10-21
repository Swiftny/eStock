# Parallel work and integration

The user requested conflict prevention on 21 October 2026. These rules supersede the earlier request for task pages without file boundaries. They apply to humans and AI assistants.

## Separate work areas

| Area | Member | Main files |
| --- | --- | --- |
| Frontend landing | Vitto | `src/app/page.tsx`, landing/header/recommendation components, `src/styles/refinement.css` |
| Demo interface | Vitto, or one explicitly delegated teammate per task | `src/app/demo/`, `src/components/demo-app.tsx`, `src/styles/workspace.css` |
| Data | Maxi | migrations, db/store/seed/import modules, synthetic CSV/data card |
| Backend | William | demo API, service/validation modules, purchasing rules and workflow tests |
| System | William | session API/module, runtime config and HTTP smoke script |
| AI | Marco | `worker/`, server forecast adapter, forecast tests and AI plan |

Exact paths are in `scripts/work-scopes.json`. A friend working on demo UI must select `demo`; a frontend task must select `frontend`. Both may read any area. Do not edit another area's files to make your task work; describe the required change for the other task instead. Do not run repository-wide formatting.

Demo rehearsal is shared, but demo application code has one active editor per task. The landing page's in-memory recommendation example belongs to frontend; the persistent `/demo` screen belongs to demo. The current demo component is one large file: two people must not edit it concurrently.

## Shared files

Anything outside the scope map is shared and needs a separate coordinated integration task. This includes `src/lib/contracts.ts`, `src/components/ui.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, design tokens, dependency manifests/lockfiles, TypeScript/lint config, environment examples, root documentation and scope rules themselves.

Before a shared change, tell the team the exact files and interface change. Assign one active editor, agree the expected inputs/outputs, integrate that change first, then let dependent tasks update. Preserve backward compatibility where practical. A clean textual merge can still break behaviour, so run the relevant checks after combining changes.

## Working separately

Use a separate clone or worktree and task branch for each simultaneous AI session. Branches alone do not isolate two sessions sharing the same working directory. Each workspace needs its own local database and environment secrets. Do not copy another member's running SQLite database or credentials.

Before editing, inspect status, select one scope and confirm that scope has no concurrent editor. Before handoff, check your diff and run, from the repository root:

```sh
python3 scripts/check_scope.py frontend
```

Replace `frontend` with `demo`, `data`, `backend`, `system` or `ai`. The default checks staged, unstaged and untracked files. To include branch commits relative to a base available in your clone:

```sh
python3 scripts/check_scope.py frontend --base origin/main
```

The checker exits with failure for cross-area or shared paths. It does not modify files, reject pushes, enforce branch protection or automatically run on commit. A failure caused by pre-existing changes is not permission to delete or reset them. Separate the workspace or report the blocker. Shared integration tasks require human review instead of claiming a single-area pass.

Merge one reviewed task at a time into the current integration branch and run relevant business tests, typecheck and build after integration. Start later tasks from the updated integrated version. Git commits, pushes, merges and external publication still require session authorisation; this guide does not perform them.

## Starting an AI task

> My area is FRONTEND/DEMO/DATA/BACKEND/SYSTEM/AI. Read AGENTS.md, pages/integration.md and my work page. Inspect Git status. Edit only paths allowed for my area in scripts/work-scopes.json. Read other areas as needed, but report dependent changes instead of editing them. Do not touch shared files or format the whole repository. Preserve existing changes. Run the scope checker and relevant tests; report actual results and blockers. Do not commit, push or publish without authorisation.
