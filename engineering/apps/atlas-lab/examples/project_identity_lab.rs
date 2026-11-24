//! Offline generated identity-confusion reproducer, not a network or performance test.
use atlas_lab::{modrinth::parse_project, snapshots::SnapshotStore};
use std::path::Path;
fn main() {
    let body = br#"{"id":"AANobbMI","slug":"sodium","title":"Generated fixture","description":"Identity test","body":"Complete typed text","project_type":"mod","versions":["version-a"],"gallery":[]}"#;
    let project = parse_project(body).unwrap();
    let mut cases = Vec::new();
    for (requested, expected) in [
        ("AANobbMI", true),
        ("sodium", true),
        ("SODIUM", true),
        ("othermod", false),
        ("ZZZZZZZZ", false),
        ("aanobbmi", false),
    ] {
        let mut store = SnapshotStore::open(Path::new(":memory:")).unwrap();
        let accepted = store.save_modrinth(requested, &project).is_ok();
        cases.push(serde_json::json!({"requested":requested,"expected_accepted":expected,"accepted":accepted,"attempts":store.attempts().unwrap(),"stored":store.latest_modrinth("AANobbMI").unwrap().is_some()}));
    }
    let mut retained = Vec::new();
    for path in std::env::args().skip(1) {
        let bytes = std::fs::read(path).unwrap();
        let baseline = parse_project(&bytes).unwrap();
        let mut checks = 0;
        for requested in [
            &baseline.id,
            &baseline.slug,
            &baseline.slug.to_ascii_uppercase(),
        ] {
            let bound = atlas_lab::modrinth::parse_requested_project(&bytes, requested).unwrap();
            assert_eq!(
                serde_json::to_value(&baseline).unwrap(),
                serde_json::to_value(&bound).unwrap()
            );
            let mut store = SnapshotStore::open(Path::new(":memory:")).unwrap();
            store.save_modrinth(requested, &bound).unwrap();
            assert_eq!(
                serde_json::to_value(store.latest_modrinth(&bound.id).unwrap().unwrap()).unwrap(),
                serde_json::to_value(&baseline).unwrap()
            );
            checks += 1;
        }
        retained.push(serde_json::json!({"id":baseline.id,"payload_sha256":atlas_lab::build_identity::sha256_hex(&bytes),"complete_existing_projection_equal":true,"request_forms_checked":checks,"scope":"retained public bytes; in-memory snapshot roundtrip, not new live collection or power-loss test"}));
    }
    println!("{}",serde_json::to_string_pretty(&serde_json::json!({"mode":"offline generated fixtures; no provider requests","cases":cases,"retained_public":retained})).unwrap());
}
