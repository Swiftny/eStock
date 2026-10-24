# eStock end-to-end QC: 24 October 2026

This report covers the current local source, including Manager scan/review/send, shared Staff physical receiving, inventory and History. It is not hosted or physical-device acceptance. Historical reports describe their own earlier revisions.

## Test isolation and evidence

The PostgreSQL/API and browser suites created uniquely named temporary schemas and local app copies, checked their ownership, and removed them after use. Browser OCR used a local test-only provider stub and team-created synthetic images. The reference collection contains 122 team-created synthetic supplier-document JPEGs, as confirmed by the user on 25 October 2026, and remains in ignored `.private/ocr-reference/`. All copied JPEGs matched the source files by SHA-256, decoded locally, and were below 6 MiB. These synthetic reference images are separate from the automated browser fixtures and do not form a controlled accuracy benchmark. A small, user-authorised subset was sent to the live Gemini service through a separately isolated app and database for exploratory OCR QA. No operational receipt or stock mutation was part of these checks. A final read-only query found zero remaining `estock_liveqc_` schemas.

| Check | Actual result |
| --- | --- |
| eStock PostgreSQL/API suite | 38/38 pass; temporary schema removed; includes revision, retry, date, receipt and ledger checks |
| Headless Chrome | 23/23 browser journeys pass; temporary schema/source copy removed |
| Headless Edge | 23/23 browser journeys pass; temporary schema/source copy removed |
| Retained Node tests | 117/117 pass; these exercise the preserved legacy system |
| Retained Python worker tests | 7/7 pass; preserved historical worker scope |
| Production build | `npm run build` pass, including TypeScript |
| Changed active eStock source lint | Six edited modules pass `biome check --line-ending=crlf` |
| Whitespace | `git diff --check` pass |

The browser journeys cover Inventory and role navigation; product setup/search/rename; fake webcam capture, retake, cancel, remove, upload, permission denial, absent/disconnected camera and switching between two fake sources; Android user-agent native capture input; preparation of a synthetic 4000×3000 JPEG over 6 MiB; draft review/comparison/save/reload; Send to Staff, notifications, actual Match/Short/Extra receiving and entirely missing delivery; History, Take/Return, delete, recall/reopen, polling and retry; scans lasting more than ten seconds across navigation; public landing and owned-server restart. Widths 320, 375, 768 and 1440 px plus 812×375 landscape were checked without horizontal overflow. Keyboard/focus, reduced motion and sampled text contrast (minimum 5.025:1) passed. Result files and screenshots remain in ignored local `.artifacts/estock-mvp/` and `.artifacts/estock-mvp-msedge/`, not committed evidence.

## Defects found and fixed

1. Large phone photos could be rejected before preparation. The picker now downsizes and compresses decodable images in a bounded canvas before enforcing the 6 MiB scan payload. It retains an upload fallback, uses native phone capture input, offers a desktop camera switch when multiple devices are exposed, restores keyboard focus after Cancel, and avoids treating a deliberate track stop as a camera disconnection.
2. A provider 503 previously surfaced as an immediate scan failure. The backend now makes at most one extra attempt after numeric HTTP 503, with a one-second pause. The SDK's own retry count remains one, so 429, authentication, invalid requests and other failures are not retried accidentally. The application imposes no 45-second extraction cutoff; a slow scan remains visible after navigation.
3. A faint issue date was presented by Gemini as a plausible but unsafe date. New scans store it only as an extracted candidate. The Manager date remains blank and Send rejects a missing confirmed date. The issue-date field is shown alongside the candidate for checking against the document.
4. A document headed **FAKTUR** with a consignment subtitle was initially classified as consignment. The extraction instruction now prioritises the main printed heading. An isolated live retest classified that selected photo as Faktur and preserved its two uncancelled lines.
5. A difficult handwritten photo yielded guessed names and units while Gemini called it clear. When every retained line needs review, the parser now downgrades `clear` to `partial`. The draft prominently warns the Manager to verify or discard it; uncertain lines do not prefill expected stock quantity. A partly readable image still produces a reviewable draft, as requested.
6. Receipt History could otherwise reflect later draft edits rather than the exact text/exclusions sent to Staff. New submissions freeze reviewed names and exclusion reasons per revision in additive migration `004_receipt_revision_evidence.sql`; Manager receipt responses use those snapshots. Earlier records cannot gain evidence that was never stored.
7. The local browser provider stub lacked newer document metadata and did not initially account for the new 503 retry. It now exercises the current contract, including continued failure after both allowed attempts.

## Exploratory live-provider observations on synthetic documents

Five distinct team-created synthetic document photos from the 122-image reference collection were used for local Gemini QA. The first pass included two transient HTTP 503 failures and successful scans that took 134–197 seconds. A follow-up on four authorised photos succeeded in 75–184 seconds. These are a few selected requests, not a reliability or OCR accuracy estimate. One follow-up read the expected two item quantities; another corrected a document-type mistake. The difficult handwritten image still produced guessed text; its lines were marked for review, and the later parser change makes its all-uncertain status partial. Two isolated requests using an alternate model returned model-unavailable errors at that historical revision. These observations do not verify the current explicit `gemini-3.8-flash` configuration, which permits no alternate-model fallback. Per-image notes for the synthetic references stay under `.private/ocr-reference/notes/`.

## Remaining limits

- Chrome and Edge tests use fake Chromium camera streams and an Android user agent. They do not establish behavior on physical webcams, iPhone/Android hardware, Safari/Firefox, native HEIC decoding or a hosted HTTPS origin. Browsers control permission prompts and device exposure; file upload remains the fallback.
- Gemini can return plausible wrong text, dates or document types. Even a structured response needs Manager verification. Staff, rather than OCR, confirms actual goods before stock changes. An unreadable document may still need manual entry or discard.
- Provider/network/host time limits can still end a scan, and the measured successful calls were slow. The bounded 503 retry can add time and a generation attempt. This QC did not establish provider retention, a faster model, all-document accuracy or hosted durability.
- A lost create-draft response followed by a fresh upload can create two drafts. Similar-document warnings and separate Manager Send/Staff Confirm limit stock risk, but are not full duplicate-upload prevention.
- Plain `npm run lint` fails on existing repository-wide Windows line-ending/legacy formatting; the six changed active eStock modules pass scoped CRLF-aware Biome. No repository-wide formatter was run.

No commit, push, deployment, credential change or operational inventory reset was performed. Team review and competition-specific synthetic evidence remain required before submission.
