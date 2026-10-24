# Data · Maximillion Cang

[Team](README.md) · [Ledger](../engineering/STOCK_TRACKING.md) · [Receiving](../engineering/OCR_INTAKE.md)

24 October 2026. PostgreSQL/pg is implemented. `db/estock/migrate.mjs` is the shared ordered transactional runner for explicit setup and app initialization. Preserve independent laptop data/credentials; run `npm run db:estock:migrate` after dependencies/Docker startup. It adopts old 001 schemas then adds 002 receipt snapshots/checks, notifications and archives. Repeated migration does not reset/post stock. Never delete volumes, truncate operational tables or copy a teammate's secrets.

Review extracted raw fields, compatibility-named preparation `approved_quantity` (now Manager expected quantity), immutable submitted product/name/unit/expected snapshots, separate Staff outcome/difference/actual, check time and once-only identity. Historical APPROVED rows remain Manager-approved and never become Staff pending. Existing DRAFT rows stay preparation drafts. Archive retains original ID, remaining-stock snapshot, ledger and receipt references. All stock reconciles to movements, including archived products. Zero actual receiving has no Intake but remains in completed receipt records.

Use only team-created synthetic images/products/supplier/evaluation records and owned temporary schemas. Fresh and populated upgrades, rollback/races/missing deliveries are tested in [current evidence](../verification/STAFF_RECEIVING_2026_10_24.md). Historical forecast datasets/RunPod proof are preserved and are not OCR evidence; unresolved historical provenance remains unresolved. Hosted backup/retention/durability and live extraction measurements still need real evidence.
