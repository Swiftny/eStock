# RunPod forecasting worker

This worker is implemented but **has not run on RunPod or downloaded/executed Chronos here**. Local Python tests validate its request and evaluation logic without importing Torch or RunPod. A successful mocked HTTP contract test is not a real GPU round trip.

The server uses RunPod's queue API: [`POST /run`, then `GET /status/{jobId}`](https://docs.runpod.io/serverless/endpoints/send-requests). The numerical model interface follows the upstream [Chronos code](https://github.com/amazon-science/chronos-forecasting/blob/main/src/chronos/chronos_bolt.py). No chatbot or training is involved.

## Configure after account access is available

1. In your own RunPod account, choose a GPU queue-based Serverless endpoint and an appropriate CUDA image. Do not leave idle GPUs running unnecessarily. The included Dockerfile is a deployment candidate, not a tested published image.
2. Choose a 40-character commit revision from the `amazon/chronos-bolt-small` model repository. Set `CHRONOS_MODEL_REVISION` to that exact value on both the worker and application. Mutable `main` is rejected. Model revision and exact resolved worker packages must be frozen after a successful GPU spike; requirements.txt contains explicit candidate ranges, not a claim of a verified lock.
3. Build the worker image from this folder, test CUDA availability, then configure the endpoint to run `python -u handler.py`. Install the CUDA-compatible PyTorch wheel supplied by your selected image. After the first successful run, retain `pip freeze`, Python/CUDA/Torch versions, image digest and licence inventory. No image build, package download, endpoint provisioning or billing action was performed during this local task.
4. Put `RUNPOD_ENDPOINT_ID`, `RUNPOD_API_KEY`, `CHRONOS_MODEL_REVISION` and `FORECAST_MODE=RUNPOD` into server environment secrets. Never put the API key in a browser variable, public source, screenshots or chat. `.env.example` contains names only. Restart the application after changing configuration.
5. Analyse a seeded SKU in `/demo`. The application saves the pending job, polls with **Check pending analysis**, validates the result identity/dates/finite quantities and saves the completed result and purchasing recommendation. Provider requests have a 15-second HTTP timeout. The endpoint can remain queued; check again after cold start. Invalid model output or missing configuration fails without silently falling back. A network/provider failure may use an explicitly labelled 28-day-mean fallback when `FORECAST_ALLOW_FALLBACK=true`. Set it to `false` to exercise failed analysis.
6. Record an actual request/result from your account: model/revision, cutoff, input hash, generated time, runtime, GPU type, endpoint ID and own-account dashboard evidence. Retain job result quickly because provider results expire. The SQLite analysis record preserves the returned result. Replit must also show its own project running the application. Neither local baseline output nor mocked tests satisfy the competition's RunPod requirement.

## Contract and selection

Input contains only an opaque product ID, request ID, 28–168 complete consecutive dated sales observations, cutoff, stockout flags, input hash, 30–44-day horizon and model/revision. Supplier names, contacts and prices are excluded. Server-side history validation rejects unresolved gaps and incomplete days before submission. Negative/nonfinite observations are rejected.

The worker requires CUDA. It returns daily median demand, model ID/revision, generated time, runtime, device, input hash and warnings. Negative finite output is clipped with a warning. A result's source identifies the demand series used for purchasing; model output is retained separately if a baseline wins.

With 168 observations, validation origins are after observations 58 and 72. The common horizon is `max(30, lead time + effective review)`, at most 44. Selection uses pooled validation MAE, excluding stockout target days identically. Ties favour the simpler baseline, then the 28-day mean. Selection freezes before the final origin after observation 124. MAE/WAPE/N for the model, 28-day mean and seasonal-naive are saved; zero WAPE denominator is null. Overlapping validation targets are deliberately pooled as origin/day observations. With 28–167 complete days, the worker retains actual model inference but uses a labelled mean baseline pending full evaluation.

The app sends the latest 168 days for operational inference. Worker evaluation always slices each origin before predicting; targets never enter that prediction call. Evaluation on a rolling operational window is diagnostic; submission results require a fixed, declared seed/cutoff and retained full evaluation artifact. No real accuracy or savings claim has been established.

A submission interrupted before its provider job ID is saved is marked unknown/failed after a bounded wait. The application does not blindly resubmit that job. Review the provider dashboard before retrying. Concurrent/repeated analysis clicks do not submit additional jobs for the same input identity.
