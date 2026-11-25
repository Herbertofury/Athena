//! A read-only index over two independently preserved, public workflow snapshots.
use axum::{
    Router,
    http::{StatusCode, header},
    response::{Html, IntoResponse, Response},
    routing::get,
};
use serde::{Deserialize, Serialize};
use std::{collections::BTreeMap, sync::LazyLock};

const EARLY: &str = include_str!("../../../../migration/engineering-atlas/workflow-runs.json");
const LATER: &str = include_str!(
    "../../../../migration/engineering-atlas/retirement-2026-11-14/workflow-summary.json"
);
const PUBLIC_PIN: &str = "7d335a740ea92a66674bf4412c48f5e03faf6e9f";
const MAX_SAFE_ID: u64 = (1 << 53) - 1;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
struct Reading {
    status: String,
    conclusion: Option<String>,
}
#[derive(Deserialize)]
struct ArchivedRun {
    id: u64,
    head_sha: String,
    name: String,
    created_at: String,
    #[serde(default)]
    head_branch: Option<String>,
    #[serde(default)]
    updated_at: Option<String>,
    #[serde(default)]
    event: Option<String>,
    #[serde(flatten)]
    reading: Reading,
}
#[derive(Serialize)]
struct Run {
    id: u64,
    head_sha: String,
    name: String,
    created_at: String,
    branch: Option<String>,
    event: Option<String>,
    early_updated_at: Option<String>,
    early: Option<Reading>,
    later: Option<Reading>,
}
#[derive(Serialize)]
struct Snapshot {
    date: &'static str,
    rows: usize,
    sha256: String,
    source: String,
}
#[derive(Serialize)]
struct Ledger {
    schema: &'static str,
    early: Snapshot,
    later: Snapshot,
    runs: Vec<Run>,
    repeated_ids: usize,
    changed_readings: usize,
}

fn snapshots(older: &str, newer: &str) -> Result<(Vec<Run>, usize, usize), &'static str> {
    let mut runs = BTreeMap::<u64, Run>::new();
    for (early, input) in [(true, older), (false, newer)] {
        let rows: Vec<ArchivedRun> =
            serde_json::from_str(input).map_err(|_| "Invalid ledger snapshot")?;
        for observed in rows {
            if !(1..=MAX_SAFE_ID).contains(&observed.id)
                || observed.head_sha.len() != 40
                || !observed
                    .head_sha
                    .bytes()
                    .all(|c| c.is_ascii_digit() || (b'a'..=b'f').contains(&c))
                || observed.name.is_empty()
                || observed.created_at.is_empty()
                || match observed.reading.status.as_str() {
                    "in_progress" => observed.reading.conclusion.is_some(),
                    "completed" => !matches!(
                        observed.reading.conclusion.as_deref(),
                        Some("success" | "failure" | "cancelled")
                    ),
                    _ => true,
                }
            {
                return Err("Unsupported archive record");
            }
            use std::collections::btree_map::Entry;
            let row = match runs.entry(observed.id) {
                Entry::Vacant(entry) => entry.insert(Run {
                    id: observed.id,
                    head_sha: observed.head_sha,
                    name: observed.name,
                    created_at: observed.created_at,
                    branch: observed.head_branch,
                    event: observed.event,
                    early_updated_at: observed.updated_at,
                    early: None,
                    later: None,
                }),
                Entry::Occupied(entry) => {
                    let saved = entry.into_mut();
                    if saved.head_sha != observed.head_sha
                        || saved.name != observed.name
                        || saved.created_at != observed.created_at
                    {
                        return Err("Archived run identity disagrees across snapshots");
                    }
                    saved
                }
            };
            let dest = if early {
                &mut row.early
            } else {
                &mut row.later
            };
            if dest.replace(observed.reading).is_some() {
                return Err("Duplicate run ID in a snapshot");
            }
        }
    }
    let repeated = runs
        .values()
        .filter(|r| r.early.is_some() && r.later.is_some())
        .count();
    let changed = runs
        .values()
        .filter(|r| matches!((&r.early,&r.later),(Some(a),Some(b)) if a!=b))
        .count();
    Ok((runs.into_values().rev().collect(), repeated, changed))
}

fn collect() -> Result<String, &'static str> {
    if crate::build_identity::sha256_hex(EARLY.as_bytes())
        != "5e19fabe50551bb3bcf7f122f5eee9d3c0326c0ec230c6858e0605a128726f65"
        || crate::build_identity::sha256_hex(LATER.as_bytes())
            != "b1321421c23f0600be368d997231786287e4173e9f483eeb191022d16ff72f05"
    {
        return Err("Embedded sources differ from exact published evidence");
    }
    let (runs, repeated_ids, changed_readings) = snapshots(EARLY, LATER)?;
    if (runs.len(), repeated_ids, changed_readings) != (522, 509, 2) {
        return Err("Archive counts differ from reviewed snapshots");
    }
    let snapshot = |date, rows, bytes: &str, path| Snapshot {
        date,
        rows,
        sha256: crate::build_identity::sha256_hex(bytes.as_bytes()),
        source: format!(
            "https://github.com/Herbertofury/Athena/blob/{PUBLIC_PIN}/migration/engineering-atlas/{path}"
        ),
    };
    serde_json::to_string(&Ledger {
        schema: "athena-engineering-atlas-historical-runs-v1",
        early: snapshot("2026-11-07", 509, EARLY, "workflow-runs.json"),
        later: snapshot(
            "2026-11-14",
            522,
            LATER,
            "retirement-2026-11-14/workflow-summary.json",
        ),
        runs,
        repeated_ids,
        changed_readings,
    })
    .map_err(|_| "Could not encode historical ledger")
}
static LEDGER: LazyLock<Result<String, &'static str>> = LazyLock::new(collect);

async fn data() -> Response {
    match &*LEDGER {
        Ok(json) => (
            [
                (header::CONTENT_TYPE, "application/json"),
                (header::X_CONTENT_TYPE_OPTIONS, "nosniff"),
            ],
            json.as_str(),
        )
            .into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

pub(crate) fn router() -> Router {
    Router::new()
        .route(
            "/migration/atlas-runs",
            get(|| async { Html(include_str!("../ui/atlas-run-ledger.html")) }),
        )
        .route(
            "/migration/atlas-runs/app.js",
            get(|| async {
                (
                    [(header::CONTENT_TYPE, "text/javascript")],
                    include_str!("../ui/atlas-run-ledger.js"),
                )
            }),
        )
        .route("/api/migration/atlas-runs", get(data))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn exact_bundled_records_preserve_failures_and_changed_observations() {
        let (rows, repeated, changed) = snapshots(EARLY, LATER).unwrap();
        assert_eq!((rows.len(), repeated, changed), (522, 509, 2));
        assert_eq!(
            rows.iter()
                .filter(
                    |x| x.later.as_ref().and_then(|x| x.conclusion.as_deref()) == Some("failure")
                )
                .count(),
            49
        );
        assert_eq!(rows.iter().filter(|x| x.early.is_none()).count(), 13);
        let conflict = EARLY.replace(
            "460965fe992f6f43af87de17331cbb94e2118a79",
            "660965fe992f6f43af87de17331cbb94e2118a79",
        );
        assert!(snapshots(&conflict, LATER).is_err());
        let mut duplicate: serde_json::Value = serde_json::from_str(EARLY).unwrap();
        let first = duplicate[0].clone();
        duplicate.as_array_mut().unwrap().push(first);
        assert!(snapshots(&duplicate.to_string(), LATER).is_err());
    }
}
