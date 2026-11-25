import copy
import json
import unittest
from pathlib import Path
from score import fixture, lexical, evaluate, parse

RAW=(Path(__file__).parent/'judgments.json').read_bytes()
DOCS,QUERY,SHA=fixture(RAW)

class RelevanceTests(unittest.TestCase):
    def test_identity_and_language_negative_control(self):
        result=evaluate(lexical(DOCS,QUERY,SHA),DOCS,QUERY,SHA,3)
        self.assertEqual(result['query_count'],14)
        self.assertEqual(result['required_top1_misses'],[])
        self.assertEqual(result['groups']['cross-lingual']['recall'],0)
        self.assertEqual(result['groups']['identity']['ndcg'],1)
        self.assertEqual(result['macro']['recall'],.821429)

    def test_candidates_cannot_rewrite_the_corpus_or_return_fake_sources(self):
        original=lexical(DOCS,QUERY,SHA)
        for change in ('sha','duplicate','unknown','missing'):
            r=copy.deepcopy(original)
            if change=='sha':
                r['fixture_sha256']='modified'
            elif change=='duplicate':
                r['rankings']['exact-provider']=['nexus-exact-asset']*2
            elif change=='unknown':
                r['rankings']['exact-provider']=['never-in-the-fixture']
            else:
                del r['rankings']['exact-provider']
            with self.subTest(change=change),self.assertRaises(ValueError):
                evaluate(r,DOCS,QUERY,SHA,3)

    def test_top_level_average_cannot_hide_wrong_exact_file(self):
        r=lexical(DOCS,QUERY,SHA)
        r['rankings']['exact-version']=['fsmp-4-0-no-copy','fsmp-4-1-stub']
        result=evaluate(r,DOCS,QUERY,SHA,3)
        self.assertGreater(result['macro']['recall'],.8)
        self.assertEqual(result['required_top1_misses'],['exact-version'])
        hit=next(q for q in result['queries'] if q['query']=='exact-version')
        self.assertEqual(hit['mrr'],.5)

    def test_duplicate_fields_and_invalid_fixture_fail_closed(self):
        with self.assertRaises(ValueError):
            parse(b'{"candidate":1,"candidate":2}')
        data=json.loads(RAW)
        data['queries'][0]['relevance']['undocumented-source']=3
        with self.assertRaises(ValueError):
            fixture(json.dumps(data).encode())

if __name__=='__main__':
    unittest.main()
