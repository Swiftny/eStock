# Deploy eStock to Replit

Prepared 24 October 2026. The import ZIP contains the current local application source, including uncommitted changes. It excludes credentials, private photos, runtime data, Git metadata, dependencies and build output. Importing creates a separate copy. Hosted deployment and database durability still need the checks below.

## Import and configure

1. Open [Replit Import](https://replit.com/import), choose **ZIP**, and upload `estock-replit-import.zip`. `package.json` and `.replit` belong at the project root. The original repository and its history remain on GitHub; this runtime ZIP does not replace the submission repository.
2. Use Node.js 22.18 or newer. `.replit` selects Replit's Node 22 module. Check `node --version` in Shell after import.
3. Add a PostgreSQL database in Replit's Database tool, or supply an existing hosted PostgreSQL database. Keep development and production connection strings separate. The laptop's `127.0.0.1:55432` Docker URL cannot connect to the laptop from Replit. Use the provider's connection string with its required TLS settings; do not disable certificate validation to fix connection errors.
4. Add the following server secrets in Replit. Review them again under **Publishing > Adjust settings > Production app secrets** before publishing. Do not paste secret values into Agent chat or source files.

| Secret | Value |
| --- | --- |
| `DATABASE_URL` | Connection string for the intended hosted PostgreSQL database; production must use the production database |
| `GEMINI_API_KEY` | Your Gemini server API key |
| `ESTOCK_MANAGER_PASSWORD` | A private Manager password, different from Staff |
| `ESTOCK_STAFF_PASSWORD` | A private shared Staff password |
| `ESTOCK_SESSION_SECRET` | A random secret of at least 32 characters, stable across restarts and updates |
| `ESTOCK_GEMINI_MODEL` | Optional; blank uses the app's current default, `gemini-2.5-flash` |
| `ESTOCK_GEMINI_MEDIA_RESOLUTION` | Optional; blank, `medium` or `high` |

The shared-password development exception does not apply to production. Do not add `NEXT_PUBLIC_` to any secret name. Existing inventory is not included in the ZIP; a fresh database starts empty. Do not upload the local `.env.local`, data folder or private reference receipts.

In Replit Shell, prepare the development database and preview:

```sh
npm ci --include=dev
node scripts/replit-check.mjs
npm run db:estock:migrate
```

Select **Run**, then open the preview's HTTPS URL in its own tab and visit `/demo`. The configured preview command is `npm run dev -- --port 3000`.

## Publish

Use a server deployment, such as **Autoscale**, because eStock has API routes, database sessions and server-side extraction. Review the plan and database selection in your own account. The configuration supplies:

| Setting | Value |
| --- | --- |
| Build command | `npm ci --include=dev && npm run build` |
| Run command | `node scripts/replit-check.mjs && npm run db:estock:migrate && npm run start -- --port 3000` |
| Internal port / public mapping | `3000` / `80` |
| Bind address | `0.0.0.0`, already set by the app's start script |

The build does not migrate a database. Startup checks configuration without printing secret values or calling Gemini, applies the existing ordered transactional migrations to the runtime database, and starts Next.js only if both steps succeed. The database account needs permission to apply the schema. Do not run legacy SQLite seeds or Docker Compose in Replit.

Publish and use the published HTTPS URL for acceptance. Preview success does not prove the production database or production secrets are correct.

## Verify the hosted version

Use only team-created synthetic documents and records. On the published URL:

1. Sign in as Manager and Staff separately. Confirm Staff cannot access Manager History or catalogue editing. If a write returns `FORBIDDEN`, inspect the actual browser origin and hosting proxy headers; preserve the origin check.
2. Create a synthetic product with Opening stock and verify Take/Return and refresh persistence.
3. Deliberately scan a team-created synthetic receipt using the real configured provider, review/send it as Manager and confirm actual goods as Staff. This is a live Gemini call and may consume quota. Measure whether the host allows the full request: earlier local OCR samples took up to 197 seconds. Check Drafts after a lost response before retrying. Do not claim this check passed until it was performed.
4. Record the synthetic product balance and receipt identity, restart/redeploy, then verify both still exist without duplicate Intake. Keep the same production database and session secret. Do not use Clear/Delete controls as a deployment check.
5. Check judge access in a fresh browser, camera behavior on a physical device, and the hosting logs/cache/image handling. Record the actual published URL, Replit project/account proof, database provider and results. Keep passwords and keys out of screenshots.

## Update after importing

Local files, GitHub and Replit are separate copies. Editing locally does not update Replit. Pushing a GitHub commit does not by itself change the published version. Changes inside Replit also require publishing again to reach the live site.

For continued team development, connect the imported project to the existing GitHub repository through Replit's Git tool, or use a GitHub import once the intended source is pushed. Ensure the Git working tree matches the intended branch before pulling; the ZIP includes local changes that may not exist on GitHub yet. Do not overwrite those changes with an older remote revision.

Then use this release sequence:

1. Edit and test locally, commit the intended changes and push to the team's chosen branch.
2. Pull that branch in Replit's Git tool and review/resolve any conflicts with Replit edits.
3. Run `npm ci --include=dev` if dependencies changed; check the preview.
4. Publish again. The deployment build compiles the updated source, and startup applies pending SQL migrations. Verify the published URL.

If you keep a ZIP-only project, copy updated source files into it and publish again. Replacing it with a new project can create a different database or URL, so confirm the intended production connection string before publishing. Preserve the production secrets and database; avoid resets, truncation or development-data copies. Schema changes must stay additive and compatible with any older deployment still handling requests.

## Sources and documentation check

- [Replit ZIP import](https://docs.replit.com/build/import-from-providers)
- [Official Next.js Replit template](https://github.com/nextjs/deploy-replit/blob/main/.replit)
- [Replit configuration](https://docs.replit.com/features/project-setup/configuration)
- [Replit deployment types](https://docs.replit.com/features/publishing/deployment-types)
- [Development and production databases](https://docs.replit.com/features/data-and-storage/development-and-production)
- [Replit secrets](https://docs.replit.com/core-concepts/project-editor/app-setup/secrets)
- [Replit Git tool](https://docs.replit.com/replit-workspace/workspace-features/version-control)

The repository-required elevated Context7 command was rejected by this environment's permission policy. The sandbox attempt and any further check result are recorded in the deployment verification report. Installed Next.js deployment/CLI documentation and official Replit pages were read directly.
