"""Offline consistency checks for the dated Atlas retirement metadata snapshot."""
import hashlib
import json
from pathlib import Path
import unittest
ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / 'migration/engineering-atlas/metadata-2026-11-14'
def load(name):
    return json.loads((SNAPSHOT / (name + '.json')).read_text())
class MetadataReconciliation(unittest.TestCase):
    def test_integrity_inventory(self):
        manifest = load('manifest')
        self.assertEqual(manifest['source'], 'Herbertofury/Engineering-Atlas')
        for entry in manifest['files']:
            data = (SNAPSHOT / entry['path']).read_bytes()
            self.assertEqual(len(data), entry['bytes'])
            self.assertEqual(hashlib.sha256(data).hexdigest(), entry['sha256'])
    def test_issues_pulls_and_milestone(self):
        issues = {x['number']: x for x in load('issues')}
        pulls = {x['number']: x for x in load('pull-requests')}
        self.assertEqual(set(issues), set(range(1, 16)))
        self.assertEqual(set(pulls), set(range(1, 15)))
        milestones = {x['number']: x for x in load('milestones')}
        self.assertEqual(issues[15]['milestone']['number'], 1)
        self.assertEqual(issues[15]['milestone']['description'], milestones[1]['description'])
        labels = {x['name'] for x in load('labels')}
        for issue in issues.values():
            self.assertTrue({x['name'] for x in issue['labels']} <= labels)
        for number, pr in pulls.items():
            self.assertEqual(pr['body'], issues[number]['body'])
            self.assertEqual(len(pr['head']['sha']), 40)
    def test_deployment_coverage(self):
        deployments = load('deployments')
        statuses = load('deployment-statuses')
        self.assertEqual({x['id'] for x in deployments}, {x['deployment_id'] for x in statuses})
        self.assertEqual(len(deployments), len({x['id'] for x in deployments}))
        self.assertEqual(sorted(x['deployment_id'] for x in statuses if 'error' in x), load('manifest')['unavailable_deployment_status_ids'])
        self.assertTrue(all(('statuses' in x) != ('error' in x) for x in statuses))
    def test_empty_assets_and_disclosed_limits(self):
        self.assertEqual(load('releases'), [])
        self.assertEqual(load('tags'), [])
        self.assertEqual(load('artifacts')['total_count'], 0)
        self.assertEqual(load('external-attachments'), {})
        self.assertFalse(load('repository')['has_discussions'])
        self.assertTrue(load('manifest')['limitations'])
if __name__ == '__main__':
    unittest.main()
