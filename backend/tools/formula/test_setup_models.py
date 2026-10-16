"""Verify pinned downloads and reject incomplete local model installations."""

import json
from pathlib import Path
import tempfile
import types
import unittest
from unittest.mock import patch

import setup_models


class SetupModelsTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.downloads = []

    def snapshot(self, repository, **options):
        name = repository.split("-")[-2]
        self.downloads.append((name, options["revision"]))
        target = Path(options["local_dir"])
        target.mkdir(parents=True)
        for filename in setup_models.REQUIRED_FILES[name]:
            (target / filename).write_bytes(b"fixture")

    def install_fixture(self):
        hub = types.SimpleNamespace(snapshot_download=self.snapshot)
        with patch.dict("sys.modules", {"huggingface_hub": hub}):
            setup_models.download_models(self.root)

    def test_downloads_pinned_revisions_and_checks_without_network(self):
        self.install_fixture()
        self.assertEqual(list(setup_models.MODEL_REVISIONS.items()), self.downloads)
        with patch.dict("sys.modules", {"huggingface_hub": None}):
            manifest = setup_models.check_models(self.root)
        self.assertEqual("pix2text-onnx-v1-c122cb11327c25f2", manifest["version"])
        self.assertFalse((self.root / "manifest.json.tmp").exists())

    def test_missing_or_empty_decoder_is_rejected(self):
        self.install_fixture()
        decoder = self.root / "mfr/decoder_model.onnx"
        decoder.write_bytes(b"")
        with self.assertRaisesRegex(RuntimeError, "decoder_model"):
            setup_models.check_models(self.root)
        decoder.unlink()
        with self.assertRaisesRegex(RuntimeError, "decoder_model"):
            setup_models.check_models(self.root)

    def test_wrong_revision_is_rejected(self):
        self.install_fixture()
        path = self.root / "manifest.json"
        manifest = json.loads(path.read_text())
        manifest["models"]["mfr"]["revision"] = "unexpected"
        path.write_text(json.dumps(manifest))
        with self.assertRaisesRegex(RuntimeError, "Wrong model revision"):
            setup_models.check_models(self.root)


if __name__ == "__main__":
    unittest.main()
