# eStock: active MVP status

23 October 2026. New direction: document-assisted inventory. **Documentation baseline prepared; implementation not started or verified.** No percentage is assigned from legacy stage counts. [Previous progress snapshot](../archive/2026-10-23-before-document-intake/docs/plans/MVP_PROGRESS.md.txt) preserves the old 29/100 checkpoint and branch instructions as history; do not execute them as current work.

| Future stage | Current status | Evidence still needed |
| --- | --- | --- |
| PostgreSQL, roles, products, ledger | Not implemented for new MVP | Schema/migration/auth decisions, backend role denials, preservation checks |
| Opening/Inventory/search/Low stock/Take/Return/History | Not accepted for new MVP | New integer/role/retry/concurrency acceptance, shared Staff attribution |
| Manager upload/Gemini/saved Draft | Not implemented | Live/mock extraction distinction, validation and image non-retention evidence |
| Matching/correction/unknown products/approval/discard | Not implemented | Alias ambiguity, Opening 0, actual receipt, atomic approval/race/rollback evidence |
| Synthetic evaluation/responsive/Replit/submission | Not verified | Declared case set/results, deployment persistence, own-project proof and all six artifacts |

Existing legacy website/SQLite workflow, old stock/forecast code and historical reports are preserved, not credited as new feature acceptance. Historical RunPod training run `20261021T110320Z` is real retained usage; see [historical AI status](AI_RUNPOD_PLAN.md). It does not verify Gemini extraction or a connected Serverless application.

Open conflicts: X-01 deadline, X-02 workshops, X-03 RunPod, X-09 verbal Orbyte workspace issue, plus remaining [compliance conflicts](../COMPLIANCE_MATRIX.md). Replit proof, actual hosting persistence, final PDFs/deck/video, signatures, committee/source accessibility and portal confirmation remain unverified. No readiness box becomes complete because a draft exists.

Follow the [five-stage handoff](BUILD_PLAN.md) only after explicit implementation instruction. Do not stage, commit, push, merge, publish, purchase, provision, call paid models or change running services during this documentation task.
