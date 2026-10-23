# Backend · William Christiansen

[Team](README.md) · [System](system.md) · [Stock](../engineering/STOCK_TRACKING.md) · [OCR intake](../engineering/OCR_INTAKE.md)

23 October 2026. Future specification only. Existing routes/service/SQLite/forecast/purchasing code is preserved and is not new-MVP acceptance.

After explicit instruction, coordinate shared contracts first. Enforce Manager-only catalogue/Opening/upload/draft read/edit/match/approve/discard/full History, and both-role inventory/search/Take/Return on the backend. The shared Staff account is the only Staff actor identity available; do not claim individual attribution.

Implement positive integer movements and atomic nonnegative Take under concurrency. Persist event/request identity/input fingerprint for Take/Return and reliable retries. Product creation/Opening is atomic and once-only; new products in review have Opening 0. No general adjustments/damaged goods/refunds/prior-Take link.

Draft revision/status checks must serialise approval/edit/discard; immutable approved snapshots, one approval per draft and line-linked Intake movements commit atomically with all balances and server Approved at, or roll back fully. Require Manager actual-receipt confirmation; document date is separate and never backdates ledger. Same-draft protection is distinct from P1 cross-document warnings.

Gemini backend extraction has no stock authority. Validate structured output and allowlist non-monetary fields, preserve raw/final values, deny embedded document instructions and verify no permanent image/log/cache storage. Provider failures change no stock; mocks labelled. Coordinate schema with Maxi, extraction with Marco and response/error states with Vitto. New API paths/ORM/locking/migration details remain decisions requiring current official docs. No paid API or running-service changes now.
