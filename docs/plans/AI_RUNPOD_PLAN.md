# eStock AI and RunPod plan

Saved 21 October 2026 for later review. This is a recommendation, not a team decision; it matches PRD R-03 (`amazon/chronos-bolt-small` on RunPod). Nothing here is implemented.

## Which features need AI

Only one model is needed: demand forecasting (#2). Most other features are rules applied to its output. The PRD forbids calling arithmetic "AI", and judges will check.

| Group | Feature numbers | How |
| --- | --- | --- |
| Real AI | #2 | Chronos-Bolt forecasts daily demand per SKU with p10/p50/p90 quantiles |
| Rules on the forecast | #3, #4, #7, #8, #22, #23 | Projected daily balance, reorder formula, overstock/stockout checks. #23 means showing the facts plus the forecast range |
| CRUD and logic, not AI | #1, #5, #9, #10, #12, #14, #15, #16, #17, #18, #19 | Database, rules and workflow. Do not label them AI |
| Partly AI | #6 | Bolt learns weekly patterns from history but cannot know holidays or promotions absent from it. `amazon/chronos-2` (120M) accepts known future covariates via `predict_df` and `future_df`, but switching means a new spike. Roadmap |
| Would need an LLM | #11, #13, #20, #21 | Skip before Saturday: a second model, more proof, and LLMs invent numbers. If used at all, an LLM may only rephrase facts the rules already computed |

Realistic scope for Saturday: #1, 2, 3, 4, 8, 14, 16 and 19, roughly the PRD MVP.

## Why RunPod

The GPU is for the required proof, not for speed. A 48M-parameter model on 5 SKUs runs fast even on CPU. The plan requires real inference on RunPod with own-account evidence; the worker returns the GPU name as part of that evidence.

## Worker

`worker/handler.py`:

```python
from chronos import BaseChronosPipeline
import runpod
import torch


MODEL_ID = "amazon/chronos-bolt-small"

QUANTILE_LEVELS = [0.1, 0.5, 0.9]

device = "cuda" if torch.cuda.is_available() else "cpu"
pipeline = BaseChronosPipeline.from_pretrained(
    MODEL_ID,
    device_map=device,
    torch_dtype=torch.bfloat16
)


def handler(job):
    request = job["input"]
    series = request["series"]
    contexts = [torch.tensor(item["quantity_sold"], dtype=torch.float32) for item in series]
    quantiles, _ = pipeline.predict_quantiles(
        contexts,
        prediction_length=request["horizon"],
        quantile_levels=QUANTILE_LEVELS
    )
    quantiles = quantiles.float().clamp(min=0)

    return {
        "model": MODEL_ID,
        "device": torch.cuda.get_device_name(0) if device == "cuda" else "cpu",
        "forecasts": [
            {
                "sku": item["sku"],
                "p10": quantiles[i, :, 0].tolist(),
                "p50": quantiles[i, :, 1].tolist(),
                "p90": quantiles[i, :, 2].tolist()
            }
            for i, item in enumerate(series)
        ]
    }


runpod.serverless.start({"handler": handler})
```

`worker/Dockerfile` (the model is downloaded at build time so it is not fetched on every cold start):

```dockerfile
FROM pytorch/pytorch:2.5.1-cuda12.4-cudnn9-runtime
WORKDIR /app
RUN pip install --no-cache-dir runpod chronos-forecasting
RUN python -c "from chronos import BaseChronosPipeline; BaseChronosPipeline.from_pretrained('amazon/chronos-bolt-small')"
COPY handler.py .
CMD ["python", "-u", "handler.py"]
```

## Steps

1. Test locally (falls back to CPU without a GPU): `python handler.py --test_input '{"input": {"horizon": 10, "series": [{"sku": "DEMO-CUP-01", "quantity_sold": [10, 9, 11]}]}}'`. Real requests need at least 28 complete days of history (PRD §8.3).
2. Build and push: `docker build --platform linux/amd64 -t DOCKERHUB_USER/estock-forecast:0.1 .` then `docker push DOCKERHUB_USER/estock-forecast:0.1`. Keep `--platform` when building on a Mac.
3. RunPod console → Serverless → New Endpoint → custom image. Choose a 16 GB GPU tier, min workers 0 (pay only while running), max workers 1.
4. Call it:

```sh
curl -X POST https://api.runpod.ai/v2/ENDPOINT_ID/runsync \
     -H "authorization: Bearer RUNPOD_API_KEY" \
     -H "content-type: application/json" \
     -d '{"input": {"horizon": 10, "series": [{"sku": "DEMO-CUP-01", "quantity_sold": [10, 9, 11]}]}}'
```

The response has `status` and `output`, and `output.device` holds the GPU name. Save it for the tools declaration.

5. Call the endpoint only from the Replit server, with `RUNPOD_API_KEY` in Replit Secrets.

## Security

Never put `RUNPOD_API_KEY` in frontend code, the repository, screenshots or the video. The repository becomes public for judging, and a leaked key lets anyone run billed jobs on the team account. If one leaks, revoke it in RunPod immediately.

## Before locking it in

- Pin package versions (`pip freeze`) and the model revision after the first successful run.
- PRD §12.4 also expects `request_id`, `input_hash`, `cutoff` and `runtime_ms` in the response.
- If `/runsync` times out, poll `/status/JOB_ID` instead of resending; RunPod warns that a resend can create a duplicate billed job.

## Sources

- [chronos-forecasting](https://github.com/amazon-science/chronos-forecasting)
- [amazon/chronos-bolt-small](https://huggingface.co/amazon/chronos-bolt-small)
- [chronos base.py, `predict_quantiles`](https://raw.githubusercontent.com/amazon-science/chronos-forecasting/main/src/chronos/base.py)
- [RunPod handler functions](https://docs.runpod.io/serverless/workers/handler-functions)
- [RunPod send requests](https://docs.runpod.io/serverless/endpoints/send-requests)