"""Stored public receipt integrity, distinct from re-fetching source responses."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
LAB=ROOT/'experiments/site-extraction-lab'

class WordPressReceiptTests(unittest.TestCase):
    def setUp(self):
        self.value=json.loads((LAB/'wordpress-collection-validation-2026-11-11.json').read_text())

    def test_exact_implementation_identity(self):
        for name,digest in self.value['implementationSha256'].items():
            self.assertEqual(hashlib.sha256((LAB/name).read_bytes()).hexdigest(),digest)

    def test_actual_scope_relationships(self):
        broad,selected=[c['receipt'] for c in self.value['cases']]
        self.assertEqual(self.value['captureCount'],4)
        self.assertEqual(self.value['distinctPosts'],2)
        self.assertEqual(broad['coverage']['missingPageCount'],1115)
        self.assertFalse(broad['coverage']['capturedScopeCovered'])
        self.assertTrue(selected['coverage']['capturedScopeCovered'])
        self.assertNotEqual(broad['scopeSha256'],selected['scopeSha256'])
        self.assertEqual([a['inputSha256'] for a in broad['attempts']], [a['inputSha256'] for a in selected['attempts']])
        for result in [broad,selected]:
            self.assertEqual([a['status'] for a in result['attempts']],[200,200])
            self.assertEqual([r['id'] for r in result['records']],[1,2])
            self.assertTrue(all(r['authorResolved'] for r in result['records']))
            self.assertFalse(result['coverage']['completeHistory'])
            self.assertFalse(result['fullSupportAccepted'])
            self.assertEqual(result['media']['playback'],'not_attempted')

    def test_failures_and_no_source_prose(self):
        self.assertEqual(len(self.value['retainedFailures']),6)
        self.assertTrue(all(f['fixture']=='synthetic independent review' for f in self.value['retainedFailures']))
        def walk(value):
            if isinstance(value,dict):
                self.assertFalse({'sourcePost','rendered','requestUrl','bodyFile','headers','title','name'}&set(value))
                for v in value.values():walk(v)
            elif isinstance(value,list):
                for v in value:walk(v)
        walk(self.value)

if __name__=='__main__':unittest.main()
