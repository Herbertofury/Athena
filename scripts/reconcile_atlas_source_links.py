"""Reconcile preserved Atlas URL mappings against actual Athena targets, offline.

Original URLs/locations stay untouched. A map is not an HTTP redirect or a
promise that old GitHub service identities survive source deletion.
"""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit
ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = Path('migration/engineering-atlas/metadata-2026-11-14')
ATHENA = 'https://github.com/Herbertofury/Athena'
PAGES = 'https://herbertofury.github.io/Athena/'

def reconcile(row, root=ROOT):
    result = dict(row)
    result['preserved_or_native_destination'] = None
    result['classification'] = 'historical source citation; no automatic redirect'
    result['target_check'] = 'no equivalent target asserted'
    # Source inventory retains exact matched text, including scanner punctuation.
    url = urlsplit(row['original'].rstrip("',;"))
    path = unquote(url.path)
    def file_target(relative, destination, classification):
        candidate = root / relative
        if candidate.is_relative_to(root) and '..' not in Path(relative).parts and candidate.is_file():
            result.update(preserved_or_native_destination=destination,
                          classification=classification, target_check='repository file exists')
        else:
            result.update(classification='unresolved target; source citation retained',
                          target_check='referenced destination absent from inspected Athena tree')
    if url.netloc.lower() == 'github.com':
        if path.startswith('/Herbertofury/Athena/blob/main/'):
            relative = path.removeprefix('/Herbertofury/Athena/blob/main/')
            file_target(relative, row['original'], 'existing Athena link; no legacy rewrite')
        elif path.startswith('/Herbertofury/Engineering-Atlas/blob/main/'):
            relative = 'engineering/' + path.removeprefix('/Herbertofury/Engineering-Atlas/blob/main/')
            file_target(relative, ATHENA + '/blob/main/' + relative + ('#' + url.fragment if url.fragment else ''),
                        'retained source path; native route separate')
        elif path.startswith('/Herbertofury/Engineering-Atlas/wiki/'):
            page = 'Engineering-' + path.removeprefix('/Herbertofury/Engineering-Atlas/wiki/')
            file_target('wiki/' + page + '.md', ATHENA + '/wiki/' + page + ('#' + url.fragment if url.fragment else ''),
                        'native wiki projection; old source URL does not redirect')
        elif path.startswith('/Herbertofury/Engineering-Atlas/issues/new'):
            result.update(preserved_or_native_destination=ATHENA + '/issues/new/choose',
                          classification='active destination issue creation, not preserved discussion',
                          target_check='destination repository route; no issue body claimed')
        elif path.startswith(('/Herbertofury/Engineering-Atlas/issues/', '/Herbertofury/Engineering-Atlas/pull/')):
            suffix = path.rsplit('/', 1)[-1]
            issues = json.loads((root / SNAPSHOT / 'issues.json').read_text())
            if suffix.isdigit() and any(r['number'] == int(suffix) for r in issues):
                relative = (SNAPSHOT / 'issues.json').as_posix()
                file_target(relative, relative, 'preserved discussion identity/body, not GitHub issue redirect')
                result['target_check'] = 'record number ' + suffix + ' exists in preserved issue metadata'
    elif url.netloc.lower() == 'herbertofury.github.io' and path.startswith('/Engineering-Atlas/'):
        relative = path.removeprefix('/Engineering-Atlas/')
        routes = {'card-lab/':'cards', 'card-receiver-lab/':'receiver', 'explorer/':'research', 'media-lab/':'media'}
        if relative in routes:
            route = routes[relative]
            # Research's existing query contract retains layer/plan selections.
            query = '?' + url.query if url.query else ''
            file_target('dist/workspaces/engineering/' + route + '/index.mjs', PAGES + query + '#' + route,
                        'native workspace route; old Pages URL does not redirect')
        else:
            file_target('engineering/docs/' + relative, PAGES + 'engineering/docs/' + relative,
                        'preserved static asset; not a native workspace route')
    return result

def update(root=ROOT, check=False):
    target = root / SNAPSHOT / 'source-link-inventory.json'
    rows = json.loads(target.read_text())
    mapped = [reconcile(row, root) for row in rows]
    data = (json.dumps(mapped, indent=2) + '\n').encode()
    if check:
        if target.read_bytes() != data: raise ValueError('Source link map is stale')
    else:
        target.write_bytes(data)
        manifest_path = root / SNAPSHOT / 'manifest.json'
        manifest = json.loads(manifest_path.read_text())
        for entry in manifest['files']:
            if entry['path'] == target.name:
                entry.update(bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
        manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
    return {'rows': len(mapped), 'unresolved': sum(r['classification'].startswith('unresolved') for r in mapped)}
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    print(json.dumps(update(check=args.check)))
