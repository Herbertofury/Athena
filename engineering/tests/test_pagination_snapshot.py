import importlib.util
import json
from pathlib import Path
import random
import sqlite3
import tempfile
import unittest

LAB=Path(__file__).resolve().parents[1]/'experiments/pagination-snapshot-lab'
spec=importlib.util.spec_from_file_location('pagination_snapshot_lab',LAB/'paging.py')
lab=importlib.util.module_from_spec(spec);spec.loader.exec_module(lab)


class PaginationSnapshotTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.cons=[]
    def tearDown(self):
        for c in self.cons:c.close()
        self.tmp.cleanup()
    def db(self,n=6):
        p=self.root/('fixture%d.db'%len(self.cons));c=lab.create(p);self.cons.append(c)
        for i in range(1,n+1):lab.put(c,i,i//2,'mods','{ "id": %d, "warning": "retained" }'%i)
        return c,p
    def drain(self,c,g,*,size=2,cursor=None):
        result=[];receipts=[]
        for _ in range(1001):
            r=lab.page(c,g,'mods',size=size,cursor=cursor);result.extend(r['rows']);receipts.append(r)
            if r['complete']:return result,receipts
            cursor=r['next_cursor']
        self.fail('page sequence never completed')
    def test_all_page_sizes_preserve_ties_and_complete_fields(self):
        c,_=self.db(51);g=lab.capture(c,'mods');expected=lab.live_rows(c,'mods')
        for size in range(1,26):
            with self.subTest(size=size):
                actual,receipts=self.drain(c,g,size=size);self.assertEqual(actual,expected)
                self.assertEqual(receipts[-1]['seen'],51);self.assertIsNone(receipts[-1]['next_cursor'])
                self.assertEqual(len({r['id'] for r in actual}),51)
    def test_empty_snapshot_is_explicit_complete(self):
        c,_=self.db(0);g=lab.capture(c,'mods');r=lab.page(c,g,'mods')
        self.assertEqual(r['rows'],[]);self.assertEqual(r['total'],0);self.assertTrue(r['complete'])
    def test_generation_survives_live_insert_edit_delete(self):
        c,_=self.db();expected=lab.live_rows(c,'mods');g=lab.capture(c,'mods')
        first=lab.page(c,g,'mods',size=2)
        lab.remove(c,3);lab.put(c,1,999,'other','changed');lab.put(c,7,-99,'mods','new')
        rest,_=self.drain(c,g,cursor=first['next_cursor'])
        self.assertEqual(first['rows']+rest,expected)
    def test_live_offset_insert_duplicates_seen_row(self):
        c,_=self.db();first=lab.live_rows(c,'mods')[:2]
        lab.put(c,99,-99,'mods','new')
        second=[dict(r) for r in c.execute("SELECT * FROM live WHERE bucket='mods' ORDER BY sort_value,id LIMIT 2 OFFSET 2")]
        self.assertEqual(first[-1]['id'],second[0]['id'])
    def test_live_offset_delete_omits_unseen_row(self):
        c,_=self.db();initial=lab.live_rows(c,'mods');lab.remove(c,1)
        second=[dict(r) for r in c.execute("SELECT * FROM live WHERE bucket='mods' ORDER BY sort_value,id LIMIT 2 OFFSET 2")]
        self.assertNotIn(initial[2]['id'],[r['id'] for r in second]);self.assertEqual(second[0]['id'],initial[3]['id'])
    def test_sort_key_without_unique_tie_breaker_skips_unseen_tie(self):
        c,_=self.db();first=lab.live_rows(c,'mods')[:2];last=first[-1]
        rest=[dict(r) for r in c.execute("SELECT * FROM live WHERE bucket='mods' AND sort_value>? ORDER BY sort_value,id",(last['sort_value'],))]
        self.assertNotIn(3,[r['id'] for r in first+rest])
        g=lab.capture(c,'mods');self.assertEqual(self.drain(c,g)[0],lab.live_rows(c,'mods'))
    def test_live_keyset_mutable_sort_can_duplicate_and_omit(self):
        c,_=self.db();first=lab.live_rows(c,'mods')[:2];last=first[-1]
        lab.put(c,first[0]['id'],100,'mods','moved after boundary')
        lab.put(c,3,-100,'mods','moved before boundary')
        rest=[dict(r) for r in c.execute("SELECT * FROM live WHERE bucket='mods' AND (sort_value,id)>(?,?) ORDER BY sort_value,id",(last['sort_value'],last['id']))]
        ids=[r['id'] for r in first+rest];self.assertEqual(ids.count(1),2);self.assertNotIn(3,ids)
    def test_id_high_water_does_not_freeze_payload(self):
        c,_=self.db();high=c.execute('SELECT max(id) FROM live').fetchone()[0];original=lab.live_rows(c,'mods')
        lab.put(c,3,1,'mods','edited after first page')
        rest=[dict(r) for r in c.execute('SELECT * FROM live WHERE id>2 AND id<=? ORDER BY id',(high,))]
        self.assertNotEqual(rest[0]['payload'],original[2]['payload'])
    def test_replay_same_cursor_same_complete_page(self):
        c,_=self.db();g=lab.capture(c,'mods');cursor=lab.page(c,g,'mods',size=2)['next_cursor']
        self.assertEqual(lab.page(c,g,'mods',size=2,cursor=cursor),lab.page(c,g,'mods',size=2,cursor=cursor))
    def test_resume_new_connection_preserves_generation(self):
        c,p=self.db();g=lab.capture(c,'mods');r=lab.page(c,g,'mods',size=2);c.close()
        c=lab.connect(p);self.cons.append(c);rows,_=self.drain(c,g,cursor=r['next_cursor'])
        self.assertEqual(len(r['rows']+rows),6)
    def test_cross_database_cursor_rejected(self):
        a,_=self.db();b,_=self.db();ga=lab.capture(a,'mods');gb=lab.capture(b,'mods')
        token=lab.page(a,ga,'mods',size=2)['next_cursor']
        with self.assertRaises(lab.CursorError):lab.page(b,gb,'mods',size=2,cursor=token)
    def test_generation_filter_and_size_binding(self):
        c,_=self.db();g=lab.capture(c,'mods');other=lab.capture(c,'mods');token=lab.page(c,g,'mods',size=2)['next_cursor']
        for generation,bucket,size in [(other,'mods',2),(g,'other',2),(g,'mods',3)]:
            with self.assertRaises(lab.CursorError):lab.page(c,generation,bucket,size=size,cursor=token)
    def test_retired_or_missing_generation_does_not_fall_forward(self):
        c,_=self.db();g=lab.capture(c,'mods');token=lab.page(c,g,'mods',size=2)['next_cursor'];lab.retire(c,g);lab.capture(c,'mods')
        for generation in (g,999):
            with self.assertRaises(lab.GenerationUnavailable):lab.page(c,generation,'mods',size=2,cursor=token)
    def test_row_budget_rejects_whole_capture(self):
        c,_=self.db(4)
        with self.assertRaises(lab.SnapshotLimit):lab.capture(c,'mods',max_rows=3)
        self.assertEqual(c.execute('SELECT count(*) FROM generations').fetchone()[0],0)
        self.assertEqual(c.execute('SELECT count(*) FROM frozen').fetchone()[0],0)
    def test_unicode_payload_byte_budget_exact_boundary(self):
        c,_=self.db(0);lab.put(c,1,0,'mods','é'*3)
        with self.assertRaises(lab.SnapshotLimit):lab.capture(c,'mods',max_payload_bytes=5)
        g=lab.capture(c,'mods',max_payload_bytes=6);self.assertEqual(lab.page(c,g,'mods')['rows'][0]['payload'],'é'*3)
    def test_capture_failure_does_not_publish_generation(self):
        c,_=self.db()
        def fail(con,g):raise RuntimeError('injected after copy')
        with self.assertRaises(RuntimeError):lab.capture(c,'mods',after_copy=fail)
        self.assertEqual(c.execute('SELECT count(*) FROM generations').fetchone()[0],0)
        self.assertEqual(c.execute('SELECT count(*) FROM frozen').fetchone()[0],0)
        self.assertFalse(c.in_transaction)
    def test_copy_mismatch_rolls_back(self):
        c,_=self.db()
        def change(con,g):con.execute("UPDATE frozen SET payload='changed' WHERE generation=?",(g,))
        with self.assertRaises(lab.SnapshotMismatch):lab.capture(c,'mods',after_copy=change)
        self.assertEqual(c.execute('SELECT count(*) FROM generations').fetchone()[0],0)
    def test_generation_budget_includes_retired_storage(self):
        c,_=self.db(0)
        for _ in range(lab.MAX_GENERATIONS):lab.retire(c,lab.capture(c,'mods'))
        with self.assertRaises(lab.SnapshotLimit):lab.capture(c,'mods')
    def test_schema_and_integer_cursor_rejections(self):
        c,_=self.db();g=lab.capture(c,'mods');obj=json.loads(lab.page(c,g,'mods',size=2)['next_cursor'])
        changes=[('v',True),('v',2),('size',True),('size',2.0),('seen',False),('seen',0),('generation',0),('order','different'),('database','x'),('after',[None,1]),('after',[0,False]),('after',[]),('extra',1)]
        for key,value in changes:
            changed={**obj,key:value}
            with self.subTest(key=key,value=value),self.assertRaises(lab.CursorError):lab.page(c,g,'mods',size=2,cursor=json.dumps(changed))
    def test_malformed_cursor_wire(self):
        c,_=self.db();g=lab.capture(c,'mods')
        for token in ('', '[]','null','{}','{"v":1,"v":1}', '{"x":NaN}', 'x'*1025, '\ud800', '['*1000+']'*1000):
            with self.subTest(token=token[:20]),self.assertRaises(lab.CursorError):lab.page(c,g,'mods',cursor=token)
    def test_cursor_boundary_and_prefix_count_checked(self):
        c,_=self.db();g=lab.capture(c,'mods');obj=json.loads(lab.page(c,g,'mods',size=2)['next_cursor'])
        for values in ({'after':[999,2]},{'after':[1,999]},{'seen':3}):
            with self.assertRaises(lab.CursorError):lab.page(c,g,'mods',size=2,cursor=json.dumps({**obj,**values}))
    def test_unsigned_cursor_is_not_authentication(self):
        c,_=self.db();g=lab.capture(c,'mods');obj=json.loads(lab.page(c,g,'mods',size=2)['next_cursor'])
        # A caller who edits all coherent fields can skip ahead. This is a
        # negative security control: the wire format is not a signed capability.
        obj.update(after=[2,4],seen=4)
        r=lab.page(c,g,'mods',size=2,cursor=json.dumps(obj));self.assertEqual([x['id'] for x in r['rows']],[5,6])
    def test_raw_snapshot_removal_not_false_complete(self):
        c,_=self.db();g=lab.capture(c,'mods');r=lab.page(c,g,'mods',size=2)
        c.execute('DELETE FROM frozen WHERE generation=? AND id=6',(g,))
        with self.assertRaises(lab.SnapshotMismatch):self.drain(c,g,cursor=r['next_cursor'])
    def test_nested_transaction_refused_without_ownership_change(self):
        c,_=self.db();g=lab.capture(c,'mods');c.execute('BEGIN')
        for op in (lambda:lab.page(c,g,'mods'),lambda:lab.capture(c,'mods')):
            with self.assertRaises(ValueError):op()
            self.assertTrue(c.in_transaction)
        c.execute('ROLLBACK')
    def test_invalid_inputs_before_mutation(self):
        c,_=self.db(0)
        for args in [(True,0,'mods','x'),(1,None,'mods','x'),(1,0,'','x'),(1,0,'mods','\0'),(1,0,'mods','é'*2049)]:
            with self.assertRaises(ValueError):lab.put(c,*args)
        self.assertEqual(lab.live_rows(c,'mods'),[])
        for v in (0,True,1001):
            with self.assertRaises(ValueError):lab.capture(c,'mods',max_rows=v)
    def test_retirement_during_page_is_snapshot_not_revocation(self):
        reader,path=self.db();reader.execute('PRAGMA journal_mode=WAL');g=lab.capture(reader,'mods')
        writer=lab.connect(path);self.cons.append(writer);done=[]
        def trace(sql):
            if sql.startswith('SELECT id,sort_value,bucket,payload FROM frozen') and not done:
                done.append(True);lab.retire(writer,g)
        reader.set_trace_callback(trace)
        first=lab.page(reader,g,'mods',size=2);reader.set_trace_callback(None)
        self.assertEqual(len(first['rows']),2);self.assertTrue(done)
        with self.assertRaises(lab.GenerationUnavailable):lab.page(reader,g,'mods',size=2,cursor=first['next_cursor'])
    def test_commit_busy_capture_rolls_back_and_explicit_retry_succeeds(self):
        writer,path=self.db();reader=lab.connect(path);self.cons.append(reader)
        reader.execute('BEGIN');reader.execute('SELECT * FROM live').fetchall()
        with self.assertRaises(sqlite3.OperationalError) as error:lab.capture(writer,'mods')
        self.assertEqual(error.exception.sqlite_errorname,'SQLITE_BUSY')
        self.assertFalse(writer.in_transaction)
        self.assertEqual(writer.execute('SELECT count(*) FROM generations').fetchone()[0],0)
        self.assertEqual(writer.execute('SELECT count(*) FROM frozen').fetchone()[0],0)
        reader.execute('ROLLBACK')
        g=lab.capture(writer,'mods');self.assertEqual(len(self.drain(writer,g)[0]),6)
    def test_capture_holds_writer_boundary(self):
        c,path=self.db();other=lab.connect(path);self.cons.append(other);observed=[]
        def attempt(con,g):
            try:lab.put(other,99,0,'mods','concurrent')
            except sqlite3.OperationalError as exc:observed.append(exc.sqlite_errorname)
        g=lab.capture(c,'mods',after_copy=attempt)
        self.assertEqual(observed,['SQLITE_BUSY']);self.assertEqual(len(self.drain(c,g)[0]),6)
    def test_seeded_mutations_between_every_frozen_page(self):
        c,_=self.db(80);expected=lab.live_rows(c,'mods');g=lab.capture(c,'mods');rng=random.Random(20261111)
        result=[];token=None
        for _ in range(100):
            r=lab.page(c,g,'mods',size=3,cursor=token);result.extend(r['rows'])
            for _ in range(3):
                key=rng.randint(1,100)
                if rng.randrange(3)==0:lab.remove(c,key)
                else:lab.put(c,key,rng.randint(-50,50),rng.choice(['mods','other']),'changed %d'%key)
            if r['complete']:break
            token=r['next_cursor']
        else:self.fail('never completed')
        self.assertEqual(result,expected)


if __name__=='__main__':unittest.main()
