# Replit import preparation: 24 October 2026

The user selected preparation of a new Replit import. This report concerns local preparation, not a completed deployment. Existing uncommitted source changes were preserved and included in the runtime snapshot. Name correction applies to current documents; archived source/evidence remains historical. The user withdrew a possible jobdesk change.

## Changes

- `.replit`: Node 22 module, port 3000 mapped to 80, development preview, locked dependency install/build, and configuration check/migration/start in that order for production.
- `scripts/replit-check.mjs`: presence/format checks for PostgreSQL URL, Gemini key, distinct usable Manager/Staff passwords and a 32-character session secret; no connectivity call or secret output.
- Deployment guide and README: import, database/secrets setup, production configuration, hosted acceptance and local/GitHub pull/republish process.
- System scope map includes the new configuration/script/guide. Shared documentation and team-name corrections are coordinated integration changes, not a claimed single-scope pass.

## Executed checks

| Check | Actual result |
| --- | --- |
| Production `npm.cmd run build`, including TypeScript | PASS, Next.js 16.4.2 / Node 24.16.0. Existing parent-directory lockfile warning does not prevent build. |
| Startup configuration cases in a fresh ignored directory | PASS, 9 cases: valid config, absent/invalid DB, missing Manager password, shared production passwords despite demo override, short session secret, missing Gemini key, surrounding password whitespace and overlong password. Output checked for synthetic secret disclosure. |
| Temporary production HTTP smoke on port 3193 | PASS, 6 checks: landing, demo, signed-out session, unauthorized inventory, matching HTTPS proxy origin reaching password validation, and cross-origin rejection. All passwords/keys/DB URL were synthetic; no database or provider call. |
| Origin probe correction | Initial fetch probe returned 403 because the intended Host override was not transmitted. Node HTTP with explicit Host/Origin/X-Forwarded-Proto returned expected 401 INVALID_CREDENTIALS. Existing origin guard remains unchanged. |
| Startup script lint/format | PASS, one file checked without fixes using existing Biome rules in an ignored temporary configuration that includes scripts and uses LF. The repository configuration normally includes only src. |
| Current name correction and whitespace | PASS, no old spelling in current team/product/submission/root documents; Git diff whitespace check passes. Jobdesk remains Frontend. |

Configuration evidence is in ignored `.artifacts/replit-config-KnT6xV/results.json`; HTTP evidence is `.artifacts/replit-production-smoke.json`. The temporary server was stopped. The build-generated `next-env.d.ts` paths were restored to their prior development values.

## Limits and sources

The required Context7 command outside sandbox was rejected by the environment's granular permission policy. The sandbox npm fetch failed EACCES; PowerShell's npx script execution policy also required using npx.cmd for that attempt. Official Replit import/configuration/database/secrets/Git pages and the official Next.js Replit template were read, along with installed Next.js deployment/CLI documentation. No Context7 result is claimed.

No cloud account/project/database was provisioned, no purchase/publish/commit/push occurred, and no operational data or live Gemini request was used. Linux dependency installation and actual Replit proxy behavior, hosted slow OCR, camera/device behavior, account/judge access, image/log/cache handling, backups and restart/redeploy persistence remain unverified. The guide defines the remaining checks. Earlier backend/UI test results remain historical; those broad suites were not rerun for deployment configuration.
