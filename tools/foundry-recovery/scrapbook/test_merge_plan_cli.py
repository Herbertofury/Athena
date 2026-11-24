"""Synthetic no-overwrite planning with actual native validation, not restore."""
import copy,json,pathlib,subprocess,sys,unittest
import test_reconcile_cli
import merge_plan
class MergePlanTests(unittest.TestCase):
 def setUp(self):
  self.f=test_reconcile_cli.ReconcileTests();self.f.setUp();self.addCleanup(self.f.doCleanups)
  self.out=self.f.root/'candidate.json'
 def invoke(self):
  before={p:p.read_bytes() for p in self.f.root.rglob('*') if p.is_file()}
  result=subprocess.run([sys.executable,merge_plan.__file__,'--bundle',str(self.f.bundle),'--database',str(self.f.db),'--catalog',str(self.f.catalog),'--native-binary',str(self.f.binary),'--destination',str(self.out),'--source-quiescent'],capture_output=True,timeout=25)
  self.assertEqual({p:p.read_bytes() for p in before},before);self.assertEqual(result.stderr,b'')
  self.assertNotIn(str(self.f.root).encode(),result.stdout)
  return result,json.loads(result.stdout)
 def save(self,value):self.assertEqual(self.f.native('save-backup',value).returncode,0)
 def test_empty_snapshot_candidate_only_and_existing_output_refused(self):
  result,report=self.invoke();self.assertEqual(result.returncode,0);self.assertFalse(report['applied']);self.assertEqual(json.loads(self.out.read_bytes()),self.f.expected)
  self.assertEqual(json.loads(self.f.native('load-backup').stdout),None)
  self.assertEqual(self.invoke()[0].returncode,2)
 def test_preserves_other_room_named_layout_view_and_active(self):
  current=copy.deepcopy(self.f.expected);theme=json.loads(self.f.catalog.read_bytes())['themes'][0]
  other=theme['rooms'][1]['id'];current['active']['roomId']=other;current['layouts']={other:copy.deepcopy(current['active'])}
  current['view']={'inspectorDock':'left','inspectorWidth':360};current['savedLayouts']=[{'name':'Synthetic Café','layout':copy.deepcopy(current['active'])}]
  self.save(current);current=json.loads(self.f.native('load-backup').stdout)
  result,report=self.invoke();self.assertEqual(result.returncode,0);candidate=json.loads(self.out.read_bytes())
  for key in ['active','view','savedLayouts']:self.assertEqual(candidate[key],current[key])
  self.assertEqual(candidate['layouts'][other],current['layouts'][other]);self.assertEqual(len(candidate['layouts']),2)
 def test_same_room_addition_preserves_existing_and_repeat_is_identical(self):
  current=copy.deepcopy(self.f.expected);placements=current['active']['placements'];key=next(iter(placements));value=placements.pop(key);value['zIndex']=72;placements['instance-11111111-1111-4111-8111-111111111111']=value
  current['layouts'][current['active']['roomId']]=copy.deepcopy(current['active']);self.save(current)
  result,report=self.invoke();self.assertEqual(result.returncode,0);candidate=json.loads(self.out.read_bytes());self.assertEqual(len(candidate['active']['placements']),2);self.assertEqual(candidate['active']['placements']['instance-11111111-1111-4111-8111-111111111111'],value)
  self.save(candidate);self.out=self.f.root/'second.json';result,report=self.invoke();self.assertEqual(result.returncode,0);self.assertEqual(report['added'],0);self.assertEqual(report['already_identical'],1);self.assertEqual(json.loads(self.out.read_bytes()),candidate)
 def test_conflicting_id_refused_without_output(self):
  current=copy.deepcopy(self.f.expected);next(iter(current['active']['placements'].values()))['opacity']=.4;self.save(current)
  self.assertEqual(self.invoke()[0].returncode,2);self.assertFalse(self.out.exists())
 def test_ambiguous_stack_refused_without_output(self):
  current=copy.deepcopy(self.f.expected);placements=current['active']['placements'];placements['instance-22222222-2222-4222-8222-222222222222']=placements.pop(next(iter(placements)));current['layouts'][current['active']['roomId']]=copy.deepcopy(current['active']);self.save(current)
  self.assertEqual(self.invoke()[0].returncode,2);self.assertFalse(self.out.exists())
 def test_bundle_tamper_refused_without_output(self):
  (self.f.bundle/'athena-workspace.json').write_text('{}');self.assertEqual(self.invoke()[0].returncode,2);self.assertFalse(self.out.exists())
if __name__=='__main__':unittest.main()
