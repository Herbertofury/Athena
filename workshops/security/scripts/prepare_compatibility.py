"""Build an isolated test snapshot. Never modifies the supplied Athena tree."""
import argparse,hashlib,json,shutil
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--athena-root',required=True);a=p.parse_args()
R=Path(__file__).resolve().parents[1];base=Path(a.athena_root).resolve()
# No arbitrary output path: all writes stay inside this staging pack.
out=R/'compatibility';out.mkdir(exist_ok=True)
shutil.copytree(base/'dist',out/'dist',dirs_exist_ok=True)
cat=json.loads((base/'src/catalog.json').read_text())
new=json.loads((R/'content/security-lessons.json').read_text())
assert not ({x['id'] for x in cat['lessons']} & {x['id'] for x in new}), 'Source already has these lessons; review instead of duplicating.'
cat['lessons'].extend(new)
next(x for x in cat['certifications'] if x['id']=='security-plus')['lessonIds'].extend(x['id'] for x in new)
(out/'dist/catalog.js').write_text('window.ATHENA_DATA = '+json.dumps(cat,ensure_ascii=False)+';\n')
# The app's existing Packet Trail view remains first/unchanged. No new navigation
# is claimed, and this snapshot deliberately does not add the security PATH.
provenance={'kind':'isolated compatibility snapshot, not source integration',
 'baseline_files':{str(f.relative_to(base)):hashlib.sha256(f.read_bytes()).hexdigest() for f in [base/'src/catalog.json',base/'dist/app.js',base/'dist/index.html',base/'dist/styles.css',base/'dist/core.js',base/'dist/workspace-host.js']},
 'base_lesson_count':len(cat['lessons'])-len(new),'snapshot_lesson_count':len(cat['lessons']),
 'snapshot_files':{str(f.relative_to(out)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted((out/'dist').glob('*')) if f.is_file()}}
(R/'evidence/compatibility-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
print('Prepared isolated snapshot with',len(cat['lessons']),'lessons; active Athena tree not written.')

base_ui = (base/'tests/ui.test.cjs').read_text()
base_count = len(cat['lessons']) - len(new)
# Change only the expected total for the intentional ten-lesson addition.
base_ui = base_ui.replace(f'length,{base_count}', f'length,{len(cat["lessons"])}')
(out/'ui-security.test.cjs').write_text(base_ui+'\n'+(R/'tests/security_dom_additions.cjs').read_text())
