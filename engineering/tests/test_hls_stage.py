import pathlib,subprocess,sys,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
SCRIPT=ROOT/'experiments/hls-release-lab/stage_sources.py'
class HlsStageTests(unittest.TestCase):
 def test_wrong_archive_rejected_before_source_creation(self):
  with tempfile.TemporaryDirectory() as tmp:
   stage=pathlib.Path(tmp);(stage/'packages').mkdir();(stage/'packages/hls.js-1.7.3.tgz').write_bytes(b'not the pinned package')
   result=subprocess.run([sys.executable,*(['-O'] if sys.flags.optimize else []),str(SCRIPT),str(stage)],capture_output=True,timeout=5)
   self.assertNotEqual(result.returncode,0);self.assertIn(b'Package integrity mismatch',result.stderr);self.assertFalse((stage/'packages/source-1.7.3').exists())
 def test_oversized_archive_rejected_before_hash_or_extract(self):
  with tempfile.TemporaryDirectory() as tmp:
   stage=pathlib.Path(tmp);(stage/'packages').mkdir()
   with (stage/'packages/hls.js-1.7.3.tgz').open('wb') as f:f.truncate(12*1024*1024+1)
   result=subprocess.run([sys.executable,*(['-O'] if sys.flags.optimize else []),str(SCRIPT),str(stage)],capture_output=True,timeout=5)
   self.assertNotEqual(result.returncode,0);self.assertIn(b'Unexpected package size',result.stderr);self.assertFalse((stage/'packages/source-1.7.3').exists())
if __name__=='__main__':unittest.main()
