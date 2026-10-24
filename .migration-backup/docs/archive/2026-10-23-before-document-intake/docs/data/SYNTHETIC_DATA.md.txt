# Synthetic operational data card

Updated 22 October 2026. Test fixture version: `estock-test-fixture-v1-20261022`, explicit literal fixtures and deterministic generation in `tests/synthetic-fixture.ts`. Project-created synthetic operational/test data, covered by the repository's Apache 2.0 licence. No external operational dataset or real contacts are used.

Normal startup is empty. `src/lib/server/seed.ts` initialises only blank-workspace metadata and the Demo supplier SIMULATED setting, with no inventory or transactions. The dataset below is explicitly loaded only in isolated tests. One synthetic organisation and three SKUs are used; no real messaging destination exists. User inventory is not part of this fixture.

| SKU | Unit / precision | Physical opening | Recorded sale on 20 Oct | Initial remaining | History before ledger |
| --- | --- | --- | --- | --- | --- |
| SYN-001 Takeaway cartons | units / whole | 55 | 10 | 45 | 168 constant days at 10/day |
| SYN-002 Coffee beans | kg / 3 decimals | 23.5 | 1.5 | 22 | 168 days with a repeated weekday multiplier |
| SYN-003 Cup lids | units / whole | 80 | 5 | 75 | 10 constant days at 5/day, deliberately short |

Fixture history ends 19 October 2026. Its physical ledger starts 20 October; its SALE creates that day's complete canonical sales record. Main SKUs therefore initially have 169 dated observations. Analysis uses the latest 168, ending at the cutoff. Cup lids initially has 11 complete days and uses DEMO_ESTIMATE, an explicitly labelled available-days average rather than live AI or a validated forecast. RunPod requires at least 28 complete days. No PO/inbound is pre-seeded. The separate arithmetic fixture's 25 inbound units are not persisted inventory.

Coffee multipliers repeat `[0.9, 1, 1, 1, 1.1, 1.2, 0.8]`, with quantities rounded to thousandths. This is a fixed constructed pattern, not measured demand or randomness. Constant series make a simple mean baseline strong; there is no claim that a model improves it.

The test helper requires an empty isolated database and inserts fixture records transactionally. Relevant unit tests create temporary databases, block external fetches, remove real provider settings and clean up while restoring the previous environment. Browser verification uses only `/private/tmp/estock-integration-browser-20261022.sqlite`; the normal user database is preserved. See [current evidence](../verification/INTEGRATION_2026_10_22.md). Plan ahead inputs are not added to operational history.

Daily completeness is explicit. New ledger days remain partial until a human closes the day, including confirmed zero-sales days and stockout flags. Missing days are not fabricated. Gross sales are the model target; damage, usage, adjustments and receipts are excluded. Historical CSV dates cannot overlap the ledger. Reviewed CSV corrections preserve source identity, increment revisions and record before/after values without posting physical stock.

For submission evaluation, freeze this generator/version, an explicit cutoff and resolved model/packages before running the model and both baselines. Retain input hash, dates, source, GPU runtime and the model's actual output. The worker implements validation origins 58/72 and final origin 124, with identical censored-day exclusions. No actual model evaluation results have been produced in this local task.
