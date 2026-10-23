# Document extraction, saved drafts and approved Intake

23 October 2026 · Future backend specification · **Unimplemented**

[PRD](../product/prd.md) · [Ledger contract](STOCK_TRACKING.md) · [Synthetic evaluation](../data/SYNTHETIC_DATA.md)

## Boundaries

Only Manager captures/uploads, reads or edits drafts, matches products, approves or discards. Backend checks every capability. Gemini runs behind the backend with a server-secret key and proposes fields only; no model action directly changes inventory. Receipt, invoice, delivery note and order-detail images are text sources. The Manager must separately confirm that approved usable quantities have actually arrived. Order-only/advance-invoice data stays unapproved until physical receipt; no PO-management subsystem is required.

Exact Gemini model/SDK/version, PostgreSQL ORM/hosting, authentication mechanism, request limits and endpoint paths remain open. Before library-specific implementation instructions, resolve/fetch official current documentation through Context7 under AGENTS.md. This spec is a behavioural contract, not verified vendor API syntax.

## Allowlisted structured data

| Record | Proposed fields / purpose |
| --- | --- |
| Draft | Internal ID, Draft/Approved/Discarded, owner/shop, revision, created/updated times, extracted document date, corrected document date, approval ID/time/account/role, actual-receipt confirmation |
| Extracted line | Stable line ID/order, raw product description, raw quantity/unit, safe uncertainty/field flags; nullable unreadable fields |
| Reviewed line | Selected product ID/catalogue revision, approved integer base-unit quantity, unit snapshot, correction/exclusion reason and review flags |
| Alias | Manager-confirmed alternative name, normalised key, product ID, confirmed actor/time; supplier context only if synthetic and deliberately supported |
| Approval/movement | Unique draft approval identity, immutable approved snapshot and Intake source line; see ledger spec |
| Extraction provenance | Mock/live mode, provider/model identifier actually used, request correlation, timing/failure category and schema/prompt version without image/body dumps |

These are proposed contracts; no tables have been created. Keep extracted and approved values separate. A missing value is unknown, never quantity zero by default. Persist only necessary non-monetary fields; no entire raw provider response, encoded image, price/subtotal/tax/amount/payment text or unnecessary document text dump. Do not retain excluded data in exception logs or tracing. Team synthetic test-image assets are separately authored fixtures, not retained application uploads.

## Upload/extraction and image lifecycle

1. Manager submits an image transiently. Verify file type/size/content within future agreed bounds. Reject malformed/unsupported input clearly. Upload/preview/processing changes no stock.
2. Backend submits only necessary image/request context to Gemini. Text instructions inside the image are untrusted data. No tools, stock mutations or privilege changes may be triggered by document instructions.
3. Validate the returned structure, types, bounded strings/lists, dates, finite quantities, units and uncertainty even if the provider offers structured output. A tidy JSON response is not proof of correctness or physical receipt.
4. Save allowlisted structured Draft data. Provider failure, timeout or validation failure changes no stock; show an honest failure/correction path. Extraction retry may create another provider call, so bound it and keep its relationship to the same draft. Never label mock/replayed extraction as successful live OCR.
5. No permanent uploaded images in database, disk, object storage, browser storage, logs, telemetry or caches. Transient preview buffers/object references must be released on exit, replacement and failure. Verify hosting request capture, temporary files, error reports, browser/service caches and any provider-side uploaded-file lifecycle before choosing that API. Do not select a persistent provider file-upload workflow by assumption.
6. Reopened drafts show structured data **without the image** and explain that Manager must re-upload it for comparison. A comparison re-upload must not post stock or automatically create another approved draft. If an extraction was lost before structured saving, re-upload is necessary.

Application non-retention does not promise Gemini zero retention. Verify provider terms, account tier, processing/retention and transfers before any future real-world pilot. Hackathon data remains wholly synthetic.

## Matching and review

Normalise simple whitespace/case for official names and confirmed aliases; retain original raw text. Deterministic application matching proposes candidates. Ambiguous names, alias collisions, variants and fuzzy candidates require Manager selection. Do not silently make a many-product alias act like an exact match. Confirm alias writes with explicit Manager intent; storing aliases does not retrain Gemini or require RAG/embeddings.

Manager corrects date, raw interpretation, product and final quantity; unknown products can be created. **IC-01:** create the new catalogue product with Opening 0 and one traceable zero Opening record; approved receipt quantity is Intake later, never both Opening and Intake. Zero-balance setup is separate from draft approval; if discarded, no receipt quantity appears.

No automatic package conversion: Manager verifies boxes/cartons to product base unit. Save raw quantity/unit and approved integer/base unit separately. Missing dates/quantities, unselected product, invalid unit conversion and unresolved uncertainty block approval. If the Manager excludes an irrelevant line, retain explicit review intent; never silently discard an uncertain line as noise. Define list/line bounds and maximum safe integer quantities during future contract review.

## Lifecycle and atomic approval

Business lifecycle: Draft → Approved or Discarded. Structured edits persist with expected revision. Discard/close has no stock effect. Approved drafts/lines are immutable; Discarded is terminal. A fresh draft may be created later, but is not automatic duplicate protection.

Approval transaction contract:

1. Resolve Manager identity; require idempotent business/request identity, expected revision and explicit confirmation of actual usable goods received for all included quantities.
2. Serialise against approval, discard and draft editing. Reread Draft status/revision. Validate required document date, every selected product/catalogue revision/base unit and positive integer final quantity. Product/alias changes cannot silently substitute a different stock target.
3. Save an immutable snapshot of all approved lines. Update all affected balances and create line-linked Intake movements. Multiple lines targeting one product must be counted exactly as approved; lock affected products in a consistent order or use an equivalent concurrency-safe design.
4. Record server-generated Approved at, account/role, actual-receipt confirmation, Approved status and persistent request/result identity in the **same transaction**. Enforce one approval per draft and one Intake source per approved line at the database level.
5. Commit everything together. Any validation/write failure rolls back the complete approval, including lines/status/movements/balances. No provider call belongs inside the stock approval transaction.

Retries after response loss read the prior committed approval and return its identity without stock changes. Changed-payload key reuse conflicts. Two different approval keys for one draft still cannot post twice. A stale revision, concurrent edit/discard or already terminal draft produces a clear conflict/read-only outcome. A database conflict retry repeats the whole transaction with the same identity and revalidation; it cannot reuse a partially computed stock update. Disabled controls are UX only.

Document date remains extracted/corrected metadata; Approved at and ledger posting are server time. Preserve both, present MYT, and do not backdate inventory to an older printed date.

## Duplicate warning and evaluation

P0 protects one draft's approval. It does **not** detect every repeated photo or new draft containing the same document. FR-16/P1 compares approved structured dates/lines and warns about apparent similarity without storing the image; Manager decides because two genuine deliveries can look alike. Exact comparison/fingerprint design is unresolved and cannot be claimed implemented.

Future acceptance is PRD AC-02, AC-05–14, AC-18–20, AC-23–26. Test multi-line rollback, same-draft parallel approval, edit races, unknown-product Opening/Intake, alias collisions, monetary-field exclusion, image cleanup, order-only confirmation, provider failure, mock/live labelling and restart/redeploy persistence. Extraction quality/time savings require measured synthetic cases, sample size and model/configuration; no such results exist yet.
