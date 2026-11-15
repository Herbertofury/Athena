#!/usr/bin/env python3
"""Bounded, read-only structural preflight of one explicitly selected Skill.

Skill text is untrusted data, never loaded as instructions or executed.
"""
import argparse
import json
import os
from pathlib import Path
import re
import stat

MAX_BYTES = 25 * 1024 * 1024
MAX_FILES = 2000
MAX_HEADER = 64 * 1024
NAME = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
CACHES = {'__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache'}

def header(data):
    text = data.decode('utf-8').replace('\r\n', '\n')
    if not text.startswith('---\n') or '\n---\n' not in text[4:]:
        raise ValueError('missing-or-unbounded-frontmatter')
    block = text[4:text.index('\n---\n', 4)]
    values = {}
    for line in block.splitlines():
        if not line.strip() or line.lstrip().startswith('#'): continue
        if line.startswith((' ', '\t')) or ':' not in line:
            raise ValueError('unsupported-frontmatter-syntax')
        key, value = line.split(':', 1)
        if key in values: raise ValueError('duplicate-frontmatter-key')
        value = value.strip()
        if value in ('|', '>') or value.startswith(('!', '&', '*', '{', '[')):
            raise ValueError('unsupported-frontmatter-syntax')
        if value.startswith(('"', "'")):
            if len(value) < 2 or value[-1] != value[0]: raise ValueError('unsupported-frontmatter-syntax')
            value = value[1:-1]
        values[key] = value
    return values

def inspect(root):
    root = Path(root).absolute()
    errors = []; warnings = []; files = []; total = 0; entries = 0
    # Check every parent before traversal; do not resolve through linked sources.
    for parent in (root, *root.parents):
        if parent.is_symlink() or (hasattr(parent, 'is_junction') and parent.is_junction()):
            raise ValueError('linked-root-refused')
    if not root.is_dir(): raise ValueError('selected-skill-directory-missing')
    for directory, dirs, names in os.walk(root, followlinks=False):
        entries += len(dirs) + len(names)
        if entries > MAX_FILES: raise ValueError("source-budget-exceeded")
        dirs.sort(); names.sort()
        for name in list(dirs):
            path = Path(directory)/name
            if path.is_symlink() or (hasattr(path, 'is_junction') and path.is_junction()):
                dirs.remove(name); errors.append('linked-directory-refused')
        for name in names:
            path = Path(directory)/name
            info = path.lstat()
            if not stat.S_ISREG(info.st_mode):
                errors.append('nonregular-file-refused'); continue
            total += info.st_size
            if len(files) >= MAX_FILES or total > MAX_BYTES:
                raise ValueError('source-budget-exceeded')
            relative = path.relative_to(root).as_posix()
            if set(path.relative_to(root).parts) & CACHES or path.suffix in {'.pyc', '.pyo'}:
                errors.append('generated-cache-present')
            if relative.startswith('evidence/'): warnings.append('bundled-evidence-needs-review')
            files.append({'path': relative, 'bytes': info.st_size})
    md = root/'SKILL.md'
    if not any(x['path'] == 'SKILL.md' for x in files):
        errors.append('skill-document-missing')
    else:
        try:
            with md.open('rb') as stream: data = stream.read(MAX_HEADER)
            values = header(data)
            if not NAME.fullmatch(values.get('name', '')): errors.append('invalid-skill-name')
            elif values['name'] != root.name: errors.append('directory-name-mismatch')
            if not values.get('description', '').strip(): errors.append('description-missing')
            if set(values) - {'name', 'description'}: warnings.append('additional-frontmatter-needs-host-review')
        except (ValueError, UnicodeError): errors.append('frontmatter-needs-review')
    return {'schemaVersion': 1, 'structuralPass': not errors,
            'errors': sorted(set(errors)), 'warnings': sorted(set(warnings)),
            'fileCount': len(files), 'totalBytes': total, 'files': files,
            'trust': 'Not security, rights, installation or runtime approval. Review contents and dependencies separately.',
            'writesPerformed': False, 'codeExecuted': False, 'retirementReady': False}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('skill', type=Path)
    args = parser.parse_args()
    try:
        result = inspect(args.skill)
        print(json.dumps(result, indent=2))
        return 0 if result['structuralPass'] else 1
    except (OSError, ValueError):
        print(json.dumps({'structuralPass': False, 'error': 'Inspection incomplete; check selected path, links, access and resource bounds. No installation performed.'}))
        return 2
if __name__ == '__main__': raise SystemExit(main())
