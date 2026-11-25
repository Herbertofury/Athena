//! Explicit local-only review. Never calls a provider or persists request bytes.
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

async fn review(State(single_job): State<Arc<Semaphore>>, request: Request) -> Response {
    // The server's enclosing guard additionally requires the exact loopback
    // host, same origin and local UI header before admitting any POST.
    let headers = request.headers();
    if headers
        .get(header::CONTENT_TYPE)
        .and_then(|h| h.to_str().ok())
        != Some("application/json")
    {
        return StatusCode::UNSUPPORTED_MEDIA_TYPE.into_response();
    }
    if headers.contains_key(header::CONTENT_ENCODING) {
        return StatusCode::UNSUPPORTED_MEDIA_TYPE.into_response();
    }
    let Ok(permit) = single_job.try_acquire_owned() else {
        return StatusCode::TOO_MANY_REQUESTS.into_response();
    };
    let limit = crate::constellation_review::LIMIT as usize;
    let data = match tokio::time::timeout(
        Duration::from_secs(10),
        to_bytes(request.into_body(), limit),
    )
    .await
    {
        Ok(Ok(data)) => data,
        Ok(Err(_)) => return StatusCode::PAYLOAD_TOO_LARGE.into_response(),
        Err(_) => return StatusCode::REQUEST_TIMEOUT.into_response(),
    };
    let checked = tokio::task::spawn_blocking(move || {
        let _permit = permit;
        crate::constellation_review::review_bytes(&data)
    })
    .await;
    match checked {
        Ok(Ok(report)) => Json(report).into_response(),
        Ok(Err(reason)) => (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(serde_json::json!({ "error": reason })),
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
