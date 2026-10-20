# eStock landing-page design

21 October 2026. Direction supplied by the user; implementation decisions below apply that direction to the first landing-page stage.

## User direction

- Light, minimal, orderly and professional, with readable typography and generous spacing.
- The product preview is the main visual. Tables, status labels and workflow diagrams should feel like product UI.
- Restrained accents and small animations that explain interactions.
- Attio is a visual reference. Its current hero and product/table sections were inspected visually in Safari on 21 October. eStock uses original content, components and styling.
- Use the supplied hero headline and supporting text, the seven requested sections, working navigation and English copy.

## Design Read

Reading this as: a replenishment landing page for SME stock managers, in a calm, light product-focused visual language, dial ENERGY 1 / RHYTHM 2 / MOTION 1.

## Implementation choices and reasons

| Decision | Reason |
| --- | --- |
| Soft off-white, charcoal and one forest-green accent | The neutral surface keeps stock quantities readable; green identifies the recommendation and manager action. |
| Manrope, hosted locally, with tabular figures | Its open forms keep dense stock labels approachable; stable numeral widths make comparisons easier. |
| Large two-line hero above a wide recommendation sheet | The headline introduces the decision; the sheet immediately shows the product's concrete output. |
| A repeated quantity equation and aligned record rows | These are specific to replenishment and make the origin of a recommendation visible. |
| Thin dividers, small control radii and one elevated preview | Boundaries organize ledger-like information; elevation draws attention to the primary preview. |
| Six connected workflow stages, vertical on phones | The actual process has six stages, and a vertical flow preserves their reading order on small screens. Supplier acknowledgement is explained between request and receiving. |
| A records table, quantity calculation, manager-review treatment and order timeline | Each feature gets the representation that explains it, instead of repeating identical feature cards. |
| Light theme throughout | The user explicitly chose a light presentation for this stage. |
| Short hover, focus and state transitions only | Motion confirms interaction without competing with numbers; reduced motion removes transitions and smooth scrolling. |
| Text wordmark and contextual symbols only | The user requested text identity; symbols explain records, approval or movement rather than adding decorative assets. |

## Source and scope of the example

PRD section 7.5 provides the fixed arithmetic fixture: 10 units/day, 3-day lead time, 7-day review, 100 units demand, 20-unit buffer, 45 units on hand and 25 confirmed inbound. Raw need is 50 units; packs of 12 round the recommendation to 60 units. The 25 units arrive inside the ten-day horizon. This is a synthetic arithmetic example, not actual model inference.

The preview's approval, quantity editing and rejection happen in browser memory. A local activity record explains each outcome. No purchase, message or external request is created. On-hand stays 45 throughout manager review. Refresh/reset clears the simulation. Global review launchers select the working reorder example, so the dialog cannot leave an unavailable-analysis scenario behind an approvable quantity. The dialog names the example being reviewed.

## Skill guidance

Used ui-ux-pro-max's design-system search and Next.js guidance. The broad search returned motion-heavy styling and proof/pricing suggestions that do not fit this brief; a narrower minimalism search was also reviewed. The user's direction and PRD control the final choices. No unverified search output was persisted as a design system. Next.js advice to keep interactive client components at the leaves is applied.

Apply antislop 3.2.21 in during mode, including UI, copywriting, human/accessibility and responsive-layout guidance. Delivery Gate evidence belongs in docs/verification/LANDING_PAGE.md after actual checks.
