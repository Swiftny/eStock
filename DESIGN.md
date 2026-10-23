# eStock: document-intake visual direction

23 October 2026. The local document-intake demo follows the supplied calm English/teal direction. This revision preserves that design while separating receipt/activity history and adding temporary draft comparison. Actual tokens are in `src/components/estock-app.module.css`; the palette below preserves the original proposal. [Current UI verification and limits](docs/verification/MVP_REVISION_VERIFICATION_2026_10_23.md) distinguish desktop-width checks from physical devices/cameras. [Earlier visual rationale/evidence](docs/archive/2026-10-23-before-document-intake/DESIGN.md.txt) remains historical.

## User-provided direction

A calm, tidy, professional English interface for Manager document review and simple Staff stock actions. Use Linear's hierarchy and quiet navigation, and Shopify's compact, scannable product-list principles as conceptual references supplied by the PRD. These principles are not copied screens/assets and the reference sites were not independently visually reviewed during this documentation task.

| Proposed role | Colour |
| --- | --- |
| Background | `#F8FAF8` |
| Surface | `#FFFFFF` |
| Main text | `#1F2937` |
| Secondary text | `#64748B` |
| Teal accent | `#0F766E` |
| Divider | `#E5E7EB` |
| Warning | `#B45309` |
| Error | `#B91C1C` |

These are source proposals, not installed CSS tokens or verified accessible pairs. Future implementation must measure contrast, focus and text/status usage against actual surfaces. Teal serves primary actions/active state; Low stock and uncertain extraction need text as well as colour.

## Proposed information priorities

Manager: Overview (products/Low stock/pending drafts), Inventory/search/Add product, Scan receipt, saved Drafts/review and full History. Review must distinguish raw document values from approved product/base-unit quantity, uncertain matches, Document date and eventual server Approved at. Actual-receipt confirmation must be clear before Approve stock intake; document type alone never proves delivery.

Staff: search and stock list with **Take** and **Return**, quantity and **Confirm**, followed by updated stock. Do not expose setup, scan, drafts, approval or full History. Backend permission checks remain part of the specification; navigation visibility is not enforcement.

For phones, use readable product rows/cards without essential wide-table overflow; support camera/upload, line correction and stock forms. Show missing fields/ambiguity with clear labels and preserve corrections on failure. Reopened drafts must explain that the original image is unavailable and needs re-upload. Keep financial/purchasing/debug detail out of these product flows.

## Future UI requirements

Read **ui-ux-pro-max** and **antislop** before future UI planning/implementation/review, resolving installed paths through the current catalog. Preserve the project's selected antislop **during** mode and its mode-source notice rules from AGENTS.md. Apply the Delivery Gate with actual runtime/browser evidence before UI delivery. A written palette/specification cannot pass it.

Future checks must include readable measured contrast, labelled inputs, textual statuses, visible keyboard focus, mobile touch usability, loading/empty/error/conflict states and reduced motion. No new asset, icon library, font or styling dependency is selected here. Suitable existing controls/font can be reviewed for reuse after implementation is authorised.
