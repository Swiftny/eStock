# System · William Christiansen

[Team](README.md) · [Backend](backend.md) · [Integration](integration.md) · [Setup](../../README.md)

24 October 2026. Current demo uses opaque server role sessions and PostgreSQL. Preserve each laptop's ignored `.env.local`, password/session secret and Docker volume. After source update run `npm ci`, `docker compose -f compose.estock.yml up -d --wait`, `npm run db:estock:migrate`, restart `npm run dev`. Application startup uses the same migrations; existing stock/drafts/completed approvals/compatible sessions are retained. Never `down -v`, reset/truncate operational tables, or put secrets in logs/output.

Manager and shared Staff permissions are server enforced; a shared access code is permitted only under the explicitly enabled development exception. Notification state is persisted and role-scoped. Local browser restart tests do not establish hosted database/redeploy durability. Verify actual hosting request capture/log/cache/transient image policy separately from Gemini provider retention/tier.

Replit remains required with own-project evidence and real restart/redeploy/judge-access checks. Historical RunPod usage remains declarable; X-03 and X-09 need written clarification/evidence, without invented exemption or working Orbyte connection. No cloud provision, purchase, paid model call, publish, commit/push or external message is authorised. [Current verification](../verification/STAFF_RECEIVING_2026_10_24.md) lists actual local checks and limits.
