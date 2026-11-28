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

enum ReviewMode {
    Counts { fingerprint: bool },
    Projects,
    Search,
    Candidate,
}

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
        None => ReviewMode::Counts { fingerprint: false },
        Some("fingerprint=1") => ReviewMode::Counts { fingerprint: true },
        Some("projects=1") => ReviewMode::Projects,
        Some("projects-search=1") => ReviewMode::Search,
        Some("project-candidate=1") => ReviewMode::Candidate,
        _ => return StatusCode::BAD_REQUEST.into_response(),
    };
    let Ok(permit) = slots.try_acquire_owned() else {
        return StatusCode::TOO_MANY_REQUESTS.into_response();
    };
    let limit = match mode {
        ReviewMode::Candidate => crate::constellation_project_stage::MAX_FRAME_BYTES,
        ReviewMode::Search => crate::constellation_project_stage::MAX_SEARCH_FRAME,
        _ => crate::constellation_review::LIMIT as usize,
    };
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
        match mode {
            ReviewMode::Counts { fingerprint } => {
                crate::constellation_review::review_selected_bytes(&body, fingerprint)
                    .map(|report| Json(report).into_response())
            }
            ReviewMode::Projects => crate::constellation_project_stage::review_projects(&body, "")
                .map(|projects| Json(projects).into_response()),
            ReviewMode::Search => crate::constellation_project_stage::search_projects(&body)
                .map(|projects| Json(projects).into_response()),
            ReviewMode::Candidate => {
                crate::constellation_project_stage::build_candidate_frame(&body).map(|bytes| {
                    ([(header::CONTENT_TYPE, "application/json")], bytes).into_response()
                })
            }
        }
    })
    .await
    {
        Ok(Ok(result)) => result,
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
