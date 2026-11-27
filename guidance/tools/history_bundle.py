#!/usr/bin/env python3
"""Create and independently restore a selected local Git history bundle. No network."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

def git(repo, *args):
    env = dict(os.environ, GIT_NO_REPLACE_OBJECTS='1', GIT_TERMINAL_PROMPT='0', GIT_NO_LAZY_FETCH='1')
    # Ignore caller repository redirections; never check out files or run source code.
    for name in ('GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES'):
        env.pop(name, None)
    result = subprocess.run(['git', '-C', str(repo), *args], env=env,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
    if result.returncode:
        raise ValueError('Git history operation failed')
    return result.stdout

def refs(repo):
    rows = git(repo, 'for-each-ref', '--format=%(objectname) %(refname)').decode('utf-8').splitlines()
    return sorted(rows)

def head(repo):
    return git(repo, 'rev-parse', '--verify', 'HEAD').decode().strip()

def checksum(path):
    value = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(chunk)
    return value.hexdigest()

def publish_new(staged, output):
    """Publish a complete verified file only, without replacing any destination."""
    staged.chmod(0o600)
    # Windows rename is exclusive and needs no hard-link feature (e.g. exFAT).
    # POSIX rename can overwrite an existing name, so keep the exclusive link.
    # Each caller stages inside the destination parent; never use a copy fallback.
    if os.name == 'nt':
        os.rename(staged, output)
    else:
        os.link(staged, output)

def create(source, output):
    source = source.resolve()
    output = output.absolute()
    if output.parent.resolve().is_relative_to(source):
        raise ValueError("Output must be outside the selected source")
    if output.exists() or output.is_symlink():
        raise ValueError('Existing output refused')
    if git(source, 'rev-parse', '--is-shallow-repository').strip() != b'false':
        raise ValueError('Shallow history cannot qualify')
    # Replacements/grafts can change history interpretation; reject rather than imply fidelity.
    if git(source, 'for-each-ref', '--format=%(refname)', 'refs/replace').strip():
        raise ValueError('Replacement refs require separate review')
    graft = Path(git(source, 'rev-parse', '--git-path', 'info/grafts').decode().strip())
    if not graft.is_absolute(): graft = source / graft
    if graft.exists(): raise ValueError('Grafts require separate review')
    object_format = git(source, 'rev-parse', '--show-object-format').decode().strip()
    if object_format not in ('sha1', 'sha256'): raise ValueError('Unsupported object format')
    before, original_head = refs(source), head(source)
    with tempfile.TemporaryDirectory(prefix='athena-history-', dir=output.parent) as temporary:
        temp = Path(temporary)
        bundle = temp / 'history.bundle'
        git(source, 'bundle', 'create', str(bundle), '--all', 'HEAD')
        restored = temp / 'restored.git'; restored.mkdir()
        git(restored, 'init', '--bare', '--quiet', '--object-format=' + object_format)
        git(restored, 'bundle', 'verify', str(bundle))
        git(restored, '-c', 'protocol.file.allow=always', 'fetch', '--no-tags', str(bundle), 'refs/*:refs/*', 'HEAD')
        git(restored, 'update-ref', '--no-deref', 'HEAD', original_head)
        git(restored, 'fsck', '--full', '--strict')
        if refs(restored) != before or head(restored) != original_head:
            raise ValueError('Restored references differ')
        if refs(source) != before or head(source) != original_head:
            raise ValueError('Source references changed during capture')
        digest = checksum(bundle)
        size = bundle.stat().st_size
        publish_new(bundle, output)
        if checksum(output) != digest:
            raise ValueError('Published local bundle verification failed')
    return {'schemaVersion': 1, 'head': original_head, 'refCount': len(before),
            'bundleBytes': size, 'bundleSha256': digest, 'independentBareRestore': True,
            'objectConnectivityVerified': True, 'sourceRefsUnchanged': True,
            'scope': 'Locally available refs and HEAD only; no remote freshness or hosted artifact claim.',
            'limitations': ['Working changes, reflogs, unreachable objects, Git LFS content, submodule repositories, wiki and release assets are not preserved by this bundle.',
                           'Bundle refs preserve object IDs, not symbolic-ref aliases or branch checkout configuration; restored HEAD is detached.',
                           'No source execution, network fetch, public upload or source retirement authorization.',
                           'Keep bundle private until full history rights/private-data review; this local file is not a durable off-machine backup.'],
            'retirementReady': False}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(create(args.source, args.output), indent=2)); return 0
    except (OSError, ValueError, subprocess.SubprocessError):
        print(json.dumps({'error': 'Local history preservation failed; preserve source and inspect available disk, Git history and output path. No existing output was overwritten.', 'retirementReady': False})); return 2

if __name__ == '__main__': raise SystemExit(main())
