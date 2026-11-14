"""Explicit offline byte preservation for original living-world-snapshot.json.
No app-directory discovery, JSON interpretation, provider access or native import.
"""
import argparse,hashlib,json,os,stat
from pathlib import Path
LIMIT=16*1024*1024

def read_source(path):
 path=Path(path)
 if path.is_symlink() or not path.is_file():raise ValueError('Explicit regular source required')
 with path.open('rb') as stream:
  if not stat.S_ISREG(os.fstat(stream.fileno()).st_mode):raise ValueError('Regular source required')
  raw=stream.read(LIMIT+1)
 if len(raw)>LIMIT:raise ValueError('Source exceeds recovery limit')
 return raw

def preserve(source,destination,quiescent=False):
 if not quiescent:raise ValueError('Stop original application writes and assert source quiescence')
 source,destination=Path(source),Path(destination)
 if source.resolve()==destination.resolve():raise ValueError('New destination required')
 raw=read_source(source)
 # Byte comparison, not JSON reserialization: retain whitespace and malformed files.
 if read_source(source)!=raw:raise ValueError('Source changed before copy')
 created=False
 try:
  with os.fdopen(os.open(destination,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'wb') as output:
   created=True;output.write(raw);output.flush();os.fsync(output.fileno())
  if read_source(source)!=raw:raise ValueError('Source changed during copy')
  if read_source(destination)!=raw:raise ValueError('Copied bytes differ')
 except BaseException:
  if created:destination.unlink()
  raise
 return {'preserved':True,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'source_unchanged_at_checks':True,'native_import':False,'snapshot_semantics_verified':False}

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--source',type=Path,required=True);parser.add_argument('--destination',type=Path,required=True);parser.add_argument('--source-quiescent',action='store_true');args=parser.parse_args()
 try:result=preserve(args.source,args.destination,args.source_quiescent)
 except (OSError,ValueError):raise SystemExit('Snapshot preservation refused; check quiescence, bounded regular input and exclusive output.') from None
 print(json.dumps(result))
if __name__=='__main__':main()
