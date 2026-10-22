# Local workflow implementation plan

The user authorised frontend refinement and the persistent application on 21 October 2026. This supersedes the earlier landing-only pause. No commit, push, publication, service purchase or real supplier message is authorised.

## Inspection

The repository is on `main`, with its existing GitHub remote and Apache licence. Pre-existing user changes are in `next-env.d.ts` and `package-lock.json`; preserve them. The application uses Next.js 16.4.2 App Router, React, TypeScript, plain CSS, local Manrope and Biome. Only `/` exists. Its interactive approval example is held in browser memory. The existing application was opened in Safari at localhost:3000 and its section navigation inspected before editing.

## Implementation sequence

Milestone 1 inspection is complete. The existing landing page was run and inspected in Safari, including its working section anchor. Attio was opened in Safari; its expanded navigation, changing hero preview and scrolled product sections were inspected. The database migration/seed smoke check now reads three products from disk with balances 45 units, 22 kg and 75 units. The history-only seed does not alter opening stock. The installed antislop plugin path in AGENTS.md is unavailable in this environment; the catalog's readable core at `~/.agents/skills/antislop/SKILL.md` is used.

1. Establish shared TypeScript contracts and SQLite migrations, with integer thousandths for quantities and integer MYR sen for money. Use Node's built-in SQLite driver, already verified in the installed Node 22.23.3 runtime, without adding an ORM or second backend.
2. Refine the landing page and sticky navigation; retain existing section destinations and synthetic review functionality. Add `/demo` as the working application entry.
3. Connect product/policy, movement, daily closing, import and history forms to server records.
4. Implement one shared purchasing engine, a separate manual what-if calculator and progressively disclosed recommendation details.
5. Connect saved forecast jobs to a mock/baseline adapter and a configurable RunPod Python worker. Never label local baseline arithmetic as AI.
6. Complete transactional manager approval, simulated dispatch, synthetic acknowledgement, partial/damaged receiving and activity.
7. Verify rules, permissions, duplicates, persistence, browser flow and responsive/accessibility behaviour; update the handoff and tools inventory with actual evidence.

## Contracts and boundaries

- SQLite is the local single-process persistence choice. Replit workspace testing can use the same file; a deployment needs a durable mounted disk and one application instance. Autoscale/ephemeral deployment requires a persistent hosted database migration, not a claim that bundled SQLite survives redeployment.
- Use one synthetic organisation, server-issued demo staff/manager sessions, organisation filtering and server-side mutation permissions. This is simulated identity, not production authentication.
- Explicit saved demo date: record movements, close the day to mark observed days complete and advance to the next decision date. Never silently close missing dates or fabricate daily data from a weekly estimate.
- Every mutation carries an idempotency key. Opening balances, approval revisions, outbox business events and receipt events have database uniqueness constraints.
- Daily forecasts and closing stock share a cutoff. Approvals check date, expiry and ledger/policy/inbound revisions again in a transaction.
- The application exposes a concise attention list, stock recording, orders and a separate what-if view. Configuration, imports, history, model metadata and calculations sit behind labelled disclosures.

## Visual direction

All eight local implementation milestones are now carried out. The shared database, landing refinement, stock/CSV forms, deterministic calculator, forecast adapter, approval/outbox/receiving and audit are connected. External configuration is not silently marked complete: GPU inference, worker dependency lock/image validation and Replit persistence/proof remain outstanding. Actual checks and the Delivery Gate are recorded in `docs/verification/WORKFLOW_2026_10_21.md`.

Reading this as: a replenishment product for SME managers and stock staff, with a light, readable ledger-like visual language; ENERGY 2 / RHYTHM 3 / MOTION 2 for the landing page, and ENERGY 1 / RHYTHM 2 / MOTION 1 for operational screens.

Keep the existing forest-green identity and local Manrope. Use an asymmetrical hero with one compact purchase decision beside the headline. Move detailed calculations out of the first view. Alternate a concise problem statement, connected workflow and focused approval example. Motion uses short opacity/transform entrances and state transitions, with readable default content and reduced-motion overrides.
