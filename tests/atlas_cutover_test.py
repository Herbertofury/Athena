"""Verify that Atlas recovery evidence authenticates each path, not a bag of blobs."""
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

from scripts.verify_atlas_cutover import SNAPSHOT, verify, verify_wiki


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


class WikiRecovery(unittest.TestCase):
    def setUp(self):
        base = Path(self.enterContext(tempfile.TemporaryDirectory()))
        source = base / 'source'
        source.mkdir()
        self.root = base / 'athena'
        self.archive = self.root / SNAPSHOT.parent
        self.snapshot = self.archive / 'wiki'
        self.snapshot.mkdir(parents=True)
        self.destinations = self.root / 'wiki'
        self.destinations.mkdir()

        def git(*args):
            return subprocess.check_output(['git', '-C', str(source), *args]).strip()

        git('init', '-q', '-b', 'master')
        self.source_bytes = b'Original old Wiki page\n'
        (source / 'Home.md').write_bytes(self.source_bytes)
        git('add', '--all')
        git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid',
            'commit', '-qm', 'Fixture')
        ref_path = self.archive / 'wiki-refs.json'
        self.refs = [{'ref': 'refs/heads/master', 'sha': git('rev-parse', 'HEAD').decode()}]
        ref_path.write_text(json.dumps(self.refs), encoding='utf-8')
        git('bundle', 'create', str(self.archive / 'engineering-atlas-wiki-history.bundle'), '--all')
        (self.snapshot / 'Home.md').write_bytes(self.source_bytes)

        def digest(data):
            return hashlib.sha256(data).hexdigest()

        self.verified = {
            'docs/wiki-app-study/App-Study.md': digest(b'Source repo copy'),
            'docs/wiki-app-study/README.md': digest(b'Unpublished index'),
        }
        self.pages = [
            {'source_name': 'Home', 'athena_page': 'Engineering-Home',
             'source_sha256': digest(self.source_bytes), 'destination_sha256': digest(b'Old revision')},
            {'source_name': 'App-Study', 'athena_page': 'Engineering-App-Study',
             'source_sha256': self.verified['docs/wiki-app-study/App-Study.md'],
             'destination_sha256': digest(b'Establishing baseline')},
        ]
        (self.destinations / 'Engineering-Home.md').write_bytes(b'New revision')
        (self.destinations / 'Engineering-App-Study.md').write_bytes(b'Establishing baseline')

    def check(self):
        (self.archive / 'wiki-page-map.json').write_text(json.dumps(self.pages), encoding='utf-8')
        return verify_wiki(self.root, verified_source=self.verified)

    def test_reconciles_both_sources_but_not_live_wiki(self):
        result = self.check()
        self.assertEqual(result['source_wiki_pages'], 1)
        self.assertEqual(result['source_repository_pages'], 1)
        self.assertEqual(result['athena_pages'], 2)
        self.assertEqual(result['athena_pages_changed_since_cutover'], 1)
        self.assertIn('not established', result['live_wiki_acceptance'])

    def test_detects_altered_archive_page(self):
        (self.snapshot / 'Home.md').write_bytes(b'tampered')
        with self.assertRaisesRegex(ValueError, 'Archived Wiki bytes differ'):
            self.check()

    def test_detects_changed_wiki_ref(self):
        self.refs[0]['sha'] = 'a' * 40
        (self.archive / 'wiki-refs.json').write_text(json.dumps(self.refs), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'refs do not match'):
            self.check()

    def test_detects_missing_source_map_row(self):
        self.pages.pop()
        with self.assertRaisesRegex(ValueError, 'does not cover every'):
            self.check()

    def test_detects_missing_athena_page(self):
        (self.destinations / 'Engineering-Home.md').unlink()
        with self.assertRaisesRegex(ValueError, 'Missing or unsafe'):
            self.check()

    def test_rejects_path_outside_wiki(self):
        self.pages[0]['athena_page'] = '../README'
        with self.assertRaisesRegex(ValueError, 'Invalid wiki page name'):
            self.check()
