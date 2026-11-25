//! Evaluation-only Windows fixture. Not an application scanner or a root walker.
const HEADER: usize = 88;
const BATCH_LIMIT: usize = 64 * 1024;
const MAX_RECORDS: usize = BATCH_LIMIT / HEADER;

#[derive(Debug, PartialEq, Eq)]
struct Entry {
    name: Vec<u16>,
    id: [u8; 16],
    logical: u64,
    allocated: u64,
    attributes: u32,
    reparse_tag: u32,
}
fn u32_at(bytes: &[u8], offset: usize) -> u32 {
    u32::from_le_bytes(bytes[offset..offset + 4].try_into().unwrap())
}
fn signed_size(bytes: &[u8], offset: usize) -> Result<u64, &'static str> {
    i64::from_le_bytes(bytes[offset..offset + 8].try_into().unwrap())
        .try_into()
        .map_err(|_| "negative size")
}

/// The caller supplies one initialized buffer of directory records and the OS
/// API indicates success. Zero terminal offset ends the records, not the buffer.
fn decode(bytes: &[u8]) -> Result<Vec<Entry>, &'static str> {
    if bytes.len() < HEADER || bytes.len() > BATCH_LIMIT {
        return Err("invalid batch length");
    }
    let mut remaining = bytes;
    let mut entries = Vec::new();
    loop {
        if remaining.len() < HEADER || entries.len() >= MAX_RECORDS {
            return Err("truncated or oversized batch");
        }
        let next = u32_at(remaining, 0) as usize;
        let name_len = u32_at(remaining, 60) as usize;
        if name_len == 0 || !name_len.is_multiple_of(2) || name_len > remaining.len() - HEADER {
            return Err("invalid UTF-16 extent");
        }
        let end = HEADER + name_len;
        if next != 0 && (!next.is_multiple_of(8) || next < end || next > remaining.len() - HEADER) {
            return Err("invalid relative next record offset");
        }
        let name = remaining[HEADER..end]
            .as_chunks::<2>()
            .0
            .iter()
            .copied()
            .map(u16::from_le_bytes)
            .collect::<Vec<_>>();
        if name.iter().any(|x| matches!(*x, 0 | 47 | 58 | 92)) {
            return Err("invalid filename component");
        }
        entries.push(Entry {
            name,
            id: remaining[72..88].try_into().unwrap(),
            logical: signed_size(remaining, 40)?,
            allocated: signed_size(remaining, 48)?,
            attributes: u32_at(remaining, 56),
            reparse_tag: u32_at(remaining, 68),
        });
        if next == 0 {
            return Ok(entries);
        }
        remaining = &remaining[next..];
    }
}

fn synthetic(name: &[u16], next: usize) -> Vec<u8> {
    let mut bytes = vec![0; (HEADER + name.len() * 2).max(next)];
    bytes[..4].copy_from_slice(&(next as u32).to_le_bytes());
    bytes[40..48].copy_from_slice(&15_i64.to_le_bytes());
    bytes[48..56].copy_from_slice(&4096_i64.to_le_bytes());
    bytes[56..60].copy_from_slice(&0x400_u32.to_le_bytes());
    bytes[60..64].copy_from_slice(&(2 * name.len() as u32).to_le_bytes());
    bytes[68..72].copy_from_slice(&0xa000_000c_u32.to_le_bytes());
    bytes[72..88].copy_from_slice(&[0xef; 16]);
    for (i, n) in name.iter().enumerate() {
        bytes[HEADER + i * 2..HEADER + i * 2 + 2].copy_from_slice(&n.to_le_bytes());
    }
    bytes
}

#[test]
fn complete_batches_keep_native_identity_and_exact_code_units() {
    let mut first = synthetic(&[0xd800, 51], 96);
    first.extend(synthetic(&[65, 122], 0));
    first.extend([0; 80]);
    let rows = decode(&first).unwrap();
    assert_eq!(rows.len(), 2);
    assert_eq!(rows[0].name, [0xd800, 51]);
    assert_eq!(rows[1].name, [65, 122]);
    assert_eq!(rows[0].id, [0xef; 16]);
    assert_eq!(rows[0].logical, 15);
    assert_eq!(rows[0].allocated, 4096);
    assert_eq!(rows[0].attributes & 0x400, 0x400);
    assert_eq!(rows[0].reparse_tag, 0xa000_000c);
}

#[test]
fn malformed_buffer_never_returns_a_partial_inventory() {
    let good = synthetic(&[65, 122], 0);
    for len in 0..good.len() {
        assert!(decode(&good[..len]).is_err());
    }
    for next in [8_u32, 89, 91, 96, u32::MAX] {
        let mut bad = good.clone();
        bad[..4].copy_from_slice(&next.to_le_bytes());
        assert!(decode(&bad).is_err());
    }
    let mut bad = synthetic(&[65], 96);
    bad.extend(synthetic(&[47], 0));
    assert!(decode(&bad).is_err());
    let mut bad = good.clone();
    bad[48..56].copy_from_slice(&(-1_i64).to_le_bytes());
    assert!(decode(&bad).is_err());
    assert!(decode(&vec![0; BATCH_LIMIT + 1]).is_err());
}

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
    println!(
        "Win32 fixed directory fixture: exact hardlink ID, Unicode filename, and unchanged bytes."
    );
}
