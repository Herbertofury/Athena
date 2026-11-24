//! Explicit same-origin native authoring, reusing the independent transactional store.
//! No source discovery, upgrades, import or arbitrary path/command endpoints.
use athena_foundry_store::{Soundtrack, Store, concurrency::version};
use axum::{
    Router,
    body::to_bytes,
    extract::{DefaultBodyLimit, OriginalUri, Request, State},
    http::{HeaderMap, StatusCode, header},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use std::{
    path::{Path, PathBuf},
    sync::Arc,
};
#[derive(Clone)]
struct Native {
    path: PathBuf,
    slots: Arc<tokio::sync::Semaphore>,
}
fn fail(code: StatusCode) -> Response {
    (
        code,
        "{\"error\":\"Native operation rejected; refresh and review before retrying\"}",
    )
        .into_response()
}
fn reply(text: String, tag: Option<String>) -> Response {
    let mut r = ([(header::CONTENT_TYPE, "application/json")], text).into_response();
    if let Some(tag) = tag
        && let Ok(value) = tag.parse()
    {
        r.headers_mut().insert(header::ETAG, value);
    }
    r
}
fn one<'a>(headers: &'a HeaderMap, name: &str) -> Option<&'a str> {
    let mut values = headers.get_all(name).iter();
    let value = values.next()?.to_str().ok()?;
    if values.next().is_some() {
        None
    } else {
        Some(value)
    }
}
fn permitted(headers: &HeaderMap, write: bool) -> bool {
    one(headers, "host") == Some("127.0.0.1:41379")
        && one(headers, "x-athena-native") == Some("1")
        && (!headers.contains_key("origin")
            || one(headers, "origin") == Some("http://127.0.0.1:41379"))
        && (!write || one(headers, "origin") == Some("http://127.0.0.1:41379"))
        && (!headers.contains_key("sec-fetch-site")
            || matches!(one(headers, "sec-fetch-site"), Some("same-origin" | "none")))
}
pub fn validate(
    path: &Path,
    journal: &Path,
    public: &Path,
) -> Result<PathBuf, Box<dyn std::error::Error>> {
    for selected in [path, journal] {
        if selected.ancestors().any(|p| p.is_symlink()) {
            return Err("Symlink store paths refused".into());
        }
    }
    let canonical = path.canonicalize()?;
    let journal_absolute = if journal.exists() {
        journal.canonicalize()?
    } else {
        journal
            .parent()
            .filter(|p| !p.as_os_str().is_empty())
            .unwrap_or(Path::new("."))
            .canonicalize()?
            .join(journal.file_name().ok_or("Journal filename required")?)
    };
    let public = public.canonicalize()?;
    if !canonical.is_file()
        || (journal.exists() && !journal.is_file())
        || canonical.starts_with(&public)
        || journal_absolute.starts_with(&public)
    {
        return Err("External ordinary separate stores required".into());
    }
    let paths = |base: &Path| {
        ["", "-wal", "-shm", "-journal"].map(|suffix| {
            let mut name = base.as_os_str().to_os_string();
            name.push(suffix);
            PathBuf::from(name)
        })
    };
    let native_paths = paths(&canonical);
    let journal_paths = paths(&journal_absolute);
    for group in [&native_paths, &journal_paths] {
        for (i, left) in group.iter().enumerate() {
            for right in group.iter().skip(i + 1) {
                if left.exists() && right.exists() && same_file::is_same_file(left, right)? {
                    return Err("Store main and sidecars must not alias".into());
                }
            }
        }
    }
    for native in &native_paths {
        for evidence in &journal_paths {
            if native.is_symlink()
                || evidence.is_symlink()
                || native == evidence
                || (native.exists()
                    && evidence.exists()
                    && same_file::is_same_file(native, evidence)?)
            {
                return Err("Stores and all sidecars must have separate ownership".into());
            }
        }
    }
    if canonical.metadata()?.len() > 64 * 1024 * 1024 {
        return Err("Unified native store exceeds 64 MiB pilot bound".into());
    }
    let summary =
        Store::open_with_budget(&canonical, std::time::Duration::from_secs(10))?.summary()?;
    if summary.schema != 15 || summary.integrity != "ok" {
        return Err("Explicit schema15 native store required; no automatic upgrade".into());
    }
    Ok(canonical)
}
pub fn router(path: PathBuf) -> Router {
    Router::new()
        .route("/__native/backup", get(read).post(write))
        .route("/__native/revisions", get(read))
        .route("/__native/revision/{id}", get(read))
        .route("/__native/soundtracks", get(read))
        .route("/__native/soundtrack/{theme}/{room}", get(read))
        .route("/__native/restore", post(write))
        .route("/__native/assign-soundtrack", post(write))
        .route("/__native/clear-soundtrack", post(write))
        .layer(DefaultBodyLimit::max(4_000_000))
        .with_state(Native {
            path,
            slots: Arc::new(tokio::sync::Semaphore::new(4)),
        })
}
async fn read(
    State(state): State<Native>,
    OriginalUri(uri): OriginalUri,
    headers: HeaderMap,
) -> Response {
    if !permitted(&headers, false) {
        return fail(StatusCode::FORBIDDEN);
    }
    if uri.query().is_some() {
        return fail(StatusCode::BAD_REQUEST);
    }
    let Ok(permit) = state.slots.clone().try_acquire_owned() else {
        return fail(StatusCode::SERVICE_UNAVAILABLE);
    };
    run(state, uri.path().to_owned(), None, None, permit).await
}
async fn write(State(state): State<Native>, request: Request) -> Response {
    let headers = request.headers();
    if !permitted(headers, true) {
        return fail(StatusCode::FORBIDDEN);
    }
    if request.uri().query().is_some() || one(headers, "content-type") != Some("application/json") {
        return fail(StatusCode::BAD_REQUEST);
    }
    let Some(expected) = one(headers, "if-match") else {
        return fail(StatusCode::PRECONDITION_REQUIRED);
    };
    if expected.len() > 80 {
        return fail(StatusCode::BAD_REQUEST);
    }
    if headers.contains_key("transfer-encoding") {
        return fail(StatusCode::UNSUPPORTED_MEDIA_TYPE);
    }
    let Some(length) = one(headers, "content-length") else {
        return fail(StatusCode::LENGTH_REQUIRED);
    };
    if length.is_empty() || length.len() > 7 || !length.bytes().all(|b| b.is_ascii_digit()) {
        return fail(StatusCode::BAD_REQUEST);
    }
    if length.parse::<usize>().unwrap_or(usize::MAX) > 4_000_000 {
        return fail(StatusCode::PAYLOAD_TOO_LARGE);
    }
    let expected = expected.to_owned();
    let route = request.uri().path().to_owned();
    // Authorization and admission precede any body allocation. Four shared slots
    // bound buffered bodies AND blocking SQLite operations, including timed-out work.
    let Ok(permit) = state.slots.clone().try_acquire_owned() else {
        return fail(StatusCode::SERVICE_UNAVAILABLE);
    };
    let body = match tokio::time::timeout(
        std::time::Duration::from_secs(5),
        to_bytes(request.into_body(), 4_000_000),
    )
    .await
    {
        Ok(Ok(bytes)) => bytes,
        Ok(Err(_)) => return fail(StatusCode::PAYLOAD_TOO_LARGE),
        Err(_) => return fail(StatusCode::REQUEST_TIMEOUT),
    };
    let Ok(text) = String::from_utf8(body.to_vec()) else {
        return fail(StatusCode::BAD_REQUEST);
    };
    run(state, route, Some(text), Some(expected), permit).await
}
async fn run(
    state: Native,
    route: String,
    text: Option<String>,
    expected: Option<String>,
    permit: tokio::sync::OwnedSemaphorePermit,
) -> Response {
    let task = tokio::task::spawn_blocking(move || {
        let _permit = permit;
        operate(&state.path, &route, text.as_deref(), expected.as_deref()).map_err(|_| ())
    });
    match tokio::time::timeout(std::time::Duration::from_secs(15),task).await {
        Ok(Ok(Ok(Some((text,tag))))) if text.len()<=4_000_000=>reply(text,tag),
        Ok(Ok(Ok(None)))=>fail(StatusCode::CONFLICT),
        Err(_)=>(StatusCode::GATEWAY_TIMEOUT,"{\"error\":\"Native outcome uncertain; refresh and review. Do not retry automatically.\"}").into_response(),
        _=>fail(StatusCode::UNPROCESSABLE_ENTITY)
    }
}
type Output = Option<(String, Option<String>)>;
fn operate(
    path: &Path,
    route: &str,
    text: Option<&str>,
    expected: Option<&str>,
) -> athena_foundry_store::Result<Output> {
    if path.metadata()?.len() > 64 * 1024 * 1024 {
        return Err("Native store exceeds pilot bound".into());
    }
    let mut store = Store::open_with_budget(path, std::time::Duration::from_secs(10))?;
    let response = if let Some(text) = text {
        let expected = expected.ok_or("Missing review token")?;
        match route {
            "/__native/backup" => {
                let Some(tag) = store.compare_save_backup(expected, text)? else {
                    return Ok(None);
                };
                ("{\"saved\":true}".into(), Some(tag))
            }
            "/__native/restore" => {
                #[derive(serde::Deserialize)]
                #[serde(deny_unknown_fields)]
                struct Restore {
                    id: i64,
                }
                let r: Restore = serde_json::from_str(text)?;
                if !(1..=9_007_199_254_740_991).contains(&r.id) {
                    return Err("Invalid revision".into());
                }
                let Some(v) = store.compare_restore_revision(expected, r.id)? else {
                    return Ok(None);
                };
                (serde_json::to_string(&v)?, Some(v.version))
            }
            "/__native/assign-soundtrack" => {
                if text.len() > 8192 {
                    return Err("Assignment too large".into());
                }
                let v: Soundtrack = serde_json::from_str(text)?;
                let Some(v) = store.compare_assign_soundtrack(expected, &v)? else {
                    return Ok(None);
                };
                (serde_json::to_string(&v.value)?, Some(v.version))
            }
            "/__native/clear-soundtrack" => {
                if text.len() > 2048 {
                    return Err("Clear too large".into());
                }
                #[derive(serde::Deserialize)]
                #[serde(deny_unknown_fields)]
                struct Clear {
                    theme_id: String,
                    room_id: String,
                }
                let v: Clear = serde_json::from_str(text)?;
                let Some(v) = store.compare_clear_soundtrack(expected, &v.theme_id, &v.room_id)?
                else {
                    return Ok(None);
                };
                ("null".into(), Some(v.version))
            }
            _ => return Err("Unknown action".into()),
        }
    } else {
        match route {
            "/__native/backup" => {
                let v = store.load_backup()?;
                let tag = version(v.as_deref());
                (v.unwrap_or("null".into()), Some(tag))
            }
            "/__native/revisions" => (serde_json::to_string(&store.revisions()?)?, None),
            "/__native/soundtracks" => (serde_json::to_string(&store.soundtrack_library()?)?, None),
            _ if route.starts_with("/__native/revision/") => {
                let id: i64 = route.trim_start_matches("/__native/revision/").parse()?;
                if id < 1 {
                    return Err("Invalid revision".into());
                }
                (store.read_revision(id)?, None)
            }
            _ if route.starts_with("/__native/soundtrack/") => {
                let parts: Vec<_> = route
                    .trim_start_matches("/__native/soundtrack/")
                    .split('/')
                    .collect();
                if parts.len() != 2 {
                    return Err("Invalid room".into());
                }
                let v = store.soundtrack_versioned(parts[0], parts[1])?;
                (serde_json::to_string(&v.value)?, Some(v.version))
            }
            _ => return Err("Unknown read".into()),
        }
    };
    Ok(Some(response))
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn exact_headers_and_cross_origin_refusal() {
        let mut h = HeaderMap::new();
        h.insert("host", "127.0.0.1:41379".parse().unwrap());
        h.insert("x-athena-native", "1".parse().unwrap());
        assert!(permitted(&h, false));
        assert!(!permitted(&h, true));
        h.insert("origin", "http://127.0.0.1:41379".parse().unwrap());
        assert!(permitted(&h, true));
        h.append("origin", "http://evil.invalid".parse().unwrap());
        assert!(!permitted(&h, true));
        h.remove("origin");
        h.append("sec-fetch-site", "same-origin".parse().unwrap());
        h.append("sec-fetch-site", "cross-site".parse().unwrap());
        assert!(!permitted(&h, false));
    }
}
