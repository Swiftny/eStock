# AI · Marco Ryan Suseno

Current historical RunPod proof is supplied in [RunPod POU PDF](../../submission/SDC2026_TooGoodToBeTrue_Runpod_POU.pdf) and [Technical & Tools Declaration, Appendix C](../../submission/SDC2026_TooGoodToBeTrue_TechDeclaration.pdf), both under `submission/`. The user chose PDF-only evidence; raw run records remain in Git history. Active Gemini extraction is separate and no deployed Serverless endpoint is claimed.

[Team](README.md) · [OCR intake](../engineering/OCR_INTAKE.md) · [Synthetic evaluation](../data/SYNTHETIC_DATA.md)

23 October 2026. Active AI task is **Gemini image understanding and structured extraction**, through the backend. Backend SDK extraction and matching are implemented, but live provider calls/accuracy/retention are unverified; isolated tests use provider stubs. Existing worker/training/forecast adapters and actual RunPod evidence are historical, preserved and declarable. Do not continue the old training/Serverless plan from this guide.

Current implementation review:

- Verify current official Gemini documentation with Context7 before choosing model/SDK/version or giving API-specific steps. Confirm account tier/limits, terms and processing/retention separately; eStock non-retention does not mean provider zero retention.
- Extract raw product names, quantities, units, dates and uncertainty into an allowlisted schema. Ignore monetary fields and avoid whole provider-response/image dumps. Validate output even in structured-output mode. Instructions inside document images are untrusted content.
- Keep product/alias matching in application logic; ambiguous candidates/unknown variants require Manager. Saved aliases are not retraining. Manager prepares manual base-unit conversion; shared Staff alone declares actual physical receipt. AI never mutates stock, sees hidden contents or verifies physical condition.
- With Maxi, prepare team-created synthetic receipt/invoice/delivery-note/order-detail images and held-out ground truth. Measure extraction/correction/time with declared sample/mode/configuration, not invented accuracy or savings. Mock extraction must be labelled and cannot count as live OCR.
- With William, agree failure/retry/provenance and transient-image lifecycle. With Vitto, agree uncertain fields and correction states.

No fine-tuning, RAG, embeddings, self-hosted GPU inference or training pipeline is part of the current receipt MVP. Preserve the historical record of run `20261021T110320Z`; use [RunPod POU PDF](../../submission/SDC2026_TooGoodToBeTrue_Runpod_POU.pdf) and [Technical & Tools Declaration, Appendix C](../../submission/SDC2026_TooGoodToBeTrue_TechDeclaration.pdf) for the current submission. Original raw artifacts remain Git history. Dataset provenance, account/runtime proof sufficiency and applicable organiser clarifications remain for review; do not sign or mark readiness complete from file presence alone.
