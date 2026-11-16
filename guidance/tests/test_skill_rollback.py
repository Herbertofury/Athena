import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import skill_sync as sync
import skill_rollback as rollback


class SkillRollbackTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.source = self.root / 'source' / 'alpha'
        self.source.mkdir(parents=True)
        self.target = self.root / 'client'
        self.target.mkdir()
        (self.source / 'SKILL.md').write_text('---\nname: alpha\ndescription: fixture\n---\nFixture\n')
        (self.source / 'data.txt').write_text('v1')

    def install(self):
        plan, _ = sync.prepare([self.source], self.target)
        return Path(sync.apply([self.source], self.target, plan['reviewSha256'])['recoveryDirectory'])

    def revert(self, recovery):
        return rollback.apply(recovery, rollback.plan(recovery)['reviewSha256'])

    def test_create_preserves_displaced_copy(self):
        recovery = self.install()
        self.revert(recovery)
        self.assertFalse((self.target / 'alpha').exists())
        self.assertEqual((recovery / 'reverted-new-alpha/data.txt').read_text(), 'v1')
        self.assertEqual(sync.prepare([self.source], self.target)[0]['skills'][0]['action'], 'create')

    def test_update_restores_exact_old_marker_and_files(self):
        self.install()
        old = (self.target / 'alpha' / sync.MARKER).read_bytes()
        (self.source / 'data.txt').write_text('v2')
        recovery = self.install()
        self.revert(recovery)
        self.assertEqual((self.target / 'alpha/data.txt').read_text(), 'v1')
        self.assertEqual((self.target / 'alpha' / sync.MARKER).read_bytes(), old)
        self.assertEqual((recovery / 'reverted-new-alpha/data.txt').read_text(), 'v2')
        self.assertEqual((self.source / 'data.txt').read_text(), 'v2')
        with self.assertRaises(ValueError): self.revert(recovery)

    def test_local_edit_refused_without_writes(self):
        recovery = self.install()
        (self.target / 'alpha/data.txt').write_text('mine')
        before = (recovery / 'receipt.json').read_bytes()
        with self.assertRaises(ValueError): self.revert(recovery)
        self.assertEqual((recovery / 'receipt.json').read_bytes(), before)
        self.assertEqual((self.target / 'alpha/data.txt').read_text(), 'mine')

    def test_stale_review_and_changed_backup_refused(self):
        self.install()
        (self.source / 'data.txt').write_text('v2')
        recovery = self.install()
        digest = rollback.plan(recovery)['reviewSha256']
        with self.assertRaises(ValueError): rollback.apply(recovery, 'wrong')
        (recovery / 'old-alpha/data.txt').write_text('changed backup')
        with self.assertRaises(ValueError): rollback.apply(recovery, digest)
        self.assertEqual((self.target / 'alpha/data.txt').read_text(), 'v2')

    def test_failure_preserves_both_versions_and_blocks_retry(self):
        self.install()
        (self.source / 'data.txt').write_text('v2')
        recovery = self.install()
        rename = Path.rename
        def fail(path, dest):
            if path.name == 'old-alpha': raise OSError('injected')
            return rename(path, dest)
        with patch.object(Path, 'rename', fail):
            with self.assertRaises(OSError): self.revert(recovery)
        self.assertEqual((recovery / 'old-alpha/data.txt').read_text(), 'v1')
        self.assertEqual((recovery / 'reverted-new-alpha/data.txt').read_text(), 'v2')
        self.assertEqual(json.loads((recovery / 'receipt.json').read_text())['state'], 'rollback-incomplete')
        with self.assertRaises(ValueError): self.revert(recovery)
        with self.assertRaises(ValueError): sync.prepare([self.source], self.target)

    def test_destination_traversal_and_occupied_recovery_refused(self):
        recovery = self.install()
        (recovery / 'reverted-new-alpha').mkdir()
        with self.assertRaises(ValueError): self.revert(recovery)
        receipt = json.loads((recovery / 'receipt.json').read_text())
        receipt['plan']['skills'][0]['name'] = '../escape'
        (recovery / 'receipt.json').write_text(json.dumps(receipt))
        with self.assertRaises(ValueError): self.revert(recovery)

    def test_real_payload_acceptance_runner_preserves_source(self):
        from accept_skill_rollback import run
        result = run([self.source], self.root)
        self.assertEqual(result['sourceFiles'], 2)
        for key in ('exactPreviousInstallRestored', 'updatedCopiesRetained',
                    'initialCopiesRetained', 'activeTrialCopiesRemoved', 'sourcesUnchanged'):
            self.assertTrue(result[key], key)
        self.assertFalse(result['clientInstalled'])
        self.assertFalse(result['sourceCodeExecuted'])
        self.assertFalse(result['retirementReady'])
