# Third-party notices

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

`worker/requirements.txt` and Dockerfile name Chronos, RunPod and a PyTorch CUDA image as **deployment candidates**. Those packages/model were not downloaded or executed here. Their exact resolved packages/image digest, licences and model commit must be checked and locked after a real GPU spike; do not declare candidate ranges as installed versions. Chronos upstream is Apache 2.0; preserve its model/library notices if deployed. The repository contains original adapter/worker code, not copied model weights.

## Manrope font

Copyright 2019 The Manrope Project Authors (https://github.com/sharanda/manrope).

The unmodified font is supplied through Fontsource and served locally. Its copyright notice and full SIL Open Font License 1.1 are preserved in [public/licenses/manrope-OFL.txt](public/licenses/manrope-OFL.txt), also served at `/licenses/manrope-OFL.txt`.

## Reference and development assistance

[Attio](https://attio.com/) was inspected as a visual reference at the user's request. No Attio logo, image, font file, source code or copy was imported. The eStock text identity, CSS and contextual SVG symbols were created for this project with Codex assistance.

The installed antislop plugin and repository-provided ui-ux-pro-max instructions informed development. They are development tools, not bundled website assets. Actual usage and remaining skill provenance/licence verification are recorded in [the tools declaration draft](docs/submission/TECH_DECLARATION_DRAFT.md). Preserve the team's separately installed `.agents/` files and their upstream notices.
