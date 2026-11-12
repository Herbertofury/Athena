"""Synthetic hostile/partial captures. No live HTTP and no real user content."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

LAB = Path(__file__).resolve().parents[1] / 'experiments/site-extraction-lab'
sys.path.insert(0, str(LAB))
from wordpress_collection import (ExtractionError, bounded_json, public_receipt,
                                  reconcile, request_identity, MAX_BODY_BYTES)

BASE = 'https://fixture.example/news/wp-json/wp/v2/posts'
def post(identifier=1, **extra):
    item = {'id': identifier, 'link': 'https://fixture.example/post/'+str(identifier),
            'title': {'rendered': 'synthetic-title-secret'}, 'author': 7,
            '_embedded': {'author': [{'id': 7, 'name': 'synthetic-name-secret',
                         'avatar_urls': {'96': 'https://cdn.example/avatar?signature=secret'}}]},
            'content': {'rendered': '<p>synthetic-body-secret</p><img src="https://cdn.example/a.png?token=secret#frag" />'},
            'excerpt': {'rendered': 'synthetic-excerpt-secret'}}
    item.update(extra)
    return item

def capture(page=1, items=None, total=2, pages=2, status=200, headers=None, query=''):
    return {'requestUrl': BASE+'?per_page=1&page='+str(page)+query,
            'status': status, 'headers': headers if headers is not None else
            {'X-WP-Total': str(total), 'X-WP-TotalPages': str(pages)},
            'body': json.dumps([post(page)] if items is None else items).encode()}

class WordPressCollectionTests(unittest.TestCase):
    def test_complete_selected_scope_is_not_history(self):
        value = reconcile([capture(), capture(2)], 'public')
        self.assertTrue(value['coverage']['capturedScopeCovered'])
        self.assertFalse(value['coverage']['completeHistory'])
        self.assertEqual(value['coverage']['snapshotConsistency'], 'unproven')
        self.assertFalse(value['fullSupportAccepted'])
        self.assertEqual(value['networkRequestsPerformed'], 0)

    def test_partial_first_page_retains_missing(self):
        c = reconcile([capture()])['coverage']
        self.assertFalse(c['capturedScopeCovered'])
        self.assertEqual(c['missingPageCount'], 1)
        self.assertEqual(c['missingPageSample'], [2])

    def test_page_gap_not_covered(self):
        value = reconcile([capture(1, total=3, pages=3), capture(3,total=3,pages=3)])
        self.assertEqual(value['coverage']['missingPageSample'], [2])

    def test_missing_headers_not_exhaustion(self):
        value = reconcile([capture(headers={})])
        self.assertIsNone(value['coverage']['missingPageCount'])
        self.assertIn('missing_total_headers', value['warnings'])

    def test_total_drift_is_retained(self):
        value = reconcile([capture(), capture(2,total=3,pages=3)])
        self.assertIn('collection_totals_changed', value['warnings'])
        self.assertIsNone(value['coverage']['declaredTotal'])
        self.assertEqual([a['declaredTotal'] for a in value['attempts']], [2,3])

    def test_duplicate_post_across_pages_does_not_hide_gap(self):
        value = reconcile([capture(), capture(2, items=[post(1)])])
        self.assertIn('post_repeated_across_pages', value['warnings'])
        self.assertEqual(len(value['records']), 2)
        self.assertEqual(value['coverage']['uniquePostCount'], 1)

    def test_conflicting_post_snapshots_preserved(self):
        changed = post(1);changed['content']['rendered'] = 'changed'
        value = reconcile([capture(), capture(2,items=[changed])])
        self.assertIn('conflicting_post_snapshots', value['warnings'])
        self.assertNotEqual(value['records'][0]['sourcePostSha256'], value['records'][1]['sourcePostSha256'])

    def test_repeated_identical_page_does_not_duplicate_records(self):
        value = reconcile([capture(), capture(), capture(2)])
        self.assertEqual(len(value['records']), 2)
        self.assertEqual(value['attempts'][1]['outcome'], 'identical_page_replay')
        self.assertTrue(value['coverage']['capturedScopeCovered'])

    def test_conflicting_same_page_never_overwrites(self):
        value = reconcile([capture(), capture(items=[post(3)]), capture(2)])
        self.assertEqual(len(value['records']), 3)
        self.assertIn('conflicting_page_snapshots', value['warnings'])

    def test_empty_collection_requires_headers(self):
        value = reconcile([capture(items=[], total=0, pages=0)])
        self.assertTrue(value['coverage']['capturedScopeCovered'])
        self.assertFalse(reconcile([capture(items=[], headers={})])['coverage']['capturedScopeCovered'])

    def test_short_page_is_not_terminal_proof(self):
        value = reconcile([capture(items=[])])
        self.assertIn('page_count_contradiction', value['warnings'])
        self.assertFalse(value['coverage']['capturedScopeCovered'])

    def test_inconsistent_total_pages_retained(self):
        value = reconcile([capture(total=2,pages=1)])
        self.assertIn('page_count_contradiction', value['warnings'])

    def test_page_beyond_total_retained(self):
        value = reconcile([capture(page=3,items=[])])
        self.assertIn('page_count_contradiction', value['warnings'])

    def test_huge_missing_count_is_bounded(self):
        value = reconcile([capture(total=10**9,pages=10**9)])['coverage']
        self.assertEqual(value['missingPageCount'],10**9-1)
        self.assertEqual(len(value['missingPageSample']),20)
        self.assertTrue(value['missingPageSampleTruncated'])

    def test_failure_then_success_retains_both(self):
        value = reconcile([capture(status=403),capture(),capture(2)])
        self.assertEqual(value['attempts'][0]['outcome'],'access_denied')
        self.assertTrue(value['coverage']['capturedScopeCovered'])
        self.assertEqual(len(value['attempts']),3)

    def test_http_failure_states(self):
        for code,outcome in [(401,'access_denied'),(403,'access_denied'),(429,'rate_limited'),
                             (404,'not_found'),(304,'not_modified_without_representation'),
                             (500,'http_failure'),(302,'http_failure'),(400,'http_failure')]:
            with self.subTest(code=code):
                value=reconcile([capture(status=code,items={'message':'sensitive-error-secret'})])
                self.assertEqual(value['attempts'][0]['outcome'],outcome)
                self.assertFalse(value['coverage']['capturedScopeCovered'])
                self.assertNotIn('sensitive-error-secret',json.dumps(public_receipt(value)))

    def test_invalid_headers_retained_as_failed_attempt(self):
        for headers in [{'X-WP-Total':'a'}, {'X-WP-Total':'-1'}, {'X-WP-Total':'2, 2'},
                        {'X-WP-Total':'2','x-wp-total':'3'}, {'X-WP-Total':2}, {'X-WP-Total':'1000000001'}]:
            with self.subTest(headers=headers):
                self.assertEqual(reconcile([capture(headers=headers)])['attempts'][0]['outcome'],'invalid_page')

    def test_header_case_insensitive(self):
        value=reconcile([capture(total=1,pages=1,headers={'x-wp-total':' 1 ','X-WP-TOTALPAGES':'1'})])
        self.assertTrue(value['coverage']['capturedScopeCovered'])

    def test_duplicate_ids_inside_page_fail(self):
        c=capture(items=[post(),post()]);c['requestUrl']=BASE+'?per_page=2&page=1'
        self.assertEqual(reconcile([c])['attempts'][0]['outcome'],'invalid_page')

    def test_non_collection_and_oversize_page_fail(self):
        for items in [{'id':1},None,'string', [post(),post(2)]]:
            c=capture();c['body']=json.dumps(items).encode()
            self.assertEqual(reconcile([c])['attempts'][0]['outcome'],'invalid_page')

    def test_invalid_ids(self):
        for identifier in [None,True,False,0,-1,'1',1.0]:
            with self.subTest(id=identifier):
                self.assertEqual(reconcile([capture(items=[post(identifier)])])['attempts'][0]['outcome'],'invalid_page')

    def test_mixed_sites_rejected(self):
        other=capture(2);other['requestUrl']=other['requestUrl'].replace('fixture.example','other.example')
        with self.assertRaises(ExtractionError):reconcile([capture(),other])

    def test_mixed_collection_filters_rejected(self):
        for query in ['&include=1','&author=9','&per_page=2','&orderby=id']:
            with self.subTest(query=query),self.assertRaises(ExtractionError):
                reconcile([capture(),capture(2,query=query)])

    def test_query_order_equivalent(self):
        other=capture(2);other['requestUrl']=BASE+'?page=2&per_page=1'
        self.assertTrue(reconcile([capture(),other])['coverage']['capturedScopeCovered'])

    def test_url_rejection(self):
        for url in ['http://fixture.example/wp-json/wp/v2/posts',
                    'https://user:password@fixture.example/wp-json/wp/v2/posts',
                    BASE+'#secret',BASE+'?page=1&page=2',BASE+'?offset=1',BASE+'?context=edit',
                    BASE+'?token=secret',BASE+'?per_page=101',BASE+'?per_page=0',BASE+'?page=01',
                    BASE+'?page=-1',BASE+'?page=1.0',BASE+'?page=1&', BASE+'?page',
                    BASE.replace('posts','posts/1'),BASE.replace('/news','/../news'),
                    BASE.replace('fixture.example','fixture.example:8443'),BASE+'\n',BASE+'?search=two words']:
            with self.subTest(url=url),self.assertRaises(ExtractionError):request_identity(url)

    def test_redirect_scope_rejected(self):
        c=capture();c['finalUrl']=BASE+'?page=2&per_page=1'
        with self.assertRaises(ExtractionError):reconcile([c])

    def test_bad_json_retained(self):
        for raw in [b'{',b'[{"id":1,"id":2}]',b'[NaN]',b'[Infinity]',b'[1e999]',b'\xff']:
            c=capture();c['body']=raw
            self.assertEqual(reconcile([c])['attempts'][0]['outcome'],'invalid_page')

    def test_structural_limit(self):
        for raw in [b'['*70+b'0'+b']'*70,b'['*1200+b'0'+b']'*1200]:
            with self.assertRaises(ExtractionError):bounded_json(raw)

    def test_body_and_capture_limits(self):
        with self.assertRaises(ExtractionError):reconcile([])
        with self.assertRaises(ExtractionError):reconcile([capture()]*257)
        c=capture();c['body']=b' '*(MAX_BODY_BYTES+1)
        with self.assertRaises(ExtractionError):reconcile([c])
        c['body']=b' '*MAX_BODY_BYTES
        with self.assertRaises(ExtractionError):reconcile([c]*5)

    def test_access_is_not_parser_authorization(self):
        for access in ['unknown','public','authorized']:
            a=reconcile([capture()],access)['access']
            self.assertEqual(a['callerCaptureContext'],access)
            self.assertFalse(a['grantVerifiedByParser'])
        with self.assertRaises(ExtractionError):reconcile([capture()],'private-granted')

    def test_missing_null_empty_and_protected_distinct(self):
        values=[({},'missing'),({'content':None},'null'),({'content':{}},'missing'),
                ({'content':{'rendered':None}},'null'),({'content':{'rendered':''}},'empty'),
                ({'content':{'protected':True,'rendered':'hidden'}},'protected')]
        for extra,expected in values:
            p=post();p.pop('content');p.update(extra)
            row=reconcile([capture(items=[p])])['records'][0]
            self.assertEqual(row['bodyState'],expected)
            if expected!='empty':self.assertIsNone(row['normalized']['body'])
            else:self.assertIsNotNone(row['normalized']['body'])
            self.assertEqual(row['sourcePost'],p)

    def test_invalid_post_preserved_without_false_coverage(self):
        p=post(content={'rendered':[1,2]})
        result=reconcile([capture(items=[p],total=1,pages=1)])
        self.assertIsNone(result['records'][0]['normalized'])
        self.assertEqual(result['records'][0]['sourcePost'],p)
        self.assertFalse(result['coverage']['capturedScopeCovered'])

    def test_featured_media_join_checked(self):
        p=post(featured_media=31);p['_embedded']['wp:featuredmedia']=[{'id':32,'source_url':'https://cdn.example/32.png'}]
        self.assertIsNone(reconcile([capture(items=[p])])['records'][0]['normalized'])
        p['_embedded']['wp:featuredmedia'][0]['id']=31
        self.assertIsNotNone(reconcile([capture(items=[p])])['records'][0]['normalized'])

    def test_author_identity_mismatch_not_silently_joined(self):
        p=post(author=9)
        row=reconcile([capture(items=[p])])['records'][0]
        self.assertIsNone(row['normalized'])
        self.assertEqual(row['sourcePost']['author'],9)

    def test_author_boolean_and_string_ids_rejected(self):
        for identifier in [True, False, '7', 0, -1, 7.0]:
            with self.subTest(identifier=identifier):
                self.assertIsNone(reconcile([capture(items=[post(author=identifier)])])['records'][0]['normalized'])

    def test_protected_flag_must_be_boolean(self):
        for flag in ['false', 0, 1, None]:
            with self.subTest(flag=flag):
                self.assertIsNone(reconcile([capture(items=[post(content={'protected':flag,'rendered':'text'})])])['records'][0]['normalized'])

    def test_missing_author_is_not_cover_image(self):
        p=post();p.pop('_embedded')
        result=public_receipt(reconcile([capture(items=[p])]))
        self.assertFalse(result['records'][0]['authorResolved'])

    def test_receipt_redacts_body_title_names_query_headers(self):
        c=capture(query='&search=query-secret')
        c['headers']['Set-Cookie']='cookie-secret';c['headers']['Authorization']='credential-secret'
        result=public_receipt(reconcile([c]))
        raw=json.dumps(result)
        for secret in ['synthetic-title-secret','synthetic-name-secret','synthetic-body-secret',
                       'synthetic-excerpt-secret','query-secret','cookie-secret','credential-secret','token=','signature=','#frag']:
            self.assertNotIn(secret,raw)
        self.assertIn('https://cdn.example/a.png',raw)

    def test_body_source_retained_without_claiming_raw_html_parity(self):
        p=post();value=reconcile([capture(items=[p])])
        self.assertEqual(value['records'][0]['sourcePost']['content']['rendered'],p['content']['rendered'])
        self.assertNotEqual(value['records'][0]['normalized']['body']['raw'],p['content']['rendered'])

    def test_media_states_never_promoted(self):
        value=public_receipt(reconcile([capture()]))['media']
        self.assertEqual(value['playback'],'not_attempted')
        self.assertEqual(value['delivery'],'not_attempted')
        self.assertEqual(value['decode'],'not_attempted')
        self.assertFalse(value['completeMediaAccepted'])

    def test_bad_html_retained_as_failed_record(self):
        p=post(content={'rendered':'<img srcset=",">'})
        value=reconcile([capture(items=[p])])
        self.assertIsNone(value['records'][0]['normalized'])
        self.assertEqual(value['records'][0]['sourcePost'],p)

    def test_unpaired_surrogates_rejected_before_hashing(self):
        for p in [post(content={'rendered':chr(0xD800)}),dict(post(),**{chr(0xD800):'value'})]:
            self.assertEqual(reconcile([capture(items=[p])])['attempts'][0]['outcome'],'invalid_page')

    def test_mime_attribute_not_exported_as_arbitrary_prose(self):
        p=post(content={'rendered':'<audio type="MIME_PRIVATE_SECRET" src="https://cdn.example/a"></audio>'})
        self.assertNotIn('MIME_PRIVATE_SECRET',json.dumps(public_receipt(reconcile([capture(items=[p])]))))

    def test_relative_media_uses_post_not_api_url(self):
        p=post(content={'rendered':'<img src="image.png">'},link='https://fixture.example/posts/topic/')
        row=public_receipt(reconcile([capture(items=[p])]))['records'][0]
        self.assertEqual(row['body']['media'][0]['src'],'https://fixture.example/posts/topic/image.png')
        p.pop('link')
        row=public_receipt(reconcile([capture(items=[p])]))['records'][0]
        self.assertIsNone(row['body']['media'][0]['src'])

    def test_featured_media_boolean_rejected(self):
        p=post(featured_media=True);p['_embedded']['wp:featuredmedia']=[{'id':1,'source_url':'https://cdn.example/1.png'}]
        self.assertIsNone(reconcile([capture(items=[p])])['records'][0]['normalized'])

    def test_every_distinct_page_variant_deduplicated(self):
        a=capture();b=capture(items=[post(3)])
        value=reconcile([a,b,copy.deepcopy(b)])
        self.assertEqual(len(value['records']),2)
        self.assertEqual(value['attempts'][2]['outcome'],'identical_page_replay')
        self.assertIn('conflicting_page_snapshots',value['warnings'])

    def test_cli_success_and_path_redaction(self):
        with tempfile.TemporaryDirectory() as path:
            directory=Path(path);c=capture(total=1,pages=1);body=c.pop('body')
            (directory/'post.json').write_bytes(body);c['bodyFile']='post.json'
            (directory/'manifest.json').write_text(json.dumps([c]))
            command=[sys.executable,str(LAB/'wordpress_collection.py'),'--manifest',str(directory/'manifest.json')]
            success=subprocess.run(command,text=True,capture_output=True)
            self.assertEqual(success.returncode,0,success.stderr)
            self.assertTrue(json.loads(success.stdout)['coverage']['capturedScopeCovered'])
            c['bodyFile']='private-path-secret';(directory/'manifest.json').write_text(json.dumps([c]))
            failed=subprocess.run(command,text=True,capture_output=True)
            self.assertEqual(failed.returncode,1)
            self.assertNotIn('private-path-secret',failed.stdout+failed.stderr)
            self.assertNotIn(path,failed.stdout+failed.stderr)

if __name__=='__main__':unittest.main()
