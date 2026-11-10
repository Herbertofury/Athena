//! Native Windows tests. Every mutable object is a fresh synthetic fixture.
//! A passing Linux binding check is not execution of these tests.
use super::*;
use std::{
    fs,
    path::PathBuf,
    process::{Command, Stdio},
    time::{Duration, Instant},
};
const RAW: &str = " \n{\"unknown\":18446744073709551617,\"duplicate\":1,\"duplicate\":2,\"unicode\":\"雪\",\"number\":-0} \n";
struct Fixture(PathBuf);
impl Fixture {
    fn new() -> Self {
        let mut random = [0u8; 16];
        getrandom::fill(&mut random).unwrap();
        let suffix = random
            .iter()
            .map(|b| format!("{b:02x}"))
            .collect::<String>();
        let path = std::env::temp_dir().join(format!("athena-snapshot-synthetic-{suffix}"));
        let user = User::current().unwrap();
        let sd = user.descriptor().unwrap();
        let attributes = SECURITY_ATTRIBUTES {
            nLength: size_of::<SECURITY_ATTRIBUTES>() as u32,
            lpSecurityDescriptor: sd.0,
            bInheritHandle: 0,
        };
        let name: Vec<u16> = path
            .to_str()
            .unwrap()
            .encode_utf16()
            .chain(Some(0))
            .collect();
        win(unsafe { CreateDirectoryW(name.as_ptr(), &attributes) }).unwrap();
        Self(path)
    }
    fn store(&self) -> Store {
        Store::open(&self.0).unwrap()
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}
fn create(store: &Store, name: &str, bytes: &[u8]) -> Handle {
    let user = User::current().unwrap();
    let sd = user.descriptor().unwrap();
    let h = open_at(
        store.directory.0,
        name,
        FILE_ALL_ACCESS,
        FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
        nt::FILE_CREATE,
        false,
        sd.0,
    )
    .unwrap();
    write_all(&h, bytes).unwrap();
    h
}
fn names(f: &Fixture) -> Vec<String> {
    let mut names = fs::read_dir(&f.0)
        .unwrap()
        .map(|e| e.unwrap().file_name().to_str().unwrap().to_owned())
        .collect::<Vec<_>>();
    names.sort();
    names
}
fn failure() -> Error {
    io::Error::other("synthetic injected precommit failure").into()
}
fn junction(link: &Path, target: &Path) {
    let output = Command::new("cmd.exe")
        .args(["/D", "/C", "mklink", "/J"])
        .arg(link)
        .arg(target)
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "synthetic junction setup failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );
}

#[test]
fn snapshot_windows_production_stays_disabled() {
    let f = Fixture::new();
    assert!(matches!(
        super::super::FoundrySnapshotStore::open(&f.0),
        Err(Error::UnsupportedPlatform)
    ));
}
#[test]
fn snapshot_windows_exact_roundtrip_overwrite_reopen() {
    let f = Fixture::new();
    let store = f.store();
    assert_eq!(store.load().unwrap(), None);
    let receipt = store.save(RAW).unwrap();
    assert!(!receipt.directory_synced);
    assert_eq!(receipt.bytes, RAW.len());
    assert_eq!(receipt.filename, SNAPSHOT_FILENAME);
    assert_eq!(
        fs::read(f.0.join(SNAPSHOT_FILENAME)).unwrap(),
        RAW.as_bytes()
    );
    assert_eq!(store.load().unwrap().as_deref(), Some(RAW));
    drop(store);
    let store = f.store();
    for text in [
        "null",
        " [1,true,\"雪\"] \n",
        "18446744073709551617",
        "{\"new\":true}",
    ] {
        store.save(text).unwrap();
        assert_eq!(store.load().unwrap().as_deref(), Some(text));
    }
    assert_eq!(names(&f), vec![LOCK_NAME, SNAPSHOT_FILENAME]);
}
#[test]
fn snapshot_windows_invalid_oversize_boundary_preserve_last_good() {
    let f = Fixture::new();
    let store = f.store();
    store.save(RAW).unwrap();
    for text in ["", "{", "null null", "NaN", "\u{feff}{}"] {
        assert!(store.save(text).is_err());
        assert_eq!(store.load().unwrap().as_deref(), Some(RAW));
    }
    let boundary = format!("\"{}\"", "x".repeat(MAX_SNAPSHOT_BYTES - 2));
    store.save(&boundary).unwrap();
    assert_eq!(store.load().unwrap().as_deref(), Some(boundary.as_str()));
    assert!(store.save(&(boundary.clone() + " ")).is_err());
    assert_eq!(store.load().unwrap().as_deref(), Some(boundary.as_str()));
}
#[test]
fn snapshot_windows_bounded_read_invalid_utf8_json_and_oversize() {
    for bytes in [
        vec![0xff],
        b"not JSON".to_vec(),
        vec![b' '; MAX_SNAPSHOT_BYTES + 1],
    ] {
        let f = Fixture::new();
        let store = f.store();
        drop(create(&store, SNAPSHOT_FILENAME, &bytes));
        assert!(store.load().is_err());
    }
}
#[test]
fn snapshot_windows_partial_write_and_precommit_failures() {
    let f = Fixture::new();
    let store = f.store();
    store.save(RAW).unwrap();
    assert!(
        store
            .save_impl(
                "null",
                |h| {
                    write_all(h, b"partial")?;
                    Err(failure())
                },
                || Ok(())
            )
            .is_err()
    );
    assert_eq!(store.load().unwrap().as_deref(), Some(RAW));
    assert!(
        store
            .save_impl("null", |_| Ok(()), || Err(failure()))
            .is_err()
    );
    assert_eq!(store.load().unwrap().as_deref(), Some(RAW));
    assert_eq!(names(&f), vec![LOCK_NAME, SNAPSHOT_FILENAME]);
}
#[test]
fn snapshot_windows_ambiguous_paths_rejected() {
    for path in [
        "",
        "relative",
        "C:relative",
        "C:\\",
        "\\\\server\\share\\dir",
        "\\\\?\\C:\\dir",
        "C:\\x\\..\\y",
        "C:\\x\\.\\y",
        "C:\\x\\",
        "C:\\x\\\\y",
        "C:\\x:stream",
        "C:\\x.",
        "C:\\x ",
        "C:/x",
        "C:\\NUL.txt",
        "C:\\COM1",
    ] {
        assert!(components(Path::new(path)).is_err(), "{path}");
    }
}
#[test]
fn snapshot_windows_directory_renamed_remains_anchored() {
    let f = Fixture::new();
    let store = f.store();
    store.save(RAW).unwrap();
    let renamed = f.0.with_extension("moved");
    fs::rename(&f.0, &renamed).unwrap();
    // Replacing the old pathname must not redirect an already-open store.
    fs::create_dir(&f.0).unwrap();
    store.save("null").unwrap();
    assert_eq!(store.load().unwrap().as_deref(), Some("null"));
    assert!(!f.0.join(SNAPSHOT_FILENAME).exists());
    assert_eq!(fs::read(renamed.join(SNAPSHOT_FILENAME)).unwrap(), b"null");
    drop(store);
    fs::remove_dir_all(renamed).unwrap();
}
#[test]
fn snapshot_windows_reparse_components_and_destination_rejected() {
    let outside = Fixture::new();
    let f = Fixture::new();
    let store = f.store();
    let nested = outside.0.join("sentinel");
    fs::write(&nested, b"untouched").unwrap();
    junction(&f.0.join("junction"), &outside.0);
    assert!(Store::open(&f.0.join("junction")).is_err());
    junction(&f.0.join(SNAPSHOT_FILENAME), &outside.0);
    assert!(store.load().is_err());
    assert!(store.save("null").is_err());
    assert_eq!(fs::read(&nested).unwrap(), b"untouched");
    fs::remove_dir(f.0.join(SNAPSHOT_FILENAME)).unwrap();
    fs::remove_dir(f.0.join("junction")).unwrap();
}
#[test]
fn snapshot_windows_rename_primitive_never_follows_destination_junction() {
    let outside = Fixture::new();
    let f = Fixture::new();
    let store = f.store();
    fs::write(outside.0.join("sentinel"), b"untouched").unwrap();
    junction(&f.0.join(SNAPSHOT_FILENAME), &outside.0);
    let h = create(&store, "synthetic-stage", b"null");
    // Models a collision arriving after the last check: either rename refuses
    // the directory collision or replaces that entry; it must not traverse it.
    let result = rename(&h, &store.directory, SNAPSHOT_FILENAME);
    assert_eq!(fs::read(outside.0.join("sentinel")).unwrap(), b"untouched");
    assert_eq!(fs::read_dir(&outside.0).unwrap().count(), 1);
    if result.is_err() {
        fs::remove_dir(f.0.join(SNAPSHOT_FILENAME)).unwrap();
    }
}
#[test]
fn snapshot_windows_hardlinks_snapshot_and_lock_rejected() {
    let f = Fixture::new();
    let store = f.store();
    store.save(RAW).unwrap();
    fs::hard_link(f.0.join(SNAPSHOT_FILENAME), f.0.join("alias")).unwrap();
    assert!(store.load().is_err());
    assert!(store.save("null").is_err());
    fs::remove_file(f.0.join("alias")).unwrap();
    drop(store);
    // Construct the bad lock before opening it; no-delete sharing can itself
    // prevent adding a hard link while the store holds the original handle.
    fs::hard_link(f.0.join(LOCK_NAME), f.0.join("lock-alias")).unwrap();
    assert!(Store::open(&f.0).is_err());
}
#[test]
fn snapshot_windows_lock_cannot_be_deleted_or_replaced_while_open() {
    let f = Fixture::new();
    let store = f.store();
    assert!(fs::remove_file(f.0.join(LOCK_NAME)).is_err());
    assert!(fs::rename(f.0.join(LOCK_NAME), f.0.join("renamed-lock")).is_err());
    let second = f.store();
    let guard = Lock::acquire(&store.lock, true).unwrap();
    assert!(second.load().is_err());
    assert!(second.save("null").is_err());
    drop(guard);
    second.save("null").unwrap();
}
#[test]
fn snapshot_windows_preexisting_lock_reparse_rejected() {
    let outside = Fixture::new();
    let f = Fixture::new();
    junction(&f.0.join(LOCK_NAME), &outside.0);
    assert!(Store::open(&f.0).is_err());
    assert_eq!(fs::read_dir(&outside.0).unwrap().count(), 0);
    fs::remove_dir(f.0.join(LOCK_NAME)).unwrap();
}
fn set_sddl(h: &Handle, sddl: &str, extra: u32) {
    let sddl: Vec<u16> = sddl.encode_utf16().chain(Some(0)).collect();
    let mut sd = null_mut();
    win(unsafe {
        ConvertStringSecurityDescriptorToSecurityDescriptorW(
            sddl.as_ptr(),
            SDDL_REVISION_1,
            &mut sd,
            null_mut(),
        )
    })
    .unwrap();
    let _sd = Local(sd);
    let mut acl = null_mut();
    let mut present = 0;
    let mut defaulted = 0;
    win(unsafe { GetSecurityDescriptorDacl(sd, &mut present, &mut acl, &mut defaulted) }).unwrap();
    let code = unsafe {
        SetSecurityInfo(
            h.0,
            SE_FILE_OBJECT,
            DACL_SECURITY_INFORMATION | extra,
            null_mut(),
            null_mut(),
            acl,
            null_mut(),
        )
    };
    assert_eq!(code, ERROR_SUCCESS);
}
#[test]
fn snapshot_windows_unprotected_null_group_and_inherited_acl_rejected() {
    for (sddl, extra) in [
        ("D:(A;;FA;;;WD)", UNPROTECTED_DACL_SECURITY_INFORMATION),
        ("D:P(A;;FA;;;WD)", PROTECTED_DACL_SECURITY_INFORMATION),
        ("D:P(A;OICI;FA;;;OW)", PROTECTED_DACL_SECURITY_INFORMATION),
        ("D:NO_ACCESS_CONTROL", PROTECTED_DACL_SECURITY_INFORMATION),
    ] {
        let f = Fixture::new();
        let store = f.store();
        let h = create(&store, SNAPSHOT_FILENAME, b"null");
        set_sddl(&h, sddl, extra);
        drop(h);
        assert!(store.load().is_err(), "{sddl}");
        assert!(store.save("true").is_err(), "{sddl}");
    }
}
#[test]
fn snapshot_windows_directory_acl_change_before_commit_preserves_good() {
    let f = Fixture::new();
    let store = f.store();
    store.save(RAW).unwrap();
    // Acquire WRITE_DAC only for this already-owned synthetic fixture.
    // Separate Win32 handle solely to mutate the synthetic fixture ACL.
    let path: Vec<u16> =
        f.0.to_str()
            .unwrap()
            .encode_utf16()
            .chain(Some(0))
            .collect();
    let h = unsafe {
        CreateFileW(
            path.as_ptr(),
            WRITE_DAC | READ_CONTROL,
            FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
            null(),
            OPEN_EXISTING,
            FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OPEN_REPARSE_POINT,
            null_mut(),
        )
    };
    assert_ne!(h, INVALID_HANDLE_VALUE);
    let h = Handle(h);
    assert!(
        store
            .save_impl(
                "null",
                |_| Ok(()),
                || {
                    set_sddl(&h, "D:P(A;;FA;;;WD)", PROTECTED_DACL_SECURITY_INFORMATION);
                    Ok(())
                }
            )
            .is_err()
    );
    assert_eq!(
        fs::read(f.0.join(SNAPSHOT_FILENAME)).unwrap(),
        RAW.as_bytes()
    );
}

// Actual child processes, not threads, prove contention and crash release.
const CHILD_TEST: &str = "foundry_snapshot::windows_experimental::tests::snapshot_windows_child";
#[test]
fn snapshot_windows_child() {
    let Some(path) = std::env::var_os("ATHENA_SYNTHETIC_SNAPSHOT_CHILD") else {
        return;
    };
    let store = Store::open(Path::new(&path)).unwrap();
    match std::env::var("ATHENA_SYNTHETIC_SNAPSHOT_MODE")
        .unwrap()
        .as_str()
    {
        "hold" => {
            let _guard = Lock::acquire(&store.lock, true).unwrap();
            fs::write(Path::new(&path).join("ready"), b"ready").unwrap();
            std::thread::sleep(Duration::from_secs(60));
        }
        "stage" => {
            store
                .save_impl(
                    "null",
                    |_| Ok(()),
                    || {
                        fs::write(Path::new(&path).join("ready"), b"ready")?;
                        std::thread::sleep(Duration::from_secs(60));
                        Ok(())
                    },
                )
                .unwrap();
        }
        "write" => {
            for i in 0..100 {
                let text = if i % 2 == 0 { "null" } else { RAW };
                let deadline = Instant::now() + Duration::from_secs(15);
                loop {
                    match store.save(text) {
                        Ok(_) => break,
                        Err(Error::Io(e))
                            if e.raw_os_error() == Some(ERROR_LOCK_VIOLATION as i32)
                                && Instant::now() < deadline =>
                        {
                            std::thread::sleep(Duration::from_millis(1))
                        }
                        Err(e) => panic!("child save: {e:?}"),
                    }
                }
            }
        }
        _ => panic!("Unknown synthetic child mode"),
    }
}
fn child(f: &Fixture, mode: &str) -> std::process::Child {
    Command::new(std::env::current_exe().unwrap())
        .args(["--exact", CHILD_TEST, "--nocapture"])
        .env("ATHENA_SYNTHETIC_SNAPSHOT_CHILD", &f.0)
        .env("ATHENA_SYNTHETIC_SNAPSHOT_MODE", mode)
        .stdin(Stdio::null())
        .spawn()
        .unwrap()
}
#[test]
fn snapshot_windows_process_contention_and_crash_release() {
    let f = Fixture::new();
    let store = f.store();
    store.save(RAW).unwrap();
    let mut child = child(&f, "hold");
    let deadline = Instant::now() + Duration::from_secs(15);
    while !f.0.join("ready").exists() {
        assert!(
            child.try_wait().unwrap().is_none(),
            "lock child exited before readiness"
        );
        if Instant::now() > deadline {
            let _ = child.kill();
            panic!("lock child timeout");
        }
        std::thread::sleep(Duration::from_millis(10));
    }
    assert!(store.save("null").is_err());
    assert!(store.load().is_err());
    child.kill().unwrap();
    child.wait().unwrap();
    assert_eq!(store.load().unwrap().as_deref(), Some(RAW));
    store.save("null").unwrap();
}
#[test]
fn snapshot_windows_process_readers_never_see_missing_or_partial() {
    let f = Fixture::new();
    let store = f.store();
    store.save(RAW).unwrap();
    let mut child = child(&f, "write");
    let deadline = Instant::now() + Duration::from_secs(30);
    let mut reads = 0;
    loop {
        match store.load() {
            Ok(Some(text)) => {
                assert!(text == RAW || text == "null");
                reads += 1;
            }
            Err(Error::Io(e)) if e.raw_os_error() == Some(ERROR_LOCK_VIOLATION as i32) => (),
            result => panic!("unexpected concurrent read: {result:?}"),
        }
        if let Some(status) = child.try_wait().unwrap() {
            assert!(status.success());
            break;
        }
        if Instant::now() > deadline {
            let _ = child.kill();
            panic!("writer child timeout");
        }
        std::thread::sleep(Duration::from_millis(1));
    }
    assert!(reads > 0);
}

fn file_symlink(link: &Path, target: &Path) {
    let link: Vec<u16> = link
        .to_str()
        .unwrap()
        .encode_utf16()
        .chain(Some(0))
        .collect();
    let target: Vec<u16> = target
        .to_str()
        .unwrap()
        .encode_utf16()
        .chain(Some(0))
        .collect();
    // No privilege changes. If this host cannot create the synthetic fixture,
    // fail visibly: it has not demonstrated file-symlink rejection acceptance.
    assert!(
        unsafe {
            CreateSymbolicLinkW(
                link.as_ptr(),
                target.as_ptr(),
                SYMBOLIC_LINK_FLAG_ALLOW_UNPRIVILEGED_CREATE,
            )
        },
        "file-symlink fixture unavailable without changing privileges/settings: {:?}",
        io::Error::last_os_error()
    );
}
#[test]
fn snapshot_windows_file_symlinks_and_dangling_symlinks_rejected() {
    for exists in [false, true] {
        let f = Fixture::new();
        let outside = Fixture::new();
        let store = f.store();
        let target = outside.0.join("target");
        if exists {
            fs::write(&target, b"untouched").unwrap();
        }
        file_symlink(&f.0.join(SNAPSHOT_FILENAME), &target);
        assert!(store.load().is_err());
        assert!(store.save("null").is_err());
        if exists {
            assert_eq!(fs::read(&target).unwrap(), b"untouched");
        } else {
            assert!(!target.exists());
        }
        fs::remove_file(f.0.join(SNAPSHOT_FILENAME)).unwrap();
        file_symlink(&f.0.join(LOCK_NAME).with_extension("symlink"), &target);
        // Replace the permanent sidecar only after the store closes, to model
        // an unsafe preexisting lock without bypassing its live share policy.
        drop(store);
        fs::remove_file(f.0.join(LOCK_NAME)).unwrap();
        fs::rename(
            f.0.join(LOCK_NAME).with_extension("symlink"),
            f.0.join(LOCK_NAME),
        )
        .unwrap();
        assert!(Store::open(&f.0).is_err());
        fs::remove_file(f.0.join(LOCK_NAME)).unwrap();
    }
}
#[test]
fn snapshot_windows_rename_primitive_never_follows_file_symlink() {
    let f = Fixture::new();
    let outside = Fixture::new();
    let store = f.store();
    let target = outside.0.join("target");
    fs::write(&target, b"untouched").unwrap();
    file_symlink(&f.0.join(SNAPSHOT_FILENAME), &target);
    let h = create(&store, "synthetic-stage", b"null");
    let result = rename(&h, &store.directory, SNAPSHOT_FILENAME);
    assert_eq!(fs::read(&target).unwrap(), b"untouched");
    if result.is_ok() {
        assert_eq!(fs::read(f.0.join(SNAPSHOT_FILENAME)).unwrap(), b"null");
        assert_eq!(inspect(&h, false).unwrap().volume, store.identity.volume);
    } else {
        fs::remove_file(f.0.join(SNAPSHOT_FILENAME)).unwrap();
    }
}
#[test]
fn snapshot_windows_foreign_owner_rejected_without_privilege_changes() {
    let f = Fixture::new();
    let store = f.store();
    let user = User::current().unwrap();
    let mut sid = null_mut();
    win(unsafe { ConvertSidToStringSidW(user.sid(), &mut sid) }).unwrap();
    let _sid = Local(sid.cast());
    let mut len = 0;
    while len < 256 && unsafe { *sid.add(len) } != 0 {
        len += 1;
    }
    assert!(len < 256);
    let user_sid = String::from_utf16(unsafe { std::slice::from_raw_parts(sid, len) }).unwrap();
    // Builtin Administrators is foreign to the user SID. Assigning it is only
    // possible if the existing token permits that owner. Never enable privileges
    // or elevate to make the fixture work; unavailable setup is a visible failure.
    let text: Vec<u16> = format!("O:BAD:P(A;;FA;;;{user_sid})")
        .encode_utf16()
        .chain(Some(0))
        .collect();
    let mut descriptor = null_mut();
    win(unsafe {
        ConvertStringSecurityDescriptorToSecurityDescriptorW(
            text.as_ptr(),
            SDDL_REVISION_1,
            &mut descriptor,
            null_mut(),
        )
    })
    .unwrap();
    let _descriptor = Local(descriptor);
    let h = open_at(store.directory.0, SNAPSHOT_FILENAME, FILE_ALL_ACCESS,
        FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE, nt::FILE_CREATE, false, descriptor)
        .expect("foreign-owner fixture requires an already-permitted token owner; no privilege changes are allowed");
    write_all(&h, b"null").unwrap();
    // Confirm the requested owner actually differs, so fixture setup cannot
    // accidentally make a rejection test vacuous.
    let mut owner = null_mut();
    let mut actual = null_mut();
    assert_eq!(
        unsafe {
            GetSecurityInfo(
                h.0,
                SE_FILE_OBJECT,
                OWNER_SECURITY_INFORMATION,
                &mut owner,
                null_mut(),
                null_mut(),
                null_mut(),
                &mut actual,
            )
        },
        ERROR_SUCCESS
    );
    let _actual = Local(actual);
    assert_eq!(unsafe { EqualSid(owner, user.sid()) }, 0);
    drop(h);
    assert!(store.load().is_err());
    assert!(store.save("true").is_err());
}

#[test]
fn snapshot_windows_crash_after_flush_preserves_good_and_leaves_private_orphan() {
    let f = Fixture::new();
    let store = f.store();
    store.save(RAW).unwrap();
    let mut child = child(&f, "stage");
    let deadline = Instant::now() + Duration::from_secs(15);
    while !f.0.join("ready").exists() {
        assert!(
            child.try_wait().unwrap().is_none(),
            "staging child exited before readiness"
        );
        if Instant::now() > deadline {
            let _ = child.kill();
            panic!("staging child timeout");
        }
        std::thread::sleep(Duration::from_millis(10));
    }
    child.kill().unwrap();
    child.wait().unwrap();
    assert_eq!(store.load().unwrap().as_deref(), Some(RAW));
    let orphan = names(&f)
        .into_iter()
        .filter(|n| n.ends_with(".tmp"))
        .collect::<Vec<_>>();
    assert_eq!(orphan.len(), 1);
    let user = User::current().unwrap();
    let h = open_at(
        store.directory.0,
        &orphan[0],
        FILE_READ_ATTRIBUTES | READ_CONTROL,
        FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
        nt::FILE_OPEN,
        false,
        null_mut(),
    )
    .unwrap();
    private(&h, &user).unwrap();
    inspect(&h, false).unwrap();
    drop(h);
    store.save("true").unwrap();
    assert_eq!(store.load().unwrap().as_deref(), Some("true"));
    assert!(
        f.0.join(&orphan[0]).exists(),
        "No automatic orphan discovery/deletion is authorized"
    );
}
#[test]
fn snapshot_windows_two_child_writers_serialize_without_partial_reads() {
    let f = Fixture::new();
    let store = f.store();
    store.save(RAW).unwrap();
    let mut one = child(&f, "write");
    let mut two = child(&f, "write");
    let deadline = Instant::now() + Duration::from_secs(30);
    loop {
        match store.load() {
            Ok(Some(text)) => assert!(text == RAW || text == "null"),
            Err(Error::Io(e)) if e.raw_os_error() == Some(ERROR_LOCK_VIOLATION as i32) => (),
            result => panic!("unexpected concurrent read: {result:?}"),
        }
        let first = one.try_wait().unwrap();
        let second = two.try_wait().unwrap();
        if let (Some(first), Some(second)) = (first, second) {
            assert!(first.success() && second.success());
            break;
        }
        if Instant::now() > deadline {
            let _ = one.kill();
            let _ = two.kill();
            panic!("two-writer timeout");
        }
        std::thread::sleep(Duration::from_millis(1));
    }
}
