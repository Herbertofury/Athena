"""Exercise the packaged one-shot verifier using only disposable local backups."""
import gzip
from hashlib import sha256
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile


def main(package):
    package = Path(package).resolve()
    leaf = package / "components/athena-constellation-bundle-review/verify-constellation-drive.mjs"
    original = leaf.read_bytes()
    with tempfile.TemporaryDirectory(prefix="athena-backup-review-") as temp:
        root = Path(temp)
        keys = (
            "providers projects chats turns turnRevisions outputSnapshots files knowledgeItems knowledgeSources "
            "projectContinuity events checkpoints syncReceipts catalogRuns"
        ).split()
        base = {
            **{key: [] for key in keys},
            "schema": "project-constellation", "schemaVersion": 7,
            "exportedAt": "2026-11-20T16:00:00.000Z", "summary": {},
            "chats": [{"id": "private-test-only", "updatedAt": 40_000, "title": "private-marker"}],
        }
        source = {**base, "chats": [*base["chats"], {"id": "missing-private-test", "updatedAt": 50_000}]}
        snapshot = gzip.compress(json.dumps(base).encode())
        index = {
            "schema": "project-constellation-drive-index", "schemaVersion": 2,
            "updatedAt": "2026-11-20T16:01:00.000Z",
            "snapshot": {"lastFullSyncAt": 50_000, "sha256": sha256(snapshot).hexdigest(),
                         "size": len(snapshot), "encoding": "gzip"},
            "journal": None,
        }
        inputs = {"index.json": json.dumps(index).encode(), "snapshot.json.gz": snapshot,
                  "reference.json": json.dumps(source).encode()}
        for name, body in inputs.items():
            (root / name).write_bytes(body)
        command = ["--review-constellation-bundle", "--bundle-index", "index.json", "--bundle-snapshot",
                   "snapshot.json.gz", "--bundle-compare-source", "reference.json"]
        def run(args, status=0):
            result = subprocess.run([sys.executable, "-B", str(package / "launch.py"), *args],
                                    capture_output=True, cwd=root, timeout=45,
                                    env={**os.environ, "NODE_OPTIONS": "--definitely-invalid-test-option"})
            assert result.returncode == status, (result.stdout, result.stderr)
            assert b"private-marker" not in result.stdout+result.stderr
            assert b"private-test" not in result.stdout+result.stderr
            assert {p.name: p.read_bytes() for p in root.iterdir()} == inputs
            return result.stdout
        try:
            report = json.loads(run(command))
            assert report["snapshot"]["sha256"] == sha256(snapshot).hexdigest()
            assert report["sourceComparison"]["total"]["notRetained"] == 1
            run([*command, "--verify-only"], status=2)
            run(command[1:], status=2)
            leaf.write_text("console.log('tampered-script-ran')", encoding="utf-8")
            assert b"tampered-script-ran" not in run(command, status=2)
            leaf.unlink()
            run(["--verify-only"])
            run(command, status=2)
            leaf.write_bytes(original)
            run(command)
        finally:
            if not leaf.exists() or leaf.read_bytes() != original:
                leaf.write_bytes(original)
        print("Portable Constellation bundle: exact gzip, missing row evidence, isolated Node and optional removal verified.")


if __name__ == "__main__":
    main(sys.argv[1])
