"""Actual local SQLite/CSV exercises using synthetic, bounded fixtures only."""
import csv
from datetime import datetime
import io
from pathlib import Path
import re
import sqlite3
import tempfile
R = Path(__file__).resolve().parent
HEADERS = {'queues': ['queue_id', 'queue_name'], 'tickets': ['ticket_id', 'queue_id', 'opened_at', 'status', 'work_minutes', 'summary'], 'touches': ['touch_id', 'ticket_id', 'minutes']}
WINDOW = {'start': '2026-11-01T00:00:00Z', 'end': '2026-11-03T00:00:00Z'}
DATE_WINDOW = {'start': '2026-11-01T00:00:00Z', 'end': '2026-11-05T00:00:00Z'}
QUERY_NAMES = {'filters', 'metrics', 'groups', 'joins_naive', 'joins_correct', 'dates'}

def bounded_text(path, limit=32768):
    with path.open('rb') as f:
        raw = f.read(limit + 1)
    if len(raw) > limit:
        raise ValueError('bundled file exceeds byte limit')
    return raw.decode('utf-8')

def timestamp(text):
    if not isinstance(text, str) or re.fullmatch('[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z', text) is None:
        raise ValueError('timestamp must be fixed-width UTC YYYY-MM-DDTHH:MM:SSZ')
    datetime.strptime(text, '%Y-%m-%dT%H:%M:%SZ')
    return text

def identifier(value, pattern):
    if re.fullmatch(pattern, value) is None:
        raise ValueError('identifier does not match the fixture contract')
    return value

def number(value, nullable=False):
    if value == '' and nullable:
        return None
    if re.fullmatch('[0-9]{1,4}', value) is None or not 0 <= int(value) <= 1440:
        raise ValueError('minutes must be ASCII integer text from 0 to 1440')
    return int(value)

def label(value):
    if not 1 <= len(value) <= 100 or value != value.strip() or any((ord(c) < 32 for c in value)):
        raise ValueError('label must be 1–100 trimmed characters without C0 controls')
    return value

def parse_csv(kind, text):
    if kind not in HEADERS:
        raise ValueError('fixed fixture kind required')
    if not isinstance(text, str) or len(text.encode('utf-8')) > 32768:
        raise ValueError('CSV must be text of at most 32768 UTF-8 bytes')
    try:
        rows = list(csv.reader(io.StringIO(text, newline=''), strict=True))
    except csv.Error as exc:
        raise ValueError('CSV syntax error') from exc
    if not rows or rows[0] != HEADERS[kind]:
        raise ValueError('exact header and order required')
    if len(rows) > 1001:
        raise ValueError('at most 1000 data rows per fixture')
    result = []
    seen = set()
    for raw in rows[1:]:
        if len(raw) != len(HEADERS[kind]):
            raise ValueError('wrong CSV column count')
        if raw[0] in seen:
            raise ValueError('duplicate primary identifier')
        seen.add(raw[0])
        if kind == 'queues':
            values = (identifier(raw[0], 'Q-[A-Z]'), label(raw[1]))
        elif kind == 'tickets':
            if raw[3] not in ('open', 'closed'):
                raise ValueError('status must be open or closed')
            values = (identifier(raw[0], 'T-[0-9]{3}'), identifier(raw[1], 'Q-[A-Z]'), timestamp(raw[2]), raw[3], number(raw[4], True), label(raw[5]))
        else:
            values = (identifier(raw[0], 'X-[0-9]{3}'), identifier(raw[1], 'T-[0-9]{3}'), number(raw[2]))
        result.append(values)
    return result

def connect():
    if sqlite3.sqlite_version_info < (3, 37, 0):
        raise RuntimeError('SQLite 3.37+ is required for STRICT tables; this runtime has ' + sqlite3.sqlite_version)
    conn = sqlite3.connect(':memory:', isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys=ON')
    if conn.execute('PRAGMA foreign_keys').fetchone()[0] != 1:
        conn.close()
        raise RuntimeError('foreign key enforcement unavailable')
    conn.executescript(bounded_text(R / 'schema.sql'))
    return conn

def load_database():
    parsed = {kind: parse_csv(kind, bounded_text(R / 'fixtures' / (kind + '.csv'))) for kind in HEADERS}
    conn = connect()
    try:
        conn.execute('BEGIN')
        conn.executemany('INSERT INTO queues VALUES (?,?)', parsed['queues'])
        conn.executemany('INSERT INTO tickets VALUES (?,?,?,?,?,?)', parsed['tickets'])
        conn.executemany('INSERT INTO touches VALUES (?,?,?)', parsed['touches'])
        conn.executemany('INSERT INTO calendar VALUES (?)', [(f'2026-11-{day:02d}',) for day in range(1, 5)])
        conn.execute('COMMIT')
    except Exception:
        if conn.in_transaction:
            conn.execute('ROLLBACK')
        conn.close()
        raise
    return conn

def query(conn, name, window=None):
    if name not in QUERY_NAMES:
        raise ValueError('fixed query name required')
    params = dict(WINDOW if window is None else window)
    if set(params) != {'start', 'end'}:
        raise ValueError('exact start/end required')
    timestamp(params['start'])
    timestamp(params['end'])
    if params['start'] >= params['end']:
        raise ValueError('nonempty increasing UTC interval required')
    if name == 'dates' and (params['start'][11:] != '00:00:00Z' or params['end'][11:] != '00:00:00Z'):
        raise ValueError('daily exercise requires UTC-midnight boundaries')
    if name == 'dates' and (not '2026-11-01T00:00:00Z' <= params['start'] < params['end'] <= '2026-11-05T00:00:00Z'):
        raise ValueError('daily exercise calendar covers November 1–4, 2026 UTC only')
    rows = conn.execute(bounded_text(R / 'queries' / (name + '.sql'), 8192), params).fetchall()
    return [dict(row) for row in rows]

def quality_demo(conn):
    before = conn.execute('SELECT COUNT(*) FROM tickets').fetchone()[0]
    try:
        conn.execute('BEGIN')
        conn.execute('INSERT INTO tickets VALUES (?,?,?,?,?,?)', ('T-900', 'Q-R', '2026-11-02T10:00:00Z', 'open', None, 'Synthetic batch row'))
        conn.execute('INSERT INTO tickets VALUES (?,?,?,?,?,?)', ('T-901', 'Q-Z', '2026-11-02T10:00:00Z', 'open', None, 'Invalid queue reference'))
    except sqlite3.IntegrityError:
        conn.execute('ROLLBACK')
        rejected = True
    else:
        conn.execute('ROLLBACK')
        rejected = False
    after = conn.execute('SELECT COUNT(*) FROM tickets').fetchone()[0]
    checks = [tuple(row) for row in conn.execute('PRAGMA foreign_key_check')]
    return dict(foreign_keys_enabled=bool(conn.execute('PRAGMA foreign_keys').fetchone()[0]), invalid_batch_rejected=rejected, before_rows=before, after_rows=after, first_batch_row_absent=conn.execute('SELECT COUNT(*) FROM tickets WHERE ticket_id=?', ('T-900',)).fetchone()[0] == 0, foreign_key_violations=checks, integrity_check=conn.execute('PRAGMA integrity_check').fetchone()[0])

def export_demo(conn):
    rows = query(conn, 'groups')
    fields = list(rows[0]) if rows else ['queue_id', 'queue_name', 'tickets', 'closed', 'observed_work_values', 'work_minutes', 'mean_observed_work_minutes', 'closed_share']
    with tempfile.TemporaryDirectory(prefix='athena-data-export-') as name:
        root = Path(name)
        target = root / 'queue-summary.csv'
        with target.open('w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)
        with target.open('r', encoding='utf-8', newline='') as f:
            readback = list(csv.DictReader(f))
        expected = [{k: '' if value is None else str(value) for k, value in row.items()} for row in rows]
        result = dict(rows=len(readback), headers=fields, text_roundtrip_matches=readback == expected, empty_fields_represent_sql_null=True, bytes=target.stat().st_size, training_row=next((x for x in readback if x['queue_id'] == 'Q-T')))
    result['temporary_directory_removed'] = not root.exists()
    return result
