"""Windows owned-process lifetime. No detached service, credentials or persistent setup."""
def _create_owned(create,*args):
    return create(*args)
def _resume_owned(resume,thread):
    return resume(thread)
def run_windows(argv):
    import ctypes, subprocess
    from ctypes import wintypes as w
    k=ctypes.WinDLL('kernel32',use_last_error=True)
    class Basic(ctypes.Structure):
        _fields_=[('process_time',ctypes.c_longlong),('job_time',ctypes.c_longlong),('flags',w.DWORD),('min_work',ctypes.c_size_t),('max_work',ctypes.c_size_t),('active',w.DWORD),('affinity',ctypes.c_size_t),('priority',w.DWORD),('scheduling',w.DWORD)]
    class IO(ctypes.Structure):
        _fields_=[(name,ctypes.c_ulonglong) for name in ('read_ops','write_ops','other_ops','read_bytes','write_bytes','other_bytes')]
    class Limits(ctypes.Structure):
        _fields_=[('basic',Basic),('io',IO),('process_memory',ctypes.c_size_t),('job_memory',ctypes.c_size_t),('peak_process',ctypes.c_size_t),('peak_job',ctypes.c_size_t)]
    class Startup(ctypes.Structure):
        _fields_=[('cb',w.DWORD),('reserved',w.LPWSTR),('desktop',w.LPWSTR),('title',w.LPWSTR)]+[(name,w.DWORD) for name in ('x','y','xsize','ysize','xchars','ychars','fill','flags')]+[('show',w.WORD),('reserved_bytes',w.WORD),('reserved_data',ctypes.POINTER(ctypes.c_byte)),('stdin',w.HANDLE),('stdout',w.HANDLE),('stderr',w.HANDLE)]
    class StartupEx(ctypes.Structure):
        _fields_=[('startup',Startup),('attributes',ctypes.c_void_p)]
    class Process(ctypes.Structure):
        _fields_=[('process',w.HANDLE),('thread',w.HANDLE),('pid',w.DWORD),('tid',w.DWORD)]
    def api(name,args,result):
        f=getattr(k,name);f.argtypes=args;f.restype=result;return f
    create_job=api('CreateJobObjectW',[ctypes.c_void_p,w.LPCWSTR],w.HANDLE)
    set_job=api('SetInformationJobObject',[w.HANDLE,ctypes.c_int,ctypes.c_void_p,w.DWORD],w.BOOL)
    create=api('CreateProcessW',[w.LPCWSTR,w.LPWSTR,ctypes.c_void_p,ctypes.c_void_p,w.BOOL,w.DWORD,ctypes.c_void_p,w.LPCWSTR,ctypes.c_void_p,ctypes.POINTER(Process)],w.BOOL)
    initialize=api('InitializeProcThreadAttributeList',[ctypes.c_void_p,w.DWORD,w.DWORD,ctypes.POINTER(ctypes.c_size_t)],w.BOOL)
    update=api('UpdateProcThreadAttribute',[ctypes.c_void_p,w.DWORD,ctypes.c_size_t,ctypes.c_void_p,ctypes.c_size_t,ctypes.c_void_p,ctypes.c_void_p],w.BOOL)
    delete=api('DeleteProcThreadAttributeList',[ctypes.c_void_p],None)
    resume=api('ResumeThread',[w.HANDLE],w.DWORD)
    wait=api('WaitForSingleObject',[w.HANDLE,w.DWORD],w.DWORD)
    terminate_job=api('TerminateJobObject',[w.HANDLE,w.UINT],w.BOOL)
    close=api('CloseHandle',[w.HANDLE],w.BOOL)
    exit_code=api('GetExitCodeProcess',[w.HANDLE,ctypes.POINTER(w.DWORD)],w.BOOL)
    get_std=api('GetStdHandle',[w.DWORD],w.HANDLE)
    inherit=api('SetHandleInformation',[w.HANDLE,w.DWORD,w.DWORD],w.BOOL)
    def checked(ok):
        if not ok:raise ctypes.WinError(ctypes.get_last_error())
    job=create_job(None,None);checked(job)
    info=Process();finished=False;attributes=None;initialized=False
    try:
        limits=Limits();limits.basic.flags=0x2000 # JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
        checked(set_job(job,9,ctypes.byref(limits),ctypes.sizeof(limits)))
        size=ctypes.c_size_t()
        initialize(None,1,0,ctypes.byref(size))
        if not size.value:raise ctypes.WinError(ctypes.get_last_error())
        attributes=ctypes.create_string_buffer(size.value)
        checked(initialize(attributes,1,0,ctypes.byref(size)));initialized=True
        jobs=(w.HANDLE*1)(job)
        # Supported Windows10+ creation-time job assignment, no breakaway/legacy fallback.
        checked(update(attributes,0,0x2000D,ctypes.byref(jobs),ctypes.sizeof(jobs),None,None))
        startup_ex=StartupEx();startup_ex.attributes=ctypes.cast(attributes,ctypes.c_void_p)
        startup=startup_ex.startup;startup.cb=ctypes.sizeof(startup_ex);startup.flags=0x100
        for name,number in (('stdin',-10),('stdout',-11),('stderr',-12)):
            handle=get_std(number & 0xffffffff);setattr(startup,name,handle)
            if handle and handle!=ctypes.c_void_p(-1).value:checked(inherit(handle,1,1))
        command=ctypes.create_unicode_buffer(subprocess.list2cmdline(argv))
        # The job list is supplied at creation, avoiding a separate assignment
        # window. Unsupported hosts fail closed; arbitrary OS-failure proof is not claimed.
        checked(_create_owned(create,argv[0],command,None,None,True,0x80004,None,None,ctypes.byref(startup_ex),ctypes.byref(info)))
        if _resume_owned(resume,info.thread)==0xffffffff:raise ctypes.WinError(ctypes.get_last_error())
        while True:
            status=wait(info.process,100)
            if status==0:break
            if status!=258:raise ctypes.WinError(ctypes.get_last_error())
        finished=True;code=w.DWORD();checked(exit_code(info.process,ctypes.byref(code)));return code.value
    except KeyboardInterrupt:
        return 130
    finally:
        cleanup_failed=False
        if info.process and not finished:
            terminate_job(job,1)
            # Closing our only job handle is also fail-safe for termination errors.
            close(job);job=None
            cleanup_failed=wait(info.process,10000)!=0
        if info.thread:close(info.thread)
        if info.process:close(info.process)
        if job:close(job)
        if initialized:delete(attributes)
        if cleanup_failed:raise RuntimeError('Owned child termination not verified')
