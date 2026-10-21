from datetime import date, datetime, timedelta, timezone
from pathlib import Path
import hashlib
import json
import math
import time
import os

from autogluon.timeseries import TimeSeriesDataFrame, TimeSeriesPredictor
import pandas as pd
import numpy as np
import runpod
import torch


MODEL_DIR = Path(os.environ.get("MODEL_DIR", "/runpod-volume/estock"))

MINIMUM_HISTORY_DAYS = 28

MAXIMUM_HORIZON_DAYS = 44

BASELINES = ("WindowAverage28", "SeasonalNaive7")

DEFAULT_METHOD = "Chronos2ZeroShot"

runInfo = json.loads((MODEL_DIR / "evidence" / "run_info.json").read_text())
selection = json.loads((MODEL_DIR / "evidence" / "selection.json").read_text())
predictor = TimeSeriesPredictor.load(str(MODEL_DIR / "production"))
deviceName = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "cpu"



######## VALIDATION ########

def findProblem(series, cutoff):
    dates = [date.fromisoformat(value) for value in series["dates"]]
    values = series["values"]
    if len(dates) != len(values):
        return "dates and values differ in length"

    if len(values) < MINIMUM_HISTORY_DAYS:
        return f"needs at least {MINIMUM_HISTORY_DAYS} complete days, got {len(values)}"

    if dates[-1] != cutoff or any(later - earlier != timedelta(days=1) for earlier, later in zip(dates, dates[1:])):
        return "dates must be consecutive days ending on cutoff_date"

    if not all(isinstance(value, (int, float)) and math.isfinite(value) and value >= 0 for value in values):
        return "values must be finite and non-negative"

    return None



######## FORECASTING ########

def baselineForecast(values, method, horizon):
    if method == "WindowAverage28":
        return np.full(horizon, values[-28:].mean())

    return np.resize(values[-7:], horizon)


def modelForecast(series, method, horizon):
    context = TimeSeriesDataFrame.from_data_frame(
        pd.DataFrame(
            {
                "item_id": series["sku"],
                "timestamp": pd.to_datetime(series["dates"]),
                "target": series["values"]
            }
        )
    )
    name = next(name for name in predictor.model_names() if name.endswith(method.removeprefix("Chronos2")))
    predictions = predictor.predict(context, model=name).iloc[:horizon]
    return {level: predictions[level].to_numpy() for level in ("0.1", "0.5", "0.9")}


def forecastSeries(series, cutoff, horizon, warnings):
    sku = series["sku"]
    problem = findProblem(series, cutoff)
    if problem:
        return {"sku": sku, "status": "NEEDS_DATA", "reason": problem}

    method = selection.get(sku)
    if method is None:
        method = DEFAULT_METHOD
        warnings.append(f"{sku}: no validation result; used {DEFAULT_METHOD}")

    dates = [(cutoff + timedelta(days=offset)).isoformat() for offset in range(1, horizon + 1)]
    if method in BASELINES:
        p50 = baselineForecast(np.asarray(series["values"], dtype=float), method, horizon)
        return {
            "sku": sku,
            "status": "OK",
            "source": "BASELINE_SELECTED",
            "method": method,
            "dates": dates,
            "p50": p50.round(3).tolist(),
            "quantiles": None
        }

    quantiles = modelForecast(series, method, horizon)
    if any((values < 0).any() for values in quantiles.values()):
        warnings.append(f"{sku}: negative forecast values clipped to zero")

    quantiles = {level: values.astype(float).clip(min=0).round(3).tolist() for level, values in quantiles.items()}
    return {
        "sku": sku,
        "status": "OK",
        "source": "MODEL",
        "method": method,
        "dates": dates,
        "p50": quantiles["0.5"],
        "quantiles": {"0.1": quantiles["0.1"], "0.9": quantiles["0.9"]}
    }



######## HANDLER ########

def handler(job):
    startedAt = time.perf_counter()
    request = job["input"]
    cutoff = date.fromisoformat(request["cutoff_date"])
    horizon = request["horizon_days"]
    warnings = []
    if not isinstance(horizon, int) or not 1 <= horizon <= MAXIMUM_HORIZON_DAYS:
        forecasts = []
        warnings.append(f"horizon_days must be an integer from 1 to {MAXIMUM_HORIZON_DAYS}")

    else:
        forecasts = [forecastSeries(series, cutoff, horizon, warnings) for series in request["series"]]

    okCount = sum(forecast["status"] == "OK" for forecast in forecasts)
    status = "ERROR" if not forecasts else "OK" if okCount == len(forecasts) else "PARTIAL" if okCount else "NEEDS_DATA"
    return {
        "request_id": request.get("request_id"),
        "status": status,
        "model_id": runInfo["base_model"],
        "model_revision": f"{runInfo['base_revision']}+finetune-{runInfo['run_id']}",
        "input_hash": hashlib.sha256(json.dumps(request, sort_keys=True).encode("utf-8")).hexdigest(),
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "runtime_ms": round((time.perf_counter() - startedAt) * 1000),
        "device": deviceName,
        "forecasts": forecasts,
        "warnings": warnings
    }


if __name__ == "__main__":
    runpod.serverless.start({"handler": handler})