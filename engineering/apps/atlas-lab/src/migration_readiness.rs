//! Offline provenance snapshot and native workspace routing, never retirement authority.
use axum::{
    Router,
    http::{StatusCode, header},
    response::{Html, IntoResponse, Response},
    routing::get,
};
const SNAPSHOT: &str = include_str!("../ui/migration-readiness.json");
// The same committed bytes as the Atlas source pin in the snapshot, not a regenerated report.
const ATLAS_RECEIPT: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../../migration/engineering-atlas/retirement-2026-11-14/verification.json"
));
const ATLAS_PIN: &str = "12ebe1e06707bdc1febd3369a43221e62c332f78";
const ATLAS_SHA256: &str = "a5194e060d9b7697ebe808073c6cc24582d4e9ab2ae5c7700c78fb460b8ca830";

fn atlas_receipt(content: &'static str) -> Response {
    if crate::build_identity::sha256_hex(content.as_bytes()) != ATLAS_SHA256 {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            "Pinned Atlas recovery receipt not verified.",
        )
            .into_response();
    }
    (
        [
            (header::CONTENT_TYPE, "application/json"),
            (header::CACHE_CONTROL, "no-store"),
            (
                header::HeaderName::from_static("x-athena-source-commit"),
                ATLAS_PIN,
            ),
            (
                header::HeaderName::from_static("x-athena-source-sha256"),
                ATLAS_SHA256,
            ),
        ],
        content,
    )
        .into_response()
}

pub fn router() -> Router {
    Router::new()
        .route(
            "/migration",
            get(|| async { Html(include_str!("../ui/migration-readiness.html")) }),
        )
        .route(
            "/migration/app.js",
            get(|| async {
                (
                    [(header::CONTENT_TYPE, "text/javascript")],
                    include_str!("../ui/migration-readiness.js"),
                )
                    .into_response()
            }),
        )
        .route(
            "/migration/atlas-historical-receipt.json",
            get(|| async { atlas_receipt(ATLAS_RECEIPT) }),
        )
        .route(
            "/api/migration/readiness",
            get(|| async {
                (
                    [
                        (header::CONTENT_TYPE, "application/json"),
                        (
                            header::HeaderName::from_static("x-athena-snapshot-sha256"),
                            &crate::build_identity::sha256_hex(SNAPSHOT.as_bytes()),
                        ),
                    ],
                    SNAPSHOT,
                )
                    .into_response()
            }),
        )
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn snapshot_is_dated_source_pinned_and_never_deletion_authority() {
        let value: serde_json::Value = serde_json::from_str(SNAPSHOT).unwrap();
        assert_eq!(value["schema"], 1);
        assert_eq!(value["retirement_certified"], false);
        assert_eq!(value["snapshot_date"], "2026-11-15");
        let pin = value["source_snapshot_commit"].as_str().unwrap();
        assert_eq!(pin.len(), 40);
        let rows = value["projects"].as_array().unwrap();
        assert_eq!(rows.len(), 4);
        let mut ids = std::collections::HashSet::new();
        for row in rows {
            assert!(ids.insert(row["id"].as_str().unwrap()));
            assert!(matches!(
                row["workspace"].as_str().unwrap(),
                "/#lab" | "/#build" | "/#continuity" | "/#guidance"
            ));
            assert!(row["native_entry"].is_null() || row["native_entry"] == "/learning");
            assert!(
                row["gates"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .any(|g| g["state"] == "open")
            );
            for gate in row["gates"].as_array().unwrap() {
                assert!(matches!(
                    gate["state"].as_str().unwrap(),
                    "recorded" | "open"
                ));
            }
            for source in row["evidence"].as_array().unwrap() {
                let url = source["url"].as_str().unwrap();
                assert!(url.starts_with(&format!(
                    "https://github.com/Herbertofury/Athena/blob/{pin}/"
                )));
                assert!(!url.contains(".."));
            }
        }
    }
    #[test]
    fn offline_atlas_receipt_serves_exact_pinned_bytes_only() {
        let snapshot: serde_json::Value = serde_json::from_str(SNAPSHOT).unwrap();
        assert_eq!(snapshot["source_snapshot_commit"], ATLAS_PIN);
        assert_eq!(
            snapshot["projects"][0]["evidence"][0]["url"],
            format!(
                "https://github.com/Herbertofury/Athena/blob/{ATLAS_PIN}/migration/engineering-atlas/retirement-2026-11-14/verification.json"
            )
        );

        let response = atlas_receipt(ATLAS_RECEIPT);
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(response.headers()["x-athena-source-commit"], ATLAS_PIN);
        assert_eq!(response.headers()["x-athena-source-sha256"], ATLAS_SHA256);
        let runtime = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        let body = runtime
            .block_on(axum::body::to_bytes(response.into_body(), 1024))
            .unwrap();
        assert_eq!(&body[..], ATLAS_RECEIPT.as_bytes());
        assert_eq!(atlas_receipt("{}").status(), StatusCode::SERVICE_UNAVAILABLE);
    }
}
