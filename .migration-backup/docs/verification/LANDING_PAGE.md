# Landing-page verification and antislop Delivery Gate

21 October 2026, MYT. Scope: the first local eStock landing page and its synthetic manager-review simulation. **Result: PASS for this scope and the checks below.** This is not full PRD acceptance, production certification or platform-use evidence.

## E1. Environment and repository

- macOS; Node.js 24.16.0, npm 11.13.0.
- Safari 27.0.1 and Chrome 155.0.8059.85. Browser versions were read from their installed application metadata.
- Inspected `main`, tracking `origin/main`, and the existing files before editing. Remote: the team's Swiftny GitHub repository.
- HEAD remains `5b48691` (`add eStock PRD, build plan, and submission guidance`). No commit, push, reset or deployment was performed.
- `git diff --quiet -- LICENSE` passed. The original Apache licence is unchanged. Team-installed `.agents/` files were preserved; repository-local `.codex` remains absent as requested.

## E2. Commands actually run

| Check | Actual result |
| --- | --- |
| Dependency installation | Exact dependencies installed and package-lock.json created; clean reinstall with `npm ci --cache /private/tmp/estock-npm-cache --offline` succeeded, 31 packages added |
| `npm run dev -- --port 3000` | Started and served the page; used for initial browser review |
| `npm run format` | Completed; fixed the final safe-integer guard's formatting |
| `npm run lint` | Final run passed: eight source files checked by Biome |
| `npm run typecheck` | Final run passed with no TypeScript errors |
| `npm run build` | Final run passed with Next.js 16.4.2; `/` prerendered as static content |
| `npm start -- --port 3000` | Final production build started successfully; used for final interaction checks |
| Production HTTP checks | `/` and `/licenses/manrope-OFL.txt` returned HTTP 200 |
| `npm audit --audit-level=high --cache /private/tmp/estock-npm-cache` | Completed successfully: found 0 vulnerabilities at check time |
| `git diff --check` | Passed |
| Local documentation links | Checked the nine updated/new handoff and design documents; no missing local Markdown targets |

The initially tried ESLint configuration brought development-tool advisories and was removed in favour of Biome. The final dependency set was audited. The first fixture import emitted a Node module-detection warning; the verified assertion rerun used Node's documented `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` flag. An attempted obsolete Node flag was discarded. These did not change the fixture or application behaviour.

## E3. Arithmetic verification

Node assertions imported the actual `src/lib/demo-fixture.ts` with TypeScript stripping. All eight checks passed:

| Value or invariant | Verified result |
| --- | --- |
| Horizon = lead time + review | 3 + 7 = 10 days |
| Fixed example demand | 10 × 10 = 100 units |
| Raw purchase need | max(0, 100 + 20 − 45 − 25) = 50 |
| Pack/MOQ rounding | 60 units |
| Pack divisibility | 60 % 12 = 0 |
| MOQ | 60 ≥ 12 |
| Confirmed inbound within horizon | Day 3 ≤ day 10 |
| On-hand fixture | 45 units |

This is PRD §7.5's fixed arithmetic fixture. No model inference was run. UI checks also confirmed that approval/rejection leave available stock at 45.

## E4. Reference and visual review

The actual [Attio home page](https://attio.com/) was opened and its hero, product and table sections inspected in Safari. The user-requested qualities were adapted through readable typography, generous spacing, fine boundaries and a prominent product preview. No branding, images, source or copy was imported.

eStock's visual reasons and declared Design Read are in [DESIGN.md](../../DESIGN.md): **ENERGY 1 / RHYTHM 2 / MOTION 1**. The page uses stock records, quantity equations and manager decisions as its recurring product motif. There is no decorative raster artwork or stock photo.

Screenshots were inspected through the browser-control tool during the session, including desktop hero, workflow, feature records/calculation, human-control section, phone hero/menu, phone table, and phone review/outcome states. Captures are in the session tool transcript; no screenshot fixtures were added to the repository.

## E5. Responsive checks

Chrome's responsive viewport controls were used. Width measurements came from the rendered page through its visible DevTools console, rather than source assumptions.

| Viewport | Observed result |
| --- | --- |
| 375 × 812 | Hero wraps, menu replaces desktop navigation, stock facts stack, table columns fit, workflow reads vertically, dialog scrolls within the viewport |
| 768 × 812 | Desktop navigation and paired feature layouts fit; records remain readable |
| 812 × 375 | Landscape header and content fit; vertical scrolling remains available |
| 1440 × 900 | Wide recommendation sheet, six-stage workflow and varied feature compositions fit |
| Native desktop window, about 1512 CSS px wide | Safari/Chrome visual review of hero and subsequent sections |
| Chrome 200% page zoom | Inspected enlarged feature text and controls; content wraps without the observed collisions or clipping |

Measured pairs `(innerWidth, documentElement.scrollWidth)` were **(375,375), (768,768), (812,812), (1440,1440)**. The 375 px check also found no rendered element extending beyond the viewport's right edge and no visible link/button/input/select below 44 × 44 px, excluding the offscreen skip link.

A final-build approval with a **500-character note** was inspected at 375 px: the note wrapped, the page width stayed 375, and the dialog's `clientWidth` and `scrollWidth` both measured **335 px**. Its sticky Close control remained available while the dialog scrolled.

## E6. Interaction record

These actions were performed in the local browsers. Initial validation/rejection checks used Safari; Chrome covered scenario selection, keyboard checks, phone controls and the final production smoke checks.

| Control or case | Observed result |
| --- | --- |
| Header and footer eStock home links | Navigated to `#page-top` |
| Header How it works, Features, Human control | Navigated to their existing sections |
| Hero See how it works | Navigated to `#how-it-works` |
| Closing Revisit the recommendation | Navigated to `#recommendation-preview` |
| Footer How it works | Navigated to `#how-it-works` |
| Mobile Menu / Close menu | Opened and closed by clicking the same labelled toggle; expanded state changed |
| Mobile menu keyboard / Escape | Enter opened it, Tab reached links, Escape closed it and returned focus to Menu |
| Mobile menu links | Selected section navigation closed the menu; How it works and Features were checked with keyboard activation |
| Try the preview / Review recommendation / Try a manager review | Each opened the labelled local review dialog |
| Global review from Analysis unavailable | The dialog named the fixed reorder example; after closing, the selector showed Reorder due with quantity 60. Reopening an existing decision preserved its outcome |
| Scenario: Not enough history | Showed data-needed explanation and no purchase quantity |
| Scenario: Analysis unavailable | Showed visible failure explanation and no invented quantity |
| Scenario: No restock needed | Showed no purchase to review |
| Return to the reorder example | Returned both empty/data-needed scenarios to the working fixture |
| Reload the working example | Returned the failed-analysis scenario to the working fixture |
| Scenario loading transition | A temporary DOM observer recorded `aria-busy=true` and the actual loading text, then `aria-busy=false` with the data-needed state; the observer was disconnected and removed |
| Quantity 61, no note | Inline pack-size and change-note errors; focus moved to quantity |
| Unsafe integer input 9007199254740993 | Approval blocked with quantity validation |
| Edited quantity 72, with a note | Approved in demo; recorded 60 → 72 and the note; stock stayed 45 |
| Edited quantity 72, 500-character note | Final production build accepted it; activity text wrapped on phone |
| Reject without a note | Blocked with an inline reason requirement; focus moved to note |
| Reject with a reason | Rejected in demo; reason recorded; no supplier request and stock unchanged |
| Approve default 60, no note | Approved in demo; visible local outcome and activity record |
| View demo outcome | Reopened the existing decision and activity after closing the dialog |
| Reset demo | Cleared decision, activity, note and validation; restored quantity 60 and focused quantity |
| Close / Escape | Both closed the dialog; keyboard Escape returned focus to the launch control |
| Refresh | Cleared the browser-memory simulation |

The loading text explicitly says the demo is switching scenarios and no forecast service is called. The observer captured this real DOM transition because its 450 ms duration was shorter than reliable manual screenshot timing; no simulated result was substituted for evidence.

## E7. Accessibility, console and motion

- Tab/Shift+Tab, Enter and Escape were used. The skip link became visible, Enter focused main content, and the next Tab reached the hero CTA.
- The review dialog initially allowed Tab to leave its controls for browser chrome. Explicit first/last wrapping was added and verified: Shift+Tab from Close reached Reject, Tab returned to Close, then Tab reached quantity. Escape returned to Review recommendation.
- Approval focuses the outcome heading; Reset focuses the restored quantity field. Focus rings were visually inspected.
- Accessibility-tree inspection showed one H1, sequential section/product headings, named navigation, table headers/caption, visible field labels and named controls. Inline errors are associated with their fields; outcomes use a status region. This is not a screen-reader certification.
- Chrome reduced-motion emulation was enabled and measured: `matchMedia(...reduce).matches=true`, root scroll behaviour `auto`, and button transition duration `0s`. Emulation and page zoom were restored afterwards.
- The final production reload showed **0 console messages** and **No issues**. Initial development review exposed only a favicon 404, fixed with an empty data favicon; React/HMR development notices were not treated as application errors.

## E8. Contrast evidence

A rendered-style check examined **177 text-bearing elements** in the normal page. It resolved transparent ancestors to their solid backgrounds and calculated WCAG relative-luminance contrast. **Minimum 4.93:1; zero below 4.5:1.** This calculation covers the page's solid surfaces, not hypothetical themes.

The antislop-human bundled `contrast-check.py` separately verified:

| Text / background | Ratio | Normal-text result |
| --- | --- | --- |
| Muted `#606b64` / green wash `#edf3ed` | 4.93:1 | PASS |
| Success `#244d38` / soft green `#deeadf` | 7.72:1 | PASS |
| Rejection `#9b3c33` / soft red `#fae9e5` | 5.78:1 | PASS |
| Field error `#9b3c33` / white | 6.80:1 | PASS |

The control boundary `#7a857d` on white measured 3.83:1 in the earlier checker call. It is a non-text border, so the relevant 3:1 control-boundary threshold is met; the script's normal-text verdict was not used as a border verdict. Status words explain meaning in addition to colour.

## E9. Content and implementation review

- `rg` inspection of `src/` found no em dash, TODO placeholder, empty/hash-only destination, `fetch`, Axios call or external URL. Fragment targets were also checked in the rendered browser: **0 missing targets**.
- The supplied headline/supporting text are retained. All new UI/documentation is English.
- Each visible number is part of the synthetic PRD example or an actual local manager action. There are no customer logos, testimonials, saving/accuracy statistics or certification claims.
- The page labels synthetic previews, fixed arithmetic and local simulation. It describes live forecasting, inventory and supplier integrations as unconnected. It does not claim Orbyte or WhatsApp integration.
- Client handlers update in-memory React state only. There is no inventory API, authentication, purchase endpoint, supplier message, persistent outbox or storage integration.
- Plain CSS/source components were written directly with apply_patch; Biome formatting was used. No helper script patched source/CSS to add a feature.
- All seven user-requested sections serve the supplied product story. There is no price section, blog, chatbot, generic FAQ, fake testimonial section or customer-logo strip.

## antislop Delivery Gate

Manual evaluation against the installed **antislop 3.2.21** core, in the user's **during** mode. Each item below is evaluated for the implemented landing page and the evidence above. Absence-based checks identify the actual absent technique; they do not claim an unrun feature passed.

### Block 1: Hard Gate

| Item | Status and evidence |
| --- | --- |
| R-02: unapproved em dashes | PASS: source text scan found none in UI; existing quoted/source documentation is outside this new-UI check (E9) |
| R-03: mobile overflow/broken layout | PASS: four width measurements match; phone table/workflow/dialog screenshots and 500-character note fit (E5) |
| R-17: unsupported statistics | PASS: content review found only labelled fixture quantities and no adoption/savings/accuracy statistics (E3, E9) |
| R-18: fictional testimonials | PASS: no testimonial or fictional customer section exists (E9) |
| R-23: unapproved assets/navigation | PASS: user requested text identity and exact navigation; original contextual symbols have written reasons; no invented photo/logo assets (E4, DESIGN.md) |
| R-24: ghost navbar links | PASS: all three header destinations clicked; rendered missing-target count is zero (E6, E9) |
| R-25: insufficient text contrast | PASS: rendered minimum 4.93:1; error/success/rejection colour pairs separately checked (E8) |
| R-26: inactive controls | PASS: every control and its state/recovery action is recorded with an actual result (E6) |
| R-27: missing loading/empty/error state | PASS: all four scenarios selected; actual busy/loading DOM transition captured, then recovery checked (E6) |
| R-28: irrelevant FAQ | PASS: no FAQ exists; no template questions were added (E9) |
| R-32: missing keyboard/focus | PASS: skip link, menu, dialog wrapping, Enter, Escape and focus return checked (E7) |
| R-33: external patch scripts | PASS: direct source edits and standard formatting only; no feature-patching helper (E9) |
| R-34: broken theme toggle | PASS: no toggle exists; the user's single light theme is implemented (E4) |
| R-35: unrun app/build/click-through | PASS: final build/run, production smoke, HTTP, clear console and full control record exist (E2, E6, E7) |
| R-36: fabricated trust claims | PASS: content contains no security/compliance/customer/performance assertions (E9) |
| R-37: missing direction | PASS: user supplied direction; Design Read and dials were declared before implementation and recorded (E4, DESIGN.md) |
| R-38: unlabelled fabricated content | PASS: synthetic previews and local outcomes are labelled; team identity comes from the supplied context (E6, E9) |

### Block 2: Purpose Gate

| Item | Status and evidence |
| --- | --- |
| R-01: default gradients/glows | PASS: solid neutral/green surfaces; no gradient or glow treatment (source CSS, E4) |
| R-04: irrelevant/default icons | PASS: original records, demand, recommendation, approval, sending and receiving symbols convey their associated step; reasons recorded (DESIGN.md) |
| R-06: unjustified typography | PASS: Manrope selected for open forms/readability and stable figures; no large monospace or widely tracked uppercase heading system (DESIGN.md) |
| R-07: unjustified background patterns | PASS: no dot/grid/blueprint background exists (source CSS, E4) |
| R-08: decorative arrows everywhere | PASS: marketing CTAs use text; the recommendation arrow signals opening details, and checks indicate approval (E4, E6) |
| R-09: decorative capsule badges | PASS: compact rectangular labels convey synthetic state/approval status; no category pill above H1 (E4, E6) |
| R-10: overused glass | PASS: no glassmorphism; solid header, cards and dialog (source CSS, E4) |
| R-12: universal shadows | PASS: elevation is limited to the main preview and modal, for product focus and an overlay; remaining sections use dividers (DESIGN.md) |
| R-13: glow on everything | PASS: no glow effects exist (source CSS) |
| R-14: identical feature cards | PASS: connected ledger, calculation sheet, review state and receiving timeline use different content representations (E4, E5) |
| R-19: template animation/motion mismatch | PASS: brief control transitions and anchor scrolling only; no entrance/floating/bounce animation, and reduced motion checked (E7) |
| R-22: generic illustration | PASS: no generic character/blob illustration; visuals are product records and process information (E4) |

### Block 3: Liveliness

| Item | Status and evidence |
| --- | --- |
| Explicit dials | PASS: ENERGY 1 / RHYTHM 2 / MOTION 1 declared before generation and in DESIGN.md |
| Dials match output | PASS: calm neutral/green presentation, varied content sections and restrained control motion inspected (E4, E5, E7) |
| Focal points | PASS: headline/recommendation sheet, connected flow, feature-specific evidence and manager decision card anchor their sections (E4) |
| Structural whitespace | PASS: distinct hero, workflow, feature-row and closing spacing separates decisions and records (DESIGN.md, E4) |
| Deliberate accent | PASS: forest green identifies purchasing/manager actions; amber/red have status-only roles (tokens, E8) |
| Identity motif | PASS: stock quantities, repeated purchase equation and aligned ledger records connect the page (E3, E4) |
| Pre-generation Design Read | PASS: declared before implementation; retained in DESIGN.md |

### Block 4: Craftsmanship and quality locks

| Item | Status and evidence |
| --- | --- |
| C-1: intentionality | PASS: major type/colour/spacing/composition decisions have one-line reasons (DESIGN.md) |
| C-2: functional completeness | PASS: section links, scenario selection/recovery and manager controls have recorded outcomes (E6) |
| C-3: content-driven composition | PASS: seven requested sections; record/quantity/approval/receiving representations follow their content (E4, E9) |
| C-4: resilience | PASS: tested widths, enlarged text, blocked scenarios, validation, long notes and keyboard controls fit the defined scope (E5–E7) |
| C-5: evidence over claims | PASS: fixture and capabilities are explicitly bounded; no testimonials/statistical promises (E3, E9) |
| R-05: template layout/rhythm | PASS: six real workflow stages and differing feature treatments; no pricing/logo/terminal/footer template (E4, E9) |
| R-11: uniform pill shapes | PASS: 6 px controls, 12 px sheets and compact rectangular status labels have different roles (tokens/CSS, E4) |
| R-15: generic CTAs | PASS: See how it works, Review recommendation, Try a manager review and Revisit the recommendation identify actual destinations/actions (E6) |
| R-16: AI buzzwords | PASS: content review found factual forecast/rules explanations rather than generic AI marketing (E9) |
| R-20: interchangeable identity | PASS: fixture equation, pack rules, inbound dates and unchanged physical stock form the product-specific visual story (E3–E6) |
| R-21: unjustified dark default | PASS: light theme follows the explicit user direction; no required toggle was deferred (DESIGN.md) |
| R-29: uncontrolled palette | PASS: off-white/white, charcoal and forest green; muted text and semantic amber/red variants are shared tokens (E8, tokens) |
| R-30: product clone | PASS: actual reference was inspected; eStock's copy, six-stage process, arithmetic and review interactions are original and tied to its PRD (E4, E9) |
| R-31: unexplained visual decisions | PASS: major choices and their reasons are written in DESIGN.md and DECISIONS.md |

## Limits and next action

Not run: physical-device testing, an assistive screen reader, a full automated accessibility audit, performance benchmarks, Replit deployment, authentication, real inference/messaging or the inventory PRD acceptance suite. No PASS is claimed for those checks. Browser emulation and calculated contrast are useful local evidence, not a claim that every device or assistive setup has been tested.

The page is ready for the user's review. Keep application work paused at this boundary. After further authorisation, finish M0 contracts/platform access and begin the M1 ledger/real-inference spike in [BUILD_PLAN.md](../plans/BUILD_PLAN.md).
