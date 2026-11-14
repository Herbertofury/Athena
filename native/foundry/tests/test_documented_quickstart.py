"""Execute only allowlisted documented database commands against a synthetic new DB."""
import json,os,pathlib,re,subprocess,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parents[3]
BIN=os.environ.get('ATHENA_FOUNDRY_STORE_BINARY',str(ROOT/'crates/athena-foundry-store/target/debug'/('athena-foundry-store.exe' if os.name=='nt' else 'athena-foundry-store')))
class DocumentedQuickstart(unittest.TestCase):
 def test_documented_sequence_initializes_current_explicit_schema(self):
  text=(ROOT/'docs/FOUNDRY-NATIVE.md').read_text(encoding='utf8')
  commands=re.findall(r'^crates/athena-foundry-store/target/debug/athena-foundry-store ([a-z-]+) /path/to/new-store.sqlite3$',text,re.M)
  expected=['init','upgrade-history','upgrade-soundtracks','upgrade-transforms','upgrade-scopes','upgrade-environment','upgrade-targets','upgrade-instances','upgrade-appearance','upgrade-filters','upgrade-origins','upgrade-environments','upgrade-blend-modes','upgrade-music-precision']
  self.assertEqual(commands,expected) # Never interpret arbitrary documentation as a shell script.
  with tempfile.TemporaryDirectory() as d:
   database=pathlib.Path(d)/'new synthetic store.sqlite3'
   for command in commands:
    result=subprocess.run([BIN,command,str(database)],check=True,capture_output=True,text=True,timeout=15)
    if command=='init':self.assertEqual(json.loads(result.stdout)['schema'],2)
   status=json.loads(subprocess.check_output([BIN,'status',str(database)],text=True))
   self.assertEqual(status['schema'],15);self.assertEqual(status['integrity'],'ok')
   fixture=(ROOT/'crates/athena-foundry-store/tests/fixtures/js-workspace.json').read_text(encoding='utf8')
   subprocess.run([BIN,'save-backup',str(database)],input=fixture,text=True,check=True,capture_output=True,timeout=15)
   self.assertEqual(json.loads(subprocess.check_output([BIN,'load-backup',str(database)],text=True)),json.loads(fixture))
if __name__=='__main__':unittest.main()
