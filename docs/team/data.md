# Data · Maximillion Cang

[Team](README.md) · [Ledger specification](../engineering/STOCK_TRACKING.md) · [Synthetic evaluation](../data/SYNTHETIC_DATA.md)

23 October 2026. Future work only; no schema, data, database, fixture or script changes in this task. Existing SQLite migrations, CSV/import/seed modules, runtime records and historical training datasets remain untouched. PostgreSQL is the target for new structured inventory, not an implemented migration.

After authorisation, coordinate with William on products/accounts, Opening/Intake/Take/Return ledger, integer base units, draft/raw/final lines, aliases, approval snapshots/revisions and persistent event/request identities. All balances/movements must commit together; approval is all-line atomic. Review-created products use Opening 0, then Intake once. No monetary columns, retained image/provider dumps, purchasing policies or forecasting data model in new core.

Plan explicit empty startup and isolated synthetic evaluation. All images/suppliers/products/records must be team-created synthetic. Keep author/version/ground truth, unknown products, alias collisions, unreadable fields, manual unit conversion, order-only drafts, concurrent Take and rollback/retry cases. Do not use real business receipts. Authored synthetic fixture images differ from retained application uploads.

Historical `data/DATA_CARD.md` and RunPod metrics remain evidence for old forecasting. Team-history generator/seed/author provenance is still pending; resolve honestly rather than relabelling it verified. Future PostgreSQL hosting/ORM/migration/backup choices need current docs, contract coordination and explicit implementation scope. Existing work-scope map needs later review for new paths; preserve legacy records.
