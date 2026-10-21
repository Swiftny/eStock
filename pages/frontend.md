# Frontend · Vitto

[Team pages](README.md) · [Demo checklist](demo.md)

## Existing implementation

The landing page is `src/app/page.tsx`. The persistent demo entry is `src/app/demo/page.tsx`, with the main interface in `src/components/demo-app.tsx`. Shared components are in `src/components/`; styles are in `src/styles/` and `src/app/globals.css`. The landing example uses `src/lib/demo-fixture.ts` and is separate from saved demo records.

## Next tasks

- [ ] Review the landing page and demo with the team; fix confusing copy and navigation.
- [ ] Check stock forms, purchase review, receiving, activity and manual what-if on desktop and mobile.
- [ ] Check loading, empty, validation and server-error states; preserve input after failed requests.
- [ ] Check keyboard focus, labels, readable contrast and reduced motion.
- [ ] Keep supplier, quantity, unit, cost, arrival and warnings visible during approval.
- [ ] Keep synthetic data, simulated messages and baseline/model sources clearly labelled.

Use the existing light visual direction in `DESIGN.md` and the UI skills required by `AGENTS.md`. Coordinate API response changes with William. Ask Maxi for synthetic edge cases and Marco for accurate forecast labels.

## Review evidence

### Latest: blue header demo CTA

User requested a blue top-right Open demo button. Only `src/components/site-header.tsx` application code changed, reusing existing `button-primary` instead of `button-outline`. Computed header/hero background both `rgb(40, 98, 186)`, white text; existing accessible primary palette and hover/focus styles retained. Playwright captured desktop/mobile (`.artifacts/blue-header/`), mobile screenshot inspected and button clicked through to `/demo`. Lint, TypeScript, isolated webpack build, diff whitespace and explicit frontend scope checks pass. Full checker still includes preserved earlier shared/other-area changes. Existing root runtime-folder blocker remains; preview `http://localhost:3006/?v=blue-header`.

Delivery Gate: R-25 PASS, reuses the already measured primary foreground/background pair; R-24/R-26 PASS, actual CTA click opens `/demo`; R-03/C-4 PASS, unchanged button dimensions with mobile screenshot inspected; R-35 PASS for isolated frontend, rebuilt/run/captured. All other prior per-item gate evidence remains applicable: no content, layout, animation, asset, token, route, role or backend change. No tests/dependencies added, no commit/push/publication.

### Latest: what, when and how much to order

User requested clearer How it works copy about AI suggestions and reminders. Only application path `src/app/page.tsx` changed: three steps now explain record sales/stock, get a what/when/how-much reorder suggestion, then in-workspace review prompts and manager approval. The AI panel names the inputs and keeps the current baseline/no-live-AI note. No external notification or live inference is claimed. Existing “Stock planning for SMEs” tagline retained following the acronym/full-form question.

Lint, TypeScript and isolated webpack production build passed. Playwright confirmed exact copy and baseline note, no overflow at 320/375/768/1440, target outline none and empty landing console. Mobile capture visually inspected; current desktop/mobile captures `.artifacts/reorder-copy/`. Latest preview `http://localhost:3006/?v=reorder-copy`. Root pages/src-app startup blocker unchanged. Explicit page/work-page scope and diff-whitespace checks pass. No runtime/backend test rerun or new tests/dependencies for this copy-only follow-up. Serial handoff documentation updates PROJECT_CONTEXT.md and README; previous unrelated changes preserved.

Delivery Gate: prior per-item checks below remain applicable to unchanged styles, motion, controls and routes. Re-reviewed current copy/layout:

- R-02/R-17/R-18/R-36/R-38/C-5 PASS: no em dash, invented metric/testimonial or live-AI/external-reminder claim; baseline limitation retained and workspace prompts named explicitly.
- R-03/C-4 PASS: longer copy fits four measured widths; mobile capture inspected, no overflow.
- R-24/R-26/R-32 PASS: unchanged navigation destinations; middle workflow link clicked and target has no outline; existing focus styling unchanged.
- R-25 PASS: no colour/style changes; prior settled 5.81:1 minimum applies to the same text styles.
- R-35 PASS for isolated frontend: rebuilt and ran after copy edit, with DOM and screenshot verification; root runtime blocker separately disclosed.
- C-1/C-3/R-15/R-16/R-20/R-31 PASS: concrete requested record/suggest/remind/approve explanation, no filler or buzzwords.
- R-01/R-04/R-06/R-07/R-08/R-09/R-10/R-11/R-12/R-13/R-14/R-19/R-21/R-22/R-23/R-27/R-28/R-29/R-30/R-33/R-34/R-37/C-2/Liveliness PASS: existing visual system, finite/reduced-motion handling, explicit direction and tested controls retained; no new visual asset, theme, asynchronously loaded state, FAQ, feature section or runtime script added.

### Latest: Employee, Manager, AI explanation and intact action labels

User requested Employee/Manager wording, AI purpose, correction of the middle How it works animation, and removal of the footer eStock wordmark. Application changes are only `src/app/page.tsx` and `src/styles/refinement.css`. The label “For employees” replaces “For stock staff”; existing server role identifiers remain. The AI row explains demand forecasting, rule-based purchasing quantity and manager approval, with a visible current-demo baseline/no-live-AI note. Header wordmark remains; footer wordmark/link are removed.

Reproduced animation defect: with all three middle-link word animations sampled at 550ms, their opacities were 0.594/0.303/0.042 and vertical shifts 4.06/6.97/9.58px. Hero actions now render intact text nodes, with one finite control entrance and a stable hover underline. After fix, the middle link has zero animated-word descendants, one control-enter animation, one 83.90x19px text line, final translation 0 and hover underline scale 1. The hero content/scroll word entrances remain.

Actual checks: lint, TypeScript and isolated webpack production build pass. Root pages/src-app conflict remains unchanged. Latest separate preview `http://localhost:3006/?v=employee-ai-footer`; evidence `.artifacts/employee-ai/`. Desktop/mobile screenshots visually inspected, widths 320/375/768/812/1440 measured without overflow, reduced motion disables control/word animation and leaves zero hidden sections. Middle-link mobile target top 111.90px clears 105px header without outline. Keyboard focus retained; settled text contrast minimum 5.81:1, zero violations. Landing console empty. Employee/manager/AI headings and baseline limitation confirmed in DOM. Footer removal checked in final source/build.

Delivery Gate rechecked: prior unchanged gate items below remain current, with these evidence updates:

- R-03 PASS: no overflow at five widths; final desktop/mobile layout inspected.
- R-19 PASS: interactive labels no longer split into different transforms; intact entrance, hover and reduced motion checked.
- R-23 PASS: requested role copy, AI explanation and footer removal; no new visual asset.
- R-24/R-26/R-32 PASS: section links resolve, middle anchor scrolls without section outline, keyboard controls retain visible focus. Removed footer link has no stale navigation target.
- R-25 PASS: settled text minimum 5.81:1; transient opacity during requested entrances excluded.
- R-35 PASS for isolated frontend: compiled, run, photographed and animation reproduced/verified; root build blocker disclosed.
- R-36/R-38/C-5 PASS: AI's intended role distinguished from the baseline-only current demo; no live-inference claim or fictitious capability.
- C-1/C-3/R-31 PASS: human responsibilities and model/rule distinction explain product decisions; action-label grouping fixes measured misalignment.
- C-2/C-4 PASS within checked scope: intact labels, responsive layout, anchor, keyboard and reduced motion verified.
- R-37/Liveliness PASS: existing ENERGY 2 / RHYTHM 3 / MOTION 2 retained, bold stock/workflow headings and ruled role lists remain.
- R-02/R-17/R-18/R-27/R-28/R-33/R-34 PASS: no em dash, invented metrics/testimonials, new async data state, FAQ, runtime patch or theme toggle.
- R-01/R-04/R-06/R-07/R-08/R-09/R-10/R-12/R-13/R-22 PASS: existing font/colour system; no gradients/glows, icons, background patterns, arrows, badges, glass, shadows or illustration added.
- R-14/R-05/R-11/R-15/R-16/R-20/R-21/R-29/R-30 PASS: requested employee/manager comparison and relevant AI explanation, standard controls, concrete actions, stock-specific copy, light/blue identity and no copied assets/buzzwords.

Same tools: Codex, antislop during, ui-ux-pro-max local motion guidance, shell and Playwright; no new library dependency/API. Serial documentation integration updates context/design/README; existing unrelated changes preserved. Full scope check still includes earlier other-area/shared edits; explicit frontend paths pass. No backend tests rerun for this presentation-only edit. No commit, push or publication.

### Latest: word entrances, scroll reveal, compact roles and section navigation

User asked for all hero words to animate initially, sections to appear when reached, denser/bolder staff/manager information, stronger “A clear path” and a top navbar with hover animation/direct links. Scope: page, header, landing-motion and refinement CSS. Existing API/data/demo permissions and shared tokens are untouched. Content-driven role height removes the blank auto-margin; labels/headings are 800 weight, descriptions 550, task rows 600. Desktop role height changed from 548px to 399px. Workflow heading is 68px at 1440px and 800 weight. The layout remains the existing light-blue landing.

Hero has 34 animated word spans with a short fade/rise and bounded stagger. Offscreen role panels, workflow and footer are marked pending only after the client observer starts; they become in-view once and are unobserved. Server HTML is visible by default. Reduced motion skips observer hiding and disables word/section animations. Overview links to top, Your team to roles, How it works to workflow; mobile nav wraps to a second row. Link hover draws a 180ms underline. Section targets have no tabindex/outline; keyboard control focus remains.

Actual evidence `.artifacts/word-motion/`: inspected desktop/mobile final captures and role/workflow viewport captures. Normal-motion inspection found four offscreen pending sections at opacity 0; scrolling revealed roles/workflow at opacity 1, then the footer. Reduced motion reported animation none, zero pending and zero hidden sections. Normal hover reached underline scale 1 with 0.18s duration. Desktop roles target top 111.97px clears 81px header; mobile roles/workflow targets 111.88/112.14px clear 105px header, outline none. All nav links and both demo CTAs were exercised. Keyboard Tab gives a 3px blue outline. Landing console empty; demo entry's expected unauthenticated 401 remains. Widths 320/375/768/812/1440 had no document overflow. Settled text contrast: 175 DOM text elements, minimum 5.81:1, no violations. Final CTA word wrappers preserve normal spaces within flex links.

Lint, TypeScript and isolated webpack build pass. Final preview `http://localhost:3005/?v=words-final`. Root folder-layout blocker remains; this is not deployment proof or a root build pass. Scoped paths pass the explicit frontend checker; full checker still includes preserved pre-existing other-area/shared edits and serial documentation integration. No backend test rerun was needed for presentation-only edits. No commit/push/publication.

Delivery Gate rechecked against the current implementation; unchanged historical items below retain their current source-review basis:

- R-03 PASS: no overflow at five measured widths and final mobile/desktop screenshots inspected.
- R-19 PASS: one consistent, finite fade/rise vocabulary, only visible section animates; reduced motion has no hidden sections or animations.
- R-23 PASS: user explicitly requested word/scroll/hover animations and direct navbar destinations; no assets added.
- R-24/R-26 PASS: all three navigation links and demo CTAs work; role panels remain informative.
- R-25 PASS: settled normal text exceeds 4.5:1, minimum 5.81:1. Opacity is transient during requested entrances.
- R-32 PASS: keyboard focus remains visible; all fragment targets clear the sticky header without a target outline.
- R-35 PASS for isolated frontend: built, ran and inspected via Playwright; root build limitation remains disclosed.
- R-37/Liveliness PASS: existing explicit design dials and user direction retained; bold reorder/workflow focal points and compact ruled role records give identity.
- C-1/C-3/R-31 PASS: all changes address requested reading order, emphasis and role clarity, documented in DESIGN.md.
- C-2/C-4 PASS within checks: responsive widths, keyboard focus, nav actions, scroll triggers and reduced motion verified.
- R-02/R-17/R-18/R-27/R-28/R-33/R-34/R-36/R-38 PASS: source re-reviewed; no em dash, invented metrics/testimonials, asynchronous landing data, FAQ, runtime patch, theme toggle, security/model claim or fictional capability.
- R-01/R-04/R-06/R-07/R-08/R-09/R-10/R-12/R-13/R-22 PASS: no glow/gradient, icon/font change, background pattern, decorative arrows/badges, glass/shadows or illustrations.
- R-14/C-5/R-05/R-11/R-15/R-16/R-20/R-21/R-29/R-30 PASS: requested role comparison, factual stock workflow, ordinary controls, concrete actions and existing light/blue identity; no buzzwords, copied branding or filler sections.

Same tools: Codex, antislop during, ui-ux-pro-max local motion/reflow guidance, installed Next.js guide, shell and Playwright. Serial documentation integration updates PROJECT_CONTEXT.md, DESIGN.md and README. No new dependency, external message or infrastructure purchase.

### Latest: role cards, animated motto and plain workflow anchor

User follow-ups: two square staff/manager information cards, animation for the middle tagline, no outline on How it works target, and “Stock planning for SMEs”. Only `src/app/page.tsx` and `src/styles/refinement.css` application paths changed. The existing role permissions were read to verify copy; they were not modified. Two informational panels are square on desktop and content-sized on phones. The motto performs a single 650ms fade/rise, with a 140ms second-phrase delay; no loop, typewriter, new dependency or hidden accessible text. Removing the workflow target's tabindex removes the unwanted outline without weakening keyboard focus on controls.

Actual checks: lint and TypeScript pass. Isolated webpack production build passes; latest preview `http://localhost:3004/?v=sme`. Root folder conflict remains. Playwright verified 548x548 desktop cards and final no-overflow widths 320/375/768/812/1440, with corrected 335px-wide mobile cards. An initial mobile overflow was fixed before delivery. Desktop and final mobile screenshots were visually inspected; final label was confirmed in the DOM after bypassing older cached HTML. Evidence: `.artifacts/role-landing/`.

Animation measurement at 200ms: opacity 0.801 and translateY 1.99px; final opacity 1 and translation 0. Reduced motion: animation `none`, opacity 1. Bottom navigation: desktop scroll 808.5px against approximately 808px maximum, section outline `none`; mobile target top 111.80px vs 73px header, outline `none`. Keyboard Tab still shows the skip-link outline. Both demo CTAs, both workflow links and both home links were exercised. Landing console empty; expected unauthenticated `/api/demo` 401 on demo entry. Computed contrast: 39 visible text elements, minimum 5.43:1, no violations.

Delivery Gate re-evaluation: previous per-item gate below remains applicable to unchanged content and links, with these current evidence updates:

- R-03 PASS: initial mobile overflow corrected; five final widths measured, desktop/mobile captures inspected.
- R-14 PASS: two role panels have matching geometry to compare real staff/manager responsibilities, expressly requested by the user.
- R-19 PASS: one short, finite motto animation only; sampled start/end and reduced-motion override verified.
- R-23 PASS: user requested both panels and animation; no new asset/icon was created.
- R-24/R-26 PASS: all remaining landing links exercised and destinations resolve; role panels are informational, without fake click affordances.
- R-25 PASS: current rendered-text minimum 5.43:1.
- R-32 PASS: section click has no outline, while actual keyboard control focus stays visible.
- R-35 PASS for isolated frontend: build/run, screenshots and click-through performed; root runtime blocker remains disclosed.
- R-37/Liveliness PASS: existing ENERGY 2 / RHYTHM 3 / MOTION 2 retained; bold reorder heading, blue accent and ruled role/task composition remain the focal hierarchy.
- C-1/C-3/R-31 PASS: roles separate daily work from purchasing authority; square comparison and finite animation have written purposes in DESIGN.md.
- C-2/C-4 PASS within tested scope: links, five widths, animation and reduced-motion checked.
- R-02/R-17/R-18/R-27/R-28/R-33/R-34/R-36/R-38 PASS: source/content re-reviewed; no em dash, invented metrics/testimonials, asynchronous landing state, FAQ, runtime patch, theme switch, security/model claim or fabricated role capability added.
- R-01/R-04/R-06/R-07/R-08/R-09/R-10/R-12/R-13/R-22 PASS: no gradients/glows, icon system, font change, background pattern, arrows, promotional badges, glass, shadows or illustration added.
- C-5/R-05/R-11/R-15/R-16/R-20/R-21/R-29/R-30 PASS: concrete stock-role content, normal controls, actual demo action, no buzzwords/fictional claims, existing light neutral/blue identity retained, no copied reference assets.

Tools: same Codex, ui-ux-pro-max local animation guidance, antislop during, shell and Playwright. No new library API was introduced. Serial handoff documentation changes preserve previous work. No backend tests were rerun for these presentation-only edits; no new tests/dependencies added. Scoped frontend paths pass the explicit scope check; the full checker still reports pre-existing other-area changes and shared documentation integration, which were preserved.

### Latest: simpler text-first landing, 21 October 2026

This follow-up supersedes the preview/dialog landing evidence below. The user explicitly requested no purchase recommendation on the landing and bolder title/motto, inspired by Jack & Jill, Vogelhaus and Attio.

Frontend paths: `src/app/page.tsx`, `src/components/site-header.tsx`, `src/styles/refinement.css`. The page now has one bold hero, one short workflow and a small footer. The headline is weight 800 and motto weight 700. Purchase preview, interactive example, manager-review content, repeated closing CTA and redundant mobile menu are removed from the rendered landing. Recommendation modules remain in source, unused by this page. `/demo`, tokens, shared controls, database and backend code were not edited.

Separately coordinated serial documentation integration updates DESIGN.md, PROJECT_CONTEXT.md, README and the tools declaration. All previous unrelated working-tree changes remain. No commit, push or publication.

Actual checks: lint and TypeScript pass. A fresh isolated copy excluding root team documentation passed `npm run build -- --webpack`, with `/`, `/demo`, `/api/demo`, `/api/session`; production preview is `http://localhost:3003`. The existing root `pages/` documentation conflict is unchanged, so this is not a claim that root fresh startup/build works.

Playwright evidence under `.artifacts/simple-landing/`: desktop/mobile before and after captures, Jack & Jill/Attio reference captures and browser logs. Final desktop 1440px and mobile 375px screenshots were visually inspected. Vogelhaus text was inspected; screenshots twice timed out awaiting fonts, so no complete visual inspection is claimed. No document overflow at widths 320/375/768/812/1440, including 812x375 landscape. Rendered DOM confirms the purchase preview and dialog are absent. Both demo CTAs open the existing role selector. Both workflow links, both home links and keyboard skip-link were exercised; all fragment targets resolve. Sticky header clears the workflow target. Tab shows the 3px blue focus outline; Enter focuses `main`. Reduced motion gives automatic scrolling, 0s header transition and zero active animations. Contrast check: 26 visible text elements, minimum 5.81:1, no violations. Landing console: zero errors/warnings; the unauthenticated demo request returns expected 401.

Current antislop Delivery Gate, evaluated against this simpler page:

- R-02 PASS: no em dash in rendered copy.
- R-03 PASS: five viewport widths measured without overflow; final desktop/mobile screenshots inspected.
- R-17 PASS: no metrics, stock quantities or performance claims displayed.
- R-18 PASS: no testimonials.
- R-23 PASS: user expressly requested simplified content/navigation; existing wordmark reused, no visual asset created.
- R-24 PASS: all five fragment links resolve; both demo links open `/demo`.
- R-25 PASS: visible text contrast minimum 5.81:1.
- R-26 PASS: every landing link exercised; no remaining forms/buttons with missing behaviour.
- R-27 PASS: static landing has no asynchronous data state; existing demo entry retains its role/loading/error handling.
- R-28 PASS: no FAQ.
- R-32 PASS: keyboard skip-link, Enter activation and visible focus tested; no hidden menu/dialog remains.
- R-33 PASS: source changed directly with patches; no runtime patch script.
- R-34 PASS: light theme retained without a theme toggle.
- R-35 PASS for this frontend: isolated production build/run and all landing links checked; root folder blocker separately disclosed.
- R-36 PASS: honest synthetic/simulated footer; no new model/security claim.
- R-37 PASS: user supplied typography-first direction; existing design dials retained, reasons recorded in DESIGN.md.
- R-38 PASS: copy describes implemented stock/approval/receiving capabilities.
- R-01 PASS: no gradients/glows.
- R-04 PASS: no decorative icon set.
- R-06 PASS: existing Manrope, heavier weight for hierarchy, normal case and restrained step figures.
- R-07 PASS: no decorative background pattern.
- R-08 PASS: no decorative arrows.
- R-09 PASS: no promotional pills.
- R-10 PASS: solid sticky header without glass effects.
- R-12 PASS: no elevated preview/cards remain.
- R-13 PASS: no glow.
- R-14 PASS: no feature-card grid; steps are one actual sequential workflow.
- R-19 PASS: no entrance animation; reduced-motion control override checked.
- R-22 PASS: no illustration.
- Liveliness PASS: bold reorder question focal point, blue quantity line, structural whitespace and ruled stock-workflow steps retain a product-specific identity.
- C-1 PASS: typography/content decisions recorded in DESIGN.md.
- C-2 PASS: all remaining links exercised.
- C-3 PASS: only product explanation, workflow and footer remain.
- C-4 PASS within checks: five widths, desktop/mobile visual review, keyboard, reduced motion and empty console.
- C-5 PASS: no invented facts or social proof.
- R-05 PASS: no SaaS filler sections; three steps condense the actual record/review/follow-through workflow requested by the user.
- R-11 PASS: ordinary control radii retained, no pill system introduced.
- R-15 PASS: concrete demo and workflow actions.
- R-16 PASS: no AI marketing buzzwords.
- R-20 PASS: existing reorder headline, manager control and receiving copy identify the inventory use case.
- R-21 PASS: requested light theme.
- R-29 PASS: existing cool neutral/blue palette unchanged.
- R-30 PASS: no reference assets/branding copied; stock-specific copy and workflow retained.
- R-31 PASS: written purpose for hierarchy, colour, spacing and content reduction.

### Light-blue refinement, 21 October 2026

Selected area: `frontend`. Codex was the only editor in this task. Existing root documentation, team pages and scope-script changes were preserved. No commit, push, publication, service purchase or real supplier message was performed.

Changes: shorter navigation labels, clearer hero/supporting copy, a calculation link in place of the preview's repeated demo CTA, more readable synthetic disclaimer, slightly tighter hero spacing and restrained link feedback. Existing Manrope, split layout, recommendation arithmetic, example states and all routes remain. No application data or permission code changed.

Separate serial integration: `src/styles/tokens.css` adds blue brand tokens with legacy aliases, and `src/app/globals.css` applies blue primary buttons while preserving green success labels. This intentionally affects the inventory workspace. `DESIGN.md`, `PROJECT_CONTEXT.md` and the tools declaration record the integration and evidence. Shared changes require human integration review; this is not a claimed single-area clean working tree.

Verification performed:

- Current Attio desktop/mobile/scroll inspection through Playwright; screenshots in `.artifacts/blue-refinement/attio-*.png`. Third-party console errors occurred on Attio; they are not eStock results.
- Actual eStock before/after desktop and mobile captures in `.artifacts/blue-refinement/before-*.png` and `after-*.png`. Initial captures include entrance-animation frames; final captures waited for entrances to settle. Workspace desktop/mobile and expanded-example screenshots are in the same folder.
- No document overflow at 320, 375, 768, 812 and 1440 CSS pixels; the expanded example was included in the small/tablet/landscape checks. Final 375px and 1440px images were visually inspected.
- Desktop workflow target top 111.99px vs header bottom 77px; mobile example target top 112.21px vs header bottom 73px. Sticky scrolled state appears and section links resolve.
- Mobile menu opens/closes, Escape returns focus, section selection closes it and focuses the destination. Tab/Enter open the calculation disclosure. The skip link focuses `main` with a visible blue 3px outline. Dialog Tab/Shift+Tab remain inside, Escape closes and returns focus.
- Scenario selector exercises missing history, failed analysis, covered stock and ready states; return/reload buttons work. Manager review launch, rejection-note validation, rejection with note, reset, approval and close were clicked. Approved success remains green, and the fixture keeps 45 units on hand.
- Reduced motion reports `animation-name: none` on hero/preview and `scroll-behavior: auto`.
- Computed text contrast: expanded landing 106 visible text elements, minimum 5.31:1; workspace 29 elements, minimum 5.81:1. These are DOM foreground/background calculations, not a complete accessibility certification.
- `/demo` opens from landing CTAs, obtains a server-issued manager session and renders the synthetic workspace. The separate preview uses its own generated database, not a copy of the team's database. Its initial unauthenticated `/api/demo` response is the expected 401. The landing production check had zero console errors/warnings.
- `npm run lint`, `npm run typecheck`, `npm test`: passed; 38 tests passed, zero failed. Tests cover purchasing arithmetic, permissions, persistence and workflow integrity.

Runtime limitation: root `npm run dev` and `npm run build` fail because root `pages/` documentation conflicts with `src/app`. This predates the frontend edits. No folder was moved and no config workaround was inserted. A separate application copy under `.artifacts/blue-refinement/build-check`, excluding root `pages/` documentation, passed `npm run build -- --webpack`; `/`, `/demo`, `/api/demo` and `/api/session` were generated. That production copy runs on port 3002. This proves the refined application compiles, not that fresh root startup is fixed. System/integration owner: agree a non-routing documentation location, update links/scope map together, then rerun the normal root commands.

### antislop Delivery Gate

Applies to the frontend refinement and serial colour integration checked above. Repository fresh-start readiness remains separately blocked as described above.

- R-02 PASS: edited visible copy contains no em dashes.
- R-03 PASS: measured document width equals viewport at all five checked widths; final screenshots show contained text.
- R-17 PASS: quantities derive from the unchanged labelled synthetic fixture; no impact metrics added.
- R-18 PASS: no testimonials or customer identities added.
- R-23 PASS: existing wordmark/icons/navigation structure retained; no new visual asset created.
- R-24 PASS: every fragment destination resolves; demo CTAs open `/demo`.
- R-25 PASS: sampled visible landing/workspace text exceeds 4.5:1; minimum ratios recorded above.
- R-26 PASS: links, menu, disclosure, scenario controls and review actions have working behaviour and were exercised.
- R-27 PASS: missing-history, analysis-error, covered-stock and ready states rendered; existing transient loading state remains.
- R-28 PASS: no FAQ added.
- R-32 PASS: skip link, disclosure, menu Escape and dialog focus wrapping verified with real key presses.
- R-33 PASS: application changes written directly to source with patches; no runtime patch script added.
- R-34 PASS: light-only interface retained; no advertised theme toggle.
- R-35 PASS for refined application: app run, isolated production build and landing control click-through completed; normal root build blocker explicitly excluded from this claim.
- R-36 PASS: synthetic, simulated and no-live-forecast labels retained; no security or performance claim added.
- R-37 PASS: supplied visual direction and ENERGY 2 / RHYTHM 3 / MOTION 2 declared before edits.
- R-38 PASS: product facts and fixed quantities retained from the implemented workflow/fixture.
- R-01 PASS: no gradient/glow added; blue surface identifies the recommended quantity.
- R-04 PASS: existing stock-specific symbols retained; no generic decorative icon set added.
- R-06 PASS: existing Manrope and tabular quantities retained for readable operational records.
- R-07 PASS: no decorative grid/background pattern added.
- R-08 PASS: new calculation link uses text and underline, without decorative arrows.
- R-09 PASS: no promotional capsule; existing approval label communicates a real example state.
- R-10 PASS: solid sticky header retained; no glass layers added.
- R-12 PASS: only the focal purchase preview has selective elevation.
- R-13 PASS: no glow added.
- R-14 PASS: existing problem, workflow, example and decision-ledger compositions serve distinct content.
- R-19 PASS: existing short entrances retained; reduced-motion override verified.
- R-22 PASS: no illustration added; the existing stock quantities remain the product visual.
- Liveliness PASS: explicit dials, quantity focal point, structural whitespace, one blue brand accent and repeated ledger/pack motif remain visible in screenshots.
- C-1 PASS: colour, spacing and preview decisions are explained in DESIGN.md.
- C-2 PASS: modified controls and existing landing interactions were exercised.
- C-3 PASS: no decorative section added; each existing section explains stock decisions.
- C-4 PASS within tested scope: mobile/desktop, keyboard, example states and reduced motion checked; no full accessibility certification claimed.
- C-5 PASS: no fabricated customer, impact or model claims introduced.
- R-05 PASS: existing varied compositions retained; no template section added.
- R-11 PASS: small control radii and distinct sheet boundaries retained.
- R-15 PASS: actions name the demo, workflow, calculation or review.
- R-16 PASS: edited copy uses concrete stock/planning language without AI marketing claims.
- R-20 PASS: pack rounding, order quantity and approval ledger maintain eStock's inventory identity.
- R-21 PASS: requested light theme remains.
- R-29 PASS: cool neutrals and one blue brand family; semantic green/amber/red retain distinct roles.
- R-30 PASS: Attio informs hierarchy/restraint; existing split stock preview and content remain original to eStock.
- R-31 PASS: major decisions and their purposes are recorded in DESIGN.md.

Scope result: `python3 scripts/check_scope.py frontend --files src/app/page.tsx src/components/site-header.tsx src/styles/refinement.css pages/frontend.md` passes for the four frontend paths. The required full `python3 scripts/check_scope.py frontend` fails because it includes pre-existing team/shared changes and the explicitly coordinated shared colour/documentation integration. These changes were preserved; no full-worktree scope pass is claimed. `git diff --check` passes. README now records the fresh-start limitation and the temporary preview.

Use the existing lint, typecheck and build checks in the root README for code changes. Record actual browser checks and remaining issues alongside your task. A successful build does not establish usability.

## Parallel work boundary

Read [integration rules](integration.md). For code changes, select the `frontend` area and run `python3 scripts/check_scope.py frontend` before handoff. Shared files require a separate coordinated task. Demo rehearsal is shared; only one active task edits the demo interface at a time.
