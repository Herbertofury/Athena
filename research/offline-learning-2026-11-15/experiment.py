"""Run with Python stdlib only. Synthetic acceptance, not model training."""
import hashlib
import json
from pathlib import Path
import platform
import sqlite3
import subprocess
import sys
import tempfile

# Process-level guard: deny socket creation/DNS, including in the fresh reader.
# This is not an OS firewall or evidence that every possible program is offline.
def no_network(event, args):
    if event.startswith('socket.'):
        raise RuntimeError('Network forbidden in offline acceptance experiment')
sys.addaudithook(no_network)

from offline_store import connect, ingest, active, retrieve, retain_finding, rollback


def doc(identifier, body):
    return {'id': identifier, 'source': 'fixture://local-project/' + identifier, 'body': body}


BASE = [doc('draft-a', 'Queue batches persist in memory until application exit.'),
        doc('draft-b', 'Search documents use title terms.'),
        doc('stable', 'Keyboard escape closes preview.')]
CHANGED = [*BASE,
           doc('experiment-queue', 'Queue restart recovery requires a durable transaction journal. Synthetic local experiment confirms queued writes survive restart when committed.'),
           doc('experiment-search', 'Search attribution requires immutable source hashes and revision identifiers. Synthetic local experiment confirms historical revisions remain retrievable.')]
# Frozen before ingestion. Never passed into ranking, ingestion, or generation of docs.
TASKS = [('restart durable journal', 'experiment-queue'),
         ('attribution immutable revision', 'experiment-search'),
         ('keyboard escape preview', 'stable')]


def evaluate(db):
    result = []
    for query, expected in TASKS:
        rows = retrieve(db, query)
        result.append({'query': query, 'expected_id': expected,
                       'actual_id': rows[0]['id'] if rows else None,
                       'correct': bool(rows and rows[0]['id'] == expected),
                       'evidence': rows[:1]})
    return result


def run():
    import socket
    try:
        socket.socket()
        raise AssertionError('Network guard did not block sockets')
    except RuntimeError:
        pass
    with tempfile.TemporaryDirectory(prefix='athena-offline-') as tmp:
        path = str(Path(tmp) / 'knowledge.sqlite')
        db = connect(path)
        first = ingest(db, BASE)
        before = evaluate(db)
        second = ingest(db, CHANGED)
        after = evaluate(db)
        assert sum(r['correct'] for r in before) == 1
        assert sum(r['correct'] for r in after) == 3
        finding = {'kind': 'synthetic-retrieval-comparison', 'baseline_generation': first,
                   'candidate_generation': second, 'before': before, 'after': after,
                   'limits': 'Corpus refresh benefit only; no algorithm superiority or external discovery.'}
        retain_finding(db, second, finding)
        counts = db.execute('SELECT COUNT(*) FROM documents').fetchone()[0]
        failures = []
        for invalid in ([doc('valid', 'first staged row'), doc('valid', 'duplicate id')],
                        [doc('valid', 'first staged row'), {'id': 'bad', 'body': ''}]):
            try:
                ingest(db, invalid)
                raise AssertionError('Expected rejection')
            except (sqlite3.IntegrityError, ValueError) as exc:
                failures.append({'type': type(exc).__name__, 'message': str(exc)})
            assert active(db) == second
            assert db.execute('SELECT COUNT(*) FROM documents').fetchone()[0] == counts
        assert retrieve(db, '', second) == []
        rollback(db, first)
        assert evaluate(db) == before
        rollback(db, second)
        assert evaluate(db) == after
        db.close()
        # Independent interpreter; no in-memory state can satisfy this assertion.
        child = subprocess.run([sys.executable, __file__, '--read', path],
                               check=True, capture_output=True, text=True)
        restored = json.loads(child.stdout)
        assert restored['results'] == after
        assert restored['finding'] == finding
        return {'scope': 'synthetic local offline R&D only',
                'python': platform.python_version(), 'sqlite': sqlite3.sqlite_version,
                'network': 'socket audit denial tested in parent and reader; not kernel isolation',
                'baseline_top1': '1/3', 'refreshed_top1': '3/3',
                'restart_independent_interpreter': True, 'rollback_restore_exact': True,
                'rejected_transactions': failures, 'finding': finding,
                'source_script_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == '--read':
        import socket
        try:
            socket.socket()
            raise AssertionError('Reader network guard missing')
        except RuntimeError:
            pass
        db = connect(sys.argv[2])
        print(json.dumps({'results': evaluate(db), 'finding': json.loads(db.execute('SELECT payload FROM findings').fetchone()[0])}))
        db.close()
    else:
        print(json.dumps(run(), indent=2, sort_keys=True))
