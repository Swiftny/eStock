# Third-party notices

Status updated 23 October 2026. New PostgreSQL/Gemini architecture is a target only; dependencies, source, lockfiles and assets are unchanged. Existing package/version notes below are historical inspection records, not a new dependency audit.

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

## Local backend and worker candidates

The application uses `node:sqlite`, `node:crypto`, `node:fs` and other Node.js built-ins; no database ORM, native addon, animation, chart or new JavaScript runtime dependency was added. Node.js 22.23.3 was used locally; Node and bundled SQLite retain their upstream licences (Node's MIT licence plus third-party notices; SQLite public-domain dedication). Keep the runtime distribution's notices when packaging it.

`worker/requirements.txt` and Dockerfile name Chronos, RunPod and a PyTorch CUDA image as **deployment candidates**. The earlier local worker-contract task did not download or execute those candidate packages/models. Separately, preserved historical RunPod training/evaluation artifacts record actual Chronos-2/AutoGluon/PyTorch use; see the clarification below. Their exact resolved packages/image digest, licences and model commit must be checked and locked after a real GPU spike; do not declare candidate ranges as installed versions. Chronos upstream is Apache 2.0; preserve its model/library notices if deployed. The repository contains original adapter/worker code, not copied model weights.

## Manrope font

Copyright 2019 The Manrope Project Authors (https://github.com/sharanda/manrope).

The unmodified font is supplied through Fontsource and served locally. Its copyright notice and full SIL Open Font License 1.1 are preserved in [public/licenses/manrope-OFL.txt](public/licenses/manrope-OFL.txt), also served at `/licenses/manrope-OFL.txt`.

## Reference and development assistance

[Attio](https://attio.com/) was inspected as a visual reference at the user's request. No Attio logo, image, font file, source code or copy was imported. The eStock text identity, CSS and contextual SVG symbols were created for this project with Codex assistance.

The installed antislop plugin and repository-provided ui-ux-pro-max instructions informed development. They are development tools, not bundled website assets. Actual usage and remaining skill provenance/licence verification are recorded in [the tools declaration draft](docs/submission/TECH_DECLARATION_DRAFT.md). Preserve the team's separately installed `.agents/` files and their upstream notices.

## Planned services and historical model usage

Gemini API (Google) is planned for backend document extraction and PostgreSQL for structured inventory. No Gemini model/SDK/version, ORM, hosting plan/tier or licence/terms selection has been made or installed by this update. Verify current official documentation through Context7 and actual service/model terms/account tier/processing/retention before implementation or any real-world pilot. App transient-image policy does not establish provider zero retention. No paid model API was called.

Historical RunPod run `20261021T110320Z` records `autogluon/chronos-2` revision `60088152a34e242427b44c3100014473a0157d53`, AutoGluon 1.6.3 and torch 2.13.0+cu130 on RTX 4090. Preserve actual package/model notices and resolved-lock evidence in `training/` and `submission/evidence/`; historical source describes Chronos-2 as Apache 2.0. Final licence/proof inventory must follow actual artifacts, including transitive licences. This is old forecasting/training use, not an active-MVP dependency or OCR result. No Serverless app integration is proven by training alone.

Codex assisted this documentation pivot using local file/Git inspection, Python documentation checks, Google Drive read tools and public web source reads. No code, dependencies, runtime service or uploaded receipt assets were created/changed, and no runtime Gemini call was made. Existing AI/skill/design/verification usage remains in the [prior declaration snapshot](docs/archive/2026-10-23-before-document-intake/docs/submission/TECH_DECLARATION_DRAFT.md.txt) and current [declaration draft](docs/submission/TECH_DECLARATION_DRAFT.md). Team review remains required.
