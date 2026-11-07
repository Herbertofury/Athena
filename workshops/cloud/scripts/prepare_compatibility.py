"""Copy an Athena dist into this staging pack for content compatibility only."""
import argparse,hashlib,json,shutil
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--athena-root',required=True);args=p.parse_args()
R=Path(__file__).resolve().parents[1];base=Path(args.athena_root).resolve();out=R/'compatibility';out.mkdir(exist_ok=True)
shutil.copytree(base/'dist',out/'dist',dirs_exist_ok=True)
cat=json.loads((base/'src/catalog.json').read_text());new=json.loads((R/'content/cloud-lessons.json').read_text())
assert not ({x['id'] for x in cat['lessons']} & {x['id'] for x in new}),'Already present; review instead of duplicating.'
old_count=len(cat['lessons']);cat['lessons'].extend(new)
(out/'dist/catalog.js').write_text('window.ATHENA_DATA = '+json.dumps(cat,ensure_ascii=False)+';\n')
# No certificate mapping or path/navigation implementation is implied.
ui=(base/'tests/ui.test.cjs').read_text();ui=ui.replace(f'length,{old_count}',f'length,{len(cat["lessons"])}')
(out/'ui-cloud.test.cjs').write_text(ui+'\n'+(R/'tests/cloud_dom_additions.cjs').read_text())
files=[base/'src/catalog.json',base/'dist/app.js',base/'dist/index.html',base/'dist/core.js',base/'dist/workspace-host.js',base/'dist/styles.css',base/'tests/ui.test.cjs']
provenance=dict(kind='isolated copied app with appended content; no live-source edits',base_lesson_count=old_count,snapshot_lesson_count=len(cat['lessons']),
 baseline_files={str(f.relative_to(base)):hashlib.sha256(f.read_bytes()).hexdigest() for f in files},
 snapshot_catalog_sha256=hashlib.sha256((out/'dist/catalog.js').read_bytes()).hexdigest())
(R/'evidence/compatibility-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
print('Prepared isolated snapshot:',old_count,'+',len(new),'=',len(cat['lessons']),'lessons.')
