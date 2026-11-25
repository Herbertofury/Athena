//! Read-only public facts. The installed binary embeds only the generated
//! projection, never the original private-path, media, or provider fields.
use axum::{Router, http::header, response::Html, routing::get};

pub(crate) fn router() -> Router {
    Router::new()
        .route(
            "/migration/foundry-artists",
            get(|| async { Html(include_str!("../ui/foundry-artist-index.html")) }),
        )
        .route(
            "/migration/foundry-artists/app.js",
            get(|| async {
                (
                    [(header::CONTENT_TYPE, "text/javascript")],
                    include_str!("../ui/foundry-artist-index.js"),
                )
            }),
        )
        .route(
            "/migration/foundry-artists/concept.mjs",
            get(|| async {
                (
                    [
                        (header::CONTENT_TYPE, "text/javascript"),
                        (header::X_CONTENT_TYPE_OPTIONS, "nosniff"),
                    ],
                    include_str!("../ui/foundry-artist-concept.mjs"),
                )
            }),
        )
        .route(
            "/migration/foundry-artists/concept.css",
            get(|| async {
                (
                    [
                        (header::CONTENT_TYPE, "text/css"),
                        (header::X_CONTENT_TYPE_OPTIONS, "nosniff"),
                    ],
                    include_str!("../ui/foundry-artist-concept.css"),
                )
            }),
        )
        .route(
            "/api/migration/foundry-artists",
            get(|| async {
                (
                    [
                        (header::CONTENT_TYPE, "application/json"),
                        (header::X_CONTENT_TYPE_OPTIONS, "nosniff"),
                    ],
                    include_str!("../ui/foundry-artist-index.json"),
                )
            }),
        )
}
