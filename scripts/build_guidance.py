#!/usr/bin/env python3
"""Generate the native reader from the exact versioned Athena governance core."""
import argparse
import hashlib
import json
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'guidance/tools'))
from repository_governance import checked_release, content

def build():
    source = ROOT / 'guidance'
    release = checked_release(source)
    documents = []
    for path, digest in sorted(release['files'].items()):
        data = content(source / path)
        if hashlib.sha256(data).hexdigest() != digest:
            raise ValueError('source changed during generation')
        text = data.decode('utf-8')
        documents.append({'id': path, 'title': next((line[2:].strip() for line in text.splitlines() if line.startswith('# ')), path), 'sha256': digest, 'sourcePath': 'guidance/' + path, 'sourceUrl': 'https://github.com/Herbertofury/Athena/blob/main/guidance/' + path, 'text': text})
    return {'schema': 1, 'version': release['version'], 'sourceRepository': release['sourceRepository'], 'sourceRevision': 'content-addressed-governance-' + release['version'], 'legacySourceCommit': '87166b5f6a621c61b90bbbfe90835a3752c1c51b', 'documents': documents}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    path=ROOT/'dist/workspaces/guidance/catalog.json'; data=json.dumps(build(),ensure_ascii=False,indent=2)+'\n'
    if args.check:
        if not path.exists() or path.read_text()!=data: raise SystemExit('Native guidance catalog drift; run python scripts/build_guidance.py')
        print('Native guidance catalog matches versioned canonical sources')
    else:
        path.write_text(data);print(f'Wrote {path.relative_to(ROOT)}')
if __name__=='__main__': main()
