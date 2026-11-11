"""Owned synthetic paging contract; no network, authorization or production API."""
from contextlib import contextmanager
import json
from pathlib import Path
import re
import sqlite3
import uuid

ORDER = 'sort_value,id:ascending:v1'
MAX_GENERATIONS = 8


class CursorError(ValueError): pass
class GenerationUnavailable(ValueError): pass
class SnapshotLimit(ValueError): pass
class SnapshotMismatch(ValueError): pass


def integer(value, low, high):
    if type(value) is not int or not low <= value <= high:
        raise ValueError('integer outside fixture contract')
    return value


def text(value, bound, *, nonempty=False):
    if not isinstance(value, str) or '\0' in value or (nonempty and not value):
        raise ValueError('invalid fixture text')
    try: size = len(value.encode('utf-8'))
    except UnicodeEncodeError as exc: raise ValueError('invalid UTF-8 text') from exc
    if size > bound: raise ValueError('fixture text bound exceeded')
    return value


def connect(path):
    con = sqlite3.connect(path, autocommit=True, timeout=0.2)
    con.row_factory = sqlite3.Row
    return con


@contextmanager
def transaction(con, *, write):
    if con.in_transaction: raise ValueError('caller transaction is not owned by pager')
    con.execute('BEGIN IMMEDIATE' if write else 'BEGIN')
    try:
        yield
        con.execute('COMMIT')
    except BaseException:
        if con.in_transaction: con.execute('ROLLBACK')
        raise


def create(path):
    if Path(path).exists(): raise FileExistsError('new owned fixture path required')
    con = connect(path)
    try:
        with transaction(con, write=True):
            con.execute('CREATE TABLE identity (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL)')
            con.execute('INSERT INTO identity VALUES(1,?)',(uuid.uuid4().hex,))
            con.execute('''CREATE TABLE live (
                id INTEGER PRIMARY KEY, sort_value INTEGER NOT NULL,
                bucket TEXT NOT NULL, payload TEXT NOT NULL)''')
            con.execute('CREATE INDEX live_order ON live(bucket,sort_value,id)')
            con.execute('''CREATE TABLE generations (
                id INTEGER PRIMARY KEY AUTOINCREMENT, bucket TEXT NOT NULL,
                row_count INTEGER NOT NULL, payload_bytes INTEGER NOT NULL,
                retired INTEGER NOT NULL DEFAULT 0)''')
            con.execute('''CREATE TABLE frozen (
                generation INTEGER NOT NULL, id INTEGER NOT NULL,
                sort_value INTEGER NOT NULL, bucket TEXT NOT NULL, payload TEXT NOT NULL,
                PRIMARY KEY(generation,id))''')
            con.execute('CREATE INDEX frozen_order ON frozen(generation,sort_value,id)')
        return con
    except BaseException:
        con.close(); raise


def put(con, ident, sort_value, bucket, payload):
    args=(integer(ident,1,2**31-1),integer(sort_value,-2**31,2**31-1),
          text(bucket,64,nonempty=True),text(payload,4096))
    with transaction(con,write=True):
        con.execute('''INSERT INTO live VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET
            sort_value=excluded.sort_value,bucket=excluded.bucket,payload=excluded.payload''',args)


def remove(con, ident):
    with transaction(con,write=True): con.execute('DELETE FROM live WHERE id=?',(integer(ident,1,2**31-1),))


def live_rows(con, bucket):
    return [dict(r) for r in con.execute('SELECT * FROM live WHERE bucket=? ORDER BY sort_value,id',(bucket,))]


def capture(con,bucket,*,max_rows=1000,max_payload_bytes=1048576,after_copy=None):
    text(bucket,64,nonempty=True);integer(max_rows,1,1000);integer(max_payload_bytes,1,1048576)
    with transaction(con,write=True):
        if con.execute('SELECT count(*) FROM generations').fetchone()[0]>=MAX_GENERATIONS:
            raise SnapshotLimit('generation capacity exhausted, including retired generations')
        source=[dict(r) for r in con.execute('SELECT * FROM live WHERE bucket=? ORDER BY sort_value,id LIMIT ?', (bucket,max_rows+1))]
        if len(source)>max_rows: raise SnapshotLimit('whole snapshot refused: row limit')
        size=sum(len(r['payload'].encode('utf-8')) for r in source)
        if size>max_payload_bytes: raise SnapshotLimit('whole snapshot refused: payload-byte limit')
        cur=con.execute('INSERT INTO generations(bucket,row_count,payload_bytes) VALUES(?,?,?)',(bucket,len(source),size))
        generation=cur.lastrowid
        con.executemany('INSERT INTO frozen VALUES(?,?,?,?,?)',[(generation,r['id'],r['sort_value'],r['bucket'],r['payload']) for r in source])
        if after_copy: after_copy(con,generation)  # Trusted local fault hook only.
        actual=[dict(r) for r in con.execute('SELECT id,sort_value,bucket,payload FROM frozen WHERE generation=? ORDER BY sort_value,id',(generation,))]
        if actual!=source: raise SnapshotMismatch('materialized generation differs from source')
    return generation


def retire(con,generation):
    with transaction(con,write=True):
        cur=con.execute('UPDATE generations SET retired=1 WHERE id=?',(integer(generation,1,2**63-1),))
        if cur.rowcount!=1: raise GenerationUnavailable('unknown generation')


def _pairs(pairs):
    result={}
    for key,value in pairs:
        if key in result: raise CursorError('duplicate cursor field')
        result[key]=value
    return result


def decode(token):
    try:
        text(token,1024,nonempty=True)
        obj=json.loads(token,object_pairs_hook=_pairs,parse_constant=lambda x: (_ for _ in ()).throw(CursorError('non-finite number')))
        if not isinstance(obj,dict) or set(obj)!={'v','database','generation','bucket','order','size','after','seen'}:
            raise CursorError('cursor fields differ')
        if type(obj['v']) is not int or obj['v']!=1: raise CursorError('cursor version differs')
        if not isinstance(obj['database'],str) or not re.fullmatch('[0-9a-f]{32}',obj['database']): raise CursorError('invalid database identity')
        integer(obj['generation'],1,2**63-1);text(obj['bucket'],64,nonempty=True)
        if obj['order']!=ORDER: raise CursorError('cursor order differs')
        integer(obj['size'],1,25);integer(obj['seen'],1,1000)
        if not isinstance(obj['after'],list) or len(obj['after'])!=2: raise CursorError('invalid boundary')
        integer(obj['after'][0],-2**31,2**31-1);integer(obj['after'][1],1,2**31-1)
        return obj
    except (ValueError,TypeError,RecursionError) as exc:
        if isinstance(exc,CursorError): raise
        raise CursorError(str(exc)) from exc


def page(con,generation,bucket,*,size=25,cursor=None):
    integer(generation,1,2**63-1);text(bucket,64,nonempty=True);integer(size,1,25)
    token=decode(cursor) if cursor is not None else None
    with transaction(con,write=False):
        identity=con.execute('SELECT value FROM identity WHERE id=1').fetchone()[0]
        gen=con.execute('SELECT * FROM generations WHERE id=?',(generation,)).fetchone()
        if gen is None or gen['retired']: raise GenerationUnavailable('generation missing or retired; restart explicitly')
        if gen['bucket']!=bucket: raise CursorError('requested filter differs from generation')
        seen=0;after=None
        if token is not None:
            expected={'database':identity,'generation':generation,'bucket':bucket,'size':size}
            if any(token[k]!=v for k,v in expected.items()): raise CursorError('cursor request binding differs')
            seen=token['seen'];after=token['after']
            boundary=con.execute('SELECT sort_value FROM frozen WHERE generation=? AND id=?',(generation,after[1])).fetchone()
            if boundary is None or boundary[0]!=after[0]: raise CursorError('cursor boundary unavailable')
            # A correctness check, not authentication. Its scan cost is deliberate.
            prefix=con.execute('SELECT count(*) FROM frozen WHERE generation=? AND (sort_value,id)<= (?,?)',(generation,*after)).fetchone()[0]
            if prefix!=seen: raise CursorError('cursor prefix count differs')
        if after is None:
            result=con.execute('SELECT id,sort_value,bucket,payload FROM frozen WHERE generation=? ORDER BY sort_value,id LIMIT ?', (generation,size+1))
        else:
            result=con.execute('SELECT id,sort_value,bucket,payload FROM frozen WHERE generation=? AND (sort_value,id)>(?,?) ORDER BY sort_value,id LIMIT ?', (generation,*after,size+1))
        fetched=[dict(r) for r in result];more=len(fetched)>size;items=fetched[:size];now=seen+len(items)
        if now>gen['row_count'] or (more and now>=gen['row_count']) or (not more and now!=gen['row_count']):
            raise SnapshotMismatch('generation count and page sequence differ')
        next_cursor=None
        if more:
            last=items[-1]
            next_cursor=json.dumps(dict(v=1,database=identity,generation=generation,bucket=bucket,order=ORDER,size=size,after=[last['sort_value'],last['id']],seen=now),sort_keys=True,separators=(',',':'))
        return {'generation':generation,'bucket':bucket,'order':ORDER,'rows':items,
                'next_cursor':next_cursor,'complete':not more,'seen':now,'total':gen['row_count']}
