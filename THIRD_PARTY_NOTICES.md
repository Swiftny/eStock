# Third-party notices

Current RunPod proof is supplied in [RunPod POU PDF](submission/SDC2026_TooGoodToBeTrue_Runpod_POU.pdf) and [Technical & Tools Declaration, Appendix C](submission/SDC2026_TooGoodToBeTrue_TechDeclaration.pdf). The user selected PDF-only submission evidence. Original raw run files remain historical Git records, not files included in the current submission folder.

Status updated 23 October 2026. The new demo source adds PostgreSQL and Gemini dependencies. Versions and licence identifiers below were read from installed package metadata; this is not a full transitive dependency or deployment licence audit.

The repository's original Apache 2.0 [LICENSE](LICENSE) remains unchanged. Dependencies and tools retain their own licences.

## Landing-page dependencies

Versions and licence identifiers below were read from the installed packages on 21 October 2026. Exact dependency resolution is recorded in package-lock.json; transitive packages retain their accompanying notices.

| Package | Version | Licence |
| --- | --- | --- |
| next | 16.4.2 | MIT |
| react / react-dom | 19.3.1 | MIT |
| @fontsource-variable/manrope | 5.3.0 | OFL-1.1 |
| typescript | 6.0.3 | Apache-2.0 |
| @biomejs/biome | 2.5.15 | MIT OR Apache-2.0 |
| @types/node | 26.6.5 | MIT |
| @types/react / @types/react-dom | 19.3.0 | MIT |

## New demo dependencies

| Package | Installed version | Licence | Purpose |
| --- | --- | --- | --- |
| `@google/genai` | 2.31.0 | Apache-2.0 | Server-side Gemini document extraction |
| `pg` | 8.23.1 | MIT | PostgreSQL connection pool |
| `@types/pg` | 8.23.1 | MIT | Development types |
| `playwright-core` | 1.64.1 | Apache-2.0 | Development-only isolated browser verification; installed Chrome is used, no browser binary downloaded |

The optional local Compose file uses the `postgres:17-alpine` image. Its image/base-layer notices and the full installed dependency tree require inspection before final packaging. No database service or Gemini API was started/called during this source update.

## Local backend and worker candidates

The preserved legacy application uses `node:sqlite`, `node:crypto`, `node:fs` and other Node.js built-ins. The new demo uses Node built-ins and `pg` without an ORM. Node.js 22.23.3 was used in earlier local work; Node and bundled SQLite retain their upstream licences (Node's MIT licence plus third-party notices; SQLite public-domain dedication). Keep the runtime distribution's notices when packaging it.

`worker/requirements.txt` and Dockerfile name Chronos, RunPod and a PyTorch CUDA image as **deployment candidates**. The earlier local worker-contract task did not download or execute those candidate packages/models. Separately, preserved historical RunPod training/evaluation artifacts record actual Chronos-2/AutoGluon/PyTorch use; see the clarification below. Their exact resolved packages/image digest, licences and model commit must be checked and locked after a real GPU spike; do not declare candidate ranges as installed versions. Chronos upstream is Apache 2.0; preserve its model/library notices if deployed. The repository contains original adapter/worker code, not copied model weights.

## Manrope font

Copyright 2019 The Manrope Project Authors (https://github.com/sharanda/manrope).

The unmodified font is supplied through Fontsource and served locally. Its copyright notice and full SIL Open Font License 1.1 are preserved in [public/licenses/manrope-OFL.txt](public/licenses/manrope-OFL.txt), also served at `/licenses/manrope-OFL.txt`.

`public/estock-logo.svg` embeds the same unmodified Manrope Latin WOFF2 font to reproduce the existing eStock wordmark as a self-contained image. The font notice and licence above also apply to that embedded copy.

## Reference and development assistance

[Attio](https://attio.com/) was inspected as a visual reference at the user's request. No Attio logo, image, font file, source code or copy was imported. The eStock text identity, CSS and contextual SVG symbols were created for this project with Codex assistance.

The installed antislop plugin and repository-provided ui-ux-pro-max instructions informed development. They are development tools, not bundled website assets. Actual usage and remaining skill provenance/licence verification are recorded in [the tools declaration draft](docs/submission/TECH_DECLARATION_DRAFT.md). Preserve the team's separately installed `.agents/` files and their upstream notices.

## Demo service and historical model usage

The demo source uses the `@google/genai` SDK with explicitly configured `gemini-3.8-flash` and PostgreSQL for structured inventory. `ESTOCK_GEMINI_MODEL` must name that model exactly; no implicit selection or alternate-model fallback is allowed. Hosting plan/region, account tier, actual service terms and provider processing/retention require verification before a real-world pilot. App transient-image policy does not establish provider zero retention. No live or paid model API call was made in this source update.

Historical RunPod run `20261021T110320Z` records `autogluon/chronos-2` revision `60088152a34e242427b44c3100014473a0157d53`, AutoGluon 1.6.3 and torch 2.13.0+cu130 on RTX 4090. The current proof is supplied in [RunPod POU PDF](submission/SDC2026_TooGoodToBeTrue_Runpod_POU.pdf) and [Technical & Tools Declaration, Appendix C](submission/SDC2026_TooGoodToBeTrue_TechDeclaration.pdf). Original raw metadata/metrics and run assets remain in Git history; the training environment lock remains source under `training/`. Historical source describes Chronos-2 as Apache 2.0; final licence inventory must follow actual upstream/transitive notices. This earlier forecasting use does not establish active OCR or a deployed Serverless integration.

Codex assisted the earlier documentation pivot and later demo source implementation. The source update changed code, dependencies and local setup; it made no runtime Gemini call or deployment. Existing AI/skill/design/verification usage remains in the [prior declaration snapshot](docs/archive/2026-10-23-before-document-intake/docs/submission/TECH_DECLARATION_DRAFT.md.txt) and current [declaration draft](docs/submission/TECH_DECLARATION_DRAFT.md). Team review remains required.
