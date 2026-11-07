//! Complete project archival coordinator. Fetching is supplied by the fixed public
//! client in the worker; no URL, credentials or executable are accepted from jobs.
use crate::{modrinth::ProjectRecord, snapshots::SnapshotStore};
use std::path::Path;
pub fn collect(
    path: &Path,
    requested: &str,
    fetch: impl FnOnce() -> Result<ProjectRecord, Box<dyn std::error::Error>>,
) -> Result<serde_json::Value, &'static str> {
    crate::modrinth::project_url(requested).map_err(|_| "Invalid project ID or slug")?;
    let mut store = SnapshotStore::open(path)
        .map_err(|_| "Project archive database could not be opened; no request made")?;
    let record = match fetch() {
        Ok(record) => record,
        Err(error) => {
            store.record_project_raw_failure(requested).map_err(|_|"Collection failed and failure history could not be committed; previous snapshots retained")?;
            return Err(crate::collection_failure::safe_message(error.as_ref()));
        }
    };
    let generation = match store.save_modrinth_project_record(requested, &record) {
        Ok(generation) => generation,
        Err(_) => {
            store.record_project_raw_failure(requested).map_err(|_|"Archive not saved and failure history could not be committed; previous snapshots retained")?;
            return Err(
                "Project archive response or storage rejected; previous snapshots retained",
            );
        }
    };
    Ok(
        serde_json::json!({"schema_version":1,"canonical_id":record.project().id,"generation":generation.to_string(),"payload_bytes":record.raw_json().len(),"payload_sha256":crate::build_identity::sha256_hex(record.raw_json().as_bytes()),"coordinator_sha256":crate::build_identity::sha256_hex(include_bytes!("project_archive.rs")),"status":"complete_received_response","scope":"Receipt only; complete received public project JSON stays in local snapshots. No linked-media fetch, account access or complete-platform claim."}),
    )
}
#[cfg(test)]
mod tests {
    use super::*;
    struct Scratch(std::path::PathBuf);
    impl Scratch {
        fn new() -> Self {
            let path = std::env::temp_dir().join(format!(
                "atlas-raw-queue-{}-{}.sqlite",
                std::process::id(),
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_nanos()
            ));
            std::fs::OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&path)
                .unwrap();
            Self(path)
        }
    }
    impl Drop for Scratch {
        fn drop(&mut self) {
            let _ = std::fs::remove_file(&self.0);
        }
    }
    fn body() -> Vec<u8> {
        br#" {"id":"AANobbMI","slug":"sodium","title":"Generated fixture","description":"fixture","project_type":"mod","versions":[],"future":{"exact":18446744073709551617,"nullable":null}} "#.to_vec()
    }
    #[test]
    fn complete_bytes_stay_local_and_output_is_only_a_bound_receipt() {
        let scratch = Scratch::new();
        let bytes = body();
        let receipt = collect(&scratch.0, "SODIUM", || {
            crate::modrinth::parse_project_record(&bytes, "sodium")
        })
        .unwrap();
        assert_eq!(receipt["canonical_id"], "AANobbMI");
        assert!(receipt["generation"].is_string());
        assert_eq!(
            receipt["payload_sha256"],
            crate::build_identity::sha256_hex(&bytes)
        );
        assert!(serde_json::to_vec(&receipt).unwrap().len() < 2048);
        assert!(receipt.get("payload").is_none());
        let store = SnapshotStore::open(&scratch.0).unwrap();
        assert_eq!(
            store
                .latest_modrinth_project_record("AANobbMI")
                .unwrap()
                .unwrap()
                .raw_json()
                .as_bytes(),
            bytes
        );
    }
    #[test]
    fn transport_and_mismatched_record_failures_keep_last_good_without_secret_details() {
        let scratch = Scratch::new();
        let bytes = body();
        collect(&scratch.0, "sodium", || {
            crate::modrinth::parse_project_record(&bytes, "sodium")
        })
        .unwrap();
        let error = collect(&scratch.0, "sodium", || {
            Err("https://example.invalid/?token=DO_NOT_DISCLOSE".into())
        })
        .unwrap_err();
        assert!(!error.contains("DO_NOT_DISCLOSE"));
        let other = String::from_utf8(bytes.clone())
            .unwrap()
            .replace("AANobbMI", "ZZZZZZZZ")
            .replace("sodium", "other");
        assert!(
            collect(&scratch.0, "sodium", || {
                crate::modrinth::parse_project_record(other.as_bytes(), "other")
            })
            .is_err()
        );
        let store = SnapshotStore::open(&scratch.0).unwrap();
        assert_eq!(store.attempts().unwrap(), 3);
        assert_eq!(
            store
                .latest_modrinth_project_record("AANobbMI")
                .unwrap()
                .unwrap()
                .raw_json()
                .as_bytes(),
            bytes
        );
        assert!(
            store
                .latest_modrinth_project_record("ZZZZZZZZ")
                .unwrap()
                .is_none()
        );
    }
    #[test]
    fn invalid_input_cannot_reach_fetch() {
        let scratch = Scratch::new();
        let called = std::cell::Cell::new(false);
        assert!(
            collect(&scratch.0, "https://example.invalid/", || {
                called.set(true);
                Err("must not run".into())
            })
            .is_err()
        );
        assert!(!called.get());
        assert_eq!(
            SnapshotStore::open(&scratch.0).unwrap().attempts().unwrap(),
            0
        );
    }
}
