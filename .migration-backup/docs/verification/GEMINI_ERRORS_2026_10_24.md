# Gemini failure diagnosis and error mapping

24 October 2026. One backend editor; shared context/declaration integration recorded separately. Existing user changes preserved.

The reported message was a catch-all for non-timeout SDK failures, not evidence that Gemini found the photo unreadable. It occurs after application image validation. The original upstream status was discarded, so the exact cause of that past request cannot be recovered from the message.

The configured API key is present. A metadata-only GET for `gemini-2.5-flash` returned HTTP 200 and generation support. This does **not** establish generation quota, successful OCR, extraction accuracy or retention behavior. No user image/prompt or live generation was sent.

## Change and evidence

`src/lib/server/estock/extraction-deadline.ts` now maps provider HTTP status and allowlisted invalid/expired-key reasons into static recovery messages and stable application codes. It distinguishes credentials, permissions, credits, rate/quota, model availability, account/region preconditions, request configuration and temporary service failures. It never returns/logs the raw provider body. Existing 45-second abort, one SDK attempt, transient uploads and failure-before-persistence remain.

| Check | Actual result |
| --- | --- |
| Retained PostgreSQL/API regression | 32/32 pass in a uniquely owned schema; reconciled ledger; schema removed |
| Provider-error regression | 11 cases, including invalid/expired keys, 401/402/403/404/429, account precondition, invalid request, 500/503; correct recovery/status, no provider-content leak, unchanged draft count/stock |
| Real installed SDK against loopback provider | 503 upstream becomes 502 with “Gemini is temporarily unavailable”; draft count stays 2; explicit retry returns 201 and count 3 |
| Isolation | Preview blocks external fetches, uses test-only credentials/model and a separate source/schema; cleanup confirmed |
| Biome/typecheck/build | All pass; two source/test files linted; generated next-env content restored |
| Backend scope | Explicit two-file backend allowlist passes; shared docs reviewed separately |
| Browser | Original error observed in Safari. Later computer-control calls timed out; in-app browser unavailable. No new browser or responsive acceptance claim |

Local HTTP evidence is ignored `.artifacts/gemini-diagnostics/http-result.json`. Authored one-pixel synthetic fixture is a test input for the loopback provider, not an OCR-quality fixture or retained application upload. No operational database records were targeted.

## Scoped Delivery Gate

Design read: existing eStock Manager scan form, calm blue/Manrope, ENERGY 2 / RHYTHM 2 / MOTION 2 from DESIGN.md. Scope is backend response text and tests; no component, CSS, asset, navigation, typography or motion edit.

| Item | Status and evidence |
| --- | --- |
| R-02 | PASS: new runtime messages contain no em dash |
| R-17/R-18/R-36/R-38 | PASS: no statistics/testimonials/marketing claim; metadata and stub limitations explicitly recorded |
| R-23/R-33 | PASS: no product asset created; direct source edits |
| R-26/R-27 | PASS for changed response path: 11 error cases, unchanged persistence, explicit HTTP retry; existing renderer uses role=alert |
| R-35 | PASS for backend delivery: running isolated app, real-SDK HTTP failure/retry, 32 tests and production build; no changed interactive UI elements. Visual click-through is unverified and is not delivered as acceptance |
| R-03/R-24/R-25/R-28/R-32/R-34 | Not applicable to this diff: no layout/navigation/style/control/theme change; existing renderer inspected, not newly visually certified |
| R-37; Liveliness block | PASS for direction preservation: established dials/design read above; no new composition |
| Purpose-Gate | Not applicable: no visual technique introduced |
| C-1 | PASS: messages direct the user toward the failed service condition instead of attributing every error to photo quality |
| C-2/C-4 | PASS for backend behavior: fail without draft/stock mutation; no automatic retry; deliberate retry succeeds with local provider |
| C-3/C-5; Quality Locks | PASS within this diff: no sections/templates, decorative copy or unsupported claims added; no visual system change |

The new messages must be observed on the user's next deliberate live attempt to identify that attempt's upstream category. Successful OCR, physical devices, current provider account quota/tier and full visual acceptance remain unverified.

References: [official Gemini API errors](https://ai.google.dev/gemini-api/docs/generate-content/api-errors), fetched through Context7; installed `@google/genai` ApiError implementation/status and Next.js expected-error guidance. No dependencies, private configuration, paid generation, infrastructure, external messages, commits, pushes or publication changed.
