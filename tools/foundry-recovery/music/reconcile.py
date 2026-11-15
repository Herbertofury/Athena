"""Count-only offline reconciliation. SQLite opens captured bytes, never source paths."""
import argparse,importlib.util,json,sqlite3,time
from contextlib import closing
from pathlib import Path
from convert import convert,parse,read_bounded,read_music_source
spec=importlib.util.spec_from_file_location('snapshot_capture',Path(__file__).resolve().parents[1]/'sqlite/prepare.py')
capture_module=importlib.util.module_from_spec(spec);spec.loader.exec_module(capture_module)
def reconcile(source,mapping,database,catalog,quiescent=False,capsule=False):
 if not quiescent:raise ValueError('Stop database writers and assert quiescent snapshot')
 raw=read_music_source(Path(source),capsule);mapping_raw=read_bounded(Path(mapping))
 expected=convert(raw,parse(mapping_raw),catalog)
 first=capture_module.capture(Path(database))
 if set(first)!={''}:raise ValueError('Standalone snapshot required; prepare a backup before reconciliation')
 counts={'expected':len(expected['rows']),'exact':0,'missing':0,'different':0}
 with closing(sqlite3.connect(':memory:')) as db:
  db.deserialize(first['']);db.execute('PRAGMA query_only=ON');db.execute('PRAGMA trusted_schema=OFF')
  deadline=time.monotonic()+5
  db.set_progress_handler(lambda:int(time.monotonic()>deadline),1000)
  if db.execute('PRAGMA user_version').fetchone()!=(15,):raise ValueError('Explicit schema15 snapshot required')
  if db.execute("SELECT type FROM sqlite_master WHERE name='soundtracks'").fetchone()!=('table',):raise ValueError('Native soundtrack table required')
  if db.execute('PRAGMA integrity_check').fetchall()!=[('ok',)]:raise ValueError('Snapshot integrity failed')
  for row in expected['rows']:
   a=row['assignment'];wanted=tuple(a[k] for k in ('provider','url','label','status','source_id'))+(row['updated_at'],row['updated_at_ms'])
   actual=db.execute('SELECT provider,url,label,status,source_id,updated_at,updated_at_ms FROM soundtracks WHERE theme_id=? AND room_id=?',(a['theme_id'],a['room_id'])).fetchone()
   counts['missing' if actual is None else 'exact' if actual==wanted else 'different']+=1
 if capture_module.digest(capture_module.capture(Path(database)))!=capture_module.digest(first):raise ValueError('Snapshot changed during reconciliation')
 if read_music_source(Path(source),capsule)!=raw or read_bounded(Path(mapping))!=mapping_raw:raise ValueError('Conversion inputs changed during reconciliation')
 return {'version':1,'counts':counts,'all_mapped_records_match':counts['exact']==counts['expected'],'migration_complete':False,'source_retirement_safe':False,'scope':'Mapped MusicHub bookmark metadata only; no playback, credentials, route or full app parity'}
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--source',required=True,type=Path);p.add_argument('--mapping',required=True,type=Path);p.add_argument('--database',required=True,type=Path);p.add_argument('--source-quiescent',action='store_true');p.add_argument('--capsule',action='store_true');a=p.parse_args()
 try:
  catalog=json.loads((Path(__file__).resolve().parents[3]/'dist/workspaces/foundry/catalog.json').read_text(encoding='utf8'))
  report=reconcile(a.source,a.mapping,a.database,catalog,a.source_quiescent,a.capsule)
 except (OSError,ValueError,sqlite3.Error,AttributeError,TypeError,KeyError):
  print(json.dumps({'error':'Reconciliation unavailable; verify standalone schema15 snapshot, reviewed inputs and quiescence. No source writes attempted.'}));return 2
 print(json.dumps(report));return 0 if report['all_mapped_records_match'] else 1
if __name__=='__main__':raise SystemExit(main())
