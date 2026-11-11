"""Original synthetic two-database lab, not a network service or production queue.

Only use trusted fixtures in an owned directory. Hooks inject test faults, including
os._exit in child processes. No automatic retry, cleanup, expiry or remote I/O.
"""
from contextlib import contextmanager
import hashlib
import json
from pathlib import Path
import re
import sqlite3

APP_ID = 0x41545259
TOKEN = re.compile(r'[A-Za-z0-9_.:-]{1,64}', re.ASCII)


class Conflict(ValueError):
    """An existing operation identity has different request bytes."""


def token(value):
    if type(value) is not str or TOKEN.fullmatch(value) is None:
        raise ValueError('expected a 1..64 byte ASCII identity')
    return value


def encode(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True,
                      separators=(',', ':'), allow_nan=False).encode('utf-8')


def payload(name, units):
    if type(name) is not str or not 1 <= len(name.encode('utf-8')) <= 128:
        raise ValueError('name must contain 1..128 UTF-8 bytes')
    if type(units) is not int or not 1 <= units <= 1_000_000:
        raise ValueError('units must be an integer in 1..1000000')
    return encode({'name': name, 'units': units, 'version': 1})


def validate_payload(raw):
    if type(raw) is not bytes or len(raw) > 1024:
        raise ValueError('bounded canonical payload bytes required')
    data = json.loads(raw)
    if type(data) is not dict or set(data) != {'name', 'units', 'version'}:
        raise ValueError('unexpected payload fields')
    if type(data['version']) is not int or data['version'] != 1:
        raise ValueError('unsupported payload version')
    if payload(data['name'], data['units']) != raw:
        raise ValueError('noncanonical payload')
    return raw


def receipt(scope, key, raw, effect_id):
    return encode({'version': 1, 'scope': scope, 'key': key,
                   'payload_sha256': hashlib.sha256(raw).hexdigest(),
                   'effect_id': effect_id})


def validate_receipt(raw_receipt, scope, key, raw_payload):
    if type(raw_receipt) is not bytes or len(raw_receipt) > 512:
        raise ValueError('bounded acknowledgement required')
    data = json.loads(raw_receipt)
    if type(data) is not dict or set(data) != {
            'version', 'scope', 'key', 'payload_sha256', 'effect_id'}:
        raise ValueError('unexpected acknowledgement fields')
    n = data['effect_id']
    if type(n) is not int or not 1 <= n <= 2**63-1:
        raise ValueError('invalid effect identity')
    if receipt(scope, key, raw_payload, n) != raw_receipt:
        raise ValueError('acknowledgement does not match this operation')
    return raw_receipt


@contextmanager
def connect(path, role, *, busy_ms=0):
    if type(busy_ms) is not int or not 0 <= busy_ms <= 5000:
        raise ValueError('busy wait must be in 0..5000 milliseconds')
    # mode=rw refuses a missing database; this is not hostile-path containment.
    conn = sqlite3.connect(Path(path).resolve().as_uri()+'?mode=rw', uri=True,
                           isolation_level=None, timeout=busy_ms/1000)
    try:
        conn.execute('PRAGMA foreign_keys=ON')
        conn.execute('PRAGMA synchronous=FULL')
        if (conn.execute('PRAGMA application_id').fetchone()[0] != APP_ID or
                conn.execute('PRAGMA user_version').fetchone()[0] != 1 or
                conn.execute('SELECT role FROM metadata').fetchall() != [(role,)]):
            raise ValueError('wrong lab fixture identity')
        yield conn
    finally:
        conn.close()


def create_fixture(path, role):
    if role not in ('producer', 'receiver'):
        raise ValueError('unknown fixture role')
    path = Path(path)
    # Refuse overwrite. This creation precondition is for trusted owned fixtures,
    # not an adversarial filesystem race or symlink defense.
    with path.open('xb'):
        pass
    conn = sqlite3.connect(path, isolation_level=None)
    try:
        conn.execute('PRAGMA journal_mode=DELETE')
        conn.execute('PRAGMA synchronous=FULL')
        conn.execute(f'PRAGMA application_id={APP_ID}')
        conn.execute('PRAGMA user_version=1')
        conn.execute('CREATE TABLE metadata(role TEXT NOT NULL)')
        conn.execute('INSERT INTO metadata VALUES(?)', (role,))
        conn.execute('CREATE TABLE effects(id INTEGER PRIMARY KEY, scope TEXT NOT NULL,'
                     ' key TEXT NOT NULL, payload BLOB NOT NULL)')
        conn.execute('CREATE TABLE receipts(scope TEXT NOT NULL, key TEXT NOT NULL,'
                     ' payload BLOB NOT NULL, receipt BLOB NOT NULL,'
                     ' PRIMARY KEY(scope,key))')
        if role == 'producer':
            conn.execute('CREATE TABLE outbox(id INTEGER PRIMARY KEY REFERENCES effects(id),'
                         ' scope TEXT NOT NULL, key TEXT NOT NULL, payload BLOB NOT NULL,'
                         ' acknowledgement BLOB)')
    finally:
        conn.close()


def no_fault(stage):
    pass


@contextmanager
def transaction(conn):
    conn.execute('BEGIN IMMEDIATE')
    try:
        yield
        conn.execute('COMMIT')
    except BaseException:
        if conn.in_transaction:
            conn.execute('ROLLBACK')
        raise


def apply(path, role, scope, key, raw, *, fault=no_fault, deduplicate=True,
          busy_ms=0):
    """One local effect and its receipt; producer additionally writes its outbox.

    deduplicate=False is a deliberately unsafe receiver-only comparison control.
    """
    token(scope); token(key); validate_payload(raw)
    if role not in ('producer', 'receiver') or type(deduplicate) is not bool:
        raise ValueError('invalid mode')
    if role == 'producer' and not deduplicate:
        raise ValueError('unsafe control is receiver-only')
    with connect(path, role, busy_ms=busy_ms) as conn:
        with transaction(conn):
            previous = conn.execute('SELECT payload,receipt FROM receipts'
                                    ' WHERE scope=? AND key=?', (scope,key)).fetchone()
            if deduplicate and previous is not None:
                if previous[0] != raw:
                    raise Conflict('operation key already used with different payload')
                return validate_receipt(previous[1], scope, key, raw)
            row_id = conn.execute('INSERT INTO effects(scope,key,payload) VALUES(?,?,?)',
                                  (scope,key,raw)).lastrowid
            fault('after_effect')
            result = receipt(scope, key, raw, row_id)
            if role == 'producer':
                conn.execute('INSERT INTO outbox VALUES(?,?,?,?,NULL)',
                             (row_id,scope,key,raw))
                fault('after_outbox')
            if deduplicate:
                conn.execute('INSERT INTO receipts VALUES(?,?,?,?)', (scope,key,raw,result))
            fault('after_receipt')
        fault('after_commit')
        return result


def submit(path, scope, key, name, units, **kwargs):
    return apply(path, 'producer', scope, key, payload(name, units), **kwargs)


def receive(path, scope, key, raw, **kwargs):
    return apply(path, 'receiver', scope, key, raw, **kwargs)


def dispatch_one(producer, receiver, *, fault=no_fault, receiver_fault=no_fault,
                 deduplicate=True):
    """Attempt the oldest pending event once, with no network or implicit retry.

    Read, receiver transaction and producer acknowledgement are deliberately
    separate. A lost acknowledgement leaves delivery ambiguous to the producer.
    Multiple dispatchers are safe for this tested duplicate-effect contract, but
    global ordering/fairness and bounded backlog storage are NOT provided.
    """
    if Path(producer).resolve() == Path(receiver).resolve():
        raise ValueError('separate fixture paths required')
    with connect(producer, 'producer') as conn:
        row = conn.execute('SELECT id,scope,key,payload FROM outbox'
                           ' WHERE acknowledgement IS NULL ORDER BY id LIMIT 1').fetchone()
    if row is None:
        return None
    row_id, scope, key, raw = row
    fault('after_read')
    result = receive(receiver, scope, key, raw, fault=receiver_fault,
                     deduplicate=deduplicate)
    fault('after_delivery')
    validate_receipt(result, scope, key, raw)
    with connect(producer, 'producer') as conn:
        with transaction(conn):
            current = conn.execute('SELECT scope,key,payload,acknowledgement FROM outbox'
                                   ' WHERE id=?', (row_id,)).fetchone()
            if current is None or current[:3] != (scope,key,raw):
                raise Conflict('outbox operation changed')
            if current[3] is not None and current[3] != result:
                raise Conflict('different acknowledgement already stored')
            conn.execute('UPDATE outbox SET acknowledgement=? WHERE id=?', (result,row_id))
            fault('before_ack_commit')
    fault('after_ack_commit')
    return result


def snapshot(path, role):
    """Complete logical synthetic state, stable ordering and lossless BLOB hex."""
    with connect(path, role) as conn:
        # One read transaction makes all component tables a consistent snapshot.
        conn.execute('BEGIN')
        tables = ['metadata', 'effects', 'receipts']
        if role == 'producer':
            tables.append('outbox')
        result = {}
        for table in tables:
            rows = conn.execute(f'SELECT * FROM {table} ORDER BY 1,2').fetchall() if table != 'metadata' else conn.execute('SELECT * FROM metadata').fetchall()
            result[table] = [[{'hex': v.hex()} if type(v) is bytes else v for v in row]
                             for row in rows]
        result['integrity_check'] = conn.execute('PRAGMA integrity_check').fetchall()
        result['foreign_key_check'] = conn.execute('PRAGMA foreign_key_check').fetchall()
        conn.execute('COMMIT')
        return result
