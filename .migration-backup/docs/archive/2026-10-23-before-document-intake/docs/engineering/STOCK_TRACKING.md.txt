# Stock tracking: backend and frontend agreement

21 October 2026. Scope: stages 1 and 2 of the agreed MVP plan. All operational records are synthetic.

## Starting point and ownership

Work started from commit `68643df` on a clean `main` tracking `origin/main`. The local branch is `feat/stock-tracking`. The pull already contained SQLite persistence, an append-only ledger, CSV imports, server-issued demo sessions and the stock-to-receiving workflow. This stage extends that implementation with a dedicated stock API. Existing `/api/demo` callers continue to use the same service.

The user owns the MVP backend. Their friend owns frontend work and the demo; the friend's name was not supplied. Other team assignments remain open.

| Files | Working owner / coordination |
| --- | --- |
| `src/lib/server/inventory/`, `src/app/api/products/`, `src/app/api/movements/` | User: stock queries, movement adapter and HTTP endpoints |
| `src/lib/inventory/contracts.ts` | User maintains the contract; coordinate any field/status change with the frontend owner |
| `src/lib/server/`, `db/migrations/`, `worker/` | Backend coordination area. Existing service/store code also supports later workflow features |
| Page/layout files, `src/components/`, `src/styles/`, `src/app/globals.css`, `public/` | Frontend owner; no edits in this stage |
| Root dependencies/lockfile/configuration and shared project documents | Coordinate edits before changing the same file |

Folders group feature code. Products such as cartons or coffee are database records, all handled by the same inventory module. Keep feature branches small and integrate completed work after team review. Folder ownership reduces overlapping edits; it does not guarantee conflict-free merges.

## Implemented boundary

- Keep the existing Node SQLite database, migrations, synthetic seed and integer-thousandths quantities.
- Read physical stock through the existing `stock()` ledger calculation.
- Post movements through the existing `executeAction()` transaction, validation, role checks, event uniqueness and idempotency records.
- The inventory adapter does not implement a second stock balance or a second purchasing workflow.
- Confirmed incoming is a separate outstanding quantity; it is never added to physical stock until receiving.
- Updates are request-based. The frontend refreshes its data after saving or on an explicit refresh. These endpoints do not provide server push or live POS integration.
- No dependency, schema, visual design or frontend interaction was changed.

## Session and response conventions

Start a labelled synthetic staff or manager session through the existing `POST /api/session`. For a local demo without an access code, the JSON input is `{ "role": "staff" }`. If `ESTOCK_DEMO_ACCESS_CODE` is configured, use the existing role-selection flow and keep the code out of source.

The server sets the HttpOnly `estock-demo-session` cookie. Use same-origin requests with that cookie. The server determines the role from its saved session. A `role` property in a movement body does not grant permissions. Demo role selection simulates identity; this is not production authentication.

Successful stock responses contain:

| Field | Meaning |
| --- | --- |
| `synthetic` | Always `true` in this demo |
| `organisationId` | The configured synthetic organisation |
| `role` | Server-resolved `staff` or `manager` |
| `demoDate` | Current open business date, `YYYY-MM-DD` |
| `closedThrough` | Latest closed business date |

Responses use `Cache-Control: private, no-store`. Business dates follow the explicit synthetic clock. `createdAt` and `lastMovementAt` are UTC timestamps. Import response types from `@/lib/inventory/contracts` using `import type` in frontend code. Never import server/database modules into a client component.

## GET /api/products

Returns the context above and `products: InventoryProduct[]`, sorted by SKU and product ID.

| Product field | Meaning |
| --- | --- |
| `id`, `sku`, `name` | Product identifiers and display name |
| `unit`, `precision` | Base unit and allowed quantity decimal places, 0 to 3 |
| `stock` | Current physical stock from the ledger |
| `confirmedIncoming` | Remaining quantity on supplier-confirmed or partially received orders, including overdue outstanding goods |
| `ledgerVersion` | Changes with ledger/history revisions; useful for recognising changed data |
| `ledgerStartDate` | First physical-ledger business date |
| `lastMovementAt` | Latest movement recording timestamp, or `null` |

`confirmedIncoming` is informational. It does not assert that a delivery will arrive in time for a forecast horizon. This endpoint omits purchasing prices, costs and model results.

## GET /api/movements

Returns the context, `movements: InventoryMovement[]` and `nextCursor: string | null`.

Optional query parameters:

- `productId`: return one product's movements; unknown products return 404.
- `limit`: integer from 1 to 100; default 50.
- `cursor`: the previous response's `nextCursor`. Keep the same product filter when continuing a page sequence.

History is ordered by ledger insertion, newest first. A newly recorded movement appears at the beginning. Use a fresh first-page request to see new records; a cursor continues older history.

Each movement includes `id`, `productId`, `sourceEventId`, `type`, positive-or-zero `quantity`, signed `delta`, `unit`, business `date`, `reference`, `reason`, `actor` and UTC `createdAt`. Opening balances can have zero quantity. `delta` supplies the physical direction, so an outgoing SALE of 5 units has `quantity: 5` and `delta: -5`.

Example request: `/api/movements?productId=product-cartons&limit=20`. An empty history returns an empty array and `nextCursor: null`.

## POST /api/movements

Required headers:

```http
Content-Type: application/json
Idempotency-Key: a-unique-request-key
```

The body is the movement itself. Example for a fresh synthetic fixture:

```json
{
  "productId": "product-cartons",
  "sourceEventId": "SYN-SALE-001",
  "type": "SALE",
  "quantity": 5,
  "unit": "units",
  "date": "2026-10-21",
  "reference": "SYN-COUNTER-SALE-001",
  "reason": "Synthetic example"
}
```

Take the date from `GET /api/products`; do not hardcode the example date in the application. Send quantities as JSON numbers in the product's base unit. A fresh fixture starts cartons at 45 units; this example would leave 40. This is an expected arithmetic example, not a record of an executed HTTP request.

Rules enforced by the existing service:

- Staff and managers can post `SALE`, `INTERNAL_USE`, `DAMAGE_OR_LOSS` and inspected `CUSTOMER_RETURN_USABLE` movements.
- Only managers can post `ADJUSTMENT_IN` and `ADJUSTMENT_OUT`.
- Quantity must be positive, within the existing 1,000,000-unit per-movement limit and match the product's precision. The movement type determines the sign.
- Outgoing movements cannot make stock negative. Unit must match exactly.
- Movements must use the open `demoDate`. Closed physical records stay immutable; corrections use a manager adjustment with a reason on the open day.
- `reference` and `sourceEventId` are required, up to 160 characters each. `productId` is required.
- `reason` is required for non-sale movements, up to 500 characters. Sale notes are optional text with the same bound.
- Opening balances use existing manager product setup or validated opening CSV import. Supplier receipts use the existing purchase-order receiving flow. Neither type is accepted by this generic movement endpoint.

Successful submissions and identical retries return HTTP 200, the context, `message`, saved `movement`, and current `product`. The returned product is current when the request completes; it is not a historical stock snapshot for the movement.

### Duplicate protection

Generate one request key and one `sourceEventId` when submitting a new stock event. Keep both and the body unchanged when retrying after a network failure.

- Reusing the same request key and input returns the saved result without another movement.
- Reusing a key with different input returns 409.
- The source event also prevents another posting if a client retries with a different request key. Conflicting event details return 409.
- A same-event replay does not invalidate recommendations again when the ledger has not changed.

After a confirmed save, clear the form, use the returned product and refresh the relevant movement list. Keep input and retry identifiers when the outcome is uncertain. Stock can also change through another user's requests, so provide an explicit refresh.

### Frontend request example

```ts
import type {
  InventoryErrorResponse,
  RecordStockMovementInput,
  RecordStockMovementResponse,
} from "@/lib/inventory/contracts";

async function saveMovement(input: RecordStockMovementInput, requestKey: string) {
  const response = await fetch("/api/movements", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": requestKey,
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const problem = (await response.json()) as InventoryErrorResponse;
    throw new Error(problem.error);
  }
  return (await response.json()) as RecordStockMovementResponse;
}
```

This is integration guidance for the frontend owner. No frontend code was connected or changed in this stage.

## Error handling

Stock endpoint errors have `{ "error": "Actionable message", "code": "machine-readable code" }`.

| HTTP status | Meaning / frontend response |
| --- | --- |
| 400 | Invalid JSON or non-object body; correct the request format |
| 401 | Missing/expired demo session; return to role selection |
| 403 | Forbidden manager action, organisation access or cross-site request |
| 404 | Unknown product or movement |
| 409 | Conflicting request key/source event; refresh and review the event |
| 413 | Movement body exceeds 16 KiB |
| 415 | Body was not sent as `application/json` |
| 422 | Invalid quantity, unit, date, required field or pagination input |
| 500 | Unexpected server error; input should remain available for review/retry |

Use HTTP status and the supplied message. Existing validation paths can use the generic `VALIDATION` code across statuses. Do not treat `code` as a substitute for HTTP status. The server hides unexpected exception details.

## Verification for this stage

Actual local checks on Node.js 24.16.0:

| Check | Actual result |
| --- | --- |
| Baseline `npm run lint` and `npm run typecheck` | Passed before implementation; 26 source files in the baseline lint run |
| Final `npm run lint` | Passed; 32 source files, no fixes applied |
| Final `npm run typecheck` | Passed; no TypeScript errors |
| `npm run build` | Passed; route output includes dynamic `/api/products` and `/api/movements`, alongside the preserved `/api/demo`, `/api/session`, `/` and `/demo` |
| `npm test` after the user requested verification | Passed; 60 tests, including 22 new focused inventory tests, with no failures or skips |
| `node scripts/verify-stock-tracking.mjs` | Passed; 24 production HTTP scenario groups, including real server restart and listener cleanup |
| `git diff --check` | Passed |
| Source preservation comparison | `git diff --exit-code` returned 0 for frontend pages/layout/components/styles, public assets, root LICENSE, dependency manifests and configuration |

The build regenerated `next-env.d.ts` to reference production types. Its original development references were restored to keep the teammate's generated-file convention unchanged; a subsequent type check passed.

The initial implementation handoff contained static checks only. The user subsequently requested Step 2 verification. Dedicated unit and production HTTP checks now cover stock updates, permissions, duplicates, pagination, field validation, receiving compatibility and persistence across a new server process. Full evidence and limits: [STOCK_TRACKING_2026_10_21.md](../verification/STOCK_TRACKING_2026_10_21.md). The pulled handoff's older `WORKFLOW_2026_10_21.md` remains absent; current evidence comes from these fresh checks.

The HTTP harness started two temporary local server processes in sequence with an isolated synthetic database. Both processes stopped, both listeners closed, and the HTTP database directory was removed. No browser, screen capture, screen-sharing or computer-control session was initiated. No real external credentials, cloud infrastructure, dependency installation, real messages, commit, push or publication were used. This stock module requires only the existing local setup; real platform configuration remains outstanding.

Reproduce runtime verification after installing the existing dependencies:

```sh
npm test
npm run build
node scripts/verify-stock-tracking.mjs
```

The HTTP harness needs localhost-listening permission. It sets an isolated `ESTOCK_DB_PATH` and `FORECAST_MODE=MOCK` in child processes; it does not use the normal demo database. Follow [the MVP checkpoint](../plans/MVP_PROGRESS.md) for the manual Git handoff and planned Step 3.

## Next milestone

The frontend owner can connect stock screens to this contract. Review the stock workflow together before moving to stage 3, real demand inference and stock coverage. RunPod/Replit account configuration, actual numerical inference, deployment durability and proof remain separate work. A local SQLite file requires one application instance and durable storage for deployment.
