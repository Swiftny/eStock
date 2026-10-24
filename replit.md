# eStock

Document-assisted inventory for one shop and one warehouse. Managers prepare
supplier-document drafts, Staff checks physical goods and confirms receipt, and
both roles can Take and Return stock.

## Running

Use the managed workflows:

- `artifacts/estock: web` — original React UI, served by Vite at `/`.
- `artifacts/api-server: API Server` — Express API at `/api`.

Do not run a root-level development server.

## Configuration

- `DATABASE_URL`: PostgreSQL connection, supplied by the workspace.
- `ESTOCK_MANAGER_PASSWORD` and `ESTOCK_STAFF_PASSWORD`: separate account passwords,
  configured through Replit Secrets.
- `ESTOCK_SESSION_SECRET`: optional; defaults to the existing `SESSION_SECRET`.
- `GEMINI_API_KEY`: required for document scanning, configured through Secrets.
- `ESTOCK_GEMINI_MODEL`: optional, defaults to `gemini-2.5-flash`.
- `ESTOCK_DEMO_ALLOW_SHARED_PASSWORD=true` is enabled only in development for
  the original shared-code preview mode. Production requires distinct Manager
  and Staff codes; update the two password secrets before publishing.

No passwords, database rows, or provider credentials were available in the import.
The migration does not invent accounts, grant access without a password, or
substitute fake scan results when a provider is unconfigured.

## Code

- `artifacts/estock/src/app/`: original landing and demo pages.
- `artifacts/estock/src/components/`: original workspace components.
- `artifacts/api-server/src/estock-routes/`: preserved endpoint business handlers.
- `artifacts/api-server/src/routes/estock.ts`: Express transport and route map.
- `lib/estock-core/`: shared original domain code and PostgreSQL schema.
- `.migration-backup/`: untouched imported source, documentation, tests and worker.
  Excluded from publication.

## Database

Preserve the imported PostgreSQL model and SQL migrations; do not replace it with
the unused scaffold Drizzle schema. Development setup is
`pnpm --filter @workspace/estock-core run db:setup:dev`, also run after task merges.
The app never applies PostgreSQL DDL on startup or on incoming requests. Publish
manages production schema changes. Do not attach this development setup command
to production build or run hooks.

The SQLite forecasting and purchasing code belongs to retired legacy endpoints,
which continue to return HTTP 410. The active product uses PostgreSQL.

## Checks

- `pnpm --filter @workspace/estock-core test`
- `pnpm --filter @workspace/estock-core run test:integration` — imported eStock
  regression suite in a temporary PostgreSQL schema, with a simulated Gemini
  provider; does not modify application tables or call live Gemini.
- `pnpm --filter @workspace/estock run typecheck`
- `pnpm --filter @workspace/scripts run test:estock` — desktop/mobile navigation,
  and authenticated inventory checks when the configured role secrets are present.
- Verify browser flows through the workspace proxy.

The port keeps the original API contracts and manual bounded body validation
rather than replacing clients and business logic with newly generated contracts.
This avoids behavioral changes during migration.

## Publishing commands

Production commands are configured per artifact, not as a root `pnpm dev`:

- Frontend build: `pnpm --filter @workspace/estock run build`; serve
  `artifacts/estock/dist/public` statically with SPA rewrites.
- Backend build: `pnpm --filter @workspace/api-server run build`.
- Backend run: `node --enable-source-maps artifacts/api-server/dist/index.mjs`,
  with `NODE_ENV=production`, the managed port, and `/api/healthz` as startup probe.

The account-status header displays safe JSON API error messages and HTTP status
instead of hiding configuration failures behind a generic message.
