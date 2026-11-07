import hashlib,importlib.util,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('receiver_build',ROOT/'scripts/build_receiver_lab.py');build=importlib.util.module_from_spec(spec);spec.loader.exec_module(build)
class ReceiverAssets(unittest.TestCase):
 def test_exact_assets_and_manifest(self):
  expected=build.outputs()
  for name,data in expected.items():self.assertEqual((build.OUT/name).read_bytes(),data)
  manifest=json.loads(expected['build-manifest.json'])
  for name,digest in manifest['artifacts'].items():self.assertEqual(hashlib.sha256(expected[name]).hexdigest(),digest)
 def test_worker_and_main_share_verified_candidate(self):
  files=build.outputs();worker=next(v for k,v in files.items() if k.startswith('receiver-worker.'));main=next(v for k,v in files.items() if k.startswith('receiver.') and k.endswith('.js'))
  verifier=next(k for k in files if k.startswith('verified-receiver.'))
  self.assertIn(verifier.encode(),worker);self.assertIn(verifier.encode(),main)
  self.assertIn(b'no silent fallback',main);self.assertIn(b'w.terminate()',main)
 def test_stale_bundle_inputs_or_tool_identity_fail_before_asset_output(self):
  from unittest.mock import patch
  original=Path.read_text
  receipt_path=ROOT/'experiments/worker-bundle-lab/build-receipt.json'
  for change in ('input','version','output'):
   def read(path,*args,**kwargs):
    value=original(path,*args,**kwargs)
    if path==receipt_path:
     record=json.loads(value)
     if change=='input':record['inputs'][next(iter(record['inputs']))]='0'*64
     elif change=='version':record['tools']['esbuild']['version']='unverified'
     else:record['tools']['esbuild']['sha256']='0'*64
     return json.dumps(record)
    return value
   with patch.object(Path,'read_text',read):
    with self.assertRaises(ValueError):build.outputs()
 def test_staging_new_worker_graph_does_not_replace_published_entrypoints(self):
  from unittest.mock import patch
  original=Path.read_text
  source=ROOT/'docs/card-receiver-lab/receiver-worker.mjs'
  def changed(path,*args,**kwargs):
   value=original(path,*args,**kwargs)
   return value+'\n// generated staging-only fixture\n' if path==source else value
  with patch.object(Path,'read_text',changed):
   with self.assertRaises(ValueError):build.outputs()
   staged=build.outputs(stage_worker=True)
  self.assertNotIn('index.html',staged);self.assertNotIn('build-manifest.json',staged)
  manifest=json.loads(staged['worker-input-manifest.json']);self.assertIn(manifest['entry'],staged)
  for name,digest in manifest['artifacts'].items():self.assertEqual(hashlib.sha256(staged[name]).hexdigest(),digest)
