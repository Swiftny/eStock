# Frontend · Riakudu Vittorios Surjoraharjos

[Team](README.md) · [Integration](integration.md) · [DESIGN.md](../../DESIGN.md)

23 October 2026. The documentation pivot was followed by user-authorised landing-copy changes, preserving existing style. Landing/header/meta/sign-in text now describes document-assisted inventory; the linked demo remains the legacy replenishment application. No new stock/OCR functionality was implemented. Prior frontend work and detailed Delivery Gates are preserved [in the snapshot](../archive/2026-10-23-before-document-intake/docs/team/frontend.md.txt) and original verification reports.

Copy changed only in `src/app/page.tsx`, `src/components/site-header.tsx`, shared `src/app/layout.tsx` metadata and `src/app/login/page.tsx` introduction/demo label. CSS, DOM structure, styling/action attributes and link destinations are unchanged. Four-file Biome passes; full lint/typecheck hit existing errors in unchanged `src/lib/server/forecast.ts`. Actual responsive/link/keyboard/contrast/reduced-motion/browser checks and the scoped Delivery Gate are in [LANDING_COPY_2026_10_23.md](../verification/LANDING_COPY_2026_10_23.md). New application work still needs explicit authorisation.

Latest copy follow-up, 23 October: applied the user's supplied hero description, Staff/Manager/AI headings, paragraphs and bullet text verbatim, retaining the planned-scanning note. Eyebrow is now “AI-assisted stock entry”. Main hero headline is unchanged while the user considers alternatives. Only page text changed; scoped Biome, frontend scope and non-copy source comparison pass. Browser checks at 320/375/1440px show no overflow; final mobile screenshot inspected. See the report's user-copy follow-up.

## Current implementation: 24 October 2026

The current blue/Manrope `/demo` uses Stockroom as its sole permanent navigation destination. Manager buttons open Inventory, Scan receipt, Drafts and History; shared Staff sees Inventory/Take/Return and pending receiving checks. Each feature/detail has direct Back to Stockroom, with browser Back and focus support. Recent activity was removed from home. Notifications live in a compact modal drawer with persisted role-scoped unread state and polling/focus refresh.

Manager prepares expected base-unit quantities and sends a frozen receipt. Staff checks Match/Short/Extra and confirms physical goods; actual quantities immediately post once. No later approval. New product in preparation starts Opening 0. Take visibly invalidates excessive typed/pasted input and refreshes stale availability; Return is not capped by stock. Manager Delete uses one accessible confirmation and archives positive-stock products while retaining History.

Use ui-ux-pro-max and antislop during; retain palette/typography/motion/reduced-motion/focus. No new assets/dependencies. Landing hero/layout are preserved, with only contradictory receiving text adjusted. [Current browser evidence and Delivery Gate](../verification/STAFF_RECEIVING_2026_10_24.md) are separate from the historical copy-only work above. Physical devices/cameras and live OCR remain unverified. Shared source/contracts have one coordinated editor, with active paths in the updated scope map.
