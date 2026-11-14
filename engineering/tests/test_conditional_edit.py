"""Generated SQLite and real owned-loopback HTTP, never a production service."""
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
import hashlib
import http.client
import importlib.util
import json
from pathlib import Path
import sqlite3
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch

MODULE=Path(__file__).resolve().parents[1]/'experiments/conditional-edit-lab/conditional_edit.py'
spec=importlib.util.spec_from_file_location('conditional_edit',MODULE)
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
A=b'{"title":"client A","enabled":false}'
B=b'{"title":"original","enabled":true}'


class ConditionalEditTests(unittest.TestCase):
    def setUp(self):
        self.root=Path(tempfile.mkdtemp(prefix='athena-synthetic-conditional-'))
        self.db=self.root/'document.sqlite';r.create_fixture(self.db);self.receipts=[]

    def tearDown(self):
        (self.root/'receipt.json').write_text(json.dumps({'test':self.id(),'exchanges':self.receipts,'final_state':r.snapshot(self.db)},indent=2)+'\n')

    def tag(self):return r.read_document(self.db)['etag']

    def rejected(self,status,fn,*args,**kw):
        before=r.snapshot(self.db)
        with self.assertRaises(r.Rejected) as error:fn(*args,**kw)
        self.assertEqual(error.exception.status,status)
        self.assertEqual(r.snapshot(self.db),before)
        return error.exception

    def request(self,server,method='GET',body=None,headers=None,path='/document',defaults=True):
        h={'Content-Type':'application/json','X-Lab-Intent':'conditional-write'} if method=='PUT' and defaults else {}
        for key,value in (headers or {}).items():
            if value is None:h.pop(key,None)
            else:h[key]=value
        conn=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=4)
        try:
            conn.request(method,path,body=body,headers=h)
            response=conn.getresponse();data=response.read();actual=dict(response.getheaders())
            result={'status':response.status,'headers':actual,'body':data}
            self.receipts.append({'method':method,'path':path,'request_headers':h,'request_body_hex':None if body is None else body.hex(),'status':response.status,'response_headers':actual,'response_body_hex':data.hex()})
            return result
        finally:conn.close()

    def test_entity_tag_grammar_preserves_commas_backslashes_and_weakness(self):
        self.assertEqual(r.tags(' W/"a,b", "back\\slash", "", "\xff" '),[(True,'a,b'),(False,'back\\slash'),(False,''),(False,'\xff')])

    def test_empty_members_and_empty_tag_are_distinct(self):
        self.assertEqual(r.tags(' , , '),[]);self.assertEqual(r.tags('""'),[(False,'')])
        self.assertEqual(r.tags(',"x",,'),[(False,'x')]);self.assertIsNone(r.tags(None))

    def test_invalid_condition_shapes_rejected(self):
        for value in ('W/ "x"','w/"x"','"x" "y"','"unterminated','*,"x"','*,*','"a b"','"x\n"','"\u0100"',True):
            with self.subTest(value=value),self.assertRaises(r.Rejected) as error:r.tags(value)
            self.assertEqual(error.exception.status,400)

    def test_header_byte_tag_and_empty_member_budgets(self):
        for value in ('"'+'x'*1024+'"',','.join('"x"' for _ in range(9)),','*17):
            with self.subTest(value=value),self.assertRaises(r.Rejected) as error:r.tags(value)
            self.assertEqual(error.exception.status,431)

    def test_strong_and_weak_comparison_are_distinct(self):
        current='"x"';weak=r.tags('W/"x"')
        self.assertFalse(r.matches(weak,current,strong=True));self.assertTrue(r.matches(weak,current,strong=False))
        self.assertTrue(r.matches('*',current,strong=True))

    def test_missing_if_match_refused_without_mutation(self):
        self.rejected(428,r.replace_document,self.db,A)

    def test_matching_write_preserves_exact_bytes_and_history(self):
        raw=b' { "enabled" : true, "title" : "\xc3\xa9" }\n'
        result=r.replace_document(self.db,raw,self.tag())
        self.assertEqual(result['body'],raw);self.assertEqual(r.read_document(self.db)['body'],raw)
        state=r.snapshot(self.db);self.assertEqual(state['revision'],1);self.assertEqual(len(state['history']),2)
        self.assertEqual(state['history'][1]['body_hex'],raw.hex())

    def test_stale_second_editor_does_not_overwrite_first(self):
        old=self.tag();r.replace_document(self.db,A,old)
        self.rejected(412,r.replace_document,self.db,B,old)
        self.assertEqual(r.read_document(self.db)['body'],A)

    def test_weak_current_tag_cannot_authorize_write(self):
        self.rejected(412,r.replace_document,self.db,A,'W/'+self.tag())

    def test_strong_tag_list_selects_current_member(self):
        result=r.replace_document(self.db,A,'"opaque,comma", '+self.tag())
        self.assertEqual(result['status'],200)

    def test_wildcard_is_existence_control_not_stale_editor_protection(self):
        r.replace_document(self.db,A,'*');r.replace_document(self.db,B,'*')
        self.assertEqual(r.read_document(self.db)['body'],B);self.assertEqual(r.snapshot(self.db)['revision'],2)

    def test_empty_if_match_list_fails_existing_resource(self):
        self.rejected(412,r.replace_document,self.db,A,' , ')

    def test_if_none_match_uses_weak_comparison_for_read(self):
        result=r.read_document(self.db,if_none_match='W/'+self.tag())
        self.assertEqual(result['status'],304);self.assertEqual(result['body'],b'')

    def test_get_if_match_precedes_if_none_match(self):
        self.rejected(412,r.read_document,self.db,'"old"',self.tag())

    def test_if_none_match_on_write_refuses_current_representation(self):
        tag=self.tag();self.rejected(412,r.replace_document,self.db,A,tag,'W/'+tag)
        self.rejected(412,r.replace_document,self.db,A,tag,'*')

    def test_identical_bytes_write_still_rotates_revision_validator(self):
        before=r.read_document(self.db);after=r.replace_document(self.db,before['body'],before['etag'])
        self.assertNotEqual(before['etag'],after['etag']);self.assertEqual(before['body'],after['body'])

    def test_revert_to_old_bytes_does_not_reuse_old_validator(self):
        initial=r.read_document(self.db);first=r.replace_document(self.db,A,initial['etag'])
        restored=r.replace_document(self.db,initial['body'],first['etag'])
        self.assertNotEqual(restored['etag'],initial['etag']);self.assertEqual(restored['body'],initial['body'])

    def test_invalid_documents_never_update(self):
        tag=self.tag()
        for body in (b'{}',b'[]',b'{"title":"a","title":"b","enabled":true}',
                     b'{"title":"a","enabled":1}',b'{"title":null,"enabled":true}',
                     b'{"title":"","enabled":true}',b'{"title":"a","enabled":true,"extra":0}',
                     b'{"title":"\\ud800","enabled":true}',b'\xff'):
            with self.subTest(body=body):self.rejected(400,r.replace_document,self.db,body,tag)

    def test_body_budget_before_precondition_evaluation(self):
        self.rejected(413,r.replace_document,self.db,b'x'*1025,'"old"')
        self.rejected(400,r.replace_document,self.db,b'invalid','"old"')

    def test_fault_after_update_rolls_back_body_and_history(self):
        def fault(stage):
            if stage=='after_update':raise RuntimeError('synthetic failure')
        before=r.snapshot(self.db)
        with self.assertRaises(RuntimeError):r.replace_document(self.db,A,self.tag(),fault=fault)
        self.assertEqual(r.snapshot(self.db),before)

    def test_fault_before_commit_rolls_back_complete_history_append(self):
        def fault(stage):
            if stage=='before_commit':raise RuntimeError('synthetic failure')
        before=r.snapshot(self.db)
        with self.assertRaises(RuntimeError):r.replace_document(self.db,A,self.tag(),fault=fault)
        self.assertEqual(r.snapshot(self.db),before)

    def test_lost_postcommit_result_makes_retry_stale_not_known_failed(self):
        tag=self.tag()
        def fault(stage):
            if stage=='after_commit':raise TimeoutError('synthetic lost result')
        with self.assertRaises(TimeoutError):r.replace_document(self.db,A,tag,fault=fault)
        self.assertEqual(r.read_document(self.db)['body'],A)
        self.rejected(412,r.replace_document,self.db,A,tag)

    def test_two_concurrent_connections_commit_only_one_stale_base(self):
        for _ in range(5):
            tag=self.tag();barrier=threading.Barrier(2)
            def writer(body):
                barrier.wait(timeout=5)
                try:return r.replace_document(self.db,body,tag)['status']
                except r.Rejected as error:return error.status
            before=r.snapshot(self.db)
            with ThreadPoolExecutor(max_workers=2) as pool:
                a=pool.submit(writer,A);b=pool.submit(writer,B);statuses=[a.result(timeout=5),b.result(timeout=5)]
            self.assertEqual(sorted(statuses),[200,412]);self.assertEqual(r.snapshot(self.db)['revision'],before['revision']+1)

    def test_revision_exhaustion_is_explicit_and_preserves_state(self):
        with r.connection(self.db) as conn:conn.execute('UPDATE document SET revision=?',(2**63-1,))
        self.rejected(409,r.replace_document,self.db,A,self.tag())

    def test_open_missing_fixture_does_not_create_database(self):
        path=self.root/'missing.sqlite'
        with self.assertRaises(sqlite3.OperationalError):r.read_document(path)
        self.assertFalse(path.exists())

    def test_existing_fixture_creation_refused(self):
        before=r.snapshot(self.db)
        with self.assertRaises(FileExistsError):r.create_fixture(self.db)
        self.assertEqual(r.snapshot(self.db),before)

    def test_real_http_two_editors_and_refetch(self):
        with r.loopback_fixture(self.db) as server:
            a=self.request(server);b=self.request(server);tag=a['headers']['ETag']
            self.assertEqual(tag,b['headers']['ETag'])
            first=self.request(server,'PUT',A,{'If-Match':tag})
            second=self.request(server,'PUT',B,{'If-Match':tag})
            current=self.request(server)
            self.assertEqual([first['status'],second['status'],current['status']],[200,412,200])
            self.assertEqual(current['body'],A)

    def test_real_http_304_has_no_body_or_zero_content_length(self):
        with r.loopback_fixture(self.db) as server:
            first=self.request(server);second=self.request(server,headers={'If-None-Match':'W/'+first['headers']['ETag']})
            self.assertEqual(second['status'],304);self.assertEqual(second['body'],b'')
            self.assertNotIn('Content-Length',second['headers'])
            self.assertEqual(second['headers']['ETag'],first['headers']['ETag'])
            self.assertEqual(second['headers']['Cache-Control'],'private, no-cache')

    def test_real_http_head_matches_representation_length(self):
        with r.loopback_fixture(self.db) as server:
            get=self.request(server);head=self.request(server,'HEAD')
            self.assertEqual(head['status'],200);self.assertEqual(head['body'],b'')
            self.assertEqual(int(head['headers']['Content-Length']),len(get['body']))
            self.assertEqual(head['headers']['ETag'],get['headers']['ETag'])

    def test_real_http_428_is_not_cacheable_and_explains_condition(self):
        with r.loopback_fixture(self.db) as server:
            response=self.request(server,'PUT',A)
            self.assertEqual(response['status'],428);self.assertEqual(response['headers']['Cache-Control'],'no-store')
            self.assertIn(b'If_Match',response['body']);self.assertEqual(r.snapshot(self.db)['revision'],0)

    def test_real_http_validator_matches_exact_saved_bytes(self):
        raw=b'{  "enabled": true, "title": "kept whitespace" }\n'
        with r.loopback_fixture(self.db) as server:
            result=self.request(server,'PUT',raw,{'If-Match':self.tag()});read=self.request(server)
            self.assertEqual(result['body'],raw);self.assertEqual(read['body'],raw)
            self.assertEqual(result['headers']['ETag'],read['headers']['ETag'])

    def test_real_http_host_origin_intent_and_path_guards(self):
        with r.loopback_fixture(self.db) as server:
            for headers in ({'Host':'other.invalid'},{'Origin':'https://other.invalid'},{'X-Lab-Intent':None}):
                with self.subTest(headers=headers):
                    response=self.request(server,'PUT',A,dict({'If-Match':self.tag()},**headers))
                    self.assertEqual(response['status'],403)
            self.assertEqual(self.request(server,path='/other')['status'],404)
            self.assertEqual(r.snapshot(self.db)['revision'],0)

    def test_real_http_content_encoding_and_type_refused(self):
        with r.loopback_fixture(self.db) as server:
            for headers in ({'Content-Type':'text/plain'},{'Content-Encoding':'gzip'}):
                with self.subTest(headers=headers):
                    self.assertEqual(self.request(server,'PUT',A,dict({'If-Match':self.tag()},**headers))['status'],415)

    def test_real_http_transfer_encoding_and_oversized_body_refused(self):
        with r.loopback_fixture(self.db) as server:
            self.assertEqual(self.request(server,'PUT',A,{'If-Match':self.tag(),'Transfer-Encoding':'chunked'})['status'],400)
            self.assertEqual(self.request(server,'PUT',b'x'*1025,{'If-Match':self.tag()})['status'],413)

    def test_real_http_duplicate_condition_fields_are_combined(self):
        with r.loopback_fixture(self.db) as server:
            conn=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=4)
            try:
                conn.putrequest('PUT','/document')
                for k,v in [('Content-Type','application/json'),('Content-Length',str(len(A))),('X-Lab-Intent','conditional-write'),('If-Match','"a,b"'),('If-Match',self.tag())]:conn.putheader(k,v)
                conn.endheaders(A);resp=conn.getresponse();body=resp.read()
                self.assertEqual(resp.status,200);self.assertEqual(body,A)
            finally:conn.close()

    def test_response_transport_failure_never_emits_second_status(self):
        attempted=[]
        def broken_response(handler,status,*args,**kwargs):
            attempted.append(status)
            raise BrokenPipeError('injected response failure after commit')
        old=self.tag()
        with r.loopback_fixture(self.db) as server,patch.object(r.Handler,'emit',broken_response):
            with self.assertRaises(http.client.RemoteDisconnected):
                self.request(server,'PUT',A,{'If-Match':old})
        self.assertEqual(attempted,[200])
        self.assertEqual(r.read_document(self.db)['body'],A)
        self.assertEqual(r.snapshot(self.db)['revision'],1)
        self.rejected(412,r.replace_document,self.db,A,old)

    def test_real_http_duplicate_lengths_refused(self):
        with r.loopback_fixture(self.db) as server:
            conn=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=4)
            try:
                conn.putrequest('PUT','/document')
                for k,v in [('Content-Type','application/json'),('Content-Length',str(len(A))),('Content-Length',str(len(A))),('X-Lab-Intent','conditional-write'),('If-Match',self.tag())]:conn.putheader(k,v)
                conn.endheaders(A);resp=conn.getresponse();resp.read();self.assertEqual(resp.status,400)
            finally:conn.close()
        self.assertEqual(r.snapshot(self.db)['revision'],0)


if __name__=='__main__':unittest.main()
