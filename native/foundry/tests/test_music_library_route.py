"""Real handler admission/response contract without sockets."""
import importlib.util,pathlib,unittest,subprocess
from email.message import Message
from types import SimpleNamespace
from unittest.mock import Mock
spec=importlib.util.spec_from_file_location('library_bridge',pathlib.Path(__file__).resolve().parents[1]/'bridge.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Tests(unittest.TestCase):
 def handler(self):
  h=m.Handler.__new__(m.Handler);h.path='/__native/soundtracks';h.server=SimpleNamespace(host='127.0.0.1:1',origin='http://127.0.0.1:1',schema=15,cli=Mock(return_value='[]'));h.headers=Message();h.headers['Host']=h.server.host;h.headers['X-Athena-Native']='1';h.reply=Mock();return h
 def test_empty_library_and_read_command(self):
  h=self.handler();h.do_GET();h.server.cli.assert_called_once_with('list-native-soundtracks');h.reply.assert_called_once_with(200,'[]')
 def test_missing_header_foreign_origin_and_query_cannot_dispatch(self):
  for mode in ('missing','origin','query'):
   h=self.handler()
   if mode=='missing':del h.headers['X-Athena-Native']
   elif mode=='origin':h.headers['Origin']='https://other.invalid'
   else:h.path+='?theme=x'
   h.do_GET();h.server.cli.assert_not_called();self.assertIn(h.reply.call_args.args[0],(400,403))
 def test_old_schema_and_native_failures_are_explicit(self):
  h=self.handler();h.server.schema=3;h.do_GET();self.assertEqual(h.reply.call_args.args[0],409);h.server.cli.assert_not_called()
  for error in (ValueError('invalid'),subprocess.TimeoutExpired('fixture',15)):
   h=self.handler();h.server.cli.side_effect=error;h.do_GET();self.assertEqual(h.reply.call_args.args[0],422)
if __name__=='__main__':unittest.main()
