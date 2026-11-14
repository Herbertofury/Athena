import copy,json,os,tempfile,unittest,subprocess,sys
from pathlib import Path
from unittest.mock import patch
import capsule as c
class Recovery(unittest.TestCase):
 def test_all_keys_and_exact_strings(self):
  data={k:' { "unknown": [1, 1.00], "pixel": -70 }\n' for k in c.KEYS}
  data['ff-visual-quality']='ultra';data['ff-world-layout']='corrupt { keep me';data['ff-world-mascots']='\ud800🦊\x00'
  self.assertEqual(c.unpack(c.parse(json.dumps(c.pack(data)))),data)
 def test_premium_and_music_values_preserved_without_provider_credentials(self):
  data={'ff.premium-theme.v1':'frutiger-aero','ff.music-hub.v2':' { "version": 2, "route": "home", "mappings": {} }\n'}
  self.assertEqual(c.unpack(c.pack(data)),data)
  for key in ('ff.spotify.session.v1','ff.spotify.pkce.verifier','ff.spotify.pkce.state','ff.spotify.pkce.redirect','ff.spotify.client-id','ff.apple.developer-token'):
   with self.assertRaises(ValueError):c.pack({key:'SYNTHETIC_EXCLUDED'})
 def test_missing_vs_empty(self):
  self.assertEqual(c.unpack(c.pack({})),{});self.assertEqual(c.unpack(c.pack({'ff-visual-quality':''})),{'ff-visual-quality':''})
 def test_unknown_and_parsed_refused(self):
  for d in ({'token':'secret'},{'ff-world-layout':{}},{'ff-world-layout':None}):
   with self.assertRaises(ValueError):c.pack(d)
 def test_tampering(self):
  a=c.pack({'ff-world-layout':'{}'});a['entries'][0]['value']='[]'
  with self.assertRaises(ValueError):c.unpack(a)
 def test_duplicate(self):
  with self.assertRaises(ValueError):c.parse('{"x":1,"x":2}')
  a=c.pack({'ff-world-layout':'{}'});a['entries']*=2
  with self.assertRaises(ValueError):c.unpack(a)
 def test_exclusive_and_mode(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'capsule';c.write_new(p,c.pack({}));before=p.read_bytes()
   self.assertEqual(p.stat().st_mode&0o777,0o600)
   with self.assertRaises(FileExistsError):c.write_new(p,{'new':1})
   self.assertEqual(p.read_bytes(),before)
 def test_versions_and_extensions(self):
  for key,val in [('version',True),('version',2),('native_import',True),('extra',1)]:
   a=c.pack({});a[key]=val
   with self.assertRaises(ValueError):c.unpack(a)
 def test_cli_roundtrip_and_refusal_no_value_logging(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);source=root/'source.json';packed=root/'packed.json';restored=root/'restored.json'
   raw={'ff-scrapbook-layout':'[{"unknown":"SYNTHETIC_PRIVATE_MARKER","x":-2.75}]','ff-visual-quality':'ultra'}
   source.write_text(json.dumps(raw));before=source.read_bytes()
   cli=str(Path(c.__file__))
   for op,src,dst in [('pack',source,packed),('unpack',packed,restored)]:
    r=subprocess.run([sys.executable,cli,op,str(src),str(dst)],capture_output=True,text=True)
    self.assertEqual(r.returncode,0,r.stderr);self.assertNotIn('SYNTHETIC_PRIVATE_MARKER',r.stdout+r.stderr)
   self.assertEqual(json.loads(restored.read_text()),raw);self.assertEqual(source.read_bytes(),before)
   r=subprocess.run([sys.executable,cli,'pack',str(source),str(packed)],capture_output=True,text=True)
   self.assertNotEqual(r.returncode,0);self.assertNotIn('SYNTHETIC_PRIVATE_MARKER',r.stdout+r.stderr)
 def test_failed_fsync_removes_only_new_output_and_allows_retry(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);source=root/'source.json';output=root/'capsule.json'
   source.write_text(json.dumps({'ff-world-layout':'SYNTHETIC_PRIVATE_MARKER'}))
   before=source.read_bytes();data=c.pack(json.loads(before))
   with patch('capsule.os.fsync',side_effect=OSError('synthetic disk failure')):
    with self.assertRaises(OSError):c.write_new(output,data)
   self.assertFalse(output.exists());self.assertEqual(source.read_bytes(),before)
   c.write_new(output,data)
   self.assertEqual(c.unpack(c.parse(output.read_bytes())),json.loads(before))
 def test_interrupted_output_is_removed(self):
  with tempfile.TemporaryDirectory() as d:
   output=Path(d)/'capsule.json'
   with patch('capsule.os.fsync',side_effect=KeyboardInterrupt):
    with self.assertRaises(KeyboardInterrupt):c.write_new(output,c.pack({}))
   self.assertFalse(output.exists())
 def test_existing_output_survives_injected_failure(self):
  with tempfile.TemporaryDirectory() as d:
   output=Path(d)/'capsule.json';output.write_bytes(b'existing recovery')
   with patch('capsule.os.fsync',side_effect=OSError('must not reach')) as sync:
    with self.assertRaises(FileExistsError):c.write_new(output,c.pack({}))
    sync.assert_not_called()
   self.assertEqual(output.read_bytes(),b'existing recovery')
 def test_limit(self):
  with self.assertRaises(ValueError):c.parse(b' '*(c.LIMIT+1))
if __name__=='__main__':unittest.main()
