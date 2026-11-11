#!/usr/bin/env python3
"""Synthetic recovery contract, not a production backup or hostile-file importer.

The CLI creates only its own fixture databases in a new directory. No overwrite,
installation, user-data discovery, remote service or third-party code execution.
"""
from contextlib import closing
import hashlib
import json
import os
from pathlib import Path
import platform
import sqlite3
import sys
import time

APP_ID = 0x41544644
MAX_VERSION = 2


class Rejected(ValueError):
    pass


def connect(path, *, readonly=False):
    if readonly:
        conn = sqlite3.connect(Path(path).resolve().as_uri() + '?mode=ro', uri=True,
                               isolation_level=None, timeout=0.1)
    else:
        conn = sqlite3.connect(path, isolation_level=None, timeout=0.1)
    conn.execute('PRAGMA foreign_keys=ON')
    conn.execute('PRAGMA trusted_schema=OFF')
    if conn.execute('PRAGMA foreign_keys').fetchone() != (1,):
        conn.close()
        raise Rejected('foreign-key enforcement unavailable')
    return conn


def create_fixture(path, count=256):
    """Create synthetic v1 data; keep connection open for WAL tests."""
    if Path(path).exists():
        raise FileExistsError(path)
    conn = connect(path)
    conn.execute('PRAGMA page_size=1024')
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA synchronous=FULL')
    conn.execute('PRAGMA wal_autocheckpoint=0')
    conn.executescript(f'''
      BEGIN IMMEDIATE;
      PRAGMA application_id={APP_ID};
      PRAGMA user_version=1;
      CREATE TABLE owners(id INTEGER PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE items(id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL
        REFERENCES owners(id), payload TEXT NOT NULL);
      INSERT INTO owners VALUES(1, 'synthetic owner');
      COMMIT;
    ''')
    conn.execute('BEGIN IMMEDIATE')
    conn.executemany('INSERT INTO items VALUES(?,1,?)',
                     [(i, json.dumps({'id': i, 'text': 'x' * 128})) for i in range(count)])
    conn.execute('COMMIT')
    return conn


def validate(conn):
    """Validate generated schema and payload semantics, not arbitrary SQLite files."""
    if conn.execute('PRAGMA application_id').fetchone() != (APP_ID,):
        raise Rejected('wrong application identity')
    version = conn.execute('PRAGMA user_version').fetchone()[0]
    if version not in (1, 2):
        raise Rejected('unsupported schema version')
    if conn.execute('PRAGMA integrity_check').fetchall() != [('ok',)]:
        raise Rejected('SQLite structural integrity failure')
    if conn.execute('PRAGMA foreign_key_check').fetchall():
        raise Rejected('foreign-key violation')
    tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_schema WHERE type='table'")}
    if tables != {'owners', 'items'}:
        raise Rejected('unexpected table set')
    expected = ['id', 'owner_id', 'payload'] + (['label'] if version == 2 else [])
    if [r[1] for r in conn.execute('PRAGMA table_info(items)')] != expected:
        raise Rejected('unexpected item columns')
    rows = conn.execute('SELECT id,owner_id,payload FROM items ORDER BY id').fetchall()
    for ident, owner, payload in rows:
        try:
            body = json.loads(payload)
        except (TypeError, ValueError) as exc:
            raise Rejected('invalid payload JSON') from exc
        if not isinstance(body, dict) or type(body.get('id')) is not int or body['id'] != ident:
            raise Rejected('payload identity mismatch')
    owners = conn.execute('SELECT id,name FROM owners ORDER BY id').fetchall()
    full_rows = conn.execute('SELECT * FROM items ORDER BY id').fetchall()
    if version == 2 and any(row[3] != 'imported' for row in full_rows):
        raise Rejected('migration label invariant violated')
    def digest(value):
        return hashlib.sha256(json.dumps(value, ensure_ascii=False,
                              separators=(',', ':')).encode()).hexdigest()
    return {'schema_version': version, 'rows': len(rows), 'owners': len(owners),
            'payload_sha256': digest(rows), 'owners_sha256': digest(owners),
            'logical_sha256': digest({'version': version, 'owners': owners,
                                      'items': full_rows})}


def backup_new(source, destination, *, deadline, progress_hook=None):
    """Copy to a never-used fixture destination; no rename/production publication."""
    destination = Path(destination)
    # Exclusive creation is a collision guard in this private fixture directory,
    # not a guarantee against hostile parent-directory/symlink replacement.
    with destination.open('xb'):
        pass
    calls = []
    with closing(connect(source, readonly=True)) as src, closing(connect(destination)) as dst:
        if time.monotonic() >= deadline:
            raise TimeoutError('backup deadline exhausted before copying')
        def progress(status, remaining, total):
            calls.append({'status': status, 'remaining': remaining, 'total': total})
            if progress_hook:
                progress_hook(status, remaining, total)
            if time.monotonic() >= deadline:
                raise TimeoutError('backup deadline exhausted')
        src.backup(dst, pages=1, progress=progress, sleep=0.001)
        result = validate(dst)
    # Reopen separately. Success here is not fsync/directory or power-loss proof.
    with closing(connect(destination, readonly=True)) as reopened:
        if validate(reopened) != result:
            raise Rejected('reopen mismatch')
    return {'state': 'verified_fixture_copy', 'validation': result, 'steps': calls}


def migrate_v1_to_v2(conn, fault=None):
    """Single explicit transaction. A fault callback can raise or kill this fixture process."""
    validate(conn)
    if conn.execute('PRAGMA user_version').fetchone() != (1,):
        raise Rejected('migration requires version 1')
    conn.execute('BEGIN IMMEDIATE')
    try:
        # Recheck after writer admission; preflight alone is not a migration lock.
        validate(conn)
        if conn.execute('PRAGMA user_version').fetchone() != (1,):
            raise Rejected('schema changed before writer admission')
        # No executescript here: its legacy transaction behavior can commit pending work.
        conn.execute("ALTER TABLE items ADD COLUMN label TEXT NOT NULL DEFAULT ''")
        if fault:
            fault('after_ddl')
        conn.execute("UPDATE items SET label='imported'")
        if fault:
            fault('after_data')
        conn.execute('PRAGMA user_version=2')
        validate(conn)
        if fault:
            fault('before_commit')
        conn.execute('COMMIT')
    except BaseException:
        if conn.in_transaction:
            conn.execute('ROLLBACK')
        raise
    if fault:
        fault('after_commit')


def run_demo(output):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=False)
    source, backup = output / 'synthetic-source.sqlite', output / 'verified-copy.sqlite'
    with closing(create_fixture(source)) as conn:
        before = validate(conn)
        copied = backup_new(source, backup, deadline=time.monotonic()+10)
        migrate_v1_to_v2(conn)
        after = validate(conn)
    result = {
        'evidence': 'synthetic_functional_drill', 'python': platform.python_version(),
        'sqlite': sqlite3.sqlite_version, 'platform': platform.system(),
        'before': before, 'copied': copied, 'after': after,
        'limits': ['No real user data', 'No performance comparison',
                   'No hostile-path importer', 'No power-loss durability claim',
                   'No active-file replacement or production restore']}
    (output/'receipt.json').write_text(json.dumps(result, indent=2)+'\n')
    return result


if __name__ == '__main__':
    if len(sys.argv) == 4 and sys.argv[1] == '--fixture-child':
        # Used only by the controlled subprocess tests against generated fixtures.
        with closing(connect(sys.argv[2])) as child:
            migrate_v1_to_v2(child, lambda phase: os._exit(23) if phase == sys.argv[3] else None)
    elif len(sys.argv) == 2:
        print(json.dumps(run_demo(sys.argv[1]), indent=2))
    else:
        raise SystemExit('usage: recovery_drill.py NEW_OUTPUT_DIRECTORY')
