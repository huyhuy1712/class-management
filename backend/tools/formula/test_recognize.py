import importlib.util
from pathlib import Path
import unittest
import socket

spec = importlib.util.spec_from_file_location("formula_worker", Path(__file__).with_name("recognize.py"))
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)


class FormulaGeometryTest(unittest.TestCase):
    def test_bounds_detected_regions(self):
        points = [[-1, 10], [20, 10], [20, 30], [-1, 30]]
        self.assertEqual([0, 10, 20, 30], worker.checked_box(points, 100, 100))

    def test_rejects_nonfinite_empty_and_oversized_regions(self):
        for points in ([], [[float("nan"), 0]], [[5, 5]], [[0, 0], [2000, 2000]]):
            with self.assertRaises(ValueError):
                worker.checked_box(points, 3000, 3000)

    def test_runtime_blocks_network_connections(self):
        original = (socket.socket.connect, socket.socket.connect_ex, socket.create_connection)
        try:
            worker.offline_mode()
            with socket.socket() as connection:
                with self.assertRaises(PermissionError):
                    connection.connect(("example.invalid", 443))
        finally:
            socket.socket.connect, socket.socket.connect_ex, socket.create_connection = original


class FormulaDetectorTest(unittest.TestCase):
    def setUp(self):
        try:
            import onnx_formula
        except ImportError:
            self.skipTest("Local ONNX runtime is not installed")
        self.module = onnx_formula

    def test_nms_overlap(self):
        overlap = self.module.FormulaDetector.overlap([0, 0, 10, 10], [5, 0, 15, 10])
        self.assertAlmostEqual(1 / 3, overlap)
        self.assertEqual(0, self.module.FormulaDetector.overlap([0, 0, 1, 1], [2, 2, 3, 3]))

    def test_unpads_letterboxed_coordinates_and_removes_duplicate_detection(self):
        import numpy as np
        from PIL import Image
        from types import SimpleNamespace

        class Model:
            def run(self, _, values):
                self.input_shape = values["images"].shape
                return [np.array([[
                    [50, 51], [50, 50], [20, 20], [10, 10], [0.9, 0.8], [0.1, 0.2],
                ]], dtype=np.float32)]

        detector = self.module.FormulaDetector.__new__(self.module.FormulaDetector)
        detector.input = SimpleNamespace(name="images", shape=[1, 3, 100, 100])
        detector.model = Model()
        with Image.new("RGB", (100, 50), "white") as image:
            results = detector.detect(image, box_margin=0)
        self.assertEqual((1, 3, 100, 100), detector.model.input_shape)
        self.assertEqual(1, len(results))
        np.testing.assert_allclose([[40, 20], [60, 30]], results[0]["box"])


if __name__ == "__main__":
    unittest.main()
