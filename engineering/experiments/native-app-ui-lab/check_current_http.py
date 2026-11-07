"""Owned Linux service check. Never controls a browser or invokes an external provider."""
import argparse, hashlib, http.client, json, pathlib, signal, socket, sqlite3, subprocess, sys, time

def main():
    ROOT = pathlib.Path(__file__).resolve().parents[2]
    p = argparse.ArgumentParser(description='Verify the fixed local Atlas binary against an owned, closed public-fixture database')
    p.add_argument('--source-db', type=pathlib.Path, required=True)
    p.add_argument('--output', type=pathlib.Path, required=True)
    args = p.parse_args()
    SOURCE = args.source_db.resolve()
    OUT = args.output.resolve()
    DB = OUT / 'service.sqlite'
    BINARY = ROOT / 'apps/atlas-lab/target/release/atlas-lab'
    UI = ROOT / 'apps/atlas-lab/ui'
    rows = []

    def require(value, message):
        if not value:
            raise ValueError(message)

    def digest(path):
        with path.open('rb') as f:
            return hashlib.file_digest(f, 'sha256').hexdigest()

    def history(path):
        c = sqlite3.connect(path.resolve().as_uri() + '?mode=ro', uri=True)
        result = {name: c.execute('SELECT * FROM ' + name + ' ORDER BY ' + ('generation' if name == 'snapshots' else 'id')).fetchall() for name in ['snapshots', 'collection_attempts']}
        c.close()
        return result
    require(sys.platform == 'linux', 'This service driver is Linux-only')
    require(BINARY.is_file() and (not BINARY.is_symlink()), 'Build the fixed Atlas release binary first')
    require(SOURCE.is_file() and SOURCE.stat().st_size <= 32 * 1024 * 1024, 'Owned source fixture exceeds budget')
    require(not pathlib.Path(str(SOURCE) + '-wal').exists() and (not pathlib.Path(str(SOURCE) + '-journal').exists()), 'Use a closed fixture without pending journal files')
    OUT.mkdir(parents=True, exist_ok=False)
    original_sha = digest(SOURCE)
    before = history(SOURCE)
    c = sqlite3.connect(SOURCE.resolve().as_uri() + '?mode=ro', uri=True)
    tables = {row[0] for row in c.execute("SELECT name FROM sqlite_schema WHERE type='table'")}
    before_jobs = c.execute('SELECT * FROM jobs ORDER BY id').fetchall() if 'jobs' in tables else []
    before_events = c.execute('SELECT * FROM job_events ORDER BY id').fetchall() if 'job_events' in tables else []
    require(all((row[2] in ['failed', 'succeeded'] for row in before_jobs)), 'Source fixture has pending work')
    require(len(before_jobs) <= 49, 'Use a fixture with at most 49 terminal jobs')
    c.close()
    require(not DB.exists(), 'Refuse existing fixture database')
    s = sqlite3.connect(SOURCE.resolve().as_uri() + '?mode=ro', uri=True)
    d = sqlite3.connect(DB)
    s.backup(d)
    s.close()
    d.close()
    with socket.socket() as probe:
        probe.bind(('127.0.0.1', 41379))
    receipt = {'schema_version': 1, 'complete': False, 'python_version': sys.version.split()[0], 'python_optimized': bool(sys.flags.optimize), 'source_database_sha256': original_sha, 'existing_jobs': len(before_jobs), 'retained_snapshots': len(before['snapshots']), 'driver_sha256': digest(pathlib.Path(__file__)), 'binary_sha256': digest(BINARY), 'scope': 'Owned current native service on loopback; complete public archives and built-in queue tested; not visual/browser/player or live provider acceptance', 'checks': rows}
    deadline_all = time.monotonic() + 45

    def request(method, path, body=None, headers=None):
        require(time.monotonic() < deadline_all, 'Overall service-check budget')
        c = http.client.HTTPConnection('127.0.0.1', 41379, timeout=min(5, max(0.1, deadline_all - time.monotonic())))
        try:
            c.request(method, path, body=body, headers=headers or {})
            r = c.getresponse()
            b = r.read(3 * 1024 * 1024 + 1)
            require(len(b) <= 3 * 1024 * 1024, 'HTTP response budget')
            return (r.status, dict(((k.lower(), v) for k, v in r.getheaders())), b)
        finally:
            c.close()

    def check(label, condition):
        require(condition, label)
        rows.append({'check': label, 'passed': True})
    with (OUT / 'server.stdout').open('wb') as stdout, (OUT / 'server.stderr').open('wb') as stderr:
        child = subprocess.Popen([str(BINARY), 'serve', str(DB)], stdout=stdout, stderr=stderr)
        try:
            deadline = time.monotonic() + 8
            while True:
                require(child.poll() is None, 'Owned service exited before readiness')
                try:
                    status, headers, body = request('GET', '/api/overview')
                    overview = json.loads(body)
                    if status == 200 and overview['worker_status'] == 'running':
                        break
                except (OSError, json.JSONDecodeError):
                    pass
                require(time.monotonic() < deadline, 'Service readiness budget')
                time.sleep(0.05)
            check('baseline serializer active', headers.get('x-atlas-overview-strategy') == 'baseline')
            initial_jobs = overview['jobs']
            check('historical terminal jobs retained', len(initial_jobs) == len(before_jobs) and all((j['state'] in ['failed', 'succeeded'] for j in initial_jobs)))
            for path, name in [('/', 'index.html'), ('/app.js', 'app.js'), ('/style.css', 'style.css'), ('/collection-input.mjs', 'collection-input.mjs'), ('/archive-view.mjs', 'archive-view.mjs')]:
                status, headers, body = request('GET', path)
                check('exact embedded asset ' + name, status == 200 and body == (UI / name).read_bytes())
                check('restricted response headers ' + name, headers.get('cache-control') == 'no-store' and headers.get('x-content-type-options') == 'nosniff' and ("frame-ancestors 'none'" in headers.get('content-security-policy', '')) and ('access-control-allow-origin' not in headers))
            c = sqlite3.connect(DB)
            saved = c.execute("SELECT generation,canonical_id,payload FROM snapshots WHERE provider='modrinth-project-raw' ORDER BY generation").fetchall()
            c.close()
            latest = {row[1]: row for row in saved}
            require(latest, 'Missing retained archive fixtures')
            for phase in ['before', 'after']:
                for identity, (generation, _, payload) in latest.items():
                    status, headers, body = request('GET', '/api/project-archive/' + identity)
                    check(phase + ' complete archive ' + identity, status == 200 and body == payload.encode() and (headers.get('x-atlas-payload-sha256') == hashlib.sha256(body).hexdigest()) and (headers.get('x-atlas-generation') == str(generation)) and (headers.get('x-atlas-canonical-id') == identity))
                if phase == 'before':
                    check('missing archive is explicit', request('GET', '/api/project-archive/AAAAAAAA')[0] == 404)
                    check('wrong host rejected', request('GET', '/api/overview', headers={'Host': 'wrong.invalid'})[0] == 403)
                    base = {'Content-Type': 'application/json', 'Origin': 'http://127.0.0.1:41379', 'x-atlas-request': 'local-ui'}
                    check('wrong origin rejected', request('POST', '/api/jobs', json.dumps('DedupExperiment'), {**base, 'Origin': 'https://example.invalid'})[0] == 403)
                    check('missing request marker rejected', request('POST', '/api/jobs', json.dumps('DedupExperiment'), {'Content-Type': 'application/json', 'Origin': base['Origin']})[0] == 403)
                    check('unknown job rejected', request('POST', '/api/jobs', json.dumps({'UnknownOperation': {}}), base)[0] in [400, 422])
                    check('oversized job rejected', request('POST', '/api/jobs', json.dumps('x' * 5000), base)[0] == 413)
                    check('rejected writes changed no jobs', json.loads(request('GET', '/api/overview')[2])['jobs'] == initial_jobs)
                    status, _, body = request('POST', '/api/jobs', json.dumps('DedupExperiment'), base)
                    check('built-in job accepted', status == 200)
                    job_id = json.loads(body)['id']
                    deadline = time.monotonic() + 30
                    while True:
                        require(child.poll() is None, 'Owned service exited during job')
                        status, _, body = request('GET', '/api/overview')
                        current = json.loads(body)
                        job = next((j for j in current['jobs'] if j['id'] == job_id))
                        if job['state'] in ['succeeded', 'failed']:
                            break
                        require(time.monotonic() < deadline, 'Job completion budget')
                        time.sleep(0.1)
                    (OUT / 'job-result.json').write_text(json.dumps(job, indent=2) + '\n')
                    receipt['job_terminal_state'] = job['state']
                    run = job['result']['experiment']
                    receipt['experiment_reason'] = run['reason']
                    receipt['decision'] = run['decision']
                    check('built-in comparison completed', job['state'] == 'succeeded' and run['completed'] is True)
                    check('unmeasured memory still prevents promotion', 'Incomplete' in run['decision'])
            check('all original snapshot and attempt rows preserved', history(DB) == before)
            c = sqlite3.connect(DB)
            old_jobs = c.execute('SELECT * FROM jobs WHERE id<=? ORDER BY id', (max((row[0] for row in before_jobs), default=0),)).fetchall()
            old_events = c.execute('SELECT * FROM job_events WHERE id<=? ORDER BY id', (max((row[0] for row in before_events), default=0),)).fetchall()
            c.close()
            check('all historical jobs and events preserved', old_jobs == before_jobs and old_events == before_events)
        except Exception as error:
            receipt['failure'] = {'type': type(error).__name__, 'message': str(error)}
            raise
        finally:
            if child.poll() is None:
                child.send_signal(signal.SIGINT)
                try:
                    child.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    child.kill()
                    child.wait()
                    receipt['shutdown_failure'] = 'graceful shutdown budget exceeded'
            receipt['process_exit'] = child.returncode
            receipt['original_database_unchanged'] = digest(SOURCE) == original_sha and history(SOURCE) == before
            shutdown_passed = child.returncode == 0 and receipt['original_database_unchanged'] and (receipt.get('job_terminal_state') == 'succeeded') and ('shutdown_failure' not in receipt) and ('failure' not in receipt)
            receipt['shutdown_checks_passed'] = shutdown_passed
            receipt['complete'] = False
            (OUT / 'shutdown-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    require(receipt.get('shutdown_checks_passed') is True, 'Service verification incomplete')
    c = sqlite3.connect(DB.resolve().as_uri() + '?mode=ro', uri=True)
    persisted = c.execute('SELECT state,attempt,result FROM jobs WHERE id=?', (job['id'],)).fetchone()
    check('terminal job and full result survive graceful shutdown and reopen', bool(persisted) and persisted[0] == job['state'] and (persisted[1] == job['attempt']) and (json.loads(persisted[2]) == job['result']))
    check('reopened integrity and foreign keys pass', c.execute('PRAGMA integrity_check').fetchone()[0] == 'ok' and (not c.execute('PRAGMA foreign_key_check').fetchall()))
    c.close()
    check('binary identity matches after shutdown', digest(BINARY) == receipt['binary_sha256'])
    receipt['complete'] = True
    receipt['scope'] += '; graceful reopen is not physical power-loss certification'
    (OUT / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({'complete': True, 'checks': len(rows), 'binary_sha256': receipt['binary_sha256'], 'decision': receipt['decision']}))
if __name__ == '__main__':
    main()
