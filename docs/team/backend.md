# Backend · William Christiansen

[Team](README.md) · [Integration](integration.md) · [Ledger](../engineering/STOCK_TRACKING.md) · [Receiving API](../engineering/OCR_INTAKE.md)

24 October 2026. Current `/api/estock` implementation has server-resolved Manager/shared Staff permissions. Manager owns catalogue/archive/Opening/OCR/preparation/send/recall/full History; shared Staff alone confirms physical receipt. Both roles use active Inventory/Take/Return and role-scoped notifications. Old `/approve` returns 410. Do not trust actor fields supplied by clients.

Review `receiving.ts`: frozen submission revisions, receipt/product locks, complete line validation, positive actual Intake, one check per receipt, request fingerprints/replays, zero-received records and atomic discrepancy notification. Missing/excluded/foreign/duplicate IDs, stale revisions and archived products must fail without partial stock. Archive conflicts require Manager recall/correct/resend. Opening/reading notifications never mutates stock. Take rechecks stock under lock; Return has no current-stock cap. Shared Staff attribution is not individual identity.

Gemini extraction remains server-only, transient and non-monetary; 45-second deadline/one SDK attempt. No live paid call is authorised. Historical legacy APIs/source remain outside active demo. [Actual synthetic tests and limits](../verification/STAFF_RECEIVING_2026_10_24.md). Team must review/adapt/explain AI assistance; local tests do not establish provider accuracy, retention or hosted durability.
