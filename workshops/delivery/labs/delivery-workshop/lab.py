"""Fixed, synthetic Git demonstrations. This is not an arbitrary-code sandbox."""
from contextlib import contextmanager
import hashlib
import io
import json
import os
import platform
from pathlib import Path
import re
import subprocess
import tarfile
import tempfile

COMMANDS = ('snapshots', 'staging', 'branches', 'conflict', 'recovery', 'revision-tests', 'provenance', 'capstone')
FILES = ('README.txt', 'release.json', 'notes.txt')
BASE = {'README.txt': 'Synthetic delivery workshop. No production deployment.\n',
        'release.json': '{"feature": false, "version": 1}\n',
        'notes.txt': 'Decision: baseline\n'}
SHA = re.compile(r'[0-9a-f]{40}')
LIMIT = 65536
TIMEOUT = 10
# Ignore inherited PATH as well as Git configuration. Only installed system locations.
GIT_CANDIDATES = ('/usr/local/bin/git', '/usr/bin/git', '/bin/git')


def select_git():
    for candidate in GIT_CANDIDATES:
        if Path(candidate).is_file() and os.access(candidate, os.X_OK):
            return candidate
    return None

FIXED = {
 ('--version',), ('log', '-1', '--format=%an <%ae>'),
 ('init', '--initial-branch=main', '--object-format=sha1'),
 ('add', '--', *FILES), ('add', '--', 'notes.txt'), ('add', '--', 'release.json'),
 ('status', '--porcelain=v1', '--untracked-files=all'),
 ('diff', '--no-ext-diff', '--no-textconv', '--', 'notes.txt'),
 ('diff', '--cached', '--no-ext-diff', '--no-textconv', '--', 'notes.txt'),
 ('switch', '-c', 'feature'), ('switch', 'main'), ('branch', '--list'),
 ('merge', '--no-ff', '--no-edit', 'feature'),
 ('rev-parse', 'HEAD'), ('rev-parse', 'HEAD^{tree}'),
 ('log', '--format=%H', '--all'), ('log', '-1', '--format=%P'),
 ('ls-files', '-z'), ('ls-files', '--unmerged'),
}
MESSAGES = ('Baseline', 'Snapshot two', 'Stage selected version', 'Feature change', 'Main change', 'Resolve decision explicitly', 'Bad release', 'Prepare tested release')
FIXED |= {('commit', '-m', m) for m in MESSAGES}

class LabError(RuntimeError):
    """An exercise could not meet its evidence contract."""


def allowed(args):
    if tuple(args) in FIXED:
        return True
    if len(args) == 2 and args[0] == 'show':
        rev, sep, filename = args[1].partition(':')
        return bool(sep and SHA.fullmatch(rev) and filename in FILES)
    return bool(len(args) == 3 and args[:2] == ('revert', '--no-edit') and SHA.fullmatch(args[2]))


def isolated_env(root):
    return {'PATH': os.defpath, 'HOME': str(root / 'home'), 'XDG_CONFIG_HOME': str(root / 'home'),
            'LC_ALL': 'C', 'LANG': 'C', 'TZ': 'UTC',
            'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_SYSTEM': os.devnull,
            'GIT_CONFIG_GLOBAL': os.devnull, 'GIT_TERMINAL_PROMPT': '0',
            'GIT_ALLOW_PROTOCOL': '', 'GIT_NO_REPLACE_OBJECTS': '1',
            'GIT_ATTR_NOSYSTEM': '1', 'GIT_AUTHOR_NAME': 'Synthetic Learner',
            'GIT_AUTHOR_EMAIL': 'learner@example.invalid', 'GIT_COMMITTER_NAME': 'Synthetic Learner',
            'GIT_COMMITTER_EMAIL': 'learner@example.invalid',
            'GIT_AUTHOR_DATE': '2026-01-01T00:00:00+0000', 'GIT_COMMITTER_DATE': '2026-01-01T00:00:00+0000'}


class Repo:
    def __init__(self, root):
        self.executable = select_git()
        self.root = root
        self.path = root / 'repo'
        self.path.mkdir()
        (root / 'home').mkdir()
        (root / 'empty').mkdir()
        self.env = isolated_env(root)
        self.calls = []

    def git(self, *args, conflict=False):
        if not allowed(args):
            raise ValueError('Only fixed teaching Git operations are allowed')
        if not self.executable:
            raise LabError('Git is required; install it from its official source')
        options = ['-c', 'core.hooksPath=' + str(self.root / 'empty'),
                   '-c', 'init.templateDir=' + str(self.root / 'empty'),
                   '-c', 'credential.helper=', '-c', 'commit.gpgSign=false',
                   '-c', 'tag.gpgSign=false', '-c', 'core.autocrlf=false',
                   '-c', 'core.attributesFile=' + os.devnull, '-c', 'core.excludesFile=' + os.devnull,
                   '-c', 'core.fsmonitor=false', '-c', 'maintenance.auto=false', '-c', 'gc.auto=0',
                   '-c', 'protocol.allow=never', '-c', 'merge.autoStash=false', '-c', 'rerere.enabled=false']
        # Fixed commands/data produce small output. Temporary streams avoid unbounded RAM capture.
        with tempfile.TemporaryFile(dir=self.root) as out, tempfile.TemporaryFile(dir=self.root) as err:
            try:
                process = subprocess.run([self.executable, *options, *args], cwd=self.path, env=self.env,
                                         stdin=subprocess.DEVNULL, stdout=out, stderr=err,
                                         shell=False, timeout=TIMEOUT, check=False)
            except (OSError, subprocess.TimeoutExpired) as exc:
                raise LabError('Git execution failed or timed out') from exc
            out.seek(0); err.seek(0)
            stdout, stderr = out.read(LIMIT + 1), err.read(LIMIT + 1)
        if len(stdout) > LIMIT or len(stderr) > LIMIT:
            raise LabError('Git output exceeded teaching limit')
        if process.returncode and not (conflict and args == ('merge', '--no-ff', '--no-edit', 'feature') and process.returncode == 1):
            raise LabError('Git operation failed: ' + args[0])
        self.calls.append({'operation': args[0], 'returncode': process.returncode})
        text = stdout.decode('utf-8', errors='strict')
        return text if args[0] == 'show' else text.rstrip('\n')

    def write(self, name, content):
        if name not in FILES or not isinstance(content, str) or len(content.encode()) > 4096:
            raise ValueError('Fixed small teaching file required')
        (self.path / name).write_text(content, encoding='utf-8', newline='\n')

    def commit(self, message):
        self.git('add', '--', *FILES)
        self.git('commit', '-m', message)
        return self.head()

    def head(self):
        value = self.git('rev-parse', 'HEAD')
        if not SHA.fullmatch(value):
            raise LabError('Expected full SHA-1 revision')
        return value

    def clean(self):
        return not self.git('status', '--porcelain=v1', '--untracked-files=all')

    def read_revision(self, revision, filename):
        return self.git('show', revision + ':' + filename)


@contextmanager
def fresh_repo():
    # No caller paths, no inherited TMPDIR, and only this owned directory is cleaned.
    temp_base = '/tmp' if os.name == 'posix' else None
    with tempfile.TemporaryDirectory(prefix='athena-delivery-', dir=temp_base) as directory:
        repo = Repo(Path(directory))
        repo.git('init', '--initial-branch=main', '--object-format=sha1')
        for name, content in BASE.items():
            repo.write(name, content)
        repo.commit('Baseline')
        yield repo


def snapshots(repo):
    before = repo.head()
    repo.write('notes.txt', 'Decision: reviewed\n')
    after = repo.commit('Snapshot two')
    return {'before': before, 'after': after, 'old_content': repo.read_revision(before, 'notes.txt'),
            'new_content': repo.read_revision(after, 'notes.txt'), 'clean': repo.clean()}


def staging(repo):
    repo.write('notes.txt', 'Decision: staged\n')
    repo.git('add', '--', 'notes.txt')
    repo.write('notes.txt', 'Decision: unstaged follow-up\n')
    status = repo.git('status', '--porcelain=v1', '--untracked-files=all')
    staged = repo.git('diff', '--cached', '--no-ext-diff', '--no-textconv', '--', 'notes.txt')
    unstaged = repo.git('diff', '--no-ext-diff', '--no-textconv', '--', 'notes.txt')
    repo.git('commit', '-m', 'Stage selected version')
    return {'status_before': status, 'staged_diff': staged, 'unstaged_diff': unstaged,
            'committed_content': repo.read_revision(repo.head(), 'notes.txt'),
            'working_content': (repo.path / 'notes.txt').read_text(), 'clean': repo.clean()}


def branches(repo, collide=False):
    base = repo.head()
    repo.git('switch', '-c', 'feature')
    repo.write('notes.txt', 'Decision: feature\n')
    feature = repo.commit('Feature change')
    repo.git('switch', 'main')
    repo.write('notes.txt' if collide else 'release.json', 'Decision: main\n' if collide else '{"feature": false, "version": 2}\n')
    main = repo.commit('Main change')
    repo.git('merge', '--no-ff', '--no-edit', 'feature', conflict=collide)
    unmerged = repo.git('ls-files', '--unmerged')
    markers = (repo.path / 'notes.txt').read_text()
    if collide:
        if not unmerged or '<<<<<<< HEAD' not in markers:
            raise LabError('Expected a real same-line merge conflict')
        repo.write('notes.txt', 'Decision: feature and main reviewed together\n')
        repo.commit('Resolve decision explicitly')
    elif unmerged:
        raise LabError('Unexpected merge conflict')
    return {'base': base, 'feature': feature, 'main_before_merge': main, 'merged': repo.head(),
            'parents': repo.git('log', '-1', '--format=%P').split(),
            'branches': repo.git('branch', '--list').splitlines(),
            'conflict_observed': bool(unmerged), 'unmerged_before': unmerged,
            'conflict_markers': markers if collide else None,
            'unmerged_after': repo.git('ls-files', '--unmerged'),
            'resolved_content': (repo.path / 'notes.txt').read_text(),
            'release_content': repo.read_revision(repo.head(), 'release.json'), 'clean': repo.clean()}


def recovery(repo):
    baseline = repo.head()
    repo.write('release.json', '{"feature": true, "version": -1}\n')
    bad = repo.commit('Bad release')
    repo.git('revert', '--no-edit', bad)
    baseline_content = repo.read_revision(baseline, 'release.json')
    restored_content = repo.read_revision(repo.head(), 'release.json')
    return {'baseline': baseline, 'bad': bad, 'revert': repo.head(),
            'history': repo.git('log', '--format=%H', '--all').splitlines(),
            'baseline_content': baseline_content, 'restored_content': restored_content,
            'baseline_restored': baseline_content == restored_content, 'clean': repo.clean()}


def check_revision(repo, expected):
    if not isinstance(expected, str) or not SHA.fullmatch(expected):
        raise ValueError('A full lowercase revision is required')
    actual = repo.head()
    if not repo.clean():
        return {'accepted': False, 'reason': 'dirty-worktree', 'expected_revision': expected, 'actual_revision': actual}
    if actual != expected:
        return {'accepted': False, 'reason': 'revision-mismatch', 'expected_revision': expected, 'actual_revision': actual}
    # Execute fixed Python assertions on committed data; never import or execute repository code.
    try:
        release = json.loads(repo.read_revision(actual, 'release.json'))
    except json.JSONDecodeError:
        return {'accepted': False, 'reason': 'invalid-release-json',
                'expected_revision': expected, 'actual_revision': actual}
    if not isinstance(release, dict):
        return {'accepted': False, 'reason': 'invalid-release-shape',
                'expected_revision': expected, 'actual_revision': actual}
    checks = {'exact_fields': set(release) == {'feature', 'version'},
              'version_positive_integer': type(release.get('version')) is int and release['version'] > 0,
              'feature_boolean': type(release.get('feature')) is bool}
    tree = repo.git('rev-parse', 'HEAD^{tree}')
    final_head, final_clean = repo.head(), repo.clean()
    if final_head != expected:
        reason = 'revision-changed-during-check'
    elif not final_clean:
        reason = 'dirty-worktree-after-check'
    else:
        reason = 'passed' if all(checks.values()) else 'assertion-failed'
    return {'accepted': reason == 'passed', 'reason': reason,
            'expected_revision': expected, 'actual_revision': actual, 'checks': checks,
            'postcheck_revision': final_head, 'tree': tree, 'clean': final_clean,
            'runner': 'fixed stdlib data assertions'}


def revision_tests(repo):
    before = repo.head()
    good = check_revision(repo, before)
    repo.write('notes.txt', 'Decision: dirty\n')
    dirty = check_revision(repo, before)
    after = repo.commit('Prepare tested release')
    mismatch = check_revision(repo, before)
    new = check_revision(repo, after)
    repo.write('release.json', '{"feature": true, "version": -1}\n')
    bad = repo.commit('Bad release')
    failed = check_revision(repo, bad)
    return {'baseline_pass': good, 'dirty_rejected': dirty, 'mismatch_rejected': mismatch,
            'new_revision_pass': new, 'bad_release_rejected': failed}


def source_artifact(repo, revision):
    if not SHA.fullmatch(revision) or revision != repo.head() or not repo.clean():
        raise LabError('Artifact requires exact clean current revision')
    tracked = repo.git('ls-files', '-z').split('\0')
    tracked = [name for name in tracked if name]
    if sorted(tracked) != sorted(FILES):
        raise LabError('Unexpected tracked teaching files')
    manifest = []
    archive = io.BytesIO()
    with tarfile.open(fileobj=archive, mode='w', format=tarfile.USTAR_FORMAT) as tar:
        for name in sorted(tracked):
            data = repo.read_revision(revision, name).encode('utf-8')
            manifest.append({'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
            info = tarfile.TarInfo(name)
            info.size = len(data); info.mode = 0o644; info.mtime = 0; info.uid = 0; info.gid = 0
            tar.addfile(info, io.BytesIO(data))
    return archive.getvalue(), manifest


def provenance(repo):
    revision = repo.head()
    first, manifest = source_artifact(repo, revision)
    second, _ = source_artifact(repo, revision)
    expected = hashlib.sha256(first).hexdigest()
    tampered = first[:512] + bytes([first[512] ^ 1]) + first[513:]
    return {'revision': revision, 'tree': repo.git('rev-parse', 'HEAD^{tree}'), 'manifest': manifest,
            'archive_format': 'uncompressed USTAR', 'archive_bytes': len(first), 'sha256': expected,
            'repeat_identical': first == second, 'tampered_sha256': hashlib.sha256(tampered).hexdigest(),
            'tamper_detected': hashlib.sha256(tampered).hexdigest() != expected,
            'authenticated': False, 'limitation': 'A digest detects changes against a trusted reference; it does not authenticate an author or publisher.'}


def capstone(repo):
    merge = branches(repo)
    revision = repo.head()
    tests = check_revision(repo, revision)
    artifact = provenance(repo)
    if not tests['accepted'] or tests['actual_revision'] != artifact['revision']:
        raise LabError('Capstone release gate failed')
    return {'merge': merge, 'tests': tests, 'artifact': artifact,
            'local_gate_passed': True, 'remote_publication': False, 'production_deployment': False}


def run(name):
    if not isinstance(name, str) or name not in COMMANDS:
        raise ValueError('Choose one fixed exercise')
    with fresh_repo() as repo:
        result = branches(repo, True) if name == 'conflict' else {
            'snapshots': snapshots, 'staging': staging, 'branches': branches, 'recovery': recovery,
            'revision-tests': revision_tests, 'provenance': provenance, 'capstone': capstone
        }[name](repo)
        runtime = {'python_version': platform.python_version(),
                   'git_version': repo.git('--version'), 'git_executable': repo.executable,
                   'observed_head_author': repo.git('log', '-1', '--format=%an <%ae>')}
        operations = list(repo.calls)
    return {'exercise': name, 'execution': 'actual local Git on synthetic teaching files',
            'result': result, 'runtime': runtime, 'operations': operations, 'temporary_repository_cleaned': True,
            'network_used': False, 'user_repository_used': False}
