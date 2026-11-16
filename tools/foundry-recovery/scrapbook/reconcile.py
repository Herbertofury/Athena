"""Read-only authored-placement reconciliation against a standalone native snapshot."""
import argparse, importlib.util, json, pathlib, subprocess, tempfile
from convert import verify_bundle, bounded_read, parse
spec = importlib.util.spec_from_file_location('scrapbook_snapshot', pathlib.Path(__file__).resolve().parents[1]/'sqlite/prepare.py')
snapshot = importlib.util.module_from_spec(spec); spec.loader.exec_module(snapshot)

def reconcile(bundle, database, catalog, binary, quiescent=False):
 if not quiescent: raise ValueError('Explicit quiescent-source assertion required')
 bundle, database, catalog = map(pathlib.Path, (bundle,database,catalog))
 names = ['source-original.utf8','mapping-private.json','athena-workspace.json','manifest.json']
 before = {name:bounded_read(bundle/name) for name in names}; catalog_raw = bounded_read(catalog)
 verify_bundle(bundle,catalog)
 expected = parse(before['athena-workspace.json'])['active']
 captured = snapshot.capture(database)
 if set(captured) != {''}: raise ValueError('Standalone snapshot required')
 if int.from_bytes(captured[''][60:64],'big') != 15: raise ValueError('Schema15 snapshot required')
 # Native validation/read occurs on a disposable copy, never the owner's path.
 with tempfile.TemporaryDirectory(prefix='athena-scrapbook-review-') as tmp:
  copy = pathlib.Path(tmp)/'snapshot.sqlite'; copy.write_bytes(captured[''])
  # A file sink avoids unbounded subprocess stdout allocation. Native workspaces
  # have a 4 MB ceiling; read one sentinel byte and reject any unexpected excess.
  output = pathlib.Path(tmp)/'result.json'
  with output.open('wb') as sink:
   result = subprocess.run([str(binary),'load-backup',str(copy)],stdout=sink,stderr=subprocess.DEVNULL,timeout=20)
  if result.returncode: raise ValueError('Native snapshot validation failed')
  with output.open('rb') as stream: raw = stream.read(4_000_002)
  if len(raw)>4_000_001: raise ValueError('Native output exceeds workspace ceiling')
  actual = parse(raw)
 counts = {'expected':len(expected['placements']),'exact':0,'missing':0,'different':0}
 target = actual.get('layouts',{}).get(expected['roomId']) if isinstance(actual,dict) else None
 same_context = isinstance(target,dict) and target.get('themeId') == expected['themeId']
 placements = target.get('placements',{}) if same_context else {}
 for key, placement in expected['placements'].items():
  counts['missing' if key not in placements else 'exact' if placements[key]==placement else 'different'] += 1
 if snapshot.digest(snapshot.capture(database)) != snapshot.digest(captured): raise ValueError('Source snapshot changed')
 if bounded_read(catalog)!=catalog_raw or any(bounded_read(bundle/n)!=raw for n,raw in before.items()): raise ValueError('Bundle/catalog changed')
 return {'version':1,'counts':counts,'all_mapped_placements_match':counts['exact']==counts['expected'],'migration_complete':False,'source_retirement_safe':False,'scope':'Reviewed mapped authored placement fields only; additional placements, active room, environment, visuals and full app parity are not assessed'}

def main():
 p=argparse.ArgumentParser(description=__doc__)
 for name in ['bundle','database','catalog','native-binary']:p.add_argument('--'+name,required=True,type=pathlib.Path)
 p.add_argument('--source-quiescent',action='store_true');a=p.parse_args()
 try: report=reconcile(a.bundle,a.database,a.catalog,a.native_binary,a.source_quiescent)
 except (OSError,ValueError,TypeError,KeyError,AttributeError,subprocess.SubprocessError):
  print(json.dumps({'error':'Reconciliation unavailable; verify reviewed bundle, standalone schema15 snapshot, trusted built native binary and quiescence. No original writes attempted.'}));return 2
 print(json.dumps(report));return 0 if report['all_mapped_placements_match'] else 1
if __name__=='__main__':raise SystemExit(main())
