# eStock: current project context and handoff

Updated 23 October 2026, MYT. This is the active handoff. [Earlier complete context](docs/archive/2026-10-23-before-document-intake/PROJECT_CONTEXT.md.txt) is preserved as history, including prior authorisations, reported checks and contradictory GPU status notes. It must not drive new work.

Latest authorised revision: Manager History now separates primary Receipt history (approved draft identity and all Intake lines) from searchable Stock activity/Manager Opening. Blank unreadable lines can be excluded with a reason; saved drafts support temporary comparison images with no scan; extraction has a 45-second server deadline and no SDK retries. New-demo lint is clean and retained PostgreSQL/API/browser tests use isolated synthetic resources. See the [current revision verification](docs/verification/MVP_REVISION_VERIFICATION_2026_10_23.md) for actual results and limitations. Physical camera, real mobile-device behavior, live Gemini, provider/hosting retention and deployment remain Unverified. No existing operational records, original Indonesian PRD or local credentials were changed. No commit, push or deployment.

## Latest user decision: document-assisted inventory

The product remains **eStock**. One shop, one warehouse. Main burden: retyping supplier-document lines and mapping supplier abbreviations to recognised products. Manager knows the catalogue; staff need a simple search and Take/Return flow.

Manager: photograph/upload document → backend Gemini extraction → application official-name/confirmed-alias matching → review/correction → explicit confirmation of actual usable goods received → atomic approved Intake and History. Staff: search → Take/Return → integer quantity → Confirm → updated stock.

New source: [complete supplied Indonesian PRD](docs/product/sources/PRD_ID_2026_10_23.md). The [canonical English PRD](docs/product/prd.md) incorporates the user's later clarifications and hackathon corrections. The [decision register](docs/product/DECISIONS.md) records the pivot. Forecasting, replenishment, purchasing policies, PO/outbox, budgets and training are removed from the active MVP.

## Current implementation handoff: new `/demo` source

On 23 October the user explicitly requested implementing this PRD in the demo and specified `ui-ux-pro-max` and `antislop` for UI work. This supersedes the earlier documentation-only limit below. The branch `feat/estock-demo-workflow` now contains a new Manager/Staff interface, PostgreSQL schema and inventory ledger, server-side password sessions and role checks, transient Gemini image extraction into persistent structured drafts, explicit Manager review, once-only atomic approval and History. Earlier legacy API routes return 410; historical source/evidence remains. The new setup is in [README.md](README.md), [`.env.example`](.env.example) and [`compose.estock.yml`](compose.estock.yml). This working copy has an ignored `.env.local` with local database URL and random Manager/Staff/session credentials; its `GEMINI_API_KEY` is intentionally blank.

The initial implementation task performed no application verification. That historical limitation is superseded by the current verification report: local types/build, isolated synthetic PostgreSQL/API tests and separate headless Chrome journeys have now run. These do not prove real OCR, physical camera behavior, provider retention or deployment. Docker access was denied in the tool session; PostgreSQL was reachable directly. Do not reset existing data or make a live Gemini call merely to repeat verification.

## Earlier follow-up: landing copy, existing style

Git handoff, 23 October: the user authorised a new local branch, staging and commit of the documentation/landing-copy work, with pushing reserved for the user. Created branch `docs/document-intake-and-landing-copy` from `main`. Reviewed commit scope is 65 documentation/reference/archive/frontend-text files; the pre-existing generated `next-env.d.ts` change is excluded. Scoped four-file Biome and whitespace checks pass; the supplied Indonesian source retains its original hard-break spaces/final blank line, verified against the attachment. Candidate-file scanning found no private registration emails or credential patterns. Existing full-project forecast errors remain disclosed. No new workflow implementation, push, merge or publication is authorised.

Subsequent user-supplied copy was applied to the hero description and Staff/Manager/AI sections in `src/app/page.tsx`, including the planned-scanning note. The eyebrow is “AI-assisted stock entry”. The user requested brainstorming a replacement main headline; no new headline has been selected or applied. Layout/styles/behaviour remain unchanged. Scoped lint/scope checks and 320/375/1440px browser checks pass; full-project backend limitations from the prior check remain unchanged.

On 23 October the user authorised updating landing-page text to match document-assisted inventory, explicitly retaining the style. Text only changed in `src/app/page.tsx`, `src/components/site-header.tsx`, metadata in `src/app/layout.tsx`, and the related sign-in introduction/demo label in `src/app/login/page.tsx`. Headline is now “From receipt to stock. With your approval.” Staff Take/Return, Gemini draft extraction, Manager review and confirmation of actual receipt replace the old purchasing narrative. A visible note says document scanning is planned and the demo still shows the earlier workflow. CSS, layout structure, attributes, animations, links and backend behaviour are unchanged. The new workflow remains unimplemented.

Actual checks: scoped Biome passes for all four edited files; explicit frontend scope passes for landing/header. Browser checks cover landing widths 320/375/768/1440, login widths 320/375/1440, all nine landing links and login return/demo links, keyboard focus, reduced motion, final desktop/mobile screenshot review and 243 text elements with minimum contrast 5.80:1. Final landing console has no errors/warnings. Demo API requests were intercepted during destination checks to avoid intentional inventory actions. Full-project lint/typecheck are blocked by pre-existing duplicate keys and unknown-type errors in unchanged `src/lib/server/forecast.ts`; no full build or application test suite was run. [Scoped Delivery Gate and limits](docs/verification/LANDING_COPY_2026_10_23.md). Prior documentation changes and `next-env.d.ts` are preserved. No commit/push/publication or new workflow implementation.

## Historical authorisation: completed documentation-only pivot

The earlier coordinated cross-area task had one editor and a documentation-only scope. Its instruction to wait before implementation was superseded by the later user request recorded above. No push, merge, publication, purchase, cloud provisioning, paid model call or external message was requested for the implementation task.

Initial inspection: expected repository `/Users/riakuduvittorios/Code/SDC-Hackathon`, branch `main`, original `origin` remote retained. Only pre-existing working-tree change was `next-env.d.ts`; preserve its exact bytes. Source/asset/test/script/training/evidence/runtime files were fingerprinted for documentation-boundary verification. No private contact values were copied into public documents.

## Existing legacy application versus implemented source

The original SQLite application source remains. Legacy functionality included product creation by Staff, decimal units, sales/history import, forecast/baseline analysis, purchasing policies, PO/simulated supplier outbox, receiving/damage and activity. Those behaviours are **not** the new role/quantity/Intake workflow; the active `/demo` route and `/api/estock` source now target the PRD instead.

The branch uses Next.js/TypeScript, PostgreSQL and the backend Gemini SDK. Schema, accounts, drafts, exact matching, stock ledger and approval have isolated synthetic verification; the new receipt/activity History and comparison image controls have browser evidence in the current report. Real Gemini/physical camera, hosting, provider plan, region and deployment remain open.

Legacy reports remain unchanged in `docs/verification/`; their test totals describe earlier scopes/environments. They do not establish new acceptance, PostgreSQL or OCR accuracy. No application tests/build, browser UI review or UI Delivery Gate was run during this documentation update.

## Invariants to carry into implementation

- Separate Manager and one shared Staff account. Only Manager creates/edits products, records Opening, uploads/reviews/approves/discards drafts and sees full History; both search/view stock and Take/Return. Enforce every boundary in backend, including read responses. History identifies shared Staff account/role, not employees.
- Products: official name, one base unit, Opening, generated internal ID; no mandatory entered SKU/barcode/shelf. Final quantities integer. Intake/Take/Return positive; concurrent Take cannot go negative. Return means usable physical return, no refund/prior-Take link. No damage/general adjustments.
- IC-01 explicitly permits Opening 0. Unknown product created during review starts at zero; receipt quantity posts once as Intake on approval, never both Opening and Intake.
- Draft/Approved/Discarded persist as structured records. Closing/discarding unapproved Draft changes no stock; Approved immutable. Atomic all-line approval with rollback, persistent retries, uniqueness and revision/concurrency checks. Single-draft protection does not prevent every duplicate upload; similarity warning is P1.
- An invoice/order image does not prove physical receipt. Manager confirms approved goods actually received; no automatic stock from order-only/advance invoice. AI cannot see hidden carton contents or condition. Manual base-unit conversions; preserve extracted and approved values separately. Aliases do not train Gemini.
- Preserve Document date and server Approved at; do not backdate ledger; present MYT. Low stock strictly <5, including zero; exactly 5 is not Low stock.
- No monetary features or entire provider response containing excluded amounts/images. Images transient only, never permanently in app DB/disk/object/browser storage/logs/telemetry/caches. Reopened drafts lack image and require re-upload for comparison. Document instructions are untrusted content. Provider failures change no stock; mocks labelled.
- App image policy is not a claim of Gemini zero retention. Verify provider terms/account tier/processing before separate future real-world pilot. All competition documents/images/supplier/product/evaluation records are team-created synthetic data.

## Historical RunPod usage: preserve and declare

There is real historical evidence under `submission/evidence/`: `run_info.json`, `metrics.csv`, `selection.json` and RunPod dashboard/usage/terminal assets. Run `20261021T110320Z` records Chronos-2 LoRA fine-tuning/evaluation on an RTX 4090, 21 October 2026, 11:03:20–11:10:08 UTC (19:03:20–19:10:08 MYT). The [historical AI plan](docs/plans/AI_RUNPOD_PLAN.md) records the revision, dependencies and synthetic metrics. These are historical numerical forecasting results, **not OCR/Gemini results**. Some older local handoffs said no GPU had run; that was a local integration limit and cannot erase the separate training artifacts. No connected application-to-Serverless round trip is proven by these artifacts. Team-history generator/provenance remains an open declaration item.

Preserve `training/`, `worker/`, legacy `data/`, model/evidence and all verification reports. Removing training from the new MVP does not remove actual usage from the declaration. No new training/endpoint/GPU work is requested.

## Competition status and limits

23 October source check used connected Google Drive: main folder listing plus actual D2, Participant Handbook, Official Handbook, Terms & Conditions, proposal and declaration text. Public homepage/FAQ were checked and still show the later deadline. This update did not inspect private Discord, logged-in portal or watch recordings. Orientation slide text was subsequently re-read and confirmed the morning deadline/GPU-conditional wording; sample retrieval returned 404 and the Orbyte brief was not re-read. Preserve limits in [compliance](docs/COMPLIANCE_MATRIX.md).

Replit mandatory (PH §9.2), own-account/project proof (§10.6); deployment/storage durability unverified. RunPod for GPU work (§9.3), proof from teams that used it (§10.7). Sample general Required wording versus hosted-Gemini target remains X-03; no exemption or forced GPU feature. Historical use still needs complete own-account proof. Verbal Orbyte workspace clarification remains separate X-09; no supplied live API or integration claimed.

Deadline: PH/earlier orientation **25 October 2026, 07:59:59 AM MYT** versus website/FAQ **25 October 2026, 11:59 PM MYT**. Conservative internal target **24 October 2026, 20:00 MYT**; use earlier cutoff pending written clarification. Preserve six preliminary deliverables, actual signatures/declarations, workshops/attendance, committee access, public Apache-licensed source, genuine commit history and freeze after deadline. Drafts do not establish submission readiness.

## Team and next handoff

Marco Ryan Suseno: leader/AI. Riakudu Vittorios Surjoraharjos: frontend. Maximillion Cang: data. William Christiansen: system/backend. All reported Xiamen University. Registration contacts remain ignored/private; leader phone and portal matching require team facts.

[Build plan](docs/plans/BUILD_PLAN.md) records five stages: PostgreSQL/roles/ledger; basic inventory and movements; upload/Gemini/saved drafts; matching/review/approval; synthetic evaluation/responsive checks/Replit proof/aligned submission. [Integration](docs/team/integration.md) lists future shared contracts. Existing scope scripts are unchanged and cannot be claimed to cover all new OCR modules.

Documentation completion/check results and remaining decisions are recorded in [DOCUMENT_STATUS.md](DOCUMENT_STATUS.md). Earlier landing-copy follow-up is recorded above. Next action is to configure a Gemini key, start PostgreSQL and request verification of the complete demo flow. Then prepare genuine deployment and competition evidence separately; this source update alone does not establish submission readiness.
