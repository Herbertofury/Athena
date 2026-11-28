#!/usr/bin/env python3
"""Verify retained Atlas source completeness without claiming product acceptance."""
import hashlib
import json
import os
import re
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = Path('migration/engineering-atlas/cutover-2026-11-13')

def inspect_git(directory, *args):
    env = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
    env.update(GIT_ALLOW_PROTOCOL='file', GIT_TERMINAL_PROMPT='0',
               GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL=os.devnull,
               GIT_OPTIONAL_LOCKS='0')
    return subprocess.run(['git', '-C', str(directory), *args], check=True, env=env,
                          capture_output=True, timeout=45).stdout


def stage_bundle(source, destination, record):
    size, digest = record['bytes'], record['sha256']
    if (type(size) is not int or not 0 < size <= 32 * 1024 * 1024
            or not isinstance(digest, str) or not re.fullmatch(r'[0-9a-f]{64}', digest)
            or source.is_symlink() or not source.is_file() or source.stat().st_size != size):
        raise ValueError('Retained bundle size or checksum metadata mismatch')
    with source.open('rb') as file:
        data = file.read(size + 1)
    if len(data) != size or hashlib.sha256(data).hexdigest() != digest:
        raise ValueError('Retained bundle digest mismatch')
    destination.write_bytes(data)


def retained_refs(entries, *, wiki=False):
    expected = {}
    pattern = r'refs/(?:heads|tags)/[A-Za-z0-9._/-]+' if wiki else r'refs/(?:(?:heads|tags)/[A-Za-z0-9._/-]+|pull/[1-9][0-9]*/(?:head|merge))'
    for entry in entries:
        ref, oid = entry['ref'], entry['sha']
        if (not re.fullmatch(pattern, ref) or not re.fullmatch(r'[0-9a-f]{40}', oid)
                or ref in expected):
            raise ValueError('Invalid or duplicate retained ref')
        expected[ref] = oid
    return expected


def restored_refs(directory):
    output = inspect_git(directory, 'for-each-ref', '--format=%(refname) %(objectname)')
    return dict(row.split() for row in output.decode('ascii').splitlines())


def source_tree(directory, revision):
    entries = inspect_git(directory, 'ls-tree', '-r', '-z', '--full-tree', revision)
    tree = {}
    for entry in entries.split(b'\0')[:-1]:
        metadata, path = entry.split(b'\t', 1)
        _, kind, oid = metadata.split()
        if kind != b'blob':
            raise ValueError(f'Unsupported source tree entry: {path!r} ({kind!r})')
        tree[path] = oid.decode('ascii')
    return tree

def verify(root=ROOT, *, include_wiki=False):
    manifest = json.loads((root / SNAPSHOT / 'source-manifest.json').read_text())
    rows = manifest['files']
    seen = set()
    for row in rows:
        path = root / row['athena_path']
        if row['source_path'] in seen or not path.resolve().is_relative_to(root.resolve()):
            raise ValueError('Duplicate or unsafe manifest path')
        seen.add(row['source_path'])
        if not path.is_file():
            raise ValueError(f'Missing migrated file: {path}')
        if row['relation'] not in ('exact', 'athena-adapted'):
            raise ValueError(f'Unresolved migration: {path}')
    # Current implementation can evolve. The source bytes and every source ref
    # must remain recoverable even after subsequent intentional destination edits.
    archive = root / SNAPSHOT.parent
    pins = json.loads((archive / 'file-manifest.json').read_text(encoding='utf-8'))['archives']
    supplement = json.loads((root / SNAPSHOT / 'public-provenance.json').read_text(encoding='utf-8'))
    refs = retained_refs(json.loads((root / SNAPSHOT / 'source-refs.json').read_text(encoding='utf-8')))
    revision = manifest['source_revision']
    if refs.get('refs/heads/main') != revision:
        raise ValueError('Manifest revision does not match retained source main')
    with tempfile.TemporaryDirectory() as tmp:
        scratch = Path(tmp)
        directory = scratch / 'source.git'
        bundle = scratch / 'base.bundle'
        delta = scratch / 'delta.bundle'
        name = 'engineering-atlas-history.bundle'
        stage_bundle(archive / name, bundle, pins[name])
        stage_bundle(root / SNAPSHOT / 'history-delta.bundle', delta,
                     dict(bytes=supplement['bundle_bytes'], sha256=supplement['bundle_sha256']))
        inspect_git(scratch, '-c', 'core.hooksPath=' + os.devnull, 'clone', '--mirror', '--', str(bundle), str(directory))
        inspect_git(directory, 'bundle', 'verify', str(bundle))
        inspect_git(directory, 'bundle', 'verify', str(delta))
        inspect_git(directory, 'fetch', str(delta), '+refs/*:refs/*')
        inspect_git(directory, 'fsck', '--full', '--no-reflogs')
        if restored_refs(directory) != refs:
            raise ValueError('Restored ref set or identity differs from the complete inventory')
        tracked = source_tree(directory, revision)
        if tracked.keys() != {path.encode('utf-8') for path in seen}:
            raise ValueError('Source tree inventory mismatch')
        for row in rows:
            oid = tracked[row['source_path'].encode('utf-8')]
            if oid != row['source_blob']:
                raise ValueError(f'Source path/blob mismatch: {row["source_path"]}')
            data = inspect_git(directory, 'cat-file', 'blob', oid)
            if len(data) != row['bytes']:
                raise ValueError(f'Source byte count mismatch: {row["source_path"]}')
            if hashlib.sha256(data).hexdigest() != row['source_sha256']:
                raise ValueError(f'Source hash mismatch: {row["source_path"]}')
    result = {'source_revision':manifest['source_revision'],'files':len(rows),'refs':len(refs),'source_recovery':'verified','native_acceptance':'not established by this check'}
    if include_wiki:
        result['wiki_recovery'] = verify_wiki(root, verified_source={
            row['source_path']: row['source_sha256'] for row in rows
        })
    return result

def wiki_page_path(name):
    if not isinstance(name, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,200}', name):
        raise ValueError('Invalid wiki page name')
    return name + '.md'


def wiki_file(root, name):
    path = root / name
    if root.is_symlink() or path.is_symlink() or not path.is_file():
        raise ValueError(f'Missing or unsafe wiki page: {name}')
    return path.read_bytes()


def verify_wiki(root=ROOT, *, verified_source):
    """Compare the pinned source Wiki and separately preserved App Study pages."""
    archive = root / SNAPSHOT.parent
    pinned = json.loads((archive / 'wiki-refs.json').read_text(encoding='utf-8'))
    expected = retained_refs(pinned, wiki=True)
    revision = expected.get('refs/heads/master')
    if not revision:
        raise ValueError('Missing retained Wiki master ref')

    wiki_hashes = {}
    snapshot = archive / 'wiki'
    with tempfile.TemporaryDirectory() as tmp:
        scratch = Path(tmp)
        directory = scratch / 'wiki.git'
        name = 'engineering-atlas-wiki-history.bundle'
        pins = json.loads((archive / 'file-manifest.json').read_text(encoding='utf-8'))['archives']
        bundle = scratch / 'wiki.bundle'
        stage_bundle(archive / name, bundle, pins[name])
        inspect_git(scratch, '-c', 'core.hooksPath=' + os.devnull, 'clone', '--mirror', '--', str(bundle), str(directory))
        inspect_git(directory, 'bundle', 'verify', str(bundle))
        inspect_git(directory, 'fsck', '--full', '--no-reflogs')
        if restored_refs(directory) != expected:
            raise ValueError('Retained Wiki refs do not match inventory')

        for raw_name, oid in source_tree(directory, revision).items():
            name = raw_name.decode('utf-8')
            if not name.endswith('.md') or wiki_page_path(name[:-3]) != name:
                raise ValueError('Unexpected retained Wiki entry')
            source = inspect_git(directory, 'cat-file', 'blob', oid)
            if source != wiki_file(snapshot, name):
                raise ValueError(f'Archived Wiki bytes differ from source: {name}')
            wiki_hashes[name] = hashlib.sha256(source).hexdigest()

    if set(wiki_hashes) != {p.name for p in snapshot.iterdir()}:
        raise ValueError('Archived Wiki inventory differs from source')

    # App Study kept its Wiki-form content in the source code repository.
    # Its README, navigation notes and manifest are not user-facing Wiki pages.
    app_study = {
        path.removeprefix('docs/wiki-app-study/'): digest for path, digest in verified_source.items()
        if re.fullmatch(r'docs/wiki-app-study/App-Study(?:-[A-Za-z0-9_-]+)?\.md', path)
    }
    rows = json.loads((archive / 'wiki-page-map.json').read_text(encoding='utf-8'))
    mapped, destinations = set(), set()
    evolved = 0
    for row in rows:
        name, destination = map(wiki_page_path, (row['source_name'], row['athena_page']))
        if name in mapped or destination in destinations:
            raise ValueError('Duplicate Wiki source or destination')
        mapped.add(name)
        destinations.add(destination)
        digest = wiki_hashes.get(name) or app_study.get(name)
        if digest is None or digest != row['source_sha256']:
            raise ValueError(f'Wiki source digest mismatch or unsupported source: {name}')
        expected_digest = row['destination_sha256']
        if not re.fullmatch(r'[0-9a-f]{64}', expected_digest):
            raise ValueError('Invalid Wiki destination digest')
        if hashlib.sha256(wiki_file(root / 'wiki', destination)).hexdigest() != expected_digest:
            evolved += 1  # Athena pages can intentionally evolve after migration.
    if mapped != set(wiki_hashes) | set(app_study):
        raise ValueError('Wiki map does not cover every retained source page')

    return {
        'source_wiki_revision': revision,
        'source_wiki_pages': len(wiki_hashes),
        'source_repository_pages': len(mapped - wiki_hashes.keys()),
        'athena_pages': len(destinations),
        'athena_pages_changed_since_cutover': evolved,
        'live_wiki_acceptance': 'not established by this check',
    }


if __name__ == '__main__':
    print(json.dumps(verify(include_wiki=True), indent=2))
