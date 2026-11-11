"""Retain finite owned paging controls; full records, not timing claims."""
import hashlib
import json
from pathlib import Path
import platform
import sqlite3
import sys
import paging as p


def run(out):
    out=Path(out);out.mkdir(parents=True,exist_ok=False);receipts=[];serial=0;env={}
    def fixture(name,n=6,*,ties=False):
        nonlocal serial,env
        serial+=1;con=p.create(out/(name+'.db'))
        if serial==1:
            env={'python':platform.python_version(),'sqlite':sqlite3.sqlite_version,'platform':platform.platform(),
                 'sqlite_source_id':con.execute('SELECT sqlite_source_id()').fetchone()[0],
                 'compile_options':[r[0] for r in con.execute('PRAGMA compile_options')],
                 'journal_mode':con.execute('PRAGMA journal_mode').fetchone()[0],
                 'synchronous':con.execute('PRAGMA synchronous').fetchone()[0]}
        # Deliberately public deterministic fixture identity, for exact replay.
        # The reference create() API generates a UUID4; neither is authorization.
        con.execute('UPDATE identity SET value=?',(format(serial,'032x'),))
        for i in range(1,n+1):p.put(con,i,i//2 if ties else i,'mods','{ "id": %d, "warning": "kept", "extra": null }'%i)
        return con
    def retain(name,observations,checks):receipts.append({'name':name,'observations':observations,'checks':checks})
    def ids(rows):return [r['id'] for r in rows]
    def drain(con,g,size=2,token=None):
        result=[];pages=[]
        for _ in range(1001):
            page=p.page(con,g,'mods',size=size,cursor=token);pages.append(page);result.extend(page['rows'])
            if page['complete']:return result,pages
            token=page['next_cursor']
        raise RuntimeError('fixture never completed')
    def fail(exc):return {'type':type(exc).__name__,'message':str(exc)}

    con=fixture('offset-insert')
    try:
        initial=p.live_rows(con,'mods');first=initial[:2];p.put(con,99,0,'mods','inserted')
        second=[dict(r) for r in con.execute("SELECT * FROM live WHERE bucket='mods' ORDER BY sort_value,id LIMIT 2 OFFSET 2")]
        retain('offset_insertion',{'initial':initial,'first':first,'second':second,'live_after':p.live_rows(con,'mods')},{'seen_row_duplicated':ids(first+second).count(2)==2})
    finally:con.close()

    con=fixture('offset-delete')
    try:
        initial=p.live_rows(con,'mods');first=initial[:2];p.remove(con,1)
        rest=[dict(r) for r in con.execute("SELECT * FROM live WHERE bucket='mods' ORDER BY sort_value,id LIMIT 100 OFFSET 2")]
        retain('offset_deletion',{'initial':initial,'first':first,'rest':rest,'live_after':p.live_rows(con,'mods')},{'unseen_row_omitted':3 not in ids(first+rest)})
    finally:con.close()

    con=fixture('keyset-moves')
    try:
        initial=p.live_rows(con,'mods');first=initial[:2]
        p.put(con,1,100,'mods','moved after cursor');p.put(con,3,-100,'mods','moved before cursor')
        rest=[dict(r) for r in con.execute("SELECT * FROM live WHERE bucket='mods' AND (sort_value,id)>(?,?) ORDER BY sort_value,id",(2,2))]
        retain('live_keyset_moves',{'initial':initial,'first':first,'rest':rest,'live_after':p.live_rows(con,'mods')},{'already_seen_id_repeated':ids(first+rest).count(1)==2,'unseen_id_moved_behind_boundary':3 not in ids(first+rest)})
    finally:con.close()

    con=fixture('high-water')
    try:
        initial=p.live_rows(con,'mods');first=initial[:2];high=max(ids(initial));p.put(con,3,3,'mods','new payload after first page')
        rest=[dict(r) for r in con.execute('SELECT * FROM live WHERE id>2 AND id<=? ORDER BY id',(high,))]
        retain('id_high_water',{'initial':initial,'high_water':high,'first':first,'rest':rest},{'ids_match_but_payload_does_not':ids(first+rest)==ids(initial) and first+rest!=initial})
    finally:con.close()

    con=fixture('frozen',ties=True)
    try:
        initial=p.live_rows(con,'mods');g=p.capture(con,'mods');first=p.page(con,g,'mods',size=2)
        p.put(con,1,100,'other','changed');p.remove(con,3);p.put(con,99,-100,'mods','new')
        rest,pages=drain(con,g,token=first['next_cursor']);complete=first['rows']+rest
        replay=p.page(con,g,'mods',size=2,cursor=first['next_cursor'])
        retain('frozen_complete_records',{'initial':initial,'generation':g,'pages':[first]+pages,'live_after':p.live_rows(con,'mods'),'replay_of_second':replay},{'all_original_rows_and_fields_preserved':complete==initial,'unique_ids':len(set(ids(complete)))==len(complete),'same_cursor_same_result':replay==pages[0],'final_complete':pages[-1]['complete'] and pages[-1]['seen']==len(initial)})
    finally:con.close()

    con=fixture('capture-failure')
    try:
        initial=p.live_rows(con,'mods');errors=[]
        try:p.capture(con,'mods',max_rows=5)
        except p.SnapshotLimit as exc:errors.append(fail(exc))
        def fault(c,g):raise RuntimeError('owned fault after complete copy')
        try:p.capture(con,'mods',after_copy=fault)
        except RuntimeError as exc:errors.append(fail(exc))
        counts={t:con.execute('SELECT count(*) FROM '+t).fetchone()[0] for t in ('generations','frozen')}
        retain('capture_rollback',{'initial':initial,'errors':errors,'counts':counts,'live_after':p.live_rows(con,'mods')},{'both_failures_retained':len(errors)==2,'no_partial_generation':counts=={'generations':0,'frozen':0},'live_rows_unchanged':p.live_rows(con,'mods')==initial})
    finally:con.close()

    con=fixture('retirement')
    try:
        g=p.capture(con,'mods');first=p.page(con,g,'mods',size=2);p.retire(con,g);p.put(con,99,0,'mods','new');new=p.capture(con,'mods');error=None
        try:p.page(con,g,'mods',size=2,cursor=first['next_cursor'])
        except p.GenerationUnavailable as exc:error=fail(exc)
        fresh,pages=drain(con,new)
        retain('retired_generation',{'old_page':first,'error':error,'fresh_generation':new,'fresh_pages':pages},{'old_cursor_refused':error is not None,'explicit_restart_includes_new_row':99 in ids(fresh),'new_generation_distinct':new!=g})
    finally:con.close()

    con=fixture('ties',ties=True)
    try:
        initial=p.live_rows(con,'mods');first=initial[:2];last=first[-1]
        bad=[dict(r) for r in con.execute("SELECT * FROM live WHERE bucket='mods' AND sort_value>? ORDER BY sort_value,id",(last['sort_value'],))]
        g=p.capture(con,'mods');good,pages=drain(con,g)
        retain('tie_breaker',{'initial':initial,'rank_only_first':first,'rank_only_rest':bad,'tuple_pages':pages},{'rank_only_skips_unseen_tie':3 not in ids(first+bad),'tuple_order_preserves_all':good==initial})
    finally:con.close()

    con=fixture('unsigned')
    try:
        g=p.capture(con,'mods');first=p.page(con,g,'mods',size=2);token=json.loads(first['next_cursor']);token.update(after=[4,4],seen=4)
        altered=json.dumps(token);result=p.page(con,g,'mods',size=2,cursor=altered)
        retain('unsigned_cursor_control',{'issued':first,'coherently_altered_cursor':altered,'accepted_result':result},{'coherent_edit_can_skip':ids(result['rows'])==[5,6],'not_authentication':result['complete'] and result['seen']==6})
    finally:con.close()

    summary={'schema_version':1,'environment':env,
        'source_sha256':{n:hashlib.sha256((Path(__file__).parent/n).read_bytes()).hexdigest() for n in ('paging.py','run_demo.py')},
        'deterministic_identity_note':'Demo replaces each fresh random identity with a unique public fixture value for exact replay. Cursors are unsigned and never authorization.',
        'scenarios':receipts,'check_count':sum(len(r['checks']) for r in receipts),
        'all_checks_passed':all(v for r in receipts for v in r['checks'].values()),
        'not_claimed':['performance improvement','malicious database safety','cursor authentication','authorization snapshots','power-loss durability','target adoption']}
    (out/'result.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
    if not summary['all_checks_passed']:raise RuntimeError('failed observation retained in result.json')
    return summary

if __name__=='__main__':
    r=run(sys.argv[1]);print(json.dumps({'scenarios':len(r['scenarios']),'checks':r['check_count'],'all_passed':r['all_checks_passed']}))
