# eStock: visual direction

## Current direction: 24 October 2026

Latest follow-up: every Clear/Delete confirmation uses a question, an explicit destructive button and Cancel, with no typed phrase. Manage products includes Back to inventory. Notification entries separate title, description, timestamp and actions with 12px vertical gaps and wrap within the drawer. Tab underlines are positioned relative to each button so they cannot extend across the page. The existing Manrope wordmark is exported to a self-contained SVG image with its blue initial and original font, used consistently in landing, sign-in and workspace headers. Upstream landing dots are kept inside the landing stacking context so the requested animation remains visible behind content. Session checks show a pending account control, reject stale responses after Sign out and revalidate restored pages. Existing ENERGY 2 / RHYTHM 2 / MOTION 2 and reduced-motion behavior remain.

The landing header is now the shared geometry reference for the demo: one frame, Wordmark component, 1440px maximum, fluid 16–40px side gutters and consistent navigation type/spacing. At <=850px navigation occupies the next row. Small-screen action spacing accommodates the unread badge without moving navigation to another row. Workspace pages retain Scan receipt's 1240px maximum content frame and shared responsive gutters; stable scrollbar space prevents horizontal shifts between short and long content. Page height follows its content. Existing colours, focus and reduced motion remain. [Measured responsive checks](docs/verification/WORKSPACE_LAYOUT_2026_10_24.md).

Inventory rows now contain only Take/Return, with the Actions heading aligned to the right edge of those controls. Manager opens Manage products from the heading to edit or delete, keeping product maintenance outside the stock-taking row. The secondary screen retains Inventory's navigation state and existing search/list/dialog styles. Its permanent Delete all inventory section sits below a divider and now uses click confirmation. Existing blue/Manrope, 44px controls, mobile reflow, focus and reduced-motion styling remain. [Earlier verification](docs/verification/INVENTORY_MANAGEMENT_2026_10_24.md).

Stock activity and the notification drawer expose separate permanent Clear actions. Each expands an inline question with a destructive final button and Cancel, using the existing red/neutral controls. The descriptions distinguish deleted details from retained stock balance or pending checks. The layout reflows within the phone-width drawer; cleared/new notification counts update without restoring stale responses.

The user requested matching `/demo` to the existing landing page's colours and animation. This supersedes the earlier teal proposal below. The demo now inherits the landing palette from `src/styles/tokens.css`: paper `#FCFDFF`, white surfaces, ink `#202D40`, muted text `#586579`, blue `#2862BA`, deep blue `#204F96` and blue wash `#EFF6FF`. Amber and red retain their textual warning/error roles. Manrope and the blue initial in the eStock wordmark connect both interfaces.

Design read: a calm inventory workspace for Managers and Staff, ENERGY 2 / RHYTHM 2 / MOTION 2. The existing task layout stays compact and scannable. The pending-review panel uses the landing Manager card's blue wash to prioritise receipt preparation and physical checks. Page/sign-in entrances follow the landing's 500ms, 12px fade-and-rise; underlines use 180ms; control colours use 160ms. Dialogs use a shorter 180ms, 6px entrance to acknowledge the triggering action. Reduced motion disables these animations and transitions.

The final user-supplied landing headline is “Less time typing.” in ink and “Faster stock updates.” in blue. The bold line is “Stock entry starts with a photo.” The final shortened description is “AI reads product names and quantities from your supplier documents.” These are product copy, not measured time-saving claims. [Current verification and Delivery Gate](docs/verification/DEMO_PALETTE_2026_10_24.md).

The latest receipt-review layout uses one editable column per scanned line. Gemini's description, date and whole-number quantity appear directly in controls; quantity has large minus/plus targets. A brief inline cue marks uncertain OCR without repeating the full source text or showing a product-match badge. The comparison-image panel and generic review banner are removed. Orders, similar completed receipts and package-unit mismatches retain contextual warnings. Drafts holds active work; completed and discarded records are in Receipt history, where permanent clearing has a separate destructive confirmation. Notification count and Staff mode buttons have extra spacing.

## Staff receiving revision: 24 October 2026

Staff sees compact product rows with a native disclosure arrow on the left. Opening a row reveals “How much did you receive?” with the base unit visible. Expected quantities prefill the fields and remain the count for untouched rows; 0 represents missing goods. Edited counts and invalid-input cues remain visible when collapsed. The previous modes, difference checkbox and Short/Extra selector are removed. The server derives discrepancy status after confirmation, and completed receipt details retain the outcome. Existing field styles, focus, validation and mobile spacing are reused.

Later user-requested UI follow-up: Inventory replaces the separate Stockroom home. Role-specific feature navigation sits with the wordmark in the header and wraps on narrow screens; the role is immediately followed by Notifications. Landing alone holds session-aware Sign in/Sign out controls. Short descriptions and removal of workspace eyebrows/Back buttons put the current task first. Existing blue/Manrope, 4/8px spacing, 180ms underlines and 500ms page entrances retain ENERGY 2 / RHYTHM 2 / MOTION 2. History uses quiet underline section selectors and the same muted placeholder text for both filters. A clipped landing root prevents reveal transforms extending the page's scrollable height. The camera fits into the available viewport below the header; its media stays mounted until a photo is ready, and the resulting image keeps that media height. Retake is available next to Remove under the image, while the source camera/upload controls retain their layout to avoid jumps. No assets or dependencies added.

The existing blue palette, Manrope, 4/8px rhythm, visible focus and reduced-motion behavior remain. ENERGY 2 / RHYTHM 2 / MOTION 2 stays selected. Stockroom has short status rows and compact task buttons; separate feature screens keep home concise. The blue primary button identifies the next task, the drawer keeps notification detail out of home, and textual Short/Extra/Received labels carry status without relying on colour. Native modal dialogs provide keyboard confinement/Escape and opener focus; Delete names the product and remaining stock exactly once. No new visual assets, icon library or dependencies were introduced. Existing page/dialog motion acknowledges navigation and the triggering action. [Current evidence and Delivery Gate](docs/verification/STAFF_RECEIVING_2026_10_24.md).

## Historical direction: 23 October 2026

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
