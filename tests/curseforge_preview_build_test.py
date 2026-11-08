"""Offline artifact/provenance checks; never read keys or request provider data."""
import copy
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
def module(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
BUILD=module('cf_preview_build',ROOT/'scripts/build_curseforge_preview.py')
LAB=module('cf_preview_lab',ROOT/'scripts/build_lab_workspace.py')
RECEIPT='engineering/experiments/site-extraction-lab/fixtures/curseforge-synthetic/preview-receipt.json'
class PreviewBuild(unittest.TestCase):
 def no_site(self,*args):
  result=subprocess.run([sys.executable,'-S',*args],cwd=ROOT,text=True,capture_output=True,timeout=30)
  self.assertEqual(result.returncode,0,result.stdout+result.stderr)
 def test_standard_library_only_preview_regenerates(self):
  self.no_site('scripts/build_curseforge_preview.py','--check')
  self.no_site('scripts/build_lab_workspace.py','--check')
 def test_json_helpers_do_not_load_lxml(self):
  self.no_site('-c',"""import sys
sys.path.insert(0,'engineering/experiments/site-extraction-lab')
from extractors import ExtractionError,json_loads,public_url
assert json_loads('{"id": 7}') == {'id': 7}
assert public_url('https://example.org/a?secret=discarded#fragment') == 'https://example.org/a'
for raw in ('{"id":1,"id":2}', '{"id":NaN}'):
 try: json_loads(raw)
 except (ExtractionError,ValueError): pass
 else: raise AssertionError('Invalid JSON accepted')
assert not any(name == 'lxml' or name.startswith('lxml.') for name in sys.modules)
""")
 def test_html_xml_paths_still_require_real_parser(self):
  self.no_site('-c',"""import sys
sys.path.insert(0,'engineering/experiments/site-extraction-lab')
import extractors as e
calls = [lambda:e.document('<p>sample</p>'), lambda:e.ordered_body(object()),
 lambda:e.wordpress({'post':'{"id":1,"content":{"rendered":"<p>sample</p>"}}'},'https://example.org/'),
 lambda:e.rss({'feed':b'<rss><channel/></rss>'},'https://example.org/'),
 lambda:e.fragment_document({'parts':[{'html':['<p>sample</p>']}]})]
for call in calls:
 try: call()
 except ModuleNotFoundError as exc: assert exc.name == 'lxml',exc
 else: raise AssertionError('HTML/XML path silently avoided its required parser')
""")
 def stage(self):
  temporary=tempfile.TemporaryDirectory(prefix='athena-cf-preview-test-');root=Path(temporary.name)
  for p in (*BUILD.SOURCES,RECEIPT):
   dest=root/p;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/p,dest)
  self.addCleanup(temporary.cleanup);return root
 def test_receipt_exactly_reproduces_mapper_output(self):
  self.assertEqual((ROOT/RECEIPT).read_bytes(),BUILD.build())
  self.assertEqual(LAB.load_curseforge_preview()['preview']['receipt']['files'][0]['fileLengthDecimal'],'9007199254740993')
 def test_changed_mapper_requires_regeneration(self):
  root=self.stage();p=root/'engineering/experiments/site-extraction-lab/curseforge.py';p.write_text(p.read_text()+'\n# changed\n')
  with self.assertRaisesRegex(ValueError,'source changed'):LAB.load_curseforge_preview(root)
 def test_changed_fixture_requires_regeneration(self):
  root=self.stage();p=root/'engineering/experiments/site-extraction-lab/fixtures/curseforge-synthetic/project.json';p.write_text(p.read_text()+'\n')
  with self.assertRaisesRegex(ValueError,'source changed'):LAB.load_curseforge_preview(root)
 def test_no_unlisted_source_paths_are_read(self):
  root=self.stage();p=root/RECEIPT;data=json.loads(p.read_text());data['source_files'][0]['path']='../../nonexistent-sensitive-file';p.write_text(json.dumps(data))
  with self.assertRaisesRegex(ValueError,'manifest is invalid'):LAB.load_curseforge_preview(root)
 def test_duplicate_manifest_path_is_rejected(self):
  root=self.stage();p=root/RECEIPT;data=json.loads(p.read_text());data['source_files'].append(copy.deepcopy(data['source_files'][0]));p.write_text(json.dumps(data))
  with self.assertRaisesRegex(ValueError,'manifest is invalid'):LAB.load_curseforge_preview(root)
 def test_no_live_claim_from_synthetic_preview(self):
  for keys,value in [(('preview','liveAcceptance'),True),(('preview','evidence'),'live'),(('preview','access','state'),'verified'),(('preview','receipt','fullSupportAccepted'),True)]:
   with self.subTest(keys=keys):
    root=self.stage();p=root/RECEIPT;data=json.loads(p.read_text());target=data
    for key in keys[:-1]:target=target[key]
    target[keys[-1]]=value;p.write_text(json.dumps(data))
    with self.assertRaisesRegex(ValueError,'evidence boundary'):LAB.load_curseforge_preview(root)
 def test_complete_mapper_receipt_binding_rejects_nested_claims(self):
  for keys,value in [(('preview','receipt','liveAcceptance'),True),(('preview','access','keyValidityVerified'),True),(('preview','receipt','unrecognized'),'SYNTHETIC-UNREVIEWED-PROSE')]:
   with self.subTest(keys=keys):
    root=self.stage();p=root/RECEIPT;data=json.loads(p.read_text());target=data
    for key in keys[:-1]:target=target[key]
    target[keys[-1]]=value;p.write_text(json.dumps(data,indent=2)+'\n')
    with self.assertRaisesRegex(ValueError,'does not match mapper output'):LAB.load_curseforge_preview(root)
 def test_keeps_original_job_protocol_modules_exact(self):
  for name in ('collection-input.mjs','job-submit.mjs','archive-view.mjs'):
   self.assertEqual((ROOT/'engineering/apps/atlas-lab/ui'/name).read_bytes(),(ROOT/'dist/workspaces/engineering/lab'/name).read_bytes())
if __name__=='__main__':unittest.main(verbosity=2)
