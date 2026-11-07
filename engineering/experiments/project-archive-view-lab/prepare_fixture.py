"""Copy an inactive local test database and add explicitly generated read fixtures.
Never modifies the source database or queues a provider request.
"""
from pathlib import Path
import argparse,hashlib,json,sqlite3
p=argparse.ArgumentParser();p.add_argument('--source-db',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);a=p.parse_args();a.output_dir.mkdir(parents=True,exist_ok=False);target=a.output_dir/'fixture.sqlite'
with sqlite3.connect(a.source_db.resolve().as_uri()+'?mode=ro',uri=True) as src,sqlite3.connect(target) as db:
 if src.execute("SELECT count(*) FROM jobs WHERE state IN ('queued','running')").fetchone()[0]:raise RuntimeError('Refuse an active source database')
 src.backup(db)
 if db.execute("SELECT count(*) FROM jobs WHERE state IN ('queued','running')").fetchone()[0]:raise RuntimeError('Copied database has active jobs; do not serve it')
 db.execute('PRAGMA foreign_keys=ON')
 body=' \n{"id":"TEST0001","slug":"generated-view-fixture","title":"Generated fixture","description":"No real account data","project_type":"mod","versions":[],"future":18446744073709551617,"markup":"<script>inert</script>"}\r\n'
 db.execute("INSERT INTO snapshots(generation,provider,canonical_id,payload) VALUES(?,'modrinth-project-raw','TEST0001',?)",(9007199254740993,body))
 db.execute("INSERT INTO collection_attempts(requested_id,outcome,generation) VALUES('generated-view-fixture','success',?)",(9007199254740993,))
 db.execute("INSERT INTO snapshots(provider,canonical_id,payload) VALUES('modrinth-project-raw','CORRUPT1',?)",(body,))
 oversized='{"id":"BIG00001","slug":"big","title":"Generated","description":"Fixture","project_type":"mod","versions":[],"padding":"'+'x'*(5*1024*1024)+'"}'
 db.execute("INSERT INTO snapshots(provider,canonical_id,payload) VALUES('modrinth-project-raw','BIG00001',?)",(oversized,));db.commit()
(a.output_dir/'fixture-receipt.json').write_text(json.dumps({'scope':'copied terminal retained-public-data jobs plus generated large-generation, misbound and oversized read fixtures; no provider requests','generator_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'generated_large_generation':'9007199254740993','generated_oversized_payload_bytes':len(oversized.encode()),'source_database_unchanged':True},indent=2)+'\n')
