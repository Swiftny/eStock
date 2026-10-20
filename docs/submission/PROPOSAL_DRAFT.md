# eStock: preliminary proposal template draft

Source: official PT template. **This is working text to transfer into the official template and export as PDF**, not a replacement for its layout/form. The team must review, adapt, verify facts and sign it themselves.

Official output filename: **SDC2026_TooGoodToBeTrue_Preliminary.pdf**.

This draft does not claim a completed application, measurements, workshop completion or deployment proof.

## 1. Team and Project Overview

| Template field | Entry |
| --- | --- |
| Team Name | TooGoodToBeTrue |
| Selected Domain | Domain 2: Orbyte Smart SME Challenge: Less Busywork, Better Business |
| Selected SDG Track | SDG 8: Decent Work and Economic Growth; targets 8.2 and 8.3 |
| Project / Solution Name | eStock |
| Name (Leader) | Marco Ryan Suseno |
| Email & Phone (Leader) | Email in .private/TEAM_DETAILS.md; phone not provided |
| University Affiliation(s) | Xiamen University, as reported by the user; check campus spelling against the portal |
| Number of Team Members | 4 |

Members: Marco Ryan Suseno; Riakudu Vittorios Surjoraharjos; Maximillion Cang; William Christiansen. Final work assignments have not been agreed.

## 2. Executive Summary & Problem Statement

### 2.1 The Problem Context: maximum 250 words

<!-- WORDCOUNT:proposal_problem:250 -->
Small businesses that maintain sales, stock records and supplier communication in separate tools must repeatedly reconcile those records before replenishing inventory. An owner may need to check recent sales, count usable stock, find outstanding purchases, estimate supplier delivery time and decide how much to order. A low-stock alert alone does not explain whether an incoming purchase will arrive in time or whether another order would duplicate an existing commitment.

eStock targets this recurring operational task for Malaysian micro and small enterprises managing physical stock. Its configurable product policies support different units, suppliers and purchasing cycles without requiring a separate custom application for every business.

The problem matters because manual reconciliation consumes time and can produce inconsistent purchasing decisions. The proposed prototype will test whether connecting the relevant records and presenting a traceable recommendation reduces the effort required to prepare a purchasing decision.

The team has not yet established the prevalence or financial cost of this problem through SME interviews. All prototype business records and evaluation data will be team-created and synthetic. Any timed task results will be reported as prototype measurements, not field savings or evidence of customer adoption.
<!-- END_WORDCOUNT -->

### 2.2 The Proposed AI Solution: maximum 300 words

<!-- WORDCOUNT:proposal_solution:300 -->
eStock connects recorded sales, usable inventory, dated incoming purchases, supplier information and per-product purchasing policies. A recorded stock movement or daily review starts an analysis. A pretrained time-series model estimates future unit demand from completed daily sales history. Deterministic rules then calculate a proposed purchase quantity using the forecast, supplier lead time, review interval, safety stock, packaging and existing confirmed purchases.

The manager receives a recommendation showing its inputs, assumptions, data cutoff and any shortage before expected deliveries. Only an authorised manager can approve, edit with a reason, or reject the proposed purchase. Approval creates a purchase request and supplier message in an auditable outbox. Supplier acknowledgement and physical receipt are recorded separately; approval never increases physical stock.

Replit will host the application workflow, while RunPod will perform real model inference. The model will be compared against simple historical baselines. If a baseline performs better or inference is unavailable, the application will identify the method actually used rather than presenting a fallback as AI.

The MVP uses synthetic CSV data and stock-entry forms. A labelled supplier simulator completes the demonstration; official WhatsApp messaging is preferred if account setup permits, and Telegram is optional. Simulated identity and Orbyte interfaces will show how eStock could reuse shared permissions, approval and audit services without claiming live Orbyte access.

The team will apply database, cloud deployment and responsible AI practices. The contribution is a connected replenishment decision workflow, not a chatbot or replacement ERP.
<!-- END_WORDCOUNT -->

## 3. Technical Architecture & Implementation Plan

### 3.1 Conceptual Tech Stack

Planned mandatory components:

- Web application and server workflow on Replit.
- Persistent database for ledger, daily sales, policy, forecast, approval, outbox, PO and audit.
- Python worker/pretrained model on RunPod.
- Synthetic CSV input and stock movement/receiving forms.
- Server-side replenishment, permission, idempotency and outbox rules.
- Supplier simulator; official WhatsApp if ready; optional Telegram.

Application framework/database packages/model revision/deployment region have not been selected or verified. Populate them from M0 decisions and actual implementation before the final PDF. Initial recommendation: TypeScript web/server, PostgreSQL and Python worker; this is not an actual-used stack declaration.

    CSV / forms → Replit application → persistent database
                                 ↘ RunPod forecast worker
                       forecast + stock policies → manager approval
                       → purchase outbox → supplier acknowledgement
                       → goods receipt → stock ledger + activity log

Sponsor resources: Replit/RunPod usage is planned and must be demonstrated with the team's own projects/accounts. No Orbyte API, production account or sponsor dataset was supplied for this prototype. Record actual usage in the final declaration.

### 3.2 Design-Thinking & Deployment Strategy: maximum 200 words

<!-- WORDCOUNT:proposal_design:200 -->
The team will investigate how SME owners currently decide when and how much to reorder, focusing on the information they reconcile and the exceptions they must resolve. A short task-based review will test whether a new user can understand the recommendation, identify uncertainty and complete approval without additional verbal instructions.

The MVP will demonstrate one complete replenishment journey using a small, configurable synthetic inventory. It will include missing data, a delayed incoming purchase and duplicate-action tests. A model deployment spike will test RunPod integration before interface expansion. Historical-only baselines and time-ordered evaluation will distinguish model performance from stock-policy correctness.

The application will be deployed through Replit with persistent storage, server-side secrets and accessible judge instructions. Simulated channels and Orbyte interfaces will be labelled. Before submission, the team will verify the live build from a fresh session, review all AI-assisted work, reconcile the proposal with the actual implementation, and prepare a backup recording. Later development will prioritise validated integrations rather than expanding into a full ERP.
<!-- END_WORDCOUNT -->

## 4. Preliminary Environmental & SDG Impact Framework

| Field | Draft for review |
| --- | --- |
| Exact SDG sub-target(s) | SDG 8.2, productivity through technological upgrading; SDG 8.3, support for entrepreneurship and micro/small enterprises |
| Current Problem Baseline | Planning assumption: 10 minutes to prepare one manual replenishment decision. NOT measured field data. Replace with actual timed prototype-task baseline or retain explicitly as an assumption |
| Core Measurable KPI | Median minutes per complete purchasing decision; report participants/cases and comparable manual/eStock task |
| Phase 2 Impact Target | Proposed 50% reduction relative to the verified baseline by the final prototype; target, not achieved result |
| Supporting technical evidence | MAE/WAPE model vs baselines; duplicate-order prevention; percentage of decisions with complete audit |

No environmental savings or food-waste reduction claims without appropriate measurement.

## 5. Eligibility & Readiness Checklist

Do not tick before verification:

- [ ] ALL members completed GenAI, Database and Cloud Deployment workshops as required by the template.
- [ ] Concept addresses a verified real-world problem directly mapped to SDG(s).
- [ ] Team targets a functional deployed application.
- [ ] Every field is completed within word limits.

Team note: TC says general workshops may be attended, while the template has a specific mandatory checklist. Clarify accepted attendance/tasks/replays; do not fabricate or ignore these checkboxes.

## 6. IP & Originality Declaration

### 6.1 Pre-Existing / Prior-Owned Work

**TEAM ANSWER REQUIRED: Yes/No.** Audit materials owned before the hackathon. eStock source must be new during the event; disclose supporting libraries/models/templates as required.

For significant pre-existing material covered by OH §8.2.1, record whether organiser approval is required, its status and written approval reference before use. Do not assume declaration alone is always sufficient. Distinguish prior-owned core assets from ordinary supporting libraries; clarify uncertain scope.

The example flood PRD from another competition was used only as a structural reference. Do not copy its facts, features, data, source or claims as eStock work. Determine whether this reference belongs in the supporting-material list under the form.

### 6.2 Third-Party Code, Datasets or Models

**Yes/No: CONFIRM FROM ACTUAL USAGE BEFORE FINALISATION.** Planned third-party models/frameworks mean Yes if those components are actually used. Do not leave Yes/No blank on the official form.

Populate from actual implementation:

| Name | Type | Licence |
| --- | --- | --- |
| Chronos-Bolt Small, if used | Pretrained model | Apache 2.0; pin revision/model card |
| Runtime libraries/frameworks | Code | Actual names/versions/licences from lockfiles |
| eStock synthetic dataset | Team-created synthetic data | Explicitly assign the team's dataset licence |
| Other assets/templates | According to usage | Verify ownership/licence |

Do not treat this table as final if libraries/models have not been used. Declare runtime AI and AI-assisted development tools in TechDecl.

### 6.3 Employment-Related IP Conflicts

**TEAM ANSWER REQUIRED: Yes/No.** Ask each member about relevant employment/internship/consulting arrangements. If Yes, explain and follow organiser instructions; AI cannot declare None on members' behalf.

## 7. Declaration

Leader name: Marco Ryan Suseno.

Signature: **LEADER TO COMPLETE AFTER REVIEW**.

Date: **ACTUAL SIGNING DATE**.

Before signing: confirm product/figures match implementation, the team reviewed/adapted all AI text, personal fields are correct and this draft was transferred into the official template.
