# eStock visual direction

Current direction, 21 October 2026. The latest user request replaces the landing preview with a simpler text-first presentation inspired by Jack & Jill, Vogelhaus and Attio. Bold English copy, clear next actions and generous spacing take priority. The earlier preview decisions below are retained as implementation history; the operational workspace is unchanged.

## Current landing refinement

Latest follow-up: the two human-role labels are “For employees” and “For managers”. A concise full-width row below them explains AI forecasting separately from deterministic buying rules and manager approval, with the current baseline-only demo limitation visible. This is an explanation, not a purchase preview. Interactive hero labels now enter as one piece rather than split words; the middle How it works link uses the navbar's smooth underline feedback to avoid staggered label fragments. The footer wordmark is removed at the user's request, retaining only synthetic/simulation and team/event text. Header identity remains.

Latest follow-up supersedes the square geometry and single-motto entrance below: hero text now reveals by word, and role/workflow/footer content enters once upon reaching its viewport section. The same fade/rise language and bounded delays maintain MOTION 2; navigation never scroll-jacks. Server-rendered copy remains readable without the observer; reduced motion shows everything immediately. The role panels now have content-driven height, tighter padding and gaps, no auto-margin before task rows, and stronger type. These changes address the user's concern that role content was too thin and spaced out. “A clear path” is a large bold workflow heading. Three direct navigation links use a short underline hover animation; mobile uses a separate navigation row to preserve target size. Existing ENERGY 2 / RHYTHM 3 / MOTION 2 remain.

Latest addition: two square role panels explain staff recording/receiving versus manager purchasing approval. They use neutral and pale-blue surfaces to distinguish responsibility, with aligned ruled task lists rather than decorative icons. On narrow screens they stack and grow with the text instead of enforcing a clipped square. The middle motto enters once with a small opacity/rise stagger (650ms, second phrase delayed 140ms); reduced motion removes it. The main headline remains immediately visible. The label is “Stock planning for SMEs”. The bottom workflow anchor has no tabindex or click outline; link/control keyboard focus remains intact. Current verification is in pages/frontend.md.

The title uses the existing Manrope at weight 800 and the short motto at 700. Two large headline lines create the focal point; blue highlights the quantity question. A short explanation and one primary demo CTA explain what to do next. The three compact workflow steps explain recording, approval and follow-through without dashboard widgets, arithmetic, dialogs, a separate approval section or a repeated closing CTA. A single section destination fits directly in the mobile header, so no menu is necessary. Existing dials ENERGY 2 / RHYTHM 3 / MOTION 2 describe a quiet page with varied hero/workflow/footer scale and restrained control feedback; entrance effects are omitted for immediate readability.

The blue palette, local font and stock-specific copy retain eStock's identity. No reference assets, copy, illustrations or branding were copied. Jack & Jill and Attio were opened and visually reviewed through Playwright. Vogelhaus content was inspected, but its screenshots timed out while loading fonts. See `pages/frontend.md` for actual checks and `.artifacts/simple-landing/` for captures. Previous preview and browser-memory-example descriptions below no longer describe the rendered landing page.

## Design Read

Reading this as: a replenishment product for SME owners, managers and stock staff, with a light ledger-like visual language. Landing page: **ENERGY 2 / RHYTHM 3 / MOTION 2**. Operational workspace: **ENERGY 1 / RHYTHM 2 / MOTION 1**. These replace the earlier landing-only dials.

## Decisions and purpose

| Choice | Reason |
| --- | --- |
| Existing locally hosted Manrope, tabular figures | Open letterforms support plain operational copy; stable numeral widths make stock quantities easy to compare. |
| Cool white, navy and light-blue emphasis | Pale-blue purchase surfaces separate recommendations; accessible darker blue identifies actions and focus. Green is reserved for success, with amber/red warnings alongside text. |
| Split hero with a narrow, deliberate headline and one compact purchase sheet | The question and concrete purchase answer are visible together on desktop; mobile reads them in one sequence. |
| Accent only the quantity question | It emphasizes how much to buy without colouring every word. |
| One application CTA and a workflow anchor | People can either use the working app or understand the process; there is no competing signup path. |
| Fixed-height sticky header, solid white after scrolling | Navigation stays legible with a border/background transition and no layout jump. Blur adds no useful information here. |
| Problem statement, connected workflow, expandable calculation and decision ledger | Different compositions explain different ideas; repeated benefit grids were removed. |
| Repeated aligned quantity rows, purchase packs and decision records | This motif belongs to replenishment rather than generic SaaS decoration. |
| Short actionable workspace rows | Product, timing, quantity, reason and next action are the daily task. KPI cards and decorative charts would compete with that task. |
| Calculation/history/model metadata inside labelled details | Supporting evidence remains available without making people read every metric before acting. |
| Supplier, quantity, full estimated cost, arrival and warnings visible in approval review | Progressive disclosure must not hide facts needed for informed purchasing. |
| Stock entry, orders, What-if and audit as separate workspace views | Each view has one task; imports/configuration remain secondary to everyday recording. |
| Small control radii, ruled records and one elevated hero preview | Boundaries organise records; selective elevation identifies the main product preview. |
| Light theme | It preserves the user's explicit direction and readable stock forms. No theme switch is advertised. |
| Text identity and existing contextual symbols | No new raster assets, avatars, illustrations or copied Attio assets are needed to explain stock decisions. |

## Motion

Use short opacity/transform entrances, native smooth anchors and 140–180 ms control feedback. The hero text rises slightly while the purchase sheet enters from the side. Workflow steps use a small reading-order stagger; later sections alternate a rise and side entrance. The original synthetic example transitions between actual selectable states and manager outcomes.

The workspace avoids scroll effects. Loading, success and errors reflect real requests; the default adapter is labelled as a baseline calculation. Content is visible without IntersectionObserver or animation. Reduced-motion CSS removes entrances/transitions and the existing global rule disables smooth scrolling. No parallax, scroll hijacking, pinning, autoplay headlines or new animation dependency is used.

## Blue palette refinement, 21 October 2026

The user requested a refinement of the existing page, retaining the existing Manrope typography, split hero, fixed arithmetic preview and routes. ENERGY 2 / RHYTHM 3 / MOTION 2 remain unchanged. Blue highlights the quantity and actions; ledger rows and pack quantities retain the stock-specific identity. The approval section uses a cool neutral surface rather than a large brand-colour block. The preview's repeated demo button becomes a calculation link, and its disclaimer uses plain language. Navigation labels are shorter while the destinations remain unchanged.

Playwright inspected the current [Attio homepage](https://attio.com/) at desktop and mobile widths and after scrolling. Its restrained navigation, large type, spacing and framed product presentation inform the refinement; no assets, branding or copy were imported. The reference has a sticky navigation surface during scrolling. Reference screenshots and before/after eStock captures are saved under `.artifacts/blue-refinement/` locally.

Serial integration changed `src/styles/tokens.css` and `src/app/globals.css`, with Codex as the sole editor. The `--brand*` tokens hold the new palette; legacy `--green*` aliases preserve workspace compatibility. Dedicated success tokens preserve the green success labels. Amber/error tokens remain unchanged. No demo component or backend file was edited. Scope and actual verification are recorded in [the frontend work page](pages/frontend.md).

## Reference inspection and scope

On 21 October the existing page and its anchor navigation were inspected in Safari before edits. Attio's desktop navigation menu, changing hero product preview and scrolled product sections were inspected in Safari. Its actual 375 px mobile composition and menu were also inspected in Chrome. eStock adapts the hierarchy and focused product presentation; it does not copy the brand, assets, copy or complete layout.

The hero's 45-stock / 60-order preview is the labelled fixed PRD fixture, not model inference. The preserved example manager dialog uses browser memory. The `/demo` workspace persists real local synthetic records and a SIMULATED supplier outbox. Neither preview is presented as live AI or real supplier messaging.

## Verification

Both requested skills were read and applied. The catalog's installed antislop core at `~/.agents/skills/antislop/SKILL.md` was readable; the older plugin path in AGENTS.md was missing. Mode: during, explicit session override. ui-ux-pro-max searches were used for the existing Next.js stack and readable forms; the broad navigation search returned no match, and a narrower form search was reviewed. One API action route is used to keep shared validation/idempotency consistent across the workflow, despite the skill's general Server Actions preference.

Actual responsive, keyboard, contrast, reduced-motion, click-through and Delivery Gate evidence is recorded in [the workflow verification report](docs/verification/WORKFLOW_2026_10_21.md). Do not treat a written design rationale as test evidence.
