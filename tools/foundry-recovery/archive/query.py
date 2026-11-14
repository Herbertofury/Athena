#!/usr/bin/env python3
"""Explicit local inspection of a prepared original Feature Foundry SQLite archive."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import stat
import sys

MAX_FILE = 64 * 1024 * 1024
MAX_ROWS = 1000
MAX_VALUE = 4096
MAX_OUTPUT = 4 * 1024 * 1024
FIELDS = {
    'artist_worlds': ('id artist_id name variant description palette material_language shape_language lighting ui_language mascot guardrail raw_json', 'id artist_id name variant'),
    'artist_districts': ('id artist_id name thesis environment_weather best_use_mode raw_json', 'id artist_id name best_use_mode'),
    'artist_weather': ('id artist_id name intensity behavior routing guardrails raw_json', 'id artist_id name intensity'),
    'music_routes': ('id artist_id label routing spotify_uri url status notes raw_json', 'id artist_id label status'),
    'history': ('id event_type payload_json created_at', 'id event_type created_at'),
}

class Refusal(Exception):
    pass


def safe_path(value):
    if '..' in Path(value).parts:
        raise Refusal('Parent traversal paths are unsupported.')
    p = Path(os.path.abspath(value))
    if any(x.is_symlink() for x in (p, *p.parents)):
        raise Refusal('Symlink paths are unsupported.')
    return p


def fingerprint(source):
    p = safe_path(source)
    for suffix in ('-wal', '-shm', '-journal'):
        if os.path.lexists(str(p) + suffix):
            raise Refusal('Source sidecars exist; prepare a standalone backup first.')
    fd = os.open(p, os.O_RDONLY | getattr(os, 'O_NOFOLLOW', 0))
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or not 100 <= info.st_size <= MAX_FILE:
            raise Refusal('Source must be a bounded regular SQLite file.')
        with os.fdopen(fd, 'rb', closefd=False) as f:
            header = f.read(100)
            if header[:16] != b'SQLite format 3\0' or header[18:20] != b'\x01\x01':
                raise Refusal('Only a prepared rollback-journal standalone SQLite backup is supported.')
            digest = hashlib.sha256(header)
            total = len(header)
            while chunk := f.read(1024 * 1024):
                total += len(chunk)
                if total > MAX_FILE or total > info.st_size:
                    raise Refusal('Source changed or exceeds its bound.')
                digest.update(chunk)
        after = os.fstat(fd)
        if (info.st_size, info.st_mtime_ns, info.st_ctime_ns) != (after.st_size, after.st_mtime_ns, after.st_ctime_ns):
            raise Refusal('Source changed during inspection.')
        return (info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns, info.st_ctime_ns, digest.hexdigest())
    finally:
        os.close(fd)


def destination_path(source, destination):
    p = safe_path(destination)
    if not p.parent.is_dir():
        raise Refusal('Destination parent must already exist.')
    source = source.resolve(strict=True)
    candidate = p.parent.resolve(strict=True) / p.name
    if str(candidate) in {str(source) + suffix for suffix in ('', '-wal', '-shm', '-journal')}:
        raise Refusal('Destination must not alias source or reserved sidecars.')
    if os.path.lexists(candidate):
        raise Refusal('Destination already exists; nothing overwritten.')
    return candidate


def expected_columns(table):
    cols = []
    for name in FIELDS[table][0].split():
        kind = 'INTEGER' if table == 'history' and name in ('id', 'created_at') else 'TEXT'
        cols.append((name, kind, 0 if name == 'id' else 1, 1 if name == 'id' else 0))
    return cols


def inspect(source, tables=None, *, private_export=False, destination=None):
    selected = tuple(tables or FIELDS)
    if len(set(selected)) != len(selected) or any(t not in FIELDS for t in selected):
        raise Refusal('Select unique supported table families only.')
    if private_export and os.name != 'posix':
        raise Refusal('Private export requires verified POSIX mode support.')
    if private_export and (not tables or destination is None):
        raise Refusal('Private export requires explicit table selection and a new destination.')
    if destination is not None and not private_export:
        raise Refusal('Destination requires explicit private-export mode.')
    source = safe_path(source)
    target = destination_path(source, destination) if private_export else None
    before = fingerprint(source)
    db = None
    rows = {}
    counts = {}
    try:
        db = sqlite3.connect(source.as_uri() + '?mode=ro&immutable=1', uri=True)
        db.enable_load_extension(False)
        db.execute('PRAGMA trusted_schema=OFF')
        db.execute('PRAGMA query_only=ON')
        db.execute('PRAGMA cache_size=-2048')
        db.setlimit(sqlite3.SQLITE_LIMIT_LENGTH, 1024 * 1024)
        db.setlimit(sqlite3.SQLITE_LIMIT_SQL_LENGTH, 4096)
        db.setlimit(sqlite3.SQLITE_LIMIT_COLUMN, 64)
        db.setlimit(sqlite3.SQLITE_LIMIT_ATTACHED, 0)
        steps = 0
        def progress():
            nonlocal steps
            steps += 1
            return int(steps > 5000)
        db.set_progress_handler(progress, 1000)
        meta = db.execute("SELECT type,sql FROM sqlite_schema WHERE name='metadata'").fetchall()
        if len(meta) != 1 or meta[0][0] != 'table' or not meta[0][1].lstrip().upper().startswith('CREATE TABLE'):
            raise Refusal('Original schema metadata table is required.')
        meta_columns = db.execute('PRAGMA table_xinfo(metadata)').fetchall()
        if [(c[1], c[2].upper(), c[3], c[5]) for c in meta_columns] != [('key', 'TEXT', 0, 1), ('value', 'TEXT', 1, 0)] or any(c[6] for c in meta_columns):
            raise Refusal('Original metadata schema is unsupported.')
        if db.execute("SELECT value FROM metadata WHERE key='schema_version' LIMIT 2").fetchall() != [('1',)]:
            raise Refusal('Unsupported original archive schema version.')
        export_bytes = 0
        for table in selected:
            # Identifiers derive exclusively from the closed FIELDS allowlist above.
            definition = db.execute('SELECT type,sql FROM sqlite_schema WHERE name=?', (table,)).fetchall()
            if len(definition) != 1 or definition[0][0] != 'table' or not definition[0][1].lstrip().upper().startswith('CREATE TABLE'):
                raise Refusal('Selected family must be an ordinary source table.')
            columns = db.execute(f'PRAGMA table_xinfo("{table}")').fetchall()
            if [(c[1], c[2].upper(), c[3], c[5]) for c in columns] != expected_columns(table) or any(c[6] for c in columns):
                raise Refusal('Selected table schema does not match the reviewed original.')
            count = db.execute(f'SELECT count(*) FROM (SELECT 1 FROM "{table}" LIMIT {MAX_ROWS + 1})').fetchone()[0]
            if count > MAX_ROWS:
                raise Refusal('Selected table exceeds the bounded row limit.')
            counts[table] = count
            if not private_export:
                continue
            projected = FIELDS[table][1].split()
            maxima = ','.join(f'coalesce(max(length(cast("{c}" AS blob))),0)' for c in projected)
            if any(n > MAX_VALUE for n in db.execute(f'SELECT {maxima} FROM "{table}"').fetchone()):
                raise Refusal('Projected value exceeds the bounded byte limit.')
            sql = 'SELECT ' + ','.join(f'"{c}"' for c in projected) + f' FROM "{table}" ORDER BY id LIMIT {MAX_ROWS + 1}'
            rows[table] = []
            for values in db.execute(sql):
                for name, value in zip(projected, values):
                    expected = int if table == 'history' and name in ('id', 'created_at') else str
                    if type(value) is not expected:
                        raise Refusal('Projected record has an unsupported value type.')
                export_bytes += sum(len(v.encode('utf8')) if isinstance(v, str) else 24 for v in values)
                if export_bytes > MAX_OUTPUT // 2:
                    raise Refusal('Projected records exceed the export allocation bound.')
                rows[table].append(dict(zip(projected, values)))
    finally:
        if db is not None:
            db.close()
    if fingerprint(source) != before:
        raise Refusal('Source changed; no export is accepted.')
    receipt = {'schema': 1, 'mode': 'private-export' if private_export else 'counts', 'counts': counts,
               'projected_columns': {t: FIELDS[t][1].split() for t in selected}, 'lossless_migration': False}
    if private_export:
        data = json.dumps({'privacy': 'PRIVATE: arbitrary labels and metadata may contain secrets; never publish without review.', 'schema': 1, 'tables': rows}, ensure_ascii=False, separators=(',', ':')).encode('utf8')
        if len(data) > MAX_OUTPUT:
            raise Refusal('Export exceeds bounded output size.')
        fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, 'O_NOFOLLOW', 0), 0o600)
        try:
            os.fchmod(fd, 0o600)
            with os.fdopen(fd, 'wb', closefd=False) as f:
                f.write(data)
                f.flush()
                os.fsync(fd)
            if fingerprint(source) != before:
                raise Refusal('Source changed; private output withdrawn.')
        except BaseException:
            # Remove only the exact file this operation created, never a substituted path.
            try:
                current = os.stat(target, follow_symlinks=False)
                owned = os.fstat(fd)
                if (current.st_dev, current.st_ino) == (owned.st_dev, owned.st_ino):
                    target.unlink()
            except FileNotFoundError:
                pass
            raise
        finally:
            os.close(fd)
        receipt['exported'] = True
    return receipt


class SafeParser(argparse.ArgumentParser):
    def error(self, message):
        print(json.dumps({'ok': False, 'error': 'Invalid archive command arguments. Use --help for supported options.'}))
        raise SystemExit(2)


def main(argv=None):
    parser = SafeParser(description='Local prepared archive counts or explicitly selected PRIVATE metadata export; never a lossless migration.')
    parser.add_argument('--source', required=True)
    parser.add_argument('--table', action='append', choices=tuple(FIELDS))
    parser.add_argument('--private-export', action='store_true')
    parser.add_argument('--destination')
    args = parser.parse_args(argv)
    try:
        result = inspect(args.source, args.table, private_export=args.private_export, destination=args.destination)
    except (OSError, sqlite3.Error, Refusal, ValueError, OverflowError):
        # Intentionally do not echo database errors, file paths, table contents or input values.
        print(json.dumps({'ok': False, 'error': 'Archive inspection refused. Check standalone schema1 source, bounds and exclusive destination; no source changes authorized.'}))
        return 1
    print(json.dumps({'ok': True, **result}))
    return 0

if __name__ == '__main__':
    sys.exit(main())
