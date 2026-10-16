"""Explicit setup/download step. Runtime recognition never downloads models or sends documents."""

import argparse
import hashlib
import json
from pathlib import Path

MODEL_REVISIONS = {
    "mfd": "f470a885e0fca1d3d2bfa2a54991db7ae01f1861",
    "mfr": "1cef9f0bdcd6a4c63df7de1311fb0894593340cc",
}

REQUIRED_FILES = {
    "mfd": ("pix2text-mfd-1.5.onnx",),
    "mfr": (
        "encoder_model.onnx",
        "decoder_model.onnx",
        "config.json",
        "generation_config.json",
        "preprocessor_config.json",
        "tokenizer.json",
        "tokenizer_config.json",
    ),
}


def check_model_files(directory):
    root = Path(directory).resolve()
    for name, names in REQUIRED_FILES.items():
        for filename in names:
            file = root / name / filename
            if not file.is_file() or file.stat().st_size == 0:
                raise RuntimeError(f"Missing or empty model file: {name}/{filename}; run setup again")


def check_models(directory):
    root = Path(directory).resolve()
    check_model_files(root)
    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    for name, revision in MODEL_REVISIONS.items():
        if manifest["models"][name]["revision"] != revision:
            raise RuntimeError(f"Wrong model revision: {name}; run setup again")
        if manifest["models"][name]["directory"] != name:
            raise RuntimeError(f"Wrong model directory: {name}")
    if manifest["models"]["mfd"]["file"] != "mfd/pix2text-mfd-1.5.onnx":
        raise RuntimeError("Wrong detector path in manifest")
    return manifest


def download_models(directory):
    from huggingface_hub import snapshot_download

    directory = Path(directory).resolve()
    directory.mkdir(parents=True, exist_ok=True)
    models = {}
    for name in ("mfd", "mfr"):
        repository = f"breezedeus/pix2text-{name}-1.5"
        revision = MODEL_REVISIONS[name]
        target = directory / name
        snapshot_download(
            repository,
            revision=revision,
            local_dir=target,
            allow_patterns=["*.json", "*.txt", "*.model", "*.onnx", "onnx/*"],
        )
        models[name] = {"revision": revision, "directory": name}
        if name == "mfd":
            models[name]["file"] = "mfd/pix2text-mfd-1.5.onnx"

    check_model_files(directory)
    version = hashlib.sha256(json.dumps(models, sort_keys=True).encode()).hexdigest()[:16]
    manifest = {"version": f"pix2text-onnx-v1-{version}", "models": models}
    pending = directory / "manifest.json.tmp"
    pending.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    pending.replace(directory / "manifest.json")
    check_models(directory)
    print(f"Local model files ready: {directory}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--directory", default=Path(__file__).resolve().parents[2] / "formula-models")
    parser.add_argument("--check", action="store_true", help="Verify existing local files without downloading")
    args = parser.parse_args()
    if args.check:
        checked = check_models(args.directory)
        print(f"Model files ready: {checked['version']}")
    else:
        download_models(args.directory)
