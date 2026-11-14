"""Synthetic official-schema cases only. No provider request or API key."""
import copy
import importlib.util
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / 'experiments/site-extraction-lab'
sys.path.insert(0, str(LAB))
spec = importlib.util.spec_from_file_location('curseforge_mapper', LAB / 'curseforge.py')
CF = importlib.util.module_from_spec(spec)
spec.loader.exec_module(CF)
FIXTURES = LAB / 'fixtures/curseforge-synthetic'

class CurseForge(unittest.TestCase):
    def setUp(self):
        self.project = json.loads((FIXTURES / 'project.json').read_text())
        self.files = json.loads((FIXTURES / 'files.json').read_text())
        self.description = (FIXTURES / 'description.json').read_bytes()
    def project_result(self, **kwargs):
        return CF.normalize_project_response(json.dumps(self.project), expected_mod_id=700001, **kwargs)
    def files_result(self):
        return CF.normalize_files_response(json.dumps(self.files), expected_mod_id=700001, expected_game_id=432)
    def test_baseline_has_no_dispatcher_enablement(self):
        self.assertNotIn('curseforge', CF.__dict__['json_loads'].__globals__.get('FAMILIES', {}))
    def test_missing_key_is_explicit_without_response_claim(self):
        result=CF.access_state()
        self.assertEqual(result['state'],'missing_key')
        self.assertIsNone(result['responseStatus'])
        self.assertFalse(result['networkPerformedByMapper'])
    def test_configured_is_not_verified(self):
        r=CF.access_state(key_configured=True)
        self.assertEqual(r['state'],'not_attempted')
        self.assertFalse(r['keyValidityVerified'])
    def test_status_matrix_no_retries(self):
        for status,state in [(200,'response_available_unvalidated'),(204,'response_available_unvalidated'),(301,'request_failed'),(400,'request_failed'),(401,'authentication_rejected'),(403,'forbidden'),(404,'not_found'),(429,'rate_limited'),(500,'upstream_error'),(503,'upstream_error')]:
            with self.subTest(status=status):
                r=CF.access_state(key_configured=True,response_status=status)
                self.assertEqual(r['state'],state);self.assertFalse(r['automaticRetryAllowed']);self.assertFalse(r['fullSupportAccepted'])
    def test_invalid_access_parameters_and_no_secret_argument(self):
        for kwargs in ({'key_configured':'SYNTHETIC KEY'},{'response_status':200},{'key_configured':True,'response_status':True},{'key_configured':True,'response_status':600}):
            with self.subTest(kwargs=kwargs),self.assertRaises(CF.ExtractionError):CF.access_state(**kwargs)
        with self.assertRaises(TypeError):CF.access_state(api_key='SYNTHETIC KEY')
    def test_roles_gallery_order_and_attribution(self):
        r=self.project_result()
        self.assertEqual(r['identity'],{'modId':700001,'gameId':432})
        self.assertEqual([a['id'] for a in r['gallery']],[3,2]);self.assertEqual(r['logo']['role'],'project_logo')
        self.assertTrue(all(a['role']=='project_screenshot' for a in r['gallery']))
        self.assertIsNone(r['authors'][0]['avatar']);self.assertEqual(r['authors'][0]['avatarState'],'not_in_documented_schema')
    def test_distribution_tri_state_and_missing_remain_distinct(self):
        for value,state in [(True,'provided'),(False,'provided'),(None,'unknown')]:
            self.project['data']['allowModDistribution']=value
            r=self.project_result()['distributionPermission'];self.assertEqual(r,{'state':state,'value':value})
        del self.project['data']['allowModDistribution']
        self.assertEqual(self.project_result()['distributionPermission'],{'state':'not_provided','value':None})
    def test_missing_collections_not_reported_as_provided(self):
        for key in ('authors','screenshots','latestFiles','isAvailable','logo'):del self.project['data'][key]
        r=self.project_result();self.assertEqual(r['authors'],[]);self.assertEqual(r['gallery'],[])
        self.assertEqual(r['providedFields'],['allowModDistribution'])
        self.assertEqual(r['projectSearchAvailability']['state'],'not_provided')
    def test_summary_not_full_body_and_latest_not_history(self):
        r=self.project_result();self.assertIsNone(r['description']);self.assertIsNone(r['filePage'])
        self.assertFalse(r['latestFilesAreCompleteHistory']);self.assertFalse(r['liveAcceptance'])
    def test_description_unrendered_and_file_page_separate(self):
        r=self.project_result(description_raw=self.description,files_raw=json.dumps(self.files))
        self.assertIn('<p>',r['description']['raw']);self.assertFalse(r['description']['renderable'])
        self.assertEqual(r['filePage']['pagination']['state'],'complete_for_captured_query')
        self.assertFalse(r['filePage']['pagination']['completeImport'])
    def test_file_integer_precision_dependencies_hashes_and_early_access(self):
        f=self.files_result()['files'][0]
        self.assertEqual(f['fileLength'],9007199254740993)
        self.assertEqual(f['fileLengthDecimal'],'9007199254740993')
        self.assertEqual(f['dependencies'],[{'modId':700002,'relationType':3}]);self.assertEqual(f['hashes'][0]['algo'],1)
        self.assertEqual(f['gameVersions'],['SYNTHETIC-1','SYNTHETIC-2'])
        self.assertTrue(f['earlyAccess']['value']);self.assertFalse(f['availability']['value'])
        self.assertEqual(f['downloadReference']['state'],'not_provided');self.assertFalse(f['downloadVerified'])
    def test_search_availability_does_not_determine_download(self):
        self.files['data'][0]['isAvailable']=True
        r=self.project_result(files_raw=json.dumps(self.files));self.assertFalse(r['projectSearchAvailability']['value'])
        self.assertTrue(r['filePage']['files'][0]['availability']['value']);self.assertFalse(r['filePage']['files'][0]['downloadAuthorizedByMapper'])
    def test_redacted_reference_never_becomes_download_permission(self):
        self.files['data'][0]['downloadUrl']='https://edge.forgecdn.net/files/SYNTHETIC.jar?api-key=SYNTHETIC-SECRET#fragment'
        r=self.files_result()['files'][0]['downloadReference']
        self.assertEqual(r['url'],'https://edge.forgecdn.net/files/SYNTHETIC.jar')
        self.assertTrue(r['queryOrFragmentRemoved']);self.assertFalse(r['fetchAllowed'])
    def test_reject_unsafe_reference_without_network(self):
        for url in ('javascript:alert(1)','https://user:pass@example.org/a','http://example.org/a','https://example.org:99999/a','https://example.org/\nsecret'):
            self.files['data'][0]['downloadUrl']=url
            with self.subTest(url=url):self.assertEqual(self.files_result()['files'][0]['downloadReference']['state'],'invalid')
    def test_project_join_mismatch(self):
        self.project['data']['id']=700002
        with self.assertRaisesRegex(CF.ExtractionError,'identity mismatch'):self.project_result()
    def test_asset_join_mismatch(self):
        for key in ('logo','screenshots'):
            p=copy.deepcopy(self.project);asset=p['data'][key] if key=='logo' else p['data'][key][0];asset['modId']=700002
            with self.subTest(key=key),self.assertRaisesRegex(CF.ExtractionError,'another project'):CF.normalize_project_response(json.dumps(p),expected_mod_id=700001)
    def test_file_project_game_join_mismatch(self):
        for key,value in [('modId',700002),('gameId',1)]:
            p=copy.deepcopy(self.files);p['data'][0][key]=value
            with self.subTest(key=key),self.assertRaisesRegex(CF.ExtractionError,'another'):CF.normalize_files_response(json.dumps(p),expected_mod_id=700001,expected_game_id=432)
    def test_duplicate_author_gallery_and_file_ids(self):
        for key in ('authors','screenshots','latestFiles'):
            p=copy.deepcopy(self.project);p['data'][key].append(copy.deepcopy(p['data'][key][0]))
            with self.subTest(key=key),self.assertRaisesRegex(CF.ExtractionError,'Duplicate'):CF.normalize_project_response(json.dumps(p),expected_mod_id=700001)
        self.files['data'].append(copy.deepcopy(self.files['data'][0]))
        with self.assertRaisesRegex(CF.ExtractionError,'Duplicate'):self.files_result()
    def test_boolean_ids_and_bad_lengths_rejected(self):
        for field,value in [('id',True),('fileLength',True),('fileLength',-1),('fileLength',2**63),('fileLength',1.25)]:
            p=copy.deepcopy(self.files);p['data'][0][field]=value
            with self.subTest(field=field,value=value),self.assertRaises(CF.ExtractionError):CF.normalize_files_response(json.dumps(p),expected_mod_id=700001,expected_game_id=432)
    def test_invalid_flag_types(self):
        for field in ('allowModDistribution','isAvailable'):
            p=copy.deepcopy(self.project);p['data'][field]='false'
            with self.subTest(field=field),self.assertRaises(CF.ExtractionError):CF.normalize_project_response(json.dumps(p),expected_mod_id=700001)
        self.files['data'][0]['isEarlyAccessContent']='false'
        with self.assertRaises(CF.ExtractionError):self.files_result()
    def test_documented_nullable_early_access_preserves_unknown(self):
        self.files['data'][0]['isEarlyAccessContent']=None
        self.assertEqual(self.files_result()['files'][0]['earlyAccess'],{'state':'unknown','value':None})
    def test_unknown_fields_not_leaked_to_receipt(self):
        self.project['data']['apiKey']='SYNTHETIC-SECRET';self.project['data']['authors'][0]['avatarUrl']='https://secret.invalid/a'
        r=self.project_result();r['unrecognized']='SYNTHETIC-SECRET'
        receipt=json.dumps(CF.receipt(r))
        for forbidden in ('SYNTHETIC','https://','apiKey','avatarUrl','fileName','summary'):
            self.assertNotIn(forbidden,receipt)
    def test_complete_first_page_is_not_complete_import(self):
        p=self.files_result()['pagination'];self.assertTrue(p['completeForQuery']);self.assertFalse(p['completeImport'])
    def test_missing_pagination_does_not_guess_completion(self):
        del self.files['pagination'];p=self.files_result()['pagination'];self.assertEqual(p['state'],'not_provided');self.assertFalse(p['completeForQuery'])
    def test_terminal_later_page_not_complete(self):
        self.files['pagination'].update(index=50,totalCount=51)
        p=self.files_result()['pagination'];self.assertEqual(p['state'],'terminal_page_only');self.assertFalse(p['completeForQuery'])
    def test_more_records_and_empty_incomplete(self):
        self.files['pagination']['totalCount']=3
        self.assertEqual(self.files_result()['pagination']['state'],'more_records_not_captured')
        self.files['data']=[];self.files['pagination']['resultCount']=0
        self.assertEqual(self.files_result()['pagination']['state'],'incomplete_empty_page')
    def test_search_window_boundary_preserved(self):
        self.files['data']=[dict(self.files['data'][0],id=800001+i) for i in range(50)]
        self.files['pagination']={'index':9950,'pageSize':50,'resultCount':50,'totalCount':10001}
        p=self.files_result()['pagination'];self.assertEqual(p['state'],'window_exhausted');self.assertFalse(p['completeForQuery'])
    def test_inconsistent_pagination_is_rejected(self):
        for field,value in [('pageSize',51),('index',9999),('resultCount',2),('totalCount',0),('index',True)]:
            p=copy.deepcopy(self.files);p['pagination'][field]=value
            with self.subTest(field=field),self.assertRaises(CF.ExtractionError):CF.normalize_files_response(json.dumps(p),expected_mod_id=700001,expected_game_id=432)
    def test_empty_result_complete_only_when_reported_zero(self):
        self.files['data']=[];self.files['pagination'].update(resultCount=0,totalCount=0)
        self.assertTrue(self.files_result()['pagination']['completeForQuery'])
    def test_json_duplicate_and_nonfinite_rejected(self):
        for raw in ('{"data":1,"data":2}','{"data":NaN}','{"data":Infinity}','{"data":1e999}'):
            with self.subTest(raw=raw),self.assertRaises(CF.ExtractionError):CF.normalize_project_response(raw,expected_mod_id=700001)
    def test_nonfinite_unknown_field_rejected(self):
        raw=json.dumps(self.project)[:-1]+', \"unknown\": 1e999}'
        with self.assertRaisesRegex(CF.ExtractionError,'Non-finite'):CF.normalize_project_response(raw,expected_mod_id=700001)
    def test_missing_file_lists_and_flags_are_explicit(self):
        for key in ('dependencies','hashes','gameVersions','isAvailable','isEarlyAccessContent'):del self.files['data'][0][key]
        f=self.files_result()['files'][0]
        self.assertEqual(f['providedFields'],['earlyAccessEndDate','downloadUrl'])
        self.assertEqual(f['availability']['state'],'not_provided')
        self.assertEqual(f['hashes'],[])
    def test_receipt_lengths_are_decimal_for_js_safety(self):
        r=CF.receipt(self.project_result())
        self.assertEqual(r['files'][0]['fileLengthDecimal'],'9007199254740993')
        self.assertNotIn('fileLength',r['files'][0])
    def test_malformed_and_bounded_input(self):
        for raw in ({'data':{}},b'\xff','{','['*70+'0'+']'*70,'"'+'x'*CF.MAX_BYTES+'"'):
            with self.subTest(kind=type(raw).__name__),self.assertRaises(CF.ExtractionError):CF.normalize_project_response(raw,expected_mod_id=700001)
    def test_receipt_drops_nested_enrichment(self):
        r=self.project_result(files_raw=json.dumps(self.files))
        for value in (r['identity'],r['distributionPermission'],r['projectSearchAvailability'],r['filePage']['pagination'],r['filePage']['files'][0]['availability']):value['extra']='SYNTHETIC-NESTED-SECRET'
        self.assertNotIn('SYNTHETIC-NESTED-SECRET',json.dumps(CF.receipt(r)))
    def test_lone_surrogate_is_normalized_to_extraction_error(self):
        with self.assertRaises(CF.ExtractionError):CF.normalize_project_response('"'+chr(0xd800)+'"',expected_mod_id=700001)
    def test_malformed_hosts_rejected_as_references(self):
        for url in ('https://exa mple.org/path','https://example.org\\evil/path'):
            self.files['data'][0]['downloadUrl']=url
            with self.subTest(url=url):self.assertEqual(self.files_result()['files'][0]['downloadReference']['state'],'invalid')
    def test_description_pairing_not_verified_by_plain_body(self):
        d=self.project_result(description_raw=self.description)['description']
        self.assertFalse(d['ownershipVerified'])
        self.assertEqual(d['ownershipBasis'],'caller_supplied_pairing')
    def test_no_network_and_no_input_mutation(self):
        before=copy.deepcopy(self.project)
        with patch('socket.socket',side_effect=AssertionError('network forbidden')):
            r=self.project_result(files_raw=json.dumps(self.files),description_raw=self.description)
            CF.receipt(r);CF.access_state()
        self.assertEqual(self.project,before)

if __name__=='__main__':unittest.main()
