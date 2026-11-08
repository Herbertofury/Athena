//! Isolated generated-data failure regressions; production methods are unchanged.
use super::*;
use serde_json::{json, Value};
use std::{error::Error, fs, path::{Path, PathBuf}};

type Result<T> = std::result::Result<T, Box<dyn Error>>;
fn root(name: &str) -> PathBuf {
    let root = match std::env::var_os("ATHENA_QUEUE_FAULT_ROOT") {
        Some(path) => {
            let root = PathBuf::from(path);
            fs::create_dir_all(&root).unwrap();
            root
        }
        None => {
            let nonce = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos();
            let root = std::env::temp_dir().join(format!(
                "athena-queue-fault-{}-{nonce}", std::process::id()
            ));
            fs::create_dir(&root).expect("refuse existing generated evidence root");
            root
        }
    };
    // Keep failure artifacts in fresh owned directories; never reuse or purge them.
    let folder = root.join(name);
    fs::create_dir(&folder).expect("refuse existing trial directory");
    folder
}
fn dump(folder:&Path,name:&str,value:&Value) {fs::write(folder.join(name),serde_json::to_vec_pretty(value).unwrap()).unwrap();}
fn state(c:&Connection) -> Value {
    let jobs:Vec<(i64,String,String,i64,Option<String>,Option<i64>,Option<String>)>=c.prepare("SELECT id,payload,state,attempt,worker,lease_until,result FROM jobs ORDER BY id").unwrap().query_map([],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?,r.get(4)?,r.get(5)?,r.get(6)?))).unwrap().collect::<rusqlite::Result<_>>().unwrap();
    let events:Vec<(i64,i64,i64,String,i64)>=c.prepare("SELECT id,job_id,attempt,event,at_ms FROM job_events ORDER BY id").unwrap().query_map([],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?,r.get(4)?))).unwrap().collect::<rusqlite::Result<_>>().unwrap();
    json!({"jobs":jobs,"events":events})
}
fn contract(q:&Queue) {
    assert!(q.0.is_autocommit());
    assert_eq!(q.0.query_row("PRAGMA synchronous",[],|r|r.get::<_,i64>(0)).unwrap(),3);
    assert_eq!(q.0.query_row("PRAGMA foreign_keys",[],|r|r.get::<_,i64>(0)).unwrap(),1);
    assert_eq!(q.0.query_row("PRAGMA journal_mode",[],|r|r.get::<_,String>(0)).unwrap(),"delete");
    assert_eq!(q.0.query_row("PRAGMA integrity_check",[],|r|r.get::<_,String>(0)).unwrap(),"ok");
    assert!(q.0.prepare("PRAGMA foreign_key_check").unwrap().query([]).unwrap().next().unwrap().is_none());
}
fn sqlite_error(error:&(dyn Error+'static),extended:i32)->Value {
    let e=error.downcast_ref::<rusqlite::Error>().expect("must be real SQLite error, not payload validation");
    match e {
        rusqlite::Error::SqliteFailure(code,message)=>{
            assert_eq!(code.extended_code,extended);
            json!({"code":format!("{:?}",code.code),"extended":code.extended_code,"message":message})
        },
        _=>panic!("unexpected SQLite error: {e}")
    }
}
fn seeded(folder:&Path)->Result<(Queue,Claim)> {
    let mut q=Queue::open(&folder.join("scratch.sqlite"))?;
    let first=q.enqueue(&Job::DedupExperiment,100)?;let claim=q.claim("seed-worker",200,1000)?.unwrap();
    assert_eq!(first,claim.id);
    q.finish_output(&claim,true,300,Some(&json!({"preserve":"prior result 雪🔥","all":[null,1,2,3]})))?;
    let next=q.enqueue(&Job::DedupExperiment,10000)?;let live=q.claim("worker-a",11000,1000)?.unwrap();
    assert_eq!(next,live.id);assert_eq!(live.attempt,1);contract(&q);Ok((q,live))
}
fn capped(q:&Queue)->(i64,i64) {
    let old=q.0.query_row("PRAGMA max_page_count",[],|r|r.get::<_,i64>(0)).unwrap();
    let pages=q.0.query_row("PRAGMA page_count",[],|r|r.get::<_,i64>(0)).unwrap();
    let cap=pages+1;q.0.pragma_update(None,"max_page_count",cap).unwrap();
    assert_eq!(q.0.query_row("PRAGMA max_page_count",[],|r|r.get::<_,i64>(0)).unwrap(),cap);
    (old,cap)
}
fn output()->Value {json!({"body":"x".repeat(65536),"unknown":{"unicode":"雪🔥","null":null,"empty":[]},"revision":2})}
fn final_check(q:&Queue,claim:&Claim,expected:&Value)->Result<()> {
    contract(q);
    let (state,result,attempt):(String,String,i64)=q.0.query_row("SELECT state,result,attempt FROM jobs WHERE id=?1",[claim.id],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?)))?;
    assert_eq!(state,"succeeded");assert_eq!(result,serde_json::to_string(expected)?);assert_eq!(attempt,claim.attempt);
    let successes:i64=q.0.query_row("SELECT count(*) FROM job_events WHERE job_id=?1 AND event='succeeded'",[claim.id],|r|r.get(0))?;
    assert_eq!(successes,1);Ok(())
}

#[test]
fn page_full_finalize_keeps_running_state_and_exact_history_until_same_claim_retry()->Result<()> {
    let folder=root("full-same-claim");let(mut q,claim)=seeded(&folder)?;let before=state(&q.0);dump(&folder,"before.json",&before);
    let (old,cap)=capped(&q);let expected=output();assert!(serde_json::to_vec(&expected)?.len()<MAX_JOB_OUTPUT_BYTES);
    let error=q.finish_output(&claim,true,11500,Some(&expected)).unwrap_err();let error=sqlite_error(error.as_ref(),13);
    contract(&q);let after=state(&q.0);assert_eq!(after,before);dump(&folder,"after-failure.json",&after);
    let independent=Connection::open(folder.join("scratch.sqlite"))?;assert_eq!(state(&independent),before);drop(independent);
    q.0.pragma_update(None,"max_page_count",old)?;q.finish_output(&claim,true,11501,Some(&expected))?;final_check(&q,&claim,&expected)?;
    dump(&folder,"final.json",&state(&q.0));dump(&folder,"receipt.json",&json!({"fault":"SQLite page exhaustion during finish_output","sqlite":rusqlite::version(),"error":error,"page_cap":cap,"original_page_cap":old,"exact_state_and_events_unchanged":true,"independent_connection_confirmed":true,"autocommit_after_failure":true,"same_claim_retry":true,"final_attempt":claim.attempt,"integrity":"ok","journal":"delete"}));Ok(())
}

#[test]
fn page_full_reopen_reclaims_once_and_rejects_old_worker_output()->Result<()> {
    let folder=root("full-reopen-reclaim");let(mut q,old_claim)=seeded(&folder)?;let before=state(&q.0);dump(&folder,"before.json",&before);
    let (old,cap)=capped(&q);let expected=output();let error=q.finish_output(&old_claim,true,11500,Some(&expected)).unwrap_err();let error=sqlite_error(error.as_ref(),13);
    contract(&q);assert_eq!(state(&q.0),before);dump(&folder,"after-failure.json",&state(&q.0));drop(q);
    let mut q=Queue::open(&folder.join("scratch.sqlite"))?;assert_eq!(state(&q.0),before);
    let reopened_cap:i64=q.0.query_row("PRAGMA max_page_count",[],|r|r.get(0))?;assert_eq!(reopened_cap,old);
    assert!(q.claim("early-worker",11999,1000)?.is_none());assert_eq!(state(&q.0),before);
    let new=q.claim("worker-b",12000,1000)?.unwrap();assert_eq!(new.id,old_claim.id);assert_eq!(new.attempt,2);
    let reclaimed=state(&q.0);let stale=q.finish_output(&old_claim,true,12001,Some(&json!({"must_not_persist":"stale"}))).unwrap_err();assert!(stale.to_string().contains("Stale or expired"));assert_eq!(state(&q.0),reclaimed);
    q.finish_output(&new,true,12002,Some(&expected))?;final_check(&q,&new,&expected)?;
    let expired:i64=q.0.query_row("SELECT count(*) FROM job_events WHERE job_id=?1 AND event='lease_expired'",[new.id],|r|r.get(0))?;assert_eq!(expired,1);
    dump(&folder,"final.json",&state(&q.0));dump(&folder,"receipt.json",&json!({"fault":"SQLite page exhaustion then connection close/reopen","sqlite":rusqlite::version(),"error":error,"page_cap":cap,"reopened_cap":reopened_cap,"exact_state_and_events_unchanged":true,"reopen_preserved":true,"claim_before_expiry_none":true,"expired_events":expired,"old_worker_rejected":true,"final_attempt":new.attempt,"integrity":"ok","journal":"delete"}));Ok(())
}

fn trigger(q:&Queue,event:&str)->Result<()> {
    assert!(matches!(event,"queued"|"claimed"|"succeeded"));
    q.0.execute_batch(&format!("CREATE TRIGGER fault_reject_event BEFORE INSERT ON job_events WHEN NEW.event='{event}' BEGIN SELECT RAISE(ABORT,'generated event insertion failure'); END;"))?;Ok(())
}
fn remove_trigger(q:&Queue)->Result<()> {q.0.execute_batch("DROP TRIGGER fault_reject_event")?;Ok(())}

#[test]
fn event_failure_does_not_commit_terminal_state_or_result()->Result<()> {
    let folder=root("abort-finish-event");let(mut q,claim)=seeded(&folder)?;trigger(&q,"succeeded")?;
    let before=state(&q.0);dump(&folder,"before.json",&before);
    let expected=json!({"complete":"output 雪🔥","unknown":[null,1,2]});let error=q.finish_output(&claim,true,11500,Some(&expected)).unwrap_err();let error=sqlite_error(error.as_ref(),1811);
    contract(&q);assert_eq!(state(&q.0),before);dump(&folder,"after-failure.json",&state(&q.0));remove_trigger(&q)?;
    q.finish_output(&claim,true,11501,Some(&expected))?;final_check(&q,&claim,&expected)?;
    dump(&folder,"final.json",&state(&q.0));dump(&folder,"receipt.json",&json!({"fault":"test-only trigger aborts terminal event insertion after UPDATE","error":error,"exact_state_and_events_unchanged":true,"same_claim_retry":true,"integrity":"ok"}));Ok(())
}

#[test]
fn event_failure_rolls_back_expiration_requeue_claim_and_attempt_increment()->Result<()> {
    let folder=root("abort-reclaim-event");let(mut q,old_claim)=seeded(&folder)?;trigger(&q,"claimed")?;
    let before=state(&q.0);dump(&folder,"before.json",&before);
    let error=q.claim("worker-b",12000,1000).unwrap_err();let error=sqlite_error(error.as_ref(),1811);
    contract(&q);assert_eq!(state(&q.0),before);dump(&folder,"after-failure.json",&state(&q.0));remove_trigger(&q)?;
    let new=q.claim("worker-b",12001,1000)?.unwrap();assert_eq!(new.id,old_claim.id);assert_eq!(new.attempt,2);
    let reclaimed=state(&q.0);assert!(q.finish(&old_claim,true,12002).is_err());assert_eq!(state(&q.0),reclaimed);
    let expected=json!({"recovered":"exact lease attempt"});q.finish_output(&new,true,12003,Some(&expected))?;final_check(&q,&new,&expected)?;
    let expired:i64=q.0.query_row("SELECT count(*) FROM job_events WHERE job_id=?1 AND event='lease_expired'",[new.id],|r|r.get(0))?;assert_eq!(expired,1);
    dump(&folder,"final.json",&state(&q.0));dump(&folder,"receipt.json",&json!({"fault":"test-only trigger aborts claimed event after expired event, requeue and running UPDATE","error":error,"exact_state_and_events_unchanged":true,"expired_events_after_retry":expired,"old_worker_rejected":true,"final_attempt":new.attempt,"integrity":"ok"}));Ok(())
}

#[test]
fn event_failure_rolls_back_job_enqueue_without_orphan_or_duplicate()->Result<()> {
    let folder=root("abort-enqueue-event");let(mut q,claim)=seeded(&folder)?;trigger(&q,"queued")?;
    let before=state(&q.0);dump(&folder,"before.json",&before);
    let requested=Job::CollectModrinthRaw{project:"sodium".into()};let error=q.enqueue(&requested,11500).unwrap_err();let error=sqlite_error(error.as_ref(),1811);
    contract(&q);assert_eq!(state(&q.0),before);dump(&folder,"after-failure.json",&state(&q.0));remove_trigger(&q)?;
    let id=q.enqueue(&requested,11501)?;assert_eq!(id,claim.id+1);assert_eq!(q.enqueue(&requested,11502)?,id);
    let queued:i64=q.0.query_row("SELECT count(*) FROM job_events WHERE job_id=?1 AND event='queued'",[id],|r|r.get(0))?;assert_eq!(queued,1);contract(&q);
    dump(&folder,"final.json",&state(&q.0));dump(&folder,"receipt.json",&json!({"fault":"test-only trigger aborts queued event after job INSERT","error":error,"exact_state_and_events_unchanged":true,"retried_id":id,"queued_events":queued,"duplicate_returns_same_id":true,"integrity":"ok","network_requests":0}));Ok(())
}
