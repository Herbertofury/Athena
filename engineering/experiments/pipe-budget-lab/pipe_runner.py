"""Linux fixed-helper pipe admission experiment. Not a process sandbox.

No shell, arbitrary executable, recursive process cleanup or target integration.
Caller owns the trusted local helper/interpreter and nonblocking callbacks.
"""
from dataclasses import asdict,dataclass
import hashlib
import json
import math
import os
from pathlib import Path
import selectors
import subprocess
import sys
import time

MODES=frozenset(('success','split_utf8','dual_pressure','stdout_flood','stderr_flood',
                 'nonzero','invalid_utf8','duplicate_json','extra_json','incomplete_json',
                 'false_success','stdin_eof','clean_env','close_stdout','hang','ignore_term',
                 'eof_then_hang','success_then_hang','signal_exit'))
HELPER=Path(__file__).with_name('owned_helper.py').resolve()


@dataclass(frozen=True)
class Limits:
    stdout_bytes:int=4096
    stderr_bytes:int=4096
    total_bytes:int=8192
    chunk_bytes:int=1024
    timeout_seconds:float=2.0
    terminate_seconds:float=0.15
    kill_seconds:float=1.0

    def checked(self):
        for name in ('stdout_bytes','stderr_bytes','total_bytes','chunk_bytes'):
            if type(getattr(self,name)) is not int or getattr(self,name)<=0:raise ValueError('positive integer byte budgets required')
        for name in ('timeout_seconds','terminate_seconds','kill_seconds'):
            value=getattr(self,name)
            if type(value) not in (int,float) or not math.isfinite(value) or value<=0:raise ValueError('positive finite time budgets required')
        return self


class CleanupPending(RuntimeError):
    def __init__(self,receipt,process):
        super().__init__('owned direct child not confirmed reaped; caller retains ownership')
        self.receipt=receipt;self.process=process


def decode_document(raw):
    def unique(pairs):
        result={}
        for key,value in pairs:
            if key in result:raise ValueError('duplicate key')
            result[key]=value
        return result
    def bad_number(value):raise ValueError('nonfinite number')
    value=json.loads(raw.decode('utf-8'),object_pairs_hook=unique,parse_constant=bad_number)
    if type(value) is not dict or set(value)!={'value','complete'} or value['complete'] is not True:
        raise ValueError('invalid document shape')
    if type(value['value']) is not str or not 1<=len(value['value'].encode('utf-8'))<=256:
        raise ValueError('invalid document value')
    return value


def stop_owned(process,limits,receipt):
    """Bounded escalation for this Popen child only. Never signal a saved PID."""
    errors=[]
    if process.poll() is None:
        try:process.terminate();receipt['cleanup_actions'].append('terminate')
        except ProcessLookupError:pass
        except OSError as error:errors.append('terminate:'+type(error).__name__)
        try:process.wait(timeout=limits.terminate_seconds)
        except (subprocess.TimeoutExpired,OSError) as error:
            if isinstance(error,OSError):errors.append('terminate_wait:'+type(error).__name__)
            try:process.kill();receipt['cleanup_actions'].append('kill')
            except ProcessLookupError:pass
            except OSError as error:errors.append('kill:'+type(error).__name__)
            try:process.wait(timeout=limits.kill_seconds)
            except subprocess.TimeoutExpired:errors.append('reap_timeout')
            except OSError as error:errors.append('kill_wait:'+type(error).__name__)
    receipt['returncode']=process.poll();receipt['direct_child_reaped']=receipt['returncode'] is not None
    receipt['cleanup_errors'].extend(errors)


def run(mode,limits=Limits(),*,cancel=lambda:False,on_chunk=lambda stream,data:None):
    limits.checked()
    if type(mode) is not str or mode not in MODES:raise ValueError('unknown fixed fixture mode')
    if sys.platform!='linux':raise RuntimeError('this experiment is Linux-only')
    start=time.monotonic();deadline=start+limits.timeout_seconds
    result={'schema_version':1,'mode':mode,'limits':asdict(limits),'status':'failed','accepted':False,
            'reason':None,'controller_error':None,'pid':None,'returncode':None,
            'direct_child_reaped':False,'cleanup_actions':[],'cleanup_errors':[],
            'streams':{name:{'eof':False,'bytes_observed':0,'hex':'','sha256':None} for name in ('stdout','stderr')},
            'total_bytes_observed':0,'max_read_chunk':0,'capture_complete':False,
            'document':None,'helper_sha256':hashlib.sha256(HELPER.read_bytes()).hexdigest()}
    buffers={name:bytearray() for name in result['streams']};process=None;selector=None
    try:
        if cancel():result['reason']='cancelled_before_launch';return result
        # Absolute executable/script and isolated interpreter. No inherited secret
        # environment, input stream, shell, preexec callback or arbitrary command.
        process=subprocess.Popen([sys.executable,'-I','-B',str(HELPER),mode],
                                 stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,
                                 bufsize=0,close_fds=True,shell=False,cwd=HELPER.parent,
                                 env={'LANG':'C.UTF-8'})
        result['pid']=process.pid;selector=selectors.DefaultSelector()
        for name in ('stdout','stderr'):
            stream=getattr(process,name);os.set_blocking(stream.fileno(),False)
            selector.register(stream,selectors.EVENT_READ,name)
        while True:
            if cancel():result['reason']='cancelled';break
            remaining=deadline-time.monotonic()
            if remaining<=0:result['reason']='deadline';break
            if not selector.get_map():
                if process.poll() is not None:break
                time.sleep(min(0.01,remaining));continue
            for key,_ in selector.select(min(0.02,remaining)):
                name=key.data;stream=result['streams'][name]
                cap=min(limits.chunk_bytes,getattr(limits,name+'_bytes')-stream['bytes_observed']+1,
                        limits.total_bytes-result['total_bytes_observed']+1)
                try:data=os.read(key.fd,cap)
                except BlockingIOError:continue
                if not data:
                    selector.unregister(key.fileobj);stream['eof']=True;continue
                buffers[name].extend(data);stream['bytes_observed']+=len(data)
                result['total_bytes_observed']+=len(data);result['max_read_chunk']=max(result['max_read_chunk'],len(data))
                if stream['bytes_observed']>getattr(limits,name+'_bytes'):
                    result['reason']=name+'_budget';break
                if result['total_bytes_observed']>limits.total_bytes:
                    result['reason']='total_budget';break
                on_chunk(name,data)
            if result['reason'] is not None:break
        result['capture_complete']=all(stream['eof'] for stream in result['streams'].values())
        if result['reason'] is None:
            result['returncode']=process.poll()
            if result['returncode']!=0:result['reason']='nonzero_exit'
            else:
                try:result['document']=decode_document(bytes(buffers['stdout']))
                except (ValueError,UnicodeError,RecursionError):result['reason']='invalid_document'
    except BaseException as error:
        result['reason']='controller_error';result['controller_error']=type(error).__name__
    finally:
        if selector is not None:
            try:selector.close()
            except BaseException as error:result['cleanup_errors'].append('selector_close:'+type(error).__name__)
        if process is not None:
            for name in ('stdout','stderr'):
                stream=getattr(process,name)
                if stream is not None:
                    try:stream.close()
                    except BaseException as error:result['cleanup_errors'].append(name+'_close:'+type(error).__name__)
            try:stop_owned(process,limits,result)
            except BaseException as error:
                result['cleanup_errors'].append('child_cleanup:'+type(error).__name__)
                result['returncode']=process.returncode
                result['direct_child_reaped']=process.returncode is not None
        for name,buffer in buffers.items():
            result['streams'][name]['hex']=buffer.hex();result['streams'][name]['sha256']=hashlib.sha256(buffer).hexdigest()
        result['elapsed_seconds']=time.monotonic()-start
        if process is not None and not result['direct_child_reaped']:
            result['reason']='cleanup_pending';result['status']='cleanup_pending'
            raise CleanupPending(result,process)
        if result['cleanup_errors'] and result['reason'] is None:result['reason']='cleanup_error'
        result['accepted']=result['reason'] is None and result['capture_complete'] and result['direct_child_reaped'] and not result['cleanup_errors']
        result['status']='accepted' if result['accepted'] else 'failed'
    return result
