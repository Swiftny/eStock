import os
import unittest
from datetime import date, timedelta
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


if __name__ == "__main__":
    unittest.main()
