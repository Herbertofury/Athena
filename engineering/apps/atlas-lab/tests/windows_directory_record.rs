#[cfg(windows)]
fn decode(bytes: &[u8]) -> Result<Vec<LocalEntry>, &'static str> {
    if bytes.len() < 88 {
        return Err("invalid header");
    }
    let mut cursor = bytes;
    let mut out = Vec::new();
    loop {
        if cursor.len() < 88 {
            return Err("invalid header");
        }
        let n = u32::from_le_bytes(cursor[60..64].try_into().unwrap()) as usize;
        if n == 0 || !n.is_multiple_of(2) || n > cursor.len() - 88 {
            return Err("invalid extent");
        }
        let name = cursor[88..88 + n]
            .as_chunks::<2>()
            .0
            .iter()
            .copied()
            .map(u16::from_le_bytes)
            .collect();
        let attributes = u32::from_le_bytes(cursor[56..60].try_into().unwrap());
        let logical = u64::from_le_bytes(cursor[40..48].try_into().unwrap());
        let allocated = u64::from_le_bytes(cursor[48..56].try_into().unwrap());
        let id = cursor[72..88].try_into().unwrap();
        out.push(LocalEntry {
            name,
            id,
            allocated,
            logical,
            attributes,
        });
        let next = u32::from_le_bytes(cursor[..4].try_into().unwrap()) as usize;
        if next == 0 {
            return Ok(out);
        }
        if next < 88 + n || next > cursor.len() - 88 {
            return Err("invalid next offset");
        }
        cursor = &cursor[next..];
    }
}
#[cfg(windows)]
struct LocalEntry {
    name: Vec<u16>,
    id: [u8; 16],
    allocated: u64,
    logical: u64,
    attributes: u32,
}
#[cfg(windows)]
const BATCH_LIMIT: usize = 65536;
#[cfg(windows)]
#[test]
fn real_unprivileged_windows_fixture_keeps_hardlink_identity() {
    use std::{
        ffi::c_void,
        fs,
        os::windows::{fs::OpenOptionsExt, io::AsRawHandle},
        time::{SystemTime, UNIX_EPOCH},
    };
    const FILE_LIST_DIRECTORY: u32 = 1;
    const FILE_SHARE_ALL: u32 = 7;
    const OPEN_DIRECTORY_AND_NO_REPARSE: u32 = 0x0220_0000;
    const FILE_ID_EXTD_DIR_RESTART_INFO: i32 = 0x14;
    #[link(name = "kernel32")]
    unsafe extern "system" {
        fn GetFileInformationByHandleEx(
            file: *mut c_void,
            class: i32,
            buffer: *mut c_void,
            length: u32,
        ) -> i32;
    }
    let root = std::env::temp_dir().join(format!(
        "athena-dir-record-{}-{}",
        std::process::id(),
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    fs::create_dir(&root).unwrap();
    struct Cleanup(std::path::PathBuf);
    impl Drop for Cleanup {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    let _cleanup = Cleanup(root.clone());
    let payload = b"seven!!";
    fs::write(root.join("source.bin"), payload).unwrap();
    fs::hard_link(root.join("source.bin"), root.join("copy-日本語.bin")).unwrap();
    fs::write(root.join("different.bin"), b"another file").unwrap();
    let dir = fs::OpenOptions::new()
        .access_mode(FILE_LIST_DIRECTORY)
        .share_mode(FILE_SHARE_ALL)
        .custom_flags(OPEN_DIRECTORY_AND_NO_REPARSE)
        .open(&root)
        .unwrap();
    let mut buffer = [0_u64; BATCH_LIMIT / 8];
    // The buffer is initialized and aligned for this API, fixed-size and live.
    // The handle is an owned File for this disposable, non-reparse directory.
    let ok = unsafe {
        GetFileInformationByHandleEx(
            dir.as_raw_handle(),
            FILE_ID_EXTD_DIR_RESTART_INFO,
            buffer.as_mut_ptr().cast(),
            BATCH_LIMIT as u32,
        )
    };
    assert_ne!(ok, 0, "{}", std::io::Error::last_os_error());
    // Read only the initialized byte representation of the local u64 array.
    let bytes = unsafe { std::slice::from_raw_parts(buffer.as_ptr().cast::<u8>(), BATCH_LIMIT) };
    let rows = decode(bytes).unwrap();
    let identity = |needle: &str| {
        let name = needle.encode_utf16().collect::<Vec<_>>();
        rows.iter().find(|r| r.name == name).unwrap()
    };
    let a = identity("source.bin");
    let b = identity("copy-日本語.bin");
    assert_eq!(a.logical, payload.len() as u64);
    assert_eq!(a.logical, b.logical);
    assert_eq!(a.allocated, b.allocated);
    assert_ne!(a.id, [0; 16]);
    assert_eq!(a.id, b.id);
    assert_ne!(a.id, identity("different.bin").id);
    assert_eq!(a.attributes & 0x400, 0);
    assert_eq!(fs::read(root.join("source.bin")).unwrap(), payload);
    assert_eq!(fs::read(root.join("copy-日本語.bin")).unwrap(), payload);
    fs::create_dir(root.join("not-followed")).unwrap();
    fs::write(root.join("not-followed/ignored.txt"), b"not observed").unwrap();
    let result = atlas_lab::storage_windows_observation::observe(&root, 10).unwrap();
    assert_eq!(result["observed_file_pathnames"], 3);
    assert_eq!(result["identified_unique_files"], 2);
    assert_eq!(result["excluded_directories"], 1);
    assert_eq!(result["logical_pathname_bytes"], 2 * payload.len() + 12);
    assert_eq!(
        result["observed_identified_allocation_bytes"],
        a.allocated + identity("different.bin").allocated
    );
    assert!(!result.to_string().contains("source.bin"));
    assert_eq!(result["partial"], false);
    let cli = std::process::Command::new(env!("CARGO_BIN_EXE_atlas-lab"))
        .arg("windows-directory-observation")
        .arg(&root)
        .arg("10")
        .output()
        .unwrap();
    assert!(
        cli.status.success(),
        "{}",
        String::from_utf8_lossy(&cli.stderr)
    );
    assert_eq!(
        serde_json::from_slice::<serde_json::Value>(&cli.stdout).unwrap(),
        result
    );
    assert!(
        atlas_lab::storage_windows_observation::observe(
            std::path::Path::new("relative-directory"),
            10
        )
        .is_err()
    );
    for invalid in [
        r"C:\NUL",
        r"C:\COM1.txt",
        r"C:\AUX \example",
        r"\\?\GLOBALROOT\Device\HarddiskVolume1",
    ] {
        let error =
            atlas_lab::storage_windows_observation::observe(std::path::Path::new(invalid), 10)
                .unwrap_err();
        assert!(error.to_string().contains("ordinary local-drive directory"));
    }
    let capped = atlas_lab::storage_windows_observation::observe(&root, 1).unwrap();
    assert_eq!(capped["stopped_entry_limit"], true);
    assert_eq!(capped["partial"], true);
    let mut long_root = root.clone();
    for i in 0..15 {
        long_root.push(format!("directory-for-volume-qualification-test-{i:02}"));
    }
    std::fs::create_dir_all(&long_root).unwrap();
    std::fs::write(long_root.join("direct.bin"), [17_u8; 513]).unwrap();
    let long_result = atlas_lab::storage_windows_observation::observe(&long_root, 10).unwrap();
    assert_eq!(long_result["observed_file_pathnames"], 1);
    assert_eq!(long_result["logical_pathname_bytes"], 513);
    assert_eq!(long_result["partial"], false);
    // Refuse direct UNC syntax before opening anything or contacting a host.
    let unc = std::path::Path::new(r"\\not-a-real-network-host\share\directory");
    let error = atlas_lab::storage_windows_observation::observe(unc, 10).unwrap_err();
    assert!(error.to_string().contains("ordinary local-drive directory"));
    println!(
        "Win32 fixed directory fixture: exact hardlink ID, Unicode filename, and unchanged bytes. Local-volume qualification also accepted a long path, and refused direct UNC syntax."
    );
}
