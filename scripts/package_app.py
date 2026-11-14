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
            'workspaces/engineering/lab/job-submit.mjs',
            'workspaces/engineering/cards/index.mjs',
            'workspaces/engineering/cards/style.css',
            'workspaces/engineering/cards/lab-core.mjs',
            'workspaces/engineering/cards/preparation-core.mjs',
            'workspaces/engineering/cards/lab-worker.mjs',
            'workspaces/engineering/cards/cooperative-commit.mjs',
            'workspaces/engineering/cards/cooperative-pairs.mjs',
            'workspaces/engineering/cards/cooperative-scheduler.mjs',
            'workspaces/engineering/cards/verified-receiver.mjs',
            'workspaces/engineering/cards/baseline.mjs',
            'workspaces/engineering/cards/bounded-encoding.mjs',
            'workspaces/engineering/audio/index.mjs',
            'workspaces/engineering/audio/style.css',
            'workspaces/engineering/audio/audio-core.mjs',
            'workspaces/engineering/audio/archive-selection.mjs',
            'workspaces/engineering/audio/media-events.mjs',
            'workspaces/engineering/receiver/baseline.293713d95cef8511.mjs',
            'workspaces/engineering/receiver/bounded-encoding.b3c034a08dcad316.mjs',
            'workspaces/engineering/receiver/index.mjs',
            'workspaces/engineering/receiver/lab-core.07b69b8b7583dd03.mjs',
            'workspaces/engineering/receiver/manifest.json',
            'workspaces/engineering/receiver/phase-clock.517bbc23572a2147.mjs',
            'workspaces/engineering/receiver/receipt-protocol.b4d10c91dd34ebaa.mjs',
            'workspaces/engineering/receiver/receiver-worker.2ddd526f33d730b2.mjs',
            'workspaces/engineering/receiver/style.css',
            'workspaces/engineering/receiver/verified-receiver.0b0bb67b4513ac91.mjs',
            'workspaces/engineering/receiver/worker-esbuild.b1772614243c7c75.mjs',
            'workspaces/engineering/receiver/worker-rolldown.0e9c42dd5c7472df.mjs',
            'workspaces/engineering/diagnostics/index.mjs',
            'workspaces/engineering/diagnostics/style.css',
            'workspaces/foundry/index.mjs',
            'workspaces/foundry/style.css',
            'workspaces/foundry/catalog.json',
            'workspaces/foundry/layout-state.mjs',
            'workspaces/foundry/index.js')


def package(source, output, allowlist=None, profile="complete"):
    if profile not in ("complete", "public-preview"):
        raise ValueError("Unknown release profile.")
    source, output = pathlib.Path(source).resolve(), pathlib.Path(output).resolve()
    if output.exists():
        raise ValueError('Output already exists; choose a fresh generated output directory.')
    if output == source or source in output.parents:
        raise ValueError('Output must not be inside the source tree.')
    required=REQUIRED if profile=='complete' else REQUIRED[:-1]
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
        approved[name] = sha
    actual = {path.relative_to(source).as_posix(): path for path in files}
    if set(actual) != set(approved):
        unexpected = sorted(set(actual)-set(approved))
        absent = sorted(set(approved)-set(actual))
        raise ValueError('Runtime allowlist mismatch; unreviewed: ' + ', '.join(unexpected) + '; absent: ' + ', '.join(absent))
    if profile=='public-preview' and any(name.startswith('workspaces/foundry/') and name not in {'workspaces/foundry/index.mjs','workspaces/foundry/style.css','workspaces/foundry/catalog.json','workspaces/foundry/layout-state.mjs','workspaces/foundry/cinematic.mjs','workspaces/foundry/cinematic-world.mjs','workspaces/foundry/THREE-LICENSE.txt','workspaces/foundry/FOUNDRY-LICENSE.txt','workspaces/foundry/native-backup.mjs','workspaces/foundry/native-import.mjs','workspaces/foundry/native-soundtrack.mjs','workspaces/foundry/native-weather.mjs','workspaces/foundry/native-ecology.mjs','workspaces/foundry/native-local-video.mjs','workspaces/foundry/native-environment.mjs','workspaces/foundry/native-semantic-room.mjs','workspaces/foundry/weather-renderer.mjs'} for name in actual):
        raise ValueError('Public-preview profile excludes Foundry content beyond reviewed native authoring and optional local adapters.')
    for name, path in actual.items():
        if hashlib.sha256(path.read_bytes()).hexdigest() != approved[name]:
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
        # Preserve the old learning entry as a redirect to the one canonical app.
        (staged/'learn').mkdir(exist_ok=True)
        (staged/'learn/index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=../#home"><title>Athena</title><a href="../#home">Open Athena</a></html>\n')
        (staged/'.nojekyll').write_text('')
        for generated in ('learn/index.html', '.nojekyll'):
            data=(staged/generated).read_bytes()
            entries.append({'path':generated,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'origin':'generated'})
        manifest={'application':'Athena','entry':'index.html','profile':profile,'workspaces':['learning','research','media','lab','cards','audio','receiver','diagnostics','build'],
                  'pending':[] if profile=='complete' else ['Full Foundry parity: original 3D, artist worlds, native persistence and provider authorization'],
                  'verification':'Packaging and file hashes only; functional/browser parity is a separate gate.', 'files':entries}
        (staged/'athena-runtime-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
        staged.rename(output)
    return manifest


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',default='dist')
    parser.add_argument('--output',default='public')
    parser.add_argument('--profile',choices=['complete','public-preview'],default='complete')
    parser.add_argument('--allowlist',help='Reviewed JSON file with schema=1 and exact path/SHA-256 file entries')
    args=parser.parse_args()
    try:
        allowlist=json.loads(pathlib.Path(args.allowlist).read_text()) if args.allowlist else None
        result=package(args.source,args.output,allowlist,args.profile)
    except (ValueError,OSError) as error:
        parser.exit(1,str(error)+'\n')
    print(f"Packaged {len(result['files'])} runtime files into {args.output}; deployment not attempted.")
