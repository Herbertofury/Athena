"""Original synthetic conditional-edit reference; not a production HTTP server.

Only generated state, one fixed /document representation, no authentication,
external calls, automatic retries, merges, deletion or production integration.
"""
from contextlib import contextmanager
import hashlib
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from pathlib import Path
import re
import sqlite3
import threading
import uuid

APP_ID=0x41434554
MAX_BODY=1024


class Rejected(Exception):
    def __init__(self,status,code,etag=None):
        super().__init__(code);self.status=status;self.code=code;self.etag=etag


def tags(value):
    """Bounded entity-tag list, preserving opaque commas/backslashes and weak flag.

    None means absent, '*' means wildcard; a list may be empty. This is not a
    general HTTP header parser. At most 16 extra separators and 8 tags are accepted (1024 bytes total).
    """
    if value is None:return None
    if type(value) is not str:raise Rejected(400,'invalid_condition')
    try:wire=value.encode('latin-1')
    except UnicodeEncodeError:raise Rejected(400,'invalid_condition') from None
    if len(wire)>1024:raise Rejected(431,'condition_too_large')
    value=value.strip(' \t')
    if value=='*':return '*'
    result=[];i=0;empties=0
    while i<len(value):
        if value[i] in ' \t':i+=1;continue
        if value[i]==',':
            empties+=1;i+=1
            if empties>16:raise Rejected(431,'too_many_empty_members')
            continue
        weak=value.startswith('W/',i)
        if weak:i+=2
        if i>=len(value) or value[i]!='"':raise Rejected(400,'invalid_condition')
        i+=1;start=i
        while i<len(value) and value[i]!='"':
            c=ord(value[i])
            if not (c==0x21 or 0x23<=c<=0x7e or 0x80<=c<=0xff):
                raise Rejected(400,'invalid_condition')
            i+=1
        if i==len(value):raise Rejected(400,'invalid_condition')
        result.append((weak,value[start:i]));i+=1
        if len(result)>8:raise Rejected(431,'too_many_tags')
        while i<len(value) and value[i] in ' \t':i+=1
        if i<len(value):
            if value[i]!=',':raise Rejected(400,'invalid_condition')
            i+=1
    return result


def matches(condition,current,*,strong):
    if condition=='*':return True  # The one fixture resource always exists.
    opaque=current[1:-1]
    return any(value==opaque and (not strong or not weak) for weak,value in condition)


def unique_object(pairs):
    result={}
    for key,value in pairs:
        if key in result:raise ValueError('duplicate member')
        result[key]=value
    return result


def validate_body(raw):
    if type(raw) is not bytes or len(raw)>MAX_BODY:raise Rejected(413,'body_too_large')
    try:
        # Preserve the exact accepted UTF-8 representation; do not reserialize.
        data=json.loads(raw.decode('utf-8'),object_pairs_hook=unique_object)
        if type(data) is not dict or set(data)!={'title','enabled'}:raise ValueError()
        if type(data['title']) is not str or not 1<=len(data['title'].encode('utf-8'))<=256:raise ValueError()
        if type(data['enabled']) is not bool:raise ValueError()
    except (ValueError,UnicodeError,RecursionError):
        raise Rejected(400,'invalid_document') from None
    return raw


def validator(epoch,revision,body):
    return '"'+epoch+'-'+str(revision)+'-'+hashlib.sha256(body).hexdigest()+'"'


@contextmanager
def connection(path):
    conn=sqlite3.connect(Path(path).resolve().as_uri()+'?mode=rw',uri=True,
                         isolation_level=None,timeout=1)
    try:
        if (conn.execute('PRAGMA application_id').fetchone()[0]!=APP_ID or
                conn.execute('PRAGMA user_version').fetchone()[0]!=1):
            raise ValueError('not a conditional-edit lab fixture')
        conn.execute('PRAGMA synchronous=FULL')
        yield conn
    finally:conn.close()


def create_fixture(path,body=b'{"title":"original","enabled":false}'):
    validate_body(body)
    with Path(path).open('xb'):pass
    conn=sqlite3.connect(path,isolation_level=None)
    try:
        conn.execute(f'PRAGMA application_id={APP_ID}');conn.execute('PRAGMA user_version=1')
        conn.execute('PRAGMA journal_mode=DELETE');conn.execute('PRAGMA synchronous=FULL')
        conn.execute('CREATE TABLE document(id INTEGER PRIMARY KEY CHECK(id=1),epoch TEXT NOT NULL,revision INTEGER NOT NULL,body BLOB NOT NULL)')
        conn.execute('CREATE TABLE history(revision INTEGER PRIMARY KEY,etag TEXT NOT NULL,body BLOB NOT NULL)')
        epoch=uuid.uuid4().hex
        conn.execute('BEGIN IMMEDIATE')
        conn.execute('INSERT INTO document VALUES(1,?,0,?)',(epoch,body))
        conn.execute('INSERT INTO history VALUES(0,?,?)',(validator(epoch,0,body),body))
        conn.execute('COMMIT')
    finally:conn.close()


def current_row(conn):
    row=conn.execute('SELECT epoch,revision,body FROM document WHERE id=1').fetchone()
    if row is None:raise ValueError('missing fixed resource')
    return row


def conditions(current,match,none,method):
    if match is not None and not matches(match,current,strong=True):
        raise Rejected(412,'precondition_failed',current)
    if none is not None and matches(none,current,strong=False):
        if method in ('GET','HEAD'):return 304
        raise Rejected(412,'precondition_failed',current)
    return 200


def read_document(path,if_match=None,if_none_match=None):
    match,none=tags(if_match),tags(if_none_match)
    with connection(path) as conn:
        epoch,revision,body=current_row(conn)
    etag=validator(epoch,revision,body)
    status=conditions(etag,match,none,'GET')
    return {'status':status,'etag':etag,'body':body if status==200 else b'','revision':revision}


def no_fault(stage):pass


def replace_document(path,body,if_match=None,if_none_match=None,*,fault=no_fault):
    validate_body(body)
    match,none=tags(if_match),tags(if_none_match)
    if match is None:raise Rejected(428,'read_document_then_send_If_Match')
    with connection(path) as conn:
        conn.execute('BEGIN IMMEDIATE')
        try:
            epoch,revision,previous=current_row(conn)
            conditions(validator(epoch,revision,previous),match,none,'PUT')
            if revision>=2**63-1:raise Rejected(409,'revision_exhausted')
            new_revision=revision+1;etag=validator(epoch,new_revision,body)
            # Predicate remains coupled to mutation, even inside the write lock.
            changed=conn.execute('UPDATE document SET revision=?,body=? WHERE id=1 AND revision=?',
                                 (new_revision,body,revision)).rowcount
            if changed!=1:raise Rejected(409,'concurrent_revision_change')
            fault('after_update')
            conn.execute('INSERT INTO history VALUES(?,?,?)',(new_revision,etag,body))
            fault('before_commit');conn.execute('COMMIT')
        except BaseException:
            if conn.in_transaction:conn.execute('ROLLBACK')
            raise
    fault('after_commit')
    return {'status':200,'etag':etag,'body':body,'revision':new_revision}


def snapshot(path):
    with connection(path) as conn:
        conn.execute('BEGIN')
        row=current_row(conn)
        history=conn.execute('SELECT revision,etag,body FROM history ORDER BY revision').fetchall()
        result={'epoch':row[0],'revision':row[1],'body_hex':row[2].hex(),
                'history':[{'revision':n,'etag':tag,'body_hex':b.hex()} for n,tag,b in history],
                'integrity_check':conn.execute('PRAGMA integrity_check').fetchall()}
        conn.execute('COMMIT');return result


class Handler(BaseHTTPRequestHandler):
    protocol_version='HTTP/1.0'
    server_version='AthenaSyntheticConditionalLab/1'
    sys_version=''

    def setup(self):
        super().setup();self.connection.settimeout(2)

    def log_message(self,*args):pass

    def condition(self,name):
        values=self.headers.get_all(name)
        return None if values is None else ','.join(values)

    def guarded(self):
        if self.path!='/document':raise Rejected(404,'unknown_resource')
        if self.headers.get_all('Host')!=[self.server.authority]:raise Rejected(403,'host_refused')
        origins=self.headers.get_all('Origin')
        if origins is not None and origins!=['http://'+self.server.authority]:raise Rejected(403,'origin_refused')
        if self.headers.get('Transfer-Encoding') is not None:raise Rejected(400,'transfer_encoding_unsupported')
        if self.headers.get('Content-Encoding') is not None:raise Rejected(415,'content_encoding_unsupported')

    def emit(self,status,body=b'',etag=None,*,head=False):
        self.send_response(status)
        self.send_header('Connection','close')
        self.send_header('Cache-Control','private, no-cache' if status in (200,304) else 'no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        if etag:self.send_header('ETag',etag)
        # A 304 has no body; omit Content-Length rather than incorrectly sending 0.
        if status!=304:
            self.send_header('Content-Type','application/json')
            self.send_header('Content-Length',str(len(body)))
        self.end_headers()
        if body and not head and status!=304:self.wfile.write(body)
        self.close_connection=True

    def execute(self,write=False,head=False):
        try:
            self.guarded()
            match=self.condition('If-Match');none=self.condition('If-None-Match')
            if write:
                if self.headers.get_all('X-Lab-Intent')!=['conditional-write']:raise Rejected(403,'intent_required')
                if self.headers.get_all('Content-Type')!=['application/json']:raise Rejected(415,'json_required')
                lengths=self.headers.get_all('Content-Length')
                if lengths is None:raise Rejected(411,'length_required')
                if len(lengths)!=1 or re.fullmatch(r'0|[1-9][0-9]{0,5}',lengths[0]) is None:
                    raise Rejected(400,'invalid_length')
                count=int(lengths[0])
                if count>MAX_BODY:raise Rejected(413,'body_too_large')
                body=self.rfile.read(count)
                if len(body)!=count:raise Rejected(400,'incomplete_body')
                result=replace_document(self.server.db,body,match,none)
            else:
                if self.headers.get_all('Content-Length') not in (None,['0']):raise Rejected(400,'read_body_unsupported')
                result=read_document(self.server.db,match,none)
        except Rejected as error:
            body=json.dumps({'error':error.code},separators=(',',':')).encode()
            result={'status':error.status,'body':body,'etag':error.etag}
        except (TimeoutError,ConnectionError):
            result={'status':400,'body':b'{"error":"incomplete_transport"}','etag':None}
        except sqlite3.OperationalError:
            result={'status':503,'body':b'{"error":"storage_unavailable"}','etag':None}
        # Response transport can fail after commit. Do not emit a second status
        # or imply rollback; the caller must reconcile an unknown outcome.
        try:self.emit(result['status'],result['body'],result['etag'],head=head)
        except (TimeoutError,ConnectionError):self.close_connection=True

    def do_GET(self):self.execute()
    def do_HEAD(self):self.execute(head=True)
    def do_PUT(self):self.execute(write=True)


@contextmanager
def loopback_fixture(path):
    """One synchronous owned fixture server, ephemeral loopback port, no CLI daemon.

    This is not a production server or authentication/DoS boundary. Real browser,
    TLS, proxy and multi-user behavior require separate target acceptance.
    """
    snapshot(path)
    server=HTTPServer(('127.0.0.1',0),Handler)
    server.db=Path(path);server.authority='127.0.0.1:'+str(server.server_port)
    thread=threading.Thread(target=server.serve_forever,kwargs={'poll_interval':0.01})
    thread.start()
    try:yield server
    finally:
        server.shutdown();thread.join(timeout=5);server.server_close()
        if thread.is_alive():raise RuntimeError('fixture server did not stop')
