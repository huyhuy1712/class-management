"""One-time local setup, or --check without installation/network access. No PDF input is used."""

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import venv

TOOLS = Path(__file__).resolve().parent
BACKEND = TOOLS.parents[1]


def runtime_python():
    relative = "Scripts/python.exe" if os.name == "nt" else "bin/python"
    return BACKEND / ".venv-formula" / relative


def run(command, **kwargs):
    subprocess.run([str(part) for part in command], cwd=TOOLS, check=True, **kwargs)


def node_tools():
    node = shutil.which("node")
    npm = shutil.which("npm")
    if not node or not npm:
        raise RuntimeError("Install Node.js 20+ with npm and reopen the terminal")
    major = int(subprocess.check_output([node, "--version"], text=True).strip().lstrip("v").split(".")[0])
    if major < 20:
        raise RuntimeError("Node.js 20+ is required")
    if os.name == "nt":
        # Call npm's JS entry directly; no cmd /c or shell interpolation of repository paths.
        cli = Path(npm).parent / "node_modules/npm/bin/npm-cli.js"
        if not cli.is_file():
            raise RuntimeError("Cannot locate npm-cli.js next to npm; repair the Node.js installation")
        return node, [node, cli]
    return node, [npm]


def install(npm):
    if not (3, 10) <= sys.version_info[:2] <= (3, 12):
        raise RuntimeError("Run this script with Python 3.10, 3.11 or 3.12")
    python = runtime_python()
    if not python.is_file():
        print("Creating backend/.venv-formula (isolated Python environment)", flush=True)
        venv.EnvBuilder(with_pip=True, system_site_packages=False).create(BACKEND / ".venv-formula")
    run([python, "-m", "pip", "install", "--disable-pip-version-check", "-r", TOOLS / "requirements.txt"])
    run([*npm, "ci", "--ignore-scripts", "--no-audit", "--no-fund"])
    run([python, TOOLS / "setup_models.py", "--directory", BACKEND / "formula-models"])


def verify(node):
    python = runtime_python()
    if not python.is_file():
        raise RuntimeError("Missing backend/.venv-formula; run setup_runtime.py without --check")
    run([python, TOOLS / "setup_models.py", "--check", "--directory", BACKEND / "formula-models"])
    # Real model initialization verifies native ONNX libraries and tokenizer files, offline.
    run([python, "-c", """
from pathlib import Path
from recognize import offline_mode
offline_mode()
import numpy
import onnxruntime
import transformers
import PIL
from setup_models import check_models
from onnx_formula import FormulaDetector, FormulaRecognizer
root = Path('../..').resolve() / 'formula-models'
manifest = check_models(root)
detector = FormulaDetector(root / manifest['models']['mfd']['file'])
recognizer = FormulaRecognizer(root / manifest['models']['mfr']['directory'])
print('ONNX CPU model and tokenizer initialization OK')
"""])
    checked = subprocess.run([node, str(TOOLS / "latex_check.mjs")], cwd=TOOLS,
                             input=json.dumps({"formulas": [{"id": "0", "latex": r"\frac{1}{2}"}]}),
                             capture_output=True, text=True, check=True)
    rows = json.loads(checked.stdout).get("results", [])
    if len(rows) != 1 or rows[0].get("syntax") != "VALID" or rows[0].get("render") != "VALID":
        raise RuntimeError("LaTeX syntax/render verification failed")
    print("LaTeX checker OK. Formula runtime is ready; no model files should be committed.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Offline verification; do not install or download")
    args = parser.parse_args()
    node, npm = node_tools()
    if not args.check:
        install(npm)
    verify(node)


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError, ValueError, subprocess.CalledProcessError) as error:
        print(f"Formula setup failed: {error}", file=sys.stderr)
        sys.exit(1)
