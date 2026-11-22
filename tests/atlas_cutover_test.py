"""Verify that Atlas recovery evidence authenticates each path, not a bag of blobs."""
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

from scripts.verify_atlas_cutover import SNAPSHOT, verify


class CutoverRecovery(unittest.TestCase):
    def setUp(self):
        directory = self.enterContext(tempfile.TemporaryDirectory())
        base = Path(directory)
        self.destination = base / 'athena'
        self.snapshot = self.destination / SNAPSHOT
        self.snapshot.mkdir(parents=True)
        source = base / 'source'
        source.mkdir()

        def git(*args):
            return subprocess.check_output(['git', '-C', str(source), *args]).strip()

        git('init', '-q', '-b', 'main')
        rows = []
        for name, data in [('notes.txt', b'start'), ('cafe-\u00e9\tline\nbreak.txt', b'finish')]:
            (source / name).write_bytes(data)
            destination = f'engineering/{len(rows)}.txt'
            target = self.destination / destination
            target.parent.mkdir(exist_ok=True)
            target.write_bytes(b'Athena can intentionally adapt recovered files')
            rows.append(dict(source_path=name, source_blob=git('hash-object', name).decode(),
                             source_sha256=hashlib.sha256(data).hexdigest(), bytes=len(data),
                             athena_path=destination, relation='athena-adapted'))
        git('add', '--all')
        git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid',
            'commit', '-qm', 'Fixture')
        self.revision = git('rev-parse', 'HEAD').decode()
        git('bundle', 'create', str(self.snapshot.parent / 'engineering-atlas-history.bundle'), '--all')
        git('bundle', 'create', str(self.snapshot / 'history-delta.bundle'), '--all')
        (self.snapshot / 'source-refs.json').write_text(json.dumps([
            dict(ref='refs/heads/main', sha=self.revision)
        ]), encoding='utf-8')
        self.manifest = dict(source_revision=self.revision, files=rows)

    def run_verify(self):
        (self.snapshot / 'source-manifest.json').write_text(
            json.dumps(self.manifest), encoding='utf-8'
        )
        return verify(self.destination)

    def test_binds_literal_git_paths_and_allows_evolved_destination(self):
        self.assertEqual(self.run_verify()['source_recovery'], 'verified')

    def test_rejects_swapped_blob_with_matching_digest_and_size(self):
        left, right = self.manifest['files']
        for field in ('source_blob', 'source_sha256', 'bytes'):
            left[field], right[field] = right[field], left[field]
        with self.assertRaisesRegex(ValueError, 'Source path/blob mismatch'):
            self.run_verify()

    def test_rejects_incorrect_size(self):
        self.manifest['files'][0]['bytes'] += 1
        with self.assertRaisesRegex(ValueError, 'Source byte count mismatch'):
            self.run_verify()

    def test_rejects_different_source_revision(self):
        self.manifest['source_revision'] = 'a' * 40
        with self.assertRaisesRegex(ValueError, 'does not match retained source main'):
            self.run_verify()
