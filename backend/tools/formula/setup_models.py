"""Explicit setup/download step. Runtime recognition never downloads models or sends documents."""

import argparse
import hashlib
import json
from pathlib import Path

MODEL_REVISIONS = {
    "mfd": "f470a885e0fca1d3d2bfa2a54991db7ae01f1861",
    "mfr": "1cef9f0bdcd6a4c63df7de1311fb0894593340cc",
}


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
        files = sorted(path for path in target.rglob("*.onnx") if path.is_file())
        if not files:
            raise RuntimeError(f"Missing ONNX files for {name}")
        models[name] = {"revision": revision, "directory": name}
        if name == "mfd":
            models[name]["file"] = files[0].relative_to(directory).as_posix()

    version = hashlib.sha256(json.dumps(models, sort_keys=True).encode()).hexdigest()[:16]
    manifest = {"version": f"pix2text-onnx-v1-{version}", "models": models}
    (directory / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Local model files ready: {directory}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--directory", required=True)
    download_models(parser.parse_args().directory)
