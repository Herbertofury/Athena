import unittest,json,hashlib,sys,os,subprocess,tempfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from convert import convert,parse
class MusicTests(unittest.TestCase):
 def setUp(self):
  self.catalog={'themes':[{'id':'theme','rooms':[{'id':'room'}]}]}
  self.source={'version':2,'route':'home','mappings':{'theme::Original Room':{'provider':'youtube','url':'https://music.youtube.com/watch?v=abc','label':'Track','status':'USER_ASSIGNED','sourceId':'local:1','updatedAt':'2023-01-01T00:00:00.000Z'}}}
 def run_convert(self):
  raw=json.dumps(self.source).encode();return convert(raw,{'sourceSha256':hashlib.sha256(raw).hexdigest(),'contexts':{'theme::Original Room':{'themeId':'theme','roomId':'room'}}},self.catalog)
 def test_metadata_and_timestamp(self):
  row=self.run_convert()['rows'][0];self.assertEqual(row['updated_at'],1672531200);self.assertEqual(row['assignment']['source_id'],'local:1');self.assertEqual(row['assignment']['status'],'USER_ASSIGNED')
 def test_real_native_cli_roundtrip(self):
  root=Path(__file__).resolve().parents[3]
  binary=Path(os.environ.get('ATHENA_FOUNDRY_STORE_BINARY',root/'crates/athena-foundry-store/target/debug'/('athena-foundry-store.exe' if os.name=='nt' else 'athena-foundry-store')))
  if not binary.is_file():self.skipTest('Build native CLI for real import test')
  theme='frutiger-aero';room='frutiger-aero:room:aqua-atrium'
  original=next(iter(self.source['mappings'].values()));original['updatedAt']='2023-01-01T00:00:00.123Z';self.source['mappings']={theme+'::Aqua Atrium':original}
  raw=json.dumps(self.source).encode();catalog=json.loads((root/'dist/workspaces/foundry/catalog.json').read_text())
  payload=convert(raw,{'sourceSha256':hashlib.sha256(raw).hexdigest(),'contexts':{theme+'::Aqua Atrium':{'themeId':theme,'roomId':room}}},catalog)
  with tempfile.TemporaryDirectory()as tmp:
   db=Path(tmp)/'new.sqlite3'
   def run(command,*args,input=None):return subprocess.run([str(binary),command,str(db),*args],input=input,text=True,capture_output=True)
   for cmd in ['init','upgrade-history','upgrade-soundtracks','upgrade-transforms','upgrade-scopes','upgrade-environment','upgrade-targets','upgrade-instances','upgrade-appearance','upgrade-filters','upgrade-origins','upgrade-environments','upgrade-blend-modes','upgrade-music-precision']:self.assertEqual(run(cmd).returncode,0)
   self.assertEqual(run('import-music-json',input=json.dumps(payload)).returncode,0)
   actual=json.loads(run('read-native',theme,room).stdout);self.assertEqual(actual,payload['rows'][0])
   self.assertNotEqual(run('import-music-json',input=json.dumps(payload)).returncode,0)
 def test_fractional_time_preserved_not_silently_truncated(self):
  self.source['mappings']['theme::Original Room']['updatedAt']='2023-01-01T00:00:00.123Z'
  self.assertEqual(self.run_convert()['rows'][0]['updated_at_ms'],1672531200123)
 def test_credentials_unknown_field_rejected(self):
  self.source['mappings']['theme::Original Room']['accessToken']='synthetic'
  with self.assertRaises(ValueError):self.run_convert()
 def test_missing_context_rejected(self):
  self.source['mappings']['theme::Unmapped']=self.source['mappings'].pop('theme::Original Room')
  with self.assertRaises(ValueError):self.run_convert()
 def test_duplicate_json_rejected(self):
  with self.assertRaises(ValueError):parse(b'{"version":2,"version":2}')
if __name__=='__main__':unittest.main()
