"""Synthetic numerical forecasting only. Purchasing rules remain in TypeScript."""
import math
import os
import re
import time
from datetime import date, datetime, timedelta, timezone

MODEL_ID = "amazon/chronos-bolt-small"
_PIPELINE = None


def validate_request(data):
    if not isinstance(data, dict):
        raise ValueError("input must be an object")
    values, dates = data.get("values"), data.get("dates")
    horizon = data.get("horizonDays")
    if not isinstance(values, list) or not 28 <= len(values) <= 168:
        raise ValueError("28–168 complete daily observations required")
    if not isinstance(dates, list) or len(dates) != len(values):
        raise ValueError("dates and values must have equal length")
    if type(horizon) is not int or not 30 <= horizon <= 44:
        raise ValueError("horizonDays must be 30–44")
    if any(type(v) not in (int, float) or not math.isfinite(v) or not 0 <= v <= 1000000 for v in values):
        raise ValueError("values must be finite nonnegative quantities")
    if any(not isinstance(d, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", d) for d in dates):
        raise ValueError("dates must be ISO YYYY-MM-DD business dates")
    parsed = [date.fromisoformat(d) for d in dates]
    if any(parsed[i] != parsed[i - 1] + timedelta(days=1) for i in range(1, len(parsed))):
        raise ValueError("history must be consecutive; no missing-day zero fill")
    if parsed[-1].isoformat() != data.get("cutoffDate"):
        raise ValueError("last observation must equal cutoffDate")
    flags = data.get("stockoutFlags")
    if not isinstance(flags, list) or len(flags) != len(values) or any(type(v) is not bool for v in flags):
        raise ValueError("stockoutFlags must align with history")
    for key in ("requestId", "productId", "inputHash"):
        if not isinstance(data.get(key), str) or not 1 <= len(data[key]) <= 200:
            raise ValueError(f"invalid {key}")
    revision = data.get("modelRevision", "")
    if data.get("modelId") != MODEL_ID or not isinstance(revision, str) or not re.fullmatch(r"[a-f0-9]{40}", revision):
        raise ValueError("fixed model and pinned Hugging Face commit required")
    if revision != os.environ.get("CHRONOS_MODEL_REVISION"):
        raise ValueError("request revision differs from deployed worker revision")
    return data


def baseline(values, horizon, method):
    if method == "mean28":
        return [sum(values[-28:]) / 28] * horizon
    return [values[-7 + i % 7] for i in range(horizon)]


def metrics(predictions, actual, censored):
    pairs = [(p, a) for p, a, flag in zip(predictions, actual, censored) if not flag]
    if not pairs:
        return {"mae": None, "wape": None, "n": 0}
    error = sum(abs(p - a) for p, a in pairs)
    denominator = sum(a for _, a in pairs)
    return {"mae": error / len(pairs), "wape": error / denominator if denominator else None, "n": len(pairs)}


def choose_method(scores):
    # Strict improvement is required; ties prefer mean28, then seasonal7, then model.
    selected = "mean28"
    for method in ("seasonal7", "model"):
        if scores[method] is not None and (scores[selected] is None or scores[method] < scores[selected] - 1e-9):
            selected = method
    return selected


def evaluate(values, flags, horizon, predict):
    if len(values) < 168:
        return {"selected": "mean28", "validation": None, "finalTest": None, "limitation": "Fewer than 168 days: validation selection and final evaluation unavailable. Using the 28-day baseline pending evaluation; GPU model output is retained separately."}
    validation_pairs = {m: ([], [], []) for m in ("mean28", "seasonal7", "model")}
    for origin in (58, 72):
        for method in validation_pairs:
            predictions = predict(values[:origin], horizon) if method == "model" else baseline(values[:origin], horizon, method)
            ps, actual, censored = validation_pairs[method]
            ps.extend(predictions)
            actual.extend(values[origin:origin + horizon])
            censored.extend(flags[origin:origin + horizon])
    validation = {method: metrics(*parts) for method, parts in validation_pairs.items()}
    selected = choose_method({m: v["mae"] for m, v in validation.items()})
    final_test = {}
    for method in validation_pairs:
        predictions = predict(values[:124], horizon) if method == "model" else baseline(values[:124], horizon, method)
        final_test[method] = metrics(predictions, values[124:124 + horizon], flags[124:124 + horizon])
    return {"selected": selected, "validation": validation, "finalTest": final_test, "origins": [58, 72], "finalOrigin": 124, "horizon": horizon, "excluded": "Stockout target days excluded identically for all methods; unknown lost demand is not imputed.", "selection": "Frozen on pooled validation MAE before final test. Ties choose simpler baseline, mean28 first."}


def handler(job):
    global _PIPELINE
    data = validate_request(job["input"])
    started = time.perf_counter()
    import torch
    from chronos import ChronosBoltPipeline
    if not torch.cuda.is_available():
        raise RuntimeError("GPU inference required for this worker; CUDA is unavailable")
    if _PIPELINE is None:
        _PIPELINE = ChronosBoltPipeline.from_pretrained(MODEL_ID, revision=data["modelRevision"], device_map="cuda", torch_dtype=torch.float32)
    clipped = False

    def predict(values, horizon):
        nonlocal clipped
        with torch.inference_mode():
            quantiles, _ = _PIPELINE.predict_quantiles(torch.tensor(values, dtype=torch.float32), prediction_length=horizon, quantile_levels=[0.5])
        if tuple(quantiles.shape) != (1, horizon, 1):
            raise ValueError("model returned an unexpected quantile shape")
        raw = quantiles[0, :, 0].tolist()
        if any(not math.isfinite(v) or abs(v) > 1000000 for v in raw):
            raise ValueError("model returned invalid demand")
        clipped = clipped or any(v < 0 for v in raw)
        return [max(0.0, v) for v in raw]

    evaluation = evaluate(data["values"], data["stockoutFlags"], data["horizonDays"], predict)
    model_p50 = predict(data["values"], data["horizonDays"])
    selected = evaluation["selected"]
    p50 = model_p50 if selected == "model" else baseline(data["values"], data["horizonDays"], selected)
    warnings = []
    if clipped:
        warnings.append("Negative model output clipped to zero.")
    if any(data["stockoutFlags"]):
        warnings.append("Observed sales may be censored by stockouts; true lost demand is unknown.")
    if selected != "model" and evaluation["validation"] is not None:
        warnings.append(f"{selected} baseline selected by validation MAE; purchasing demand is not model output. GPU inference and evaluation are retained.")
    if evaluation.get("limitation"):
        warnings.append(evaluation["limitation"])
    cutoff = date.fromisoformat(data["cutoffDate"])
    source = "RUNPOD" if selected == "model" else "BASELINE_SELECTED" if evaluation["validation"] is not None else "BASELINE_FALLBACK"
    return {"status": "COMPLETED", "requestId": data["requestId"], "productId": data["productId"], "source": source, "modelId": MODEL_ID, "modelRevision": data["modelRevision"], "inputHash": data["inputHash"], "cutoffDate": data["cutoffDate"], "generatedAt": datetime.now(timezone.utc).isoformat(), "runtimeMs": round((time.perf_counter() - started) * 1000), "dates": [(cutoff + timedelta(days=i + 1)).isoformat() for i in range(data["horizonDays"])], "p50": p50, "modelP50": model_p50, "warnings": warnings, "evaluation": evaluation, "device": torch.cuda.get_device_name(0)}


if __name__ == "__main__":
    import runpod
    runpod.serverless.start({"handler": handler})
