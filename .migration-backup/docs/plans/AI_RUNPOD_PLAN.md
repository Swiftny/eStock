> **HISTORICAL — superseded 23 October 2026.** The active eStock MVP is document-assisted inventory with target PostgreSQL/backend Gemini. This older forecasting/purchasing/training material and its results/commands are preserved as history, not current build instructions. Do not execute its setup, model calls, deployment or next-stage tasks from the documentation-only request. No new GPU/training workflow is required by the product. Historical RunPod run `20261021T110320Z` and actual evidence remain declarable; older local “not run here” statements do not negate that separate training run. A connected application-to-Serverless inference is not proven by historical training. Existing code and evidence remain unchanged.

# eStock AI and RunPod plan

Updated 21 October 2026. Decisions U-17 (feature scope), U-18 (fine-tuned Chronos-2) and U-19 (two synthetic datasets) are recorded in [DECISIONS.md](../product/DECISIONS.md). Fine-tuning, evaluation and a local worker test have run on a RunPod RTX 4090 (results below). The Serverless endpoint is not deployed yet.

## Feature scope and components

Only one component is AI. Each component has one job: the forecaster predicts demand, the rules decide what to do about it, the approval part records human decisions, and reporting only reads what the others produced.

| Component | Type | Features | Runs on | Track |
| --- | --- | --- | --- | --- |
| Forecaster | AI: Chronos-2, fine-tuned | Demand forecasting (#2) | RunPod | AI |
| Stock records | Code | Real-time stock tracking (#1), incoming-shipment tracking (#19), sales-history CSV import | Replit | App |
| Rules | Code | Stock depletion (#3), reorder recommendations with their reasoning (#4, #23), low-stock and stockout detection (#8), overdue deliveries (#9), alert prioritization (#12, last) | Replit | App |
| Approval and purchasing | Code | Manager approval (#14), purchase-order drafting (#16), supplier outbox with simulated confirmation, staff/manager demo roles | Replit | App |
| Reporting | Code with templates | Weekly/monthly reports (#11, last), activity log, in-app manager notifications | Replit | App |

## How the forecasting method is chosen

`training/finetune.py` trains on both synthetic datasets together (U-19): the 168-day `DEMO-*` fixture and the 2020–2026 `SYN-*` history. It fine-tunes Chronos-2 three times: on everything except each series' last 110 days for validation, everything except the last 44 days for the final test, and all data for production. On the 168-day fixture that is exactly days 1–58, 1–124 and 1–168. Four methods compete for each SKU, listed from simplest to most complex: `WindowAverage28` (28-day mean), `SeasonalNaive7` (same weekday last week), `Chronos2ZeroShot` and `Chronos2FineTuned`.

The method with the lowest validation MAE across the forecasts starting 110 and 96 days before each series' end wins for that SKU. Differences within 1e-9 go to the simpler method, as PRD §8.4 requires. The test forecast (each series' last 44 days) is then reported for every method and for the per-SKU selection, without reselecting.

Expect baselines to win some SKUs, especially the short `DEMO-*` series. The PRD asks for that result to be reported honestly rather than hidden.

## Results of the first GPU run

Run `20261021T110320Z` on 21 October 2026: RunPod Pod with an NVIDIA GeForce RTX 4090, AutoGluon 1.6.3, torch 2.13.0+cu130, base revision `60088152a34e242427b44c3100014473a0157d53`. The three fine-tunes took 141, 132 and 131 seconds, and the whole run took 6 minutes 48 seconds. Source files: `metrics.csv`, `selection.json` and `run_info.json` in `submission/evidence/`.

Pooled over all 10 SKUs. MAE is in units per day; WAPE is the absolute error as a share of actual sales.

| Method | Validation MAE | Validation WAPE | Test MAE | Test WAPE |
| --- | --- | --- | --- | --- |
| Chronos2ZeroShot | 2.8945 | 37.62% | 2.8693 | 36.68% |
| Chronos2FineTuned | 2.8986 | 37.68% | 2.8792 | 36.81% |
| WindowAverage28 | 3.0505 | 39.65% | 3.0063 | 38.43% |
| SeasonalNaive7 | 3.8125 | 49.56% | 3.7182 | 47.53% |
| Selected per SKU | Not pooled | Not pooled | 2.8851 | 36.88% |

Selection from validation: fine-tuned for `SYN-002`, `SYN-003`, `SYN-004` and `SYN-005`; zero-shot for `DEMO-CUP-01`, `DEMO-LID-02`, `DEMO-SYR-05` and `SYN-001`; 28-day mean for `DEMO-NAP-03` and `DEMO-STR-04`, which the worker labels `BASELINE_SELECTED`. Seasonal naive was never selected.

- The per-SKU selection's test MAE is 4.0% lower than the best baseline, the 28-day mean (2.8851 against 3.0063).
- Fine-tuning made no pooled difference. It won 4 of 10 SKUs, but its pooled test MAE is 0.3% higher than zero-shot (2.8792 against 2.8693).
- The selected mix scored slightly worse on the test than zero-shot alone (2.8851 against 2.8693). As PRD §8.4 requires, the selection is reported without reselecting after the test.
- All results come from synthetic data and say nothing about real stores (PRD §8.5).

The local worker test on the same Pod returned `PARTIAL` as expected, with `device` set to `NVIDIA GeForce RTX 4090`.

## Files

| Path | Purpose |
| --- | --- |
| `data/generate_history.py` | Writes the synthetic history (seed 20261021) |
| `data/sales_history.csv` | Generated fixture: 840 rows, 5 SKUs × 168 days |
| `data/estock_sales_daily_5sku_2020-01-01_to_2026-01-01.csv` | Team history: 10,965 rows, 5 SKUs × 2,193 days (weekly and monthly totals alongside) |
| `data/DATA_CARD.md` | Both datasets: patterns, hashes, split, provenance and limitations |
| `training/finetune.py` | Fine-tuning, evaluation, per-SKU selection and evidence files |
| `training/requirements.txt` | `autogluon.timeseries==1.6.3` |
| `worker/handler.py` | RunPod Serverless handler for the PRD §12.4 contract |
| `worker/Dockerfile`, `worker/requirements.txt` | Worker image based on `python:3.12-slim`, with the trained model baked in |
| `worker/test_input.json` | Sample request: two valid series and one that is too short |

After training, the Pod's `/workspace` holds the following. Step 5 packs `production/` and `evidence/` into `estock-model.zip`, which step 6 bakes into the worker image.

```
estock/
    validation/  test/  production/    AutoGluon predictors
    evidence/                          metrics.csv, selection.json, run_info.json
hf/                                    Hugging Face model cache
```

## Steps

### 1. Package the code (local)

In File Explorer, select the `data`, `training` and `worker` folders together, right-click and compress them into `estock-ai.zip`. Select the three folders, not their parent, so the zip opens with those folders at the top. Keep the zip outside the repository.

### 2. Start a GPU Pod

The team's RunPod account can deploy Pods but cannot create network volumes, so the Pod keeps everything on its own volume disk. Open Pods → Deploy and leave Network Volume empty. Under Additional filters → CUDA Versions, pick the newest version offered (13.x): AutoGluon 1.6.3 installs the newest torch it allows, and recent PyPI torch builds target CUDA 13. Choose a 24 GB GPU (for example RTX 4090, RTX A5000 or L4) and the Runpod Pytorch template. Under Edit Template, set Container Disk to 40 GB and Volume Disk to 20 GB (mounted at `/workspace`). Deploy On-Demand, not Spot, so training is not interrupted, then open JupyterLab. The first run used an RTX 4090 in EUR-IS-2.

### 3. Fine-tune and evaluate

Upload `estock-ai.zip` to `/workspace` in JupyterLab, open a terminal and run:

```sh
python --version
cd /workspace
python -m zipfile -e estock-ai.zip estock-ai
cd estock-ai
export HF_HOME=/workspace/hf
pip install --ignore-installed cryptography
pip install -r training/requirements.txt runpod
pip uninstall -y torchvision torchaudio
python -c "import torch; print(torch.__version__, torch.version.cuda, torch.cuda.is_available())"
python training/finetune.py \
    --data data/sales_history.csv data/estock_sales_daily_5sku_2020-01-01_to_2026-01-01.csv \
    --output /workspace/estock
```

Python must be 3.10–3.13, and the torch check must end with `True`. The script ends with `Evidence written to /workspace/estock/evidence` after printing the per-SKU selection and a pooled MAE/WAPE table. If it prints `WARNING: no CUDA GPU detected`, stop: the run does not count as GPU evidence.

### 4. Test the worker on the Pod

```sh
cd /workspace/estock-ai/worker
MODEL_DIR=/workspace/estock python handler.py
```

The RunPod SDK runs `test_input.json`. Expect `"status": "PARTIAL"`, `DEMO-STR-04` as `NEEDS_DATA` (only 14 days) and `device` showing the GPU name.

### 5. Save evidence and stop the Pod

```sh
pip freeze > /workspace/requirements-lock.txt
cd /workspace
python -m zipfile -c estock-model.zip estock/production estock/evidence
```

Download the three files in `/workspace/estock/evidence` into `submission/evidence/`, `requirements-lock.txt` into `training/`, and `estock-model.zip` to a folder outside the repository. Save the terminal output and redacted screenshots of the Pod page and the billing page in `submission/evidence/runpod/`. Then stop the Pod. Do not terminate it: termination deletes the volume disk. A stopped Pod still bills about $0.01 per hour for its disk.

### 6. Build and push the worker image (local)

This needs Docker Desktop (with WSL 2 on Windows) and a Docker Hub account. Unzip `estock-model.zip` into `worker/model/`, so that `worker/model/production/` and `worker/model/evidence/` exist; Git ignores `worker/model/`. Then run:

```sh
cd worker
docker build --platform linux/amd64 -t DOCKERHUB_USER/estock-forecast:0.1 .
docker login
docker push DOCKERHUB_USER/estock-forecast:0.1
```

The image contains the trained model and the base Chronos-2 weights at the revision recorded in `run_info.json`, so the endpoint needs no volume. It contains no secrets, so a public Docker Hub repository is acceptable. Sign in to `docker login` with a Docker Hub access token rather than the account password.

### 7. Create the Serverless endpoint

In RunPod, open Serverless → New Endpoint and use the Docker image `DOCKERHUB_USER/estock-forecast:0.1`. Choose a 16 GB or larger GPU and the CUDA 13.x filter, because the image uses torch built for CUDA 13. Set active (minimum) workers to 0 and max workers to 1, and attach no network volume. RunPod can also build images from a GitHub repository, but that requires authorizing RunPod's GitHub app.

### 8. Call the endpoint

Create an API key in RunPod settings. In Git Bash, read it into a variable without echoing it or saving it in shell history, then call the endpoint:

```sh
read -rs RUNPOD_API_KEY
cd worker
curl -X POST "https://api.runpod.ai/v2/ENDPOINT_ID/runsync" \
     -H "authorization: Bearer $RUNPOD_API_KEY" \
     -H "content-type: application/json" \
     -d @test_input.json
```

The first call is slow because the worker starts cold and loads the model. If `/runsync` times out, poll `https://api.runpod.ai/v2/ENDPOINT_ID/status/JOB_ID` instead of resending, since a resend can create a duplicate billed job. Save the response as `submission/evidence/runpod/serverless-response.json` and a screenshot of the endpoint page as `serverless-endpoint.png`.

### 9. Hand over to the app track

Share the endpoint ID and the PRD §12.4 request/response format. Whoever owns the Replit project adds `RUNPOD_API_KEY` and `RUNPOD_ENDPOINT_ID` in Replit Secrets. The app calls the worker only from server code. Record the endpoint URL in the tools declaration, where it stands in for the Pod ID.

## After the first successful run

- Done 21 October: `training/requirements-lock.txt` saved from the Pod, `runpod==1.12.0` pinned, results recorded under U-18 and in PROJECT_CONTEXT.md, and the tools declaration updated with the model revision and GPU.
- Still to do: add the Serverless endpoint and its response to the tools declaration.

## Security

Never put `RUNPOD_API_KEY`, Docker Hub or Hugging Face tokens in code, the repository, chat, screenshots or the video. The repository becomes public for judging, and a leaked RunPod key lets anyone run billed jobs on the team account. Revoke a leaked key immediately. Do not put GitHub credentials on the Pod; upload the zip instead.

## Troubleshooting

| Symptom | Likely cause | Action |
| --- | --- | --- |
| Torch check prints `False`, or `WARNING: no CUDA GPU detected` | torch's CUDA (second value) is newer than the "CUDA Version" `nvidia-smi` shows | Terminate and redeploy with the newest CUDA filter |
| pip cannot install `autogluon.timeseries` | Python outside 3.10–3.13 | Use a template with a supported Python |
| `uninstall-no-record-file` for a package such as `cryptography` | The template's system package manager (Debian) installed it | `pip install --ignore-installed <package>`, then rerun the requirements install |
| `operator torchvision::nms does not exist`; AutoGluon reports `Models trained: []` | The template's torchvision no longer matches the upgraded torch | `pip uninstall -y torchvision torchaudio`, delete `/workspace/estock` and train again |
| Worker cannot find `run_info.json` | `estock-model.zip` was not unzipped into `worker/model/` before the build, or wrong `MODEL_DIR` | Unzip it so `worker/model/evidence/run_info.json` exists, then rebuild; the image uses `MODEL_DIR=/models` |
| Error during the validation fine-tune | That stage trains on only 58 days | Keep the full error output and review it before changing the split |

## Sources

- [Chronos-2 model card](https://huggingface.co/autogluon/chronos-2)
- [AutoGluon: Forecasting with Chronos-2](https://auto.gluon.ai/stable/tutorials/timeseries/forecasting-chronos.html)
- [AutoGluon `TimeSeriesPredictor.fit`](https://auto.gluon.ai/stable/api/autogluon.timeseries.TimeSeriesPredictor.fit.html)
- [AutoGluon Chronos2 model source](https://auto.gluon.ai/stable/_modules/autogluon/timeseries/models/chronos/chronos2.html)
- [autogluon.timeseries on PyPI](https://pypi.org/project/autogluon.timeseries/)
- [RunPod handler functions](https://docs.runpod.io/serverless/workers/handler-functions)
- [RunPod: send requests](https://docs.runpod.io/serverless/endpoints/send-requests)