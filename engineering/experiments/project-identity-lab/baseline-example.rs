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
    println!("{}",serde_json::to_string_pretty(&serde_json::json!({"mode":"offline generated fixtures; no provider requests","cases":cases})).unwrap());
}
