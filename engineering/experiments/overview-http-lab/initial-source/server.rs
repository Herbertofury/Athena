//! Loopback-only interface. No remote hosting, external scripts, credentials or self-deployment.
use crate::jobs::{Job, Queue};
use axum::{
    Json, Router,
    extract::{DefaultBodyLimit, Request, State},
    http::{HeaderMap, StatusCode, header},
    middleware::{self, Next},
    response::{Html, IntoResponse, Response},
    routing::{get, post},
};
use std::{
    path::PathBuf,
    sync::{
        Arc,
        atomic::{AtomicBool, AtomicU8, Ordering},
        mpsc::{self, Receiver, SyncSender},
    },
    time::{Duration, SystemTime, UNIX_EPOCH},
};
const HOST: &str = "127.0.0.1:41379";
const ORIGIN: &str = "http://127.0.0.1:41379";
#[derive(Clone)]
struct App {
    path: PathBuf,
    db_slots: Arc<tokio::sync::Semaphore>,
    worker_status: Arc<AtomicU8>,
    wake: SyncSender<()>,
    overview_candidate: bool,
}
fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis().min(i64::MAX as u128) as i64)
        .unwrap_or(0)
}
fn permitted(headers: &HeaderMap, write: bool) -> bool {
    headers.get(header::HOST).and_then(|v| v.to_str().ok()) == Some(HOST)
        && (!write
            || (headers.get(header::ORIGIN).and_then(|v| v.to_str().ok()) == Some(ORIGIN)
                && headers.get("x-atlas-request").and_then(|v| v.to_str().ok())
                    == Some("local-ui")))
}
async fn guard(request: Request, next: Next) -> Response {
    if !permitted(
        request.headers(),
        request.method() != axum::http::Method::GET,
    ) {
        return StatusCode::FORBIDDEN.into_response();
    }
    let mut response = next.run(request).await;
    let h = response.headers_mut();
    h.insert(header::CACHE_CONTROL, "no-store".parse().unwrap());
    h.insert(header::CONTENT_SECURITY_POLICY,"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'".parse().unwrap());
    h.insert(header::X_CONTENT_TYPE_OPTIONS, "nosniff".parse().unwrap());
    h.insert(header::REFERRER_POLICY, "no-referrer".parse().unwrap());
    response
}
async fn overview(State(app): State<App>) -> Result<Response, StatusCode> {
    let permit = app
        .db_slots
        .try_acquire_owned()
        .map_err(|_| StatusCode::TOO_MANY_REQUESTS)?;
    tokio::task::spawn_blocking(move || {
        let _permit = permit;
        let queue = Queue::open(&app.path).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        let status = match app.worker_status.load(Ordering::Relaxed) {
            1 => "running",
            2 => "failed",
            _ => "starting_or_stopped",
        };
        let mut response = if app.overview_candidate {
            let bytes = queue
                .overview_raw_candidate_with_worker_status(status)
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            ([(header::CONTENT_TYPE, "application/json")], bytes).into_response()
        } else {
            let mut value = queue
                .overview()
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            value["worker_status"] = status.into();
            Json(value).into_response()
        };
        response.headers_mut().insert(
            "x-atlas-overview-strategy",
            if app.overview_candidate {
                "validated-raw-candidate"
            } else {
                "baseline"
            }
            .parse()
            .unwrap(),
        );
        Ok(response)
    })
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
}
async fn index(State(app): State<App>) -> Html<String> {
    let html = include_str!("../ui/index.html");
    Html(if app.overview_candidate {
        html.replace("<body>","<body data-overview-strategy=\"validated-raw-candidate\"><p role=\"status\">ISOLATED OVERVIEW CANDIDATE · not automatically promoted</p>")
    } else {
        html.to_owned()
    })
}
async fn enqueue(
    State(app): State<App>,
    Json(job): Json<Job>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let permit = app
        .db_slots
        .try_acquire_owned()
        .map_err(|_| StatusCode::TOO_MANY_REQUESTS)?;
    tokio::task::spawn_blocking(move || {
        let _permit = permit;
        let mut q = Queue::open(&app.path).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        q.enqueue(&job, now())
            .map(|id| {
                // A bounded token cannot be lost between the queue scan and wait.
                // Full means a wake is already pending; never block the HTTP worker.
                let _ = app.wake.try_send(());
                Json(serde_json::json!({"id":id}))
            })
            .map_err(|_| StatusCode::BAD_REQUEST)
    })
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
}
fn batch_output(batch: crate::modrinth::ProjectBatch) -> (bool, serde_json::Value) {
    let complete = batch.missing_ids.is_empty();
    (
        complete,
        serde_json::json!({"batch":batch,"status":if complete {"complete"} else {"partial"},"scope":"bounded public metadata projections; missing identities retained explicitly"}),
    )
}
fn bounded_output(succeeded: bool, output: serde_json::Value) -> (bool, serde_json::Value) {
    match serde_json::to_vec(&output) {
        Ok(bytes) if bytes.len() <= crate::jobs::MAX_JOB_OUTPUT_BYTES => (succeeded, output),
        Ok(bytes) => (
            false,
            serde_json::json!({"error":"Result exceeds job output budget; no truncated success recorded. Try a smaller batch.","rejected_serialized_bytes":bytes.len()}),
        ),
        Err(_) => (
            false,
            serde_json::json!({"error":"Result serialization failed; previous results retained"}),
        ),
    }
}
// Ordinary one-second pacing belongs to the provider, not every job type.
// Long rate-limit cooldowns remain explicit failures rather than occupying a lease.
fn await_provider_slot(delay: Duration, stop: &AtomicBool) -> Result<(), &'static str> {
    if delay > Duration::from_secs(1) {
        return Err("Provider cooldown active; retry later; previous results retained");
    }
    let until = std::time::Instant::now() + delay;
    loop {
        if stop.load(Ordering::Relaxed) {
            return Err("Collection cancelled before request; previous results retained");
        }
        let remaining = until.saturating_duration_since(std::time::Instant::now());
        if remaining.is_zero() {
            return Ok(());
        }
        std::thread::sleep(remaining.min(Duration::from_millis(20)));
    }
}
fn worker(path: PathBuf, stop: Arc<AtomicBool>, status: Arc<AtomicU8>, wake: Receiver<()>) {
    let mut q = match Queue::open(&path) {
        Ok(q) => q,
        Err(_) => {
            status.store(2, Ordering::Relaxed);
            return;
        }
    };
    let mut client = match crate::modrinth::PublicClient::new() {
        Ok(c) => c,
        Err(_) => {
            status.store(2, Ordering::Relaxed);
            return;
        }
    };
    status.store(1, Ordering::Relaxed);
    while !stop.load(Ordering::Relaxed) {
        match q.claim("local-worker", now(), 60_000) {
            Ok(Some(claim)) => {
                let result=match &claim.job {
                    Job::CollectModrinth {project}=>await_provider_slot(client.cooldown_remaining(), &stop).map_err(|e| -> Box<dyn std::error::Error> {e.into()}).and_then(|()| client.project(project)).map(|p|(true,serde_json::json!({"project":p,"scope":"one public metadata projection"}))).map_err(|e|crate::collection_failure::safe_message(e.as_ref())),
                    Job::CollectModrinthBatch {projects}=>await_provider_slot(client.cooldown_remaining(), &stop).map_err(|e| -> Box<dyn std::error::Error> {e.into()}).and_then(|()| client.projects(projects)).map(batch_output).map_err(|e|crate::collection_failure::safe_message(e.as_ref())),
                    Job::DedupExperiment=>crate::experiment_runner::run_builtin(||stop.load(Ordering::Relaxed)).map(|run|{
                        let completed=run.completed;
                        let mut output=serde_json::json!({"experiment":run});
                        match crate::journal::Journal::open(&path).map_err(|_|()).and_then(|mut journal|journal.record(&run.evidence,&crate::experiment_runner::policy(),None).map_err(|_|())) {
                            Ok(id)=>{output["experiment_id"]=id.into();(completed,output)}
                            Err(())=>{output["error"]="Could not append the experiment journal; raw evidence is retained in this job result".into();(false,output)}
                        }
                    }).map_err(|_|"Built-in experiment configuration rejected"),
                };
                let (succeeded, output) = match result {
                    Ok((complete, value)) => bounded_output(complete, value),
                    Err(error) => (false, serde_json::json!({"error":error})),
                };
                if q.finish_output(&claim, succeeded, now(), Some(&output))
                    .is_err()
                {
                    eprintln!("A job could not be finalized; its lease remains recoverable");
                }
                // Drain durable ready work immediately. Provider throttling remains in PublicClient.
                continue;
            }
            Ok(None) => {}
            Err(_) => eprintln!("Queue temporarily unavailable"),
        }
        // Periodic fallback still discovers expired leases or external durable enqueues.
        let _ = wake.recv_timeout(Duration::from_secs(1));
    }
}
pub async fn serve(path: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    serve_strategy(path, false).await
}
pub async fn serve_candidate(path: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    serve_strategy(path, true).await
}
async fn serve_strategy(
    path: PathBuf,
    overview_candidate: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    Queue::open(&path)?;
    let listener = tokio::net::TcpListener::bind(HOST).await?;
    let stop = Arc::new(AtomicBool::new(false));
    let worker_stop = stop.clone();
    let worker_path = path.clone();
    let worker_status = Arc::new(AtomicU8::new(0));
    let status_for_thread = worker_status.clone();
    let (wake, wake_receiver) = mpsc::sync_channel(1);
    let wake_for_shutdown = wake.clone();
    let worker_handle = std::thread::spawn(move || {
        worker(worker_path, worker_stop, status_for_thread, wake_receiver)
    });
    let app = Router::new()
        .route("/", get(index))
        .route(
            "/app.js",
            get(|| async {
                (
                    [(header::CONTENT_TYPE, "text/javascript")],
                    include_str!("../ui/app.js"),
                )
            }),
        )
        .route(
            "/style.css",
            get(|| async {
                (
                    [(header::CONTENT_TYPE, "text/css")],
                    include_str!("../ui/style.css"),
                )
            }),
        )
        .route(
            "/collection-input.mjs",
            get(|| async {
                (
                    [(header::CONTENT_TYPE, "text/javascript")],
                    include_str!("../ui/collection-input.mjs"),
                )
            }),
        )
        .route("/api/overview", get(overview))
        .route("/api/jobs", post(enqueue))
        .layer(DefaultBodyLimit::max(4096))
        .layer(middleware::from_fn(guard))
        .with_state(App {
            path,
            worker_status,
            wake,
            overview_candidate,
            db_slots: Arc::new(tokio::sync::Semaphore::new(4)),
        });
    println!(
        "Atlas Lab local interface: {ORIGIN}. Press Ctrl+C to stop. No remote access is enabled."
    );
    let served = axum::serve(listener, app)
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await;
    stop.store(true, Ordering::Relaxed);
    let _ = wake_for_shutdown.try_send(());
    let _ = tokio::task::spawn_blocking(move || worker_handle.join()).await;
    served?;
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn provider_wait_preserves_long_cooldown_and_cancellation() {
        let stop = AtomicBool::new(false);
        assert!(await_provider_slot(Duration::ZERO, &stop).is_ok());
        assert!(await_provider_slot(Duration::from_secs(60), &stop).is_err());
        stop.store(true, Ordering::Relaxed);
        assert!(await_provider_slot(Duration::ZERO, &stop).is_err());
    }
    #[test]
    fn normal_provider_slot_does_not_return_early() {
        let stop = AtomicBool::new(false);
        let start = std::time::Instant::now();
        assert!(await_provider_slot(Duration::from_millis(25), &stop).is_ok());
        assert!(start.elapsed() >= Duration::from_millis(25));
    }
    #[test]
    fn partial_batch_is_not_reported_as_success() {
        let batch = crate::modrinth::ProjectBatch {
            requested_ids: vec!["AANobbMI".into()],
            projects: vec![],
            missing_ids: vec!["AANobbMI".into()],
        };
        let (success, value) = batch_output(batch);
        assert!(!success);
        assert_eq!(value["status"], "partial");
        assert_eq!(value["batch"]["missing_ids"][0], "AANobbMI");
    }
    #[test]
    fn oversized_result_fails_explicitly_instead_of_looping_on_finalization() {
        let (success, value) = bounded_output(
            true,
            serde_json::json!({"data":"x".repeat(crate::jobs::MAX_JOB_OUTPUT_BYTES)}),
        );
        assert!(!success);
        assert!(
            value["error"]
                .as_str()
                .unwrap()
                .contains("no truncated success")
        );
        let original = serde_json::json!({"complete":"exact"});
        assert_eq!(bounded_output(true, original.clone()), (true, original));
    }
    #[test]
    fn rejects_cross_site_and_dns_rebinding() {
        let mut h = HeaderMap::new();
        h.insert(header::HOST, "evil.example:41379".parse().unwrap());
        assert!(!permitted(&h, false));
        h.insert(header::HOST, HOST.parse().unwrap());
        assert!(permitted(&h, false));
        assert!(!permitted(&h, true));
        h.insert(header::ORIGIN, "https://evil.example".parse().unwrap());
        h.insert("x-atlas-request", "local-ui".parse().unwrap());
        assert!(!permitted(&h, true));
        h.insert(header::ORIGIN, ORIGIN.parse().unwrap());
        assert!(permitted(&h, true));
    }
}
