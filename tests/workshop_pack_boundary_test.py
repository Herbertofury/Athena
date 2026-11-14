"""Synthetic filesystem regressions for downloadable workshop input boundaries."""
from pathlib import Path
import os
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import build_workshop_assets as packs


def _unavailable_junction(_path):
    raise AttributeError('is_junction unavailable on older Python')


class PackBoundary(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='athena-pack-input-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.folder = self.root / 'workshop'
        self.folder.mkdir()
        (self.folder / 'README.md').write_text('Synthetic learner content')
        self.other = self.root / 'unrelated.txt'
        self.other.write_text('SYNTHETIC OUTSIDE MARKER: not learner material')

    def rejected(self, folder=None):
        with self.assertRaisesRegex(ValueError, r'(?i)(link|regular|directory)'):
            dict(packs.pack_files(folder or self.folder))

    def test_external_file_symlink_is_rejected_before_read(self):
        link = self.folder / 'extra.txt'
        link.symlink_to(self.other)
        original = Path.read_bytes
        reads = []
        def read(path):
            reads.append(path)
            if path == link:
                self.fail('A linked outside file must never be read')
            return original(path)
        with patch.object(Path, 'read_bytes', read):
            self.rejected()
        self.assertNotIn(link, reads)

    def test_internal_file_symlink_is_also_rejected(self):
        (self.folder / 'duplicate.md').symlink_to(self.folder / 'README.md')
        self.rejected()

    def test_directory_symlink_is_not_silently_omitted(self):
        outside = self.root / 'other-folder'; outside.mkdir()
        (outside / 'lesson.md').write_text('Synthetic unrelated lesson')
        (self.folder / 'linked-directory').symlink_to(outside, target_is_directory=True)
        self.rejected()

    def test_broken_link_is_not_silently_omitted(self):
        (self.folder / 'broken').symlink_to(self.root / 'absent')
        self.rejected()

    def test_symlink_root_is_rejected(self):
        alias = self.root / 'workshop-alias'
        alias.symlink_to(self.folder, target_is_directory=True)
        self.rejected(alias)

    def test_regular_file_cannot_be_a_workshop_root(self):
        self.rejected(self.folder / 'README.md')

    def test_link_is_rejected_even_when_its_name_would_be_excluded(self):
        (self.folder / 'package_fixture.py').symlink_to(self.other)
        self.rejected()

    @unittest.skipUnless(hasattr(os, 'mkfifo'), 'FIFO creation unavailable')
    def test_special_fifo_input_is_rejected_without_opening(self):
        os.mkfifo(self.folder / 'stream')
        self.rejected()

    def test_ordinary_nested_files_and_exclusions_remain_unchanged(self):
        nested = self.folder / 'lessons'; nested.mkdir()
        (nested / 'example.py').write_bytes(b'print("hello")\n')
        (self.folder / 'MANIFEST.sha256').write_text('stale generated manifest')
        (self.folder / 'package_fixture.py').write_text('not learner-facing')
        (self.folder / 'check.cjs').write_text('excluded browser test')
        cache = self.folder / '__pycache__'; cache.mkdir()
        (cache / 'sample.pyc').write_bytes(b'cache')
        self.assertEqual(list(packs.pack_files(self.folder)), [
            ('README.md', b'Synthetic learner content'),
            ('lessons/example.py', b'print("hello")\n')])

    def reparse_metadata(self, target):
        original = Path.lstat
        def metadata(path, *args, **kwargs):
            value = original(path, *args, **kwargs)
            if path == target:
                return SimpleNamespace(st_mode=value.st_mode, st_file_attributes=1024)
            return value
        return metadata

    def test_windows_reparse_root_rejected_without_is_junction(self):
        # Mock Windows metadata, not a claim that this ran on Windows.
        with patch.object(Path, 'lstat', self.reparse_metadata(self.folder)), \
             patch.object(packs.stat, 'FILE_ATTRIBUTE_REPARSE_POINT', 1024, create=True), \
             patch.object(Path, 'is_junction', property(_unavailable_junction), create=True):
            self.rejected()

    def test_nested_windows_reparse_directory_rejected_before_descent(self):
        junction = self.folder / 'nested'; junction.mkdir()
        original = Path.iterdir
        def entries(path):
            if path == junction:
                self.fail('A reparse directory must not be traversed')
            return original(path)
        with patch.object(Path, 'lstat', self.reparse_metadata(junction)), \
             patch.object(packs.stat, 'FILE_ATTRIBUTE_REPARSE_POINT', 1024, create=True), \
             patch.object(Path, 'is_junction', property(_unavailable_junction), create=True), \
             patch.object(Path, 'iterdir', entries):
            self.rejected()

    def test_failed_input_keeps_last_good_download_unchanged(self):
        repo = self.root / 'synthetic-repo'
        source = repo / 'workshops' / 'synthetic'; source.mkdir(parents=True)
        (source / 'README.md').write_text('good')
        output = repo / 'dist' / 'workshops' / 'synthetic' / 'learner-pack.zip'
        output.parent.mkdir(parents=True); output.write_bytes(b'last-good-fixture')
        (source / 'outside.txt').symlink_to(self.other)
        with patch.object(packs, 'ROOT', repo), patch.object(packs, 'KEYS', ['synthetic']):
            with self.assertRaises(ValueError):
                packs.build()
        self.assertEqual(output.read_bytes(), b'last-good-fixture')


if __name__ == '__main__':
    unittest.main()
