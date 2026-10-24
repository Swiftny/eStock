# Inventory management verification

24 October 2026. Scope: user-requested relocation of Edit/Delete and explicitly confirmed permanent deletion of all products and inventory balances.

## Implementation

- Inventory rows contain Take/Return, with Actions aligned right.
- Manager opens Manage products from Inventory for existing Edit/Delete dialogs. Inventory stays active in header navigation; browser Back/Forward and #products reload work. Staff falls back to Inventory.
- A separate bulk deletion section requires exact typed `Delete All Inventory` confirmation. Cancel clears the entry, busy controls disable, errors retain the entry, and retries reuse the request ID.
- Manager-only DELETE products validates session, same origin, exact phrase and request identity. It physically removes active/archived products and balances/aliases; historical receipt/activity snapshots remain through nullable references.
- Pending checks are recalled to Drafts with revised versions and cleared product mappings. Old checks/Send retries cannot post. Table locking follows draft-before-product order. A deletion retry does not delete products created after its first success.
- Migration 006 changes foreign-key deletion behavior without changing existing rows. No operational delete action was executed.

## Checks

| Check | Result |
| --- | --- |
| Production Next build and TypeScript | Pass |
| CRLF-aware Biome on 10 touched source/test files | Pass |
| Isolated PostgreSQL/API regression suite | 47/47 pass |
| Final balance reconciliation and temporary-schema cleanup | Pass |
| Manager/Staff Chrome journeys at 375, 701, 710 and 1280px | 8/8 pass |
| Existing local data before/after migration | All rows preserved in 13 operational tables |

New PostgreSQL scenarios cover permissions/origin/phrase/identity rejection, injected delete failure with full rollback, removal of active and archived rows, preserved history, pending recall, stale forms, request tombstones, safe retry after new product creation, clearing detached activity and three deletion-versus-Staff-confirmation races. Gemini uses the in-process stub; zero live provider calls.

Browser checks use a separate owned preview and intercept every API with synthetic responses. They cover ordinary-row controls, zero-stock Take, right-edge Actions alignment, manager routing/reload/Back, editing, individual Delete Cancel, exact phrase gating, Cancel reset, busy state, failure/retry identity, empty result, Staff restriction, keyboard focus, 44px edit target, JavaScript errors and horizontal overflow. Desktop Inventory and desktop/phone management screenshots were visually inspected. Screenshots remain in ignored `.artifacts/`. The owned preview and temporary scripts were removed after checks.

## UI delivery gate and limits

The existing Manrope/blue palette, text contrast tokens, 44px controls, visible focus and reduced-motion styles are reused. Product maintenance is separate from stock movement; the destructive section has explanatory text, a divider, a labelled typed input and Cancel. Phone controls stack without horizontal scrolling. No new assets, dependencies, font or colour pairs were introduced.

This is resized desktop Chrome, not physical-device acceptance. The broader browser suite was updated at its product-management entry points but was not rerun in full. Backend behavior is verified separately against owned temporary PostgreSQL schemas, not operational data. No hosting durability, live OCR, deployment, commit or push is claimed.
