# Shared workspace layout verification

24 October 2026. User-requested scope: equal page sizing using Scan receipt as reference, with demo logo/navbar following the landing page.

## Changes

- Workspace content uses one 1240px maximum-width token and shared gutters; screen wrappers explicitly fill that frame. Page heights follow content.
- Root stable scrollbar space prevents horizontal movement between short and long screens.
- Landing/demo share site-header-frame and Wordmark. Header maximum is 1440px, with the landing's fluid 16–40px side gutters.
- Header/nav row breakpoint is shared at 850px. Navigation uses matching 14px desktop/12px phone type and common gaps; header actions keep a 44px minimum.
- Narrow landing action selectors now override the general button padding correctly, keeping both actions beside the logo. Demo spacing includes two-digit unread badges at 320px.

## Actual checks

- Production Next build and TypeScript: pass.
- Six-file CRLF-aware Biome and Git whitespace checks: pass.
- Chrome Manager/Staff journeys at 320, 375, 650, 768, 851, 1024, 1280, 1920px: 16/16 pass, including notification count 12. An earlier same-width run with no unread badge also passed.
- Each journey opens demo from landing and compares logo x/y/width/height, header-frame geometry, navbar origin/height and computed nav font size within 1px.
- Manager Inventory/Scan receipt/Drafts/History and Staff Inventory/Pending checks have equal outer page widths and heading origins within each viewport. Test content includes both short and long pages.
- No horizontal overflow or page errors; visible keyboard focus.
- Desktop Inventory/Scan and phone Drafts screenshots visually inspected. Existing palette/type, 44px header controls and reduced-motion styles reused; no new colour pairs/assets/dependencies.

Every API request in these browser checks was an intercepted synthetic GET. No operational database write, actual OCR/provider call or stock mutation occurred. Screenshots remain under ignored .artifacts/. The owned preview and temporary script were removed.

This is resized desktop Chrome, not physical-device acceptance or a claim about all browser engines. Backend tests and the broader browser suite were not rerun for this layout-only change. No commit, push or deployment.
