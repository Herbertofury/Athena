from pathlib import Path
import json,math,unittest
ROOT=Path(__file__).resolve().parents[1]/'experiments/card-receiver-lab/phases'
class PhaseEvidence(unittest.TestCase):
 def test_complete_browser_phase_receipts_are_monotonic_and_accounted(self):
  paths=list(ROOT.glob('phases-v7-*pass*.json'));self.assertEqual(len(paths),4)
  for path in paths+[ROOT/'phases-v7-recovery.json']:
   receipt=json.loads(path.read_text());self.assertTrue(receipt['complete']);self.assertEqual(len(receipt['samples']),6)
   for sample in receipt['samples']:
    self.assertIs(sample['complete_parity'],True);self.assertIs(sample['post_sample_calibration']['reliable'],True);timeline=sample['phase_timeline'];self.assertIs(timeline['valid'],True)
    values=list(timeline['raw'].values());self.assertTrue(all(isinstance(x,(int,float)) and math.isfinite(x) for x in values));self.assertEqual(values,sorted(values));self.assertAlmostEqual(sum(timeline['phases'].values()),timeline['total_ms'],places=6)
 def test_cancelled_measurements_do_not_replace_last_good(self):
  cancelled=json.loads((ROOT/'phases-v7-cancel.json').read_text());self.assertFalse(cancelled['complete']);self.assertEqual(cancelled['samples'],[]);self.assertIn('cancelled',cancelled['error'])
  parity=json.loads((ROOT/'phases-v7-cancel-parity.json').read_text());self.assertTrue(parity['same_last_good_bytes']);self.assertTrue(parity['prior_complete']);self.assertEqual(parity['bytes'],13688)
