"""Published receipt identity/contracts, not replay of absent raw public inputs."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
LAB=ROOT/'experiments/commons-audio-lab'
RECEIPT=json.loads((LAB/'revision-validation-2026-11-11.json').read_text())


class CommonsRevisionReceiptTests(unittest.TestCase):
    def test_exact_implementation_and_reused_decoder_identities(self):
        self.assertEqual(RECEIPT['implementationSha256']['revisions.py'],hashlib.sha256((LAB/'revisions.py').read_bytes()).hexdigest())
        self.assertEqual(RECEIPT['implementationSha256']['receipt_gate.py'],hashlib.sha256((ROOT/'experiments/upstream-validation-lab/receipt_gate.py').read_bytes()).hexdigest())

    def test_distinct_scopes_preserve_same_content_two_uploads(self):
        a,b=[c['receipt'] for c in RECEIPT['cases']]
        self.assertFalse(a['scopeExhausted']);self.assertTrue(b['scopeExhausted']);self.assertNotEqual(a['scopeSha256'],b['scopeSha256'])
        self.assertEqual(a['attempts'][0]['inputSha256'],b['attempts'][0]['inputSha256'])
        self.assertEqual(len(b['records']),2);self.assertEqual(len({r['sha1'] for r in b['records']}),1)
        self.assertEqual(len({r['revisionKey'] for r in b['records']}),2)
        self.assertEqual([x['inputBytes'] for c in (a,b) for x in c['attempts']],[654,684,654,643])

    def test_public_scope_and_acceptance_boundaries_remain_explicit(self):
        self.assertEqual(RECEIPT['captureCount'],4);self.assertEqual(RECEIPT['distinctUploadEvents'],2)
        for c in RECEIPT['cases']:
            r=c['receipt'];self.assertFalse(r['completeHistory']);self.assertFalse(r['fullSupportAccepted'])
            self.assertEqual(r['snapshotConsistency'],'unproven')
            for key in ('transfer','decode','playback'):self.assertEqual(r[key],'not_attempted')
            serialized=json.dumps(r)
            for forbidden in ('"uploader":','"user":','Set-Cookie','x-client-ip','https://','bodyFile','rawCaptures','iistart'):
                self.assertNotIn(forbidden,serialized)
        self.assertEqual(len(RECEIPT['retainedSyntheticReviewFailures']),6)
        self.assertEqual(RECEIPT['focusedSyntheticTests'],48)


if __name__=='__main__':unittest.main()
