"""Run fresh synthetic cases over owned loopback HTTP; retain every exchange."""
from datetime import datetime, timezone
import hashlib
import http.client
import json
from pathlib import Path
import platform
import sqlite3
import sys
import traceback

import conditional_edit as lab

A=b'{"title":"client A","enabled":false}'
B=b'{"title":"original","enabled":true}'


def require(condition,message):
    if not condition:raise RuntimeError(message)


def run(output):
    output=Path(output);output.mkdir(parents=True,exist_ok=False)
    report={'schema_version':1,'evidence':'measured_synthetic_owned_loopback',
            'checked_at':datetime.now(timezone.utc).isoformat(),
            'environment':{'python':platform.python_version(),'sqlite':sqlite3.sqlite_version,
                           'os':platform.system(),'machine':platform.machine(),
                           'http_server':'synchronous HTTP/1.0; ephemeral 127.0.0.1'},
            'source_sha256':{name:hashlib.sha256(Path(__file__).with_name(name).read_bytes()).hexdigest()
                             for name in ('conditional_edit.py','run_demo.py')},
            'cases':[],'passed':False,
            'not_established':['browser or proxy cache behavior','production authentication or TLS',
                               'crash or power-loss durability','target integration','performance improvement']}
    def case(name,operation):
        path=output/(name+'.sqlite');lab.create_fixture(path)
        record={'name':name,'initial_state':lab.snapshot(path),'exchanges':[],'passed':False}
        report['cases'].append(record)
        try:
            with lab.loopback_fixture(path) as server:
                def request(method='GET',body=b'',headers=None):
                    actual={'Host':server.authority,'Connection':'close'}
                    if method=='PUT':actual.update({'Content-Type':'application/json','X-Lab-Intent':'conditional-write','Content-Length':str(len(body))})
                    actual.update(headers or {})
                    exchange={'method':method,'path':'/document','request_headers':actual,
                              'request_body_hex':body.hex()};record['exchanges'].append(exchange)
                    conn=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=4)
                    try:
                        conn.putrequest(method,'/document',skip_host=True,skip_accept_encoding=True)
                        for key,value in actual.items():conn.putheader(key,value)
                        conn.endheaders(body or None)
                        response=conn.getresponse();data=response.read();result=dict(response.getheaders())
                        exchange.update({'status':response.status,'response_headers':result,'response_body_hex':data.hex()})
                        return response.status,result,data
                    except BaseException as error:
                        exchange['error_type']=type(error).__name__;raise
                    finally:conn.close()
                operation(request)
            record['final_state']=lab.snapshot(path);record['passed']=True
        except BaseException:
            record['traceback']=traceback.format_exc();raise

    def stale(q):
        _,h,original=q();tag=h['ETag']
        require(q('GET')[1]['ETag']==tag,'editors must share initial version')
        require(q('PUT',A,{'If-Match':tag})[0]==200,'first edit failed')
        require(q('PUT',B,{'If-Match':tag})[0]==412,'stale edit was not refused')
        require(q()[2]==A,'stale edit overwrote accepted edit')

    def wildcard(q):
        require(q('PUT',A,{'If-Match':'*'})[0]==200,'first wildcard failed')
        require(q('PUT',B,{'If-Match':'*'})[0]==200,'second wildcard failed')
        require(q()[2]==B,'negative control did not overwrite first edit')

    def weak(q):
        _,h,original=q();tag=h['ETag']
        require(q('PUT',A,{'If-Match':'W/'+tag})[0]==412,'weak write was accepted')
        require(q()[2]==original,'weak refusal mutated state')

    def missing(q):
        status,h,body=q('PUT',A)
        require(status==428 and h['Cache-Control']=='no-store','missing condition not explained/noncacheable')
        require(json.loads(body)['error']=='read_document_then_send_If_Match','missing resubmission hint')

    def cache(q):
        _,h,cached=q();old=h['ETag']
        status,h,body=q(headers={'If-None-Match':'W/'+old})
        require(status==304 and body==b'' and 'Content-Length' not in h,'invalid 304 framing')
        # Deliberately tiny client cache model, not a browser/cache conformance test.
        retained=cached if status==304 else body
        require(retained==cached and retained!=b'','304 replaced retained representation with empty bytes')
        require(q('PUT',A,{'If-Match':old})[0]==200,'cache mutation failed')
        status,h,body=q(headers={'If-None-Match':old})
        require(status==200 and body==A and h['ETag']!=old,'stale validator did not fetch current representation')

    def exact(q):
        raw=b' { "enabled" : true, "title" : "\xc3\xa9" }\n'
        _,h,_=q();status,h,body=q('PUT',raw,{'If-Match':h['ETag']})
        require(status==200 and body==raw,'PUT transformed representation')
        tag=h['ETag'];status,h,body=q()
        require(body==raw and h['ETag']==tag,'GET differs from accepted representation')
        status,h,body=q('HEAD')
        require(status==200 and body==b'' and int(h['Content-Length'])==len(raw),'HEAD framing differs')

    try:
        for name,fn in [('stale_editor_refused',stale),('wildcard_overwrite_control',wildcard),
                        ('weak_write_refused',weak),('missing_condition_explained',missing),
                        ('cache_revalidation_model',cache),('exact_representation_bytes',exact)]:case(name,fn)
        report['passed']=True
    finally:(output/'result.json').write_text(json.dumps(report,indent=2)+'\n')
    return report


if __name__=='__main__':
    if len(sys.argv)!=2:raise SystemExit('usage: python3 run_demo.py NEW_OUTPUT_DIRECTORY')
    report=run(sys.argv[1]);print(json.dumps({'passed':report['passed'],'cases':len(report['cases'])}))
