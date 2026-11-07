#!/usr/bin/env python3
"""Project reviewed adapter Markdown into a separately cloned GitHub wiki.

Only mapped pages are written. This script does not fetch, commit, push, change
authentication, or overwrite the sidebar. Review current wiki edits first.
"""
import argparse
import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
REPO = 'https://github.com/Herbertofury/Engineering-Atlas'


def project(source, mapping):
    path = ROOT / source
    text = path.read_text()

    def link(match):
        label, target = match.groups()
        parsed = urlsplit(target)
        if parsed.scheme or target.startswith('#'):
            return match.group(0)
        resolved = (path.parent / unquote(parsed.path)).resolve()
        if not resolved.is_relative_to(ROOT) or not resolved.exists():
            raise ValueError(f'{source}: unsafe or missing local link {target}')
        relative = resolved.relative_to(ROOT).as_posix()
        url = REPO + '/wiki/' + mapping[relative] if relative in mapping else REPO + '/blob/main/' + relative
        if parsed.query:
            url += '?' + parsed.query
        if parsed.fragment:
            url += '#' + parsed.fragment
        return f'[{label}]({url})'

    body = re.sub(r'\[([^\]]*)\]\(([^)]+)\)', link, text)
    return f'[← Atlas home]({REPO}/wiki/Home) · [Canonical source]({REPO}/blob/main/{source})\n\n' + body.rstrip() + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('wiki_directory', type=Path)
    parser.add_argument('--check', action='store_true', help='Compare without writing')
    args = parser.parse_args()
    mapping = json.loads((ROOT / 'data/wiki-adapter-pages.json').read_text())
    if len(mapping.values()) != len(set(mapping.values())):
        raise ValueError('Duplicate wiki page names')
    if not args.wiki_directory.is_dir():
        raise ValueError('The destination directory must already exist')
    differing = []
    for source, page in mapping.items():
        if not re.fullmatch(r'[A-Za-z0-9-]+', page):
            raise ValueError(f'Invalid wiki page name: {page}')
        expected = project(source, mapping)
        target = args.wiki_directory / (page + '.md')
        if not target.exists() or target.read_text() != expected:
            differing.append(page)
            if not args.check:
                target.write_text(expected)
    print(json.dumps({'mode': 'check' if args.check else 'prepare', 'mapped_pages':len(mapping), 'different_pages':differing, 'publication_performed':False}, indent=2))
    return 1 if args.check and differing else 0


if __name__ == '__main__':
    raise SystemExit(main())
