"""Synthetic local fixtures for Research link containment. No network requests."""
import datetime as dt
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / 'engineering/scripts/check_research.py'
spec = importlib.util.spec_from_file_location('research_link_checker', SCRIPT)
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)
ROW = {'id': 'T1', 'title': 'Synthetic source', 'observed_version': 'fixture',
       'topic': 'test', 'note': 'Synthetic, not research evidence',
       'url': 'https://example.com/source', 'evidence': 'primary_documented',
       'checked_at': '2026-11-01', 'review_after_days': 30}


class ResearchLinkTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name) / 'repo'
        self.root = self.repo / 'engineering'
        self.root.mkdir(parents=True)
        self.docs = self.repo / 'docs'
        self.docs.mkdir()
        (self.docs / 'runtime.md').write_text('Synthetic runtime document.\n')
        self.outside = Path(self.tmp.name) / 'outside.md'
        self.outside.write_text('Sentinel: never read by the checker.\n')
        self.readme = self.root / 'README.md'
        self.readme.write_text('Synthetic [T1].\n')
        self.addCleanup(patch.stopall)
        patch.object(checker, 'load_sources', return_value=[dict(ROW)]).start()

    def run_check(self, canonical=False, root=None):
        with patch.object(checker, 'ROOT', self.root if canonical else SCRIPT.parents[1]):
            return checker.check(root or self.root, today=dt.date(2026, 11, 8))

    def permit_docs(self):
        (self.repo / 'migration/engineering-atlas').mkdir(parents=True, exist_ok=True)

    def link(self, target):
        self.readme.write_text('[target](' + target + ')\n')

    def assert_rejected(self, target, canonical=False):
        self.link(target)
        with self.assertRaisesRegex(ValueError, 'broken local link'):
            self.run_check(canonical)

    def test_canonical_migration_repository_scope_is_preserved(self):
        self.permit_docs()
        (self.repo / 'migration/engineering-atlas/receipt.md').write_text('Synthetic preserved evidence')
        self.link('../migration/engineering-atlas/receipt.md')
        self.run_check(canonical=True)

    def test_explicit_caller_link_scope_is_preserved(self):
        self.link('../docs/runtime.md')
        checker.check(self.root, today=dt.date(2026, 11, 8), link_root=self.repo)
        self.assert_rejected('../../outside.md')

    def test_malformed_url_reports_validation_error(self):
        self.assert_rejected('http://[bad')

    def test_local_existing(self):
        (self.root / 'target.md').write_text('A local target.\n')
        self.link('target.md')
        self.assertEqual(self.run_check()['markdown_files'], 2)

    def test_standalone_has_no_sibling_access(self):
        self.assert_rejected('../docs/runtime.md')

    def test_fake_parent_migration_layout_cannot_self_authorize(self):
        self.permit_docs()
        self.assert_rejected('../docs/runtime.md')


    def test_canonical_without_migration_marker_is_confined(self):
        self.assert_rejected('../docs/runtime.md', canonical=True)

    def test_reviewed_docs_permission(self):
        self.permit_docs()
        self.link('../docs/runtime.md')
        self.assertEqual(self.run_check(canonical=True)['markdown_files'], 1)

    def test_actual_nested_runtime_link_shape(self):
        self.permit_docs()
        nested = self.root / 'apps/atlas-lab'
        nested.mkdir(parents=True)
        (nested / 'README.md').write_text('[runtime](../../../docs/runtime.md)\n')
        self.assertEqual(self.run_check(canonical=True)['markdown_files'], 2)


    def test_traversal_outside_repository(self):
        self.permit_docs()
        self.assert_rejected('../../outside.md', canonical=True)

    def test_encoded_traversal(self):
        self.permit_docs()
        self.assert_rejected('%2e%2e/%2e%2e/outside.md', canonical=True)

    def test_docs_traversal_escape(self):
        self.permit_docs()
        self.assert_rejected('../docs/../../outside.md', canonical=True)

    def test_literal_absolute_inside_root_rejected(self):
        self.assert_rejected(str(self.readme))

    def test_encoded_absolute_inside_root_rejected(self):
        self.assert_rejected(str(self.readme).replace('/', '%2f'))

    def test_backslash_and_windows_forms(self):
        for target in ['..\\docs\\runtime.md', '%5c%5cserver%5cfile', 'C%3a%5cWindows%5cfile', 'C%3afile',
                       'C:\\Windows\\file', 'C:/Windows/file', 'C:relative', '\\\\server\\share\\file']:
            with self.subTest(target=target):
                self.assert_rejected(target)

    def test_network_path_rejected(self):
        self.assert_rejected('//server/share')

    def test_null_and_control_paths(self):
        for target in ['bad%00.md', 'bad%0a.md', 'bad%7f.md', 'READ\tME.md', 'README.md\n', 'README.md\r']:
            with self.subTest(target=target):
                self.assert_rejected(target)

    def test_file_uri_rejected(self):
        self.assert_rejected(self.readme.as_uri())

    def test_missing_target(self):
        self.assert_rejected('missing.md')

    def test_fragment_and_query_do_not_change_path_scope(self):
        self.permit_docs()
        self.link('../docs/runtime.md?view=1#scope')
        self.run_check(canonical=True)
        self.assert_rejected('../../outside.md?view=1#scope', canonical=True)

    def test_self_and_external_links_keep_existing_scope(self):
        self.readme.write_text('[fragment](#section) [query](?view=1) [web](https://example.com/x)\n')
        self.run_check()

    def test_target_symlink_escape(self):
        (self.root / 'escape.txt').symlink_to(self.outside)
        self.assert_rejected('escape.txt')

    def test_docs_descendant_symlink_escape(self):
        self.permit_docs()
        (self.docs / 'escape.txt').symlink_to(self.outside)
        self.assert_rejected('../docs/escape.txt', canonical=True)

    def test_docs_directory_symlink_escape(self):
        self.permit_docs()
        (self.docs / 'escape').symlink_to(self.outside.parent, target_is_directory=True)
        self.assert_rejected('../docs/escape/outside.md', canonical=True)

    def test_contained_target_symlink(self):
        (self.root / 'safe.txt').symlink_to(self.readme)
        self.link('safe.txt')
        self.run_check()

    def test_broken_and_looping_target_symlinks(self):
        for name, target in [('broken.txt', 'absent.txt'), ('loop.txt', 'loop.txt')]:
            (self.root / name).symlink_to(target)
            self.assert_rejected(name)

    def test_source_symlink_escape_is_not_read(self):
        source = self.root / 'outside.md'
        source.symlink_to(self.outside)
        original = Path.read_text
        def guarded(path, *args, **kwargs):
            if path == self.outside or path == source:
                self.fail('Escaping Markdown source was read')
            return original(path, *args, **kwargs)
        with patch.object(Path, 'read_text', guarded):
            with self.assertRaisesRegex(ValueError, 'escaped Markdown source'):
                self.run_check()

    def test_source_in_allowed_docs_is_still_outside_scan_scope(self):
        self.permit_docs()
        (self.root / 'alias.md').symlink_to(self.docs / 'runtime.md')
        with self.assertRaisesRegex(ValueError, 'escaped Markdown source'):
            self.run_check(canonical=True)

    def test_source_symlink_loop_fails_closed(self):
        (self.root / 'loop.md').symlink_to('loop.md')
        with self.assertRaisesRegex(ValueError, 'escaped Markdown source'):
            self.run_check()

    def test_root_symlink_rejected(self):
        alias = self.repo / 'alias'
        alias.symlink_to(self.root, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'root must not be a symlink'):
            self.run_check(root=alias)








    def test_source_validation_still_enforced(self):
        self.readme.write_text('Unknown [Z999].\n')
        with self.assertRaisesRegex(ValueError, 'unknown source Z999'):
            self.run_check()

    def test_checker_symlink_uses_physical_registry_and_scope(self):
        alias = self.repo / 'checker-alias.py'
        alias.symlink_to(SCRIPT)
        (self.repo / 'source_registry.py').write_text('raise AssertionError("Alias registry must not load")\n')
        result = subprocess.run([sys.executable, str(alias)], cwd=self.repo,
                                env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'},
                                capture_output=True, text=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        report = json.loads(result.stdout)
        self.assertGreater(report['sources'], 0)
        self.assertGreater(report['markdown_files'], 0)


if __name__ == '__main__':
    unittest.main(verbosity=2)
