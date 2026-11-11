"""Bounded read-query policy over a trusted generated schema, not an SQL sandbox.

No CLI/import path is exposed. Tests own their databases. Untrusted database files,
custom functions/extensions and hostile filesystem paths are explicitly out of scope.
"""
from contextlib import closing
from dataclasses import dataclass
import json
import math
from pathlib import Path
import sqlite3
import time


class Rejected(ValueError):
    pass


@dataclass(frozen=True)
class Policy:
    rows: int = 256
    output_bytes: int = 65536
    progress_callbacks: int = 1000
    progress_interval: int = 100

    def validate(self):
        for value, maximum in ((self.rows, 10000), (self.output_bytes, 1048576),
                               (self.progress_callbacks, 10000),
                               (self.progress_interval, 1000)):
            if type(value) is not int or not 1 <= value <= maximum:
                raise Rejected('invalid policy budget')
        if self.output_bytes < 2:
            raise Rejected('output budget cannot represent an empty array')


def wire_cell(value):
    if value is None or type(value) in (int, str):
        return value
    if type(value) is float:
        if not math.isfinite(value):
            raise Rejected('nonfinite result has no accepted wire representation')
        return value
    if type(value) is bytes:
        return {'blob_hex': value.hex()}
    raise Rejected('unsupported result value')


def run_query(path, sql, parameters=(), *, policy=None, deadline=None,
              cancelled=lambda: False, clock=time.monotonic):
    """Return a complete bounded JSON-row result or raise; never return truncation.

    Parameterized, application-owned query templates should wrap this reference.
    Accepting arbitrary SQL is deliberately limited to the adversarial fixture tests.
    """
    policy = policy or Policy()
    policy.validate()
    if not isinstance(sql, str) or len(sql) > 8192 or len(sql.encode('utf-8')) > 8192:
        raise Rejected('SQL text budget exceeded')
    if type(parameters) not in (tuple, list) or len(parameters) > 16:
        raise Rejected('invalid parameter container/count')
    size = 0
    for value in parameters:
        if value is None:
            continue
        if type(value) is int and -(2**63) <= value < 2**63:
            size += 8
        elif type(value) is float and math.isfinite(value):
            size += 8
        elif type(value) in (str, bytes):
            size += len(value.encode('utf-8')) if type(value) is str else len(value)
        else:
            raise Rejected('unsupported parameter value')
    if size > 16384:
        raise Rejected('parameter byte budget exceeded')
    if deadline is None:
        deadline = clock() + 1.0
    if type(deadline) not in (int, float) or not math.isfinite(deadline):
        raise Rejected('invalid deadline')

    def check_stop():
        if cancelled():
            raise Rejected('cancelled')
        if clock() >= deadline:
            raise Rejected('deadline exhausted')

    check_stop()
    # Read-only URI does not by itself prohibit ATTACH or provide an OS sandbox.
    uri = Path(path).resolve().as_uri() + '?mode=ro'
    with closing(sqlite3.connect(uri, uri=True, isolation_level=None,
                                timeout=0.0, cached_statements=0)) as conn:
        # Fail closed if the runtime cannot support this reference's requirements.
        for name, expected in (('SQLITE_DBCONFIG_DEFENSIVE', True),
                               ('SQLITE_DBCONFIG_TRUSTED_SCHEMA', False),
                               ('SQLITE_DBCONFIG_ENABLE_LOAD_EXTENSION', False)):
            code = getattr(sqlite3, name, None)
            if code is None or not hasattr(conn, 'setconfig'):
                raise Rejected('required SQLite configuration unavailable')
            conn.setconfig(code, expected)
            if conn.getconfig(code) is not expected:
                raise Rejected('required SQLite configuration not applied')
        conn.execute('PRAGMA query_only=ON')
        if conn.execute('PRAGMA query_only').fetchone() != (1,):
            raise Rejected('query-only requirement not applied')
        limits = ((sqlite3.SQLITE_LIMIT_LENGTH, 16384),
                  (sqlite3.SQLITE_LIMIT_SQL_LENGTH, 8192),
                  (sqlite3.SQLITE_LIMIT_COLUMN, 32),
                  (sqlite3.SQLITE_LIMIT_EXPR_DEPTH, 32),
                  (sqlite3.SQLITE_LIMIT_COMPOUND_SELECT, 8),
                  (sqlite3.SQLITE_LIMIT_VARIABLE_NUMBER, 16),
                  (sqlite3.SQLITE_LIMIT_ATTACHED, 0))
        for category, bound in limits:
            conn.setlimit(category, bound)
            if not 0 <= conn.getlimit(category) <= bound:
                raise Rejected('SQLite limit not applied')
        callbacks = 0
        stopped = None
        denied = []
        def authorize(action, first, second, database, source):
            permitted = False
            if source is None:
                if action in (sqlite3.SQLITE_SELECT, sqlite3.SQLITE_RECURSIVE):
                    permitted = True
                elif action == sqlite3.SQLITE_READ:
                    # SQLite 3.53.1 emits database=None for its empty-column
                    # count/rowid read. This narrow exception is safe only in this
                    # fresh connection with ATTACH/temp/view access refused.
                    permitted = (first == 'catalog' and (
                        (database == 'main' and second in ('id', 'name', 'payload')) or
                        (database in ('main', None) and second == '')))
                elif action == sqlite3.SQLITE_FUNCTION:
                    permitted = second in ('count', 'sum', 'length')
            if not permitted and len(denied) < 16:
                # Action names/arguments may contain SQL identifiers; do not log
                # raw user queries or parameter values in a production wrapper.
                denied.append(action)
            return sqlite3.SQLITE_OK if permitted else sqlite3.SQLITE_DENY
        def progress():
            nonlocal callbacks, stopped
            callbacks += 1
            try:
                check_stop()
                if callbacks >= policy.progress_callbacks:
                    raise Rejected('progress callback budget exhausted')
            except Rejected as exc:
                stopped = str(exc)
                return 1
            return 0
        conn.set_authorizer(authorize)
        conn.set_progress_handler(progress, policy.progress_interval)
        rows = []
        used = 2  # Exact bytes of the JSON array, including brackets and commas.
        try:
            check_stop()
            cursor = conn.execute(sql, parameters)
            if cursor.description is None:
                raise Rejected('query does not produce rows')
            for row in cursor:
                check_stop()
                if len(rows) >= policy.rows:
                    raise Rejected('result row budget exceeded; no complete result')
                value = [wire_cell(cell) for cell in row]
                encoded = json.dumps(value, ensure_ascii=False, separators=(',', ':'),
                                     allow_nan=False).encode('utf-8')
                size = len(encoded) + (1 if rows else 0)
                if used + size > policy.output_bytes:
                    raise Rejected('result byte budget exceeded; no complete result')
                used += size
                rows.append(value)
            check_stop()
        except sqlite3.Error as exc:
            reason = stopped or ('query authorization denied' if denied else 'SQLite rejected query')
            raise Rejected(reason) from exc
        return {'state': 'complete', 'rows': rows, 'row_count': len(rows),
                'output_bytes': used, 'progress_callbacks': callbacks,
                'limits': {'rows': policy.rows, 'output_bytes': policy.output_bytes}}
