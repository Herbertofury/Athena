"""Prepare a private standalone migration backup without opening the original in SQLite.
Operator must quiesce the original app. Never publish the resulting user database.
"""
import pathlib,hashlib,sqlite3,tempfile,os,argparse,json
LIMIT=64*1024*1024
SUFFIXES=('', '-wal', '-shm', '-journal')
def capture(source):
 result={};total=0
 for suffix in SUFFIXES:
  p=pathlib.Path(str(source)+suffix)
  if p.is_symlink():raise ValueError('Source symlinks not supported')
  if not p.exists():continue
  if not p.is_file():raise ValueError('Source must contain ordinary SQLite files')
  size=p.stat().st_size
  if size>LIMIT:raise ValueError('Source exceeds pilot byte limit')
  # Size metadata can become stale; bound allocation across all sidecars.
  with p.open('rb') as stream:data=stream.read(LIMIT-total+1)
  total+=len(data)
  if total>LIMIT:raise ValueError('Combined source exceeds pilot byte limit')
  result[suffix]=data
 if '' not in result or result[''][:16]!=b'SQLite format 3\0':raise ValueError('Missing SQLite source')
 if '-journal' in result:raise ValueError('Active rollback journal; quiesce application first')
 return result
def digest(parts):return {k:hashlib.sha256(v).hexdigest() for k,v in parts.items()}
def prepare(source,destination,scratch,quiescent=False):
 if not quiescent:raise ValueError('Explicit quiescent-source assertion required')
 source=pathlib.Path(source);destination=pathlib.Path(destination);scratch=pathlib.Path(scratch)
 reserved={pathlib.Path(str(source.resolve())+suffix) for suffix in SUFFIXES}
 if destination.resolve() in reserved:raise ValueError('Destination must not be the source or any source sidecar path')
 if destination.exists() or destination.is_symlink():raise FileExistsError('Destination already exists')
 first=capture(source);identity=digest(first)
 if digest(capture(source))!=identity:raise ValueError('Source changed while capturing; retry after quiescing')
 # SQLite touches only disposable staged copies, never original database/sidecars.
 with tempfile.TemporaryDirectory(prefix='foundry-stage-',dir=scratch) as temporary:
  stage=pathlib.Path(temporary);copy=stage/'source.sqlite'
  copy.write_bytes(first[''])
  if '-wal' in first:(stage/'source.sqlite-wal').write_bytes(first['-wal'])
  target=stage/'prepared.sqlite'
  with sqlite3.connect(copy) as db,sqlite3.connect(target) as out:
   if db.execute('pragma integrity_check').fetchall()!=[('ok',)]:raise ValueError('Staged source integrity failed')
   db.backup(out)
   out.execute('pragma journal_mode=DELETE')
   if out.execute('pragma integrity_check').fetchall()!=[('ok',)]:raise ValueError('Prepared backup integrity failed')
  if digest(capture(source))!=identity:raise ValueError('Source changed during preparation; destination not created')
  payload=target.read_bytes()
  if payload[18:20]!=b'\x01\x01':raise ValueError('Standalone rollback-journal backup required')
  created=False
  try:
   with os.fdopen(os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'wb') as f:
    created=True;f.write(payload);f.flush();os.fsync(f.fileno())
  except BaseException:
   if created:destination.unlink()
   raise
 return {'prepared':True,'private_user_data':True,'source_unchanged_at_checks':True,'source_file_hashes':identity,'destination_sha256':hashlib.sha256(payload).hexdigest(),'destination_bytes':len(payload),'source_wal_present':'-wal' in first,'lossless_app_migration':False}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--destination',required=True);p.add_argument('--scratch',required=True);p.add_argument('--source-quiescent',action='store_true');a=p.parse_args();print(json.dumps(prepare(a.source,a.destination,a.scratch,a.source_quiescent)))
