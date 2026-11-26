import json
import pathlib
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "tools"))
import context_audit


class ContextAuditTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = pathlib.Path(tmp.name)
        self.git("init", "-q")
        self.git("config", "user.name", "Context Fixture")
        self.git("config", "user.email", "fixture@example.invalid")

    def git(self, *args, data=None):
        return subprocess.check_output(["git", "-C", str(self.root), *args], input=data).strip()

    def add(self, relative, body):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(body)
        self.git("add", relative)

    def commit(self):
        self.git("commit", "-qm", "fixture")
        return self.git("rev-parse", "HEAD").decode()

    def test_exact_committed_counts_repeats_no_text_and_no_writes(self):
        repeat = b"Do not publish the internal orchard receipt."
        body = repeat + b"\nReview visuals.\n"
        self.add("AGENTS.md", body)
        self.add("sub/CLAUDE.md", b"Find the smoke test.\n" + repeat + b"\n")
        self.add("sub/AGENTS.override.md", b"")
        self.add("sub/NOTES.md", b"Not an instruction filename")
        pin = self.commit()
        (self.root / "AGENTS.md").write_bytes(b"Uncommitted text")
        (self.root / "CLAUDE.local.md").write_bytes(b"Untracked text")
        before = self.git("status", "--porcelain")
        output = context_audit.audit(self.root, pin)
        self.assertEqual(output["source_commit"], pin)
        self.assertEqual(output["files"][0], {"path": "AGENTS.md", "status": "counted",
                                            "bytes": len(body), "lines": 2, "words": 9})
        self.assertEqual(len(output["files"]), 3)
        self.assertEqual(output["sample_repeats"], [[["AGENTS.md", 1], ["sub/CLAUDE.md", 2]]])
        self.assertNotIn("orchard", json.dumps(output))
        self.assertIsNone(output["token_usage"])
        self.assertEqual(self.git("status", "--porcelain"), before)

    def test_skips_nontext_and_git_symlink_blob(self):
        self.add("AGENTS.md", b"not text\0")
        blob = self.git("hash-object", "-w", "--stdin", data=b"../outside").decode()
        self.git("update-index", "--add", "--cacheinfo", f"120000,{blob},CLAUDE.md")
        self.commit()
        report = context_audit.audit(self.root)
        self.assertEqual([f["status"] for f in report["files"]], ["not_utf8_text", "not_regular"])
        self.assertNotIn("outside", json.dumps(report))

    def test_rejects_an_unpinned_ref_and_oversize_without_partial_output(self):
        self.add("AGENTS.md", b"12345")
        self.commit()
        with self.assertRaisesRegex(ValueError, "full Git commit"):
            context_audit.audit(self.root, "HEAD")
        with patch.object(context_audit, "MAX_FILE", 4):
            with self.assertRaisesRegex(ValueError, "exceed audit bound"):
                context_audit.audit(self.root)
        with patch.object(context_audit, "MAX_TREE", 16):
            with self.assertRaisesRegex(ValueError, "exceeds audit bound"):
                context_audit.audit(self.root)


if __name__ == "__main__":
    unittest.main()
