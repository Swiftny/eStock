# Backend and system · William

[Team pages](README.md) · [Data](data.md) · [AI](ai.md)

## Existing implementation

Request handlers are in `src/app/api/demo/route.ts` and `src/app/api/session/route.ts`. Workflow orchestration is `src/lib/server/service.ts`; sessions and validation are in `session.ts` and `validation.ts`. Forecast integration is `src/lib/server/forecast.ts`. Purchasing arithmetic is `src/lib/purchasing.ts`; shared types are `src/lib/contracts.ts`.

## Next tasks

- [ ] Review the full stock-to-receiving transaction flow and server-side staff/manager checks.
- [ ] Verify repeat requests cannot create duplicate movements, approvals, POs or receipts.
- [ ] Check stale recommendations, policy changes, failed analysis and simulated dispatch retry.
- [ ] Connect Marco's verified worker result through the existing forecast adapter.
- [ ] Coordinate schema/seed/import changes with Maxi and response changes with Vitto.
- [ ] Prepare Replit setup and durable storage instructions; actual deployment requires further authorisation.
- [ ] Verify restart and redeploy persistence on the eventual approved platform, rather than assuming local SQLite proves it.

Approval must not add physical stock. Only usable received quantities increase stock. Keep the supplier outbox explicitly simulated and preserve audit history.

## Review evidence

Run the relevant existing workflow, purchasing and forecast tests, plus typecheck/build for application changes. Record failures and limitations. Demo role selection is simulated identity, not production authentication. Replit deployment and live RunPod inference remain unverified.

## Parallel work boundary

Read [integration rules](integration.md). For code changes, select the `backend` area and run `python3 scripts/check_scope.py backend` before handoff. Shared files require a separate coordinated task. Demo rehearsal is shared; only one active task edits the demo interface at a time.
