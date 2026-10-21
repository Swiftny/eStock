# Data · Maxi

[Team pages](README.md) · [Backend](backend.md)

## Existing implementation

SQL schemas are in `db/migrations/`. Persistence and synthetic input handling are in `src/lib/server/db.ts`, `store.ts`, `seed.ts` and `imports.ts`. The database command entry is `scripts/database.ts`. The example CSV is `public/fixtures/history-example.csv`; conventions are in `docs/data/SYNTHETIC_DATA.md` and the root README.

The local database lives in ignored `data/estock.sqlite`. Do not share or commit local database files. Each teammate runs a separate local database.

## Next tasks

- [ ] Review the schema, synthetic seed and data card against the PRD.
- [ ] Prepare reproducible synthetic cases for normal demand, zero sales, stockouts, missing history and duplicate source IDs.
- [ ] Verify CSV preview, repeated import and reasoned historical corrections.
- [ ] Verify historical data and ledger-derived sales do not overlap or double count.
- [ ] Check integer quantity precision, MYR sen and usable versus damaged receipts.
- [ ] Agree a fixed synthetic evaluation dataset and cutoff with Marco; retain its generation method and hash.
- [ ] Coordinate any new migration and its application logic with William.

Preserve existing migrations and records. The current migration runner explicitly applies known migration versions; adding a SQL file alone does not make it run. Agree the migration change with William before integration.

## Review evidence

Use the existing workflow tests for persistence changes and verify a fresh database plus preservation of existing records. Record the actual dataset version and expected outcomes. Synthetic results do not prove real SME accuracy or savings.

## Parallel work boundary

Read [integration rules](integration.md). For code changes, select the `data` area and run `python3 scripts/check_scope.py data` before handoff. Shared files require a separate coordinated task. Demo rehearsal is shared; only one active task edits the demo interface at a time.
