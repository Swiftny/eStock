# eStock visual direction

Current direction, 21 October 2026. The user authorised a cohesive refinement of the existing light, minimal, professional identity, informed by the actual Attio website. English UI, readable stock information, a focused preview and progressive disclosure take priority over decorative effects.

## Design Read

Reading this as: a replenishment product for SME owners, managers and stock staff, with a light ledger-like visual language. Landing page: **ENERGY 2 / RHYTHM 3 / MOTION 2**. Operational workspace: **ENERGY 1 / RHYTHM 2 / MOTION 1**. These replace the earlier landing-only dials.

## Decisions and purpose

| Choice | Reason |
| --- | --- |
| Existing locally hosted Manrope, tabular figures | Open letterforms support plain operational copy; stable numeral widths make stock quantities easy to compare. |
| Off-white, charcoal and forest green | Neutral surfaces keep numbers readable; restrained green marks purchase decisions. Amber/red communicate explicit warnings alongside text, not alone. |
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

## Reference inspection and scope

On 21 October the existing page and its anchor navigation were inspected in Safari before edits. Attio's desktop navigation menu, changing hero product preview and scrolled product sections were inspected in Safari. Its actual 375 px mobile composition and menu were also inspected in Chrome. eStock adapts the hierarchy and focused product presentation; it does not copy the brand, assets, copy or complete layout.

The hero's 45-stock / 60-order preview is the labelled fixed PRD fixture, not model inference. The preserved example manager dialog uses browser memory. The `/demo` workspace persists real local synthetic records and a SIMULATED supplier outbox. Neither preview is presented as live AI or real supplier messaging.

## Verification

Both requested skills were read and applied. The catalog's installed antislop core at `~/.agents/skills/antislop/SKILL.md` was readable; the older plugin path in AGENTS.md was missing. Mode: during, explicit session override. ui-ux-pro-max searches were used for the existing Next.js stack and readable forms; the broad navigation search returned no match, and a narrower form search was reviewed. One API action route is used to keep shared validation/idempotency consistent across the workflow, despite the skill's general Server Actions preference.

Actual responsive, keyboard, contrast, reduced-motion, click-through and Delivery Gate evidence is recorded in [the workflow verification report](docs/verification/WORKFLOW_2026_10_21.md). Do not treat a written design rationale as test evidence.
