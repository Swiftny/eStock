# Frontend · Riakudu Vittorios Surjoraharjos

[Team](README.md) · [Integration](integration.md) · [DESIGN.md](../../DESIGN.md)

23 October 2026. The documentation pivot was followed by user-authorised landing-copy changes, preserving existing style. Landing/header/meta/sign-in text now describes document-assisted inventory; the linked demo remains the legacy replenishment application. No new stock/OCR functionality was implemented. Prior frontend work and detailed Delivery Gates are preserved [in the snapshot](../archive/2026-10-23-before-document-intake/docs/team/frontend.md.txt) and original verification reports.

Copy changed only in `src/app/page.tsx`, `src/components/site-header.tsx`, shared `src/app/layout.tsx` metadata and `src/app/login/page.tsx` introduction/demo label. CSS, DOM structure, styling/action attributes and link destinations are unchanged. Four-file Biome passes; full lint/typecheck hit existing errors in unchanged `src/lib/server/forecast.ts`. Actual responsive/link/keyboard/contrast/reduced-motion/browser checks and the scoped Delivery Gate are in [LANDING_COPY_2026_10_23.md](../verification/LANDING_COPY_2026_10_23.md). New application work still needs explicit authorisation.

Latest copy follow-up, 23 October: applied the user's supplied hero description, Staff/Manager/AI headings, paragraphs and bullet text verbatim, retaining the planned-scanning note. Eyebrow is now “AI-assisted stock entry”. Main hero headline is unchanged while the user considers alternatives. Only page text changed; scoped Biome, frontend scope and non-copy source comparison pass. Browser checks at 320/375/1440px show no overflow; final mobile screenshot inspected. See the report's user-copy follow-up.

After explicit implementation instruction and shared-contract agreement:

- Manager: empty startup, product creation/Opening, Inventory/search/Low stock, capture/upload, saved Drafts, line/date correction, product selection/creation, approve/discard and full History.
- Staff: searchable product/current-stock list → Take/Return → integer quantity → Confirm → updated stock. No catalogue setup, scan, drafts, approval or full-History screens.
- Review separates extracted versus final values, manually converted base units and uncertainty. Unknown product starts Opening 0; receipt quantity is Intake only. Actual-receipt confirmation must be clear even for invoices/order images.
- Saved drafts reopen without original image, with a re-upload explanation. Preserve edits on failure; show role denial, stale revision, insufficient stock, uncertain outcome and labelled mock/live extraction accurately.
- Follow source-proposed teal and calm Linear/Shopify principles in DESIGN.md. Read ui-ux-pro-max and antislop during under AGENTS.md before future UI work; run Delivery Gate with actual mobile/desktop/keyboard/contrast/reduced-motion evidence. No UI gate was run now.

Coordinate response schemas/permissions with William, synthetic cases with Maxi and extraction uncertainty/provenance with Marco. Backend checks enforce permissions; hiding controls alone is insufficient. Landing and persistent demo remain separate legacy scope areas; new screen ownership/paths need agreement before edits. Historical local UI evidence does not prove the new workflow.
