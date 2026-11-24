"""Build deterministic downloadable offline packs. No network or publication."""
from pathlib import Path
import hashlib
import io
import stat
import zipfile
from workshop_content import ROOT, KEYS


def _linked(path):
    # Fail closed for Windows reparse points, including junctions on Python
    # versions predating Path.is_junction. Ordinary files have no such flag.
    attributes = getattr(path.lstat(), 'st_file_attributes', 0)
    reparse = getattr(stat, 'FILE_ATTRIBUTE_REPARSE_POINT', 0)
    return (path.is_symlink() or bool(attributes & reparse)
            or getattr(path, 'is_junction', lambda: False)())


def _regular_files(folder, root):
    # Inspect each directory before descending. A recursive glob could already
    # traverse a Windows junction before the later link check sees its entry.
    for path in sorted(folder.iterdir()):
        relative = path.relative_to(root).as_posix()
        if _linked(path):
            raise ValueError(f'Workshop input contains a link: {relative}')
        mode = path.lstat().st_mode
        if stat.S_ISDIR(mode):
            yield from _regular_files(path, root)
        elif stat.S_ISREG(mode):
            yield path
        else:
            raise ValueError(f'Workshop input is not a regular file: {relative}')


def pack_files(folder):
    folder = Path(folder)
    if _linked(folder) or not folder.is_dir():
        raise ValueError('Workshop input must be a real directory, not a link.')
    # Include learner-facing material, test suites and content renderers. Do not
    # distribute parent handoffs, receipts, browser runners or packaging scripts.
    for path in _regular_files(folder, folder):
        relative = path.relative_to(folder)
        if '__pycache__' in relative.parts:
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
