"""Independent trusted-fixture review; no author files modified."""
import importlib.util
import json
from pathlib import Path
import random
import sqlite3
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('paging_review_target', ROOT/'experiments/pagination-snapshot-lab/paging.py')
pager=importlib.util.module_from_spec(spec);spec.loader.exec_module(pager)

class IndependentReview(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.path=Path(self.tmp.name)/'owned.db';self.c=pager.create(self.path);self.connections=[self.c]
    def tearDown(self):
        for c in self.connections:c.close()
        self.tmp.cleanup()
    def extra(self):
        c=pager.connect(self.path);self.connections.append(c);return c
    def seed(self,n=8,bucket='mods'):
        for i in range(1,n+1):pager.put(self.c,i,i//3,bucket,'payload-%s'%i)
    def drain(self,g,bucket='mods',size=3):
        rows=[];token=None
        for _ in range(1002):
            response=pager.page(self.c,g,bucket,size=size,cursor=token);rows.extend(response['rows'])
            if response['complete']:
                self.assertEqual(response['seen'],response['total']);return rows
            token=response['next_cursor']
        self.fail('pagination did not terminate')
    def test_worst_escaping_bucket_cursor_roundtrip(self):
        # Worst expansion for a valid 64-byte bucket: six escaped ASCII chars each.
        bucket='\x01'*64
        for i,sort in [(1,-2**31),(2,2**31-1),(2**31-1,2**31-1)]:pager.put(self.c,i,sort,bucket,'é😀')
        g=pager.capture(self.c,bucket);response=pager.page(self.c,g,bucket,size=1)
        self.assertLessEqual(len(response['next_cursor'].encode()),1024)
        self.assertEqual(self.drain(g,bucket,size=1),pager.live_rows(self.c,bucket))
    def test_supplementary_unicode_and_binary_filter_identity(self):
        for i,bucket in enumerate(['😀'*16,'é','e\u0301','A','a'],1):pager.put(self.c,i,0,bucket,'full payload')
        for bucket in ['😀'*16,'é','e\u0301','A','a']:
            g=pager.capture(self.c,bucket);self.assertEqual(self.drain(g,bucket),pager.live_rows(self.c,bucket));self.assertEqual(len(self.drain(g,bucket)),1)
    def test_exact_thousand_rows_and_rejected_extra(self):
        for i in range(1,1001):pager.put(self.c,i,0,'mods','')
        g=pager.capture(self.c,'mods');self.assertEqual(len(self.drain(g,size=1)),1000)
        pager.put(self.c,1001,0,'mods','')
        with self.assertRaises(pager.SnapshotLimit):pager.capture(self.c,'mods')
        self.assertEqual(self.c.execute('SELECT count(*) FROM generations').fetchone()[0],1)
    def test_one_mebibyte_payload_bound_exact(self):
        for i in range(1,257):pager.put(self.c,i,0,'mods','é'*2048)
        g=pager.capture(self.c,'mods');self.assertEqual(self.c.execute('SELECT payload_bytes FROM generations WHERE id=?',(g,)).fetchone()[0],1048576)
        self.assertEqual(len(self.drain(g)),256)
        pager.put(self.c,257,0,'mods','x')
        with self.assertRaises(pager.SnapshotLimit):pager.capture(self.c,'mods')
        self.assertEqual(self.c.execute('SELECT count(*) FROM generations').fetchone()[0],1)
    def test_commit_busy_rolls_back_capture_then_retry_succeeds(self):
        self.seed();reader=self.extra();reader.execute('BEGIN');reader.execute('SELECT * FROM live').fetchall()
        with self.assertRaises(sqlite3.OperationalError) as caught:pager.capture(self.c,'mods')
        self.assertEqual(caught.exception.sqlite_errorname,'SQLITE_BUSY');self.assertFalse(self.c.in_transaction)
        self.assertEqual(self.c.execute('SELECT count(*) FROM generations').fetchone()[0],0)
        self.assertEqual(self.c.execute('SELECT count(*) FROM frozen').fetchone()[0],0)
        reader.execute('ROLLBACK');g=pager.capture(self.c,'mods');self.assertEqual(len(self.drain(g)),8)
    def test_uncommitted_capture_is_not_visible_to_other_reader(self):
        self.seed();reader=self.extra();observations=[]
        def inspect(con,g):
            observations.append(reader.execute('SELECT count(*) FROM generations').fetchone()[0]);observations.append(reader.execute('SELECT count(*) FROM frozen').fetchone()[0])
        g=pager.capture(self.c,'mods',after_copy=inspect)
        self.assertEqual(observations,[0,0]);self.assertEqual(reader.execute('SELECT count(*) FROM generations').fetchone()[0],1);self.assertEqual(len(self.drain(g)),8)
    def test_retirement_committed_before_first_read_is_seen(self):
        self.seed();self.c.execute('PRAGMA journal_mode=WAL');g=pager.capture(self.c,'mods');writer=self.extra();done=[]
        def trace(sql):
            if sql=='SELECT value FROM identity WHERE id=1' and not done:done.append(True);pager.retire(writer,g)
        self.c.set_trace_callback(trace)
        try:
            with self.assertRaises(pager.GenerationUnavailable):pager.page(self.c,g,'mods')
        finally:self.c.set_trace_callback(None)
        self.assertTrue(done);self.assertFalse(self.c.in_transaction)
    def test_copied_database_identity_is_not_clone_security(self):
        self.seed();g=pager.capture(self.c,'mods');r=pager.page(self.c,g,'mods',size=2)
        clone=sqlite3.connect(Path(self.tmp.name)/'clone.db');self.c.backup(clone);clone.close()
        clone=pager.connect(Path(self.tmp.name)/'clone.db');self.connections.append(clone)
        # This is deliberately accepted, proving the documented limitation.
        self.assertEqual(pager.page(self.c,g,'mods',size=2,cursor=r['next_cursor']),pager.page(clone,g,'mods',size=2,cursor=r['next_cursor']))
    def test_coherent_forgery_can_claim_complete_without_prefix_delivery(self):
        self.seed();g=pager.capture(self.c,'mods');r=pager.page(self.c,g,'mods',size=2);obj=json.loads(r['next_cursor']);last=pager.live_rows(self.c,'mods')[-1]
        obj.update(after=[last['sort_value'],last['id']],seen=8)
        r=pager.page(self.c,g,'mods',size=2,cursor=json.dumps(obj))
        self.assertEqual(r['rows'],[]);self.assertTrue(r['complete']);self.assertEqual(r['seen'],8)
    def test_seeded_randomized_state_machine_complete_order_and_payload(self):
        rng=random.Random(882701)
        for generation in range(8):
            for _ in range(90):
                key=rng.randint(1,150)
                if rng.randrange(5)==0:pager.remove(self.c,key)
                else:pager.put(self.c,key,rng.choice([-2**31,-2,-1,0,0,0,1,2,2**31-1]),rng.choice(['mods','other']),rng.choice(['','😀','warning retained','x'*64]))
            expected=pager.live_rows(self.c,'mods');g=pager.capture(self.c,'mods');rows=[];token=None;size=rng.randint(1,25)
            for _ in range(1001):
                r=pager.page(self.c,g,'mods',size=size,cursor=token);rows.extend(r['rows'])
                for _ in range(9):
                    key=rng.randint(1,150)
                    if rng.randrange(2):pager.remove(self.c,key)
                    else:pager.put(self.c,key,rng.randint(-100,100),'mods','changed')
                if r['complete']:break
                token=r['next_cursor']
            else:self.fail('no final page')
            self.assertEqual(rows,expected);pager.retire(self.c,g)
    def test_randomized_wire_corruption_has_only_declared_errors(self):
        self.seed();g=pager.capture(self.c,'mods');token=pager.page(self.c,g,'mods',size=2)['next_cursor'];rng=random.Random(9231)
        for _ in range(2000):
            index=rng.randrange(len(token));mutant=token[:index]+rng.choice(['\0','\ud800','\\','"','[',']','{','}',':',',','a','0',' '])+token[index+1:]
            try:pager.page(self.c,g,'mods',size=2,cursor=mutant)
            except (pager.CursorError,pager.GenerationUnavailable):pass
        self.assertFalse(self.c.in_transaction)

if __name__=='__main__':unittest.main(verbosity=2)
