use super::*;
use std::{
    fs,
    os::unix::fs::{DirBuilderExt, PermissionsExt, symlink},
    path::PathBuf,
};
const RAW: &str = " \n{\"unknown\":18446744073709551617,\"duplicate\":1,\"duplicate\":2,\"unicode\":\"雪\",\"number\":-0} \n";
fn directory() -> PathBuf {
    let mut random = [0u8; 16];
    getrandom::fill(&mut random).unwrap();
    let name = random
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect::<String>();
    let path = std::env::temp_dir().join(format!("foundry-snapshot-synthetic-{name}"));
    fs::DirBuilder::new().mode(0o700).create(&path).unwrap();
    path
}
fn entries(path: &Path) -> Vec<String> {
    let mut names = fs::read_dir(path)
        .unwrap()
        .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
        .collect::<Vec<_>>();
    names.sort();
    names
}
#[test]
fn snapshot_absent_exact_roundtrip_overwrite_and_reopen() {
    let path = directory();
    let store = FoundrySnapshotStore::open(&path).unwrap();
    assert_eq!(store.load_world_snapshot().unwrap(), None);
    let receipt = store.save_world_snapshot(RAW).unwrap();
    assert_eq!(
        receipt,
        SnapshotReceipt {
            filename: SNAPSHOT_FILENAME,
            bytes: RAW.len(),
            directory_synced: true
        }
    );
    assert_eq!(store.load_world_snapshot().unwrap().as_deref(), Some(RAW));
    assert_eq!(
        fs::read(path.join(SNAPSHOT_FILENAME)).unwrap(),
        RAW.as_bytes()
    );
    drop(store);
    let reopened = FoundrySnapshotStore::open(&path).unwrap();
    assert_eq!(
        reopened.load_world_snapshot().unwrap().as_deref(),
        Some(RAW)
    );
    for raw in [
        "null",
        " [1, true, \"雪\"] \n",
        "18446744073709551617",
        "{\"new\":true}",
    ] {
        reopened.save_world_snapshot(raw).unwrap();
        assert_eq!(
            reopened.load_world_snapshot().unwrap().as_deref(),
            Some(raw)
        );
    }
    assert_eq!(entries(&path), vec![SNAPSHOT_FILENAME]);
    assert_eq!(
        fs::metadata(path.join(SNAPSHOT_FILENAME))
            .unwrap()
            .permissions()
            .mode()
            & 0o777,
        0o600
    );
}
#[test]
fn snapshot_invalid_and_oversize_preserve_last_good() {
    let path = directory();
    let store = FoundrySnapshotStore::open(&path).unwrap();
    store.save_world_snapshot(RAW).unwrap();
    for raw in ["", "{", "null null", "NaN", "\u{feff}{}"] {
        assert!(store.save_world_snapshot(raw).is_err());
        assert_eq!(store.load_world_snapshot().unwrap().as_deref(), Some(RAW));
    }
    let oversized = format!("\"{}\"", "x".repeat(MAX_SNAPSHOT_BYTES - 1));
    assert!(store.save_world_snapshot(&oversized).is_err());
    assert_eq!(store.load_world_snapshot().unwrap().as_deref(), Some(RAW));
    assert_eq!(entries(&path), vec![SNAPSHOT_FILENAME]);
}
#[test]
fn snapshot_exact_size_boundary_roundtrips() {
    let path = directory();
    let store = FoundrySnapshotStore::open(&path).unwrap();
    let boundary = format!("\"{}\"", "x".repeat(MAX_SNAPSHOT_BYTES - 2));
    assert_eq!(boundary.len(), MAX_SNAPSHOT_BYTES);
    store.save_world_snapshot(&boundary).unwrap();
    assert_eq!(store.load_world_snapshot().unwrap().unwrap(), boundary);
}
#[test]
fn snapshot_load_rejects_invalid_utf8_json_and_oversize_file() {
    let path = directory();
    let store = FoundrySnapshotStore::open(&path).unwrap();
    let target = path.join(SNAPSHOT_FILENAME);
    fs::write(&target, [0xff]).unwrap();
    assert!(store.load_world_snapshot().is_err());
    fs::write(&target, b"not JSON").unwrap();
    assert!(store.load_world_snapshot().is_err());
    File::create(&target)
        .unwrap()
        .set_len((MAX_SNAPSHOT_BYTES + 1) as u64)
        .unwrap();
    assert!(store.load_world_snapshot().is_err());
}
#[test]
fn snapshot_fixed_file_symlinks_are_never_followed_or_replaced() {
    for dangling in [false, true] {
        let path = directory();
        let elsewhere = directory();
        let outside = elsewhere.join("outside.json");
        if !dangling {
            fs::write(&outside, RAW).unwrap();
        }
        symlink(&outside, path.join(SNAPSHOT_FILENAME)).unwrap();
        let store = FoundrySnapshotStore::open(&path).unwrap();
        assert!(store.load_world_snapshot().is_err());
        assert!(store.save_world_snapshot("{}").is_err());
        assert!(
            fs::symlink_metadata(path.join(SNAPSHOT_FILENAME))
                .unwrap()
                .is_symlink()
        );
        if dangling {
            assert!(!outside.exists());
        } else {
            assert_eq!(fs::read_to_string(outside).unwrap(), RAW);
        }
        assert_eq!(entries(&path), vec![SNAPSHOT_FILENAME]);
    }
}
#[test]
fn snapshot_hardlink_directory_and_fifo_collisions_fail_closed() {
    let path = directory();
    let outside = directory().join("outside.json");
    fs::write(&outside, RAW).unwrap();
    fs::hard_link(&outside, path.join(SNAPSHOT_FILENAME)).unwrap();
    let store = FoundrySnapshotStore::open(&path).unwrap();
    assert!(store.load_world_snapshot().is_err());
    assert!(store.save_world_snapshot("{}").is_err());
    assert_eq!(fs::read_to_string(&outside).unwrap(), RAW);
    let path = directory();
    fs::create_dir(path.join(SNAPSHOT_FILENAME)).unwrap();
    let store = FoundrySnapshotStore::open(&path).unwrap();
    assert!(store.load_world_snapshot().is_err());
    assert!(store.save_world_snapshot("{}").is_err());
    let path = directory();
    let fifo = CString::new(path.join(SNAPSHOT_FILENAME).as_os_str().as_bytes()).unwrap();
    // SAFETY: test-only NUL-terminated synthetic filename with ordinary permissions.
    assert_eq!(unsafe { libc::mkfifo(fifo.as_ptr(), 0o600) }, 0);
    let store = FoundrySnapshotStore::open(&path).unwrap();
    assert!(store.load_world_snapshot().is_err());
    assert!(store.save_world_snapshot("{}").is_err());
}
#[test]
fn snapshot_directory_open_rejects_symlink_components_and_untrusted_permissions() {
    let parent = directory();
    let real = directory();
    symlink(&real, parent.join("linked")).unwrap();
    assert!(FoundrySnapshotStore::open(&parent.join("linked")).is_err());
    fs::DirBuilder::new()
        .mode(0o700)
        .create(real.join("nested"))
        .unwrap();
    assert!(FoundrySnapshotStore::open(&parent.join("linked/nested")).is_err());
    assert!(FoundrySnapshotStore::open(Path::new("relative")).is_err());
    assert!(FoundrySnapshotStore::open(Path::new("/")).is_err());
    assert!(FoundrySnapshotStore::open(&parent.join("missing")).is_err());
    fs::set_permissions(&real, fs::Permissions::from_mode(0o777)).unwrap();
    assert!(FoundrySnapshotStore::open(&real).is_err());
    assert!(!parent.join("missing").exists());
}
#[test]
fn snapshot_open_handle_remains_anchored_after_parent_path_is_replaced() {
    let parent = directory();
    let path = parent.join("original");
    fs::DirBuilder::new().mode(0o700).create(&path).unwrap();
    let store = FoundrySnapshotStore::open(&path).unwrap();
    store.save_world_snapshot(RAW).unwrap();
    let moved = parent.join("moved");
    fs::rename(&path, &moved).unwrap();
    let outside = directory();
    fs::write(outside.join(SNAPSHOT_FILENAME), "null").unwrap();
    symlink(&outside, &path).unwrap();
    assert_eq!(store.load_world_snapshot().unwrap().as_deref(), Some(RAW));
    store.save_world_snapshot("[1]").unwrap();
    assert_eq!(
        fs::read_to_string(moved.join(SNAPSHOT_FILENAME)).unwrap(),
        "[1]"
    );
    assert_eq!(
        fs::read_to_string(outside.join(SNAPSHOT_FILENAME)).unwrap(),
        "null"
    );
    assert!(FoundrySnapshotStore::open(&path).is_err());
}
#[test]
fn snapshot_private_directory_contract_is_rechecked_per_operation() {
    let path = directory();
    let store = FoundrySnapshotStore::open(&path).unwrap();
    store.save_world_snapshot(RAW).unwrap();
    fs::set_permissions(&path, fs::Permissions::from_mode(0o777)).unwrap();
    assert!(store.save_world_snapshot("{}").is_err());
    assert!(store.load_world_snapshot().is_err());
    assert_eq!(
        fs::read_to_string(path.join(SNAPSHOT_FILENAME)).unwrap(),
        RAW
    );
}
#[test]
fn snapshot_partial_write_and_precommit_failure_keep_last_good_and_cleanup() {
    let path = directory();
    let store = FoundrySnapshotStore::open(&path).unwrap();
    store.save_world_snapshot(RAW).unwrap();
    let e = save_impl(
        &store.directory,
        "{}",
        |f| {
            f.write_all(b"partial")?;
            Err(io::Error::other("synthetic write failure"))
        },
        || Ok(()),
        |d| d.sync_all(),
    );
    assert!(e.is_err());
    assert_eq!(store.load_world_snapshot().unwrap().as_deref(), Some(RAW));
    assert_eq!(entries(&path), vec![SNAPSHOT_FILENAME]);
    let e = save_impl(
        &store.directory,
        "{}",
        |_| Ok(()),
        || Err(io::Error::other("synthetic pre-replace failure")),
        |d| d.sync_all(),
    );
    assert!(e.is_err());
    assert_eq!(store.load_world_snapshot().unwrap().as_deref(), Some(RAW));
    assert_eq!(entries(&path), vec![SNAPSHOT_FILENAME]);
}
#[test]
fn snapshot_postcommit_directory_sync_failure_is_an_honest_receipt() {
    let path = directory();
    let store = FoundrySnapshotStore::open(&path).unwrap();
    store.save_world_snapshot(RAW).unwrap();
    let result = save_impl(
        &store.directory,
        "{}",
        |_| Ok(()),
        || Ok(()),
        |_| Err(io::Error::other("synthetic directory sync failure")),
    )
    .unwrap();
    assert!(!result.directory_synced);
    assert_eq!(result.bytes, 2);
    assert_eq!(store.load_world_snapshot().unwrap().as_deref(), Some("{}"));
}
#[test]
fn snapshot_changed_staging_identity_is_rejected_before_commit() {
    let path = directory();
    let store = FoundrySnapshotStore::open(&path).unwrap();
    store.save_world_snapshot(RAW).unwrap();
    let result = save_impl(
        &store.directory,
        "{}",
        |_| Ok(()),
        || {
            let name = entries(&path)
                .into_iter()
                .find(|n| n.ends_with(".tmp"))
                .unwrap();
            fs::rename(path.join(&name), path.join("preserved-staging"))?;
            fs::write(path.join(name), "null")?;
            Ok(())
        },
        |d| d.sync_all(),
    );
    assert!(result.is_err());
    assert_eq!(store.load_world_snapshot().unwrap().as_deref(), Some(RAW));
}
#[test]
fn snapshot_independent_handle_contention_fails_fast_and_recovers() {
    let path = directory();
    let first = FoundrySnapshotStore::open(&path).unwrap();
    let second = FoundrySnapshotStore::open(&path).unwrap();
    let lock = Lock::acquire(&first.directory, libc::LOCK_EX).unwrap();
    assert!(second.save_world_snapshot("{}").is_err());
    assert!(second.load_world_snapshot().is_err());
    drop(lock);
    second.save_world_snapshot(RAW).unwrap();
    assert_eq!(first.load_world_snapshot().unwrap().as_deref(), Some(RAW));
}
#[test]
fn snapshot_shared_instance_serializes_threaded_replacements() {
    let path = directory();
    let store = std::sync::Arc::new(FoundrySnapshotStore::open(&path).unwrap());
    store.save_world_snapshot(RAW).unwrap();
    let mut threads = Vec::new();
    for i in 0..8 {
        let store = store.clone();
        threads.push(std::thread::spawn(move || {
            for _ in 0..10 {
                store
                    .save_world_snapshot(&format!("{{\"writer\":{i}}}"))
                    .unwrap();
                let result = store.load_world_snapshot().unwrap().unwrap();
                serde_json::from_str::<serde_json::Value>(&result).unwrap();
            }
        }));
    }
    for thread in threads {
        thread.join().unwrap();
    }
    assert_eq!(entries(&path), vec![SNAPSHOT_FILENAME]);
}
