import os
import unittest
from contextlib import nullcontext
from datetime import date, timedelta
from types import SimpleNamespace
from unittest.mock import patch
import handler as worker
from handler import baseline, choose_method, evaluate, metrics, validate_request


class WorkerContractTests(unittest.TestCase):
    def setUp(self):
        os.environ["CHRONOS_MODEL_REVISION"] = "a" * 40
        self.request = {"requestId": "synthetic-request", "productId": "opaque-id", "inputHash": "hash", "modelId": "amazon/chronos-bolt-small", "modelRevision": "a" * 40, "cutoffDate": "2026-10-20", "horizonDays": 33, "values": [10] * 168, "dates": [(date(2026, 10, 20) - timedelta(days=167 - i)).isoformat() for i in range(168)], "stockoutFlags": [False] * 168}

    def test_validation(self):
        self.assertEqual(validate_request(self.request), self.request)
        for bad in (float("nan"), -1, float("inf"), True):
            with self.assertRaises(ValueError):
                validate_request({**self.request, "values": [bad] * 168})
        with self.assertRaises(ValueError):
            validate_request({**self.request, "modelRevision": "main"})
        with self.assertRaises(ValueError):
            validate_request({**self.request, "cutoffDate": "2026-10-21"})

    def test_ties_and_zero_denominator(self):
        self.assertEqual(choose_method({"mean28": 1, "seasonal7": 1, "model": 1}), "mean28")
        self.assertEqual(metrics([0, 0], [0, 0], [False, False])["wape"], None)
        self.assertEqual(metrics([3], [1], [True])["n"], 0)

    def test_evaluation_never_passes_future_targets_to_prediction(self):
        lengths = []
        def predict(values, horizon):
            lengths.append(len(values))
            return [10] * horizon
        result = evaluate([10] * 168, [False] * 168, 33, predict)
        self.assertEqual(lengths, [58, 72, 124])
        self.assertEqual(result["selected"], "mean28")
        self.assertEqual(result["finalTest"]["model"]["mae"], 0)
        self.assertEqual(baseline([10] * 28, 33, "mean28"), [10] * 33)

    def test_short_history_selects_explicit_baseline_without_invented_evaluation(self):
        def no_validation_inference(*args):
            self.fail("Short history must not claim a validation split")
        result = evaluate([10] * 28, [False] * 28, 30, no_validation_inference)
        self.assertEqual(result["selected"], "mean28")
        self.assertIsNone(result["validation"])
        self.assertIsNone(result["finalTest"])
        self.assertIn("pending evaluation", result["limitation"])

    def test_censored_targets_are_excluded_identically_for_all_candidates(self):
        result = evaluate([10] * 168, [True] * 168, 30, lambda values, horizon: [99] * horizon)
        self.assertEqual(result["selected"], "mean28")
        for candidate in result["validation"].values():
            self.assertEqual(candidate["n"], 0)
            self.assertIsNone(candidate["mae"])
            self.assertIsNone(candidate["wape"])

    def test_invalid_dates_flags_horizons_and_revisions_fail(self):
        for changes in (
            {"horizonDays": 29}, {"horizonDays": 45}, {"horizonDays": True},
            {"stockoutFlags": [0] * 168}, {"dates": ["2026-10-20"] * 168},
            {"modelRevision": "b" * 40}, {"productId": ""},
        ):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                validate_request({**self.request, **changes})

    def test_handler_contract_with_simulated_cuda_and_pipeline(self):
        # These substitutes exercise serialization only; they are not GPU evidence.
        predictions = []
        class SimulatedQuantiles:
            def __init__(self, horizon):
                self.horizon = horizon
            def __getitem__(self, indexes):
                self_test.assertEqual(indexes, (0, slice(None), 0))
                return SimpleNamespace(tolist=lambda: [10.0] * self.horizon)
        class SimulatedPipeline:
            def predict_quantiles(self, values, prediction_length, quantile_levels):
                self_test.assertEqual(quantile_levels, [0.5])
                predictions.append(len(values))
                return SimulatedQuantiles(prediction_length), None
        self_test = self
        torch = SimpleNamespace(
            float32="synthetic-float32", tensor=lambda values, **kwargs: values,
            inference_mode=nullcontext,
            cuda=SimpleNamespace(is_available=lambda: True, get_device_name=lambda index: "SIMULATED CUDA; NOT GPU EVIDENCE"),
        )
        chronos = SimpleNamespace(ChronosBoltPipeline=SimpleNamespace(from_pretrained=lambda *args, **kwargs: SimulatedPipeline()))
        with patch.dict("sys.modules", {"torch": torch, "chronos": chronos}), patch.object(worker, "_PIPELINE", None):
            result = worker.handler({"input": self.request})
        self.assertEqual(result["requestId"], self.request["requestId"])
        self.assertEqual(result["productId"], self.request["productId"])
        self.assertEqual(result["inputHash"], self.request["inputHash"])
        self.assertEqual(result["modelRevision"], self.request["modelRevision"])
        self.assertEqual(len(result["p50"]), 33)
        self.assertEqual(result["dates"][0], "2026-10-21")
        self.assertEqual(result["source"], "BASELINE_SELECTED")
        self.assertEqual(result["modelP50"], [10.0] * 33)
        self.assertEqual(predictions, [58, 72, 124, 168])
        self.assertIn("SIMULATED", result["device"])


if __name__ == "__main__":
    unittest.main()
