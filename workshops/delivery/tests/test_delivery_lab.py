"""Executable Git contracts, isolation and CLI regressions (stdlib only)."""
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
from contextlib import redirect_stderr, redirect_stdout
import subprocess
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch

LAB = Path(__file__).resolve().parents[1] / 'labs' / 'delivery-workshop'
spec = importlib.util.spec_from_file_location('delivery_lab', LAB / 'lab.py')
lab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lab)


class Exercises(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.results = {name: lab.run(name) for name in lab.COMMANDS}

    def result(self, name):
        return self.results[name]['result']

    def test_snapshot_revisions_differ(self):
        r = self.result('snapshots'); self.assertNotEqual(r['before'], r['after'])

    def test_snapshot_history_preserved(self):
        r = self.result('snapshots'); self.assertEqual(r['old_content'], 'Decision: baseline\n'); self.assertEqual(r['new_content'], 'Decision: reviewed\n')

    def test_snapshot_clean(self):
        self.assertTrue(self.result('snapshots')['clean'])

    def test_staging_two_changes(self):
        self.assertEqual(self.result('staging')['status_before'], 'MM notes.txt')

    def test_staged_diff(self):
        self.assertIn('+Decision: staged', self.result('staging')['staged_diff'])

    def test_unstaged_diff(self):
        self.assertIn('+Decision: unstaged follow-up', self.result('staging')['unstaged_diff'])

    def test_commit_uses_index(self):
        self.assertEqual(self.result('staging')['committed_content'], 'Decision: staged\n')

    def test_worktree_not_committed(self):
        r = self.result('staging'); self.assertEqual(r['working_content'], 'Decision: unstaged follow-up\n'); self.assertFalse(r['clean'])

    def test_merge_two_parents(self):
        r = self.result('branches'); self.assertEqual(r['parents'], [r['main_before_merge'], r['feature']])

    def test_merge_preserves_both_changes(self):
        r = self.result('branches'); self.assertEqual(r['resolved_content'], 'Decision: feature\n')
        self.assertEqual(json.loads(r['release_content']), {'feature': False, 'version': 2})

    def test_runtime_evidence(self):
        r = self.results['snapshots']['runtime']
        self.assertEqual(r['git_executable'], '/usr/local/bin/git'); self.assertIn('git version', r['git_version'])
        self.assertEqual(r['observed_head_author'], 'Synthetic Learner <learner@example.invalid>')
        self.assertRegex(r['python_version'], r'^3\.\d+\.\d+')

    def test_merge_clean(self):
        r = self.result('branches'); self.assertTrue(r['clean']); self.assertEqual(r['unmerged_after'], '')

    def test_merge_no_conflict(self):
        self.assertFalse(self.result('branches')['conflict_observed'])

    def test_feature_branch_retained(self):
        self.assertIn('  feature', self.result('branches')['branches'])

    def test_real_conflict_observed(self):
        self.assertTrue(self.result('conflict')['conflict_observed'])

    def test_conflict_unmerged_entries_observed(self):
        rows = self.result('conflict')['unmerged_before'].splitlines()
        self.assertEqual(len(rows), 3)
        self.assertEqual([row.split()[2] for row in rows], ['1', '2', '3'])
        for row in rows: self.assertTrue(row.endswith('\tnotes.txt')); self.assertRegex(row, r'^100644 [0-9a-f]{40} [123]\t')
        self.assertEqual(self.result('branches')['unmerged_before'], '')

    def test_conflict_markers(self):
        r = self.result('conflict'); self.assertIn('<<<<<<< HEAD', r['conflict_markers']); self.assertIn('>>>>>>> feature', r['conflict_markers'])

    def test_conflict_expected_nonzero(self):
        calls = self.results['conflict']['operations']; self.assertIn({'operation': 'merge', 'returncode': 1}, calls)

    def test_resolution_explicit(self):
        self.assertEqual(self.result('conflict')['resolved_content'], 'Decision: feature and main reviewed together\n')

    def test_conflict_cleared(self):
        r = self.result('conflict'); self.assertTrue(r['clean']); self.assertEqual(r['unmerged_after'], '')

    def test_resolved_merge_has_two_parents(self):
        r = self.result('conflict'); self.assertEqual(r['parents'], [r['main_before_merge'], r['feature']])

    def test_revert_preserves_bad_commit(self):
        r = self.result('recovery'); self.assertEqual(r['history'], [r['revert'], r['bad'], r['baseline']])

    def test_revert_restores_content(self):
        self.assertEqual(self.result('recovery')['restored_content'], lab.BASE['release.json'])

    def test_revert_observed_baseline_comparison(self):
        r = self.result('recovery')
        self.assertEqual(r['baseline_content'], r['restored_content'])
        self.assertTrue(r['baseline_restored'])
        self.assertEqual(r['baseline_content'], lab.BASE['release.json'])

    def test_revert_clean(self):
        self.assertTrue(self.result('recovery')['clean'])

    def test_exact_revision_pass(self):
        r = self.result('revision-tests')['baseline_pass']; self.assertTrue(r['accepted']); self.assertEqual(r['actual_revision'], r['expected_revision'])

    def test_dirty_rejected(self):
        r = self.result('revision-tests')['dirty_rejected']; self.assertFalse(r['accepted']); self.assertEqual(r['reason'], 'dirty-worktree')

    def test_mismatch_rejected(self):
        r = self.result('revision-tests')['mismatch_rejected']; self.assertFalse(r['accepted']); self.assertEqual(r['reason'], 'revision-mismatch'); self.assertNotEqual(r['actual_revision'], r['expected_revision'])

    def test_new_revision_tested(self):
        r = self.result('revision-tests'); self.assertTrue(r['new_revision_pass']['accepted']); self.assertNotEqual(r['baseline_pass']['actual_revision'], r['new_revision_pass']['actual_revision'])

    def test_bad_release_fails_fixed_assertions(self):
        r = self.result('revision-tests')['bad_release_rejected']; self.assertFalse(r['accepted']); self.assertFalse(r['checks']['version_positive_integer'])

    def test_provenance_manifest(self):
        r = self.result('provenance'); self.assertEqual([x['path'] for x in r['manifest']], sorted(lab.FILES))
        for entry in r['manifest']:
            data = lab.BASE[entry['path']].encode(); self.assertEqual(entry['sha256'], hashlib.sha256(data).hexdigest()); self.assertEqual(entry['bytes'], len(data))

    def test_provenance_determinism(self):
        self.assertTrue(self.result('provenance')['repeat_identical'])

    def test_tamper_detected(self):
        r = self.result('provenance'); self.assertTrue(r['tamper_detected']); self.assertNotEqual(r['sha256'], r['tampered_sha256'])

    def test_hash_not_authentication(self):
        self.assertFalse(self.result('provenance')['authenticated'])

    def test_capstone_gate(self):
        r = self.result('capstone'); self.assertTrue(r['local_gate_passed']); self.assertEqual(r['merge']['merged'], r['tests']['actual_revision']); self.assertEqual(r['tests']['actual_revision'], r['artifact']['revision'])

    def test_capstone_not_publication(self):
        r = self.result('capstone'); self.assertFalse(r['remote_publication']); self.assertFalse(r['production_deployment'])

    def test_all_envelopes(self):
        for name, result in self.results.items():
            with self.subTest(name=name):
                self.assertEqual(result['exercise'], name); self.assertTrue(result['temporary_repository_cleaned']); self.assertFalse(result['network_used']); self.assertFalse(result['user_repository_used']); self.assertTrue(result['operations'])

    def test_repeat_runs_same_evidence(self):
        self.assertEqual(lab.run('capstone'), self.results['capstone'])


class Boundaries(unittest.TestCase):
    def test_revision_checks_read_data_from_full_commit(self):
        with lab.fresh_repo() as repo:
            revision = repo.head()
            with patch.object(repo, 'read_revision', wraps=repo.read_revision) as read:
                result = lab.check_revision(repo, revision)
            self.assertTrue(result['accepted'])
            read.assert_called_once_with(revision, 'release.json')

    def test_dirty_gate_rejects_before_reading_committed_data(self):
        with lab.fresh_repo() as repo:
            revision = repo.head(); repo.write('notes.txt', 'synthetic dirty teaching file')
            with patch.object(repo, 'read_revision', wraps=repo.read_revision) as read:
                result = lab.check_revision(repo, revision)
            self.assertEqual(result['reason'], 'dirty-worktree')
            read.assert_not_called()

    def test_invalid_exercises(self):
        for name in ('', 'push', '../snapshots', '--help', 'SNAPSHOTS', None, [], 1):
            with self.subTest(name=name), self.assertRaises(ValueError): lab.run(name)

    def test_no_repository_argument(self):
        with self.assertRaises(TypeError): lab.run('snapshots', '/tmp')

    def test_command_allowlist(self):
        for args in (('push',), ('clone', 'https://example.invalid'), ('reset', '--hard'), ('clean', '-fd'), ('config', '--global', 'x', 'y'), ('init', '/tmp/outside'), ('show', 'HEAD:notes.txt'), ('show', 'a'*40 + ':../secret'), ('commit', '-m', 'arbitrary'), ('add', '--', '../outside')):
            with self.subTest(args=args): self.assertFalse(lab.allowed(args))

    def test_allowed_object_operations(self):
        self.assertTrue(lab.allowed(('show', 'a'*40 + ':notes.txt'))); self.assertTrue(lab.allowed(('revert', '--no-edit', 'a'*40)))

    def test_invalid_sha(self):
        with lab.fresh_repo() as repo:
            for sha in ('HEAD', 'a'*39, 'a'*41, 'A'*40, 'a'*40+'\n', '', None):
                with self.subTest(sha=sha), self.assertRaises(ValueError): lab.check_revision(repo, sha)

    def test_file_write_scope(self):
        with lab.fresh_repo() as repo:
            for name in ('../outside', '/tmp/outside', '.git/config', 'script.py', ''):
                with self.subTest(name=name), self.assertRaises(ValueError): repo.write(name, 'bad')

    def test_file_write_size(self):
        with lab.fresh_repo() as repo:
            repo.write('notes.txt', 'x'*4096)
            with self.assertRaises(ValueError): repo.write('notes.txt', 'x'*4097)
            with self.assertRaises(ValueError): repo.write('notes.txt', '\u00e9'*2049)

    def test_untracked_blocks_gate(self):
        with lab.fresh_repo() as repo:
            (repo.path / 'untracked.txt').write_text('synthetic')
            self.assertEqual(lab.check_revision(repo, repo.head())['reason'], 'dirty-worktree')

    def test_staged_blocks_gate(self):
        with lab.fresh_repo() as repo:
            repo.write('notes.txt', 'changed'); repo.git('add', '--', 'notes.txt')
            self.assertEqual(lab.check_revision(repo, repo.head())['reason'], 'dirty-worktree')

    def test_postcheck_dirty_rejected(self):
        with lab.fresh_repo() as repo:
            revision = repo.head()
            with patch.object(repo, 'clean', side_effect=[True, False]): result = lab.check_revision(repo, revision)
            self.assertFalse(result['accepted']); self.assertEqual(result['reason'], 'dirty-worktree-after-check')

    def test_postcheck_revision_change_rejected(self):
        with lab.fresh_repo() as repo:
            revision = repo.head()
            with patch.object(repo, 'head', side_effect=[revision, 'a'*40]): result = lab.check_revision(repo, revision)
            self.assertFalse(result['accepted']); self.assertEqual(result['reason'], 'revision-changed-during-check')

    def test_dirty_artifact_rejected(self):
        with lab.fresh_repo() as repo:
            repo.write('notes.txt', 'dirty')
            with self.assertRaises(lab.LabError): lab.source_artifact(repo, repo.head())

    def test_mismatch_artifact_rejected(self):
        with lab.fresh_repo() as repo:
            with self.assertRaises(lab.LabError): lab.source_artifact(repo, 'a'*40)

    def test_archive_exact_committed_bytes(self):
        with lab.fresh_repo() as repo:
            repo.write('notes.txt', '  trailing spaces  \n\n'); rev = repo.commit('Snapshot two')
            data, manifest = lab.source_artifact(repo, rev)
            with tarfile.open(fileobj=io.BytesIO(data)) as archive:
                self.assertEqual(archive.getnames(), sorted(lab.FILES))
                self.assertEqual(archive.extractfile('notes.txt').read(), b'  trailing spaces  \n\n')
                for item in archive.getmembers(): self.assertEqual(item.mtime, 0); self.assertEqual(item.uid, 0); self.assertEqual(item.mode, 0o644)

    def test_boolean_is_not_version_integer(self):
        with lab.fresh_repo() as repo:
            repo.write('release.json', '{"version":true,"feature":false}\n'); rev = repo.commit('Bad release')
            self.assertFalse(lab.check_revision(repo, rev)['accepted'])

    def test_feature_requires_boolean(self):
        with lab.fresh_repo() as repo:
            repo.write('release.json', '{"version":1,"feature":1}\n'); rev = repo.commit('Bad release')
            self.assertFalse(lab.check_revision(repo, rev)['accepted'])

    def test_malformed_json_rejected(self):
        with lab.fresh_repo() as repo:
            repo.write('release.json', '{broken'); rev = repo.commit('Bad release')
            result = lab.check_revision(repo, rev)
            self.assertFalse(result['accepted']); self.assertEqual(result['reason'], 'invalid-release-json')

    def test_json_list_rejected(self):
        with lab.fresh_repo() as repo:
            repo.write('release.json', '[1,2]'); rev = repo.commit('Bad release')
            self.assertEqual(lab.check_revision(repo, rev)['reason'], 'invalid-release-shape')

    def test_json_scalars_rejected(self):
        for data in ('null', 'false', '12', '"text"'):
            with self.subTest(data=data), lab.fresh_repo() as repo:
                repo.write('release.json', data); rev = repo.commit('Bad release')
                self.assertEqual(lab.check_revision(repo, rev)['reason'], 'invalid-release-shape')

    def test_missing_fields_rejected(self):
        with lab.fresh_repo() as repo:
            repo.write('release.json', '{}'); rev = repo.commit('Bad release')
            self.assertFalse(lab.check_revision(repo, rev)['accepted'])

    def test_import_no_execution_or_temp_creation(self):
        spec = importlib.util.spec_from_file_location('delivery_import_check', LAB / 'lab.py')
        module = importlib.util.module_from_spec(spec)
        with patch.object(subprocess, 'run') as run, patch.object(tempfile, 'TemporaryDirectory') as temp:
            spec.loader.exec_module(module)
        run.assert_not_called(); temp.assert_not_called()
        self.assertEqual(module.GIT_CANDIDATES, ('/usr/local/bin/git', '/usr/bin/git', '/bin/git'))

    def test_extra_field_rejected(self):
        with lab.fresh_repo() as repo:
            repo.write('release.json', '{"version":1,"feature":false,"other":0}\n'); rev = repo.commit('Bad release')
            self.assertFalse(lab.check_revision(repo, rev)['accepted'])

    def test_cleanup_success(self):
        with lab.fresh_repo() as repo: root = repo.root; self.assertTrue(root.exists())
        self.assertFalse(root.exists())

    def test_cleanup_failure(self):
        with self.assertRaises(RuntimeError):
            with lab.fresh_repo() as repo: root = repo.root; raise RuntimeError('injected')
        self.assertFalse(root.exists())

    def test_outside_sentinel_preserved(self):
        with tempfile.TemporaryDirectory() as folder:
            sentinel = Path(folder) / 'keep'; sentinel.write_text('outside')
            lab.run('recovery'); self.assertEqual(sentinel.read_text(), 'outside')

    def test_git_env_not_inherited(self):
        with patch.dict(os.environ, {'GIT_DIR': '/invalid', 'GIT_WORK_TREE': '/invalid', 'GIT_CONFIG_COUNT': '99', 'GIT_EXEC_PATH': '/invalid', 'GIT_SSH_COMMAND': 'false', 'LD_PRELOAD': '/invalid', 'PYTHONPATH': '/invalid', 'GIT_OBJECT_DIRECTORY': '/invalid', 'GIT_INDEX_FILE': '/invalid'}):
            result = lab.run('capstone'); self.assertTrue(result['result']['local_gate_passed'])

    def test_hostile_global_config_template_and_hooks_ignored(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); hooks = root / 'hooks'; hooks.mkdir(); marker = root / 'executed'
            hook = hooks / 'pre-commit'; hook.write_text('#!/bin/sh\nprintf BAD > "'+str(marker)+'"\nexit 1\n'); hook.chmod(0o700)
            config = root / '.gitconfig'; config.write_text('[core]\n hooksPath = '+str(hooks)+'\n[commit]\n gpgSign = true\n[init]\n templateDir = '+str(root)+'\n[credential]\n helper = !false\n')
            with patch.dict(os.environ, {'HOME': folder, 'XDG_CONFIG_HOME': folder, 'GIT_CONFIG_GLOBAL': str(config), 'GIT_CONFIG_SYSTEM': str(config), 'GIT_TEMPLATE_DIR': folder, 'GIT_CONFIG_COUNT': '1', 'GIT_CONFIG_KEY_0': 'core.hooksPath', 'GIT_CONFIG_VALUE_0': str(hooks)}):
                self.assertTrue(lab.run('capstone')['result']['local_gate_passed'])
            self.assertFalse(marker.exists()); self.assertTrue(config.exists())

    def test_tmpdir_not_inherited(self):
        with patch.dict(os.environ, {'TMPDIR': '/nonexistent/forbidden'}):
            with lab.fresh_repo() as repo: self.assertEqual(repo.root.parent, Path('/tmp'))

    def test_output_streams_owned_despite_hostile_tmpdir(self):
        original = tempfile.TemporaryFile
        with patch.dict(os.environ, {'TMPDIR': '/forbidden/nonexistent'}), patch.object(tempfile, 'TemporaryFile', wraps=original) as streams:
            with lab.fresh_repo() as repo: root = repo.root; self.assertTrue(repo.clean())
        self.assertGreater(len(streams.call_args_list), 0)
        for call in streams.call_args_list: self.assertEqual(call.kwargs['dir'], root)
        self.assertFalse(root.exists())

    def test_git_selector_prefers_first(self):
        with patch.object(Path, 'is_file', return_value=True), patch.object(os, 'access', return_value=True), patch.object(subprocess, 'run') as execute:
            self.assertEqual(lab.select_git(), '/usr/local/bin/git')
        execute.assert_not_called()

    def test_git_selector_falls_back_when_missing(self):
        with patch.object(Path, 'is_file', side_effect=[False, True]), patch.object(os, 'access', return_value=True), patch.object(subprocess, 'run') as execute:
            self.assertEqual(lab.select_git(), '/usr/bin/git')
        execute.assert_not_called()

    def test_git_selector_skips_nonexecutable(self):
        with patch.object(Path, 'is_file', return_value=True), patch.object(os, 'access', side_effect=[False, False, True]) as access, patch.object(subprocess, 'run') as execute:
            self.assertEqual(lab.select_git(), '/bin/git')
        self.assertEqual([call.args[1] for call in access.call_args_list], [os.X_OK]*3)
        execute.assert_not_called()

    def test_git_selector_no_valid_candidate(self):
        with patch.object(Path, 'is_file', return_value=False), patch.object(os, 'access') as access, patch.object(subprocess, 'run') as execute:
            self.assertIsNone(lab.select_git())
        access.assert_not_called(); execute.assert_not_called()

    def test_git_selector_ignores_hostile_path(self):
        with patch.dict(os.environ, {'PATH': '/attacker'}), patch.object(Path, 'is_file', return_value=True), patch.object(os, 'access', return_value=True), patch.object(subprocess, 'run') as execute:
            self.assertEqual(lab.select_git(), '/usr/local/bin/git')
        execute.assert_not_called()

    def test_git_missing_fails_closed(self):
        with patch.object(lab, 'select_git', return_value=None), self.assertRaises(lab.LabError): lab.run('snapshots')

    def test_timeout_fails_closed(self):
        with patch.object(lab.subprocess, 'run', side_effect=subprocess.TimeoutExpired('git', 10)), self.assertRaises(lab.LabError): lab.run('snapshots')

    def test_nonzero_fails_closed(self):
        with patch.object(lab.subprocess, 'run', return_value=subprocess.CompletedProcess([], 2)), self.assertRaises(lab.LabError): lab.run('snapshots')

    def test_output_limit(self):
        def too_much(*args, **kwargs):
            kwargs['stdout'].write(b'x'*(lab.LIMIT+1)); return subprocess.CompletedProcess([], 0)
        with patch.object(lab.subprocess, 'run', side_effect=too_much), self.assertRaises(lab.LabError): lab.run('snapshots')

    def test_stderr_limit(self):
        def too_much(*args, **kwargs):
            kwargs['stderr'].write(b'x'*(lab.LIMIT+1)); return subprocess.CompletedProcess([], 0)
        with patch.object(lab.subprocess, 'run', side_effect=too_much), self.assertRaises(lab.LabError): lab.run('snapshots')

    def test_subprocess_no_shell_timeout_stdin(self):
        original = lab.subprocess.run
        with patch.object(lab.subprocess, 'run', wraps=original) as call:
            lab.run('snapshots')
        for item in call.call_args_list:
            self.assertFalse(item.kwargs['shell']); self.assertEqual(item.kwargs['timeout'], lab.TIMEOUT); self.assertEqual(item.kwargs['stdin'], subprocess.DEVNULL)


class CLI(unittest.TestCase):
    def test_cli_valid(self):
        # Normal script invocation keeps its sibling module discoverable.
        p = subprocess.run([sys.executable, str(LAB / 'run_lab.py'), 'snapshots'], capture_output=True, text=True, timeout=20)
        self.assertEqual(p.returncode, 0, p.stderr); self.assertEqual(json.loads(p.stdout)['exercise'], 'snapshots')

    def test_cli_invalid(self):
        for args in ([], ['push'], ['snapshots', '/tmp'], ['--repo', '/tmp'], ['snapshots;echo BAD']):
            p = subprocess.run([sys.executable, str(LAB / 'run_lab.py'), *args], capture_output=True, text=True, timeout=20)
            self.assertEqual(p.returncode, 2); self.assertEqual(p.stdout, '')

    def test_cli_runtime_error_json(self):
        spec = importlib.util.spec_from_file_location('delivery_runner', LAB / 'run_lab.py')
        runner = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, {'lab': lab}): spec.loader.exec_module(runner)
        out, err = io.StringIO(), io.StringIO()
        with patch.object(lab, 'select_git', return_value=None), redirect_stdout(out), redirect_stderr(err):
            code = runner.main(['snapshots'])
        self.assertEqual(code, 1); self.assertEqual(out.getvalue(), '')
        evidence = json.loads(err.getvalue()); self.assertFalse(evidence['ok']); self.assertEqual(evidence['exercise'], 'snapshots')

    def test_cli_help(self):
        p = subprocess.run([sys.executable, str(LAB / 'run_lab.py'), '--help'], capture_output=True, text=True, timeout=20)
        self.assertEqual(p.returncode, 0)
        for name in lab.COMMANDS: self.assertIn(name, p.stdout)


if __name__ == '__main__': unittest.main()
