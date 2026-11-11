"""Owned synthetic SQLite FTS5 consistency lab, not a production storage API."""
from contextlib import contextmanager
from pathlib import Path
import json
import sqlite3

SCHEMA = (
    """CREATE TABLE documents (
        id INTEGER PRIMARY KEY,
        external_key TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        metadata_json TEXT NOT NULL
    )""",
    """CREATE VIRTUAL TABLE search_index USING fts5(
        title, body, content='documents', content_rowid='id',
        tokenize='unicode61 remove_diacritics 0'
    )""",
    """CREATE TRIGGER documents_insert AFTER INSERT ON documents BEGIN
        INSERT INTO search_index(rowid,title,body) VALUES(new.id,new.title,new.body);
    END""",
    """CREATE TRIGGER documents_delete AFTER DELETE ON documents BEGIN
        INSERT INTO search_index(search_index,rowid,title,body)
        VALUES('delete',old.id,old.title,old.body);
    END""",
    """CREATE TRIGGER documents_update AFTER UPDATE ON documents BEGIN
        INSERT INTO search_index(search_index,rowid,title,body)
        VALUES('delete',old.id,old.title,old.body);
        INSERT INTO search_index(rowid,title,body) VALUES(new.id,new.title,new.body);
    END""",
)
COLUMNS = ('id', 'external_key', 'title', 'body', 'metadata_json')


class ResultLimitExceeded(ValueError):
    """The whole result was refused; no silently truncated success."""


def connect(path):
    # Python 3.12+: own transaction boundaries, no executescript in a transaction.
    con = sqlite3.connect(path, autocommit=True, timeout=0.2)
    con.row_factory = sqlite3.Row
    return con


@contextmanager
def transaction(con):
    if con.in_transaction:
        raise ValueError('caller transaction would be overwritten')
    con.execute('BEGIN IMMEDIATE')
    try:
        yield
        con.execute('COMMIT')
    except BaseException:
        if con.in_transaction:
            con.execute('ROLLBACK')
        raise


def record(key, title, body='', metadata_json='{}'):
    values = (key, title, body, metadata_json)
    for value, bound in zip(values, (256, 2048, 8192, 8192)):
        if not isinstance(value, str) or '\0' in value:
            raise ValueError('text without NUL required')
        try:
            size = len(value.encode('utf-8'))
        except UnicodeEncodeError as exc:
            raise ValueError('valid UTF-8 text required') from exc
        if size > bound:
            raise ValueError('record field exceeds fixture bound')
    if not key:
        raise ValueError('empty external key')
    # Metadata is an opaque UTF-8 payload; retain bytes, do not normalize/drop fields.
    return values


def create(path, rows=(), *, backfill=True, wal=False):
    path = Path(path)
    # Synthetic lab callers supply an unused path under an owned directory.
    if path.exists():
        raise FileExistsError('lab refuses an existing database')
    con = connect(path)
    try:
        if wal:
            mode = con.execute('PRAGMA journal_mode=WAL').fetchone()[0]
            if mode != 'wal':
                raise RuntimeError('WAL was not enabled')
        con.execute('PRAGMA synchronous=FULL')
        with transaction(con):
            con.execute(SCHEMA[0])
            for row in rows:
                con.execute('INSERT INTO documents(external_key,title,body,metadata_json) VALUES(?,?,?,?)', record(*row))
            for statement in SCHEMA[1:]:
                con.execute(statement)
            if backfill:
                con.execute("INSERT INTO search_index(search_index) VALUES('rebuild')")
                con.execute("INSERT INTO search_index(search_index,rank) VALUES('integrity-check',1)")
        return con
    except BaseException:
        con.close()
        raise


def rows(con):
    return [dict(r) for r in con.execute('SELECT * FROM documents ORDER BY id')]


def put(con, key, title, body='', metadata_json='{}', *, after_write=None):
    values = record(key, title, body, metadata_json)
    with transaction(con):
        con.execute('''INSERT INTO documents(external_key,title,body,metadata_json) VALUES(?,?,?,?)
            ON CONFLICT(external_key) DO UPDATE SET title=excluded.title,
            body=excluded.body, metadata_json=excluded.metadata_json''', values)
        if after_write:
            after_write(con)  # Trusted test fault hook, never external code.


def remove(con, key):
    with transaction(con):
        con.execute('DELETE FROM documents WHERE external_key=?', (key,))


def exact(con, key):
    value = con.execute('SELECT * FROM documents WHERE external_key=?', (key,)).fetchone()
    return dict(value) if value is not None else None


def phrase(text):
    if not isinstance(text, str) or not text.strip() or '\0' in text:
        raise ValueError('nonempty text without NUL required')
    try:
        size = len(text.encode('utf-8'))
    except UnicodeEncodeError as exc:
        raise ValueError('valid UTF-8 query required') from exc
    if size > 256:
        raise ValueError('query exceeds fixture bound')
    return '"' + text.replace('"', '""') + '"'


def search(con, text, *, max_results=100):
    if type(max_results) is not int or not 1 <= max_results <= 100:
        raise ValueError('result limit must be 1..100')
    expression = phrase(text)
    # One statement resolves every hit in one DB snapshot. LEFT JOIN exposes
    # orphan postings instead of silently discarding them, but cannot detect all drift.
    result = [dict(r) for r in con.execute('''SELECT d.* FROM search_index
        LEFT JOIN documents AS d ON d.id=search_index.rowid
        WHERE search_index MATCH ? ORDER BY search_index.rowid LIMIT ?''',
        (expression, max_results + 1))]
    if len(result) > max_results:
        raise ResultLimitExceeded('complete result exceeds declared limit')
    if any(r['id'] is None for r in result):
        raise RuntimeError('orphan full-text posting; canonical data unavailable')
    return result


def _error(exc):
    return {'type': type(exc).__name__, 'message': str(exc),
            'sqlite_errorcode': getattr(exc, 'sqlite_errorcode', None),
            'sqlite_errorname': getattr(exc, 'sqlite_errorname', None)}


def audit(con):
    """Point-in-time diagnostic. Takes a write lock; never calls rebuild."""
    results = {}
    for label, sql in (
        ('sqlite_integrity', 'PRAGMA integrity_check'),
        ('fts_internal', "INSERT INTO search_index(search_index) VALUES('integrity-check')"),
        ('fts_external_content', "INSERT INTO search_index(search_index,rank) VALUES('integrity-check',1)"),
    ):
        try:
            # Each diagnostic is separate; this report is not an atomic audit
            # across all commands if another writer changes the DB between them.
            with transaction(con):
                values = [list(r) for r in con.execute(sql)]
                results[label] = {'ok': values == [['ok']] if label == 'sqlite_integrity' else True,
                                  'result': values}
        except sqlite3.Error as exc:
            results[label] = {'ok': False, 'error': _error(exc)}
    return results


def rebuild(con, *, after_rebuild=None):
    """Rebuild derived postings and validate in the same write transaction."""
    with transaction(con):
        before = rows(con)
        con.execute("INSERT INTO search_index(search_index) VALUES('rebuild')")
        if after_rebuild:
            after_rebuild(con)
        con.execute("INSERT INTO search_index(search_index,rank) VALUES('integrity-check',1)")
        if rows(con) != before:
            raise RuntimeError('rebuild changed canonical rows')
    return {'canonical_rows': len(before), 'external_content_checked': True}


def environment(con):
    import platform
    return {'python': platform.python_version(), 'platform': platform.platform(),
            'sqlite': sqlite3.sqlite_version,
            'sqlite_source_id': con.execute('SELECT sqlite_source_id()').fetchone()[0],
            'compile_options': [r[0] for r in con.execute('PRAGMA compile_options')],
            'journal_mode': con.execute('PRAGMA journal_mode').fetchone()[0],
            'synchronous': con.execute('PRAGMA synchronous').fetchone()[0],
            'tokenizer': 'unicode61 remove_diacritics 0',
            'fixture_only': True}
