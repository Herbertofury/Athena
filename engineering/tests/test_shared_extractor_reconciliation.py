"""Additive replay provenance; no live access or retained private inputs required."""
import copy
import importlib.util
import json
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / 'engineering/experiments'
SCRIPT = LAB / 'youtube-topic-gate-lab/compare_retained_receipts.py'
spec = importlib.util.spec_from_file_location('receipt_comparison', SCRIPT)
comparison = importlib.util.module_from_spec(spec)
spec.loader.exec_module(comparison)
ORIGINAL = {
    'wordpress': '5db45a250d0d41ae7918f0ab5e754d025ef8ce9e2941301018247c34d31acf28',
    'bluesky': '8c1d5ab063172eab23774cca2627402ca2589c43a266bae1cfa32c4c1fb7b496',
}


class SharedExtractorReconciliationTests(unittest.TestCase):
    def test_all_original_receipt_data_preserved(self):
        for family, relative in comparison.RECEIPTS.items():
            with self.subTest(family=family):
                value = json.loads((LAB / relative).read_text())
                replay = value.pop('offlineReplayReconciliation')
                current = value['implementationSha256']
                value['implementationSha256'] = value.pop('originalImplementationSha256')
                self.assertEqual(comparison.digest(value), ORIGINAL[family])
                self.assertEqual(replay['baselineImplementationSha256'], value['implementationSha256'])
                self.assertEqual(replay['candidateImplementationSha256'], current)
                self.assertEqual(replay['baselineCommit'], '7ba88d30229f3073c9aa738f087b9199ffae16ae')
                self.assertTrue(replay['completeNormalizedOutputEqual'])
                self.assertTrue(replay['historicalSanitizedReceiptsEqual'])
                self.assertFalse(replay['networkUsed'])
                self.assertEqual(replay['captureCount'], value['captureCount'])
                self.assertEqual(replay['comparisonScriptSha256'], comparison.hashlib.sha256(SCRIPT.read_bytes()).hexdigest())
                receipts = ([c['receipt'] for c in value['cases']] if family == 'wordpress'
                            else [c['replay'] for c in value['captures']])
                self.assertEqual(comparison.digest(receipts), replay['sanitizedReceiptsSha256'])
                captures = replay['captures']
                times = (value['capturedAt'] if family == 'wordpress'
                         else [c['capturedAt'] for c in value['captures']])
                self.assertEqual([c['capturedAt'] for c in captures], times)
                original_inputs = ([a for c in receipts for a in c['attempts']] if family == 'wordpress' else receipts)
                self.assertEqual([(c['bytes'], c['sha256']) for c in captures],
                                 [(c['inputBytes'], c['inputSha256']) if family == 'wordpress'
                                  else (c['bytes'], c['sha256']) for c in original_inputs])

    def test_complete_normalized_difference_rejected_even_with_same_projection(self):
        for family in comparison.RECEIPTS:
            with self.subTest(family=family):
                before = {'normalized': {'privateField': 'original'}, 'publicReceipts': [], 'captures': []}
                after = copy.deepcopy(before)
                after['normalized']['privateField'] = 'changed'
                outputs = [SimpleNamespace(stdout=json.dumps(v)) for v in (before, after)]
                with patch.object(comparison.subprocess, 'run', side_effect=outputs):
                    with self.assertRaisesRegex(ValueError, 'complete normalized differs'):
                        comparison.compare(ROOT, ROOT, Path('unused-private-manifest'), family)

    def test_socket_activity_is_prohibited(self):
        with self.assertRaisesRegex(RuntimeError, 'prohibits socket'):
            comparison.audit('socket.connect', ())


if __name__ == '__main__':
    unittest.main()
