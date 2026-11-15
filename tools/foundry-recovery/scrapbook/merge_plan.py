"""Create a new private candidate backup; never apply it to the original database."""
import argparse, copy, hashlib, json, os, pathlib, subprocess, tempfile
from convert import verify_bundle, bounded_read, parse
from reconcile import snapshot

def combine(actual, incoming):
 if actual is None:return copy.deepcopy(incoming),len(incoming['active']['placements']),0
 candidate=copy.deepcopy(actual); source=incoming['active']; room=source['roomId']
 target=candidate['layouts'].get(room)
 if target is None:
  candidate['layouts'][room]=copy.deepcopy(source);added=len(source['placements']);identical=0
 else:
  if target['themeId']!=source['themeId']:raise ValueError('Target room theme conflict')
  added=identical=0
  for key,value in source['placements'].items():
   if key in target['placements']:
    if target['placements'][key]!=value:raise ValueError('Conflicting existing placement')
    identical+=1;continue
   # A matching surface/order would make visual stacking dependent on key order.
   surface=(value.get('scope'),value.get('anchor'),value.get('zIndex'))
   if any((v.get('scope'),v.get('anchor'),v.get('zIndex'))==surface for v in target['placements'].values()):raise ValueError('Ambiguous stacking order requires review')
   target['placements'][key]=copy.deepcopy(value);added+=1
  target['version']=max(target['version'],source['version'])
 if candidate['active']['roomId']==room:candidate['active']=copy.deepcopy(candidate['layouts'][room])
 candidate['version']=max(candidate['version'],source['version'])
 return candidate,added,identical

def plan(bundle,database,catalog,binary,destination,quiescent=False):
 if not quiescent:raise ValueError('Explicit quiescence required')
 bundle,database,catalog,destination=map(pathlib.Path,(bundle,database,catalog,destination))
 if destination.exists() or destination.is_symlink():raise FileExistsError('Destination already exists')
 if destination.resolve().is_relative_to(bundle.resolve()):raise ValueError('Destination must be outside bundle')
 names=['source-original.utf8','mapping-private.json','athena-workspace.json','manifest.json']
 before={n:bounded_read(bundle/n) for n in names};catalog_raw=bounded_read(catalog)
 verify_bundle(bundle,catalog);incoming=parse(before['athena-workspace.json'])
 captured=snapshot.capture(database)
 if set(captured)!={''} or int.from_bytes(captured[''][60:64],'big')!=15:raise ValueError('Standalone schema15 required')
 with tempfile.TemporaryDirectory(prefix='athena-scrapbook-plan-') as temp:
  staged=pathlib.Path(temp)/'staged.sqlite';staged.write_bytes(captured[''])
  output=pathlib.Path(temp)/'output.json'
  def native(command,payload=None):
   with output.open('wb') as sink:
    result=subprocess.run([str(binary),command,str(staged)],input=payload,stdout=sink,stderr=subprocess.DEVNULL,timeout=20)
   if result.returncode:raise ValueError('Native validation failed')
   with output.open('rb') as stream:raw=stream.read(4_000_002)
   if len(raw)>4_000_001:raise ValueError('Native output exceeds limit')
   return parse(raw)
  actual=native('load-backup');candidate,added,identical=combine(actual,incoming)
  payload=json.dumps(candidate,ensure_ascii=True,separators=(',',':')).encode('utf8')
  if len(payload)>4_000_000:raise ValueError('Candidate exceeds native ceiling')
  native('save-backup',payload)
  if native('load-backup')!=candidate:raise ValueError('Native normalization changes candidate; review required')
 if snapshot.digest(snapshot.capture(database))!=snapshot.digest(captured):raise ValueError('Database changed')
 if bounded_read(catalog)!=catalog_raw or any(bounded_read(bundle/n)!=raw for n,raw in before.items()):raise ValueError('Inputs changed')
 # Exclusive publication: never replace existing output, original or symlink.
 with os.fdopen(os.open(destination,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'wb') as f:
  f.write(payload);f.flush();os.fsync(f.fileno())
 return {'version':1,'added':added,'already_identical':identical,'candidate_sha256':hashlib.sha256(payload).hexdigest(),'source_snapshot_sha256':snapshot.digest(captured)[''],'applied':False,'contains_private_data':True,'migration_complete':False,'source_retirement_safe':False}

def main():
 p=argparse.ArgumentParser(description=__doc__)
 for name in ['bundle','database','catalog','native-binary','destination']:p.add_argument('--'+name,required=True,type=pathlib.Path)
 p.add_argument('--source-quiescent',action='store_true');a=p.parse_args()
 try:report=plan(a.bundle,a.database,a.catalog,a.native_binary,a.destination,a.source_quiescent)
 except (OSError,ValueError,KeyError,TypeError,AttributeError,subprocess.SubprocessError):
  print(json.dumps({'error':'Merge plan unavailable: verify inputs, target conflicts, standalone snapshot and new destination. Original database not changed; preserve any incomplete new output for review.'}));return 2
 print(json.dumps(report));return 0
if __name__=='__main__':raise SystemExit(main())
