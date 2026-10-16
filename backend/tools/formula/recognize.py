"""Bounded JSON batch worker. Only local model files and local source images are used."""

import argparse
import contextlib
import hashlib
import json
import math
import os
from pathlib import Path
import socket
import sys

MAX_IMAGES = 150
MAX_FORMULAS = 1000
MAX_PIXELS = 16_000_000
MAX_FORMULA_PIXELS = 2_000_000


def offline_mode():
    for key in ("HF_HUB_OFFLINE", "TRANSFORMERS_OFFLINE", "HF_HUB_DISABLE_TELEMETRY"):
        os.environ[key] = "1"
    os.environ["YOLO_OFFLINE"] = "true"
    os.environ["YOLO_AUTOINSTALL"] = "false"
    os.environ["OMP_NUM_THREADS"] = "2"
    # The models are ONNX; Transformers is only used for local image preprocessing/tokenization.
    os.environ["USE_TORCH"] = "0"
    os.environ["USE_TF"] = "0"
    os.environ["USE_FLAX"] = "0"

    def denied(*args, **kwargs):
        raise PermissionError("NETWORK_DISABLED_FOR_FORMULA_WORKER")

    socket.socket.connect = denied
    socket.socket.connect_ex = denied
    socket.create_connection = denied


def checked_box(points, width, height):
    values = [(float(point[0]), float(point[1])) for point in points]
    if not values or not all(math.isfinite(value) for point in values for value in point):
        raise ValueError("INVALID_DETECTION_BOX")
    left = max(0, math.floor(min(point[0] for point in values)))
    top = max(0, math.floor(min(point[1] for point in values)))
    right = min(width, math.ceil(max(point[0] for point in values)))
    bottom = min(height, math.ceil(max(point[1] for point in values)))
    if right <= left or bottom <= top or (right - left) * (bottom - top) > MAX_FORMULA_PIXELS:
        raise ValueError("FORMULA_BOX_LIMIT")
    return [left, top, right, bottom]


def recognize(input_data, models_directory):
    from PIL import Image
    from onnx_formula import FormulaDetector, FormulaRecognizer

    Image.MAX_IMAGE_PIXELS = MAX_PIXELS
    root = Path(models_directory).resolve(strict=True)
    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    images = input_data.get("images")
    if not isinstance(images, list) or not images or len(images) > MAX_IMAGES:
        raise ValueError("INVALID_IMAGE_BATCH")

    detector = FormulaDetector(root / manifest["models"]["mfd"]["file"])
    recognizer = FormulaRecognizer(root / manifest["models"]["mfr"]["directory"])

    results = []
    cache = {}
    for item in images:
        with Image.open(item["path"]) as source:
            if source.width * source.height > MAX_PIXELS:
                raise ValueError("IMAGE_PIXEL_LIMIT")
            image = source.convert("RGB")
        pending = []
        for part in item["slices"]:
            top, width, height = part["top"], part["width"], part["height"]
            if top < 0 or width <= 0 or height <= 0 or width > image.width or top + height > image.height:
                raise ValueError("INVALID_SOURCE_SLICE")
            # Detect per physical page fragment, not a downscaled multi-page composite.
            with image.crop((0, top, width, top + height)) as fragment:
                for detection in detector.detect(fragment, resized_shape=1024, box_margin=1):
                    box = checked_box(detection["box"], width, height)
                    box[1] += top
                    box[3] += top
                    crop = image.crop(box)
                    digest = hashlib.sha256(crop.tobytes() + str(crop.size).encode()).hexdigest()
                    pending.append((box, digest, crop))
                    if len(results) + len(pending) > MAX_FORMULAS:
                        raise ValueError("FORMULA_COUNT_LIMIT")

        missing = {}
        for _, digest, crop in pending:
            if digest not in cache:
                missing.setdefault(digest, crop)
        if missing:
            predictions = recognizer.recognize(
                list(missing.values()),
                batch_size=2,
            )
            if len(predictions) != len(missing):
                raise ValueError("INCOMPLETE_RECOGNITION")
            cache.update(zip(missing, predictions))

        for box, digest, crop in pending:
            prediction = cache[digest]
            latex = prediction["text"]
            if not isinstance(latex, str) or len(latex) > 4096:
                raise ValueError("LATEX_LENGTH_LIMIT")
            results.append({"imageId": item["id"], "box": box, "latex": latex})
            crop.close()
        image.close()
    return {"version": manifest["version"], "formulas": results}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--models", required=True)
    args = parser.parse_args()
    offline_mode()
    data = sys.stdin.buffer.read(2 * 1024 * 1024 + 1)
    if len(data) > 2 * 1024 * 1024:
        raise ValueError("INPUT_LIMIT")
    # Third-party progress output must not corrupt the JSON protocol.
    with contextlib.redirect_stdout(sys.stderr):
        result = recognize(json.loads(data), args.models)
    sys.stdout.write(json.dumps(result, ensure_ascii=True, allow_nan=False))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Do not echo document text, local paths, or model-generated content into logs.
        sys.stderr.write("LOCAL_FORMULA_WORKER_FAILED\n")
        sys.exit(1)
