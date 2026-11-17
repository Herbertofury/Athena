"""Evidence integrity, not a claim that Arsenal's implementation was tested."""
import json
from pathlib import Path
import unittest
ROOT = Path(__file__).resolve().parents[1]
class StudyTest(unittest.TestCase):
 def setUp(self):
  self.study=json.loads((ROOT/'research/hd2-arsenal-study-2026-11-17/study.json').read_text())
 def test_bounded_sources(self):
  for source in self.study['sources']:
   self.assertTrue(source['url'].startswith('https://docs.rsnl.gg/'))
   self.assertRegex(source['artifact_sha256'],r'^[a-f0-9]{64}$')
   self.assertGreater(source['bytes'],0)
   self.assertEqual(source['evidence_kind'],'official-documentation')
 def test_acceptance_and_proposal_integrity(self):
  ids={s['id'] for s in self.study['sources']}
  self.assertEqual(len(self.study['findings']),14)
  self.assertEqual(len({f['id'] for f in self.study['findings']}),14)
  for f in self.study['findings']:
   self.assertTrue(set(f['source_ids'])<=ids)
   self.assertGreater(len(f['acceptance']),60)
   self.assertEqual(f['adoption_status'],'proposed-not-implemented')
 def test_no_runtime_or_source_claim(self):
  self.assertEqual(self.study['coverage']['runtime'],'not run')
  self.assertIn('unavailable',self.study['coverage']['application_source'])
  self.assertIn('not inspected',self.study['coverage']['installation'])
  self.assertIn('no local bytes verified',self.study['release_artifact']['hash_status'])
 def test_catalog_has_actual_entry(self):
  data=json.loads((ROOT/'data/software/arsenal-expanded.json').read_text())['applications'][0]
  self.assertEqual(data['id'],'hd2-arsenal')
  self.assertEqual(data['license_kind'],'unknown')
  self.assertEqual(data['evidence_status'],'official-docs-reviewed')
  rendered=(ROOT/'dist/workspaces/software/catalog.json').read_text()
  self.assertIn('hd2-arsenal',rendered)
 def test_recovery_is_not_claimed_as_implemented(self):
  findings={f['id']:f for f in self.study['findings']}
  self.assertIn('unmanaged files',findings['cancellation-recovery']['acceptance'])
  self.assertIn('unknown/partial',findings['deployment-is-not-selection']['acceptance'])
if __name__=='__main__':unittest.main()
