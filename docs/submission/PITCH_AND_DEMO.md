# eStock: pitch and demo handoff

24 October 2026. Narrative for the current local Staff-receiving implementation. No deck/video or hosted submission is produced here. [Current verification](../verification/STAFF_RECEIVING_2026_10_24.md) separates local tests from unverified live/provider/hosting behavior. [Prior pitch guide](../archive/2026-10-23-before-document-intake/docs/submission/PITCH_AND_DEMO.md.txt) is historical. Publication still needs separate authorisation.

## Story and Domain 2 fit

Problem: Manager retypes supplier-document lines and recognises abbreviations staff may not know. Product: one shop/one warehouse; reduce retyping while retaining Manager control. Benefit is a hypothesis to measure on synthetic tasks, not claimed interviews, adoption or savings. Link to SDG 8.2/8.3 productivity/support for small enterprises; do not invent waste/financial impact.

Show one complete journey: **trigger** synthetic document upload → **connected information** extracted names/quantities/date plus catalogue/aliases/stock → **rules/AI** Gemini proposes fields, application matches/validates → **authorised human approval** Manager corrects expected quantities and sends a frozen receipt; shared Staff checks physical goods and confirms actual quantities → **visible result/activity log** atomic Intake, updated Inventory and immutable History. Staff search/Take/Return shows the ongoing simple workflow.

Explain potential reusable Orbyte-hub catalogue/intake/permission/approval/activity contracts. No live platform API/sandbox was supplied and no working integration is claimed. Verbal workspace requirement remains X-09 separately. One-shop MVP does not claim implemented multi-tenant support.

## Suggested six-minute video: official range 5–7 minutes

| Time | Content to show after implementation |
| --- | --- |
| 0:00–0:45 | Team/product/problem; synthetic-only data and honest validation status |
| 0:45–1:20 | Manager Inventory/Opening, official name/base unit/generated ID, simple Staff role |
| 1:20–2:15 | Upload authored synthetic document, show actual extraction progress and uncertainty; label mock/replay if used |
| 2:15–3:20 | Review date/raw values, official/alias candidates, manual conversion and unknown-product Opening 0 |
| 3:20–4:10 | Send without stock change; Staff checks Match/Short/Extra and confirms once; actual stock posts; Manager informational discrepancy alert |
| 4:10–4:55 | Shared Staff search/Take/Return, updated stock and shared-account attribution; Manager-only action denied |
| 4:55–5:30 | One exception: order-only/no delivery, missing quantity or provider failure; no stock change; saved draft without image/re-upload |
| 5:30–6:00 | Architecture/Replit evidence, limitations/measurement status, Orbyte reuse and next steps |

This timing is a recommendation, not measured. PH overtime rule is 1 point per 30 seconds subject to final judging rules; leave margin below seven minutes. No official preliminary slide cap verified. Final round's ten-minute pitch/five-minute Q&A is separate.

## Suggested deck content

Problem/users; proposed solution/journey; actual-build demo; roles/physical-receipt/ledger safeguards; target-versus-implemented architecture; synthetic evaluation and limitations; Replit/current/historical tools evidence; SDG/reuse/next steps. Use as many concise readable slides as needed within the video; ten slides is not an official requirement. Mark unimplemented screens as concepts and use actual screenshots for implemented claims. Preserve the current blue Manrope design and Stockroom task navigation.

## Future demonstration acceptance

Use an isolated synthetic environment with known case IDs/build. Do not reset the user's legacy database for recording. Manager setup: one product with Opening 5. Staff Take 1 → 4 (Low stock); Return 1 → 5 (not Low stock). These are expected arithmetic examples, not executed results.

Manager uploads a synthetic document and reviews raw 2 boxes, manually prepared expected 24 pcs with a verified fictional factor. Unknown product creation uses Opening 0; Staff checks the physical goods and actual Intake posts at confirmation, with no later approval. Show an ambiguous alias or missing field and correction. Send to Staff, show unchanged stock, confirm a shortage/extra and read actual Receipt history. A second click/retry of the same draft must not add stock; do not claim that also prevents a new duplicate-image draft. Similar-document warning is P1.

An invoice/order-detail image is text only: if goods have not arrived, leave preparation pending or have Staff record an entirely missing delivery; no stock increase or purchase-order-management feature. AI cannot inspect condition or hidden contents. Reopen structured Draft without image and show re-upload explanation. Provider failure changes no stock; no fabricated successful live OCR.

## Evidence and truthful labels

| Claim | Evidence required |
| --- | --- |
| Live Gemini extraction | Actual authorised backend request/result with safe metadata, declared model/configuration and synthetic case; mock/replay clearly distinguished |
| Inventory correctness | Actual role/retry/concurrency/rollback/Opening-plus-Intake checks and ledger reconciliation |
| Accuracy/time savings | Declared fixed synthetic ground truth, N/case mix/mode/corrections and comparable timed manual task; no results yet |
| Image non-retention | Actual storage/log/cache/request-lifecycle inspection; app policy not provider zero retention |
| Deployment | Accessible actual build, restart/redeploy persistence and own-account/project Replit evidence |
| Historical RunPod usage | Preserved training/run metadata and reviewed own-dashboard proof; not OCR evidence or connected Serverless proof |

Replit is mandatory. Hosted Gemini does not resolve X-03 sample/handbook conflict; seek written clarification without an exemption claim or forced GPU feature. Declare historical RunPod/training even though outside active core. No forecast, policy, purchasing/outbox/PO/budget or training scene is required in the new product demo.

## Rehearsal, access and freeze

Assign presenter/operator/evidence reviewer/upload owner explicitly; product workstreams do not automatically allocate these. Everyone should explain roles, extraction versus matching, manual units, physical receipt, atomic ledger, retries, shared Staff limits, privacy, synthetic data and historical resource usage.

After authorisation/implementation, inspect actual mobile/desktop/keyboard/error states and required UI Delivery Gate, align screenshots/source/prototype/proposal/declaration, then test deck/PDF on another machine. Rehearse without exposing private registration contacts, API keys, tokens, billing/payment details or notifications. Preserve genuine source/evidence history; do not fabricate logs/results or hide failures with an unlabelled replay.

Upload the 5–7-minute video to YouTube only when authorised; allow processing time, watch the final upload and test judge access in a fresh session. Video does not replace the working prototype or other five deliverables. Verify all links and official-template word counts/signatures; retain portal receipt and matching build/commit/deployment snapshot.

Deadline remains PH/earlier orientation 25 October 2026, 07:59:59 AM MYT versus public website/FAQ 11:59 PM MYT. Internal target 24 October 2026, 20:00 MYT; use earlier cutoff pending authoritative written clarification. Freeze judged source/live build/materials after applicable deadline. Private Discord, logged-in portal, attendance/workshops and recordings still require team verification. No publication is authorised in this implementation task.
