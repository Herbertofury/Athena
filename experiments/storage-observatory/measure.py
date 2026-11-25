#!/usr/bin/env python3
"""One-shot Linux storage observation, reporting aggregate metadata only."""
import argparse
import ctypes
from datetime import datetime, timezone
from functools import lru_cache
import json
import os
import re
import stat
import struct
import sys
import time

LIMITS = (20000, 24, 5)
OTHER = 'Other entries'
SHARED = 'Shared across categories'
FILE_FLAGS = getattr(os, 'O_CLOEXEC', 0) | getattr(os, 'O_NOFOLLOW', 0)
DIR_FLAGS = FILE_FLAGS | getattr(os, 'O_DIRECTORY', 0) | os.O_RDONLY
SCAN_FLAGS = DIR_FLAGS | getattr(os, 'O_NOATIME', 0)


def open_root(path):
    # Open each component under a retained directory descriptor, not by text
    # canonicalization or symlink resolution. Whole-volume '/' is not a root.
    if not path.startswith('/') or path.startswith('//') or len(path) > 4096:
        raise ValueError('Select a named absolute directory, not a volume root.')
    parts = path.split('/')[1:]
    if any(part in ('', '.', '..') for part in parts):
        raise ValueError('Use a named absolute directory with no empty, dot or parent components.')
    fd = os.open('/', DIR_FLAGS)
    try:
        for part in parts:
            child = os.open(part, DIR_FLAGS, dir_fd=fd)
            os.close(fd)
            fd = child
        return fd
    except BaseException:
        os.close(fd)
        raise


# Linux UAPI, not native struct stat: the fixed 256-byte struct statx has
# stx_mask at byte 0 and stx_mnt_id at byte 144 on all Linux architectures.
AT_EMPTY_PATH = 0x1000
STATX_MNT_ID = 0x1000
_STATX_BUFFER = ctypes.c_uint64 * (256 // 8)


@lru_cache(maxsize=1)
def _statx():
    # Use the process libc when the symbol exists. A smaller or older Linux
    # userspace can continue to use descriptor metadata under /proc.
    try:
        fn = getattr(ctypes.CDLL(None), 'statx', None)
    except OSError:
        return None
    if fn is not None:
        fn.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_int, ctypes.c_uint, ctypes.c_void_p]
        fn.restype = ctypes.c_int
    return fn


def mount_id(fd):
    # This asks about the exact already-open descriptor, never about a path
    # that could be retargeted after the caller checked it.
    fn = _statx()
    if fn is not None:
        buf = _STATX_BUFFER()
        if fn(fd, b'', AT_EMPTY_PATH, STATX_MNT_ID, ctypes.byref(buf)) == 0:
            if struct.unpack_from('=I', buf)[0] & STATX_MNT_ID:
                return struct.unpack_from('=Q', buf, 144)[0]
    return proc_mount_id(fd)


def proc_mount_id(fd):
    # Same-device bind mounts also cut across the selected directory boundary.
    # This reads only metadata for our own opened descriptor, never scan data.
    with open(f'/proc/self/fdinfo/{fd}', encoding='ascii', errors='strict') as info:
        for line in info:
            if line.startswith('mnt_id:'):
                return int(line.split(':', 1)[1])
    raise OSError('Mount identity unavailable')


def categories(raw):
    result = {}
    if len(raw) > 32:
        raise ValueError('At most 32 explicit categories are allowed.')
    seen = {OTHER.casefold(), SHARED.casefold()}
    for binding in raw:
        label, sep, child = binding.partition('=')
        if (not sep or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9 ._&()-]{0,63}', label)
                or label != label.strip() or label.casefold() in seen
                or child in ('', '.', '..') or '/' in child or '\0' in child or child in result):
            raise ValueError('Categories require a unique readable LABEL=DIRECT_CHILD binding.')
        result[child] = label
        seen.add(label.casefold())
    return result


def measure(root, labels, limits=LIMITS):
    if sys.platform != 'linux' or not all(hasattr(os, flag) for flag in ('O_NOFOLLOW', 'O_PATH', 'O_NOATIME')):
        raise ValueError('This observation adapter supports Linux only.')
    max_entries, max_depth, seconds = limits
    stops = dict.fromkeys(('entryLimit', 'depthLimit', 'deadline', 'unreadable', 'changed'), 0)
    skipped = dict.fromkeys(('links', 'mounts', 'special'), 0)
    observed = {label: {'logicalBytes': 0, 'allocatedBytes': 0, 'files': 0}
                for label in [*labels.values(), OTHER, SHARED]}
    inodes = {}
    total_count = 0
    deadline = time.monotonic() + seconds
    measured = set()
    stamp = lambda st: (st.st_dev, st.st_ino, st.st_mtime_ns, st.st_ctime_ns)
    def expired():
        if time.monotonic() >= deadline:
            stops['deadline'] = 1
            return True
        return False
    def walk(fd, label, depth):
        nonlocal total_count
        before = stamp(os.fstat(fd))
        try:
            with os.scandir(fd) as entries:
                for entry in entries:
                    if expired() or stops['entryLimit']:
                        break
                    if total_count >= max_entries:
                        stops['entryLimit'] = 1
                        break
                    total_count += 1
                    child_label = labels.get(entry.name, OTHER) if depth == 0 else label
                    try:
                        st = entry.stat(follow_symlinks=False)
                        mode = st.st_mode
                        if stat.S_ISLNK(mode):
                            skipped['links'] += 1
                        elif stat.S_ISDIR(mode) or stat.S_ISREG(mode):
                            # O_PATH opens only an identity handle, not file contents.
                            child = os.open(entry.name, os.O_PATH | FILE_FLAGS, dir_fd=fd)
                            try:
                                actual = os.fstat(child)
                                if stamp(actual) != stamp(st) or actual.st_mode != mode:
                                    stops['changed'] += 1
                                elif actual.st_dev != root_dev or mount_id(child) != root_mnt:
                                    skipped['mounts'] += 1
                                elif stat.S_ISDIR(mode):
                                    if depth >= max_depth:
                                        stops['depthLimit'] += 1
                                    else:
                                        sub = os.open('.', SCAN_FLAGS, dir_fd=child)
                                        try: walk(sub, child_label, depth + 1)
                                        finally: os.close(sub)
                                else:
                                    row = observed[child_label]
                                    row['files'] += 1
                                    row['logicalBytes'] += actual.st_size
                                    key = (actual.st_dev, actual.st_ino)
                                    prior = inodes.get(key)
                                    allocated = actual.st_blocks * 512
                                    if prior is None:
                                        inodes[key] = [allocated, child_label, stamp(actual)]
                                    elif prior[2] != stamp(actual) or prior[0] != allocated:
                                        stops['changed'] += 1
                                    elif prior[1] != child_label:
                                        prior[1] = SHARED
                                    measured.add(child_label)
                            finally:
                                os.close(child)
                        else:
                            skipped['special'] += 1
                    except FileNotFoundError:
                        stops['changed'] += 1
                    except OSError:
                        stops['unreadable'] += 1
        except OSError:
            stops['unreadable'] += 1
        if stamp(os.fstat(fd)) != before:
            stops['changed'] += 1
    fd = open_root(root)
    try:
        root_dev = os.fstat(fd).st_dev
        root_mnt = mount_id(fd)
        if not expired():
            scan_fd = os.open('.', SCAN_FLAGS, dir_fd=fd)
            try: walk(scan_fd, OTHER, 0)
            finally: os.close(scan_fd)
    finally:
        os.close(fd)
    # The final directory read or metadata check can cross the deadline without
    # another iteration. Preserve measured values, but never report a clean scan.
    expired()
    for allocated, label, _ in inodes.values():
        observed[label]['allocatedBytes'] += allocated
    rows = [{'name': name, **row} for name, row in observed.items()
            if name in labels.values() or name in measured or row['allocatedBytes']]
    totals = {k: sum(row[k] for row in rows) for k in ('logicalBytes', 'allocatedBytes', 'files')}
    if any(value < 0 or value > 2**53 - 1 for value in totals.values()):
        raise ValueError('Measurement exceeds the report integer range.')
    return {'schema': 'athena-storage-observation-v1', 'platform': 'linux',
            'observedAt': datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z'),
            'partial': any(stops.values()), 'stops': stops, 'skipped': skipped,
            'totals': {**totals, 'physicalFiles': len(inodes)}, 'categories': rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', help='Explicitly selected named absolute directory')
    parser.add_argument('--category', metavar='LABEL=DIRECT_CHILD', action='append', default=[])
    args = parser.parse_args()
    try:
        report = measure(args.root, categories(args.category))
        print(json.dumps(report, indent=2, ensure_ascii=True, allow_nan=False))
    except (OSError, ValueError):
        print('Observation refused: select an accessible standalone Linux directory and valid category bindings.', file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
