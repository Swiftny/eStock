# UI follow-up: navigation, camera and History

24 October 2026, MYT. One coordinated editor across frontend/demo and shared documentation. This report supersedes the earlier Stockroom navigation acceptance only; receipt permissions, atomic posting and historical evidence remain unchanged.

## Result and scope

PASS for the requested source/UI changes. Inventory replaces Stockroom as the default screen. Manager header: Inventory, Scan receipt, Drafts and History. Staff header: Inventory and Pending checks. Role appears directly before Notifications. Sign in/Sign out lives on the landing and reflects the existing session. Redundant Back buttons and Manager/Staff workspace labels are removed. Page descriptions fit one line at the tested widths. History uses quiet section selectors and matched search/default-select placeholder styling.

Both How it works links keep a stable scroll destination on their first click. Opening the inline camera brings its entire preview and controls below the header. The camera stays mounted while the photo is encoded, then the photo adopts its media height. Retake, Cancel and Remove work; cancelling a retake preserves the previous image. Native mobile file capture remains supported.

Source allowlist: `estock-app.tsx`, its CSS module, `receipt-image-picker.tsx`, `receiving-workspace.tsx`, `manager-history.tsx`, `site-header.tsx`, `refinement.css`, and updated navigation/sign-out expectations in `tests/estock/browser.mjs`. Scope checks pass for six demo paths and two frontend paths. Shared documentation is coordinated integration, not a single-area full-tree pass. Pre-existing edits are retained; the build-generated `next-env.d.ts` change was restored to its starting content.

## Direction and reasons

Design read: the existing calm eStock inventory workspace for Manager and shared Staff, ENERGY 2 / RHYTHM 2 / MOTION 2. `ui-ux-pro-max` and `antislop during` were applied. The catalogued antislop skill was used because the older installed-plugin path recorded in AGENTS.md is absent in this environment.

- Colour/type: existing blue, ink, muted text and Manrope preserve identity and readable stock information.
- Layout: direct header destinations remove the extra Stockroom step; wrapping keeps all role-appropriate destinations available on narrow screens.
- Spacing: existing 4/8px rhythm groups controls; role and Notifications remain adjacent as requested.
- History: underline selectors separate receipt records from stock activity without competing with record content. Default Movement type text matches the search placeholder; a specific selection uses normal text colour.
- Motion: existing 500ms page entrances, 180ms underline transitions and 160ms control colour transitions acknowledge navigation and selection. Reduced motion disables them.
- Landing: clipping visual overflow prevents reveal transforms from temporarily increasing page height and moving the maximum scroll position.
- Camera: a viewport-sized grid and contained video show the whole frame and both controls. Keeping media mounted during encoding prevents collapse; the image keeps that frame height. Source controls retain their layout, with contextual Retake/Remove below the image for convenient retry.
- Focus: navigation explicitly starts at the page top without focus-triggered scrolling; the skip target stays below the header. Opening the camera focuses its enabled control without another scroll.
- Assets/theme: existing wordmark and light brand theme retained; no generated asset, icon library, font or dependency added.

## Executed checks

| Check | Actual result |
| --- | --- |
| Scoped Biome | Eight source/test files pass |
| TypeScript | Pass |
| Final production build | Pass after final source changes |
| Retained isolated browser suite | 15/15 journeys pass |
| Focused UI script | 14 checks pass, including both first-click links at four widths, both roles, filters, slow capture, native input emulation and sign-out failure/retry |
| Additional keyboard/camera probes | Pass at 320×812, 1440×812 and 812×375 |
| Responsive UI | Both roles at 320/375/768/1440px and landscape; no page overflow, clipped headings or multi-line page descriptions |
| Camera opening | Entire panel below header and inside viewport at all three additional sizes; enabled Cancel control receives focus |
| Slow photo encoding | Artificial 800ms delay: 320px scroll stays 635 throughout; 1440px stays 459 throughout |
| Landing first-click scroll | Desktop before fix reached 1201 then settled at 1192; after fix maximum/final both 1192. Both links have stable document heights at all four widths |
| Filter placeholder | Default select colour equals search `::placeholder`; Take uses normal input colour; All restores placeholder colour |
| Final placeholder match on local preview | Both controls use Manrope 16px, weight 400, rgb(88, 101, 121), and 46px field height at 320/375/768/1440px |
| Keyboard/motion | Enter, Escape, visible focus, skip link, 180ms underline, 500ms page entrance and reduced-motion disabling checked |
| Contrast | 736 sampled text nodes across 29 retained-suite samples; minimum 5.43:1, no failures |
| Runtime/console | No page exceptions in successful isolated checks; retained suite logs only expected HTTP 400/403/409/502/503 from deliberate failure scenarios |
| Preservation/cleanup | Owned preview schemas/source copies removed; no operational data reset; explicit path checks and whitespace check pass |

Screenshots of narrow/wide Manager and Staff screens, History filters and all three camera viewport sizes were visually reviewed. Local ignored evidence: `.artifacts/ui-followup-20261024/results.json`, `a11y-camera.json`, `local-preview.json`, screenshots, and `.artifacts/estock-mvp/results.json`.

The final two accessibility refinements were verified with their targeted probes after the 15-journey run, then included in the final production build. The full business suite was not repeated for those focus/scroll-margin-only changes.

## Recorded interaction evidence

| Element / flow | Observed result |
| --- | --- |
| Both How it works links | First click reaches the workflow fragment without a return scroll |
| Landing wordmark, Overview, Your team, Skip | Existing targets remain reachable; retained landing journey passes |
| Landing Sign in / Open demo | Existing login redirect/demo opens sign-in |
| Landing authenticated Sign out | Real isolated session ends; Sign in appears and leads to sign-in form |
| Sign-out error/loading/retry | Failed request retains Sign out and displays an error; retry disables during request then shows Sign in |
| Role choices / Sign in | Both real isolated role sessions land directly on Inventory |
| All header destinations | Corresponding page opens; active underline updates; no Stockroom or Back control |
| Account / Notifications | Manager or Staff immediately followed by Notifications; drawer opens, closes with Escape and retains role-scoped state |
| Inventory search / Add / Edit / Delete | Retained product setup, search, rename, Cancel, archive and history-preservation journeys pass |
| Take / Return / Confirm | Retained bounds, stale availability, keyboard and posting journeys pass |
| Take photo | Fake live camera opens, fits the available viewport and shows both controls |
| Take picture | Delayed encoding retains camera layout; ready image replaces it without scroll movement |
| Retake photo / Cancel camera | Camera reopens; Cancel restores the same previous preview |
| Retake photo / Take picture | New preview replaces the previous image |
| Remove image | Preview disappears, Create draft becomes disabled and capture remains available |
| Native mobile capture input | Emulated iPhone path opens file chooser, accepts an authored synthetic image and allows removal |
| Upload / Create draft / comparison | Retained local provider-stub extraction, temporary comparison, replacement/removal, save and reload journeys pass without premature stock posting |
| Draft review / Send / Recall | Retained frozen-send, correction and revision journeys pass |
| Staff Match / Short / Extra / Confirm | Retained immediate posting, all-missing delivery and Manager informational alert journeys pass |
| Provider failure / retry / discard | Retained error recovery and stock-neutral discard journey passes |
| Receipt history / Stock activity | Both sections open; search/date/type filters and details work; original attribution and receipt grouping remain |
| Refresh history / Refresh drafts | Retained journeys refresh saved records and show loading/error recovery |
| Browser Back / reload / server restart | Retained receipt navigation, sessions, checks, notifications and ledger preservation journey passes |

## Delivery Gate

Each PASS applies to the edited UI scope and evidence above.

### Hard Gate

- R-02 PASS: no em dash added to product copy.
- R-03 PASS: tested widths/landscape have no page overflow; camera and headings remain visible.
- R-17 PASS: stock/counts originate from application records or labelled synthetic verification fixtures.
- R-18 PASS: no testimonial introduced.
- R-23 PASS: reused assets; navigation changes explicitly requested by the user.
- R-24 PASS: all retained landing and role-appropriate header destinations work.
- R-25 PASS: sampled text contrast meets AA, minimum 5.43:1.
- R-26 PASS: changed controls and retained actions have recorded runtime outcomes above.
- R-27 PASS: empty Inventory/History/checks, refresh/loading, sign-out failure/retry and retained extraction/notification errors exercised.
- R-28 PASS: no FAQ introduced.
- R-32 PASS: visible focus, Enter/Escape, skip target and camera focus verified.
- R-33 PASS: source edited directly with apply_patch; temporary scripts verify behavior rather than rewrite product source.
- R-34 PASS: existing single light brand theme remains functional.
- R-35 PASS: final build and types pass; 15 journeys, 14 focused checks and three additional probes execute; screenshots reviewed.
- R-36 PASS: no invented business, security, performance or compliance claim.
- R-37 PASS: existing DESIGN.md direction and explicit user layout requests guide the work.
- R-38 PASS: product copy describes implemented controls; synthetic test evidence remains labelled.

### Purpose Gate

- R-01 PASS: existing blue palette retained; no gradient/glow introduced.
- R-04 PASS: no icon set/glyph added.
- R-06 PASS: Manrope retained for existing identity and readable labels.
- R-07 PASS: no background pattern added.
- R-08 PASS: no decorative arrow added.
- R-09 PASS: retained notification counts reflect stored records.
- R-10 PASS: no glassmorphism added.
- R-12 PASS: existing dialog elevation retained; no new shadow system.
- R-13 PASS: no glow added.
- R-14 PASS: redundant home task cards removed; record/task layouts remain content-specific.
- R-19 PASS: navigation/reveal motion has the orientation/feedback purpose above; reduced motion verified.
- R-22 PASS: no illustration introduced.

### Liveliness

- Dials PASS: ENERGY 2 / RHYTHM 2 / MOTION 2 declared before editing.
- Consistency PASS: calm blue emphasis and task-specific layouts retain the chosen dials.
- Focal point PASS: current page content or active camera leads the viewport.
- Whitespace PASS: existing grouping rhythm retained; camera grid keeps controls visible.
- Accent PASS: blue identifies the selected destination and primary action.
- Identity PASS: shared eStock wordmark, Manrope and blue underlines connect landing/workspace.
- Design Read PASS: existing direction declared before edits and recorded above.

### Craftsmanship and quality locks

- C-1 PASS: layout, type, colour, spacing, media, focus and motion have stated reasons.
- C-2 PASS: changed and retained controls have recorded outcomes.
- C-3 PASS: direct task navigation replaces the extra home step.
- C-4 PASS: narrow/wide/landscape, keyboard, empty/loading/error and reduced-motion checks pass.
- C-5 PASS: measured evidence is scoped; no fabricated claim.
- R-05 PASS: task-driven composition retained; no generic page sections added.
- R-11 PASS: existing rectangular controls and modest radii retained.
- R-15 PASS: action labels remain specific: Take picture, Retake photo, Remove image, Sign out.
- R-16 PASS: no marketing buzzword introduced.
- R-20 PASS: existing eStock identity retained across landing/workspace.
- R-21 PASS: light theme follows the established user-selected reference.
- R-29 PASS: blue/neutral palette retained; textual warning/error colours keep their existing roles.
- R-30 PASS: reference remains this product's landing page.
- R-31 PASS: major choices have written reasons above.

## Data reset and evidence limits

Subsequent explicit user instruction on 24 October authorised the local Stock activity cleanup. Four net-zero movement rows were backed up and deleted; the one product, zero stock, request guards and original session were preserved. API and actual browser empty-state checks pass. [Current maintenance evidence](../../PROJECT_CONTEXT.md) supersedes the pending-choice status recorded during the UI task below.

The user also asked how to delete History. Read-only local inspection found one product, total stock zero, four movement records, five request records and no drafts/receipts/notifications. Resetting that product and its stock history was presented as a concrete option; approval is still pending. No local operational product, movement, request or session was deleted by this follow-up. No permanent reset button or endpoint was added.

Camera checks use Chrome's fake media device and an emulated native file chooser, not a physical camera/phone. Provider responses are local stubs, not live Gemini. Real device capture, live OCR, provider retention and deployment remain unverified.

An extra probe through 127.0.0.1:3000 stalled at Opening inventory with an HMR WebSocket handshake error. The repository's existing development process was restarted in webpack mode. Server diagnostics and installed Next.js documentation identify the rejected 127.0.0.1 development origin; no allowed-origins configuration was changed. Final checks through the configured `http://localhost:3000` origin pass: actual unauthenticated landing/sign-in rendering, intercepted Manager Inventory/History/filter checks and all three camera/keyboard viewport probes, with no runtime/console errors in the landing/filter check. The app remains running there. The final production build passes separately. No cloud action, external message, dependency/credential change, commit, push or publication.
