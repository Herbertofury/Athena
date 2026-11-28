//! Local, explicitly selected export review. Neither mode writes a file.
use axum::{
    Json, Router,
    body::to_bytes,
    extract::{Request, State},
    http::{StatusCode, header},
    response::{Html, IntoResponse, Response},
    routing::{get, post},
};
use std::{sync::Arc, time::Duration};
use tokio::sync::Semaphore;

async fn review(State(slots): State<Arc<Semaphore>>, request: Request) -> Response {
    let headers = request.headers();
    // The enclosing server checks the exact loopback origin/host before reading
    // POST bodies. This route further refuses ambiguous admission headers.
    for name in ["host", "origin", "x-atlas-request", "content-type"] {
        if headers.get_all(name).iter().count() != 1 {
            return StatusCode::BAD_REQUEST.into_response();
        }
    }
    if headers
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        != Some("application/octet-stream")
        || headers.contains_key(header::CONTENT_ENCODING)
    {
        return StatusCode::UNSUPPORTED_MEDIA_TYPE.into_response();
    }
    let mode = match request.uri().query() {
        None => 0,
        Some("fingerprint=1") => 1,
        Some("projects=1") => 2,
        _ => return StatusCode::BAD_REQUEST.into_response(),
    };
    let Ok(permit) = slots.try_acquire_owned() else {
        return StatusCode::TOO_MANY_REQUESTS.into_response();
    };
    let limit = crate::constellation_review::LIMIT as usize;
    let body = match tokio::time::timeout(
        Duration::from_secs(10),
        to_bytes(request.into_body(), limit),
    )
    .await
    {
        Ok(Ok(body)) => body,
        Ok(Err(_)) => return StatusCode::PAYLOAD_TOO_LARGE.into_response(),
        Err(_) => return StatusCode::REQUEST_TIMEOUT.into_response(),
    };
    match tokio::task::spawn_blocking(move || {
        let _permit = permit;
        if mode == 2 {
            crate::constellation_project_stage::review_projects(&body)
        } else {
            let report = crate::constellation_review::review_selected_bytes(&body, mode == 1)?;
            serde_json::to_value(report).map_err(|_| "Could not prepare the local review")
        }
    })
    .await
    {
        Ok(Ok(result)) => Json(result).into_response(),
        Ok(Err(message)) => (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(serde_json::json!({"error": message})),
        )
            .into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

pub(crate) fn router() -> Router {
    Router::new()
        .route(
            "/migration/constellation",
            get(|| async { Html(include_str!("../ui/constellation-review.html")) }),
        )
        .route(
            "/migration/constellation/app.js",
            get(|| async {
                (
                    [(header::CONTENT_TYPE, "text/javascript")],
                    include_str!("../ui/constellation-review.js"),
                )
            }),
        )
        .route("/api/migration/constellation/review", post(review))
        .with_state(Arc::new(Semaphore::new(1)))
}
