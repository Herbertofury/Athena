//! Offline provenance snapshot and native workspace routing, never retirement authority.
use axum::{
    Router,
    http::header,
    response::{Html, IntoResponse},
    routing::get,
};
const SNAPSHOT: &str = include_str!("../ui/migration-readiness.json");
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
        assert_eq!(value["snapshot_date"], "2026-11-27");
        let pin = value["source_snapshot_commit"].as_str().unwrap();
        assert_eq!(pin.len(), 40);
        let rows = value["projects"].as_array().unwrap();
        assert_eq!(rows.len(), 4);
        let atlas = &rows[0];
        assert!(
            atlas["gates"]
                .as_array()
                .unwrap()
                .iter()
                .any(|g| { g["state"] == "recorded" && g["label"] == "Wiki cutover validation" })
        );
        let foundry = &rows[1];
        assert!(foundry["gates"].as_array().unwrap().iter().any(|g| {
            g["state"] == "recorded" && g["label"] == "Windows and Linux checkpoint and fork"
        }));
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
}
