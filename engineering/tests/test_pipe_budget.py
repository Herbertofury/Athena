"""Real fixed child processes plus explicit controller failure injections."""
from dataclasses import replace
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

LAB=Path(__file__).resolve().parents[1]/'experiments/pipe-budget-lab'
spec=importlib.util.spec_from_file_location('pipe_runner',LAB/'pipe_runner.py')
r=importlib.util.module_from_spec(spec);sys.modules[spec.name]=r;spec.loader.exec_module(r)
SUCCESS=b'{"value":"caf\xc3\xa9","complete":true}\n'


@unittest.skipUnless(sys.platform=='linux','Linux pipe fixture only')
class PipeBudgetTests(unittest.TestCase):
    def setUp(self):
        self.root=Path(tempfile.mkdtemp(prefix='athena-synthetic-pipes-'));self.results=[]

    def tearDown(self):
        (self.root/'receipt.json').write_text(json.dumps({'test':self.id(),'results':self.results},indent=2)+'\n')

    def run_mode(self,mode,**kw):
        result=r.run(mode,**kw);self.results.append(result)
        if result['pid'] is not None:
            self.assertTrue(result['direct_child_reaped'])
            with self.assertRaises(ChildProcessError):os.waitpid(result['pid'],os.WNOHANG)
        for stream in result['streams'].values():
            raw=bytes.fromhex(stream['hex']);self.assertEqual(len(raw),stream['bytes_observed']);self.assertEqual(hashlib.sha256(raw).hexdigest(),stream['sha256'])
        self.assertEqual(sum(s['bytes_observed'] for s in result['streams'].values()),result['total_bytes_observed'])
        return result

    def test_success_requires_exit_eof_and_valid_document(self):
        x=self.run_mode('success');self.assertTrue(x['accepted']);self.assertEqual(x['returncode'],0);self.assertTrue(x['capture_complete']);self.assertEqual(bytes.fromhex(x['streams']['stdout']['hex']),SUCCESS);self.assertEqual(x['document'],{'value':'caf\u00e9','complete':True})

    def test_split_utf8_is_not_decoded_per_chunk(self):
        x=self.run_mode('split_utf8',limits=r.Limits(chunk_bytes=1));self.assertTrue(x['accepted']);self.assertEqual(x['max_read_chunk'],1);self.assertEqual(x['document']['value'],'caf\u00e9')

    def test_both_pipe_pressure_drained_without_wait_first(self):
        n=262144;x=self.run_mode('dual_pressure',limits=r.Limits(stdout_bytes=n,stderr_bytes=n,total_bytes=2*n,timeout_seconds=5))
        self.assertEqual(x['reason'],'invalid_document');self.assertTrue(x['capture_complete']);self.assertEqual(x['returncode'],0)
        self.assertEqual(bytes.fromhex(x['streams']['stdout']['hex']),b'O'*n);self.assertEqual(bytes.fromhex(x['streams']['stderr']['hex']),b'E'*n)

    def test_stdout_budget_stops_at_one_sentinel(self):
        x=self.run_mode('stdout_flood',limits=r.Limits(stdout_bytes=32,chunk_bytes=7));self.assertEqual(x['reason'],'stdout_budget');self.assertEqual(x['streams']['stdout']['bytes_observed'],33);self.assertLessEqual(x['max_read_chunk'],7);self.assertFalse(x['capture_complete'])

    def test_stderr_budget_stops_at_one_sentinel(self):
        x=self.run_mode('stderr_flood',limits=r.Limits(stderr_bytes=32,chunk_bytes=7));self.assertEqual(x['reason'],'stderr_budget');self.assertEqual(x['streams']['stderr']['bytes_observed'],33)

    def test_aggregate_budget_prevents_two_separate_caps_adding_up(self):
        x=self.run_mode('dual_pressure',limits=r.Limits(stdout_bytes=100,stderr_bytes=100,total_bytes=31,chunk_bytes=7));self.assertEqual(x['reason'],'total_budget');self.assertEqual(x['total_bytes_observed'],32)

    def test_exact_limits_accept_and_eof_needs_no_extra_byte(self):
        n=len(SUCCESS);err=len(b'fixture diagnostic\n');x=self.run_mode('success',limits=r.Limits(stdout_bytes=n,stderr_bytes=err,total_bytes=n+err,chunk_bytes=7));self.assertTrue(x['accepted']);self.assertEqual(x['total_bytes_observed'],n+err)

    def test_valid_document_with_nonzero_exit_is_not_accepted(self):
        x=self.run_mode('nonzero');self.assertEqual(x['reason'],'nonzero_exit');self.assertEqual(x['returncode'],7);self.assertIsNone(x['document']);self.assertEqual(bytes.fromhex(x['streams']['stdout']['hex']),SUCCESS)

    def test_signal_exit_is_retained(self):
        x=self.run_mode('signal_exit');self.assertEqual(x['reason'],'nonzero_exit');self.assertEqual(x['returncode'],-signal.SIGTERM)

    def test_invalid_utf8_is_explicit_not_replacement_decoded(self):self.assertEqual(self.run_mode('invalid_utf8')['reason'],'invalid_document')
    def test_duplicate_json_is_not_last_key_wins(self):self.assertEqual(self.run_mode('duplicate_json')['reason'],'invalid_document')
    def test_multiple_json_documents_are_not_first_record_success(self):self.assertEqual(self.run_mode('extra_json')['reason'],'invalid_document')
    def test_partial_json_is_not_success(self):self.assertEqual(self.run_mode('incomplete_json')['reason'],'invalid_document')
    def test_false_complete_flag_is_not_success(self):self.assertEqual(self.run_mode('false_success')['reason'],'invalid_document')
    def test_closed_stdout_does_not_discard_stderr(self):
        x=self.run_mode('close_stdout');self.assertEqual(x['reason'],'invalid_document');self.assertEqual(bytes.fromhex(x['streams']['stderr']['hex']),b'only diagnostic\n');self.assertTrue(x['capture_complete'])

    def test_stdin_is_devnull_not_inherited_interactive_input(self):self.assertTrue(self.run_mode('stdin_eof')['accepted'])
    def test_parent_environment_is_not_inherited(self):
        with patch.dict(os.environ,{'ATHENA_LAB_SENTINEL':'not-for-child'}):self.assertTrue(self.run_mode('clean_env')['accepted'])

    def test_cancel_before_launch_spawns_nothing(self):
        with patch.object(r.subprocess,'Popen',side_effect=AssertionError('must not launch')):x=self.run_mode('success',cancel=lambda:True)
        self.assertEqual(x['reason'],'cancelled_before_launch');self.assertIsNone(x['pid'])

    def test_cancel_after_ready_terminates_and_reaps_direct_child(self):
        ready=False
        def observe(name,data):
            nonlocal ready
            if name=='stderr':ready=True
        x=self.run_mode('hang',cancel=lambda:ready,on_chunk=observe)
        self.assertEqual(x['reason'],'cancelled');self.assertEqual(x['cleanup_actions'],['terminate']);self.assertEqual(x['returncode'],-signal.SIGTERM)

    def test_ignored_terminate_escalates_to_kill_and_reaps(self):
        ready=False
        def observe(name,data):
            nonlocal ready
            if name=='stderr':ready=True
        x=self.run_mode('ignore_term',limits=r.Limits(terminate_seconds=0.05),cancel=lambda:ready,on_chunk=observe)
        self.assertEqual(x['reason'],'cancelled');self.assertEqual(x['cleanup_actions'],['terminate','kill']);self.assertEqual(x['returncode'],-signal.SIGKILL)

    def test_eof_is_not_process_completion(self):
        x=self.run_mode('eof_then_hang',limits=r.Limits(timeout_seconds=0.5))
        self.assertEqual(x['reason'],'deadline');self.assertTrue(x['capture_complete']);self.assertFalse(x['accepted']);self.assertIn('terminate',x['cleanup_actions'])

    def test_success_bytes_before_hang_are_not_published(self):
        x=self.run_mode('success_then_hang',limits=r.Limits(timeout_seconds=0.5))
        self.assertEqual(x['reason'],'deadline');self.assertEqual(bytes.fromhex(x['streams']['stdout']['hex']),SUCCESS);self.assertIsNone(x['document'])

    def test_observer_error_still_cleans_up_and_retains_prefix(self):
        def fail(name,data):raise OSError('injected observer failure')
        x=self.run_mode('hang',on_chunk=fail);self.assertEqual(x['reason'],'controller_error');self.assertEqual(x['controller_error'],'OSError');self.assertGreater(x['total_bytes_observed'],0)

    def test_launch_error_is_recorded_without_claiming_a_child(self):
        with patch.object(r.subprocess,'Popen',side_effect=OSError('injected launch error')):x=self.run_mode('success')
        self.assertEqual(x['reason'],'controller_error');self.assertIsNone(x['pid']);self.assertFalse(x['direct_child_reaped'])

    def test_no_arbitrary_command_or_invalid_limits(self):
        for mode in ('/bin/sh','success; touch x',['success']):
            with self.assertRaises(ValueError):r.run(mode)
        for limits in (r.Limits(stdout_bytes=True),r.Limits(total_bytes=0),r.Limits(timeout_seconds=float('nan')),r.Limits(kill_seconds=False)):
            with self.assertRaises(ValueError):r.run('success',limits)

    def test_repeated_success_does_not_leak_parent_descriptors(self):
        before=len(os.listdir('/proc/self/fd'))
        for _ in range(8):self.assertTrue(self.run_mode('success')['accepted'])
        self.assertEqual(len(os.listdir('/proc/self/fd')),before)

    def test_stream_close_error_does_not_skip_child_cleanup(self):
        real=r.subprocess.Popen
        class CloseFault:
            def __init__(self,stream):self.stream=stream
            def __getattr__(self,name):return getattr(self.stream,name)
            def close(self):self.stream.close();raise OSError('injected close failure')
        def launch(*a,**kw):
            child=real(*a,**kw);child.stdout=CloseFault(child.stdout);return child
        with patch.object(r.subprocess,'Popen',launch):
            x=self.run_mode('hang',limits=r.Limits(timeout_seconds=0.15))
        self.assertFalse(x['accepted']);self.assertIn('stdout_close:OSError',x['cleanup_errors']);self.assertTrue(x['direct_child_reaped'])

    def test_selector_close_error_does_not_skip_child_cleanup(self):
        real=r.selectors.DefaultSelector
        class SelectorFault:
            def __init__(self):self.selector=real()
            def __getattr__(self,name):return getattr(self.selector,name)
            def close(self):self.selector.close();raise OSError('injected selector close failure')
        with patch.object(r.selectors,'DefaultSelector',SelectorFault):
            x=self.run_mode('hang',limits=r.Limits(timeout_seconds=0.15))
        self.assertFalse(x['accepted']);self.assertIn('selector_close:OSError',x['cleanup_errors']);self.assertTrue(x['direct_child_reaped'])

    def test_first_wait_error_still_attempts_bounded_kill_reap(self):
        real=r.subprocess.Popen
        def launch(*a,**kw):
            child=real(*a,**kw);wait=child.wait;calls=0
            def one_error(*a,**kw):
                nonlocal calls
                calls+=1
                if calls==1:raise OSError('injected wait failure')
                return wait(*a,**kw)
            child.wait=one_error;return child
        with patch.object(r.subprocess,'Popen',launch):x=self.run_mode('hang',limits=r.Limits(timeout_seconds=0.15))
        self.assertTrue(x['direct_child_reaped']);self.assertIn('terminate_wait:OSError',x['cleanup_errors']);self.assertFalse(x['accepted'])

    def test_demo_retains_cleanup_pending_receipt_and_same_exception(self):
        sys.path.insert(0,str(LAB))
        spec=importlib.util.spec_from_file_location('pipe_demo',LAB/'run_demo.py')
        demo=importlib.util.module_from_spec(spec);spec.loader.exec_module(demo)
        receipt=self.run_mode('success');receipt.update(accepted=False,status='cleanup_pending',reason='cleanup_pending',direct_child_reaped=False)
        owner=object();pending=r.CleanupPending(receipt,owner)
        output=self.root/'pending-demo'
        with patch.object(r,'run',side_effect=pending),self.assertRaises(r.CleanupPending) as error:demo.run(output)
        self.assertIs(error.exception,pending);self.assertIs(error.exception.process,owner)
        saved=json.loads((output/'result.json').read_text());self.assertFalse(saved['passed']);self.assertFalse(saved['cases'][0]['passed']);self.assertEqual(saved['cases'][0]['result']['status'],'cleanup_pending')

    def test_pending_cleanup_carries_ownership_and_never_accepts(self):
        class FakeChild:
            pid=123;returncode=None
            stdout=io.BytesIO();stderr=io.BytesIO()
            def poll(self):return None
            def terminate(self):pass
            def kill(self):pass
            def wait(self,timeout):raise subprocess.TimeoutExpired('owned fake',timeout)
        child=FakeChild()
        with patch.object(r.subprocess,'Popen',return_value=child),self.assertRaises(r.CleanupPending) as error:r.run('success')
        x=error.exception.receipt;self.results.append(x);self.assertFalse(x['accepted']);self.assertEqual(x['status'],'cleanup_pending');self.assertIs(error.exception.process,child)


if __name__=='__main__':unittest.main()
