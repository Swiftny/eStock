# eStock: handoff for the next AI session

Use this document when opening Codex in the repository folder. Current status: documentation only; no application has been built.

## Starting prompt to copy

> First read AGENTS.md, PROJECT_CONTEXT.md, docs/product/prd.md, docs/product/DECISIONS.md, docs/COMPLIANCE_MATRIX.md, docs/plans/BUILD_PLAN.md and docs/SUBMISSION_CHECKLIST.md. The selected direction is eStock, a general replenishment assistant for SMEs managing physical stock. MVP input is synthetic CSV and outgoing-stock/receiving forms. Workflow: daily snapshot → forecast → recommendation → manager approval → supplier outbox/PO → acknowledgement → receiving and audit. WhatsApp is preferred if feasible; Telegram if time permits; a working simulated outbox is mandatory. Summarise repository status, open decisions and next priorities. Do not assume features, deployment, proof or measurements exist. This prompt does not authorise implementation. Update PROJECT_CONTEXT.md when decisions are made. Keep all repository documents in English. For UI/UX work, use both ui-ux-pro-max and antislop in during mode, as required by AGENTS.md.

If the team wants to start coding, provide clear additional instructions, for example:

> Start implementing eStock according to the PRD. Close necessary M0 decisions using simple choices we understand, then build one complete workflow first. Check Git status and preserve existing work. Record the frameworks/versions and decisions actually used. Apply the UI skills required by AGENTS.md. Run relevant business tests and document actual results. Follow authorisation limits for paid services, real messaging and publication.

This example prompt is not an automatic instruction for the documentation task. The latest actual user instruction requires technical agreement before scaffolding; translation does not override that limit.

## What must not change silently

- The product remains configurable for SMEs with physical stock; a small fixture does not restrict it to one industry.
- Purchasing requires manager approval. Approval does not increase physical stock.
- Numerical forecasting and deterministic rules have different responsibilities.
- Historical CSV and SALE ledger records must not be counted twice.
- A PO without acknowledgement does not resolve a shortage, but remains a commitment preventing duplicate orders.
- Daily cutoff, decision date, expiry and policy revision must be consistent.
- Label baselines/fallback, synthetic suppliers and simulated channels.
- Recommended models, accounts and stacks are not facts of actual usage.
- No live Orbyte API/sandbox has been supplied.
- Team contacts are not demo data and must not enter public source.

## When decisions change

Record the date, decision, reason, decision maker, impact and related documents in DECISIONS.md. Update PROJECT_CONTEXT.md and affected PRD sections. If behaviour changes, align acceptance, README, proposal, declaration, deck and video.

## When closing a session

Update the context with:

    Work actually completed:
    Files and decisions changed:
    Tests/checks and results:
    Real integrations versus simulations:
    Blockers or unavailable facts:
    Next actions:
    Submission deliverables at risk:

Do not mark a checklist complete just because its document was written. Builds, inference, link access, platform proof, signatures, attendance and submission each require their own evidence.
