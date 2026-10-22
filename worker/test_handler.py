import os
import sys
import unittest
from contextlib import nullcontext
from types import SimpleNamespace
from unittest.mock import patch
from datetime import date, timedelta
from handler import baseline, choose_method, evaluate, metrics, validate_request
import handler as worker


def synthetic_handler_output(data, *, cuda=True, raw=10.0, shape=None):
    """Exercise handler wiring without Torch, a model download, network or a GPU."""
    calls = []
    class Quantiles:
        def __init__(self, horizon):
            self.shape = shape or (1, horizon, 1)
            self.values = [raw] * horizon
        def __getitem__(self, index):
            assert index == (0, slice(None), 0)
            return self
        def tolist(self):
            return self.values
    class Pipeline:
        @staticmethod
        def from_pretrained(model, **options):
            assert model == worker.MODEL_ID
            assert options["revision"] == data["modelRevision"]
            assert options["device_map"] == "cuda"
            return Pipeline()
        def predict_quantiles(self, values, *, prediction_length, quantile_levels):
            calls.append((len(values), prediction_length))
            assert quantile_levels == [0.5]
            return Quantiles(prediction_length), None
    torch = SimpleNamespace(cuda=SimpleNamespace(is_available=lambda: cuda, get_device_name=lambda _: "Synthetic CUDA mock; no GPU executed"), float32="float32", tensor=lambda values, **_: values, inference_mode=nullcontext)
    with patch.dict(sys.modules, {"torch": torch, "chronos": SimpleNamespace(ChronosBoltPipeline=Pipeline)}), patch.object(worker, "_PIPELINE", None):
        result = worker.handler({"input": data})
    return result, calls


class WorkerContractTests(unittest.TestCase):
    def setUp(self):
        environment = patch.dict(os.environ, {"CHRONOS_MODEL_REVISION": "a" * 40})
        environment.start()
        self.addCleanup(environment.stop)
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

    def test_handler_contract_with_synthetic_dependencies(self):
        result, calls = synthetic_handler_output(self.request)
        self.assertEqual(calls, [(58, 33), (72, 33), (124, 33), (168, 33)])
        self.assertEqual(result["source"], "BASELINE_SELECTED")
        self.assertEqual(result["requestId"], self.request["requestId"])
        self.assertEqual(result["productId"], self.request["productId"])
        self.assertEqual(result["inputHash"], self.request["inputHash"])
        self.assertEqual(result["modelRevision"], self.request["modelRevision"])
        self.assertEqual(result["dates"][0], "2026-10-21")
        self.assertEqual(len(result["dates"]), 33)
        self.assertEqual(result["p50"], [10] * 33)
        self.assertEqual(result["modelP50"], [10] * 33)

    def test_short_evaluation_retains_model_but_uses_labelled_baseline(self):
        data = {**self.request, "values": [10] * 28, "dates": self.request["dates"][-28:], "stockoutFlags": [False] * 28}
        result, calls = synthetic_handler_output(data)
        self.assertEqual(calls, [(28, 33)])
        self.assertEqual(result["source"], "BASELINE_FALLBACK")
        self.assertIsNone(result["evaluation"]["validation"])
        self.assertTrue(any("pending evaluation" in warning for warning in result["warnings"]))

    def test_handler_rejects_no_cuda_bad_shapes_and_nonfinite_predictions(self):
        with self.assertRaisesRegex(RuntimeError, "CUDA"):
            synthetic_handler_output(self.request, cuda=False)
        with self.assertRaisesRegex(ValueError, "shape"):
            synthetic_handler_output(self.request, shape=(1, 1, 33))
        for raw in (float("nan"), float("inf"), 1000001):
            with self.assertRaisesRegex(ValueError, "invalid demand"):
                synthetic_handler_output(self.request, raw=raw)
        result, _ = synthetic_handler_output(self.request, raw=-1)
        self.assertEqual(result["modelP50"], [0] * 33)
        self.assertTrue(any("clipped" in warning for warning in result["warnings"]))

    def test_request_identity_dates_horizon_and_flags(self):
        for changes in ({"requestId": ""}, {"productId": None}, {"inputHash": 1}, {"horizonDays": 29}, {"horizonDays": 45}, {"horizonDays": True}, {"dates": ["20261020"] * 168}, {"dates": ["2026-10-20"] * 168}, {"stockoutFlags": [False]}, {"stockoutFlags": [0] * 168}, {"modelRevision": None}, {"modelRevision": "b" * 40}):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                validate_request({**self.request, **changes})


if __name__ == "__main__":
    unittest.main()
