import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import skill_release_audit as audit


class SkillReleaseAuditTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        self.repo = self.root / 'source'
        self.repo.mkdir()
        audit.git(self.repo, 'init', '--quiet')
        audit.git(self.repo, 'config', 'user.name', 'Synthetic')
        audit.git(self.repo, 'config', 'user.email', 'test@example.invalid')
        audit.git(self.repo, 'config', 'core.autocrlf', 'false')
        self.profile = self.repo / 'skills/sample-skill'
        self.profile.mkdir(parents=True)
        self.source = b'---\nname: sample-skill\ndescription: Synthetic\n---\n'
        (self.profile / 'SKILL.md').write_bytes(self.source)
        audit.git(self.repo, 'add', '.')
        audit.git(self.repo, 'commit', '-qm', 'Pinned fixture')
        self.commit = audit.git(self.repo, 'rev-parse', 'HEAD').decode().strip()
        self.archive = self.root / 'release.zip'
        self.receipt = self.root / 'receipt.json'
        self.manifest = hashlib.sha256(b'SKILL.md\0' + audit.sha(self.source).encode() + b'\n').hexdigest()

    def make(self, additional=(), body=None):
        with zipfile.ZipFile(self.archive, 'w') as z:
            z.writestr('sample-skill/SKILL.md', self.source if body is None else body)
            for name, payload in additional:
                z.writestr(name, payload)
        self.digest = audit.sha(self.archive.read_bytes())
        self.receipt.write_text(json.dumps(dict(schemaVersion=1, artifact='sample-skill/skill.zip',
                                                source=audit.SOURCE, sourceRevision=self.commit,
                                                sha256=self.digest, sizeBytes=self.archive.stat().st_size,
                                                sourceTreeDigest=self.manifest)), encoding='utf-8')

    def review(self, expected=None):
        return audit.verify(self.archive,self.receipt,self.repo,self.commit,expected or self.digest)

    def test_source_and_hosted_digest_bound_no_write(self):
        self.make()
        original = self.archive.read_bytes()
        (self.profile/'SKILL.md').write_bytes(b'irrelevant working changes')
        self.assertTrue(self.review()['verifiedAgainstSelectedGit'])
        self.assertEqual(self.archive.read_bytes(), original)
        self.assertFalse(self.review()['installed'])
        with self.assertRaises(ValueError):
            self.review('0'*64)

    def test_extra_generated_or_different_bytes_never_report_match(self):
        self.make([('sample-skill/__pycache__/x.pyc', b'not executable here')])
        self.assertEqual(self.review()['onlyInZip'],1)
        self.assertFalse(self.review()['verifiedAgainstSelectedGit'])
        self.make(body=b'unmatched')
        self.assertEqual(self.review()['changedBytes'],1)
        self.assertFalse(self.review()['verifiedAgainstSelectedGit'])

    def test_windows_alias_outside_prefix_and_traversal_fail_closed(self):
        for name in ('sample-skill/skill.md','sample-skill/../escape','another/file','sample-skill/CON'):
            with self.subTest(name=name):
                self.make([(name,b'nothing')])
                with self.assertRaises(ValueError):
                    self.review()

    def test_duplicate_receipt_cannot_hide_pinned_field(self):
        self.make()
        original = self.receipt.read_text(encoding='utf-8')
        self.receipt.write_text('{"sha256":"unknown",'+original[1:],encoding='utf-8')
        with self.assertRaises(ValueError):
            self.review()
