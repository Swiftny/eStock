# AI workspace · Marco

[Team pages](README.md) · [Data](data.md) · [Backend](backend.md)

## Existing implementation and place to work

Use the existing `worker/` folder for model code and experiments. Start with `worker/README.md`, then `worker/handler.py`, `worker/test_handler.py`, `worker/requirements.txt` and `worker/Dockerfile`. The application adapter is `src/lib/server/forecast.ts`; request/result types are `ForecastRequest` and `ForecastResult` in `src/lib/contracts.ts`.

The current plan uses pretrained Chronos-Bolt Small inference and evaluation. No training or fine-tuning has been implemented or established as necessary. The worker has not yet executed real GPU inference here. Local worker tests do not download or execute the neural model.

## Next tasks

- [ ] Review the existing numerical forecast contract with William and synthetic history with Maxi.
- [ ] Prepare a real RunPod inference spike for the team's own account, within separately authorised resource use.
- [ ] After a successful spike, pin the model revision and resolved Python/CUDA/Torch packages and image digest.
- [ ] Evaluate against the 28-day mean and seasonal-naive baselines on a fixed synthetic dataset and cutoff.
- [ ] Keep validation/model selection separate from the final held-out evaluation; prevent future-data leakage.
- [ ] Retain actual request/result, input hash, model revision, runtime, GPU/endpoint and account evidence with secrets redacted.
- [ ] Verify pending, failed and successful responses with William, including explicit fallback/source labels.
- [ ] If training becomes necessary, first document its purpose, synthetic dataset, split, cost and expected benefit; coordinate the scope change with the team.

Keep experiments under `worker/experiments/` if needed. Store large weights, caches, credentials and private proof outside tracked source. Publish only small synthetic inputs, scripts and redacted results that the team has reviewed. No new model-training platform or service has been provisioned by this task.

## Review evidence

Use the existing worker and forecast tests described in the root README. Report model and baseline MAE/WAPE and sample counts from actual runs. A baseline win is a valid result. Local mock output, dashboard screenshots alone and replayed results are not evidence of live GPU inference.

## Parallel work boundary

Read [integration rules](integration.md). For code changes, select the `ai` area and run `python3 scripts/check_scope.py ai` before handoff. Shared files require a separate coordinated task. Demo rehearsal is shared; only one active task edits the demo interface at a time.
