"""Read the complete register and additive files without overriding evidence."""
import importlib.util
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location(
    'atlas_source_wire', _ROOT / 'experiments/upstream-validation-lab/receipt_gate.py')
_wire = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_wire)


def relative_source_names(root, paths):
    return [path.relative_to(root).as_posix() for path in paths]


def load_sources(root):
    root = Path(root).resolve()
    paths = [root / 'data/sources.json']
    additions = root / 'data/sources.d'
    if not additions.resolve().is_relative_to(root):
        raise ValueError('Source-register directory escapes repository')
    paths.extend(sorted(additions.glob('*.json')))
    index_path = root / 'data/source-index.json'
    if index_path.exists() or index_path.is_symlink():
        if not index_path.resolve().is_relative_to(root):
            raise ValueError('Source-register index escapes repository')
        index = _wire.decode_receipt(index_path.read_text(encoding='utf-8'))
        expected = relative_source_names(root, paths)
        if not isinstance(index, dict) or set(index) != {'schema_version', 'files'} or type(index['schema_version']) is not int or index['schema_version'] != 1 or index['files'] != expected:
            raise ValueError('Source-register index differs from complete file set')
    rows, seen = [], set()
    for path in paths:
        if not path.resolve().is_relative_to(root):
            raise ValueError('Source-register path escapes repository')
        values = _wire.decode_receipt(path.read_text(encoding='utf-8'))
        if not isinstance(values, list):
            raise ValueError('Each source-register file must contain a list')
        for value in values:
            if not isinstance(value, dict) or not isinstance(value.get('id'), str):
                raise ValueError('Source entry must have a string ID')
            if value['id'] in seen:
                raise ValueError('Duplicate source ID across register files')
            seen.add(value['id'])
            rows.append(value)
    return rows
