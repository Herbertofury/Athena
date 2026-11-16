"""Prepare missing-only import JSON without touching the original native store."""
import argparse,hashlib,json,os,sqlite3
from pathlib import Path
from reconcile import _analyze

def plan(source,mapping,database,catalog,destination,quiescent=False,capsule=False):
 destination=Path(destination)
 if destination.exists() or destination.is_symlink():raise FileExistsError('Destination exists')
 report,payload,snapshot_hash=_analyze(source,mapping,database,catalog,quiescent,capsule)
 if report['counts']['different']:raise ValueError('Conflicting mapped records require review')
 raw=json.dumps(payload,ensure_ascii=True,separators=(',',':')).encode('utf8')
 if len(raw)>1_000_000:raise ValueError('Missing-only payload exceeds importer bound')
 with os.fdopen(os.open(destination,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'wb') as f:
  f.write(raw);f.flush();os.fsync(f.fileno())
 return {'version':1,'missing_records':len(payload['rows']),'already_identical':report['counts']['exact'],'source_snapshot_sha256':snapshot_hash,'candidate_sha256':hashlib.sha256(raw).hexdigest(),'applied':False,'contains_private_data':True,'migration_complete':False,'source_retirement_safe':False}

def main():
 p=argparse.ArgumentParser(description=__doc__)
 for name in ['source','mapping','database','destination']:p.add_argument('--'+name,required=True,type=Path)
 p.add_argument('--source-quiescent',action='store_true');p.add_argument('--capsule',action='store_true');a=p.parse_args()
 try:
  catalog=json.loads((Path(__file__).resolve().parents[3]/'dist/workspaces/foundry/catalog.json').read_text(encoding='utf8'))
  report=plan(a.source,a.mapping,a.database,catalog,a.destination,a.source_quiescent,a.capsule)
 except (OSError,ValueError,sqlite3.Error,AttributeError,TypeError,KeyError):
  print(json.dumps({'error':'Resume plan unavailable; verify inputs, quiescent standalone snapshot, conflicts and new destination. Original store unchanged; preserve incomplete new output for review.'}));return 2
 print(json.dumps(report));return 0
if __name__=='__main__':raise SystemExit(main())
