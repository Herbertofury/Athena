//! Loopback-only interface. No remote hosting, external scripts, credentials or self-deployment.
mod foundry_api;
use crate::jobs::{Job, Queue};
use axum::{
    Json, Router,
    extract::{DefaultBodyLimit, Path as RoutePath, Request, State},
    http::{HeaderMap, StatusCode, header},
    middleware::{self, Next},
    response::{Html, IntoResponse, Response},
    routing::{get, post},
};
use std::{
    path::{Path, PathBuf},
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
    foundry_snapshot: Option<Arc<crate::foundry_snapshot::FoundrySnapshotStore>>,
    engine_instance: String,
    runtime_assets: Option<Arc<crate::athena_assets::RuntimeAssets>>,
    path: PathBuf,
    db_slots: Arc<tokio::sync::Semaphore>,
    worker_status: Arc<AtomicU8>,
    wake: SyncSender<()>,
    overview_candidate: bool,
}
// Public, ephemeral cache namespace, not an authentication credential.
fn new_engine_instance() -> Result<String, std::io::Error> {
    let mut bytes = [0_u8; 16];
    getrandom::fill(&mut bytes).map_err(|error| std::io::Error::other(error.to_string()))?;
    Ok(bytes.iter().map(|byte| format!("{byte:02x}")).collect())
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
async fn runtime_info(State(app): State<App>) -> Json<serde_json::Value> {
    Json(serde_json::json!({"application":"Athena", "api_version":1,
        "engine_instance":app.engine_instance,"loopback_only":true,"same_origin_only":true,
        "external_media":false,"overview_strategy":if app.overview_candidate {"validated-raw-candidate"} else {"baseline"},
        "runtime_manifest_sha256":app.runtime_assets.as_ref().map(|assets|assets.manifest_sha256.as_str())}))
}
async fn runtime_asset(State(app): State<App>, request: Request) -> Response {
    if request.method() != axum::http::Method::GET {
        return StatusCode::METHOD_NOT_ALLOWED.into_response();
    }
    let Some(assets) = &app.runtime_assets else {
        return StatusCode::NOT_FOUND.into_response();
    };
    let Some(asset) = assets.get(request.uri().path()) else {
        return StatusCode::NOT_FOUND.into_response();
    };
    (
        [
            (header::CONTENT_TYPE, asset.content_type),
            (
                header::HeaderName::from_static("x-athena-asset-sha256"),
                asset.sha256.as_str(),
            ),
            (
                header::HeaderName::from_static("x-athena-runtime-sha256"),
                assets.manifest_sha256.as_str(),
            ),
        ],
        axum::body::Bytes::from_owner(asset.bytes.clone()),
    )
        .into_response()
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
            "x-atlas-engine-instance",
            app.engine_instance
                .parse()
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
        );
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
#[derive(Clone, Copy)]
enum ArchiveKind {
    Project,
    Version,
    Upstream,
}
impl ArchiveKind {
    fn label(self) -> &'static str {
        match self {
            Self::Project => "project",
            Self::Version => "version",
            Self::Upstream => "upstream",
        }
    }
}
async fn saved_project_response(
    State(app): State<App>,
    RoutePath(id): RoutePath<String>,
) -> Result<Response, StatusCode> {
    saved_archive_response(app, id, ArchiveKind::Project).await
}
async fn saved_version_response(
    State(app): State<App>,
    RoutePath(id): RoutePath<String>,
) -> Result<Response, StatusCode> {
    saved_archive_response(app, id, ArchiveKind::Version).await
}
async fn saved_upstream_response(
    State(app): State<App>,
    RoutePath(id): RoutePath<String>,
) -> Result<Response, StatusCode> {
    saved_archive_response(app, id, ArchiveKind::Upstream).await
}
async fn saved_archive_response(
    app: App,
    id: String,
    kind: ArchiveKind,
) -> Result<Response, StatusCode> {
    match kind {
        ArchiveKind::Project => {
            crate::modrinth::projects_url(std::slice::from_ref(&id))
                .map_err(|_| StatusCode::BAD_REQUEST)?;
        }
        ArchiveKind::Version => {
            crate::modrinth_versions::versions_url(std::slice::from_ref(&id))
                .map_err(|_| StatusCode::BAD_REQUEST)?;
        }
        ArchiveKind::Upstream => {
            crate::upstream_reviews::Source::parse(&id).map_err(|_| StatusCode::BAD_REQUEST)?;
        }
    }
    let permit = app
        .db_slots
        .try_acquire_owned()
        .map_err(|_| StatusCode::TOO_MANY_REQUESTS)?;
    tokio::task::spawn_blocking(move || {
        let _permit = permit;
        let store = crate::snapshots::SnapshotStore::open(&app.path)
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        let stored = match kind {
            ArchiveKind::Project => store.latest_modrinth_project_snapshot(&id).map(|snapshot| {
                snapshot.map(|(generation, record)| (generation, record.raw_json().to_owned()))
            }),
            ArchiveKind::Version => store.latest_modrinth_version_snapshot(&id).map(|snapshot| {
                snapshot.map(|(generation, record)| (generation, record.payload.get().to_owned()))
            }),
            ArchiveKind::Upstream => store
                .latest_upstream_snapshot(
                    crate::upstream_reviews::Source::parse(&id)
                        .map_err(|_| StatusCode::BAD_REQUEST)?,
                )
                .map(|snapshot| snapshot.map(|(generation, record)| (generation, record.payload))),
        };
        let (generation, payload) = stored
            .map_err(|_| StatusCode::UNPROCESSABLE_ENTITY)?
            .ok_or(StatusCode::NOT_FOUND)?;
        let hash = crate::build_identity::sha256_hex(payload.as_bytes());
        let mut response = ([(header::CONTENT_TYPE, "application/json")], payload).into_response();
        for (key, value) in [
            ("x-atlas-archive-kind", kind.label().to_owned()),
            ("x-atlas-canonical-id", id),
            ("x-atlas-generation", generation.to_string()),
            ("x-atlas-payload-sha256", hash),
        ] {
            response.headers_mut().insert(
                key,
                value
                    .parse()
                    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
            );
        }
        Ok(response)
    })
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
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
fn persist_experiment(
    path: &Path,
    completed: bool,
    mut output: serde_json::Value,
    evidence: &crate::Evidence,
    policy: &crate::Gate,
) -> (bool, serde_json::Value) {
    output["acceptance_policy"] = serde_json::json!(policy.snapshot());
    match crate::journal::Journal::open(path)
        .map_err(|_| ())
        .and_then(|mut journal| journal.record(evidence, policy, None).map_err(|_| ()))
    {
        Ok(id) => {
            output["experiment_id"] = id.into();
            (completed, output)
        }
        Err(()) => {
            output["error"]="Could not append the experiment journal; raw evidence is retained in this job result".into();
            (false, output)
        }
    }
}
fn saved_version_experiment(
    path: &Path,
    version: &str,
    stop: &AtomicBool,
) -> Result<(bool, serde_json::Value), &'static str> {
    let store = crate::snapshots::SnapshotStore::open(path)
        .map_err(|_| "Saved version database could not be opened")?;
    let (generation, record) = store
        .latest_modrinth_version_snapshot(version)
        .map_err(|_| "Saved version is invalid or its identity does not match")?
        .ok_or(
            "No saved version found. Collect public version metadata into this database first",
        )?;
    drop(store);
    let run = crate::version_experiment_runner::run_stored_version(
        version,
        generation,
        record.payload.get(),
        || stop.load(Ordering::Relaxed),
    )?;
    let output = serde_json::json!({"experiment":run});
    Ok(persist_experiment(
        path,
        run.completed,
        output,
        &run.evidence,
        &crate::version_experiment_runner::policy(),
    ))
}
// Raw provider JSON stays in SnapshotStore, never round-tripped through Value.
// The bounded job result is a receipt, not a replacement for the complete data.
fn save_version_receipt(
    path: &Path,
    batch: crate::modrinth_versions::VersionBatch,
) -> Result<(bool, serde_json::Value), &'static str> {
    let mut store = crate::snapshots::SnapshotStore::open(path)
        .map_err(|_| "Version snapshot database could not be opened")?;
    let generations = store
        .save_modrinth_versions(&batch)
        .map_err(|_| "Version snapshots could not be committed; no success claimed")?;
    let records: Vec<_> = batch
        .versions
        .iter()
        .zip(generations)
        .map(|(record, (id, generation))| {
            serde_json::json!({"canonical_id":id,"project_id":record.project_id,
            "generation":generation.to_string(),"payload_bytes":record.payload.get().len(),
            "payload_sha256":crate::build_identity::sha256_hex(record.payload.get().as_bytes())})
        })
        .collect();
    let complete = batch.missing_ids.is_empty();
    Ok((
        complete,
        serde_json::json!({"version_collection":{
        "requested_ids":batch.requested_ids,"records":records,"missing_ids":batch.missing_ids,
        "status":if complete {"complete"} else {"partial"},
        "scope":"Receipt only; complete original JSON retained in local version snapshots. File links are metadata, never downloaded or executed."}}),
    ))
}
fn collect_versions(
    path: &Path,
    ids: &[String],
    fetch: impl FnOnce() -> Result<crate::modrinth_versions::VersionBatch, Box<dyn std::error::Error>>,
) -> Result<(bool, serde_json::Value), &'static str> {
    crate::modrinth_versions::versions_url(ids).map_err(|_| "Invalid version collection IDs")?;
    match fetch() {
        Ok(batch) if batch.requested_ids == ids => save_version_receipt(path, batch),
        result => {
            let message = match result {
                Err(error) => crate::collection_failure::safe_message(error.as_ref()),
                Ok(_) => "Version response request identity mismatch",
            };
            let mut store = crate::snapshots::SnapshotStore::open(path)
                .map_err(|_| "Collection failed and failure history could not be opened; previous snapshots retained")?;
            store.record_version_failure(ids)
                .map_err(|_| "Collection failed and failure history could not be committed; previous snapshots retained")?;
            Err(message)
        }
    }
}
fn upstream_job(
    path: &Path,
    source: &str,
    client: &mut Option<crate::upstream_reviews::PublicClient>,
    stop: &AtomicBool,
) -> Result<(bool, serde_json::Value), &'static str> {
    let source = crate::upstream_reviews::Source::parse(source)?;
    if client.is_none() {
        *client = Some(
            crate::upstream_reviews::PublicClient::new()
                .map_err(|_| "Public upstream client could not be initialized")?,
        );
    }
    let (accepted, receipt) = crate::upstream_reviews::review_with_cancel(
        client
            .as_ref()
            .ok_or("Public upstream client unavailable")?,
        source,
        path,
        || stop.load(Ordering::Relaxed),
    )?;
    Ok((accepted, serde_json::json!({"upstream_review":receipt})))
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
    let mut upstream_client = None;
    status.store(1, Ordering::Relaxed);
    while !stop.load(Ordering::Relaxed) {
        match q.claim("local-worker", now(), 60_000) {
            Ok(Some(claim)) => {
                let result=match &claim.job {
                    Job::CollectModrinth {project}=>await_provider_slot(client.cooldown_remaining(), &stop).map_err(|e| -> Box<dyn std::error::Error> {e.into()}).and_then(|()| client.project(project)).map(|p|(true,serde_json::json!({"project":p,"scope":"one public metadata projection"}))).map_err(|e|crate::collection_failure::safe_message(e.as_ref())),
                    Job::CollectModrinthRaw {project}=>crate::project_archive::collect(&path,project,|| {
                        await_provider_slot(client.cooldown_remaining(), &stop)?;
                        client.project_record(project)
                    }).map(|receipt|(true,serde_json::json!({"project_archive":receipt}))),
                    Job::CollectModrinthBatch {projects}=>await_provider_slot(client.cooldown_remaining(), &stop).map_err(|e| -> Box<dyn std::error::Error> {e.into()}).and_then(|()| client.projects(projects)).map(batch_output).map_err(|e|crate::collection_failure::safe_message(e.as_ref())),
                    Job::CollectModrinthVersions {versions}=>collect_versions(&path,versions,|| {
                        await_provider_slot(client.cooldown_remaining(), &stop)?;
                        client.versions(versions)
                    }),
                    Job::ReviewUpstream {source}=>upstream_job(&path,source,&mut upstream_client,&stop),
                    Job::DedupExperiment=>crate::experiment_runner::run_builtin(||stop.load(Ordering::Relaxed)).map(|run|{
                        let output=serde_json::json!({"experiment":run});
                        persist_experiment(&path,run.completed,output,&run.evidence,&crate::experiment_runner::policy())
                    }).map_err(|_|"Built-in experiment configuration rejected"),
                    Job::VersionValidationExperiment {version}=>saved_version_experiment(&path,version,&stop),
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
    serve_strategy(path, false, None, None).await
}
pub async fn serve_candidate(path: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    serve_strategy(path, true, None, None).await
}
pub async fn serve_athena(
    path: PathBuf,
    public: PathBuf,
) -> Result<(), Box<dyn std::error::Error>> {
    serve_athena_with_foundry(path, public, None).await
}
pub async fn serve_athena_with_foundry(
    path: PathBuf,
    public: PathBuf,
    snapshot_directory: Option<PathBuf>,
) -> Result<(), Box<dyn std::error::Error>> {
    let snapshot = snapshot_directory
        .as_deref()
        .map(crate::foundry_snapshot::FoundrySnapshotStore::open)
        .transpose()?
        .map(Arc::new);
    let assets =
        crate::athena_assets::RuntimeAssets::load(&public).map_err(std::io::Error::other)?;
    serve_strategy(path, false, Some(Arc::new(assets)), snapshot).await
}
async fn serve_strategy(
    path: PathBuf,
    overview_candidate: bool,
    runtime_assets: Option<Arc<crate::athena_assets::RuntimeAssets>>,
    foundry_snapshot: Option<Arc<crate::foundry_snapshot::FoundrySnapshotStore>>,
) -> Result<(), Box<dyn std::error::Error>> {
    let engine_instance = new_engine_instance()?;
    Queue::open(&path)?;
    foundry_api::initialize(&path).map_err(std::io::Error::other)?;
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
    let static_router = if runtime_assets.is_some() {
        Router::new().fallback(runtime_asset)
    } else {
        Router::new()
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
            .route(
                "/archive-view.mjs",
                get(|| async {
                    (
                        [(header::CONTENT_TYPE, "text/javascript")],
                        include_str!("../ui/archive-view.mjs"),
                    )
                }),
            )
            .route(
                "/job-submit.mjs",
                get(|| async {
                    (
                        [(header::CONTENT_TYPE, "text/javascript; charset=utf-8")],
                        include_str!("../ui/job-submit.mjs"),
                    )
                }),
            )
    };
    let state = App {
        foundry_snapshot,
        engine_instance,
        runtime_assets,
        path,
        worker_status,
        wake,
        overview_candidate,
        db_slots: Arc::new(tokio::sync::Semaphore::new(4)),
    };
    let app = static_router
        .merge(foundry_api::routes(state.clone()))
        .route("/api/runtime", get(runtime_info))
        .route("/api/project-archive/{id}", get(saved_project_response))
        .route("/api/version-archive/{id}", get(saved_version_response))
        .route("/api/upstream-archive/{id}", get(saved_upstream_response))
        .route("/api/overview", get(overview))
        .route("/api/jobs", post(enqueue))
        .layer(DefaultBodyLimit::max(4096))
        .layer(middleware::from_fn(guard))
        .with_state(state);
    println!(
        "Athena Lab local interface: {ORIGIN}. Press Ctrl+C to stop. No remote access is enabled."
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
    fn engine_instances_are_bounded_public_namespaces() {
        let mut seen = std::collections::HashSet::new();
        for _ in 0..100 {
            let value = new_engine_instance().unwrap();
            assert_eq!(value.len(), 32);
            assert!(
                value
                    .bytes()
                    .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
            );
            assert!(seen.insert(value));
        }
    }

    #[test]
    fn upstream_archive_route_returns_only_bound_saved_evidence() {
        use crate::upstream_reviews::{Source, response_meta, tests::fixture};
        let directory = std::env::temp_dir().join(format!(
            "atlas-upstream-view-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir(&directory).unwrap();
        let path = directory.join("fixture.sqlite");
        let body = fixture("v1.7.4");
        let mut store = crate::snapshots::SnapshotStore::open(&path).unwrap();
        store
            .save_upstream(
                Source::Hls,
                &body,
                &response_meta(200, &HeaderMap::new(), 10000, 0),
            )
            .unwrap();
        drop(store);
        let (wake, _receiver) = std::sync::mpsc::sync_channel(1);
        let app = App {
            foundry_snapshot: None,
            engine_instance: "0".repeat(32),
            runtime_assets: None,
            path: path.clone(),
            worker_status: Arc::new(AtomicU8::new(1)),
            wake,
            overview_candidate: false,
            db_slots: Arc::new(tokio::sync::Semaphore::new(4)),
        };
        tokio::runtime::Builder::new_multi_thread()
            .worker_threads(2)
            .enable_all()
            .build()
            .unwrap()
            .block_on(async {
                let response =
                    saved_archive_response(app.clone(), "hls".into(), ArchiveKind::Upstream)
                        .await
                        .unwrap();
                assert_eq!(response.headers()["x-atlas-archive-kind"], "upstream");
                assert_eq!(response.headers()["x-atlas-canonical-id"], "hls");
                assert_eq!(response.headers()["x-atlas-generation"], "1");
                assert_eq!(
                    response.headers()["x-atlas-payload-sha256"],
                    crate::build_identity::sha256_hex(&body)
                );
                assert_eq!(
                    axum::body::to_bytes(response.into_body(), 2 * 1024 * 1024)
                        .await
                        .unwrap()
                        .as_ref(),
                    body
                );
                assert_eq!(
                    saved_archive_response(
                        app.clone(),
                        "new-unreviewed".into(),
                        ArchiveKind::Upstream
                    )
                    .await
                    .unwrap_err(),
                    StatusCode::BAD_REQUEST
                );
                assert_eq!(
                    saved_archive_response(app.clone(), "rustsec".into(), ArchiveKind::Upstream)
                        .await
                        .unwrap_err(),
                    StatusCode::NOT_FOUND
                );
                let c = rusqlite::Connection::open(&path).unwrap();
                c.execute("UPDATE snapshots SET payload='{}'", []).unwrap();
                drop(c);
                assert_eq!(
                    saved_archive_response(app.clone(), "hls".into(), ArchiveKind::Upstream)
                        .await
                        .unwrap_err(),
                    StatusCode::UNPROCESSABLE_ENTITY
                );
                assert_eq!(app.db_slots.available_permits(), 4);
            });
        assert_eq!(
            crate::snapshots::SnapshotStore::open(&path)
                .unwrap()
                .attempts()
                .unwrap(),
            1
        );
    }

    #[test]
    fn saved_archive_routes_keep_namespaces_and_exact_bytes() {
        let directory = std::env::temp_dir().join(format!(
            "atlas-archive-kinds-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir(&directory).unwrap();
        let path = directory.join("fixture.sqlite");
        let id = "abcdefgh".to_owned();
        let project = " {\"id\":\"abcdefgh\",\"slug\":\"fixture\",\"title\":\"Generated\",\"description\":\"Not live\",\"project_type\":\"mod\",\"versions\":[],\"unknown\":18446744073709551617} ";
        let version = r#"{"id":"abcdefgh","project_id":"AANobbMI","name":"Generated","version_number":"1","date_published":"2026-10-30","game_versions":[],"loaders":[],"files":[],"dependencies":[],"unknown":18446744073709551617,"changelog":"雪 <script>inert</script>"}"#;
        let mut store = crate::snapshots::SnapshotStore::open(&path).unwrap();
        let project_generation = store
            .save_modrinth_project_record(
                &id,
                &crate::modrinth::parse_project_record(project.as_bytes(), &id).unwrap(),
            )
            .unwrap();
        let batch = crate::modrinth_versions::parse_versions(
            format!("[{version}]").as_bytes(),
            std::slice::from_ref(&id),
        )
        .unwrap();
        let version_generation = store.save_modrinth_versions(&batch).unwrap()[0].1;
        store.record_project_raw_failure(&id).unwrap();
        store
            .record_version_failure(std::slice::from_ref(&id))
            .unwrap();
        drop(store);
        let (wake, _receiver) = std::sync::mpsc::sync_channel(1);
        let app = App {
            foundry_snapshot: None,
            engine_instance: "0".repeat(32),
            runtime_assets: None,
            path: path.clone(),
            worker_status: Arc::new(AtomicU8::new(1)),
            wake,
            overview_candidate: false,
            db_slots: Arc::new(tokio::sync::Semaphore::new(4)),
        };
        tokio::runtime::Builder::new_multi_thread().worker_threads(2).enable_all().build().unwrap().block_on(async {
            for (kind, expected, generation) in [(ArchiveKind::Project, project, project_generation),(ArchiveKind::Version, version, version_generation)] {
                let response = saved_archive_response(app.clone(), id.clone(), kind).await.unwrap();
                assert_eq!(response.headers()["x-atlas-archive-kind"], kind.label());
                assert_eq!(response.headers()["x-atlas-canonical-id"], id);
                assert_eq!(response.headers()["x-atlas-generation"], generation.to_string());
                assert_eq!(response.headers()["x-atlas-payload-sha256"], crate::build_identity::sha256_hex(expected.as_bytes()));
                assert_eq!(axum::body::to_bytes(response.into_body(), 2*1024*1024).await.unwrap().as_ref(), expected.as_bytes());
                assert_eq!(app.db_slots.available_permits(), 4);
            }
            assert_eq!(saved_archive_response(app.clone(), "sodium".into(), ArchiveKind::Version).await.unwrap_err(), StatusCode::BAD_REQUEST);
            assert_eq!(saved_archive_response(app.clone(), "MISSING1".into(), ArchiveKind::Version).await.unwrap_err(), StatusCode::NOT_FOUND);
            let mut busy=app.clone();busy.db_slots=Arc::new(tokio::sync::Semaphore::new(0));
            assert_eq!(saved_archive_response(busy, id.clone(), ArchiveKind::Version).await.unwrap_err(), StatusCode::TOO_MANY_REQUESTS);
            let c=rusqlite::Connection::open(&path).unwrap();
            c.execute("INSERT INTO snapshots(provider,canonical_id,payload) VALUES('modrinth-version','CORRUPT1',?1)",[version]).unwrap();drop(c);
            assert_eq!(saved_archive_response(app.clone(), "CORRUPT1".into(), ArchiveKind::Version).await.unwrap_err(), StatusCode::UNPROCESSABLE_ENTITY);
        });
        let store = crate::snapshots::SnapshotStore::open(&path).unwrap();
        assert_eq!(store.attempts().unwrap(), 4);
        assert_eq!(
            store
                .latest_modrinth_version(&id)
                .unwrap()
                .unwrap()
                .payload
                .get(),
            version
        );
        assert_eq!(
            store
                .latest_modrinth_project_record(&id)
                .unwrap()
                .unwrap()
                .raw_json(),
            project
        );
    }

    #[test]
    fn queued_version_receipts_preserve_full_bytes_and_last_good() {
        let dir = std::env::temp_dir().join(format!(
            "atlas-version-queue-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir(&dir).unwrap();
        let path = dir.join("fixture.sqlite");
        let id = "abcdefgh".to_owned();
        let ids = vec![id.clone()];
        let raw = r#"{"id":"abcdefgh","project_id":"AANobbMI","name":"fixture","version_number":"1","date_published":"2026-10-27","game_versions":[],"loaders":[],"files":[],"dependencies":[],"future":{"exact":18446744073709551617,"nullable":null},"changelog":"line 1\nline 2"}"#;
        let batch =
            crate::modrinth_versions::parse_versions(format!("[{raw}]").as_bytes(), &ids).unwrap();
        let (complete, receipt) = collect_versions(&path, &ids, || Ok(batch)).unwrap();
        assert!(complete);
        assert_eq!(
            receipt["version_collection"]["records"][0]["payload_sha256"],
            crate::build_identity::sha256_hex(raw.as_bytes())
        );
        assert!(receipt["version_collection"]["records"][0]["generation"].is_string());
        assert!(
            !serde_json::to_string(&receipt)
                .unwrap()
                .contains("18446744073709551617")
        );
        let store = crate::snapshots::SnapshotStore::open(&path).unwrap();
        assert_eq!(
            store
                .latest_modrinth_version(&id)
                .unwrap()
                .unwrap()
                .payload
                .get(),
            raw
        );
        let batch = crate::modrinth_versions::parse_versions(b"[]", &ids).unwrap();
        let (complete, receipt) = collect_versions(&path, &ids, || Ok(batch)).unwrap();
        assert!(!complete);
        assert_eq!(receipt["version_collection"]["missing_ids"][0], id);
        assert!(
            collect_versions(&path, &ids, || Err("secret-provider-error-token".into())).is_err()
        );
        assert_eq!(
            store
                .latest_modrinth_version(&id)
                .unwrap()
                .unwrap()
                .payload
                .get(),
            raw
        );
        let conn = rusqlite::Connection::open(&path).unwrap();
        let outcomes: Vec<String> = conn
            .prepare("SELECT outcome FROM collection_attempts ORDER BY id")
            .unwrap()
            .query_map([], |r| r.get(0))
            .unwrap()
            .collect::<Result<_, _>>()
            .unwrap();
        assert_eq!(outcomes, vec!["success", "failure", "failure"]);
        assert_eq!(
            conn.query_row("PRAGMA integrity_check", [], |r| r.get::<_, String>(0))
                .unwrap(),
            "ok"
        );
        let bad = crate::modrinth_versions::parse_versions(b"[]", &["ijklmnop".into()]).unwrap();
        assert_eq!(
            collect_versions(&path, &ids, || Ok(bad)).unwrap_err(),
            "Version response request identity mismatch"
        );
        assert!(
            collect_versions(&path, &["https://example.com".into()], || panic!(
                "invalid IDs must not fetch"
            ))
            .is_err()
        );
    }
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
