import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import test_consumer_audit as fixtures
snapshot=fixtures.snapshot
import plan_transition as transition

class TransitionTests(unittest.TestCase):
    setUp=fixtures.ConsumerAuditTests.setUp
    commit=fixtures.ConsumerAuditTests.commit
    def report(self):
        return {'head':'a'*40,'locks':[{'state':'legacy-migration-required','version':'1.1.2'},{'present':False}],
                'legacyReferences':[],'uninspectedPaths':['asset.bin']}
    def test_transition_does_not_apply_or_drop_unknowns(self):
        before=snapshot(self.target)
        with patch.object(transition,'audit',return_value=self.report()): result=transition.plan(ROOT,self.target)
        self.assertTrue(result['candidateForHumanReview']);self.assertEqual(len(result['mappings']),16)
        self.assertFalse(result['applySupported']);self.assertFalse(result['retirementReady'])
        self.assertEqual(result['uninspectedPaths'],['asset.bin']);self.assertEqual(snapshot(self.target),before)
    def test_real_missing_legacy_pin_requires_review(self):
        self.assertFalse(transition.plan(ROOT,self.target)['candidateForHumanReview'])
    def test_unmanaged_destination_preserved(self):
        p=self.target/'.agents/athena/RUNTIME_PROOF.md';p.parent.mkdir(parents=True);p.write_text('local')
        before=snapshot(self.target)
        with patch.object(transition,'audit',return_value=self.report()): result=transition.plan(ROOT,self.target)
        self.assertIn('existing-destination-preserved',result['conflicts']);self.assertEqual(snapshot(self.target),before)
    def test_dual_lock_requires_review(self):
        r=self.report();r['locks'][1]['present']=True
        with patch.object(transition,'audit',return_value=r):result=transition.plan(ROOT,self.target)
        self.assertIn('existing-athena-lock-needs-review',result['conflicts'])
if __name__=='__main__':unittest.main()
