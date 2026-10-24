# Synthetic receipt sample

[Open the sample PNG](synthetic-receipt-01.png).

## Origin and contents

The team requested one new synthetic receipt resembling the delivery-note example in its [pitching video](https://youtu.be/ntcX81K0TeE), around 1:22. The image was created with the built-in OpenAI image-generation tool on 25 October 2026 and visually reviewed against the requested text. It is a new generated fixture; it is separate from the earlier 122-image reference collection.

All supplier, customer and transaction details in this sample are fictional. It contains no phone number, address, bank account or signature. The displayed supplier name is Cahaya Elektrik Supplies; the document number is EST-DEMO-001. The PNG is 1086 x 1448 pixels and 1,239,942 bytes, within the application's 6 MB upload limit.

| Field | Expected value |
| --- | --- |
| Document type | Delivery note / surat jalan |
| Document date | 2026-10-24 |
| Lamp 5W | 20 pcs |
| Lamp 10W | 20 pcs |
| Extension cable 3m | 5 pcs |

Example unit prices are RM 3.50, RM 4.50 and RM 12.00; line amounts are RM 70.00, RM 90.00 and RM 60.00, totalling RM 220.00. eStock ignores monetary fields. All quantities are already expressed in pcs, so this fixture requires no package conversion.

## OCR check and limitations

One direct request to `gemini-3.8-flash` on 25 October 2026 used the application's extraction prompt and JSON schema. It correctly returned delivery-note classification (`surat_jalan`), date `2026-10-24`, and all three names, quantities and units. Elapsed time was 76.1 seconds. This is a single-image readability check, not an OCR accuracy benchmark or verification of hosted catalogue matching, draft creation or stock posting.

The [recorded extraction result](synthetic-receipt-01.ocr.json) contains expected fields, checks, image hash and the returned JSON. It contains no API key or session credentials.

Manager must still review the document date, official-product matches and expected quantities. Staff confirms physical received quantities before inventory increases. A new local database may require creating the three catalogue products or choosing their corresponding existing products.

## Generation brief

Create one flat, front-facing synthetic Malaysian electrical-supplies delivery note with a white background, crisp black typography, an explicit synthetic label, a clearly labelled issue date and a three-row table. Preserve the names and quantities above. Keep prices in separate columns and omit real personal/contact/payment details, handwriting, folds, shadows and overlapping watermarks.

Image SHA-256: `b5736a5e0b67e3bf5ac9dd880fff3b84f05a98cc1e50fd0fa723a888304b366b`.
