"""Bounded Linux single-directory fingerprinting of trusted generated fixtures.

Not a recursive scanner, hostile-path sandbox, immutable snapshot or installer.
No input writes, cleanup, network access, implicit retries or automatic publication.
"""
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
from dataclasses import dataclass
import hashlib
import os
import stat
import sys
import threading


@dataclass(frozen=True)
class Limits:
    workers: int = 4
    inflight: int = 8
    entries: int = 128
    file_bytes: int = 1_048_576
    chunk_bytes: int = 16_384

    def validate(self):
        for name, ceiling in [('workers',16),('inflight',64),('entries',512),
                              ('file_bytes',16_777_216),('chunk_bytes',65_536)]:
            value=getattr(self,name)
            if type(value) is not int or not 1 <= value <= ceiling:
                raise ValueError('invalid '+name)


class Metrics:
    def __init__(self):
        self.lock=threading.Lock()
        self.active=self.handles=self.payload_bytes=self.read_bytes=0
        self.peak_active=self.peak_handles=self.peak_payload_bytes=0
        self.peak_inflight=self.submitted=0

    def change(self, key, delta):
        with self.lock:
            value=getattr(self,key)+delta
            setattr(self,key,value)
            peak='peak_'+key
            if hasattr(self,peak):setattr(self,peak,max(getattr(self,peak),value))

    def result(self):
        return {key:value for key,value in vars(self).items() if key!='lock'}


def identity(info):
    return (info.st_dev,info.st_ino,info.st_mode,info.st_nlink,info.st_size,
            info.st_mtime_ns,info.st_ctime_ns)


def directory_identity(info):
    return (info.st_dev,info.st_ino,info.st_mtime_ns,info.st_ctime_ns)


def enumerate_bounded(root_fd, limit):
    """Retain at most limit names; inspect at most one extra to detect overflow."""
    names=[]
    try:
        with os.scandir(root_fd) as entries:
            for entry in entries:
                if len(names)==limit:return sorted(names),False,None
                names.append(os.fsencode(entry.name))
    except OSError as error:
        return sorted(names),False,error.errno
    return sorted(names),True,None


def noop(stage, name):
    pass


def inspect_one(root_fd, name, expected, limits, cancelled, metrics, hook):
    result={'name_hex':name.hex(),'status':'error','bytes_read':0}
    fd=None; live=0
    metrics.change('active',1)
    try:
        if cancelled.is_set():
            result['status']='cancelled';return result
        hook('before_open',name)
        # Only an enumerated basename is used. NOFOLLOW covers this last component;
        # the already-open root is trusted. NONBLOCK avoids a FIFO-open wait if
        # the checked regular entry is replaced. It does not secure device opens.
        fd=os.open(name,os.O_RDONLY|os.O_NOFOLLOW|os.O_CLOEXEC|os.O_NONBLOCK,dir_fd=root_fd)
        metrics.change('handles',1)
        opened=os.fstat(fd)
        if not stat.S_ISREG(opened.st_mode) or opened.st_nlink!=1:
            result['status']='unsupported_type_or_links';return result
        if identity(opened)!=expected:
            result['status']='changed_before_read';return result
        if opened.st_size>limits.file_bytes:
            result['status']='oversized';return result
        digest=hashlib.sha256()
        hook('after_open',name)
        while True:
            if cancelled.is_set():
                result['status']='cancelled';return result
            # Drop the previous payload before allocating the next one.
            chunk=None
            request=min(limits.chunk_bytes,limits.file_bytes-result['bytes_read']+1)
            chunk=os.read(fd,request)
            live=len(chunk);metrics.change('payload_bytes',live)
            metrics.change('read_bytes',live);result['bytes_read']+=live
            try:
                if not chunk:break
                if result['bytes_read']>limits.file_bytes:
                    result['status']='grew_over_limit';return result
                digest.update(chunk)
                hook('after_chunk',name)
            finally:
                chunk=None
                metrics.change('payload_bytes',-live);live=0
        hook('after_read',name)
        final=os.fstat(fd)
        named=os.stat(name,dir_fd=root_fd,follow_symlinks=False)
        if (identity(final)!=expected or identity(named)!=expected or
                result['bytes_read']!=opened.st_size):
            result['status']='changed_during_read';return result
        if cancelled.is_set():
            result['status']='cancelled';return result
        result.update(status='observed',sha256=digest.hexdigest(),identity=list(expected))
        return result
    except OSError as error:
        result.update(status='io_error',errno=error.errno)
        return result
    except Exception as error:
        result.update(status='worker_error',error_type=type(error).__name__)
        return result
    finally:
        if live:metrics.change('payload_bytes',-live)
        if fd is not None:
            try:
                os.close(fd)
            except OSError as error:
                # Linux close errors must not be retried: the number may already
                # have been released and reused by another thread.
                result['close_errno']=error.errno
                if result['status']=='observed':result['status']='close_error'
                result.pop('sha256',None)
            finally:
                metrics.change('handles',-1)
        metrics.change('active',-1)


def scan(root, limits=Limits(), *, cancelled=None, hook=noop):
    """Fingerprint a bounded, nonrecursive initial entry set; retain every outcome.

    `all_checks_passed` is not a filesystem snapshot or freshness proof. Only use
    with a trusted root and directory ancestry; concurrent mount/device changes
    or hostile privileged writers are outside this lab's model.
    """
    limits.validate()
    if not sys.platform.startswith('linux'):
        raise NotImplementedError('this descriptor-based lab is Linux-only')
    if cancelled is None:cancelled=threading.Event()
    metrics=Metrics();outcomes={};diagnostics=[];result=None
    fd=os.open(root,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW|os.O_CLOEXEC)
    try:
        initial_directory=directory_identity(os.fstat(fd))
        names,complete,enumeration_error=enumerate_bounded(fd,limits.entries)
        hook('after_enumeration',b'')
        if not complete:
            diagnostics.append('entry_limit_exceeded' if enumeration_error is None
                               else 'enumeration_io_error:'+str(enumeration_error))
            for name in names:outcomes[name]={'name_hex':name.hex(),'status':'not_admitted','bytes_read':0}
        else:
            work=[]
            for name in names:
                try:
                    info=os.stat(name,dir_fd=fd,follow_symlinks=False)
                    if not stat.S_ISREG(info.st_mode) or info.st_nlink!=1:
                        outcomes[name]={'name_hex':name.hex(),'status':'unsupported_type_or_links','bytes_read':0}
                    elif info.st_size>limits.file_bytes:
                        outcomes[name]={'name_hex':name.hex(),'status':'oversized','bytes_read':0}
                    else:work.append((name,identity(info)))
                except OSError as error:
                    outcomes[name]={'name_hex':name.hex(),'status':'stat_error','errno':error.errno,'bytes_read':0}
            hook('after_preflight',b'')
            index=0;pending={}
            with ThreadPoolExecutor(max_workers=limits.workers) as executor:
                while pending or index<len(work):
                    while (index<len(work) and len(pending)<limits.inflight
                           and not cancelled.is_set()):
                        name,expected=work[index];index+=1
                        future=executor.submit(inspect_one,fd,name,expected,limits,cancelled,metrics,hook)
                        pending[future]=name;metrics.submitted+=1
                        metrics.peak_inflight=max(metrics.peak_inflight,len(pending))
                    if cancelled.is_set():
                        for name,_ in work[index:]:
                            outcomes[name]={'name_hex':name.hex(),'status':'cancelled_before_admission','bytes_read':0}
                        index=len(work)
                        for future,name in list(pending.items()):
                            if future.cancel():
                                outcomes[name]={'name_hex':name.hex(),'status':'cancelled_queued','bytes_read':0}
                                del pending[future]
                    if pending:
                        done,_=wait(pending,timeout=0.01,return_when=FIRST_COMPLETED)
                        for future in done:
                            name=pending.pop(future);outcomes[name]=future.result()
            final_names,final_complete,final_error=enumerate_bounded(fd,limits.entries)
            if final_error is not None:diagnostics.append('final_enumeration_io_error:'+str(final_error))
            if not final_complete or final_names!=names:
                diagnostics.append('directory_entries_changed')
            if directory_identity(os.fstat(fd))!=initial_directory:
                diagnostics.append('directory_metadata_changed')
        if cancelled.is_set():diagnostics.append('cancelled')
        rows=[outcomes[name] for name in sorted(outcomes)]
        result={'schema_version':1,'scope':'single_directory_generated_files',
                'limits':vars(limits),'initial_enumeration_complete':complete,
                'all_checks_passed':complete and not diagnostics and all(x['status']=='observed' for x in rows),
                'diagnostics':diagnostics,'outcomes':rows,'metrics':metrics.result(),
                'snapshot_guarantee':False}
        return result
    finally:
        try:
            os.close(fd)
        except OSError as error:
            if result is None:raise
            result['diagnostics'].append('root_close_io_error:'+str(error.errno))
            result['all_checks_passed']=False


def select_quiescent_manifest(previous, result, *, quiescence_confirmed=False):
    """A teaching-only publication gate; caller must establish quiescent inputs.

    Failed/cancelled/incomplete scans retain the caller's exact previous object.
    This is not a durable store, a trust boundary or a concurrent publish API.
    """
    if quiescence_confirmed is not True or result['all_checks_passed'] is not True:
        return previous
    return [{'name_hex':row['name_hex'],'sha256':row['sha256'],'bytes':row['bytes_read']}
            for row in result['outcomes']]
