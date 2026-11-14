"""Deterministic rejection transport regression; no native binary required."""
import importlib.util, pathlib, io, unittest
from email.message import Message
from types import SimpleNamespace
from unittest.mock import Mock, patch
spec=importlib.util.spec_from_file_location('bridge_drain',pathlib.Path(__file__).resolve().parents[1]/'bridge.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Tests(unittest.TestCase):
 def handler(self, body=b'private rejected bytes', length=None):
  h=m.Handler.__new__(m.Handler);h.path='/__native/backup';h.server=SimpleNamespace(host='127.0.0.1:1',origin='http://127.0.0.1:1')
  h.headers=Message();h.headers['Host']=h.server.host;h.headers['Origin']='';h.headers['Content-Length']=str(len(body) if length is None else length)
  h.rfile=io.BufferedReader(io.BytesIO(body));h.connection=Mock();h.connection.gettimeout.return_value=5
  h.reply=Mock();return h
 def test_origin_rejection_drains_before_reply_without_dispatch(self):
  h=self.handler();h.reply.side_effect=lambda code:self.assertEqual(h.rfile.read(),b'')
  h.do_POST();h.reply.assert_called_once_with(403);self.assertTrue(h.close_connection);h.connection.settimeout.assert_called_with(5)
 def test_ambiguous_and_oversized_framing_never_drains(self):
  for mode in ['duplicate','chunked','oversized','negative','huge']:
   with self.subTest(mode=mode):
    h=self.handler()
    if mode=='duplicate':h.headers['Content-Length']='21'
    elif mode=='chunked':h.headers['Transfer-Encoding']='chunked'
    else:h.headers.replace_header('Content-Length',{'oversized':str(m.MAX_BODY+1),'negative':'-1','huge':'9'*5000}[mode])
    h.do_POST();h.reply.assert_called_once_with(403);self.assertEqual(h.rfile.read(),b'private rejected bytes')
 def test_stalled_peer_is_bounded_and_still_rejected(self):
  h=self.handler();h.rfile=Mock();h.rfile.read1.side_effect=TimeoutError
  h.do_POST();h.reply.assert_called_once_with(403);self.assertLessEqual(h.connection.settimeout.call_args_list[0].args[0],0.25);h.connection.settimeout.assert_called_with(5)
 def test_drain_reads_chunks_and_stops_at_deadline(self):
  h=self.handler(length=200000);h.rfile=Mock();h.rfile.read1.return_value=b'x'
  with patch.object(m.time,'monotonic',side_effect=[0,0.1,0.3]):h.do_POST()
  h.rfile.read1.assert_called_once_with(65536);h.reply.assert_called_once_with(403)
if __name__=='__main__':unittest.main()
