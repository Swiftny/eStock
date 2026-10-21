# System · William

[Team pages](README.md) · [Backend](backend.md) · [Integration rules](integration.md)

System tasks cover demo session security, runtime configuration, deployment planning and HTTP smoke checks. Backend tasks cover workflow transactions and purchasing rules. William handles these as separate tasks to keep changes reviewable.

Work in `src/app/api/session/`, `src/lib/server/session.ts`, `next.config.ts` and `scripts/http-smoke.mjs`. Shared dependency, environment and deployment files require a coordinated integration task.

- [ ] Review session cookies, origin checks and access-code configuration.
- [ ] Prepare Replit runtime and durable-storage setup without publishing until authorised.
- [ ] Verify access, restart/redeploy persistence and HTTP behaviour on the approved deployment.
- [ ] Coordinate server secrets with Marco without putting them into client code or source.

Run `python3 scripts/check_scope.py system` before handoff. This is an explicit check, not an installed Git hook or remote protection.
