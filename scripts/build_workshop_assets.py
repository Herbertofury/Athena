"""Build deterministic downloadable offline packs. No network or publication."""
from pathlib import Path
import hashlib
import io
import zipfile
from workshop_content import ROOT, KEYS


def pack_files(folder):
    # Include learner-facing material, test suites and content renderers. Do not
    # distribute parent handoffs, receipts, browser runners or packaging scripts.
    for path in sorted(folder.rglob('*')):
        relative = path.relative_to(folder)
        if not path.is_file() or '__pycache__' in relative.parts:
            continue
        if path.name == 'MANIFEST.sha256' or path.suffix == '.cjs':
            continue
        if path.name.startswith('package_'):
            continue
        yield relative.as_posix(), path.read_bytes()


def build():
    for key in KEYS:
        folder = ROOT / 'workshops' / key
        files = dict(pack_files(folder))
        files['MANIFEST.sha256'] = ''.join(
            hashlib.sha256(data).hexdigest() + '  ' + name + '\n'
            for name, data in sorted(files.items())).encode()
        output = io.BytesIO()
        with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
            for name, data in sorted(files.items()):
                info = zipfile.ZipInfo(name, (2026, 11, 7, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, data)
        destination = ROOT / 'dist' / 'workshops' / key / 'learner-pack.zip'
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(output.getvalue())
        print(key, len(files), 'files', len(output.getvalue()), 'bytes')


if __name__ == '__main__':
    build()
