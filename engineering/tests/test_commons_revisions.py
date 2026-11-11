"""Synthetic defensive fixtures. Real capture receipts are tested separately."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('commons_revisions', ROOT/'experiments/commons-audio-lab/revisions.py')
M = importlib.util.module_from_spec(SPEC); SPEC.loader.exec_module(M)
BASE = {'action':'query', 'format':'json', 'formatversion':'2', 'prop':'imageinfo',
        'titles':'File:Sample.jpg', 'iiprop':'timestamp|user|url|size|sha1|mime|mediatype',
        'iilimit':'1', 'maxlag':'5'}
LATEST, EARLIER = '2020-01-02T00:00:00Z', '2019-01-02T00:00:00Z'
TOKEN = {'continue':'||', 'iistart':EARLIER}


def url(args=None):
    return 'https://commons.wikimedia.org/w/api.php?' + urlencode(BASE if args is None else args)


def payload(when=LATEST, following=None):
    info = {'timestamp':when, 'user':'Synthetic actor', 'size':123, 'sha1':'a'*40, 'mime':'image/jpeg', 'mediatype':'BITMAP',
            'url':'https://upload.wikimedia.org/wikipedia/commons/a/ab/Sample.jpg?utm_source=fixture',
            'descriptionurl':'https://commons.wikimedia.org/wiki/File:Sample.jpg'}
    result = {'query':{'pages':[{'pageid':42, 'ns':6, 'title':'File:Sample.jpg', 'imagerepository':'local', 'imageinfo':[info]}]}}
    if following is None: result['batchcomplete'] = True
    else: result['continue'] = copy.deepcopy(following)
    return result


def capture(data=None, args=None, status=200):
    return {'requestUrl':url(args), 'status':status, 'body':json.dumps(payload() if data is None else data).encode()}


def chain():
    return [capture(payload(following=TOKEN)), capture(payload(EARLIER), {**BASE, **TOKEN})]


class CommonsRevisionTests(unittest.TestCase):
    def result(self, items=None, args=None):
        return M.reconcile(url(args), chain() if items is None else items, 'public')

    def mutate_info(self, key, value):
        p = payload(); p['query']['pages'][0]['imageinfo'][0][key] = value
        return self.result([capture(p)])

    def test_exact_chain_keeps_distinct_uploads_with_same_digest(self):
        r = self.result(); self.assertTrue(r['scopeExhausted']); self.assertEqual(len(r['records']),2)
        self.assertEqual(len({v['sha1'] for v in r['records']}),1)
        self.assertEqual(len(set(r['orderedRevisionKeys'])),2)
        self.assertFalse(r['completeHistory']); self.assertFalse(r['fullSupportAccepted'])
        self.assertEqual(r['snapshotConsistency'],'unproven')
        for key in ('transfer','decode','playback'): self.assertEqual(r[key],'not_attempted')

    def test_missing_last_response_is_not_covered(self):
        r = self.result(chain()[:1]); self.assertFalse(r['scopeExhausted']); self.assertIn('missing_chain_response',r['warnings'])

    def test_terminal_only_cannot_replace_initial(self):
        r = self.result(chain()[1:]); self.assertFalse(r['scopeExhausted']); self.assertIn('unreachable_response',r['warnings'])

    def test_shuffled_input_is_chained_by_exact_request(self):
        r = self.result(list(reversed(chain()))); self.assertTrue(r['scopeExhausted'])
        self.assertEqual(r['orderedRevisionKeys'],self.result()['orderedRevisionKeys'])

    def test_identical_retries_retain_attempts_not_duplicate_records(self):
        one,two = chain(); r = self.result([one,one,two,two])
        self.assertEqual(len(r['attempts']),4); self.assertEqual(len(r['records']),2); self.assertTrue(r['scopeExhausted'])

    def test_http_failure_then_success_remains_visible(self):
        r = self.result([capture({'private':'do not publish'},status=429),*chain()])
        self.assertEqual(r['attempts'][0]['outcome'],'rate_limited'); self.assertTrue(r['scopeExhausted'])
        self.assertNotIn('private',json.dumps(M.public_receipt(r)))

    def test_http_status_states(self):
        for code,state in [(401,'access_denied'),(403,'access_denied'),(404,'not_found'),(429,'rate_limited'),(304,'not_modified_without_representation'),(500,'http_failure')]:
            with self.subTest(code=code):
                r = self.result([capture(status=code)]); self.assertEqual(r['attempts'][0]['outcome'],state); self.assertFalse(r['scopeExhausted'])

    def test_api_errors_do_not_become_empty_success(self):
        for code,state in [('maxlag','rate_limited'),('ratelimited','rate_limited'),('readapidenied','access_denied'),('permissiondenied','access_denied'),('other','api_error')]:
            with self.subTest(code=code):
                r = self.result([capture({'error':{'code':code,'info':'secret prose'}})])
                self.assertEqual(r['attempts'][0]['outcome'],state); self.assertFalse(r['scopeExhausted'])
                self.assertNotIn('secret',json.dumps(M.public_receipt(r)))

    def test_warnings_retain_rows_but_block_coverage(self):
        p = payload(); p['warnings'] = {'secret':'private text'}
        r = self.result([capture(p)]); self.assertFalse(r['scopeExhausted']); self.assertEqual(len(r['records']),1)
        self.assertEqual(r['attempts'][0]['outcome'],'warning_partial')

    def test_hidden_file_and_actor_are_retained_without_inference(self):
        p = payload(); i = p['query']['pages'][0]['imageinfo'][0]; i.update(filehidden=True,userhidden=True)
        r = self.result([capture(p)]); v=r['records'][0]
        self.assertTrue(r['scopeExhausted']); self.assertEqual(v['fileState'],'hidden'); self.assertEqual(v['uploaderState'],'hidden')
        self.assertIsNone(v['url']); self.assertIsNone(v['uploader']); self.assertFalse(v['metadataComplete'])
        self.assertEqual(v['creator'],'unknown'); self.assertEqual(v['license'],'unknown')

    def test_missing_metadata_is_not_filled_from_other_revision(self):
        p = payload(); i=p['query']['pages'][0]['imageinfo'][0]; del i['user']; del i['sha1']
        r=self.result([capture(p)]); v=r['records'][0]
        self.assertEqual(v['uploaderState'],'missing'); self.assertEqual(v['fileState'],'partial'); self.assertIsNone(v['sha1'])

    def test_invalid_hidden_flags(self):
        for value in (False,None,1,'true'):
            with self.subTest(value=value): self.assertFalse(self.mutate_info('filehidden',value)['scopeExhausted'])

    def test_missing_invalid_and_foreign_files(self):
        for key,value in [('missing',True),('invalid',True),('imagerepository','shared')]:
            p=payload();p['query']['pages'][0][key]=value;r=self.result([capture(p)])
            self.assertEqual(r['attempts'][0]['outcome'],'file_unavailable');self.assertFalse(r['scopeExhausted'])

    def test_page_identity_change_blocks_scope(self):
        a,b=chain();p=json.loads(b['body']);p['query']['pages'][0]['pageid']=43;b['body']=json.dumps(p).encode()
        r=self.result([a,b]);self.assertFalse(r['scopeExhausted']);self.assertIn('page_identity_changed',r['warnings'])

    def test_large_page_identity_exact_and_bool_invalid(self):
        p=payload();p['query']['pages'][0]['pageid']=9007199254740993
        self.assertEqual(self.result([capture(p)])['records'][0]['pageId'],'9007199254740993')
        p['query']['pages'][0]['pageid']=True;self.assertFalse(self.result([capture(p)])['scopeExhausted'])

    def test_conflicting_response_variants_all_retained(self):
        a=capture(); p=payload();p['query']['pages'][0]['imageinfo'][0]['size']=124;b=capture(p)
        r=self.result([a,b,b]);self.assertEqual(len(r['records']),2);self.assertEqual(len(r['attempts']),3)
        self.assertIn('response_variant_conflict',r['warnings']);self.assertIn('revision_variant_conflict',r['warnings']);self.assertFalse(r['scopeExhausted'])

    def test_whitespace_only_variant_is_not_conflict(self):
        a=capture();b=copy.deepcopy(a);b['body']=b' \n'+b['body']
        r=self.result([a,b]);self.assertTrue(r['scopeExhausted']);self.assertEqual(len(r['records']),1)

    def test_continuation_uses_all_returned_parameters(self):
        token={'continue':'token','iicontinue':'opaque'}
        r=self.result([capture(payload(following=token)),capture(payload(EARLIER),{**BASE,**token})])
        self.assertTrue(r['scopeExhausted'])
        r=self.result([capture(payload(following=token)),capture(payload(EARLIER),{**BASE,'iicontinue':'opaque'})])
        self.assertFalse(r['scopeExhausted'])

    def test_batchcomplete_with_continuation_is_not_terminal(self):
        p=payload(following=TOKEN);p['batchcomplete']=True
        self.assertFalse(self.result([capture(p)])['scopeExhausted'])

    def test_invalid_and_legacy_continuation(self):
        for token in ({},{'continue':'||'},{'continue':'||','titles':'File:Other.jpg'}, {'continue':'||','iistart':'bad'}, {'continue':'||','iicontinue':1}):
            with self.subTest(token=token):self.assertFalse(self.result([capture(payload(following=token))])['scopeExhausted'])
        p=payload();p['query-continue']={};self.assertFalse(self.result([capture(p)])['scopeExhausted'])

    def test_missing_terminal_marker_rejects_false_exhaustion(self):
        for value in (None,False,'',1):
            p=payload();p['batchcomplete']=value;self.assertFalse(self.result([capture(p)])['scopeExhausted'])

    def test_cycle_detected(self):
        a=capture(payload(following=TOKEN));b=capture(payload(EARLIER,following=TOKEN),{**BASE,**TOKEN})
        r=self.result([a,b]);self.assertIn('continuation_cycle',r['warnings']);self.assertFalse(r['scopeExhausted'])

    def test_overlapping_revisions_do_not_hide_as_deduplication(self):
        token={'continue':'||','iicontinue':'next'}
        r=self.result([capture(payload(following=token)),capture(payload(),{**BASE,**token})])
        self.assertIn('overlapping_or_reordered_revisions',r['warnings']);self.assertFalse(r['scopeExhausted'])

    def test_start_end_bounds(self):
        for args in ({**BASE,'iistart':EARLIER},{**BASE,'iiend':'2021-01-01T00:00:00Z'}):
            self.assertFalse(self.result([capture(args=args)],args)['scopeExhausted'])

    def test_duplicate_and_unordered_batch_reject(self):
        args={**BASE,'iilimit':'2'};p=payload();p['query']['pages'][0]['imageinfo']*=2
        self.assertFalse(self.result([capture(p,args)],args)['scopeExhausted'])
        p['query']['pages'][0]['imageinfo'][0]=payload(EARLIER)['query']['pages'][0]['imageinfo'][0]
        self.assertFalse(self.result([capture(p,args)],args)['scopeExhausted'])

    def test_unknown_fields_and_exact_bytes_preserved_only_in_memory(self):
        p=payload();p['private']={'secret':'never publish'};a=capture(p);a['headers']={'Set-Cookie':'secret'}
        r=self.result([a]);self.assertEqual(r['rawCaptures'][0]['body'],a['body']);self.assertNotIn('headers',r['rawCaptures'][0])
        self.assertNotIn('secret',json.dumps(M.public_receipt(r)));self.assertNotIn('Synthetic actor',json.dumps(M.public_receipt(r)))
        a['body']=b'changed';self.assertNotEqual(r['rawCaptures'][0]['body'],a['body'])

    def test_public_receipt_omits_title_urls_media_type_and_tokens(self):
        wire=json.dumps(M.public_receipt(self.result()))
        for forbidden in ('Sample.jpg','https://','Synthetic actor','BITMAP','image/jpeg','||','iistart','rawCaptures','uploader"'):
            self.assertNotIn(forbidden,wire)

    def test_no_creator_or_license_inference(self):
        r=self.result();self.assertTrue(all(v['creator']==v['license']=='unknown' for v in r['records']))

    def test_duplicate_keys_nonfinite_invalid_utf8_surrogates(self):
        for raw in (b'{"a":1,"a":2}',b'{"a":NaN}',b'{"a":1e999}',b'{"a":"\xff"}',b'{"a":"\\ud800"}'):
            a=capture();a['body']=raw;r=self.result([a]);self.assertFalse(r['scopeExhausted']);self.assertEqual(r['attempts'][0]['outcome'],'invalid')

    def test_structural_budget(self):
        a=capture();a['body']=b'['*70+b'0'+b']'*70
        self.assertFalse(self.result([a])['scopeExhausted'])

    def test_input_limits_and_status_types(self):
        for captures in ([],[capture()]*65,[{**capture(),'body':b' '*(M.MAX_BODY+1)}],[{**capture(),'status':True}],[{**capture(),'body':'not bytes'}]):
            with self.assertRaises(M.RevisionError):self.result(captures)

    def test_mixed_scope_and_redirect_are_retained_invalid(self):
        a=capture(args={**BASE,'titles':'File:Other.jpg'});b=capture();b['finalUrl']=url({**BASE,'titles':'File:Other.jpg'})
        for item in (a,b):self.assertFalse(self.result([item])['scopeExhausted'])

    def test_unreachable_extra_success_blocks_scope(self):
        extra=capture(payload(EARLIER),{**BASE,'iistart':EARLIER,'continue':'wrong'})
        r=self.result([capture(),extra]);self.assertIn('unreachable_response',r['warnings']);self.assertFalse(r['scopeExhausted'])

    def test_request_boundaries(self):
        urls=[url()+'&titles=File:Other.jpg',url()+'&token=secret',url().replace('https:','http:'),url().replace('commons.wikimedia.org','secret@commons.wikimedia.org'),url()+'#x',url().replace('/w/api.php','/other')]
        for u in urls:
            with self.subTest(url=u),self.assertRaises(M.RevisionError):M.reconcile(u,[capture()])

    def test_base_query_restrictions(self):
        for key,value in [('formatversion','1'),('titles','File:Two_files.jpg'),('titles','File:A|File:B'),('iilimit','51'),('maxlag','0'),('iiprop','timestamp'),('continue','||'),('iistart','bad')]:
            with self.subTest(key=key),self.assertRaises(M.RevisionError):self.result(args={**BASE,key:value})

    def test_title_mapping_is_not_silently_accepted(self):
        p=payload();p['query']['normalized']=[];self.assertFalse(self.result([capture(p)])['scopeExhausted'])

    def test_media_origin_path_and_query_restrictions(self):
        for value in ('http://upload.wikimedia.org/a','https://other.example/a','https://secret@upload.wikimedia.org/wikipedia/commons/a/ab/Sample.jpg',
                      'https://upload.wikimedia.org/wikipedia/commons/a/ab/Other.jpg','https://upload.wikimedia.org/wikipedia/commons/a/ab/Sample.jpg?token=secret',
                      'https://upload.wikimedia.org/wikipedia/commons/a/ab/Sample.jpg#token','https://upload.wikimedia.org/wikipedia/commons/a/ab/%00Sample.jpg'):
            with self.subTest(url=value):self.assertFalse(self.mutate_info('url',value)['scopeExhausted'])

    def test_archived_url_kept_without_equating_archive_date_to_upload(self):
        v='https://upload.wikimedia.org/wikipedia/commons/archive/a/ab/20090101000000%21Sample.jpg?utm_campaign=example'
        r=self.mutate_info('url',v);self.assertTrue(r['scopeExhausted']);self.assertEqual(r['records'][0]['url'],v.split('?')[0])

    def test_bad_description_identity(self):
        self.assertFalse(self.mutate_info('descriptionurl','https://commons.wikimedia.org/wiki/File:Other.jpg')['scopeExhausted'])

    def test_metadata_types_and_ranges(self):
        for key,value in [('size',True),('size',-1),('sha1','wrong'),('mime','secret prose'),('mediatype','SECRET'),('timestamp','2020-99-99T00:00:00Z')]:
            with self.subTest(key=key):self.assertFalse(self.mutate_info(key,value)['scopeExhausted'])

    def test_access_label_is_caller_evidence_not_authentication(self):
        self.assertEqual(M.reconcile(url(),[capture()])['accessLabel'],'unknown')
        with self.assertRaises(M.RevisionError):M.reconcile(url(),[capture()],access='verified')

    def test_empty_page_cannot_expand_initial_upper_window(self):
        base={**BASE,'iistart':EARLIER};token={'continue':'||','iistart':LATEST}
        first=payload(following=token);first['query']['pages'][0]['imageinfo']=[]
        r=self.result([capture(first,base),capture(payload(),{**base,**token})],base)
        self.assertFalse(r['scopeExhausted']);self.assertEqual(r['records'],[])

    def test_arbitrary_capture_metadata_is_not_copied_or_published(self):
        metadata={};node=metadata
        for _ in range(2000):node['nested']={};node=node['nested']
        a=capture();a['headers']=metadata;r=self.result([a])
        self.assertTrue(r['scopeExhausted']);self.assertNotIn('headers',r['rawCaptures'][0])

    def test_dot_segment_and_path_titles_rejected(self):
        for title in ('File:.','File:..','File:sample/..','File: name.jpg','File:name.jpg '):
            with self.subTest(title=title),self.assertRaises(M.RevisionError):self.result(args={**BASE,'titles':title})

    def test_malformed_actor_distinct_from_missing_actor(self):
        for user in (None,False,0,[],{}):
            with self.subTest(user=user):
                r=self.mutate_info('user',user);self.assertFalse(r['scopeExhausted']);self.assertEqual(r['attempts'][0]['errors'],['invalid_uploader'])

    def test_local_manifest_replays_without_exposing_paths(self):
        import tempfile
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);a=capture();(root/'body.json').write_bytes(a['body'])
            manifest={'initialUrl':url(),'access':'public','captures':[{'requestUrl':url(),'status':200,'bodyFile':'body.json'}]}
            (root/'manifest.json').write_text(json.dumps(manifest))
            r=M.replay_manifest(root/'manifest.json');self.assertTrue(r['scopeExhausted']);self.assertNotIn(directory,json.dumps(r))
            manifest['captures'][0]['headers']={};(root/'manifest.json').write_text(json.dumps(manifest))
            with self.assertRaises(M.RevisionError):M.replay_manifest(root/'manifest.json')

    def test_local_manifest_confines_body_files_and_rejects_links(self):
        import os,tempfile
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);(root/'body.json').write_bytes(capture()['body']);(root/'link.json').symlink_to(root/'body.json')
            os.link(root/'body.json',root/'hardlink.json')
            for name in ('../body.json',str(root/'body.json'),'link.json','hardlink.json'):
                manifest={'initialUrl':url(),'captures':[{'requestUrl':url(),'status':403,'bodyFile':name}]}
                (root/'manifest.json').write_text(json.dumps(manifest))
                with self.subTest(name=name),self.assertRaises(M.RevisionError):M.replay_manifest(root/'manifest.json')

    def test_fifo_manifest_and_body_reject_without_waiting_for_writer(self):
        import os,tempfile,subprocess,sys
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);os.mkfifo(root/'fifo')
            manifest={'initialUrl':url(),'captures':[{'requestUrl':url(),'status':403,'bodyFile':'fifo'}]}
            (root/'manifest.json').write_text(json.dumps(manifest))
            for name in ('manifest.json','fifo'):
                done=subprocess.run([sys.executable,str(ROOT/'experiments/commons-audio-lab/revisions.py'),'--manifest',str(root/name),'--output',str(root/'receipt.json')],capture_output=True,text=True,timeout=2)
                self.assertEqual(done.returncode,2);self.assertEqual(json.loads(done.stdout)['error'],'regular_file_required');self.assertNotIn(directory,done.stdout)


if __name__ == '__main__': unittest.main()
