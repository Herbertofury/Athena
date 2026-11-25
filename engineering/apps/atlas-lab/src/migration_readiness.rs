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
                let referenced_commit = source["commit"].as_str().unwrap_or(pin);
                assert_eq!(referenced_commit.len(), 40);
                assert!(
                    referenced_commit
                        .bytes()
                        .all(|byte| byte.is_ascii_hexdigit())
                );
                let url = source["url"].as_str().unwrap();
                assert!(url.starts_with(&format!(
                    "https://github.com/Herbertofury/Athena/blob/{referenced_commit}/"
                )));
                assert!(!url.contains(".."));
            }
        }
    }
    #[test]
    fn foundry_followups_keep_history_and_retirement_gates_distinct() {
        let snapshot: serde_json::Value = serde_json::from_str(SNAPSHOT).unwrap();
        let foundry = snapshot["projects"]
            .as_array()
            .unwrap()
            .iter()
            .find(|row| row["id"] == "foundry")
            .unwrap();
        let gates = foundry["gates"].as_array().unwrap();
        assert_eq!(gates[0]["label"], "Preserved audit");
        assert_eq!(gates[1]["state"], "recorded");
        assert!(gates[1]["detail"].as_str().unwrap().contains("All six"));
        assert_eq!(gates[2]["state"], "recorded");
        assert!(gates[2]["detail"].as_str().unwrap().contains("15 commits"));
        assert_eq!(gates[3]["state"], "open");
        assert_eq!(gates[4]["state"], "open");
        let evidence = foundry["evidence"].as_array().unwrap();
        assert_eq!(evidence.len(), 4);
        assert!(evidence[0]["commit"].is_null());
        assert_eq!(
            evidence[2]["commit"],
            "64954a16f8af349c27a2652649882d4ec0e3450a"
        );
        assert_eq!(evidence[3]["commit"], evidence[2]["commit"]);
        assert!(!SNAPSHOT.contains("libfile_"));
    }
}
