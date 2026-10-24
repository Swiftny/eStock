# eStock: official-template proposal working draft

23 October 2026. Transfer reviewed text into the [official PT template](https://drive.google.com/file/d/1jNjuMJfhMYjo3qQw_PmmeGM-INEwuleo/view) and export **SDC2026_TooGoodToBeTrue_Preliminary.pdf**. This Markdown is not the official PDF, signature or proof of readiness. Current local implementation is document-assisted inventory with Manager preparation and immediate shared Staff receiving; [actual verification](../verification/STAFF_RECEIVING_2026_10_24.md) separates synthetic checks from unverified live OCR/hosting. [Prior draft](../archive/2026-10-23-before-document-intake/docs/submission/PROPOSAL_DRAFT.md.txt) remains historical.

## 1. Team and project overview

| Field | Entry |
| --- | --- |
| Team | TooGoodToBeTrue |
| Domain | 2: Orbyte Smart SME Challenge: Less Busywork, Better Business |
| SDG | 8, targets 8.2 and 8.3 |
| Product | eStock |
| Leader | Marco Ryan Suseno |
| Leader email/phone | Private team record; phone still needs completion |
| University | Xiamen University, as reported; verify portal spelling privately |
| Members | 4: Marco Ryan Suseno; Riakudu Vittorios Surjoraharjo; Maximillion Cang; William Christiansen |

Assignments: Marco leader/AI; Riakudu frontend; Maximillion data; William system/backend. No registration emails or credentials in public documents.

## 2. Executive summary and problem

### 2.1 Problem context: maximum 250 words

<!-- WORDCOUNT:proposal_problem:250 -->
Small shops receive supplier documents whose product descriptions may differ from the names used inside the shop. Managers know the products and suppliers, but must manually retype document lines into inventory and translate abbreviations or unfamiliar names. Staff may not recognise every description. Incorrect product matching or quantities can make current stock difficult to trust.

eStock focuses on one shop managing one warehouse. The recurring burden is recording actual incoming goods accurately while keeping everyday stock withdrawal and return simple for staff. Document text alone cannot prove that goods arrived, so Manager must prepare expected quantities and shared Staff must check physical goods before inventory increases.

The team proposes a document-assisted workflow that combines extraction, the shop catalogue and confirmed aliases, with human approval and a movement history. It will use only team-created synthetic documents, supplier details, products and evaluation records for the hackathon. No real Indonesian or Malaysian business receipts will be used.

This problem is a team hypothesis; interviews, field losses, time savings and customer adoption have not been established. Evaluation will compare manual entry with reviewed intake on declared synthetic tasks and report correction rates, completion times and limitations without claiming real-store impact.
<!-- END_WORDCOUNT -->

### 2.2 Proposed AI solution: maximum 300 words

<!-- WORDCOUNT:proposal_solution:300 -->
eStock will let a Manager photograph or upload a supplier receipt, invoice, delivery note or order-detail image. Gemini, called through the backend, will propose product descriptions, quantities, units, dates and uncertain fields. The application will match official product names and Manager-confirmed aliases. Ambiguous matches require selection; unknown products can be created during review.

Manager corrects the draft and manually converts expected quantities to base units, then sends a frozen receipt to shared Staff. Staff checks the goods, reports Short/Extra differences if needed and confirms actual quantities. This immediately updates inventory and receipt history atomically once; Manager receives informational discrepancy alerts with no further approval. An order-only document or advance invoice cannot automatically increase stock. New products created during review start with zero Opening stock, preventing the receipt quantity from being counted twice.

Staff will search products, choose Take or Return, enter a positive integer quantity and confirm. Backend permissions will restrict product setup, document processing, receipt preparation/sending and full History to Manager; physical receiving confirmation belongs to shared Staff. Take must remain nonnegative under concurrent requests. One shared Staff account limits attribution to that account rather than individual employees.

The target architecture reuses suitable Next.js/TypeScript foundations, PostgreSQL for structured data and Gemini for extraction. Images will be transient; saved drafts contain structured fields without the original image. Monetary fields are excluded. Replit must form part of the solution with own-project evidence. Hosted Gemini leaves the historical RunPod wording conflict open for written clarification; actual earlier RunPod usage remains declared.

The team intends to apply GenAI, database and cloud practices without claiming workshop completion. There is no new forecasting, purchasing, outbox, training, RAG or GPU pipeline in this MVP, and no working live Orbyte integration is claimed.
<!-- END_WORDCOUNT -->

## 3. Technical architecture and implementation plan

### 3.1 Conceptual stack and block diagram

Target: reusable existing Next.js/TypeScript foundation → role-scoped backend → PostgreSQL products/aliases/drafts/ledger, plus backend Gemini image extraction. Model, SDK/version, ORM, database hosting/plan/region and authentication remain unresolved. Existing SQLite/forecast/purchasing modules are legacy, not the target migration. Replit involvement is mandatory; actual own-project proof, deployment/access and restart/redeploy durability remain unverified.

```text
Synthetic document image → Manager upload → backend Gemini extraction
                                               ↓ validated non-monetary fields
Catalogue + confirmed aliases → matching → saved structured Draft
                                               ↓ Manager correction + frozen Send to Staff
                                    Staff physical check → actual Intake + History + discrepancy alert
Staff search → Take / Return → atomic stock movement + updated stock
```

No image persists with the Draft. Gemini has no stock-write authority. Reusable Orbyte-hub permission/approval/activity contracts are proposed only; no live platform API/sandbox was supplied. X-09 verbal workspace issue remains separate. Historical RunPod training/evaluation is retained in the declaration; no new GPU work is added solely to settle X-03.

### 3.2 Design-thinking and deployment: maximum 200 words

<!-- WORDCOUNT:proposal_design:200 -->
The team will test a narrow task: recording received goods from supplier-document lines while keeping staff stock actions simple. Synthetic cases will include unfamiliar descriptions, aliases, missing fields, manual carton conversion and order-only documents without physical delivery. A Manager must resolve extraction/matching/units before sending to Staff.

Implementation is planned in five stages: PostgreSQL and role-scoped ledger foundations; basic inventory and Take/Return; image extraction and saved drafts; matching, correction and atomic Staff receiving; then synthetic evaluation, responsive usability and submission evidence. Existing framework and suitable controls may be reused, while legacy purchasing and forecasting remain outside the new core.

Future checks will cover direct backend permission denial, repeated and concurrent requests, full receipt/results/stock/notification rollback and draft persistence without images. The team will measure extraction corrections and comparable task times rather than inventing accuracy or savings.

Replit usage, own-project proof, persistent deployment and judge access must be verified before submission. All members will review and adapt AI-assisted work, align materials with the actual build, and complete workshop and signature fields truthfully. A separate future real-world pilot requires provider terms, account-tier and retention review.
<!-- END_WORDCOUNT -->

## 4. Preliminary SDG impact framework

| Official field | Draft for team review |
| --- | --- |
| Exact SDG subtargets | 8.2 productivity through technological upgrading; 8.3 support for micro/small enterprises |
| Numeric baseline | **Agent-suggested, unmeasured planning placeholder for team approval:** 10 minutes to manually enter/reconcile one synthetic 10-line intake. This is a proposed benchmark task, not an interview or field result; replace with a timed baseline |
| Core KPI | Median minutes from document/manual entry to prepared receipt and Staff physical confirmation, plus correction rate and invariant failures; report N/case mix/model/mode |
| Phase 2 percentage target | **Agent-suggested, unachieved target for team approval:** 30% lower median completion time than the measured manual baseline, without loss of inventory correctness. Team must review feasibility after measurement |

The former replenishment baseline/50% target is superseded; do not reuse it as evidence for intake. No financial/environmental savings or OCR accuracy results are claimed.

## 5. Eligibility and readiness

- [ ] All members completed mandatory GenAI/Database/Cloud workshops according to clarified PT checklist; resolve X-02 using facts.
- [ ] Problem validation/SDG claim supported honestly; no fabricated interviews.
- [ ] Functional, accessible prototype with required Replit evidence exists and matches these claims.
- [ ] Every official field is completed and final word limits checked.

## 6. IP and originality

Prior-owned work: **TEAM YES/NO ANSWER REQUIRED**, including significant pre-event supporting material and OH §8.2.1 approval applicability/reference. Existing eStock legacy work was created during this event according to historical records; retain genuine history rather than rewriting it. Historical example PRD from another competition was a structural reference, not permission to copy its facts/rules.

Third-party code/models/datasets: actual existing framework/libraries/font/development tools and historical RunPod Chronos-2/AutoGluon/PyTorch use must be declared with verified licences. Planned Gemini/PostgreSQL must stay labelled planned until used. Historical dataset provenance gaps remain open. See [notices](../../THIRD_PARTY_NOTICES.md) and [declaration](TECH_DECLARATION_DRAFT.md).

Employment/internship/consulting IP: **TEAM YES/NO ANSWER REQUIRED** from all members. No invented None. Complete the official table and answers from actual facts.

## 7. Declaration

Leader Marco Ryan Suseno must review the official template and provide the actual signature/date. No signature is created here. Final official PDF/deck/video/prototype/source/declaration must describe the same implemented build and comply with the earlier deadline pending X-01 clarification.
