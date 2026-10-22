from datetime import datetime, timezone
from importlib.metadata import version
from pathlib import Path
import argparse
import hashlib
import json
import time

from autogluon.timeseries import TimeSeriesDataFrame, TimeSeriesPredictor
from huggingface_hub import HfApi
import pandas as pd
import numpy as np
import torch


BASE_MODEL = "autogluon/chronos-2"

PREDICTION_LENGTH = 44

VALIDATION_OFFSETS = (110, 96)

TEST_OFFSET = PREDICTION_LENGTH

QUANTILE_LEVELS = [0.1, 0.5, 0.9]

TIE_TOLERANCE = 1e-9

BASELINES = ("WindowAverage28", "SeasonalNaive7")

MODELS = ("Chronos2ZeroShot", "Chronos2FineTuned")

METHODS_BY_SIMPLICITY = BASELINES + MODELS

TOTAL_COLUMNS = ["abs_error", "actual_total", "points"]



######## DATA ########

def parseArguments():
    parser = argparse.ArgumentParser(description="Evaluate and fine-tune Chronos-2 on the eStock synthetic history.")
    parser.add_argument("--data", type=Path, nargs="+", default=[Path("data/sales_history.csv")])
    parser.add_argument("--output", type=Path, default=Path("/workspace/estock"))
    return parser.parse_args()


def loadHistory(csvPaths):
    frame = pd.concat([pd.read_csv(path, parse_dates=["business_date"]) for path in csvPaths], ignore_index=True)
    frame = frame.rename(columns={"sku": "item_id", "business_date": "timestamp", "quantity_sold": "target"})
    return TimeSeriesDataFrame.from_data_frame(frame[["item_id", "timestamp", "target"]])



######## FORECASTING ########

def fitPredictor(trainData, path, revision):
    predictor = TimeSeriesPredictor(
        prediction_length=PREDICTION_LENGTH,
        freq="D",
        eval_metric="MAE",
        quantile_levels=QUANTILE_LEVELS,
        path=str(path)
    )
    predictor.fit(
        trainData,
        tuning_data=trainData,
        hyperparameters={
            "Chronos2": [
                {"model_path": BASE_MODEL, "revision": revision, "ag_args": {"name_suffix": "ZeroShot"}},
                {"model_path": BASE_MODEL, "revision": revision, "fine_tune": True, "ag_args": {"name_suffix": "FineTuned"}}
            ]
        },
        enable_ensemble=False
    )
    return predictor


def modelName(predictor, method):
    suffix = method.removeprefix("Chronos2")
    return next(name for name in predictor.model_names() if name.endswith(suffix))


def baselineForecast(context, method):
    forecasts = {}
    for sku, series in context.groupby(level="item_id"):
        values = series["target"].to_numpy(dtype=float)
        if method == "WindowAverage28":
            forecasts[sku] = np.full(PREDICTION_LENGTH, values[-28:].mean())

        else:
            forecasts[sku] = np.resize(values[-7:], PREDICTION_LENGTH)

    return forecasts


def modelForecast(predictor, context, method):
    predictions = predictor.predict(context, model=modelName(predictor, method))
    return {sku: rows["0.5"].clip(lower=0).to_numpy() for sku, rows in predictions.groupby(level="item_id")}



######## EVALUATION ########

def scoreOrigin(data, predictor, offset):
    context = data.slice_by_timestep(None, -offset)
    actuals = data.slice_by_timestep(-offset, -offset + PREDICTION_LENGTH or None)
    forecasts = {method: baselineForecast(context, method) for method in BASELINES}
    forecasts.update({method: modelForecast(predictor, context, method) for method in MODELS})

    rows = []
    for sku, series in actuals.groupby(level="item_id"):
        actual = series["target"].to_numpy(dtype=float)
        for method, perSku in forecasts.items():
            rows.append(
                {
                    "offset_from_end": offset,
                    "method": method,
                    "sku": sku,
                    "abs_error": float(np.abs(perSku[sku] - actual).sum()),
                    "actual_total": float(actual.sum()),
                    "points": len(actual)
                }
            )

    return rows


def selectMethods(validationRows):
    totals = pd.DataFrame(validationRows).groupby(["sku", "method"])[TOTAL_COLUMNS].sum()
    mae = (totals["abs_error"] / totals["points"]).to_dict()

    selection = {}
    for sku in sorted({sku for sku, _ in mae}):
        best = METHODS_BY_SIMPLICITY[0]
        for method in METHODS_BY_SIMPLICITY[1:]:
            if mae[(sku, method)] < mae[(sku, best)] - TIE_TOLERANCE:
                best = method

        selection[sku] = best

    return selection


def summarize(rows, stage):
    totals = pd.DataFrame(rows).groupby(["sku", "method"], as_index=False)[TOTAL_COLUMNS].sum()
    pooled = totals.groupby("method", as_index=False)[TOTAL_COLUMNS].sum().assign(sku="ALL")
    summary = pd.concat([totals, pooled], ignore_index=True)
    summary["mae"] = summary["abs_error"] / summary["points"]
    summary["wape"] = (summary["abs_error"] / summary["actual_total"]).where(summary["actual_total"] > 0)
    return summary.assign(stage=stage)[["stage", "sku", "method", "mae", "wape", "points"]]



######## MAIN CONTROL FLOW ########

def main():
    arguments = parseArguments()
    evidence = arguments.output / "evidence"
    evidence.mkdir(parents=True, exist_ok=True)
    gpuName = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "cpu"
    if gpuName == "cpu":
        print("WARNING: no CUDA GPU detected. This run does not count as RunPod GPU evidence.")

    data = loadHistory(arguments.data)
    revision = HfApi().model_info(BASE_MODEL).sha
    startedAt = datetime.now(timezone.utc)

    stages = (
        ("validation", -max(VALIDATION_OFFSETS), VALIDATION_OFFSETS),
        ("test", -TEST_OFFSET, (TEST_OFFSET,)),
        ("production", None, ())
    )
    rows = {}
    fitSeconds = {}
    for stage, trainEnd, offsets in stages:
        fitStart = time.perf_counter()
        predictor = fitPredictor(data.slice_by_timestep(None, trainEnd), arguments.output / stage, revision)
        fitSeconds[stage] = round(time.perf_counter() - fitStart, 1)
        rows[stage] = [row for offset in offsets for row in scoreOrigin(data, predictor, offset)]

    selection = selectMethods(rows["validation"])
    selectedRows = [dict(row, method="Selected") for row in rows["test"] if row["method"] == selection[row["sku"]]]
    metrics = pd.concat([summarize(rows["validation"], "validation"), summarize(rows["test"] + selectedRows, "test")])
    metrics.to_csv(evidence / "metrics.csv", index=False, float_format="%.4f")
    (evidence / "selection.json").write_text(json.dumps(selection, indent=2))

    runInfo = {
        "run_id": startedAt.strftime("%Y%m%dT%H%M%SZ"),
        "base_model": BASE_MODEL,
        "base_revision": revision,
        "fine_tune": "AutoGluon Chronos2 defaults (LoRA)",
        "prediction_length": PREDICTION_LENGTH,
        "validation_offsets_from_end": list(VALIDATION_OFFSETS),
        "test_offset_from_end": TEST_OFFSET,
        "data_files": {path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in arguments.data},
        "gpu": gpuName,
        "versions": {"autogluon.timeseries": version("autogluon.timeseries"), "torch": torch.__version__},
        "fit_seconds": fitSeconds,
        "started_at": startedAt.isoformat(timespec="seconds"),
        "finished_at": datetime.now(timezone.utc).isoformat(timespec="seconds")
    }
    (evidence / "run_info.json").write_text(json.dumps(runInfo, indent=2))

    print(json.dumps(selection, indent=2))
    print(metrics[metrics["sku"] == "ALL"].to_string(index=False))
    print(f"Evidence written to {evidence}")


if __name__ == "__main__":
    main()