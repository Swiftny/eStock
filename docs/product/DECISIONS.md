# eStock: active decisions and open items

23 October 2026. Product decisions below are approved requirements; implementation is paused pending explicit instruction. [Complete earlier register](../archive/2026-10-23-before-document-intake/docs/product/DECISIONS.md.txt) preserves old U/R/OPEN/SUB IDs and implementation history. Old IDs U-16/U-17/U-18 were reused for different topics; cite the historical section/date when referring to them. They do not override this pivot.

## New user decisions

| ID | Decision | Basis / impact |
| --- | --- | --- |
| U-20 | eStock is document-assisted inventory, one shop/one warehouse | User's 23 October source and instructions; supersedes forecasting scope U-03/04/05/06 and historical U-17/18/19 product/training plans |
| U-21 | Documentation only now; stop before implementation | Explicit user boundary; old coding authorisations do not start the new workflow |
| U-22 | Manager-only catalogue/Opening/upload/drafts/approval/full History; both roles Take/Return/view/search | Separate Manager + one shared Staff account, backend enforcement; staff individual attribution unavailable |
| U-23 | Official name/base unit/Opening/generated ID; integer operations | No mandatory entered SKU, barcode or shelf; positive Intake/Take/Return, concurrent nonnegative Take |
| U-24 | Actual-receipt confirmation before Intake; atomic immutable once-only approval | Image/invoice/order text is not physical-delivery evidence; no PO-management addition |
| U-25 | Preserve raw/final names, quantities, units and dates; manual conversion and confirmed aliases | No silent variant merge, automatic conversion or Gemini retraining |
| U-26 | Target PostgreSQL + backend Gemini, reuse existing Next.js/TypeScript where appropriate | Model/SDK/hosting/ORM unresolved; no migration/live integration claimed |
| U-27 | No permanent uploaded images or monetary features | Structured drafts persist without image; re-upload needed later; verify provider retention separately |
| U-28 | Low stock strictly below 5; similar-document warnings P1 | Zero is Low stock, 5 is not; no forecast; same-draft protection is narrower than duplicate uploads |
| U-29 | Preserve original Indonesian source; canonical English working docs | English instruction U-10 retained; source corrections documented in current PRD |
| U-30 | Retain teal/Linear/Shopify proposed direction in DESIGN.md only | No CSS/site redesign now; U-11 UI skills/during mode preserved for future UI |

Retained identities/assignments: U-01 eStock; U-07 leader/four names; U-10 English; U-11 ui-ux-pro-max + antislop during; U-15 existing Next.js/TypeScript/plain-CSS foundation. Historical verbal Orbyte workspace decision remains X-09, separate from written D2 rules. Old channel, fine-tuning, policy and numerical-evaluation defaults are historical, not active backlog.

## Explicit implementation clarifications

| ID | Clarification | Reason |
| --- | --- | --- |
| IC-01 | Opening permits nonnegative integer, including one zero Opening record; review-created product always starts 0 | Resolves source positive-quantity wording without double-counting receipt as Opening and Intake |
| IC-02 | Approved and Discarded drafts terminal; approval/edit/discard use revision/concurrency protection | Gives reliable page/retry/race behaviour; Approved immutable |
| IC-03 | Product edits cannot mutate stock or reinterpret posted base units | General stock corrections remain out of scope; retain immutable approval snapshots |
| IC-04 | Persistent event/request identity for Take/Return and approval; changed-payload reuse conflicts | Lost responses/concurrent requests cannot post twice |

These are behavioural clarifications, not quotations from the supplied PRD or already implemented database mechanisms.

## Unresolved implementation decisions

| ID | Decision to make after explicit authorisation | Evidence needed |
| --- | --- | --- |
| OPEN-01 | PostgreSQL schema/migration layer/ORM and legacy isolation | Current official documentation, reversible migration/reuse plan preserving old data |
| OPEN-02 | Replit own project/account/usage and deployment arrangement | PH §9.2/10.6 evidence; restart/redeploy persistence, not assumptions |
| OPEN-03 | X-03 RunPod clarification and historical proof completeness | Written organiser interpretation for hosted Gemini; actual historical own-account proof |
| OPEN-04 | Gemini model/SDK/version, account tier/limits and processing/retention | Verified current docs/terms and approved resource limits; no exact selection now |
| OPEN-05 | PostgreSQL hosting/plan/region, backups and judge access | Verify actual service, persistence and approved costs; no provisioning now |
| OPEN-06 | Manager/shared Staff authentication/session lifecycle | Backend role/read/write denial and shared-account limitation |
| OPEN-07 | New API/types/errors/idempotency/revisions/ownership map | One shared-contract editor; existing scripts need future scoped extension |
| OPEN-08 | Proposed palette and interaction details | DESIGN.md source direction; future measured contrast/mobile/keyboard Delivery Gate |
| OPEN-09 | Confirm required skill locations in future session | Resolve current catalog; preserve ui-ux-pro-max and antislop during |
| OPEN-10 | Bounds for image size/types, extraction schema and safe integer quantities | Actual synthetic cases/provider constraints; no invented performance claims |
| OPEN-11 | Alias collision/normalisation and P1 similarity contract | Explicit Manager selection and no variant merge; no image retention |
| OPEN-12 | Synthetic receipt fixture authorship/version and measurement plan | Team-created assets/ground truth; no real receipts or pilot claims |

Historical OPEN-05/06 messaging options are superseded by the pivot; no WhatsApp/Telegram feature is needed. Assignments are resolved, but task availability/reviewers and submission artifact owners need confirmation.

## Team and submission facts

| Member | Assignment | University |
| --- | --- | --- |
| Marco Ryan Suseno | Leader / AI | Xiamen University |
| Riakudu Vittorios Surjoraharjos | Frontend | Xiamen University |
| Maximillion Cang | Data | Xiamen University |
| William Christiansen | System / backend | Xiamen University |

Retain SUB-01 leader contact/phone, SUB-02 portal identity matching, SUB-03 Discord/reveal attendance, SUB-04 workshop facts, SUB-05 deadline clarification, SUB-06 committee usernames, SUB-07 six final artifact/access links, SUB-08 platform proof, SUB-09 actual evaluation/timing, SUB-10 full tools/resources inventory, SUB-11 prior-work/licence/employment-IP answers, SUB-12 leader signature/date and SUB-13 latest portal/announcement checks. All require actual evidence; no unknown becomes None and no AI signs on behalf of the team. Private contacts stay in ignored `.private/TEAM_DETAILS.md`.

Historical RunPod run `20261021T110320Z` and `submission/evidence/` remain declarable, despite no training in the new MVP. Existing data provenance gaps stay open. [Compliance IDs C-01–44 and conflicts X-01–09](../COMPLIANCE_MATRIX.md) remain separate from product decisions.

Record future decisions with date, decision maker, reason, status, impact and linked files. Update context, PRD, build handoff and submission narrative together. Documentation completion does not authorise code or establish submission readiness.
