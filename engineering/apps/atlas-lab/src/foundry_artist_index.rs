//! The public index is built in. Its first-party preview is an optional
//! digest-pinned portable component, never a generic extension loader.
use crate::build_identity::sha256_hex;
use axum::{Router, http::header, routing::get};
use std::{io::Read, path::Path};

const JS_SHA: &str = env!("ATHENA_ARTIST_CONCEPT_JS_SHA");
const CSS_SHA: &str = env!("ATHENA_ARTIST_CONCEPT_CSS_SHA");
const MAX_COMPONENT_BYTES: u64 = 32 * 1024;
const JS: &str = "foundry-artist-concept.mjs";
const CSS: &str = "foundry-artist-concept.css";

fn read(root: &Path, name: &str, expected: &str) -> Option<String> {
    let dir = root.join("components").join("foundry-artist-concept");
    let path = dir.join(name);
    for part in [&root.join("components"), &dir, &path] {
        let info = std::fs::symlink_metadata(part).ok()?;
        if info.is_symlink() {
            return None;
        }
        #[cfg(windows)]
        {
            use std::os::windows::fs::MetadataExt;
            if info.file_attributes() & 0x400 != 0 {
                return None;
            }
        }
        if part == &path && (!info.is_file() || info.len() > MAX_COMPONENT_BYTES) {
            return None;
        }
    }
    let mut bytes = Vec::new();
    std::fs::File::open(path)
        .ok()?
        .take(MAX_COMPONENT_BYTES + 1)
        .read_to_end(&mut bytes)
        .ok()?;
    if bytes.len() as u64 > MAX_COMPONENT_BYTES || sha256_hex(&bytes) != expected {
        return None;
    }
    String::from_utf8(bytes).ok()
}

pub(crate) fn router(package_root: Option<&Path>) -> Router {
    let component =
        package_root.and_then(|root| Some((read(root, JS, JS_SHA)?, read(root, CSS, CSS_SHA)?)));
    let html = include_str!("../ui/foundry-artist-index.html");
    let html = if component.is_some() {
        std::borrow::Cow::Owned(html.replacen(
            "data-concept-ready=\"no\"",
            "data-concept-ready=\"yes\"",
            1,
        ))
    } else {
        std::borrow::Cow::Borrowed(html)
    };
    let html = axum::body::Bytes::from(html.into_owned());
    let app = Router::new()
        .route(
            "/migration/foundry-artists",
            get(
                move || async move { ([(header::CONTENT_TYPE, "text/html; charset=utf-8")], html) },
            ),
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
        );
    let Some((js, css)) = component else {
        return app;
    };
    let js = axum::body::Bytes::from(js);
    let css = axum::body::Bytes::from(css);
    app.route(
        "/migration/foundry-artists/concept.mjs",
        get(move || async move {
            (
                [
                    (header::CONTENT_TYPE, "text/javascript; charset=utf-8"),
                    (header::X_CONTENT_TYPE_OPTIONS, "nosniff"),
                ],
                js,
            )
        }),
    )
    .route(
        "/migration/foundry-artists/concept.css",
        get(move || async move {
            (
                [
                    (header::CONTENT_TYPE, "text/css; charset=utf-8"),
                    (header::X_CONTENT_TYPE_OPTIONS, "nosniff"),
                ],
                css,
            )
        }),
    )
}
