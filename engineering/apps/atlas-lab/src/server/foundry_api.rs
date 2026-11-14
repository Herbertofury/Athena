//! Local persistence only. No provider credentials, playback, shell, or HTTP paths.
use super::*;
use crate::foundry_snapshot::{Error as SnapshotError, MAX_SNAPSHOT_BYTES};
use crate::foundry_storage::{Error as StorageError, FoundryStore, RoomSoundtrackInput};
use axum::{
    body::Bytes,
    extract::{Extension, Query},
};
type Permit = Arc<tokio::sync::OwnedSemaphorePermit>;
use serde::Deserialize;

const PACKAGES: &str = include_str!("../../foundry-data/theme-world-packages.json");
const ARTISTS: &str = include_str!("../../foundry-data/artist-worlds-v4.0.1.json");
pub(super) fn initialize(path: &Path) -> Result<(), String> {
    FoundryStore::open(path)
        .map_err(|e| e.to_string())?
        .seed_catalog(PACKAGES, ARTISTS)
}
fn failure(status: StatusCode, code: &'static str) -> Response {
    (status, Json(serde_json::json!({"error":code}))).into_response()
}
fn storage_error(error: StorageError) -> Response {
    match error {
        StorageError::Invalid(_) => failure(StatusCode::BAD_REQUEST, "invalid_input"),
        StorageError::UnsupportedSchema => failure(
            StatusCode::SERVICE_UNAVAILABLE,
            "unsupported_storage_schema",
        ),
        _ => failure(StatusCode::INTERNAL_SERVER_ERROR, "storage_failed"),
    }
}
fn snapshot_error(error: SnapshotError) -> Response {
    match error {
        SnapshotError::UnsupportedPlatform => {
            failure(StatusCode::NOT_IMPLEMENTED, "unsupported_platform")
        }
        _ => failure(StatusCode::INTERNAL_SERVER_ERROR, "snapshot_failed"),
    }
}
// Acquire before any body extraction, so four bounded requests cannot grow into
// an unbounded queue of buffered snapshot uploads or blocking database tasks.
async fn admission(State(app): State<App>, mut request: Request, next: Next) -> Response {
    let Ok(_permit) = app.db_slots.try_acquire_owned() else {
        return failure(StatusCode::TOO_MANY_REQUESTS, "busy");
    };
    request.extensions_mut().insert(Arc::new(_permit));
    next.run(request).await
}
pub(super) fn routes(app: App) -> Router<App> {
    Router::new()
        .route("/api/foundry/capabilities", get(capabilities))
        .route("/api/foundry/catalog", get(catalog))
        .route("/api/foundry/music-routes", get(music_routes))
        .route(
            "/api/foundry/soundtrack",
            get(soundtrack_get).post(soundtrack_set),
        )
        .route(
            "/api/foundry/history",
            get(history_get)
                .post(history_add)
                .layer(DefaultBodyLimit::max(512 * 1024)),
        )
        .route(
            "/api/foundry/snapshot",
            get(snapshot_get)
                .post(snapshot_save)
                .layer(DefaultBodyLimit::max(MAX_SNAPSHOT_BYTES)),
        )
        .layer(middleware::from_fn_with_state(app, admission))
}
async fn capabilities(State(app): State<App>) -> Json<serde_json::Value> {
    Json(
        serde_json::json!({"apiVersion":1,"catalog":true,"soundtrackAssignments":true,"history":true,
        "nativeShell":false,"providerOAuth":false,"providerPlayback":false,"userStateMigration":false,
        "snapshot":{"supportedPlatform": "linux", "available":app.foundry_snapshot.is_some(),
            "state":if !cfg!(target_os="linux") {"unsupported_platform"} else if app.foundry_snapshot.is_some() {"configured"} else {"not_configured"},
            "maxBytes":MAX_SNAPSHOT_BYTES,"rawJson":true},
        "catalogIdentity":{"sourceCommit":"e1ba080b5c7590f1c844a6ed13b3a471709920b9",
            "themePackagesSha256":hex(PACKAGES.as_bytes()),"artistWorldsSha256":hex(ARTISTS.as_bytes())}}),
    )
}
async fn database<F>(app: App, permit: Permit, operation: F) -> Response
where
    F: FnOnce(&mut FoundryStore) -> Response + Send + 'static,
{
    tokio::task::spawn_blocking(move || {
        let _permit = permit;
        match FoundryStore::open(&app.path) {
            Ok(mut store) => operation(&mut store),
            Err(e) => storage_error(e),
        }
    })
    .await
    .unwrap_or_else(|_| failure(StatusCode::INTERNAL_SERVER_ERROR, "worker_failed"))
}
async fn catalog(State(app): State<App>, Extension(permit): Extension<Permit>) -> Response {
    database(app, permit, |s| match s.catalog_summary() {
        Ok(v) => Json(v).into_response(),
        Err(_) => failure(StatusCode::INTERNAL_SERVER_ERROR, "catalog_failed"),
    })
    .await
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct RoutesQuery {
    artist_id: Option<String>,
}
async fn music_routes(
    State(app): State<App>,
    Extension(permit): Extension<Permit>,
    Query(q): Query<RoutesQuery>,
) -> Response {
    if q.artist_id
        .as_ref()
        .is_some_and(|s| s.is_empty() || s.len() > 128 || s.chars().any(char::is_control))
    {
        return failure(StatusCode::BAD_REQUEST, "invalid_artist_id");
    }
    database(app, permit, move |s| {
        match s.list_music_routes(q.artist_id) {
            Ok(v) => Json(v).into_response(),
            Err(_) => failure(StatusCode::INTERNAL_SERVER_ERROR, "catalog_failed"),
        }
    })
    .await
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct RoomQuery {
    theme_id: String,
    room_id: String,
}
async fn soundtrack_get(
    State(app): State<App>,
    Extension(permit): Extension<Permit>,
    Query(q): Query<RoomQuery>,
) -> Response {
    database(app, permit, move |s| {
        match s.room_soundtrack(&q.theme_id, &q.room_id) {
            Ok(Some(v)) => Json(v).into_response(),
            Ok(None) => failure(StatusCode::NOT_FOUND, "assignment_absent"),
            Err(e) => storage_error(e),
        }
    })
    .await
}
async fn soundtrack_set(
    State(app): State<App>,
    Extension(permit): Extension<Permit>,
    Json(input): Json<RoomSoundtrackInput>,
) -> Response {
    database(app, permit, move |s| {
        match s.assign_room_soundtrack(input) {
            Ok(v) => Json(v).into_response(),
            Err(e) => storage_error(e),
        }
    })
    .await
}
fn default_after() -> String {
    "0".into()
}
fn default_limit() -> usize {
    100
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct HistoryQuery {
    #[serde(default = "default_after")]
    after_id: String,
    #[serde(default = "default_limit")]
    limit: usize,
}
async fn history_get(
    State(app): State<App>,
    Extension(permit): Extension<Permit>,
    Query(q): Query<HistoryQuery>,
) -> Response {
    let Ok(after) = q.after_id.parse::<i64>() else {
        return failure(StatusCode::BAD_REQUEST, "invalid_history_cursor");
    };
    database(app, permit, move |s| {
        match s.history_after(after, q.limit) {
            Ok(v) => Json(v).into_response(),
            Err(e) => storage_error(e),
        }
    })
    .await
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct HistoryInput {
    event_type: String,
    payload_json: String,
}
async fn history_add(
    State(app): State<App>,
    Extension(permit): Extension<Permit>,
    Json(input): Json<HistoryInput>,
) -> Response {
    database(app, permit, move |s| {
        match s.record_native_history(&input.event_type, &input.payload_json) {
            Ok(v) => Json(v).into_response(),
            Err(e) => storage_error(e),
        }
    })
    .await
}
fn hex(bytes: &[u8]) -> String {
    crate::build_identity::sha256_hex(bytes)
}
fn unavailable() -> Response {
    if cfg!(target_os = "linux") {
        failure(StatusCode::SERVICE_UNAVAILABLE, "snapshot_not_configured")
    } else {
        failure(StatusCode::NOT_IMPLEMENTED, "unsupported_platform")
    }
}
async fn snapshot_get(State(app): State<App>, Extension(permit): Extension<Permit>) -> Response {
    let Some(store) = app.foundry_snapshot else {
        return unavailable();
    };
    tokio::task::spawn_blocking(move || {
        let _permit = permit;
        match store.load_world_snapshot() {
            Ok(Some(raw)) => {
                let digest = hex(raw.as_bytes());
                let bytes = raw.len().to_string();
                (
                    [
                        (header::CONTENT_TYPE, "application/json"),
                        (
                            header::HeaderName::from_static("x-foundry-sha256"),
                            digest.as_str(),
                        ),
                        (
                            header::HeaderName::from_static("x-foundry-bytes"),
                            bytes.as_str(),
                        ),
                    ],
                    raw,
                )
                    .into_response()
            }
            Ok(None) => failure(StatusCode::NOT_FOUND, "snapshot_absent"),
            Err(e) => snapshot_error(e),
        }
    })
    .await
    .unwrap_or_else(|_| failure(StatusCode::INTERNAL_SERVER_ERROR, "worker_failed"))
}
async fn snapshot_save(
    State(app): State<App>,
    Extension(permit): Extension<Permit>,
    headers: HeaderMap,
    bytes: Bytes,
) -> Response {
    let Some(store) = app.foundry_snapshot else {
        return unavailable();
    };
    if headers
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.split(';').next())
        .map(str::trim)
        != Some("application/json")
    {
        return failure(StatusCode::UNSUPPORTED_MEDIA_TYPE, "json_required");
    }
    tokio::task::spawn_blocking(move || {
        let _permit = permit;
        let Ok(raw)=std::str::from_utf8(&bytes) else {return failure(StatusCode::BAD_REQUEST,"invalid_utf8");};
        if serde_json::from_str::<Box<serde_json::value::RawValue>>(raw).is_err() { return failure(StatusCode::BAD_REQUEST,"invalid_json"); }
        match store.save_world_snapshot(raw) {
            Ok(receipt) => Json(serde_json::json!({"committed":true,"filename":receipt.filename,"bytes":receipt.bytes,
                "sha256":hex(&bytes),"directory_synced":receipt.directory_synced,
                "warning":if receipt.directory_synced {None} else {Some("committed_directory_sync_unconfirmed_do_not_blindly_retry")}})).into_response(),
            Err(e) => snapshot_error(e)
        }
    }).await.unwrap_or_else(|_| failure(StatusCode::INTERNAL_SERVER_ERROR,"worker_failed"))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn cancelled_waiter_does_not_release_blocking_operation_capacity() {
        let runtime = tokio::runtime::Builder::new_multi_thread()
            .worker_threads(2)
            .enable_all()
            .build()
            .unwrap();
        runtime.block_on(async {
            let slots = Arc::new(tokio::sync::Semaphore::new(1));
            let permit = Arc::new(slots.clone().try_acquire_owned().unwrap());
            let (started_tx, started_rx) = std::sync::mpsc::channel();
            let (release_tx, release_rx) = std::sync::mpsc::channel();
            let (finished_tx, finished_rx) = std::sync::mpsc::channel();
            let waiter = tokio::spawn(async move {
                tokio::task::spawn_blocking(move || {
                    let _permit = permit;
                    started_tx.send(()).unwrap();
                    release_rx.recv().unwrap();
                    drop(_permit);
                    finished_tx.send(()).unwrap();
                })
                .await
                .unwrap();
            });
            started_rx.recv_timeout(Duration::from_secs(5)).unwrap();
            waiter.abort();
            let _ = waiter.await;
            assert!(slots.clone().try_acquire_owned().is_err());
            release_tx.send(()).unwrap();
            finished_rx.recv_timeout(Duration::from_secs(5)).unwrap();
            assert!(slots.try_acquire_owned().is_ok());
        });
    }
}
