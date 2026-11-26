import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import repository_governance as governance



def files(root):
    return {p.relative_to(root).as_posix(): p.read_bytes()
            for p in root.rglob("*") if p.is_file() and ".git" not in p.parts}


class GovernanceFixture:
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.source = self.base / "source"
        self.target = self.base / "consumer"
        self.source.mkdir()
        self.target.mkdir()
        for name in governance.POLICY_FILES:
            dest = self.source / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / name, dest)
        (self.source / "registry").mkdir()
        self.manifest()
        subprocess.run(["git", "init", "-q", str(self.source)], check=True)
        # Keep temporary fixtures synchronous: detached Git maintenance can race
        # TemporaryDirectory cleanup after a successful test on Linux runners.
        for key, value in (("maintenance.auto", "false"), ("gc.auto", "0")):
            subprocess.run(["git", "-C", str(self.source), "config", "--local", key, value], check=True)
        subprocess.run(["git", "-C", str(self.source), "add", "."], check=True, capture_output=True)
        subprocess.run(["git", "-C", str(self.source), "-c", "user.name=Test",
                        "-c", "user.email=test@example.invalid", "commit", "-qm", "fixture"], check=True)

    def manifest(self, version="1.0.0"):
        governance.atomic_json(self.source / governance.MANIFEST, governance.release(self.source, version))

    def adopted(self):
        actions = governance.apply(self.source, self.target)
        self.assertTrue(all(x["action"] == "noop" for x in actions))


class GovernanceCases(GovernanceFixture):
    def test_plan_is_read_only_and_preserves_local_instructions(self):
        root = self.target / "AGENTS.md"
        root.write_text("# Local\nKeep product commands and privacy restrictions.\n", encoding="utf-8")
        nested = self.target / "src/AGENTS.md"
        nested.parent.mkdir()
        nested.write_text("# Subsystem\nKeep local invariants.\n", encoding="utf-8")
        before = files(self.target)
        actions = governance.plan(self.source, self.target)[2]
        self.assertEqual(files(self.target), before)
        self.assertIn("review", {x["action"] for x in actions})
        actions = governance.apply(self.source, self.target)
        self.assertEqual(root.read_bytes(), before["AGENTS.md"])
        self.assertEqual(nested.read_bytes(), before["src/AGENTS.md"])
        self.assertIn("review", {x["action"] for x in actions})
        root.write_text(root.read_text(encoding="utf-8") + "Read `.agents/athena/AGENTS-adapter.md`.\n", encoding="utf-8")
        self.assertTrue(all(x["action"] == "noop" for x in governance.plan(self.source, self.target)[2]))

    def test_adoption_records_clean_commit_and_numbered_invariants(self):
        self.adopted()
        lock = governance.load_json(self.target / governance.LOCK, {})
        self.assertRegex(lock["sourceCommit"], r"^[a-f0-9]{40}$")
        self.assertFalse(lock["sourceWorkingTreeDirty"])
        self.assertEqual(governance.checked_release(self.source)["invariantIds"], [int(x) for x in __import__("re").findall(r"^## (\d+)\. ", (ROOT / "PRODUCT_INVARIANTS.md").read_text(encoding="utf-8"), __import__("re").M)])
        self.assertLess((self.target / "AGENTS.md").stat().st_size, 4000)

    def test_claude_import_and_shared_core_are_not_duplicated(self):
        self.adopted()
        self.assertEqual((self.target / "CLAUDE.md").read_text(encoding="utf-8"), "@AGENTS.md\n")
        self.assertNotIn("Aggressively", (self.target / "AGENTS.md").read_text(encoding="utf-8"))
        self.assertIn("Aggressively, eagerly, ambitiously, intelligently, creatively, and relentlessly with self agency", (self.target / governance.SNAPSHOT / "AGENTS-adapter.md").read_text(encoding="utf-8"))

    def test_existing_claude_is_preserved_and_flagged(self):
        path = self.target / "CLAUDE.md"
        path.write_text("Private local details\n")
        actions = governance.apply(self.source, self.target)
        self.assertEqual(path.read_text(encoding="utf-8"), "Private local details\n")
        self.assertTrue(any(x["action"] == "review" and x["path"] == "CLAUDE.md" for x in actions))

    def test_versioned_update_preserves_custom_root(self):
        self.adopted()
        root = self.target / "AGENTS.md"
        root.write_text(root.read_text(encoding="utf-8") + "\nKeep my local build command.\n", encoding="utf-8")
        before = root.read_bytes()
        policy = self.source / "MODERNIZATION_STANDARD.md"
        policy.write_text(policy.read_text(encoding="utf-8") + "\nNew shared detail.\n", encoding="utf-8")
        self.manifest("1.0.1")
        self.adopted()
        self.assertEqual(root.read_bytes(), before)
        self.assertEqual(governance.load_json(self.target / governance.LOCK, {})["version"], "1.0.1")

    def test_edited_or_removed_managed_policy_stops_entire_apply(self):
        self.adopted()
        edited = self.target / governance.SNAPSHOT / "PRODUCT_INVARIANTS.md"
        edited.write_text("# My customization\n", encoding="utf-8")
        before = files(self.target)
        with self.assertRaisesRegex(ValueError, "no files changed"):
            governance.apply(self.source, self.target)
        self.assertEqual(files(self.target), before)
        edited.unlink()
        before = files(self.target)
        with self.assertRaisesRegex(ValueError, "no files changed"):
            governance.apply(self.source, self.target)
        self.assertEqual(files(self.target), before)

    def test_unmanaged_destination_is_not_adopted_or_overwritten(self):
        path = self.target / governance.SNAPSHOT / "RUNTIME_PROOF.md"
        path.parent.mkdir(parents=True)
        path.write_text("User-owned policy\n", encoding="utf-8")
        before = files(self.target)
        with self.assertRaises(ValueError):
            governance.apply(self.source, self.target)
        self.assertEqual(files(self.target), before)

    def test_stale_source_manifest_and_same_version_change_fail(self):
        path = self.source / "RUNTIME_PROOF.md"
        path.write_text(path.read_text(encoding="utf-8") + "\nChanged rule.\n", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "canonical policy drift"):
            governance.plan(self.source, self.target)
        result = subprocess.run([sys.executable, str(ROOT / "tools/repository_governance.py"),
                                 "manifest", "--repo", str(self.source), "--version", "1.0.0"],
                                capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("newer version", result.stderr)
        self.assertEqual(files(self.target), {})

    def test_line_endings_do_not_create_false_drift(self):
        self.adopted()
        path = self.target / governance.SNAPSHOT / "RUNTIME_PROOF.md"
        path.write_bytes(path.read_bytes().replace(b"\n", b"\r\n"))
        self.assertTrue(all(x["action"] == "noop" for x in governance.plan(self.source, self.target)[2]))

    def test_root_override_requires_review_and_remains_unchanged(self):
        self.adopted()
        path = self.target / "AGENTS.override.md"
        path.write_text("# Local override\nKeep this policy.\n", encoding="utf-8")
        before = path.read_bytes()
        actions = governance.apply(self.source, self.target)
        self.assertTrue(any(x["action"] == "review" and x["path"] == "AGENTS.override.md" for x in actions))
        self.assertEqual(path.read_bytes(), before)
        path.write_text(path.read_text(encoding="utf-8") + "Read `.agents/athena/AGENTS-adapter.md`.\n", encoding="utf-8")
        self.assertTrue(all(x["action"] == "noop" for x in governance.plan(self.source, self.target)[2]))


    def test_linked_snapshot_directory_is_refused(self):
        outside = self.base / "outside"
        outside.mkdir()
        (self.target / ".agents").mkdir()
        try:
            (self.target / governance.SNAPSHOT).symlink_to(outside, target_is_directory=True)
        except OSError as exc:
            self.skipTest(f"symlink creation unavailable: {exc}")
        with self.assertRaisesRegex(ValueError, "linked destination"):
            governance.plan(self.source, self.target)
        self.assertEqual(files(outside), {})



class AthenaMigrationBoundaryTests(GovernanceCases, unittest.TestCase):
    def test_legacy_consumer_is_unchanged(self):
        p=self.target / ".agent-foundry/governance-lock.json"
        p.parent.mkdir(); p.write_text('{"version":"1.1.2"}')
        before=files(self.target)
        with self.assertRaisesRegex(ValueError, "reviewed migration required"):
            governance.apply(self.source,self.target)
        self.assertEqual(files(self.target),before)

    def test_athena_identity_and_paths(self):
        self.adopted()
        lock=governance.load_json(self.target/governance.LOCK,{})
        self.assertEqual(lock["sourceRepository"],"https://github.com/Herbertofury/Athena")
        self.assertEqual(governance.SNAPSHOT,".agents/athena")
        self.assertFalse((self.target/".agent-foundry").exists())
        self.assertIn(".agents/athena/AGENTS-adapter.md",(self.target/"AGENTS.md").read_text(encoding="utf-8"))

if __name__ == "__main__":
    unittest.main()

class DualPinReviewTests(GovernanceFixture, unittest.TestCase):
    def create_legacy(self):
        native = governance.load_json(self.target / governance.LOCK, {})
        legacy = dict(native, sourceRepository=governance.LEGACY_URL, version="1.1.2")
        legacy["files"] = {}
        for path, digest in native["files"].items():
            old_path = path.replace(".agents/athena/", ".agents/foundry/")
            dest = self.target / old_path
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(self.target / path, dest)
            legacy["files"][old_path] = digest
        legacy_path = self.target / governance.LEGACY_LOCK
        legacy_path.parent.mkdir()
        governance.atomic_json(legacy_path, legacy)
        return legacy_path

    def test_native_only_and_dual_pins_without_weakening_legacy_apply(self):
        self.adopted()
        result = governance.verify_consumer(self.source, self.target)
        self.assertIsNone(result["retainedLegacy"])
        self.create_legacy()
        before = files(self.target)
        with self.assertRaisesRegex(ValueError, "legacy Agent-Foundry consumer"):
            governance.apply(self.source, self.target)
        result = governance.verify_consumer(self.source, self.target)
        self.assertEqual([result[key]["filesVerified"] for key in ("athena", "retainedLegacy")], [16, 16])
        self.assertEqual(files(self.target), before)
        self.assertEqual(result["rootReadDirective"], ".agents/athena/AGENTS-adapter.md")

    def test_report_refuses_retained_drift(self):
        self.adopted()
        self.create_legacy()
        path = self.target / ".agents/foundry/AGENTS-adapter.md"
        path.write_text("Unreviewed local edits")
        before = files(self.target)
        with self.assertRaisesRegex(ValueError, "pinned file drift"):
            governance.verify_consumer(self.source, self.target)
        self.assertEqual(files(self.target), before)

    def test_refuses_lone_example_and_override_that_activates_legacy(self):
        self.adopted()
        root = self.target / "AGENTS.md"
        native = root.read_text()
        root.write_text("~~~markdown\n" + native + "~~~\n<!--\n" + native + "-->\n")
        with self.assertRaisesRegex(ValueError, "Athena-only Read directive"):
            governance.verify_consumer(self.source, self.target)
        root.write_text(native)
        (self.target / "AGENTS.override.md").write_text("Read `.agents/foundry/AGENTS-adapter.md`.\n")
        with self.assertRaisesRegex(ValueError, "AGENTS.override.md"):
            governance.verify_consumer(self.source, self.target)

    def test_unexpected_managed_path_is_refused(self):
        self.adopted()
        path = self.target / governance.LOCK
        lock = governance.load_json(path, {})
        lock["files"]["other/private.txt"] = "0" * 64
        governance.atomic_json(path, lock)
        with self.assertRaisesRegex(ValueError, "incomplete governance lock"):
            governance.verify_consumer(self.source, self.target)


class CanonicalPathTests(unittest.TestCase):
    def test_target_and_child_use_same_resolved_basis(self):
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as temporary:
            target=Path(temporary)/'consumer';target.mkdir()
            alias=Path(temporary)/'ALIAS'
            original=Path.resolve
            def resolve(path,*args,**kwargs):
                if path==alias:return original(target,*args,**kwargs)
                if path.is_relative_to(alias):return original(target/path.relative_to(alias),*args,**kwargs)
                return original(path,*args,**kwargs)
            with patch.object(Path,'resolve',resolve):
                self.assertEqual(governance.safe_path(alias,'nested/file.md'),alias/'nested/file.md')
                with self.assertRaises(ValueError):governance.safe_path(alias,'../escape.md')
