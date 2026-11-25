"""Prepare a new private Scrapbook successor candidate; never restore a workspace."""
import argparse
import copy
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import selectors
import stat
import subprocess
import sys
import tempfile
import time

if __name__ == '__main__':
    sys.dont_write_bytecode = True

from successor_review import LIMIT, PrivateParser, digest, evaluate_review, inspected_path, parse, same_json

UPGRADES = ('history', 'soundtracks', 'transforms', 'scopes', 'environment', 'targets', 'instances',
            'appearance', 'filters', 'origins', 'environments', 'blend-modes', 'music-precision')


def checked_binary(path, expected_sha):
    path = inspected_path(path)
    size = path.lstat().st_size
    if (not stat.S_ISREG(path.lstat().st_mode) or not 0 < size <= 256 * 1024 * 1024
            or not isinstance(expected_sha, str) or not re.fullmatch('[0-9a-f]{64}', expected_sha)):
        raise ValueError('A bounded, separately trusted native binary and SHA-256 are required.')
    with path.open('rb') as stream:
        actual = hashlib.file_digest(stream, 'sha256').hexdigest()
    if actual != expected_sha:
        raise ValueError('Native binary hash mismatch.')
    return path


def read_native_command(argv, folder, source=None):
    deadline = time.monotonic() + 20
    with subprocess.Popen(argv, cwd=folder,
                          stdin=source if source is not None else subprocess.DEVNULL,
                          env={'HOME': str(folder), 'LANG': 'C.UTF-8'},
                          stdout=subprocess.PIPE, stderr=subprocess.DEVNULL) as process:
        try:
            output = bytearray()
            with selectors.DefaultSelector() as ready:
                ready.register(process.stdout, selectors.EVENT_READ)
                while True:
                    if not ready.select(max(0, deadline - time.monotonic())):
                        raise ValueError('Native candidate command timed out.')
                    chunk = os.read(process.stdout.fileno(), min(64 * 1024, LIMIT + 1 - len(output)))
                    if not chunk:
                        break
                    output.extend(chunk)
                    if len(output) > LIMIT:
                        raise ValueError('Native output exceeds preview limit.')
            if process.wait(timeout=max(0, deadline - time.monotonic())):
                raise ValueError('Native candidate validation failed.')
            return bytes(output)
        finally:
            if process.poll() is None:
                process.kill()


def staged_readback(binary, binary_sha, payload):
    with tempfile.TemporaryDirectory(prefix='athena-scrapbook-candidate-') as name:
        folder = Path(name)
        staged_binary = folder / 'verified-native'
        flags = os.O_RDONLY | getattr(os, 'O_NOFOLLOW', 0) | getattr(os, 'O_NONBLOCK', 0)
        with os.fdopen(os.open(binary, flags), 'rb') as source, staged_binary.open('xb') as target:
            info = os.fstat(source.fileno())
            if not stat.S_ISREG(info.st_mode) or not 0 < info.st_size <= 256 * 1024 * 1024:
                raise ValueError('Native artifact changed during staging.')
            remaining = info.st_size
            while remaining:
                data = source.read(min(1024 * 1024, remaining))
                if not data:
                    raise ValueError('Native artifact changed during staging.')
                target.write(data)
                remaining -= len(data)
            if source.read(1):
                raise ValueError('Native artifact changed during staging.')
        checked_binary(staged_binary, binary_sha)
        staged_binary.chmod(0o700)
        db = folder / 'owned-disposable.sqlite'

        def native(command, source=None):
            return read_native_command([str(staged_binary), command, str(db)], folder, source)

        native('init')
        for name in UPGRADES:
            native('upgrade-' + name)
        with db.open('rb') as stream:
            if int.from_bytes(stream.read(100)[60:64], 'big') != 15:
                raise ValueError('Disposable native validation requires schema 15.')
        with tempfile.TemporaryFile(dir=folder) as source:
            source.write(payload)
            source.seek(0)
            native('save-backup', source)
        return parse(native('load-backup'))


def identity(info):
    return info.st_dev, info.st_ino


def write_payload(fd, payload):
    view = memoryview(payload)
    while view:
        n = os.write(fd, view)
        if n <= 0:
            raise OSError('Incomplete candidate staging write.')
        view = view[n:]


def publish_atomic(parent, expected_parent, name, payload):
    """Publish only via an atomic, no-replace hard link from private sibling staging."""
    directory_flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
    parent_fd = os.open(parent, directory_flags)
    stage_fd = file_fd = None
    stage_name = stage_identity = file_identity = None
    cleaned = True
    try:
        if identity(os.fstat(parent_fd)) != expected_parent:
            raise ValueError('Output parent was replaced.')
        for _ in range(4):
            token = '.athena-successor-' + secrets.token_hex(16)
            try:
                os.mkdir(token, 0o700, dir_fd=parent_fd)
            except FileExistsError:
                continue
            stage_name = token
            stage_identity = identity(os.stat(token, dir_fd=parent_fd, follow_symlinks=False))
            break
        if stage_name is None:
            raise ValueError('Cannot reserve private same-directory candidate staging.')
        stage_fd = os.open(stage_name, directory_flags, dir_fd=parent_fd)
        info = os.fstat(stage_fd)
        if identity(info) != stage_identity or info.st_uid != os.geteuid():
            raise ValueError('Staging directory identity changed.')
        os.fchmod(stage_fd, 0o700)
        flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW
        file_fd = os.open('payload', flags, 0o600, dir_fd=stage_fd)
        file_identity = identity(os.fstat(file_fd))
        os.fchmod(file_fd, 0o600)
        write_payload(file_fd, payload)
        if os.fstat(file_fd).st_size != len(payload):
            raise ValueError('Staged candidate length does not match.')
        os.fsync(file_fd)
        finished_fd, file_fd = file_fd, None
        os.close(finished_fd)
        # Refuse renamed/swapped paths noticed during the operation; keep directory
        # descriptors for all actual lookups and never resolve the target by path.
        if identity(parent.lstat()) != expected_parent or identity(
                os.stat(stage_name, dir_fd=parent_fd, follow_symlinks=False)) != stage_identity or identity(
                os.stat('payload', dir_fd=stage_fd, follow_symlinks=False)) != file_identity:
            raise ValueError('Output or staging path changed.')
        os.link('payload', name, src_dir_fd=stage_fd, dst_dir_fd=parent_fd, follow_symlinks=False)
    finally:
        def close_owned(fd):
            nonlocal cleaned
            try:
                os.close(fd)
            except OSError:
                cleaned = False

        if file_fd is not None:
            close_owned(file_fd)
        if stage_fd is not None:
            if file_identity is not None:
                try:
                    if identity(os.stat('payload', dir_fd=stage_fd, follow_symlinks=False)) == file_identity:
                        os.unlink('payload', dir_fd=stage_fd)
                    else:
                        cleaned = False
                except OSError:
                    cleaned = False
            close_owned(stage_fd)
        if stage_name is not None and stage_identity is not None:
            try:
                if identity(os.stat(stage_name, dir_fd=parent_fd, follow_symlinks=False)) == stage_identity:
                    os.rmdir(stage_name, dir_fd=parent_fd)
                else:
                    cleaned = False
            except OSError:
                cleaned = False
        close_owned(parent_fd)
    return cleaned


def prepare(previous, incoming, current, receipt, catalog, binary, binary_sha, output):
    if os.name != 'posix':
        raise ValueError('Private candidate creation requires POSIX 0600 mode.')
    # File-only, absolute local inputs, no original SQLite path accepted.
    output = Path(output).absolute()
    parent = inspected_path(output.parent)
    if not parent.is_dir() or os.path.lexists(output) or '..' in output.parts:
        raise ValueError('Select a new output file in an existing local directory.')
    parent_id = identity(parent.lstat())
    for bundle in (previous, incoming):
        if output.is_relative_to(inspected_path(bundle)):
            raise ValueError('Output must be outside both reviewed bundles.')
    binary = checked_binary(binary, binary_sha)
    report, workspace, room, incoming_version, placements, recheck = evaluate_review(
        previous, incoming, current, receipt, catalog)
    workspace = copy.deepcopy(workspace)
    layout = copy.deepcopy(workspace['layouts'][room])
    layout['placements'] = placements
    layout['version'] = max(layout['version'], incoming_version)
    workspace['layouts'][room] = layout
    if workspace['active']['roomId'] == room:
        workspace['active'] = layout
    workspace['version'] = max(workspace['version'], layout['version'])
    payload = json.dumps(workspace, ensure_ascii=True, separators=(',', ':'), allow_nan=False).encode()
    if len(payload) > LIMIT:
        raise ValueError('Candidate would exceed the reviewed byte limit.')
    if not same_json(staged_readback(binary, binary_sha, payload), workspace):
        raise ValueError('Native save/reopen would normalize or drop candidate fields.')
    recheck()
    checked_binary(binary, binary_sha)
    staged_cleanup = publish_atomic(parent, parent_id, output.name, payload)
    return {'schema': 1, 'kind': 'athena-scrapbook-successor-candidate',
            'counts': report['counts'], 'candidateSha256': digest(payload), 'nativeRoundTrip': True,
            'stagingCleaned': staged_cleanup, 'applied': False, 'sourceRetirementSafe': False}


def main():
    parser = PrivateParser(description=__doc__)
    for key in ('prior-bundle', 'incoming-bundle', 'current-workspace', 'receipt', 'catalog',
                'native-binary', 'new-candidate'):
        parser.add_argument('--' + key, required=True, type=Path)
    parser.add_argument('--native-binary-sha256', required=True)
    a = parser.parse_args()
    try:
        result = prepare(a.prior_bundle, a.incoming_bundle, a.current_workspace, a.receipt, a.catalog,
                         a.native_binary, a.native_binary_sha256, a.new_candidate)
    except (OSError, TypeError, ValueError, KeyError, AttributeError, OverflowError, RecursionError,
            subprocess.SubprocessError, NotImplementedError):
        print(json.dumps({'error': 'Candidate refused or incomplete. Keep all originals and inspect any new output before retrying. Nothing was applied.'}))
        return 2
    print(json.dumps(result))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
