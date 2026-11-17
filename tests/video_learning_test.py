import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('video_learning', ROOT / 'scripts/video_learning.py')
v = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v)
VTT = b'WEBVTT\n\n00:00.000 --> 00:02.000\nSynthetic problem.\n\n00:02.000 --> 00:04.000\nSynthetic solution.\n'

class TranscriptTests(unittest.TestCase):
    def load(self, raw=VTT, fmt='vtt'):
        return v.import_captions(raw, fmt, 'abcdefghijk', 'en', 'user-supplied')
    def review(self):
        result = {phase: [{'status': 'observed', 'statement': 'Synthetic observation', 'cue_ids': ['cue-1']}] for phase in v.PHASES}
        result.update(video_id='abcdefghijk', transcript_sha256=self.load()['sha256'], source_kind='illustrative-story', objectives=['Diagnose a synthetic failure'], exercise={'task': 'Inspect a fixture', 'success_criteria': 'Explain the evidence', 'safety': 'No production access'})
        return result
    def test_vtt_identity(self):
        item = self.load()
        self.assertEqual(item['cues'][1]['start_ms'], 2000)
        self.assertTrue(item['cues'][1]['url'].endswith('&t=2s'))
        self.assertIn('not established', item['coverage'])
    def test_vtt_identifier_not_header(self):
        item=self.load(VTT.replace(b'00:02.000 -->',b'WEBVTT-chapter\n00:02.000 -->'))
        self.assertEqual(len(item['cues']),2)
    def test_escaped_markup(self):
        self.assertTrue(self.load(VTT.replace(b'Synthetic problem.',b'&lt;script&gt;bad()&lt;/script&gt;'))['warnings'])
    def test_video_binding(self):
        review=self.review();review['video_id']='differentid'
        with self.assertRaises(ValueError):v.proposal(self.load(),review)
    def test_srt(self):
        self.assertEqual(self.load(b'1\r\n00:00:01,200 --> 00:00:02,400\r\nA &amp; B\r\n', 'srt')['cues'][0]['text'], 'A & B')
    def test_json3(self):
        raw = json.dumps({'events': [{'id': 0}, {'tStartMs': 1000, 'dDurationMs': 1000, 'segs': [{'utf8':'Synthetic '}, {'utf8':'cue'}]}]}).encode()
        self.assertEqual(self.load(raw, 'json3')['cues'][0]['text'], 'Synthetic cue')
    def test_missing_duration(self):
        with self.assertRaises(ValueError): self.load(b'{"events":[{"tStartMs":1,"segs":[{"utf8":"x"}]}]}', 'json3')
    def test_overlap_preserved(self):
        item=self.load(VTT.replace(b'00:02.000 -->', b'00:01.000 -->'))
        self.assertTrue(item['warnings']); self.assertEqual(len(item['cues']),2)
    def test_invalid_inputs(self):
        for raw in (b'', b'WEBVTT\n\ngarbage', VTT.replace(b'00:04.000',b'00:01.000'), VTT.replace(b'00:02.000',b'00:62.000')):
            with self.subTest(raw=raw), self.assertRaises(ValueError): self.load(raw)
    def test_limit(self):
        with self.assertRaises(ValueError): self.load(b'x'*(v.MAX_BYTES+1))
    def test_untrusted_markup_retained(self):
        item=self.load(VTT.replace(b'Synthetic problem.',b'<script>bad()</script>'))
        self.assertIn('<script>', item['cues'][0]['text']); self.assertTrue(item['warnings'])
    def test_proposal(self):
        item=v.proposal(self.load(), self.review())
        self.assertEqual(item['status'],'curriculum-proposal-needs-review')
        self.assertEqual(item['analysis']['solution'][0]['evidence'][0]['cue_id'],'cue-1')
        self.assertNotIn('text',item)
    def test_evidence_gate(self):
        for field,value in [('transcript_sha256','wrong'),('source_kind','confirmed personal experience')]:
            review=self.review();review[field]=value
            with self.assertRaises(ValueError):v.proposal(self.load(),review)
        for refs in ([],['missing']):
            review=self.review();review['solution'][0]['cue_ids']=refs
            with self.assertRaises(ValueError):v.proposal(self.load(),review)
    def test_unknown_not_fabricated(self):
        review=self.review(); review['verification']=[{'status':'unknown','statement':'Not shown','cue_ids':[]}]
        self.assertEqual(v.proposal(self.load(),review)['analysis']['verification'][0]['status'],'unknown')
    def test_cli_no_overwrite(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); source=root/'fixture.vtt';source.write_bytes(VTT); output=root/'parsed.json'
            args=[sys.executable,str(ROOT/'scripts/video_learning.py'),str(source),'--format','vtt','--video-id','abcdefghijk','--language','en','--origin','user-supplied','--output',str(output)]
            subprocess.run(args,check=True,capture_output=True); previous=output.read_bytes()
            self.assertNotEqual(subprocess.run(args,capture_output=True).returncode,0)
            self.assertEqual(output.read_bytes(),previous);self.assertEqual(source.read_bytes(),VTT)

if __name__ == '__main__': unittest.main()
