"""Real Windows Job Object acceptance with disposable official Python children."""
import ctypes,importlib.util,os,pathlib,subprocess,sys,unittest,queue,threading
from unittest.mock import patch
PATH=pathlib.Path(__file__).resolve().parents[1]/'portable_process.py'
spec=importlib.util.spec_from_file_location('owned_process',PATH);owned=importlib.util.module_from_spec(spec);spec.loader.exec_module(owned)
@unittest.skipUnless(sys.platform=='win32','Windows process API acceptance runs on Windows CI')
class OwnedProcess(unittest.TestCase):
 def kernel(self):
  from ctypes import wintypes as w
  k=ctypes.WinDLL('kernel32',use_last_error=True)
  k.OpenProcess.argtypes=[w.DWORD,w.BOOL,w.DWORD];k.OpenProcess.restype=w.HANDLE
  k.WaitForSingleObject.argtypes=[w.HANDLE,w.DWORD];k.WaitForSingleObject.restype=w.DWORD
  k.CloseHandle.argtypes=[w.HANDLE];k.CloseHandle.restype=w.BOOL
  return k
 def test_exit_status_preserved(self):
  self.assertEqual(owned.run_windows([sys.executable,'-c','raise SystemExit(7)']),7)
 def test_creation_failure_is_fail_closed(self):
  with patch.object(owned,'_create_owned',return_value=False):
   self.assertRaises(OSError,owned.run_windows,[sys.executable,'-c','raise SystemExit(0)'])
 def test_resume_failure_terminates_suspended_owned_child(self):
  k=self.kernel();handles=[]
  def created(create,*args):
   result=create(*args)
   if result:handles.append(k.OpenProcess(0x100000,False,args[-1]._obj.pid))
   return result
  try:
   with patch.object(owned,'_create_owned',side_effect=created),patch.object(owned,'_resume_owned',return_value=0xffffffff):
    self.assertRaises(OSError,owned.run_windows,[sys.executable,'-c','import time;time.sleep(30)'])
   self.assertEqual(len(handles),1);self.assertTrue(handles[0]);self.assertEqual(k.WaitForSingleObject(handles[0],10000),0)
  finally:
   for h in handles:
    if h:k.CloseHandle(h)
 def test_forced_supervisor_exit_terminates_child(self):
  code="import importlib.util,sys; s=importlib.util.spec_from_file_location('p',sys.argv[1]);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);raise SystemExit(m.run_windows([sys.executable,'-u','-c','import os,time;print(os.getpid(),flush=True);time.sleep(30)']))"
  p=subprocess.Popen([sys.executable,'-u','-c',code,str(PATH)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
  k=self.kernel();handle=None
  try:
   lines=queue.Queue();threading.Thread(target=lambda:lines.put(p.stdout.readline()),daemon=True).start()
   line=lines.get(timeout=10);self.assertTrue(line,p.stderr.read() if p.poll() is not None else 'No child PID')
   handle=k.OpenProcess(0x100000,False,int(line.strip()));self.assertTrue(handle)
   p.terminate();p.wait(timeout=10);self.assertEqual(k.WaitForSingleObject(handle,10000),0,'Owned child survived parent termination')
  finally:
   if p.poll() is None:p.kill();p.wait(timeout=10)
   if handle:k.CloseHandle(handle)
   p.stdout.close();p.stderr.close()
if __name__=='__main__':unittest.main()
