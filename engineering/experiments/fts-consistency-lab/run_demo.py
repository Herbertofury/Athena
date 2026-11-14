"""Retain complete owned fixture rows, observations, and abrupt-exit receipts."""
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
from catalog import create, connect, rows, put, search, rebuild, audit, transaction, environment, _error


def view(con, terms):
    return {'canonical': rows(con), 'queries': {q: search(con, q) for q in terms}, 'audit': audit(con)}


def run(out):
    out = Path(out)
    out.mkdir(parents=True, exist_ok=False)
    results = []
    all_checks = []
    env = None

    def retain(name, data, checks):
        receipt = {'name': name, **data, 'checks': checks}
        (out / (name + '.json')).write_text(json.dumps(receipt, indent=2, ensure_ascii=False) + '\n')
        results.append(receipt)
        all_checks.extend(checks.values())

    con = create(out/'backfill.db', [('fixture:1','gold','full body','{ "warning": "kept", "unknown": null }')], backfill=False)
    try:
        env = environment(con)
        before = view(con, ['gold']); count = con.execute('SELECT count(*) FROM search_index').fetchone()[0]
        put(con, 'fixture:2', 'gold')
        triggers_only = view(con, ['gold'])
        rebuilt = rebuild(con); after = view(con, ['gold'])
        retain('backfill', {'before': before, 'non_match_count': count, 'triggers_only': triggers_only, 'rebuild': rebuilt, 'after': after}, {
            'count_did_not_prove_postings': count == 1 and before['queries']['gold'] == [],
            'generic_and_internal_checks_passed': before['audit']['sqlite_integrity']['ok'] and before['audit']['fts_internal']['ok'],
            'external_check_caught_drift': not before['audit']['fts_external_content']['ok'],
            'triggers_did_not_backfill': [r['external_key'] for r in triggers_only['queries']['gold']] == ['fixture:2'],
            'rebuild_restored_both_rows': after['queries']['gold'] == after['canonical'],
            'metadata_retained': after['canonical'][0] == before['canonical'][0],
        })
    finally: con.close()

    con = create(out/'stale.db', [('k','oldtoken','','{}')])
    try:
        con.execute('DROP TRIGGER documents_update')
        con.execute("UPDATE documents SET title='newtoken'")
        stale = view(con, ['oldtoken','newtoken']); rebuild(con); after = view(con, ['oldtoken','newtoken'])
        retain('stale_term', {'stale': stale, 'after': after}, {
            'stale_term_resolved_to_new_metadata': stale['queries']['oldtoken'][0]['title'] == 'newtoken',
            'new_term_missed': stale['queries']['newtoken'] == [],
            'external_check_caught_drift': not stale['audit']['fts_external_content']['ok'],
            'rebuild_repaired_current_postings': after['queries']['oldtoken'] == [] and len(after['queries']['newtoken']) == 1,
            'canonical_unchanged': stale['canonical'] == after['canonical'],
        })
    finally: con.close()

    con = create(out/'rollback.db', [('k','oldtoken','','{}')])
    try:
        before = view(con, ['oldtoken','newtoken']); inside = {}; failure = None
        def fail(c):
            inside['rows'] = rows(c); inside['new_hits'] = search(c, 'newtoken')
            raise RuntimeError('owned fault before commit')
        try: put(con, 'k','newtoken', after_write=fail)
        except RuntimeError as exc: failure = _error(exc)
        after = view(con, ['oldtoken','newtoken'])
        retain('write_rollback', {'before':before,'inside':inside,'failure':failure,'after':after}, {
            'new_row_and_posting_visible_inside': inside['rows'] == inside['new_hits'],
            'failure_observed': failure is not None,
            'old_rows_and_postings_restored': before == after,
        })
    finally: con.close()

    con = create(out/'rebuild-rollback.db', [('k','gold','','{}')], backfill=False)
    try:
        before = view(con, ['gold']); inside = {}; failure = None
        def fail_rebuild(c):
            inside['gold_hits'] = search(c, 'gold')
            raise RuntimeError('owned fault after rebuild before commit')
        try: rebuild(con, after_rebuild=fail_rebuild)
        except RuntimeError as exc: failure = _error(exc)
        after = view(con, ['gold'])
        retain('rebuild_rollback', {'before':before, 'inside':inside, 'failure':failure, 'after':after}, {
            'temporary_rebuild_visible_inside': len(inside['gold_hits']) == 1,
            'failure_observed': failure is not None,
            'rollback_restored_original_inconsistent_state': before == after,
        })
    finally: con.close()

    con = create(out/'interrupt.db', [(str(i), 'gold '*50,'','{}') for i in range(500)], backfill=False)
    try:
        before = rows(con); calls = 0; error = None
        def stop():
            nonlocal calls
            calls += 1
            return int(calls >= 10)
        con.execute('BEGIN IMMEDIATE'); con.set_progress_handler(stop,100)
        try: con.execute("INSERT INTO search_index(search_index) VALUES('rebuild')")
        except sqlite3.Error as exc: error = _error(exc)
        finally:
            con.set_progress_handler(None, 0)
            if con.in_transaction: con.execute('ROLLBACK')
        after = view(con,['gold']); repaired = rebuild(con); final_audit = audit(con)
        retain('interrupted_rebuild', {'before':before,'progress_calls':calls,'error':error,'after':after,'repaired':repaired,'final_audit':final_audit}, {
            'actual_sqlite_interruption': error is not None and error['sqlite_errorname'] == 'SQLITE_INTERRUPT',
            'canonical_preserved': before == after['canonical'],
            'partial_rebuild_not_committed': after['queries']['gold'] == [] and not after['audit']['fts_external_content']['ok'],
            'explicit_retry_repaired': all(v['ok'] for v in final_audit.values()),
        })
    finally: con.close()

    con = create(out/'snapshot.db', [('k','oldtoken','','{}')], wal=True)
    reader = connect(out/'snapshot.db')
    try:
        reader.execute('BEGIN'); before = search(reader,'oldtoken')
        put(con,'k','newtoken')
        pinned = {'old':search(reader,'oldtoken'),'new':search(reader,'newtoken')}
        reader.execute('COMMIT')
        refreshed = {'old':search(reader,'oldtoken'),'new':search(reader,'newtoken')}
        retain('wal_reader', {'before':before,'pinned':pinned,'refreshed':refreshed,'writer_audit':audit(con)}, {
            'old_snapshot_contains_old_row_and_posting': pinned['old'] == before and pinned['new'] == [],
            'new_snapshot_contains_new_row_and_posting': refreshed['old'] == [] and refreshed['new'][0]['title'] == 'newtoken',
        })
    finally: reader.close(); con.close()

    for stage in ('before_commit','after_commit'):
        path = out/('exit-'+stage+'.db')
        con = create(path, [('fixture:1','oldtoken','','{"warning":"retained","phase":"old"}')])
        try:
            before = view(con,['oldtoken','newtoken'])
            con.close()
            child = subprocess.run([sys.executable,'-B',str(Path(__file__).with_name('exit_writer.py')),str(path),stage],
                                   stdin=subprocess.DEVNULL,capture_output=True,timeout=10,check=False)
            con = connect(path)
            after = view(con,['oldtoken','newtoken'])
            child_receipt = json.loads(child.stdout)
            expected = 'oldtoken' if stage == 'before_commit' else 'newtoken'
            other = 'newtoken' if stage == 'before_commit' else 'oldtoken'
            retain('exit_'+stage, {'before':before,'child_stdout':child.stdout.decode(),'child_stderr':child.stderr.decode(),'returncode':child.returncode,'after':after}, {
                'declared_abrupt_exit': child.returncode == 71 and child.stderr == b'',
                'child_saw_updated_row_and_posting': child_receipt['child_view'][0]['title'] == 'newtoken',
                'reopened_view_matches_commit_boundary': len(after['queries'][expected]) == 1 and after['queries'][other] == [],
                'consistent_after_exit': all(v['ok'] for v in after['audit'].values()),
            })
        finally: con.close()

    con = create(out/'replace.db',[('k','oldtoken','','{}')])
    try:
        con.execute('PRAGMA recursive_triggers=OFF')
        con.execute("INSERT OR REPLACE INTO documents(id,external_key,title,body,metadata_json) VALUES(1,'k','newtoken','','{}')")
        bad = view(con,['oldtoken','newtoken']); rebuild(con)
        put(con,'k','thirdtoken'); good = view(con,['oldtoken','newtoken','thirdtoken'])
        retain('replace_control', {'recursive_triggers':0,'bad':bad,'after_repair_and_upsert':good}, {
            'replace_retained_stale_term': len(bad['queries']['oldtoken']) == 1 and bad['queries']['oldtoken'][0]['title'] == 'newtoken',
            'external_check_rejected': not bad['audit']['fts_external_content']['ok'],
            'upsert_after_repair_consistent': good['queries']['oldtoken'] == [] and good['queries']['newtoken'] == [] and len(good['queries']['thirdtoken']) == 1 and all(v['ok'] for v in good['audit'].values()),
        })
    finally: con.close()

    lab = Path(__file__).parent
    summary = {'schema_version':1, 'environment':env, 'source_sha256': {p:hashlib.sha256((lab/p).read_bytes()).hexdigest() for p in ('catalog.py','exit_writer.py','run_demo.py')},
               'scenarios':results, 'all_checks_passed':all(all_checks), 'check_count':len(all_checks),
               'scope':'Synthetic local consistency drill; no performance, power-loss, corruption recovery or target acceptance.'}
    (out/'result.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
    if not all(all_checks): raise RuntimeError('retained a failed observation; inspect result.json')
    return summary


if __name__ == '__main__':
    result = run(sys.argv[1])
    print(json.dumps({'scenarios':len(result['scenarios']),'checks':result['check_count'],'all_passed':result['all_checks_passed']}))
