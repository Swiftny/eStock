# Landing copy: document-assisted eStock

23 October 2026. User-authorised **text-only update**, retaining the existing style. This report covers landing/header text, page title/description and the related sign-in introduction/demo label. It does not verify the new inventory/OCR workflow.

## Changed files and preserved behaviour

Text only changed in `src/app/page.tsx`, `src/components/site-header.tsx`, `src/app/layout.tsx` and `src/app/login/page.tsx`. A whitespace/string-normalised source comparison confirmed identical non-copy structure; layout/style/action attributes and link destinations also compare identically. No CSS, token, font, animation, API, backend, schema, dependency, configuration or test source changed. Existing documentation changes and pre-existing `next-env.d.ts` remain intact.

The headline is “From receipt to stock. With your approval.” Product/role copy now explains document extraction, catalogue/alias matching, Manager correction/actual-receipt confirmation and Staff Take/Return. A visible note states that scanning is planned and the current demo uses the earlier workflow. Open demo links still target `/demo`; no new feature or route is advertised as working.

One editor handled frontend files and serial shared metadata/login/handoff changes. Explicit frontend scope check passes for landing/header. The full scope checker reports the existing cross-area documentation changes plus coordinated shared metadata/login/report paths; it cannot be represented as a single-area pass.

## Actual verification

- Four-file Biome check passes. Full-project lint remains blocked by pre-existing duplicate `requestId`/`productId` keys in unchanged `src/lib/server/forecast.ts`; full typecheck additionally reports unknown-type arguments/job identity there. Task-start hash confirms that backend file was not edited.
- Existing localhost dev server rendered the updated `/` and `/login`; no server was restarted. No production build or application test suite was run for this copy-only task. No OCR/PostgreSQL acceptance claimed.
- Landing checked at 320/375/768/1440px, login at 320/375/1440px: no document overflow or text escaping checked content containers.
- All nine landing links were exercised, including keyboard skip link, home, Overview, Your team, both How it works links, Sign in and both Open demo links. Login skip/home/back/demo links were exercised too. Legacy API requests were intercepted during demo destination checks; no stock forms or intake operations were performed. This does not establish legacy demo acceptance or byte-level runtime sidecar preservation.
- All nine landing links are keyboard reachable with a 3px focus outline; login skip link activates `login-main`. Reduced motion reports zero animated words and zero hidden sections.
- Measured 243 landing text elements after motion settled: minimum contrast **5.808:1**, no text below 4.5:1. Final landing console: zero errors/warnings. Expected intercepted API errors during legacy-demo destination checks are excluded from that landing-console statement.
- Final desktop/mobile and login screenshots visually inspected. A mobile capture taken before animation completion was replaced after checking zero unsettled words/hidden sections; no CSS change was needed.

Local screenshots: `.artifacts/landing-copy-20261023/estock-landing-copy-before-desktop.png`, `estock-landing-copy-desktop.png`, `estock-landing-copy-mobile.png`, `estock-landing-copy-login.png`. Browser checks are emulation, not physical-device or screen-reader certification.

## Scoped antislop Delivery Gate

Mode: during, session override. ui-ux-pro-max action-label guidance and antislop core read. Design direction: preserve the existing light-blue/Manrope presentation exactly; its historical ENERGY 2 / RHYTHM 3 / MOTION 2 remain. This is a copy edit, not a new visual design or adoption of the proposed teal palette.

### Hard Gate

- R-02 PASS: new rendered copy contains no em dash.
- R-03 PASS: four landing widths and three login widths have no overflow; settled mobile screenshot inspected.
- R-17 PASS: no invented performance statistics; one-shop/one-warehouse scope comes from the PRD.
- R-18 PASS: no testimonials or invented customer identities.
- R-23 PASS: no product visual assets or navigation structure created; existing identity/layout retained as requested.
- R-24 PASS: all navigation destinations exist and were exercised.
- R-25 PASS: 243 settled text elements measured, minimum 5.808:1.
- R-26 PASS: all landing links and login return/demo links navigate; existing login form behaviour is unchanged.
- R-27 PASS: no new asynchronous state introduced on the static landing; existing login loading/error controls remain unchanged and are not new workflow claims.
- R-28 PASS: no FAQ added.
- R-32 PASS: nine landing links keyboard reachable with visible 3px focus; both skip links activated.
- R-33 PASS: text edited directly in source with apply_patch; no runtime rewriting script or CSS injection.
- R-34 PASS: existing light theme retained, no theme toggle added.
- R-35 PASS within copy scope: changed pages ran on the existing dev server, screenshots reviewed and every landing link exercised; whole-project typecheck limitation is disclosed above.
- R-36 PASS: no invented security/performance/deployment claim; planned scanning and legacy demo are disclosed.
- R-37 PASS: explicit user direction preserves existing style; historical dials retained rather than generating a new design.
- R-38 PASS: product text follows the supplied/current PRD and distinguishes intended features from the working demo.

### Purpose Gate

- R-01 PASS: no gradient/glow or other effect added.
- R-04 PASS: no icon set or decorative icon added.
- R-06 PASS: existing Manrope/type styling retained for consistent readable stock copy.
- R-07 PASS: no background pattern added.
- R-08 PASS: no decorative arrows added.
- R-09 PASS: existing plain eyebrow identifies inventory; no capsule badge or new styling.
- R-10 PASS: no glass effect added.
- R-12 PASS: no shadow/elevation change.
- R-13 PASS: no glow added.
- R-14 PASS: existing role panels now compare the PRD's actual Staff/Manager responsibilities; no layout change.
- R-19 PASS: existing bounded word/reveal motion retained; reduced motion leaves all content visible.
- R-22 PASS: no illustrations added.

### Liveliness

- Dials PASS: existing ENERGY 2 / RHYTHM 3 / MOTION 2 preserved.
- Consistency PASS: source/style comparison and inspected screenshots retain existing scale, section rhythm and motion.
- Focal point PASS: receipt-to-stock headline remains the dominant existing hero treatment.
- Whitespace PASS: unchanged spacing separates hero, roles, AI explanation and workflow.
- Accent PASS: existing blue accent remains in headline/actions.
- Identity PASS: repeated stock/document terms and existing ruled role records identify the product.
- Design Read PASS: copy refresh within explicitly preserved style; no new design direction generated.

### Craftsmanship and quality locks

- C-1 PASS: each text change aligns old purchasing language with a specific new PRD workflow or clarifies demo status.
- C-2 PASS: all changed labels retain working destinations.
- C-3 PASS: existing sections now explain staff, managers, extraction and intake; no filler section added.
- C-4 PASS within checked scope: responsive/keyboard/reduced-motion checks and final screenshots recorded; no new UI state introduced.
- C-5 PASS: no fabricated claim, result or customer evidence.
- R-05 PASS: existing composition expressly preserved by the user; three steps correspond to upload, review and confirmed approval.
- R-11 PASS: all classes and existing control radii unchanged.
- R-15 PASS: Open demo names the actual destination instead of implying scanning is available now.
- R-16 PASS: concrete extraction/review language, no AI marketing superlatives.
- R-20 PASS: supplier descriptions, draft correction, base units and actual receipt make the copy specific to this product.
- R-21 PASS: existing user-selected light style retained.
- R-29 PASS: palette unchanged; no teal migration or additional colours.
- R-30 PASS: no reference design/assets copied.
- R-31 PASS: no visual decision changed; copy decisions map to the PRD and explicit text-only instruction.

No commit, push, merge, publication, cloud provisioning, paid model call or new application implementation. The new workflow still requires explicit instruction.

## User-supplied copy follow-up

Later on 23 October, the user supplied replacement hero-description and Staff/Manager/AI text. Applied that wording, including uppercase section labels and the existing planned-scanning note. The user separately selected “AI-assisted stock entry” for the eyebrow and requested brainstorming for the main headline. The main headline and title remain unchanged pending selection.

Only `src/app/page.tsx` application text changed in this follow-up. Non-copy source skeleton compares identically with the immediate pre-follow-up source; classes, links, motion and styles remain unchanged. Scoped Biome and explicit frontend scope pass. Browser checks at 320/375/1440px show no overflow; expected user copy is present and the final mobile screenshot was inspected. New copy adds no em dash, fabricated metric, testimonial or new capability claim; the scanning limitation remains visible.

Scoped Delivery Gate: R-02 PASS for supplied text; R-03 PASS for the three measured widths and inspected mobile capture; R-17/R-18/R-23/R-36/R-38/C-5 PASS for user-sourced wording and honest planned/live distinction; R-25 PASS by unchanged measured foreground/background styles; R-24/R-26/R-32/R-35 PASS by unchanged destinations/behaviour and current live rendering, with prior recorded click-through/keyboard evidence still applicable. All remaining per-item gate results above retain their unchanged source/style basis. No new UI states, assets, styling, dependencies, backend or application tests were introduced. The existing full-project forecast errors remain outside scope.
