"""Test-only in-memory transport to real bridge Handler and native subprocess."""
import importlib.util,io,json,sys,threading
from email.message import Message
from unittest.mock import Mock
source,binary,database=sys.argv[1:]
spec=importlib.util.spec_from_file_location('test_bridge',source+'/native/foundry/bridge.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
r=json.load(sys.stdin);server=m.Bridge.__new__(m.Bridge);server.binary=binary;server.database=database;server.schema=4;server.host='127.0.0.1:1';server.origin='http://'+server.host;server.operation_lock=threading.RLock()
h=m.Handler.__new__(m.Handler);h.server=server;h.path=r['path'];h.headers=Message();h.headers['Host']=server.host;h.headers['Origin']=server.origin
for k,v in r['headers'].items():h.headers[k]=v
raw=r.get('body','').encode();h.headers['Content-Length']=str(len(raw));h.rfile=io.BufferedReader(io.BytesIO(raw));h.connection=Mock();h.connection.gettimeout.return_value=5
responses=[]
def reply(code,body='',kind='application/json',etag=None):responses.append({'status':code,'body':body.decode() if isinstance(body,bytes) else body,'etag':etag})
h.reply=reply
(h.do_POST if r['method']=='POST' else h.do_GET)()
assert len(responses)==1
print(json.dumps(responses[0]))
