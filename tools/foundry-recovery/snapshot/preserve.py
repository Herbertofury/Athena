"""Explicit offline byte preservation for original living-world-snapshot.json.
No app-directory discovery, JSON interpretation, provider access or native import.
"""
import argparse,hashlib,json,os,re,stat
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

def verify_copy(path,expected_sha256,expected_bytes):
 if not isinstance(expected_sha256,str) or not re.fullmatch(r'[0-9a-f]{64}',expected_sha256):
  raise ValueError('Expected a lowercase SHA-256 from the retained receipt')
 if type(expected_bytes) is not int or not 0<=expected_bytes<=LIMIT:
  raise ValueError('Expected a bounded integer byte count from the retained receipt')
 raw=read_source(path)
 if len(raw)!=expected_bytes or hashlib.sha256(raw).hexdigest()!=expected_sha256:
  raise ValueError('Snapshot copy does not match the retained receipt')
 return {'copy_matches_receipt':True,'bytes':expected_bytes,'native_import':False,'snapshot_semantics_verified':False}

def main():
 parser=argparse.ArgumentParser(description=__doc__)
 mode=parser.add_mutually_exclusive_group(required=True)
 mode.add_argument('--source',type=Path)
 mode.add_argument('--verify-copy',type=Path)
 parser.add_argument('--destination',type=Path)
 parser.add_argument('--source-quiescent',action='store_true')
 parser.add_argument('--expected-sha256')
 parser.add_argument('--expected-bytes')
 args=parser.parse_args()
 if args.verify_copy is not None:
  if args.destination is not None or args.source_quiescent or args.expected_sha256 is None or not re.fullmatch(r'[0-9]{1,8}',args.expected_bytes or ''):
   parser.error('Verification requires only --verify-copy, --expected-sha256 and --expected-bytes.')
  try:result=verify_copy(args.verify_copy,args.expected_sha256,int(args.expected_bytes))
  except (OSError,ValueError):raise SystemExit('Snapshot verification refused; check the retained receipt and selected regular copy.') from None
 else:
  if args.destination is None or args.expected_sha256 is not None or args.expected_bytes is not None:
   parser.error('Preservation requires --source, --destination and --source-quiescent, without receipt options.')
  try:result=preserve(args.source,args.destination,args.source_quiescent)
  except (OSError,ValueError):raise SystemExit('Snapshot preservation refused; check quiescence, bounded regular input and exclusive output.') from None
 print(json.dumps(result))
if __name__=='__main__':main()
