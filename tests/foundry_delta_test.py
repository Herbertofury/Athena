"""Verify intentionally sanitized Foundry documentation provenance, not Git identity."""
import hashlib
import json
from pathlib import Path
import unittest
ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / 'migration/feature-foundry/reviewed-delta-2026-11-14'
def load(name):
    return json.loads((SNAPSHOT / name).read_text())
def additions(patch):
    return '\n'.join(line[1:] for line in patch.splitlines() if line.startswith('+')) + '\n'
class ReviewedDelta(unittest.TestCase):
    def test_hashes(self):
        for entry in load('manifest.json')['files']:
            data = (SNAPSHOT / entry['path']).read_bytes()
            self.assertEqual(len(data), entry['bytes'])
            self.assertEqual(hashlib.sha256(data).hexdigest(), entry['sha256'])
    def test_reconstruction(self):
        delta = load('patches.json')
        initial = additions(delta[0]['files'][0]['patch'])
        final = initial + additions(delta[2]['files'][0]['patch'])
        self.assertEqual(initial, (SNAPSHOT / 'competitive-landscape.initial.md').read_text())
        self.assertEqual(final, (SNAPSHOT / 'competitive-landscape.final.md').read_text())
        self.assertEqual(additions(delta[1]['files'][0]['patch']), (SNAPSHOT / 'README.addition.md').read_text())
    def test_existing_public_source_reconciled(self):
        source = ROOT / 'feature-foundry/source'
        self.assertEqual((SNAPSHOT / 'competitive-landscape.final.md').read_bytes(), (source / 'docs/competitive-landscape.md').read_bytes())
        self.assertTrue((source / 'README.md').read_bytes().endswith((SNAPSHOT / 'README.addition.md').read_bytes()))
        self.assertEqual((SNAPSHOT / 'LICENSE').read_bytes(), (source / 'LICENSE').read_bytes())
    def test_provenance_allowlist_and_honesty(self):
        manifest = load('manifest.json')
        self.assertFalse(manifest['original_git_history_recoverable'])
        delta = load('patches.json')
        self.assertEqual([x['source_commit'] for x in delta], manifest['source_commits'])
        self.assertEqual(len(delta), 3)
        for commit in delta:
            self.assertEqual(set(commit), {'source_commit', 'files'})
            for file in commit['files']:
                self.assertEqual(set(file), {'path', 'patch'})
                self.assertIn(file['path'], {'README.md', 'docs/competitive-landscape.md'})
        self.assertEqual(len(manifest['excluded']), 6)
if __name__ == '__main__':
    unittest.main()
