"""Actual unified process acceptance using only disposable synthetic databases."""
import socket
import hashlib,http.client,json,os,pathlib,subprocess,sys,tempfile,time
ROOT=pathlib.Path(__file__).resolve().parents[3]
ENGINE=pathlib.Path(os.environ['ATHENA_UNIFIED_ENGINE']).resolve()
STORE=pathlib.Path(os.environ['ATHENA_FOUNDRY_STORE_BINARY']).resolve()
def request(method,path,body=None,headers=None):
 c=http.client.HTTPConnection('127.0.0.1',41379,timeout=10)
 try:
  c.request(method,path,body.encode("utf-8") if isinstance(body,str) else body,headers or {});r=c.getresponse();return r.status,r.getheader('ETag'),r.read().decode()
 finally:c.close()
def main():
 with tempfile.TemporaryDirectory() as t:
  root=pathlib.Path(t);public=root/'public';db=root/'native.sqlite';journal=root/'journal.sqlite'
  subprocess.run([sys.executable,str(ROOT/'scripts/package_app.py'),'--profile','public-preview','--allowlist',str(ROOT/'config/runtime-public-preview.json'),'--output',str(public)],cwd=ROOT,check=True,capture_output=True)
  subprocess.run([str(STORE),'init',str(db)],check=True,capture_output=True)
  for s in ('history','soundtracks','transforms','scopes','environment','targets','instances','appearance','filters','origins','environments','blend-modes','music-precision'):subprocess.run([str(STORE),'upgrade-'+s,str(db)],check=True,capture_output=True)
  before=db.read_bytes()
  for wrong in (db,pathlib.Path(str(db)+'-wal')):
   r=subprocess.run([str(ENGINE),'serve-unified',str(wrong),str(public),str(db)],capture_output=True,timeout=10);assert r.returncode!=0;assert db.read_bytes()==before
  alias=root/'alias.sqlite';os.link(db,alias)
  r=subprocess.run([str(ENGINE),'serve-unified',str(alias),str(public),str(db)],capture_output=True,timeout=10);assert r.returncode!=0;assert db.read_bytes()==before;alias.unlink()
  # Symmetric sidecar name and hardlink collisions must fail before Queue::open.
  for suffix in ('-wal','-shm','-journal'):
   side=pathlib.Path(str(journal)+suffix);os.link(db,side)
   r=subprocess.run([str(ENGINE),'serve-unified',str(journal),str(public),str(side)],capture_output=True,timeout=10);assert r.returncode!=0;assert db.read_bytes()==before;assert not journal.exists();side.unlink()
   native_side=pathlib.Path(str(db)+suffix);native_side.write_bytes(b'ownership sentinel');os.link(native_side,journal)
   r=subprocess.run([str(ENGINE),'serve-unified',str(journal),str(public),str(db)],capture_output=True,timeout=10);assert r.returncode!=0;assert db.read_bytes()==before;assert journal.read_bytes()==b'ownership sentinel';journal.unlink();native_side.unlink()
  h={'Origin':'http://127.0.0.1:41379','X-Athena-Native':'1','Content-Type':'application/json','If-Match':'"empty"'}
  payload=(ROOT/'crates/athena-foundry-store/tests/fixtures/js-workspace.json').read_text()
  def start():
   p=subprocess.Popen([str(ENGINE),'serve-unified',str(journal),str(public),str(db)],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
   for _ in range(100):
    if p.poll() is not None:raise AssertionError(p.stderr.read().decode())
    try:
     if request('GET','/api/runtime')[0]==200:return p
    except OSError:pass
    time.sleep(.05)
   p.kill();p.wait();raise AssertionError('startup timed out')
  p=start()
  try:
   assert json.loads(request('GET','/api/runtime')[2])['application']=='Athena'
   assert request('GET','/__native/backup')[0]==403
   assert request('POST','/__native/backup',payload,{'X-Athena-Native':'1','Content-Type':'application/json','If-Match':'"empty"'})[0]==403
   assert request('POST','/api/jobs','"DedupExperiment"',h)[0]==403
   assert request('GET','/__native/backup',headers={**h,'Origin':'http://evil.invalid'})[0]==403
   # Guards reject before waiting for an unauthenticated body; duplicate guard fails.
   for extra in ('','X-Athena-Native: 1\r\nX-Athena-Native: 1\r\nOrigin: http://127.0.0.1:41379\r\n'):
    with socket.create_connection(('127.0.0.1',41379),timeout=2) as peer:
     peer.sendall(('POST /__native/backup HTTP/1.1\r\nHost: 127.0.0.1:41379\r\n'+extra+'Content-Type: application/json\r\nContent-Length: 100\r\nIf-Match: "empty"\r\n\r\n').encode());assert b'403' in peer.recv(4096).split(b'\r\n')[0]
   assert request('POST','/__native/backup','',dict(h,**{'Content-Length':'4000001'}))[0]==413
   peers=[]
   try:
    for _ in range(4):
     peer=socket.create_connection(('127.0.0.1',41379),timeout=8);peers.append(peer)
     peer.sendall(b'POST /__native/backup HTTP/1.1\r\nHost: 127.0.0.1:41379\r\nOrigin: http://127.0.0.1:41379\r\nX-Athena-Native: 1\r\nContent-Type: application/json\r\nContent-Length: 100\r\nIf-Match: "empty"\r\n\r\n{')
    time.sleep(.2);assert request('GET','/__native/backup',headers=h)[0]==503
    assert b'408' in peers[0].recv(4096).split(b'\r\n')[0]
   finally:
    for peer in peers:peer.close()
   time.sleep(.2)
   code,token,_=request('POST','/__native/backup',payload,h);assert code==200,(code,token)
   stable=db.read_bytes();assert request('POST','/__native/backup',payload,h)[0]==409;assert db.read_bytes()==stable
   assert json.loads(request('GET','/__native/backup',headers=h)[2])==json.loads(payload)
   assert len(json.loads(request('GET','/__native/revisions',headers=h)[2]))==1
   code,_,body=request('POST','/api/jobs','"DedupExperiment"',{'Origin':h['Origin'],'X-Atlas-Request':'local-ui','Content-Type':'application/json'});assert code==200,(code,body)
   for _ in range(100):
    overview=json.loads(request('GET','/api/overview')[2])
    if 'succeeded' in json.dumps(overview):break
    time.sleep(.1)
   else:raise AssertionError('local experiment did not complete')
  finally:p.terminate();p.wait(timeout=10)
  p=start()
  try:
   assert json.loads(request('GET','/__native/backup',headers=h)[2])==json.loads(payload)
   assert 'succeeded' in request('GET','/api/overview')[2]
  finally:p.terminate();p.wait(timeout=10)
  print(json.dumps({'passed':True,'scope':'actual local dual-store process, synthetic workspace and built-in dedup job; not browser or owner data','engine_sha256':hashlib.sha256(ENGINE.read_bytes()).hexdigest(),'checks':['symmetric DB/sidecar and hardlink refusal','pre-body unauthorized and duplicate-header rejection','oversize length rejection','four-slot slow-body admission and deadline','native and Atlas guards remain distinct','workspace compare-save and stale conflict','revision history','bounded offline job','both stores persist across process restart']}))
if __name__=='__main__':main()
