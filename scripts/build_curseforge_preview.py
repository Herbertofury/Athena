"""Generate a synthetic-only, credential-free Lab preview from the offline mapper."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / 'engineering/experiments/site-extraction-lab'
FIXTURES = LAB / 'fixtures/curseforge-synthetic'
OUT = FIXTURES / 'preview-receipt.json'
SOURCES = ('scripts/build_curseforge_preview.py',
           'engineering/experiments/site-extraction-lab/curseforge.py',
           'engineering/experiments/site-extraction-lab/extractors.py',
           'engineering/experiments/site-extraction-lab/fixtures/curseforge-synthetic/project.json',
           'engineering/experiments/site-extraction-lab/fixtures/curseforge-synthetic/files.json',
           'engineering/experiments/site-extraction-lab/fixtures/curseforge-synthetic/description.json')


def build():
    # Requires the existing extraction lab's declared lxml dependency. No network.
    sys.path.insert(0, str(LAB))
    try:
        spec = importlib.util.spec_from_file_location('athena_curseforge_preview_mapper', LAB / 'curseforge.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        mapped = module.normalize_project_response(
            (FIXTURES / 'project.json').read_bytes(), expected_mod_id=700001,
            files_raw=(FIXTURES / 'files.json').read_bytes(),
            description_raw=(FIXTURES / 'description.json').read_bytes())
        preview = {'evidence': 'synthetic_fixtures_only', 'liveAcceptance': False,
                   'access': module.access_state(), 'receipt': module.receipt(mapped)}
    finally:
        sys.path.pop(0)
    result = {'schema': 1, 'kind': 'synthetic_curseforge_lab_preview', 'preview': preview,
              'source_files': [{'path': p, 'sha256': hashlib.sha256((ROOT / p).read_bytes()).hexdigest()} for p in SOURCES]}
    return (json.dumps(result, indent=2) + '\n').encode()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    data = build()
    if args.check:
        if not OUT.is_file() or OUT.read_bytes() != data:
            raise SystemExit('Stale synthetic CurseForge preview; regenerate before use.')
    else:
        OUT.write_bytes(data)
    print('Synthetic CurseForge preview ' + ('verified' if args.check else 'generated') + '; no transport, credentials or live acceptance.')
