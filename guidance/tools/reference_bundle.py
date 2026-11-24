#!/usr/bin/env python3
"""Build/verify an exact canonical reference ZIP. Never installs or extracts it."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import zipfile
from repository_governance import checked_release, content, safe_path

LIMIT = 4 * 1024 * 1024

def canonical(source):
    source = source.resolve()
    manifest = checked_release(source)
    files = {name: content(safe_path(source, name)) for name in manifest['files']}
    receipt = {'schemaVersion': 1, 'purpose': 'reference-only; no instruction installation or permission grant',
               'sourceRepository': manifest['sourceRepository'], 'version': manifest['version'],
               'files': manifest['files'], 'licenseNotice': 'No repository-wide license inferred; review component rights before reuse.'}
    files['REFERENCE-MANIFEST.json'] = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    return files

def build(source):
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_STORED) as archive:
        for name, data in sorted(canonical(source).items()):
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    return output.getvalue()

def verify(source, data):
    if len(data) > LIMIT:
        raise ValueError('bundle exceeds bounded reference size')
    expected = canonical(source)
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        entries = archive.infolist()
        if len(entries) != len(expected) or {x.filename for x in entries} != set(expected):
            raise ValueError('bundle paths differ from complete canonical reference')
        for entry in entries:
            original = expected[entry.filename]
            if entry.file_size != len(original) or entry.compress_type != zipfile.ZIP_STORED:
                raise ValueError('unsupported member size/compression')
            if archive.read(entry) != original:
                raise ValueError('reference content differs from trusted canonical source')
    if data != build(source):
        raise ValueError('bundle metadata differs from reproducible format')
    return {'verified': True, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data),
            'documents': len(expected)-1, 'scope': 'Exact local canonical reference, not signature, installed fleet or source retirement proof'}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=Path(__file__).resolve().parents[1])
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--output', type=Path, help='New output file only; existing files are never overwritten')
    group.add_argument('--verify', type=Path, help='Read only; never extract or execute')
    args = parser.parse_args()
    try:
        if args.verify:
            with args.verify.open('rb') as stream:
                data = stream.read(LIMIT + 1)
            report = verify(args.source, data)
        else:
            data = build(args.source)
            report = verify(args.source, data)
            with args.output.open('xb') as stream:
                stream.write(data)
        print(json.dumps(report, sort_keys=True))
        return 0
    except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile):
        print(json.dumps({'verified': False, 'error': 'Reference operation failed; preserve source and existing output. Check canonical manifest, archive and destination.'}))
        return 2
if __name__ == '__main__':
    raise SystemExit(main())
