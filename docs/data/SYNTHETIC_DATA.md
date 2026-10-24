# eStock: synthetic document and inventory evaluation plan

**Reference collection confirmed 25 October 2026:** The user confirmed 122 team-created synthetic supplier-document JPEGs, including the five images used for exploratory live Gemini QA. The collection is stored under ignored `.private/ocr-reference/`; selected calls are exploratory observations, separate from automated fixtures and the controlled benchmark planned below. Synthetic descriptions, names and contact fields are test content.

23 October 2026. **New dataset/evaluation specification, not generated assets or measured results.** Domain 2 permits only team-created synthetic operational/evaluation data. All document images, supplier details, products and test records must be team-created synthetic material, including Indonesian and Malaysian supplier-document examples. A real-world pilot is separate future work after privacy/provider review.

The [earlier data card](../archive/2026-10-23-before-document-intake/docs/data/SYNTHETIC_DATA.md.txt), existing fixtures, CSV files and reports remain historical and unchanged. Normal new-MVP startup should be empty; load synthetic fixtures explicitly only in isolated evaluation environments. No CSV primary-storage/import requirement is carried into the new core.

## Planned fixture coverage

| Case family | Team-created examples / ground truth |
| --- | --- |
| Catalogue | Official names, one base unit, Opening, generated internal IDs; similar size/colour variants; no mandatory SKU/barcode/shelf |
| Supplier descriptions | Abbreviations, case/spacing, aliases, unknown names and intentional alias collisions; fictional supplier identities only |
| Images | Receipt, invoice, delivery note, order-detail/advance invoice; synthetic Indonesian and Malaysian wording/date/unit layouts; blur/crop/rotation and missing date/quantity |
| Monetary exclusion | Synthetic RM/Rp, price, tax/subtotal/amount columns present in source fixture but excluded from persisted application/provider-result fields |
| Units | Raw boxes/cartons versus final integer pcs; verified manual factors and deliberately unknown factors |
| Receipt status | Text-readable order with no delivery; only some physically received quantities; Manager sends expected quantities; shared Staff confirms actual goods, including entirely missing deliveries |
| Reliability | Multi-line receiving/notification rollback, same-receipt replay, edit race, concurrent Takes, Take/Return retry, image re-upload for comparison |
| Similar documents | Identical/similar dates and lines in separate drafts, including two distinct synthetic delivery scenarios (P1 warning) |
| Injection | Synthetic document text asking model/app to ignore rules; treated as data without authority |

For each case, record author, source-generation method, version, case ID, image hash where an authored fixture exists, expected extracted fields/uncertainty, product mapping, Manager-prepared expected values/conversion and Staff-confirmed actual outcomes, actual-receipt scenario and expected ledger result. Freeze evaluation cases before reporting improvements; keep prompt-development cases separate from held-out evaluation. The future asset format/location and fixture count are unresolved, not implemented by this task.

Authored synthetic image assets can be retained as team-created test sources. **Application uploads, including uploaded copies of those fixtures, still follow transient-only image policy.** Do not use fixture retention to justify storing user uploads or their raw provider responses. Reopened application drafts contain structured fields only and must explain image re-upload.

## Measurements to collect later

- Field/date/quantity/line extraction correctness against declared ground truth, including missing fields and invalid structured output.
- Correct/ambiguous/incorrect product suggestions, Manager correction rate and alias-collision outcomes; do not turn ambiguity into an accuracy win by hiding it.
- Manual entry versus upload-to-prepared-receipt and Staff-check time on comparable synthetic tasks, with N, participants, case mix, median/range and failure handling.
- Ledger/permission/retry/rollback/concurrency acceptance and image-retention inspection across storage/log/cache paths.
- Mobile/desktop/keyboard task completion and actual Replit restart/redeploy persistence/access.

Report provider/model/configuration, schema/prompt version, mock/live mode, date and limitations. No numerical OCR accuracy, time savings, interviews, pilot or passing application tests exist for the new concept. Synthetic results would not establish real-store performance.

## Historical data and RunPod evidence

Preserve `data/DATA_CARD.md`, generated 168-day DEMO series (seed 20261021) and team 2020–2026 SYN daily/weekly/monthly files. These served old forecasting/training, not receipt extraction. Team-history generator/seed/author provenance remains pending; do not silently claim it is verified synthetic merely because the filename or previous plan says so. Resolve before submission declarations/evaluation claims.

Historical run `20261021T110320Z` used Chronos-2 LoRA/RTX 4090. Current RunPod proof is supplied in [RunPod POU PDF](../../submission/SDC2026_TooGoodToBeTrue_Runpod_POU.pdf) and [Technical & Tools Declaration, Appendix C](../../submission/SDC2026_TooGoodToBeTrue_TechDeclaration.pdf). The original raw metadata, metrics and selection remain in Git history rather than the PDF-only submission folder. Historical usage remains declarable even though training is outside the active MVP; no new data generation, training or paid model call is authorised by this evidence update.
