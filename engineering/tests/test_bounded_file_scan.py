"""Real Linux filesystem operations on retained synthetic fixtures only."""
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
import errno
import hashlib
import importlib.util
import json
import os
import stat
from pathlib import Path
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch

MODULE=Path(__file__).resolve().parents[1]/'experiments/bounded-file-scan-lab/file_scan.py'
spec=importlib.util.spec_from_file_location('bounded_file_scan',MODULE)
r=importlib.util.module_from_spec(spec);sys.modules[spec.name]=r;spec.loader.exec_module(r)


@unittest.skipUnless(sys.platform.startswith('linux'),'explicit Linux descriptor-only experiment')
class BoundedFileScanTests(unittest.TestCase):
    def setUp(self):
        self.root=Path(tempfile.mkdtemp(prefix='athena-synthetic-file-scan-'))
        self.inputs=self.root/'inputs';self.inputs.mkdir()
        self.saved=self.root/'saved';self.saved.mkdir()
        self.receipts=[]
        self.limits=r.Limits(workers=2,inflight=3,entries=32,file_bytes=4096,chunk_bytes=64)

    def tearDown(self):
        (self.root/'receipts.json').write_text(json.dumps({'test':self.id(),'receipts':self.receipts},indent=2)+'\n')

    def put(self,name='a.bin',data=b'generated payload'):
        p=self.inputs/name;p.write_bytes(data);return p

    def scan(self,**kw):
        result=r.scan(self.inputs,kw.pop('limits',self.limits),**kw)
        self.receipts.append(result)
        m=result['metrics'];lim=result['limits']
        self.assertEqual((m['active'],m['handles'],m['payload_bytes']),(0,0,0))
        self.assertLessEqual(m['peak_active'],lim['workers'])
        self.assertLessEqual(m['peak_handles'],lim['workers'])
        self.assertLessEqual(m['peak_payload_bytes'],lim['workers']*lim['chunk_bytes'])
        self.assertLessEqual(m['peak_inflight'],lim['inflight'])
        self.assertLessEqual(m['read_bytes'],lim['entries']*(lim['file_bytes']+1))
        self.assertEqual(m['read_bytes'],sum(x['bytes_read'] for x in result['outcomes']))
        return result

    def test_empty_directory_is_complete_but_not_snapshot(self):
        v=self.scan();self.assertTrue(v['all_checks_passed']);self.assertEqual(v['outcomes'],[])
        self.assertIs(v['snapshot_guarantee'],False)

    def test_serial_and_parallel_complete_fingerprints_match(self):
        for i in range(15):self.put(f'{i:02}.bin',bytes([i])*((i+1)*93))
        a=self.scan(limits=replace(self.limits,workers=1,inflight=1))
        b=self.scan(limits=replace(self.limits,workers=4,inflight=6))
        self.assertTrue(a['all_checks_passed']);self.assertTrue(b['all_checks_passed'])
        self.assertEqual(a['outcomes'],b['outcomes'])
        self.assertEqual(len(a['outcomes']),15)

    def test_empty_and_exact_maximum_file_preserve_complete_hash(self):
        self.put('empty',b'');data=b'x'*4096;self.put('exact',data)
        v=self.scan();self.assertTrue(v['all_checks_passed'])
        self.assertEqual([x['sha256'] for x in v['outcomes']],
                         [hashlib.sha256(b'').hexdigest(),hashlib.sha256(data).hexdigest()])

    def test_oversized_input_is_not_read_or_silently_skipped(self):
        self.put('huge',b'x'*4097);self.put('small',b'ok')
        v=self.scan();self.assertFalse(v['all_checks_passed'])
        self.assertEqual([x['status'] for x in v['outcomes']],['oversized','observed'])
        self.assertEqual(v['metrics']['read_bytes'],2)

    def test_entry_overflow_stops_all_reads_with_incomplete_status(self):
        for i in range(5):self.put(str(i))
        v=self.scan(limits=replace(self.limits,entries=4))
        self.assertFalse(v['initial_enumeration_complete']);self.assertFalse(v['all_checks_passed'])
        self.assertEqual(len(v['outcomes']),4);self.assertEqual(v['metrics']['submitted'],0)
        self.assertEqual(v['diagnostics'],['entry_limit_exceeded'])

    def test_symlink_is_not_followed(self):
        outside=self.root/'outside';outside.write_bytes(b'not a scan input')
        (self.inputs/'link').symlink_to(outside)
        v=self.scan();self.assertEqual(v['outcomes'][0]['status'],'unsupported_type_or_links')
        self.assertEqual(v['metrics']['read_bytes'],0)

    def test_hardlinks_are_explicitly_unsupported(self):
        p=self.put();os.link(p,self.inputs/'alias')
        v=self.scan();self.assertEqual([x['status'] for x in v['outcomes']],['unsupported_type_or_links']*2)

    def test_directory_and_fifo_are_not_read(self):
        (self.inputs/'directory').mkdir();os.mkfifo(self.inputs/'fifo')
        v=self.scan();self.assertEqual([x['status'] for x in v['outcomes']],['unsupported_type_or_links']*2)

    def test_symlink_replacement_between_check_and_open_is_refused(self):
        p=self.put();outside=self.root/'outside';outside.write_bytes(b'not a scan input')
        def mutate(stage,name):
            if stage=='before_open':p.rename(self.saved/'original');p.symlink_to(outside)
        v=self.scan(hook=mutate);row=v['outcomes'][0]
        self.assertEqual(row['status'],'io_error');self.assertEqual(row['errno'],errno.ELOOP)
        self.assertEqual(row['bytes_read'],0)

    def test_fifo_replacement_does_not_block_read_open(self):
        p=self.put()
        def mutate(stage,name):
            if stage=='before_open':p.rename(self.saved/'original');os.mkfifo(p)
        v=self.scan(hook=mutate);self.assertEqual(v['outcomes'][0]['status'],'unsupported_type_or_links')
        self.assertEqual(v['metrics']['read_bytes'],0)

    def test_same_name_regular_replacement_fails_preopen_identity(self):
        p=self.put()
        def mutate(stage,name):
            if stage=='before_open':p.rename(self.saved/'original');p.write_bytes(b'other')
        v=self.scan(hook=mutate);self.assertEqual(v['outcomes'][0]['status'],'changed_before_read')

    def test_replacement_after_open_reads_original_handle_but_rejects_name(self):
        data=b'a'*200;p=self.put(data=data)
        def mutate(stage,name):
            if stage=='after_open':p.rename(self.saved/'original');p.write_bytes(b'b'*200)
        v=self.scan(hook=mutate);row=v['outcomes'][0]
        self.assertEqual(row['status'],'changed_during_read');self.assertEqual(row['bytes_read'],200)
        self.assertNotIn('sha256',row)

    def test_same_size_inplace_change_with_restored_mtime_is_detected(self):
        p=self.put(data=b'a'*200);before=p.stat();mutated=[]
        def mutate(stage,name):
            if stage=='after_chunk' and not mutated:
                p.write_bytes(b'b'*200);os.utime(p,ns=(before.st_atime_ns,before.st_mtime_ns));mutated.append(True)
        v=self.scan(hook=mutate);self.assertEqual(v['outcomes'][0]['status'],'changed_during_read')
        self.assertEqual(p.stat().st_mtime_ns,before.st_mtime_ns)

    def test_growth_during_read_is_bounded_to_limit_plus_one(self):
        p=self.put(data=b'a'*200);mutated=[]
        def mutate(stage,name):
            if stage=='after_chunk' and not mutated:
                with p.open('ab') as stream:stream.write(b'b'*9000)
                mutated.append(True)
        v=self.scan(hook=mutate);row=v['outcomes'][0]
        self.assertEqual(row['status'],'grew_over_limit');self.assertEqual(row['bytes_read'],4097)

    def test_truncation_after_open_is_not_a_short_success(self):
        p=self.put(data=b'a'*200)
        def mutate(stage,name):
            if stage=='after_open':p.write_bytes(b'short')
        v=self.scan(hook=mutate);self.assertEqual(v['outcomes'][0]['status'],'changed_during_read')

    def test_added_entry_invalidates_complete_directory_claim(self):
        self.put()
        def mutate(stage,name):
            if stage=='after_preflight':self.put('added',b'new')
        v=self.scan(hook=mutate);self.assertIn('directory_entries_changed',v['diagnostics'])
        self.assertFalse(v['all_checks_passed'])

    def test_renamed_entry_is_recorded_as_error_not_dropped(self):
        p=self.put()
        def mutate(stage,name):
            if stage=='after_preflight':p.rename(self.saved/'original')
        v=self.scan(hook=mutate);self.assertEqual(len(v['outcomes']),1)
        self.assertEqual(v['outcomes'][0]['errno'],errno.ENOENT)

    def test_root_descriptor_stays_on_opened_directory_after_rename(self):
        data=b'original root';self.put(data=data);old=self.inputs
        def mutate(stage,name):
            if stage=='after_preflight':
                old.rename(self.root/'moved-inputs');old.mkdir();(old/'a.bin').write_bytes(b'wrong root')
        v=self.scan(hook=mutate);row=v['outcomes'][0]
        self.assertEqual(row.get('sha256'),hashlib.sha256(data).hexdigest())

    def test_injected_read_error_retains_other_results_and_bytes(self):
        self.put('a',b'a'*200);self.put('b',b'b'*100)
        def fail(stage,name):
            if stage=='after_chunk' and name==b'a':raise OSError(errno.EIO,'synthetic read fault')
        v=self.scan(hook=fail)
        self.assertEqual([x['status'] for x in v['outcomes']],['io_error','observed'])
        self.assertEqual(v['outcomes'][0]['bytes_read'],64)

    def test_worker_exception_is_explicit_not_success(self):
        self.put()
        def fail(stage,name):
            if stage=='after_open':raise RuntimeError('synthetic parser failure')
        v=self.scan(hook=fail);self.assertEqual(v['outcomes'][0]['error_type'],'RuntimeError')
        self.assertFalse(v['all_checks_passed'])

    def test_cancel_before_admission_retains_every_initial_entry(self):
        for i in range(12):self.put(str(i))
        event=threading.Event();event.set();v=self.scan(cancelled=event)
        self.assertEqual(len(v['outcomes']),12);self.assertEqual(v['metrics']['submitted'],0)
        self.assertEqual({x['status'] for x in v['outcomes']},{'cancelled_before_admission'})

    def test_cancel_mid_read_joins_active_readers_and_preserves_coverage(self):
        for i in range(20):self.put(f'{i:02}',b'x'*200)
        event=threading.Event()
        def cancel(stage,name):
            if stage=='after_chunk':event.set()
        v=self.scan(cancelled=event,hook=cancel)
        self.assertFalse(v['all_checks_passed']);self.assertEqual(len(v['outcomes']),20)
        self.assertLessEqual(v['metrics']['submitted'],3)

    def test_bounded_concurrent_handles_and_payload_chunks_are_observed(self):
        for i in range(8):self.put(str(i),b'x'*200)
        barrier=threading.Barrier(4);seen=set();lock=threading.Lock()
        def hold(stage,name):
            if stage=='after_chunk':
                with lock:
                    first=name not in seen
                    if first:seen.add(name)
                if first:barrier.wait(timeout=5)
        v=self.scan(limits=replace(self.limits,workers=4,inflight=4),hook=hold)
        self.assertTrue(v['all_checks_passed'])
        self.assertEqual(v['metrics']['peak_handles'],4)
        self.assertEqual(v['metrics']['peak_payload_bytes'],4*64)

    def test_short_reads_are_accumulated_until_eof(self):
        data=b'a'*200;self.put(data=data);original=os.read
        with patch.object(r.os,'read',side_effect=lambda fd,n:original(fd,min(n,7))):v=self.scan()
        self.assertTrue(v['all_checks_passed']);self.assertEqual(v['outcomes'][0]['sha256'],hashlib.sha256(data).hexdigest())

    def test_filename_bytes_roundtrip_without_loss(self):
        root=os.fsencode(self.inputs);name=b'odd-\xff-\n.bin'
        fd=os.open(root+b'/'+name,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        try:os.write(fd,b'bytes')
        finally:os.close(fd)
        v=self.scan();self.assertTrue(v['all_checks_passed']);self.assertEqual(bytes.fromhex(v['outcomes'][0]['name_hex']),name)

    def test_invalid_limit_types_and_ranges_refused(self):
        for field in ('workers','inflight','entries','file_bytes','chunk_bytes'):
            for value in (True,0,-1,10**12,1.5):
                with self.subTest(field=field,value=value),self.assertRaises(ValueError):
                    self.scan(limits=replace(self.limits,**{field:value}))

    def test_root_symlink_and_missing_root_are_refused(self):
        link=self.root/'linked-root';link.symlink_to(self.inputs,target_is_directory=True)
        with self.assertRaises(OSError):r.scan(link,self.limits)
        with self.assertRaises(FileNotFoundError):r.scan(self.root/'missing',self.limits)

    def test_publication_requires_quiescence_and_all_success(self):
        self.put();v=self.scan();prior=[{'last':'good'}]
        self.assertIs(r.select_quiescent_manifest(prior,v),prior)
        current=r.select_quiescent_manifest(prior,v,quiescence_confirmed=True)
        self.assertEqual(len(current),1);self.assertEqual(prior,[{'last':'good'}])
        self.put('large',b'x'*5000);failed=self.scan()
        self.assertIs(r.select_quiescent_manifest(prior,failed,quiescence_confirmed=True),prior)

    def test_final_enumeration_failure_invalidates_other_successes(self):
        self.put();original=r.enumerate_bounded;calls=[]
        def enumerate_or_fail(fd,limit):
            calls.append(True)
            return original(fd,limit) if len(calls)==1 else ([],False,errno.EIO)
        with patch.object(r,'enumerate_bounded',side_effect=enumerate_or_fail):v=self.scan()
        self.assertEqual(v['outcomes'][0]['status'],'observed');self.assertFalse(v['all_checks_passed'])
        self.assertIn('final_enumeration_io_error:5',v['diagnostics'])

    def test_initial_enumeration_error_is_explicit_and_not_admitted(self):
        self.put()
        with patch.object(r,'enumerate_bounded',return_value=([b'a.bin'],False,errno.EIO)):v=self.scan()
        self.assertEqual(v['diagnostics'],['enumeration_io_error:5']);self.assertEqual(v['metrics']['submitted'],0)

    def test_injected_reader_close_failure_retains_complete_failed_result(self):
        self.put();original=os.close;calls=[]
        def close_then_fail(fd):
            regular=stat.S_ISREG(os.fstat(fd).st_mode)
            original(fd)
            if regular:
                calls.append(fd);raise OSError(errno.EIO,'synthetic post-close failure')
        with patch.object(r.os,'close',side_effect=close_then_fail):v=self.scan()
        self.assertEqual(len(calls),1);self.assertFalse(v['all_checks_passed'])
        row=v['outcomes'][0];self.assertEqual(row['status'],'close_error')
        self.assertEqual(row['close_errno'],errno.EIO);self.assertNotIn('sha256',row)

    def test_injected_root_close_failure_invalidates_other_successes(self):
        self.put();original=os.close;calls=[]
        def close_then_fail(fd):
            directory=stat.S_ISDIR(os.fstat(fd).st_mode)
            original(fd)
            if directory:
                calls.append(fd);raise OSError(errno.EIO,'synthetic post-close failure')
        with patch.object(r.os,'close',side_effect=close_then_fail):v=self.scan()
        self.assertEqual(len(calls),1);self.assertEqual(v['outcomes'][0]['status'],'observed')
        self.assertFalse(v['all_checks_passed']);self.assertIn('root_close_io_error:5',v['diagnostics'])


if __name__=='__main__':unittest.main()
