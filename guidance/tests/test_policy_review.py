import json
import sys
import tempfile
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import review_policy_changes as review
from repository_governance import POLICY_FILES, content, digest
from audit_consumers import expected_paths, LEGACY

class PolicyReviewTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.target = Path(self.tmp.name)
        files = {}
        for path, canonical in expected_paths('.agents/foundry').items():
            p = self.target / path
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(content(ROOT / canonical))
            files[path] = digest(content(p))
        self.lock = self.target / '.agent-foundry/governance-lock.json'
        self.lock.parent.mkdir()
        self.lock.write_text(json.dumps({'schemaVersion': 1, 'sourceRepository': LEGACY, 'files': files}), encoding='utf-8')
        (self.target / 'AGENTS.md').write_text('PRIVATE-ROOT-NOT-READ', encoding='utf-8')
    def snapshot(self):
        return {p.relative_to(self.target).as_posix(): p.read_bytes() for p in self.target.rglob('*') if p.is_file()}
    def test_identical_read_only_and_root_not_exposed(self):
        before = self.snapshot()
        result = review.compare(ROOT, self.target, True)
        self.assertEqual(result['knownPolicyCount'], 16)
        self.assertEqual(result['changedCount'], 0)
        self.assertTrue(result['allSelectedPinsMatch'])
        self.assertNotIn('PRIVATE-ROOT-NOT-READ', json.dumps(result))
        self.assertEqual(before, self.snapshot())
    def test_local_edit_flag_and_content_opt_in(self):
        path = self.target / '.agents/foundry/RUNTIME_PROOF.md'
        path.write_text('PRIVATE-LOCAL-EDIT\n', encoding='utf-8')
        before = self.snapshot()
        hidden = review.compare(ROOT, self.target)
        self.assertNotIn('PRIVATE-LOCAL-EDIT', json.dumps(hidden))
        result = review.compare(ROOT, self.target, True)
        row = next(r for r in result['policies'] if r['legacyPath'].endswith('RUNTIME_PROOF.md'))
        self.assertFalse(row['pinMatches'])
        self.assertIn('-PRIVATE-LOCAL-EDIT', row['diff'])
        self.assertFalse(result['applySupported'])
        self.assertFalse(result['retirementReady'])
        self.assertEqual(before, self.snapshot())
    def test_missing_snapshot_remains_explicit(self):
        (self.target / '.agents/foundry/RUNTIME_PROOF.md').unlink()
        result = review.compare(ROOT, self.target)
        self.assertEqual(sum(r['state'] == 'missing' for r in result['policies']), 1)
        self.assertFalse(result['allSelectedPinsMatch'])
    def test_unknown_lock_paths_count_without_echo(self):
        lock=json.loads(self.lock.read_text(encoding='utf-8'));lock['files']['PRIVATE-UNRECOGNIZED']='x'
        self.lock.write_text(json.dumps(lock),encoding='utf-8')
        result=review.compare(ROOT,self.target)
        self.assertEqual(result['unrecognizedLockPathCount'],1)
        self.assertNotIn('PRIVATE-UNRECOGNIZED',json.dumps(result))
    def test_invalid_foreign_and_oversize_are_refused(self):
        self.lock.write_text('{',encoding='utf-8')
        with self.assertRaises(ValueError): review.compare(ROOT,self.target)
        self.lock.write_text(json.dumps({'schemaVersion':1,'sourceRepository':'foreign','files':{}}),encoding='utf-8')
        with self.assertRaises(ValueError): review.compare(ROOT,self.target)
        self.lock.write_bytes(b'x'*(review.MAX_FILE+1))
        with self.assertRaises(ValueError): review.compare(ROOT,self.target)
    def test_snapshot_link_refused(self):
        p=self.target/'.agents/foundry/RUNTIME_PROOF.md';p.unlink()
        try: p.symlink_to(self.target/'AGENTS.md')
        except OSError as e:
            if getattr(e,'winerror',None)==1314: self.skipTest('Symlink creation privilege unavailable')
            raise
        with self.assertRaises(ValueError):review.compare(ROOT,self.target)
    def test_crlf_is_portable_and_no_fake_change(self):
        p=self.target/'.agents/foundry/RUNTIME_PROOF.md';p.write_bytes(content(p).replace(b'\n',b'\r\n'))
        self.assertEqual(review.compare(ROOT,self.target)['changedCount'],0)

if __name__ == '__main__': unittest.main()
