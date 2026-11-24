import hashlib,json,subprocess,sys,unittest,importlib.util,tempfile
from unittest.mock import patch
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];LAB=ROOT/'docs/audio-lab'
class AudioAssetTests(unittest.TestCase):
    def test_generated_assets_match_source_and_reused_selection(self):
        subprocess.run([sys.executable,str(ROOT/'scripts/build_audio_lab.py'),'--check'],check=True,capture_output=True)
        manifest=json.loads((LAB/'build-manifest.json').read_text())
        for name,digest in manifest['artifacts'].items():self.assertEqual(hashlib.sha256((LAB/name).read_bytes()).hexdigest(),digest)
        selection=next(name for name in manifest['artifacts'] if name.startswith('archive-selection.'))
        self.assertEqual((LAB/selection).read_bytes(),(ROOT/'apps/atlas-lab/ui/archive-view.mjs').read_bytes())
    def test_builder_rejects_duplicate_fixture_keys(self):
        spec=importlib.util.spec_from_file_location('audio_build_test',ROOT/'scripts/build_audio_lab.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as directory:
            target=Path(directory)
            for name in ['audio-core.mjs','audio.css','public-fixture.json']:(target/name).write_bytes((LAB/name).read_bytes())
            fixture=(target/'public-fixture.json').read_text();fixture=fixture.replace('"id": "76730271"','"id": "42", "id": "76730271"');(target/'public-fixture.json').write_text(fixture)
            with patch.object(module,'LAB',target),self.assertRaisesRegex(ValueError,'Duplicate'):module.outputs()
    def test_entrypoint_is_content_addressed_integrity_checked_and_autoplay_off(self):
        html=(LAB/'index.html').read_text();self.assertIn('integrity="sha384-',html);self.assertIn('media-src blob:',html);self.assertIn('https://upload.wikimedia.org',html);self.assertNotIn(' autoplay',html)
        source=(LAB/'audio.js').read_text();self.assertIn('audio.autoplay=false',source);self.assertNotIn('.play(',source);self.assertIn("'./audio-core.mjs'",source);self.assertIn('createArchiveSelection',source);self.assertIn('createMediaEvent',source)
if __name__=='__main__':unittest.main()
