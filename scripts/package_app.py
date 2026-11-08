"""Package one Athena document with its workspace modules. No deployment or settings changes."""
import argparse
import hashlib
import json
import pathlib
import re
import shutil
import tempfile

REQUIRED = ('index.html', 'app.js', 'core.js', 'catalog.js', 'styles.css', 'workspace-host.js',
            'workspaces/engineering/research/index.mjs', 'workspaces/engineering/research/style.css',
            'workspaces/engineering/media/index.mjs', 'workspaces/engineering/media/style.css',
            'workspaces/engineering/lab/index.mjs', 'workspaces/engineering/lab/style.css',
            'workspaces/engineering/lab/archive-view.mjs', 'workspaces/engineering/lab/collection-input.mjs',
            'workspaces/engineering/lab/job-submit.mjs', 'workspaces/foundry/index.js')


# Match the unchanged Rust RuntimeAssets loader. Generated entries consume the
# same manifest, count and byte budgets as source assets.
MAX_FILE_BYTES = 16 * 1024 * 1024
MAX_TOTAL_BYTES = 64 * 1024 * 1024
MAX_MANIFEST_BYTES = 2 * 1024 * 1024
MAX_ENTRIES = 4096
ALLOWED_EXTENSIONS = frozenset(('html', 'js', 'mjs', 'css', 'json', 'zip', 'txt',
                               'svg', 'png', 'jpg', 'jpeg', 'webp', 'ico', 'woff', 'woff2'))
GENERATED = {
    'learn/index.html': b'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=../#home"><title>Athena</title><a href="../#home">Open Athena</a></html>\n',
    '.nojekyll': b'',
}
FOUNDRY_SOURCE = 'Herbertofury/Feature-Foundry'
FOUNDRY_SOURCE_HEAD = 'e1ba080b5c7590f1c844a6ed13b3a471709920b9'
FOUNDRY_INTEGRATION_HEAD = '141cdbb2b7d40d989213884c5ab772a6e05ed91a'
FOUNDRY_LIMITATIONS = [
    'Integration candidate only; not a deployment or source-deletion approval.',
    'Full Athena aggregate browser and Rust-served acceptance remain required.',
    'Native SQLite/window callbacks and provider account authorization are unconnected.',
    'External/local-file media is unavailable on privileged loopback; actual playback is unverified.',
]
FOUNDRY_ASSETS = {'workspaces/foundry/THIRD-PARTY-NOTICES.txt': {'sha256': 'd249cfc4b221ea9f33a68375772b82fc4dcc0ff636ce452cb1cac2ff937dd785', 'bytes': 4273}, 'workspaces/foundry/identity.json': {'sha256': 'de645c0f83a118c8e8547e6d66ea35039944992393caeb6752bdeda70d982dd3', 'bytes': 381}, 'workspaces/foundry/index.js': {'sha256': 'a2c582b79d7e271f3911a78a9161f95ccbbb068880e34f771b5a7e8f548aef5a', 'bytes': 2210196}, 'workspaces/foundry/style.css': {'sha256': '4ea3de2caff691ade8736eebe85f2bfe300c80241a11bb1dbd8d9500b59ff437', 'bytes': 274123}}


def runtime_path(name):
    return (bool(name) and len(name.encode('utf-8')) <= 512
            and re.fullmatch(r'[A-Za-z0-9_/.-]+', name) is not None
            and all(part and not part.startswith('.') for part in name.split('/'))
            and name != 'api' and not name.startswith('api/')
            and name != 'athena-runtime-manifest.json')


def candidate_contract():
    return {'kind': 'foundry-integration', 'repository': FOUNDRY_SOURCE,
            'sourceCommit': FOUNDRY_SOURCE_HEAD, 'integrationCommit': FOUNDRY_INTEGRATION_HEAD,
            'native': False, 'accountAuthorization': False,
            'verifiedPlayback': False, 'deployed': False}


def validate_foundry(source, actual, approved, allowlist):
    candidate = allowlist.get('candidate')
    if (allowlist.get('profile') != 'integration-candidate'
            or candidate != candidate_contract()
            or any(type(candidate.get(flag)) is not bool for flag in
                   ('native', 'accountAuthorization', 'verifiedPlayback', 'deployed'))):
        raise ValueError('Exact reviewed Foundry candidate contract is required.')
    names = {name for name in actual if name.startswith('workspaces/foundry/')}
    if names != set(FOUNDRY_ASSETS):
        raise ValueError('Foundry candidate must contain exactly its four reviewed assets.')
    for name, identity in FOUNDRY_ASSETS.items():
        if approved[name] != identity['sha256'] or actual[name].stat().st_size != identity['bytes']:
            raise ValueError('Foundry candidate asset identity mismatch: ' + name)
    identity = json.loads((source/'workspaces/foundry/identity.json').read_text())
    module = FOUNDRY_ASSETS['workspaces/foundry/index.js']
    if (identity.get('source') != FOUNDRY_SOURCE or identity.get('sourceHead') != FOUNDRY_SOURCE_HEAD
            or identity.get('path') != 'dist/workspaces/foundry/index.js'
            or identity.get('sha256') != module['sha256'] or identity.get('bytes') != module['bytes']):
        raise ValueError('Foundry source/runtime identity mismatch.')


def package(source, output, allowlist=None, profile="complete"):
    if profile not in ("complete", "public-preview", "integration-candidate"):
        raise ValueError("Unknown release profile.")
    if pathlib.Path(source).is_symlink():
        raise ValueError('Runtime source root must not be a symlink.')
    source, output = pathlib.Path(source).resolve(), pathlib.Path(output).resolve()
    if output.exists():
        raise ValueError('Output already exists; choose a fresh generated output directory.')
    if output == source or source in output.parents:
        raise ValueError('Output must not be inside the source tree.')
    required=REQUIRED if profile!='public-preview' else REQUIRED[:-1]
    missing = [p for p in required if not (source/p).is_file()]
    if missing:
        raise ValueError('Unified release is incomplete; missing: ' + ', '.join(missing))
    for reserved in ('learn/index.html', 'athena-runtime-manifest.json'):
        if (source/reserved).exists():
            raise ValueError('Source conflicts with generated package path: ' + reserved)
    files = []
    for path in sorted(source.rglob('*')):
        if path.is_symlink():
            raise ValueError('Runtime source must not contain symlinks.')
        if path.is_file():
            if any(part.startswith('.') for part in path.relative_to(source).parts):
                raise ValueError('Runtime source must not contain hidden files.')
            files.append(path)
    if not isinstance(allowlist, dict) or allowlist.get('schema') != 1 or not isinstance(allowlist.get('files'), list):
        raise ValueError('An explicitly reviewed runtime allowlist with SHA-256 hashes is required.')
    approved = {}
    for entry in allowlist['files']:
        if not isinstance(entry, dict):
            raise ValueError('Invalid runtime allowlist entry.')
        name, sha = entry.get('path'), entry.get('sha256')
        if not isinstance(name, str) or not isinstance(sha, str) or not re.fullmatch(r'[0-9a-f]{64}', sha):
            raise ValueError('Each allowlist entry requires an exact path and SHA-256 hash.')
        relative = pathlib.PurePosixPath(name)
        if relative.is_absolute() or str(relative) != name or any(p in ('..', '.') or p.startswith('.') for p in relative.parts) or '\\' in name:
            raise ValueError('Runtime allowlist paths must be canonical relative public paths.')
        if name in approved:
            raise ValueError('Duplicate runtime allowlist path: ' + name)
        if not runtime_path(name):
            raise ValueError('Runtime path is not accepted by the Rust loader: ' + name)
        if name.rsplit('.',1)[-1] not in ALLOWED_EXTENSIONS:
            raise ValueError('Runtime extension is not accepted by the Rust loader: ' + name)
        approved[name] = sha
    actual = {path.relative_to(source).as_posix(): path for path in files}
    if set(actual) != set(approved):
        unexpected = sorted(set(actual)-set(approved))
        absent = sorted(set(approved)-set(actual))
        raise ValueError('Runtime allowlist mismatch; unreviewed: ' + ', '.join(unexpected) + '; absent: ' + ', '.join(absent))
    if profile=='public-preview' and any(name.startswith('workspaces/foundry/') for name in actual):
        raise ValueError('Public-preview profile explicitly excludes Foundry content.')
    if profile=='integration-candidate':
        validate_foundry(source, actual, approved, allowlist)
    if len(actual) + len(GENERATED) > MAX_ENTRIES:
        raise ValueError('Runtime entry count exceeds the Rust loader limit.')
    total = sum(len(data) for data in GENERATED.values())
    for name, path in actual.items():
        if path.stat().st_size > MAX_FILE_BYTES:
            raise ValueError('Runtime file exceeds its byte budget: ' + name)
        data = path.read_bytes()
        if len(data) > MAX_FILE_BYTES:
            raise ValueError('Runtime file grew beyond its byte budget: ' + name)
        total += len(data)
        if total > MAX_TOTAL_BYTES:
            raise ValueError('Runtime package exceeds its total byte budget including generated files.')
        if hashlib.sha256(data).hexdigest() != approved[name]:
            raise ValueError('Runtime content changed after allowlist review: ' + name)
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='athena-package-', dir=output.parent) as temporary:
        staged = pathlib.Path(temporary)/'app'
        staged.mkdir()
        entries = []
        for path in files:
            relative = path.relative_to(source)
            destination = staged/relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(path, destination)
            staged_bytes=destination.read_bytes()
            staged_sha=hashlib.sha256(staged_bytes).hexdigest()
            if staged_sha != approved[relative.as_posix()]:
                raise ValueError('Runtime content changed during staging: ' + relative.as_posix())
            entries.append({'path':relative.as_posix(), 'bytes':len(staged_bytes),
                            'sha256':staged_sha, 'origin':'source'})
        # Generated files are byte-pinned and included in budgets before output.
        for generated, data in GENERATED.items():
            target=staged/generated
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(data)
            entries.append({'path':generated,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'origin':'generated'})
        manifest={'application':'Athena','entry':'index.html','profile':profile,
                  'workspaces':['learning','research','media','lab']+(['build'] if profile!='public-preview' else []),
                  'pending':FOUNDRY_LIMITATIONS[:] if profile=='integration-candidate' else ([] if profile=='complete' else ['Feature Foundry integration and verification; not included in this build']),
                  'verification':'Packaging and file hashes only; functional/browser parity is a separate gate.', 'files':entries}
        if profile=='integration-candidate':
            manifest['candidate']=candidate_contract()
        manifest_bytes=(json.dumps(manifest,indent=2)+'\n').encode('utf-8')
        if len(manifest_bytes) > MAX_MANIFEST_BYTES:
            raise ValueError('Runtime manifest exceeds the Rust loader byte limit.')
        (staged/'athena-runtime-manifest.json').write_bytes(manifest_bytes)
        staged.rename(output)
    return manifest


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',default='dist')
    parser.add_argument('--output',default='public')
    parser.add_argument('--profile',choices=['complete','public-preview','integration-candidate'],default='complete')
    parser.add_argument('--allowlist',help='Reviewed JSON file with schema=1 and exact path/SHA-256 file entries')
    args=parser.parse_args()
    try:
        allowlist=json.loads(pathlib.Path(args.allowlist).read_text()) if args.allowlist else None
        result=package(args.source,args.output,allowlist,args.profile)
    except (ValueError,OSError) as error:
        parser.exit(1,str(error)+'\n')
    print(f"Packaged {len(result['files'])} runtime files into {args.output}; deployment not attempted.")
