"""Real idle TCP/preconnect transport tests, using only a synthetic store."""
import concurrent.futures
import socket
import threading
from unittest.mock import patch
import test_bridge as contracts
m=contracts.m

class PreconnectTests(contracts.unittest.TestCase):
 setUp=contracts.Tests.setUp
 tearDown=contracts.Tests.tearDown
 request=contracts.Tests.request
 # Reuse only server setup/request/cleanup, not the parent contract test suite.
 def test_idle_preconnect_cannot_block_reviewed_script(self):
  entered=threading.Event();original=m.Handler.setup
  def setup(handler):original(handler);entered.set()
  with patch.object(m.Handler,'setup',setup):
   idle=socket.create_connection(('127.0.0.1',self.server.server_port),timeout=2)
   try:
    self.assertTrue(entered.wait(2),'idle connection accepted')
    with concurrent.futures.ThreadPoolExecutor() as pool:
     request=pool.submit(self.request,'GET','/workspace-host.js')
     try:status,body,headers=request.result(timeout=2)
     finally:idle.close()
    self.assertEqual(status,200);self.assertIn(b'AthenaWorkspaceHost',body);self.assertEqual(headers['Content-Type'],'text/javascript')
   finally:idle.close()

 def test_handler_capacity_rejects_excess_then_recovers(self):
  self.server.handler_slots=threading.BoundedSemaphore(2)
  accepted=threading.Condition();count=0;original=m.Handler.setup;idle=[]
  def setup(handler):
   nonlocal count
   original(handler)
   with accepted:count+=1;accepted.notify_all()
  with patch.object(m.Handler,'setup',setup):
   try:
    for number in range(2):
     idle.append(socket.create_connection(('127.0.0.1',self.server.server_port),timeout=2))
     with accepted:self.assertTrue(accepted.wait_for(lambda:count==number+1,timeout=2))
    with socket.create_connection(('127.0.0.1',self.server.server_port),timeout=2) as excess:
     try:self.assertEqual(excess.recv(1),b'')
     except ConnectionResetError:pass # Windows may reset a rejected transport.
    self.assertEqual(count,2,'no unbounded third request handler')
   finally:
    for sock in idle:sock.close()
  # Wait for both request handlers to release their permits without polling HTTP.
  self.assertTrue(self.server.handler_slots.acquire(timeout=2));self.assertTrue(self.server.handler_slots.acquire(timeout=2))
  self.server.handler_slots.release();self.server.handler_slots.release()
  self.assertEqual(self.request('GET','/workspace-host.js')[0],200)

 def test_native_cli_serialization_does_not_block_static_scripts(self):
  entered=threading.Event();release=threading.Event();guard=threading.Lock();active=0;maximum=0
  def run(*args,**kwargs):
   nonlocal active,maximum
   with guard:active+=1;maximum=max(maximum,active)
   entered.set();self.assertTrue(release.wait(3))
   with guard:active-=1
   return contracts.subprocess.CompletedProcess(args[0],0,stdout='{}',stderr='')
  with patch.object(m.subprocess,'run',run),concurrent.futures.ThreadPoolExecutor() as pool:
   first=pool.submit(self.server.cli,'status');self.assertTrue(entered.wait(2))
   second=pool.submit(self.server.cli,'status')
   try:self.assertEqual(self.request('GET','/workspace-host.js')[0],200)
   finally:release.set()
   self.assertEqual(first.result(timeout=2),'{}');self.assertEqual(second.result(timeout=2),'{}')
  self.assertEqual(maximum,1)
