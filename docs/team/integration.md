# Work areas and coordinated integration

Updated 23 October 2026 for document-assisted inventory. **Current user-authorised task is one coordinated documentation update across areas, with one sole editor per shared file. No code, scope-script or runtime changes.** Future implementation requires explicit instruction.

Keep team Markdown in `docs/team/`, never a root `pages/` folder. Existing Next.js source/layout, Git history, databases, credentials, original LICENSE and all team changes/evidence remain intact. The [old integration guide](../archive/2026-10-23-before-document-intake/docs/team/integration.md.txt) preserves exact prior scope detail.

## Existing scopes, unchanged

| Area | Member | Existing map covers / limitation |
| --- | --- | --- |
| frontend | Riakudu Vittorios Surjoraharjos | Legacy landing files; separate from demo |
| demo | Vitto, or one explicitly assigned editor | Legacy persistent demo UI; no simultaneous editors of its large component |
| data | Maximillion Cang | Existing db/store/seed/import modules and data docs |
| backend | William Christiansen | Existing demo API/service/validation/purchasing/test paths |
| system | William Christiansen | Session/runtime/smoke paths |
| ai | Marco Ryan Suseno | Existing worker/forecast paths and AI plan |

Exact entries are in `scripts/work-scopes.json`; checker is `scripts/check_scope.py`. **Both remain unchanged. They do not already cover all future OCR routes/modules, new PostgreSQL data access, account endpoints or new shared types.** Before future code tasks, agree precise disjoint paths, then coordinate a separately authorised map/contract update. Do not silently treat this table as scope expansion.

## Shared contracts to agree before future parallel code work

- Product/internal ID/official name/base unit and once-only Opening; integer balances/movement types and account/time/source.
- Manager versus shared Staff permissions for reads and writes; account/session lifecycle and no individual Staff attribution.
- Extracted versus reviewed draft/line/date/unit/quantity fields, business statuses/revisions, actual-receipt confirmation and immutable approval snapshots.
- Official-name/alias matching and collisions; zero-balance product creation during review; no automatic conversion or variant merge.
- Approval all-line atomicity/rollback, product concurrency, once-only source identities, idempotent Take/Return and approval, stale edit/approval/error responses.
- Backend extraction schema/provenance/mock-live labels, non-monetary allowlist and transient-image boundary across request/log/cache/storage layers.
- PostgreSQL migration/legacy isolation, hosting/durability and Replit evidence; API route/type names and deployment/secrets need verified decisions.

Shared files include root docs, common contracts/components/layout/styles/tokens, configuration/dependencies, schema interfaces and scope rules. Announce exact files and contract impact; assign **one active editor**, integrate that contract first, then dependent tasks. A clean textual merge is not semantic compatibility. No merging/pushing is authorised by this documentation task.

## Isolation and verification

For simultaneous sessions, use separate clones/worktrees/task branches, local databases and secrets. Switching branches in one shared folder does not isolate edits. Never copy a teammate's runtime database/credentials or overwrite pre-existing changes. Inspect status/remotes before editing; no repository-wide formatter.

For future scoped code work, run the existing checker with the agreed area (and integration base when relevant):

```sh
python3 scripts/check_scope.py frontend
python3 scripts/check_scope.py frontend --base origin/main
```

Replace frontend only with an agreed existing area. The checker reports staged/unstaged/untracked paths; it is opt-in, not remote enforcement, and does not approve new OCR paths. Failure is not permission to reset others' work. Shared documentation integration cannot honestly be called a single-area pass; verify its explicit documentation allowlist, links and preservation instead.

After future code integration, run relevant meaningful business/permission/concurrency checks and then appropriate types/build/UI evidence. Existing reports stay historical; do not rewrite them to make the new workflow look verified. Record actual results and blockers. Commits, pushes, merges, publication, purchases, infrastructure, paid models and external messages remain subject to explicit authorisation; stop after current documentation.
