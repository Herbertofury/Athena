"""Actual native HTTP handler admission with in-memory transport, no sockets/CLI."""
import importlib.util, pathlib, io, unittest
from email.message import Message
from types import SimpleNamespace
from unittest.mock import Mock
spec=importlib.util.spec_from_file_location('bridge_framing',pathlib.Path(__file__).resolve().parents[1]/'bridge.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Tests(unittest.TestCase):
 def handler(self):
  h=m.Handler.__new__(m.Handler);h.path='/__native/backup'
  h.server=SimpleNamespace(host='127.0.0.1:1',origin='http://127.0.0.1:1',schema=15,cli=Mock(return_value='{"saved":true,"version":"v1"}'))
  h.headers=Message()
  for k,v in [('Host',h.server.host),('Origin',h.server.origin),('X-Athena-Native','1'),('Content-Type','application/json'),('Content-Length','2'),('If-Match','"empty"')]:h.headers[k]=v
  h.rfile=io.BufferedReader(io.BytesIO(b'{}'));h.connection=Mock();h.connection.gettimeout.return_value=5;h.reply=Mock();return h
 def rejected(self,h,code):
  h.do_POST();self.assertEqual(h.reply.call_args.args[0],code);h.server.cli.assert_not_called();self.assertTrue(h.close_connection)
 def test_single_valid_request_still_dispatches_once(self):
  h=self.handler();h.do_POST();h.server.cli.assert_called_once();self.assertEqual(h.reply.call_args.args[0],200)
 def test_duplicate_content_type_is_ambiguous(self):
  for value in ['application/json','text/plain','']:
   with self.subTest(value=value):
    h=self.handler();h.headers['Content-Type']=value;self.rejected(h,415)
 def test_any_transfer_encoding_header_rejected(self):
  for value in ['', 'chunked','identity']:
   with self.subTest(value=value):
    h=self.handler();h.headers['Transfer-Encoding']=value;self.rejected(h,415)
 def test_ascii_bounded_content_length(self):
  for value in ['²','１２','2.0','-1','+2',' 2','2 ','9'*5000]:
   with self.subTest(value=value[:20]):
    h=self.handler();h.headers.replace_header('Content-Length',value);self.rejected(h,411)
 def test_duplicate_and_missing_length_rejected(self):
  h=self.handler();h.headers['Content-Length']='2';self.rejected(h,411)
  h=self.handler();del h.headers['Content-Length'];self.rejected(h,411)
 def test_supported_zero_padded_length_and_oversized_body(self):
  h=self.handler();h.headers.replace_header('Content-Length','000002');h.do_POST();h.server.cli.assert_called_once();self.assertEqual(h.reply.call_args.args[0],200)
  h=self.handler();h.headers.replace_header('Content-Length',str(m.MAX_BODY+1));self.rejected(h,413)
if __name__=='__main__':unittest.main()
