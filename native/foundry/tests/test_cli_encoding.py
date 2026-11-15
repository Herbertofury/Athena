"""UTF-8 wire contract with a real child; no Rust binary/database/socket required."""
import importlib.util,json,pathlib,subprocess,sys,threading,unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('bridge_encoding',pathlib.Path(__file__).resolve().parents[1]/'bridge.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
REAL_RUN=subprocess.run
LABEL='Café · 日本語 · 🦉'
class Tests(unittest.TestCase):
 def bridge(self):
  b=m.Bridge.__new__(m.Bridge);b.binary='fixture';b.database='unused';b.legacy_source='source';b.import_destination='new';b.operation_lock=threading.RLock();return b
 def child(self,code):
  def run(args,**kwargs):
   # Model a Windows non-UTF8 default only when production omitted encoding.
   kwargs.setdefault('encoding','cp1252')
   return REAL_RUN([sys.executable,'-c',code],**kwargs)
  return run
 def test_native_output_preserves_unicode(self):
  wire=json.dumps({'label':LABEL},ensure_ascii=False).encode('utf8')
  with patch.object(m.subprocess,'run',side_effect=self.child('import sys;sys.stdout.buffer.write('+repr(wire)+')')):
   self.assertEqual(json.loads(self.bridge().cli('load-backup'))['label'],LABEL)
 def test_native_input_roundtrips_unicode(self):
  payload=json.dumps({'label':LABEL},ensure_ascii=False)
  code='import sys; data=sys.stdin.buffer.read(); data.decode("utf8"); sys.stdout.buffer.write(data)'
  with patch.object(m.subprocess,'run',side_effect=self.child(code)):
   self.assertEqual(self.bridge().cli('compare-save-backup',payload),payload)
 def test_legacy_inspect_and_import_preserve_unicode(self):
  wire=json.dumps({'label':LABEL},ensure_ascii=False).encode('utf8')
  for command in ('inspect-legacy','import-legacy'):
   with self.subTest(command=command),patch.object(m.subprocess,'run',side_effect=self.child('import sys;sys.stdout.buffer.write('+repr(wire)+')')):
    self.assertEqual(self.bridge().legacy_cli(command)['label'],LABEL)
 def test_invalid_wire_bytes_not_replaced(self):
  for call in (lambda b:b.cli('load-backup'),lambda b:b.legacy_cli('inspect-legacy')):
   with patch.object(m.subprocess,'run',side_effect=self.child('import sys;sys.stdout.buffer.write(bytes([255]))')):
    with self.assertRaises(UnicodeDecodeError):call(self.bridge())
 def test_ascii_still_works(self):
  with patch.object(m.subprocess,'run',side_effect=self.child('print("null")')):
   self.assertEqual(self.bridge().cli('load-backup'),'null')
if __name__=='__main__':unittest.main()
