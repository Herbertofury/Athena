"""Package authored material only; validate ZIP extraction without touching Athena."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import zipfile
R=Path(__file__).resolve().parents[1]
OUT=R.parent
prefix='Athena-Data-Workshop'
base_files=[]
for p in sorted(R.rglob('*')):
    if not p.is_file():continue
    rel=p.relative_to(R)
    if any(part in {'__pycache__','compatibility'} for part in rel.parts):continue
    if rel.parts[0]=='evidence' and rel.name in {'archives-verification.json','artifact-manifest.json'}:continue
    base_files.append(p)

def learner(p):
    rel=p.relative_to(R)
    if rel.parts[0] in {'content','docs','labs','research'}:return True
    if rel.name in {'README.md','START-HERE.html'} and len(rel.parts)==1:return True
    if str(rel) in {'tests/test_data_workshop.py','scripts/data_content.py','scripts/render_data_pack.py','scripts/render_study_html.py'}:return True
    return False

results=[]
for kind,files in [('Learner-Pack',[p for p in base_files if learner(p)]),('Integration',base_files)]:
    path=OUT/f'Athena-Data-Workshop-{kind}-20261107.zip'
    manifest=''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(R))+'\n' for p in files)
    with zipfile.ZipFile(path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for p in files:z.write(p,prefix+'/'+str(p.relative_to(R)))
        z.writestr(prefix+'/MANIFEST.sha256',manifest)
    with tempfile.TemporaryDirectory(prefix='athena-data-verify-') as temp:
        with zipfile.ZipFile(path) as z:
            assert z.testzip() is None
            assert all(not n.startswith('/') and '..' not in Path(n).parts for n in z.namelist())
            z.extractall(temp)
        extracted=Path(temp)/prefix
        for line in manifest.splitlines():
            expected,name=line.split('  ',1)
            assert hashlib.sha256((extracted/name).read_bytes()).hexdigest()==expected
        p=subprocess.run([sys.executable,'-m','unittest','discover','-s','tests','-v'],cwd=extracted,capture_output=True,text=True,timeout=60)
        assert p.returncode==0,p.stderr
        assert 'Ran 57 tests' in p.stderr
        results.append(dict(kind=kind,path=str(path),bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),files=len(files)+1,extracted_tests_passed=57,manifest_verified=True))
(R/'evidence/archives-verification.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps(results,indent=2))
