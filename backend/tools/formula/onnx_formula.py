"""CPU inference for the pinned Pix2Text ONNX models; no remote code or automatic downloads."""

import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image


def session(path):
    ort.disable_telemetry_events()
    options = ort.SessionOptions()
    options.intra_op_num_threads = 2
    options.inter_op_num_threads = 1
    return ort.InferenceSession(str(path), options, providers=["CPUExecutionProvider"])


class FormulaDetector:
    def __init__(self, model_path):
        self.model = session(model_path)
        self.input = self.model.get_inputs()[0]

    def detect(self, image, resized_shape=1024, box_margin=1):
        shape = self.input.shape
        height = shape[2] if isinstance(shape[2], int) else resized_shape
        width = shape[3] if isinstance(shape[3], int) else resized_shape
        ratio = min(width / image.width, height / image.height)
        size = (round(image.width * ratio), round(image.height * ratio))
        left, top = (width - size[0]) // 2, (height - size[1]) // 2
        canvas = Image.new("RGB", (width, height), (114, 114, 114))
        resized = image.resize(size, Image.Resampling.BILINEAR)
        canvas.paste(resized, (left, top))
        resized.close()
        pixels = np.asarray(canvas, dtype=np.float32).transpose(2, 0, 1)[None] / 255.0
        canvas.close()
        output = self.model.run(None, {self.input.name: pixels})[0]
        if output.ndim != 3 or output.shape[0] != 1 or not 5 <= output.shape[1] <= 16:
            raise ValueError("UNSUPPORTED_DETECTOR_OUTPUT")

        rows = output[0].T
        scores = rows[:, 4:].max(axis=1)
        candidates = []
        for index in np.flatnonzero(scores >= 0.25):
            x, y, box_width, box_height = rows[index, :4]
            box = np.array([
                (x - box_width / 2 - left) / ratio - box_margin,
                (y - box_height / 2 - top) / ratio - box_margin,
                (x + box_width / 2 - left) / ratio + box_margin,
                (y + box_height / 2 - top) / ratio + box_margin,
            ])
            if np.isfinite(box).all():
                candidates.append((float(scores[index]), box))
        if len(candidates) > 5000:
            raise ValueError("DETECTION_COUNT_LIMIT")

        kept = []
        for score, box in sorted(candidates, key=lambda item: item[0], reverse=True):
            if not any(self.overlap(box, other) > 0.5 for _, other in kept):
                kept.append((score, box))
        kept.sort(key=lambda item: (item[1][1], item[1][0]))
        return [{"box": [[box[0], box[1]], [box[2], box[3]]]} for _, box in kept]

    @staticmethod
    def overlap(first, second):
        width = max(0, min(first[2], second[2]) - max(first[0], second[0]))
        height = max(0, min(first[3], second[3]) - max(first[1], second[1]))
        intersection = width * height
        first_area = max(0, first[2] - first[0]) * max(0, first[3] - first[1])
        second_area = max(0, second[2] - second[0]) * max(0, second[3] - second[1])
        return intersection / max(1e-8, first_area + second_area - intersection)


class FormulaRecognizer:
    def __init__(self, directory):
        from transformers import TrOCRProcessor

        directory = Path(directory)
        self.processor = TrOCRProcessor.from_pretrained(directory, local_files_only=True, use_fast=False)
        self.encoder = session(directory / "encoder_model.onnx")
        self.decoder = session(directory / "decoder_model.onnx")
        self.generation = json.loads((directory / "generation_config.json").read_text(encoding="utf-8"))
        if {item.name for item in self.decoder.get_inputs()} != {"input_ids", "encoder_hidden_states"}:
            raise ValueError("UNSUPPORTED_DECODER_INPUTS")

    def recognize(self, images, batch_size=2):
        results = []
        for start in range(0, len(images), batch_size):
            batch = images[start:start + batch_size]
            pixels = self.processor(images=batch, return_tensors="np").pixel_values
            hidden = self.encoder.run(None, {self.encoder.get_inputs()[0].name: pixels})[0]
            ids = np.full((len(batch), 1), self.generation["decoder_start_token_id"], dtype=np.int64)
            done = np.zeros(len(batch), dtype=bool)
            for _ in range(384):
                logits = self.decoder.run(None, {"input_ids": ids, "encoder_hidden_states": hidden})[0]
                next_ids = logits[:, -1, :].argmax(axis=-1)
                next_ids[done] = self.generation["pad_token_id"]
                ids = np.concatenate([ids, next_ids[:, None]], axis=1)
                done |= next_ids == self.generation["eos_token_id"]
                if done.all():
                    break
            if not done.all():
                raise ValueError("FORMULA_TOKEN_LIMIT")
            texts = self.processor.batch_decode(ids, skip_special_tokens=True)
            results.extend({"text": text} for text in texts)
        return results
