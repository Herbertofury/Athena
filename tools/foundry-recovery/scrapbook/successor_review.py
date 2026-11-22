"""Dry-run only: review explicit placement successors between exact Scrapbook bundles."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys

if __name__ == "__main__":
    sys.dont_write_bytecode = True

from convert import LIMIT, exact, parse, verify_bundle

MEMBERS = ('source-original.utf8', 'mapping-private.json', 'athena-workspace.json', 'manifest.json')
SHA256 = re.compile('[0-9a-f]{64}')
IDENTITY = re.compile(r'instance-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}')


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def inspected_path(path):
    path = Path(path).absolute()
    if '..' in path.parts:
        raise ValueError('Use a path without parent components.')
    for member in (path, *path.parents):
        info = member.lstat()
        if stat.S_ISLNK(info.st_mode) or getattr(info, 'st_file_attributes', 0) & 0x400:
            raise ValueError('Linked or reparse paths are unsupported.')
    return path


def read_bounded(path):
    path = inspected_path(path)
    if not stat.S_ISREG(path.lstat().st_mode):
        raise ValueError('Select a regular local file.')
    flags = os.O_RDONLY | getattr(os, 'O_NOFOLLOW', 0) | getattr(os, 'O_NONBLOCK', 0)
    flags |= getattr(os, 'O_BINARY', 0)
    with os.fdopen(os.open(path, flags), 'rb') as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_size > LIMIT:
            raise ValueError('Unsupported file or byte length.')
        raw = stream.read(LIMIT + 1)
        if len(raw) != info.st_size:
            raise ValueError('Input changed while being read.')
    return raw


def captured_bundle(folder):
    folder = inspected_path(folder)
    if not folder.is_dir() or {item.name for item in folder.iterdir()} != set(MEMBERS):
        raise ValueError('Select a complete reviewed bundle.')
    return {name: read_bounded(folder / name) for name in MEMBERS}


def matched_hash(raw, claimed):
    return isinstance(claimed, str) and SHA256.fullmatch(claimed) and digest(raw) == claimed


def placement_id(value):
    return isinstance(value, str) and IDENTITY.fullmatch(value) is not None


def same_json(a, b):
    # JSON booleans never equal numbers; representations 1 and 1.0 are both numbers.
    if isinstance(a, bool) or isinstance(b, bool):
        return a is b
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(same_json(value, b[key]) for key, value in a.items())
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(same_json(left, right) for left, right in zip(a, b))
    return a == b


def evaluate_review(previous, incoming, current_file, receipt_file, catalog_file):
    old_bytes, new_bytes = (captured_bundle(folder) for folder in (previous, incoming))
    current_raw, receipt_raw, catalog_raw = (read_bounded(path) for path in
                                            (current_file, receipt_file, catalog_file))
    receipt = parse(receipt_raw)
    exact(receipt, ('schema', 'kind', 'prior', 'incoming', 'currentWorkspaceSha256', 'rows'), 'Receipt')
    if type(receipt['schema']) is not int or receipt['schema'] != 1 or receipt['kind'] != 'athena-scrapbook-successor-review':
        raise ValueError('Unsupported review receipt.')
    if old_bytes['source-original.utf8'] == new_bytes['source-original.utf8']:
        raise ValueError('Use ordinary exact-bundle reconciliation for identical source bytes.')
    for label, bundle in [('prior', old_bytes), ('incoming', new_bytes)]:
        binding = receipt[label]
        exact(binding, ('sourceSha256', 'mappingSha256'), 'Bundle binding')
        if not matched_hash(bundle['source-original.utf8'], binding['sourceSha256']):
            raise ValueError('Source binding did not match.')
        if not matched_hash(bundle['mapping-private.json'], binding['mappingSha256']):
            raise ValueError('Mapping binding did not match.')
    if not matched_hash(current_raw, receipt['currentWorkspaceSha256']):
        raise ValueError('Current workspace binding did not match.')
    for path in (previous, incoming):
        verify_bundle(path, catalog_file)
    prior, next_layout = (parse(bundle['athena-workspace.json'])['active']
                          for bundle in (old_bytes, new_bytes))
    if (prior['themeId'], prior['roomId']) != (next_layout['themeId'], next_layout['roomId']):
        raise ValueError('This review only supports the same theme and room.')
    current = parse(current_raw)
    room = prior['roomId']
    if not isinstance(current, dict) or not same_json(current['layouts'][room], prior):
        raise ValueError('Current room differs from the verified prior bundle.')
    active = current['active']
    if type(active) is not dict or (active['roomId'] == room and not same_json(active, prior)):
        raise ValueError('Current active room does not match the reviewed layout.')

    old, new = prior['placements'], next_layout['placements']
    rows = receipt['rows']
    if not isinstance(rows, list) or len(rows) != len(new) or not 1 <= len(rows) <= 100:
        raise ValueError('Require complete bounded dispositions for all incoming placements.')
    old_used, new_used, preserved = set(), set(), 0
    changed = 0
    placements = {}
    for row in rows:
        exact(row, ('decision', 'priorId', 'incomingId'), 'Disposition')
        source, target = row['priorId'], row['incomingId']
        if not placement_id(target) or target not in new or target in new_used:
            raise ValueError('Unknown or repeated incoming identity.')
        new_used.add(target)
        if row['decision'] == 'successor':
            if not placement_id(source) or source not in old or source in old_used:
                raise ValueError('Unknown or repeated prior identity.')
            old_used.add(source)
            preserved += 1
            changed += not same_json(old[source], new[target])
            placements[source] = new[target]
        elif row['decision'] != 'new' or source is not None or target in old:
            raise ValueError('Require explicit collision-free new placement.')
        else:
            placements[target] = new[target]
    if old_used != set(old):
        raise ValueError('Unreviewed removal; nothing was changed.')
    def recheck():
        if (captured_bundle(previous) != old_bytes or captured_bundle(incoming) != new_bytes
                or read_bounded(current_file) != current_raw or read_bounded(receipt_file) != receipt_raw
                or read_bounded(catalog_file) != catalog_raw):
            raise ValueError('Inputs changed during review.')

    recheck()
    preview = {'schema': 1, 'kind': 'athena-scrapbook-successor-preview',
            'counts': {'prior': len(old), 'incoming': len(new), 'preservePriorId': preserved,
                       'successorsWithPlacementChanges': changed, 'explicitNew': len(new) - preserved,
                       'wouldRemove': 0},
            'readOnly': True, 'applied': False, 'inferredIdentity': False,
            'sourceRetirementSafe': False}
    return preview, current, room, next_layout['version'], placements, recheck


def review(previous, incoming, current_file, receipt_file, catalog_file):
    return evaluate_review(previous, incoming, current_file, receipt_file, catalog_file)[0]


class PrivateParser(argparse.ArgumentParser):
    def error(self, message):
        print(json.dumps({'error': 'Invalid review arguments; use --help.'}))
        raise SystemExit(2)


def main():
    parser = PrivateParser(description=__doc__)
    for name in ('prior-bundle', 'incoming-bundle', 'current-workspace', 'receipt', 'catalog'):
        parser.add_argument('--' + name, required=True, type=Path)
    args = parser.parse_args()
    try:
        result = review(args.prior_bundle, args.incoming_bundle, args.current_workspace, args.receipt, args.catalog)
    except (OSError, ValueError, TypeError, KeyError, AttributeError, OverflowError, RecursionError):
        print(json.dumps({'error': 'Review refused. Check exact bundles, receipt bindings and current layout; nothing was changed.'}))
        return 2
    print(json.dumps(result))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
