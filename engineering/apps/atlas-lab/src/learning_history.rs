//! Read-only owner-journal history; bounded returned data, not a hostile SQLite sandbox.
use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::{StatusCode, header},
    response::{Html, IntoResponse},
    routing::get,
};
use rusqlite::{Connection, OpenFlags, OptionalExtension, params};
use serde::Deserialize;
use std::{path::PathBuf, sync::Arc};
#[derive(Clone)]
struct History {
    path: PathBuf,
    slots: Arc<tokio::sync::Semaphore>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Cursor {
    before: Option<i64>,
}
fn connection(path: &std::path::Path) -> rusqlite::Result<Connection> {
    let c = Connection::open_with_flags(path, OpenFlags::SQLITE_OPEN_READ_ONLY)?;
    c.busy_timeout(std::time::Duration::from_secs(1))?;
    Ok(c)
}
fn exists(c: &Connection, name: &str) -> rusqlite::Result<bool> {
    c.query_row(
        "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name=?1)",
        [name],
        |r| r.get(0),
    )
}
fn page(path: &std::path::Path, before: Option<i64>) -> rusqlite::Result<serde_json::Value> {
    let c = connection(path)?;
    if !exists(&c, "experiments")? {
        return Ok(serde_json::json!({"records":[],"next_before":null}));
    }
    let mut stmt = c.prepare("SELECT id,substr(recorded_at,1,80),substr(candidate,1,256),substr(baseline,1,256),substr(decision,1,256) FROM experiments WHERE (?1 IS NULL OR id<?1) AND id>0 ORDER BY id DESC LIMIT 21")?;
    let mut rows = stmt.query_map([before], |r| Ok(serde_json::json!({"id":r.get::<_,i64>(0)?.to_string(),"recorded_at":r.get::<_,String>(1)?,"candidate":r.get::<_,String>(2)?,"baseline":r.get::<_,String>(3)?,"decision":r.get::<_,String>(4)?})))?.collect::<rusqlite::Result<Vec<_>>>()?;
    let more = rows.len() > 20;
    rows.truncate(20);
    let next = if more {
        rows.last()
            .and_then(|r| r["id"].as_str())
            .map(str::to_owned)
    } else {
        None
    };
    Ok(
        serde_json::json!({"records":rows,"next_before":next,"scope":"Local retained evidence; summaries are length-limited, not source-authority rankings."}),
    )
}
fn detail(path: &std::path::Path, id: i64) -> rusqlite::Result<Option<serde_json::Value>> {
    let c = connection(path)?;
    if !exists(&c, "experiments")? {
        return Ok(None);
    }
    let row: Option<(String,String,Option<String>)> = c.query_row("SELECT substr(recorded_at,1,80),substr(decision,1,256),CASE WHEN length(CAST(evidence AS BLOB))<=2097152 THEN evidence END FROM experiments WHERE id=?1",[id],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?))).optional()?;
    let Some((at, decision, evidence)) = row else {
        return Ok(None);
    };
    let run: Option<String> = if exists(&c, "experiment_runs")? {
        c.query_row("SELECT CASE WHEN schema_version=1 AND length(CAST(output AS BLOB))<=2097152 THEN output END FROM experiment_runs WHERE experiment_id=?1",params![id],|r|r.get(0)).optional()?.flatten()
    } else {
        None
    };
    Ok(Some(
        serde_json::json!({"id":id.to_string(),"recorded_at":at,"decision":decision,"evidence":evidence,"run":run,"run_state":if run.is_some(){"retained"}else{"unavailable_or_over_budget"},"scope":"Recorded local experiment, not proof of general intelligence or automatic promotion."}),
    ))
}
async fn list(
    State(s): State<History>,
    Query(q): Query<Cursor>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    if q.before.is_some_and(|id| id <= 0) {
        return Err(StatusCode::BAD_REQUEST);
    }
    let permit = s
        .slots
        .try_acquire_owned()
        .map_err(|_| StatusCode::TOO_MANY_REQUESTS)?;
    tokio::task::spawn_blocking(move || {
        let _permit = permit;
        page(&s.path, q.before)
            .map(Json)
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
    })
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
}
async fn record(
    State(s): State<History>,
    Path(id): Path<i64>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    if id <= 0 {
        return Err(StatusCode::BAD_REQUEST);
    }
    let permit = s
        .slots
        .try_acquire_owned()
        .map_err(|_| StatusCode::TOO_MANY_REQUESTS)?;
    tokio::task::spawn_blocking(move || {
        let _permit = permit;
        detail(&s.path, id)
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
            .map(Json)
            .ok_or(StatusCode::NOT_FOUND)
    })
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
}
fn job_status(path: &std::path::Path, id: i64) -> rusqlite::Result<Option<serde_json::Value>> {
    let c = connection(path)?;
    let row:Option<(String,Option<String>)>=c.query_row("SELECT state,CASE WHEN length(CAST(result AS BLOB))<=2097152 THEN result END FROM jobs WHERE id=?1 AND payload='\"DedupExperiment\"'",[id],|r|Ok((r.get(0)?,r.get(1)?))).optional()?;
    let Some((state, raw)) = row else {
        return Ok(None);
    };
    let result = raw.and_then(|text| serde_json::from_str::<serde_json::Value>(&text).ok());
    let experiment_id = result
        .as_ref()
        .and_then(|r| r["experiment_id_text"].as_str())
        .filter(|id| id.parse::<i64>().is_ok_and(|n| n > 0));
    Ok(Some(
        serde_json::json!({"id":id.to_string(),"state":state,"experiment_id":experiment_id,"history_retained":experiment_id.is_some()}),
    ))
}
async fn job(
    State(s): State<History>,
    Path(id): Path<i64>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    if id <= 0 {
        return Err(StatusCode::BAD_REQUEST);
    }
    let permit = s
        .slots
        .try_acquire_owned()
        .map_err(|_| StatusCode::TOO_MANY_REQUESTS)?;
    tokio::task::spawn_blocking(move || {
        let _permit = permit;
        job_status(&s.path, id)
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
            .map(Json)
            .ok_or(StatusCode::NOT_FOUND)
    })
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
}
pub fn router(path: PathBuf) -> Router {
    Router::new()
        .route(
            "/learning",
            get(|| async { Html(include_str!("../ui/learning-history.html")) }),
        )
        .route(
            "/learning/app.js",
            get(|| async {
                (
                    [(header::CONTENT_TYPE, "text/javascript")],
                    include_str!("../ui/learning-history.js"),
                )
                    .into_response()
            }),
        )
        .route(
            "/learning/style.css",
            get(|| async {
                (
                    [(header::CONTENT_TYPE, "text/css")],
                    include_str!("../ui/learning-history.css"),
                )
                    .into_response()
            }),
        )
        .route(
            "/learning/job-submit.mjs",
            get(|| async {
                (
                    [(header::CONTENT_TYPE, "text/javascript")],
                    include_str!("../ui/job-submit.mjs"),
                )
                    .into_response()
            }),
        )
        .route("/api/learning/jobs/{id}", get(job))
        .route("/api/learning/history", get(list))
        .route("/api/learning/history/{id}", get(record))
        .with_state(History {
            path,
            slots: Arc::new(tokio::sync::Semaphore::new(4)),
        })
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn legacy_history_is_paginated_read_only_and_bounded() {
        let p = std::env::temp_dir().join(format!(
            "athena-history-{}-{}.sqlite",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&p)
            .unwrap();
        let c = Connection::open(&p).unwrap();
        c.execute_batch("CREATE TABLE experiments(id INTEGER PRIMARY KEY,recorded_at TEXT,candidate TEXT,baseline TEXT,decision TEXT,evidence TEXT);").unwrap();
        for id in 1..=25 {
            c.execute("INSERT INTO experiments VALUES(?1,'now','<script>bad</script>','base','blocked','{}')",[id]).unwrap();
        }
        drop(c);
        let before = std::fs::read(&p).unwrap();
        let first = page(&p, None).unwrap();
        assert_eq!(first["records"].as_array().unwrap().len(), 20);
        assert_eq!(first["next_before"], "6");
        assert_eq!(
            page(&p, Some(6)).unwrap()["records"]
                .as_array()
                .unwrap()
                .len(),
            5
        );
        let item = detail(&p, 1).unwrap().unwrap();
        assert_eq!(item["run_state"], "unavailable_or_over_budget");
        assert!(detail(&p, 99).unwrap().is_none());
        assert_eq!(std::fs::read(&p).unwrap(), before);
        std::fs::remove_file(p).unwrap();
    }
}
