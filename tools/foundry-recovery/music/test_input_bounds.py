"""Bounded offline input allocation and real CLI no-output failure regression."""
import hashlib
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import MagicMock
from convert import MAX_INPUT_BYTES, read_bounded

class InputBoundsTests(unittest.TestCase):
 def test_reader_requests_only_limit_plus_sentinel(self):
  path=MagicMock();stream=io.BytesIO(b'x'*(MAX_INPUT_BYTES+10))
  path.open.return_value.__enter__.return_value=stream
  with self.assertRaisesRegex(ValueError,'Input exceeds limit'):read_bounded(path)
  self.assertEqual(stream.tell(),MAX_INPUT_BYTES+1)
  path.open.assert_called_once_with('rb')
 def test_exact_boundary_and_empty_are_read_without_truncation(self):
  with tempfile.TemporaryDirectory() as d:
   path=Path(d)/'input.json'
   for raw in (b'',b'x'*MAX_INPUT_BYTES):
    path.write_bytes(raw);self.assertEqual(read_bounded(path),raw)
 def test_cli_rejects_either_oversized_input_without_output_or_source_mutation(self):
  script=Path(__file__).with_name('convert.py')
  for oversized in ('source','mapping'):
   with self.subTest(oversized=oversized),tempfile.TemporaryDirectory() as d:
    source=Path(d)/'source.json';mapping=Path(d)/'mapping.json';output=Path(d)/'output.json'
    raw=json.dumps({'version':2,'route':'home','mappings':{}}).encode()
    source.write_bytes(raw);mapping.write_text(json.dumps({'sourceSha256':hashlib.sha256(raw).hexdigest(),'contexts':{}}))
    target=source if oversized=='source' else mapping
    target.write_bytes(b' '* (MAX_INPUT_BYTES+1))
    before={p:p.read_bytes() for p in (source,mapping)}
    result=subprocess.run([sys.executable,str(script),str(source),str(mapping),str(output)],capture_output=True,text=True,timeout=15)
    self.assertNotEqual(result.returncode,0);self.assertIn('Input exceeds limit',result.stderr)
    self.assertFalse(output.exists())
    for p,content in before.items():self.assertEqual(p.read_bytes(),content)
if __name__=='__main__':unittest.main()
