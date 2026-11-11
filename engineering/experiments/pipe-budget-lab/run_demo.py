"""Owned subprocess cases; retain exact captures with lossless packing if large."""
import base64
from datetime import datetime,timezone
import hashlib
import json
from pathlib import Path
import platform
import subprocess
import sys
import traceback
import zlib

import pipe_runner as lab


def packed(receipt):
    # Lossless evidence encoding only, not a change to capture admission.
    for stream in receipt['streams'].values():
        if len(stream['hex'])>8192:
            raw=bytes.fromhex(stream.pop('hex'))
            encoded=zlib.compress(raw)
            if zlib.decompress(encoded)!=raw:raise RuntimeError('evidence round trip')
            stream['bytes_zlib_base64']=base64.b64encode(encoded).decode()
    return receipt


def run(output):
    output=Path(output);output.mkdir(parents=True,exist_ok=False)
    report={'schema_version':1,'evidence':'measured_owned_fixed_child_processes',
            'checked_at':datetime.now(timezone.utc).isoformat(),
            'environment':{'python':platform.python_version(),'os':platform.system(),'machine':platform.machine(),
                           'selector':lab.selectors.DefaultSelector.__name__},
            'source_sha256':{name:hashlib.sha256(Path(__file__).with_name(name).read_bytes()).hexdigest()
                             for name in ('pipe_runner.py','owned_helper.py','run_demo.py')},
            'cases':[],'passed':False,
            'not_established':['subprocess tree cleanup','security sandbox','child CPU/RSS or filesystem quota',
                               'hard real-time deadline','Windows/macOS execution','target adoption or performance improvement']}
    def case(mode,expected,**kw):
        row={'mode':mode,'expected_reason':expected,'passed':False}
        report['cases'].append(row)
        try:receipt=lab.run(mode,**kw)
        except lab.CleanupPending as error:
            row['result']=packed(error.receipt)
            # Re-raise the same exception: its caller still owns error.process.
            raise
        row['result']=packed(receipt)
        row['passed']=receipt['reason']==expected and receipt['direct_child_reaped'] and receipt['accepted']==(expected is None)
        if not row['passed']:raise RuntimeError('unexpected '+mode+' outcome')
    try:
        case('success',None)
        case('split_utf8',None,limits=lab.Limits(chunk_bytes=1))
        case('dual_pressure','invalid_document',limits=lab.Limits(stdout_bytes=262144,stderr_bytes=262144,total_bytes=524288,timeout_seconds=5))
        case('stdout_flood','stdout_budget',limits=lab.Limits(stdout_bytes=32,chunk_bytes=7))
        case('stderr_flood','stderr_budget',limits=lab.Limits(stderr_bytes=32,chunk_bytes=7))
        case('nonzero','nonzero_exit')
        case('duplicate_json','invalid_document')
        case('eof_then_hang','deadline',limits=lab.Limits(timeout_seconds=0.5))
        case('success_then_hang','deadline',limits=lab.Limits(timeout_seconds=0.5))
        ready=False
        def observe(name,data):
            nonlocal ready
            if name=='stderr':ready=True
        case('ignore_term','cancelled',limits=lab.Limits(terminate_seconds=0.05),cancel=lambda:ready,on_chunk=observe)
        # A finite 1 MiB generated control, not unbounded hostile command output.
        result=subprocess.run([sys.executable,'-I','-B',str(lab.HELPER),'stdout_flood'],stdin=subprocess.DEVNULL,
                              capture_output=True,timeout=5,env={'LANG':'C.UTF-8'},cwd=lab.HELPER.parent)
        control={'mode':'post_capture_size_check','returncode':result.returncode,'intended_stdout_budget':32,
                 'bytes_captured_before_check':len(result.stdout),'exceeded_budget':len(result.stdout)>32,
                 'stdout_sha256':hashlib.sha256(result.stdout).hexdigest(),
                 'stdout_zlib_base64':base64.b64encode(zlib.compress(result.stdout)).decode(),
                 'stderr_hex':result.stderr.hex()}
        report['post_capture_control']=control
        if result.returncode!=0 or len(result.stdout)!=1048576:raise RuntimeError('control failed')
        report['passed']=True
    except BaseException:
        report['traceback']=traceback.format_exc();raise
    finally:(output/'result.json').write_text(json.dumps(report,indent=2)+'\n')
    return report


if __name__=='__main__':
    if len(sys.argv)!=2:raise SystemExit('usage: python3 run_demo.py NEW_OUTPUT_DIRECTORY')
    report=run(sys.argv[1]);print(json.dumps({'passed':report['passed'],'cases':len(report['cases'])}))
