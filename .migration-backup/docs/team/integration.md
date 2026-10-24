# Work areas and coordinated integration

Updated 24 October 2026 for document-assisted inventory. **Latest explicit user task authorises the MVP revision and non-destructive verification across demo/backend/data/system contracts, with one editor per shared file.** [Current evidence](../verification/STAFF_RECEIVING_2026_10_24.md) records actual results. No commit/push/deployment or operational-data reset is authorised. The older documentation-only boundary is superseded; teammate-specific laptop login troubleshooting remains deferred.

Keep team Markdown in `docs/team/`, never a root `pages/` folder. Existing Next.js source/layout, Git history, databases, credentials, original LICENSE and all team changes/evidence remain intact. The [old integration guide](../archive/2026-10-23-before-document-intake/docs/team/integration.md.txt) preserves exact prior scope detail.

## Coordinated revision ownership: 24 October 2026

The user's confirmed revision authorises frontend/demo/data/backend/system implementation and shared documentation. One editor is active for this task; no parallel sessions or sub-agents edit shared files. Pre-existing landing/palette, Compose and runtime-documentation changes are retained. The scope map now includes the active eStock paths, while shared root docs, `src/lib/estock-history.ts`, dependency/configuration files and scope map remain coordinated integration contracts.

| Scope | Active eStock paths / assigned workstream |
| --- | --- |
| demo / Vitto | eStock app/CSS, receiving/notifications, History/comparison/image controls, isolated browser/preview harness |
| data / Maxi with William | db/estock migrations/runner, inventory/archive and receiving transactional services, explicit migrate command |
| backend / William | /api/estock handlers, extraction/draft validation, errors/inputs, PostgreSQL/API regression harness |
| system / William | eStock auth, local Compose/runtime |
| frontend / Vitto | Public landing; only contradictory workflow text changes in this revision |
| ai / Marco | Existing AI sources; no live provider call or training in this task |

Shared contract: DRAFT → frozen AWAITING_STAFF → immutable RECEIVED; Manager prepares/recalls, shared Staff confirms actual goods. Historical APPROVED is preserved. `approved_quantity` in preparation lines retains its existing database name for compatibility and now represents Manager expected quantity; frozen receipt lines explicitly store expected/actual/difference. One check per receipt plus unique Intake line identity and transaction/request guards prevent duplicate posting. Notifications and archives use the same authority/atomicity boundary. See [receiving](../engineering/OCR_INTAKE.md), [ledger](../engineering/STOCK_TRACKING.md) and [PRD](../product/prd.md).

Future concurrent tasks need disjoint files/worktrees and an explicit shared editor. A textual merge does not establish semantic compatibility. Run the scope checker on each area's explicit changed paths; cross-area/shared documentation is reviewed as integration, never represented as one single-area pass.

## Isolation and verification

For simultaneous sessions, use separate clones/worktrees/task branches, local databases and secrets. Switching branches in one shared folder does not isolate edits. Never copy a teammate's runtime database/credentials or overwrite pre-existing changes. Inspect status/remotes before editing; no repository-wide formatter.

For future scoped code work, run the existing checker with the agreed area (and integration base when relevant):

```sh
python3 scripts/check_scope.py frontend
python3 scripts/check_scope.py frontend --base origin/main
```

Replace frontend only with an agreed existing area. The checker reports staged/unstaged/untracked paths; it is opt-in, not remote enforcement, and does not approve new OCR paths. Failure is not permission to reset others' work. Shared documentation integration cannot honestly be called a single-area pass; verify its explicit documentation allowlist, links and preservation instead.

After future code integration, run relevant meaningful business/permission/concurrency checks and then appropriate types/build/UI evidence. Existing reports stay historical; do not rewrite them to make the new workflow look verified. Record actual results and blockers. Commits, pushes, merges, publication, purchases, infrastructure, paid models and external messages remain subject to explicit authorisation; stop after authorised local implementation and verification.
