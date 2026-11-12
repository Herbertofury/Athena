"""Synthetic fault boundaries only; generated databases/logs are retained."""
from contextlib import closing
import hashlib
import importlib.util
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch

MODULE = Path(__file__).resolve().parents[1]/'experiments/retry-boundary-lab/retry_boundary.py'
spec = importlib.util.spec_from_file_location('retry_boundary', MODULE)
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)


def fail_at(target, error=RuntimeError):
    def fault(stage):
        if stage == target:
            raise error('synthetic interruption at '+stage)
    return fault


class RetryBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp(prefix='athena-synthetic-retry-'))
        self.p, self.s = self.root/'producer.sqlite', self.root/'receiver.sqlite'
        r.create_fixture(self.p, 'producer'); r.create_fixture(self.s, 'receiver')
        self.raw = r.payload('synthetic task', 7)

    def tearDown(self):
        states = {'test': self.id(), 'producer': r.snapshot(self.p, 'producer'),
                  'receiver': r.snapshot(self.s, 'receiver')}
        (self.root/'final-state.json').write_text(json.dumps(states,indent=2)+'\n')

    def submit(self, **kw):
        return r.submit(self.p, 'scope-a', 'key-a', 'synthetic task', 7, **kw)

    def counts(self):
        p, s = r.snapshot(self.p,'producer'), r.snapshot(self.s,'receiver')
        return (len(p['effects']),len(p['receipts']),len(p['outbox']),
                sum(x[4] is not None for x in p['outbox']),len(s['effects']),len(s['receipts']))

    def child(self, operation, phase):
        code = '''import importlib.util,os,sys
spec=importlib.util.spec_from_file_location('r',sys.argv[1]);r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
def fault(stage):
 if stage==sys.argv[5]: os._exit(91)
if sys.argv[4]=='submit': r.submit(sys.argv[2],'scope-a','key-a','synthetic task',7,fault=fault)
elif sys.argv[4]=='receive': r.dispatch_one(sys.argv[2],sys.argv[3],receiver_fault=fault)
else: r.dispatch_one(sys.argv[2],sys.argv[3],fault=fault)
'''
        proc = subprocess.run([sys.executable,'-c',code,str(MODULE),str(self.p),str(self.s),operation,phase],capture_output=True,timeout=15)
        (self.root/f'{operation}-{phase}.json').write_text(json.dumps({'returncode':proc.returncode,'stdout':proc.stdout.decode(),'stderr':proc.stderr.decode()},indent=2)+'\n')
        self.assertEqual(proc.returncode,91,proc.stderr)

    def test_same_key_replays_exact_original_receipt(self):
        first=self.submit(); before=r.snapshot(self.p,'producer')
        self.assertEqual(self.submit(),first)
        self.assertEqual(r.snapshot(self.p,'producer'),before)
        self.assertEqual(self.counts(),(1,1,1,0,0,0))

    def test_same_key_changed_payload_refused_without_mutation(self):
        self.submit(); before=r.snapshot(self.p,'producer')
        with self.assertRaises(r.Conflict):
            r.submit(self.p,'scope-a','key-a','synthetic task',8)
        self.assertEqual(r.snapshot(self.p,'producer'),before)

    def test_same_payload_new_key_is_new_intent(self):
        self.submit(); r.submit(self.p,'scope-a','key-b','synthetic task',7)
        self.assertEqual(self.counts(),(2,2,2,0,0,0))

    def test_same_key_new_scope_is_separate_identity(self):
        self.submit(); r.submit(self.p,'scope-b','key-a','synthetic task',7)
        self.assertEqual(self.counts(),(2,2,2,0,0,0))

    def test_invalid_identities_never_record(self):
        for v in ('','x'*65,'with space','é',None,1):
            with self.subTest(v=v), self.assertRaises(ValueError):
                r.submit(self.p,v,'key-a','synthetic task',7)
            with self.subTest(key=v), self.assertRaises(ValueError):
                r.submit(self.p,'scope-a',v,'synthetic task',7)
        self.assertEqual(self.counts(),(0,0,0,0,0,0))

    def test_invalid_units_and_name_never_record(self):
        for n in (True,False,0,-1,1_000_001,1.5,'7',None):
            with self.subTest(n=n), self.assertRaises(ValueError):
                r.submit(self.p,'scope-a','key-a','task',n)
        for name in ('','é'*65,'\ud800',None,1):
            with self.subTest(name=repr(name)), self.assertRaises(ValueError):
                r.submit(self.p,'scope-a','key-a',name,1)
        self.assertEqual(self.counts(),(0,0,0,0,0,0))

    def test_unicode_payload_and_boundary_identities_preserved(self):
        p=r.payload('é'*64,1_000_000)
        self.assertEqual(r.validate_payload(p),p)
        a=r.apply(self.p,'producer','s'*64,'k'*64,p)
        b=r.dispatch_one(self.p,self.s)
        self.assertEqual(r.validate_receipt(a,'s'*64,'k'*64,p),a)
        self.assertEqual(r.validate_receipt(b,'s'*64,'k'*64,p),b)
        self.assertEqual(self.counts(),(1,1,1,1,1,1))

    def test_noncanonical_duplicate_unknown_and_version_payloads_refused(self):
        for raw in (b'{}', b'{"name":"x","units":1,"version":2}',
                    b'{"name":"x","units":1,"version":true}',
                    b'{"name":"x","name":"x","units":1,"version":1}',
                    b'{"name": "x", "units": 1, "version": 1}',
                    b'{"extra":1,"name":"x","units":1,"version":1}',
                    b'[]',b'\xff',b'x'*1025,'not bytes'):
            with self.subTest(raw=raw), self.assertRaises(ValueError):
                r.receive(self.s,'scope-a','key-a',raw)
        self.assertEqual(self.counts(),(0,0,0,0,0,0))

    def test_each_precommit_exception_rolls_back_all_producer_rows(self):
        before=r.snapshot(self.p,'producer')
        for stage in ('after_effect','after_outbox','after_receipt'):
            with self.subTest(stage=stage),self.assertRaises(RuntimeError):
                self.submit(fault=fail_at(stage))
            self.assertEqual(r.snapshot(self.p,'producer'),before)

    def test_producer_process_exit_after_effect_rolls_back(self):
        self.child('submit','after_effect'); self.assertEqual(self.counts(),(0,0,0,0,0,0))
        self.submit(); self.assertEqual(self.counts(),(1,1,1,0,0,0))

    def test_producer_process_exit_after_outbox_rolls_back(self):
        self.child('submit','after_outbox'); self.assertEqual(self.counts(),(0,0,0,0,0,0))

    def test_producer_process_exit_after_receipt_rolls_back(self):
        self.child('submit','after_receipt'); self.assertEqual(self.counts(),(0,0,0,0,0,0))

    def test_producer_exit_after_commit_replays_without_duplicate(self):
        self.child('submit','after_commit'); self.assertEqual(self.counts(),(1,1,1,0,0,0))
        a=self.submit();self.assertEqual(a,self.submit());self.assertEqual(self.counts(),(1,1,1,0,0,0))

    def test_unknown_commit_response_does_not_mean_rollback(self):
        with self.assertRaises(TimeoutError):self.submit(fault=fail_at('after_commit',TimeoutError))
        self.assertEqual(self.counts(),(1,1,1,0,0,0));self.submit()
        self.assertEqual(self.counts(),(1,1,1,0,0,0))

    def test_dispatch_preserves_committed_source_and_acknowledges(self):
        self.submit(); a=r.dispatch_one(self.p,self.s)
        self.assertEqual(self.counts(),(1,1,1,1,1,1))
        self.assertIsNone(r.dispatch_one(self.p,self.s))
        self.assertEqual(r.snapshot(self.p,'producer')['outbox'][0][4],{'hex':a.hex()})

    def test_empty_dispatch_does_not_create_receiver_effect(self):
        self.assertIsNone(r.dispatch_one(self.p,self.s));self.assertEqual(self.counts(),(0,0,0,0,0,0))

    def test_cancellation_before_delivery_leaves_pending_only(self):
        self.submit()
        with self.assertRaises(InterruptedError):r.dispatch_one(self.p,self.s,fault=fail_at('after_read',InterruptedError))
        self.assertEqual(self.counts(),(1,1,1,0,0,0))

    def test_cancellation_after_delivery_cannot_undo_receiver(self):
        self.submit()
        with self.assertRaises(InterruptedError):r.dispatch_one(self.p,self.s,fault=fail_at('after_delivery',InterruptedError))
        self.assertEqual(self.counts(),(1,1,1,0,1,1))
        r.dispatch_one(self.p,self.s);self.assertEqual(self.counts(),(1,1,1,1,1,1))

    def test_lost_ack_process_exit_replays_receiver_receipt(self):
        self.submit();self.child('dispatch','after_delivery')
        self.assertEqual(self.counts(),(1,1,1,0,1,1))
        before=r.snapshot(self.s,'receiver');r.dispatch_one(self.p,self.s)
        self.assertEqual(r.snapshot(self.s,'receiver'),before)
        self.assertEqual(self.counts(),(1,1,1,1,1,1))

    def test_process_exit_before_ack_commit_leaves_retryable_event(self):
        self.submit();self.child('dispatch','before_ack_commit')
        self.assertEqual(self.counts(),(1,1,1,0,1,1))
        r.dispatch_one(self.p,self.s);self.assertEqual(self.counts(),(1,1,1,1,1,1))

    def test_process_exit_after_ack_commit_has_no_pending_event(self):
        self.submit();self.child('dispatch','after_ack_commit')
        self.assertEqual(self.counts(),(1,1,1,1,1,1));self.assertIsNone(r.dispatch_one(self.p,self.s))

    def test_receiver_process_exit_after_effect_rolls_back(self):
        self.submit();self.child('receive','after_effect')
        self.assertEqual(self.counts(),(1,1,1,0,0,0))
        r.dispatch_one(self.p,self.s);self.assertEqual(self.counts(),(1,1,1,1,1,1))

    def test_receiver_process_exit_after_receipt_rolls_back(self):
        self.submit();self.child('receive','after_receipt')
        self.assertEqual(self.counts(),(1,1,1,0,0,0))

    def test_receiver_process_exit_after_commit_remains_ambiguous(self):
        self.submit();self.child('receive','after_commit')
        self.assertEqual(self.counts(),(1,1,1,0,1,1))
        r.dispatch_one(self.p,self.s);self.assertEqual(self.counts(),(1,1,1,1,1,1))

    def test_outbox_alone_with_naive_receiver_duplicates_effect(self):
        self.submit()
        with self.assertRaises(RuntimeError):
            r.dispatch_one(self.p,self.s,deduplicate=False,fault=fail_at('after_delivery'))
        self.assertEqual(self.counts(),(1,1,1,0,1,0))
        r.dispatch_one(self.p,self.s,deduplicate=False)
        self.assertEqual(self.counts(),(1,1,1,1,2,0))

    def test_restored_effects_without_receipt_ledger_duplicate_on_replay(self):
        self.submit()
        with self.assertRaises(RuntimeError):r.dispatch_one(self.p,self.s,fault=fail_at('after_delivery'))
        copy=self.root/'incomplete-receiver.sqlite';r.create_fixture(copy,'receiver')
        # Deliberately incomplete NEW fixture; no original receipt is deleted.
        with r.connect(self.s,'receiver') as original,r.connect(copy,'receiver') as incomplete:
            incomplete.executemany('INSERT INTO effects VALUES(?,?,?,?)',original.execute('SELECT * FROM effects'))
        r.dispatch_one(self.p,copy)
        self.assertEqual(len(r.snapshot(copy,'receiver')['effects']),2)
        self.assertEqual(len(r.snapshot(self.s,'receiver')['effects']),1)

    def test_receiver_mismatched_key_payload_refuses_ack(self):
        self.submit();r.receive(self.s,'scope-a','key-a',r.payload('different task',7))
        before=r.snapshot(self.s,'receiver')
        with self.assertRaises(r.Conflict):r.dispatch_one(self.p,self.s)
        self.assertEqual(r.snapshot(self.s,'receiver'),before)
        self.assertEqual(self.counts(),(1,1,1,0,1,1))

    def test_invalid_acknowledgements_never_mark_delivery_complete(self):
        self.submit();valid=r.receipt('scope-a','key-a',self.raw,1)
        data=json.loads(valid)
        cases=[b'{}',b'[]',b'\xff',b'x'*513,'not bytes',valid+b' ',
               r.receipt('wrong','key-a',self.raw,1),
               r.receipt('scope-a','wrong',self.raw,1),
               r.receipt('scope-a','key-a',r.payload('other',1),1),
               r.encode(dict(data,effect_id=True)),r.encode(dict(data,version=True)),
               r.encode(dict(data,effect_id=0)),r.encode(dict(data,effect_id=2**63)),
               r.encode(dict(data,extra=1))]
        for ack in cases:
            with self.subTest(ack=ack),patch.object(r,'receive',return_value=ack),self.assertRaises(ValueError):
                r.dispatch_one(self.p,self.s)
            self.assertEqual(self.counts(),(1,1,1,0,0,0))

    def test_old_ack_cannot_replace_different_existing_ack(self):
        self.submit()
        def intervene(stage):
            if stage=='after_delivery':
                with r.connect(self.p,'producer') as conn:
                    conn.execute('UPDATE outbox SET acknowledgement=?',(r.receipt('scope-a','key-a',self.raw,99),))
        with self.assertRaises(r.Conflict):r.dispatch_one(self.p,self.s,fault=intervene)
        stored=r.snapshot(self.p,'producer')['outbox'][0][4]['hex']
        self.assertEqual(stored,r.receipt('scope-a','key-a',self.raw,99).hex())

    def test_busy_writer_failure_does_not_insert_or_implicitly_retry(self):
        with r.connect(self.p,'producer') as conn:
            conn.execute('BEGIN IMMEDIATE')
            with self.assertRaises(sqlite3.OperationalError) as caught:self.submit()
            self.assertEqual(caught.exception.sqlite_errorcode,sqlite3.SQLITE_BUSY)
            conn.execute('ROLLBACK')
        self.assertEqual(self.counts(),(0,0,0,0,0,0));self.submit()
        self.assertEqual(self.counts(),(1,1,1,0,0,0))

    def test_cross_process_contender_observes_busy_then_exact_replay(self):
        code='''import importlib.util,sys
from pathlib import Path
s=importlib.util.spec_from_file_location('r',sys.argv[1]);r=importlib.util.module_from_spec(s);s.loader.exec_module(r)
def pause(stage):
 if stage=='after_receipt':
  Path(sys.argv[3]).write_text('staged');sys.stdin.readline()
print(r.submit(sys.argv[2],'scope-a','key-a','synthetic task',7,fault=pause).decode(),flush=True)
'''
        ready=self.root/'writer-ready.txt'
        with subprocess.Popen([sys.executable,'-c',code,str(MODULE),str(self.p),str(ready)],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True) as child:
            # A bounded readiness deadline avoids hanging the suite on early failure.
            deadline=time.monotonic()+10
            while not ready.exists() and child.poll() is None and time.monotonic()<deadline:
                time.sleep(0.01)
            self.assertTrue(ready.exists(),'child did not stage')
            self.assertEqual(len(r.snapshot(self.p,'producer')['effects']),0)
            with self.assertRaises(sqlite3.OperationalError) as caught:self.submit()
            self.assertEqual(caught.exception.sqlite_errorcode,sqlite3.SQLITE_BUSY)
            output,error=child.communicate('\n',timeout=10)
            self.assertEqual(child.returncode,0,error)
        self.assertEqual(self.submit().decode(),output.strip())
        self.assertEqual(self.counts(),(1,1,1,0,0,0))

    def test_reentrant_dispatch_of_same_event_keeps_one_effect(self):
        self.submit();nested=[]
        def intervene(stage):
            if stage=='after_read':nested.append(r.dispatch_one(self.p,self.s))
        outer=r.dispatch_one(self.p,self.s,fault=intervene)
        self.assertEqual(outer,nested[0]);self.assertEqual(self.counts(),(1,1,1,1,1,1))

    def test_distinct_pending_commands_deliver_without_collapsing(self):
        self.submit();r.submit(self.p,'scope-a','key-b','synthetic task',7)
        a=r.dispatch_one(self.p,self.s);b=r.dispatch_one(self.p,self.s)
        self.assertNotEqual(a,b);self.assertEqual(self.counts(),(2,2,2,2,2,2))

    def test_independent_producers_same_namespace_collapse_same_key(self):
        self.submit();r.dispatch_one(self.p,self.s)
        other=self.root/'second-producer.sqlite';r.create_fixture(other,'producer')
        r.submit(other,'scope-a','key-a','synthetic task',7)
        r.dispatch_one(other,self.s)
        self.assertEqual(len(r.snapshot(self.s,'receiver')['effects']),1)
        self.assertIsNotNone(r.snapshot(other,'producer')['outbox'][0][4])

    def test_rerouting_unknown_delivery_to_new_ledger_repeats_effect(self):
        self.submit()
        with self.assertRaises(RuntimeError):r.dispatch_one(self.p,self.s,fault=fail_at('after_delivery'))
        other=self.root/'different-receiver.sqlite';r.create_fixture(other,'receiver')
        r.dispatch_one(self.p,other)
        self.assertEqual(len(r.snapshot(self.s,'receiver')['effects']),1)
        self.assertEqual(len(r.snapshot(other,'receiver')['effects']),1)

    def test_missing_existing_role_and_busy_wait_parameters_refused(self):
        missing=self.root/'missing.sqlite'
        with self.assertRaises(sqlite3.OperationalError):r.submit(missing,'s','k','n',1)
        self.assertFalse(missing.exists())
        with self.assertRaises(ValueError):r.submit(self.s,'s','k','n',1)
        with self.assertRaises(ValueError):r.dispatch_one(self.p,self.p)
        for n in (-1,5001,True,0.5):
            with self.subTest(n=n),self.assertRaises(ValueError):self.submit(busy_ms=n)

    def test_existing_destination_refused_without_overwrite(self):
        before=hashlib.sha256(self.p.read_bytes()).hexdigest()
        with self.assertRaises(FileExistsError):r.create_fixture(self.p,'producer')
        self.assertEqual(hashlib.sha256(self.p.read_bytes()).hexdigest(),before)

    def test_demo_keeps_unexpected_child_exit_diagnostics(self):
        code='''import sys
sys.path.insert(0,sys.argv[1])
import run_demo
try: run_demo.crash(sys.argv[2],sys.argv[3],'submit','unreached-phase')
except RuntimeError: sys.exit(23)
sys.exit(24)
'''
        proc=subprocess.run([sys.executable,'-c',code,str(MODULE.parent),str(self.p),str(self.s)],capture_output=True,timeout=15)
        self.assertEqual(proc.returncode,23,proc.stderr)
        record=json.loads((self.root/'child-submit-unreached-phase.json').read_text())
        self.assertEqual(record['returncode'],0)
        self.assertEqual(record['stdout'],'');self.assertEqual(record['stderr'],'')
        self.assertEqual(self.counts(),(1,1,1,0,0,0))


if __name__ == '__main__':
    unittest.main()
