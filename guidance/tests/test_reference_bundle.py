import io
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
import zipfile
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
import reference_bundle as bundle

class ReferenceBundleTests(unittest.TestCase):
    def changed(self, change):
        original = bundle.build(ROOT)
        stream = io.BytesIO()
        with zipfile.ZipFile(io.BytesIO(original)) as source, zipfile.ZipFile(stream, 'w') as target:
            for entry in source.infolist():
                name, data = change(entry.filename, source.read(entry))
                target.writestr(entry if name == entry.filename else name, data)
        return stream.getvalue()
    def test_repeatable_complete_reference(self):
        first = bundle.build(ROOT)
        self.assertEqual(first, bundle.build(ROOT))
        self.assertEqual(bundle.verify(ROOT, first)['documents'], 16)
    def test_tamper_not_accepted_even_with_self_consistent_archive(self):
        data = self.changed(lambda name, data: (name, data.replace(b'Athena', b'athena')))
        with self.assertRaises(ValueError): bundle.verify(ROOT, data)
    def test_traversal_not_extracted_or_accepted(self):
        data = self.changed(lambda name, data: ('../outside.md', data) if name == 'RUNTIME_PROOF.md' else (name, data))
        with self.assertRaises(ValueError): bundle.verify(ROOT, data)
    def test_extra_entries_rejected(self):
        stream = io.BytesIO(bundle.build(ROOT))
        with zipfile.ZipFile(stream, 'a') as archive: archive.writestr('extra.txt', b'not canonical')
        with self.assertRaises(ValueError): bundle.verify(ROOT, stream.getvalue())
    def test_duplicate_member_rejected(self):
        import warnings
        stream = io.BytesIO(bundle.build(ROOT))
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', UserWarning)
            with zipfile.ZipFile(stream, 'a') as archive: archive.writestr('RUNTIME_PROOF.md', b'duplicate')
        with self.assertRaises(ValueError): bundle.verify(ROOT, stream.getvalue())
    def test_canonical_source_drift_rejected(self):
        import shutil
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp)/'guidance'
            shutil.copytree(ROOT, source)
            (source/'RUNTIME_PROOF.md').write_text('changed')
            with self.assertRaises(ValueError): bundle.build(source)
    def test_oversized_input_rejected(self):
        with self.assertRaises(ValueError): bundle.verify(ROOT, b'0' * (bundle.LIMIT + 1))
    def test_cli_preserves_existing_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp)/'reference.zip'
            command = [sys.executable, str(ROOT/'tools/reference_bundle.py'), '--output', str(output)]
            self.assertEqual(subprocess.run(command, capture_output=True).returncode, 0)
            first = output.read_bytes()
            self.assertEqual(subprocess.run(command, capture_output=True).returncode, 2)
            self.assertEqual(output.read_bytes(), first)
            self.assertEqual(subprocess.run([*command[:-2], '--verify', str(output)], capture_output=True).returncode, 0)
if __name__ == '__main__': unittest.main()
