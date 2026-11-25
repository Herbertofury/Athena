//! Explicit top-level Windows metadata observation. No child is opened or followed.
use serde_json::Value;
use std::path::Path;
pub const MAX_ENTRIES: usize = 100_000;

#[cfg(any(windows, test))]
mod records {
    use serde_json::{Value, json};
    use std::collections::{HashMap, HashSet};
    const HEADER: usize = 88;
    pub(super) const BATCH_LIMIT: usize = 64 * 1024;
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
            if next != 0
                && (!next.is_multiple_of(8) || next < end || next > remaining.len() - HEADER)
            {
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

    #[derive(Default)]
    pub(super) struct Summary {
        records: usize,
        directories: usize,
        reparse: usize,
        unnamed_identity: usize,
        conflicts: usize,
        pathnames: usize,
        logical: u64,
        allocated: u64,
        seen_names: HashSet<Vec<u16>>,
        identities: HashMap<[u8; 16], (u64, u64)>,
        capped: bool,
    }
    impl Summary {
        pub(super) fn feed(&mut self, bytes: &[u8], limit: usize) -> Result<bool, &'static str> {
            for entry in decode(bytes)? {
                if entry.name == [46] || entry.name == [46, 46] {
                    continue;
                }
                if self.records == limit {
                    self.capped = true;
                    return Ok(false);
                }
                self.records += 1;
                if !self.seen_names.insert(entry.name) {
                    self.conflicts += 1;
                    continue;
                }
                if entry.attributes & 0x400 != 0 || entry.reparse_tag != 0 {
                    self.reparse += 1;
                    continue;
                }
                if entry.attributes & 0x10 != 0 {
                    self.directories += 1;
                    continue;
                }
                self.pathnames += 1;
                self.logical = self
                    .logical
                    .checked_add(entry.logical)
                    .ok_or("logical size overflow")?;
                if entry.id == [0; 16] {
                    self.unnamed_identity += 1;
                    continue;
                }
                match self.identities.entry(entry.id) {
                    std::collections::hash_map::Entry::Vacant(slot) => {
                        slot.insert((entry.logical, entry.allocated));
                        self.allocated = self
                            .allocated
                            .checked_add(entry.allocated)
                            .ok_or("allocated size overflow")?;
                    }
                    std::collections::hash_map::Entry::Occupied(slot) => {
                        if *slot.get() != (entry.logical, entry.allocated) {
                            self.conflicts += 1;
                        }
                    }
                }
            }
            Ok(true)
        }
        pub(super) fn finish(self, byte_limit_stop: bool) -> Value {
            json!({
                "schema":"athena-windows-directory-observation-v1",
                "scope":"Explicit directory direct children only. No child content, recursion, names, IDs or paths returned.",
                "records_examined":self.records,"observed_file_pathnames":self.pathnames,
                "logical_pathname_bytes":self.logical,"identified_unique_files":self.identities.len(),
                "observed_identified_allocation_bytes":self.allocated,
                "excluded_directories":self.directories,"excluded_reparse_entries":self.reparse,
                "files_without_stable_id":self.unnamed_identity,"identity_or_name_conflicts":self.conflicts,
                "stopped_entry_limit":self.capped,"stopped_batch_limit":byte_limit_stop,
                "partial":self.capped||byte_limit_stop||self.unnamed_identity!=0||self.conflicts!=0,
                "point_in_time_snapshot":false,"reclaimable_space_inferred":false
            })
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
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

        #[test]
        fn summary_counts_aliased_logical_twice_and_known_allocation_once() {
            let mut a = synthetic(&[65], 96);
            let mut b = synthetic(&[66], 0);
            a[56..60].fill(0);
            a[68..72].fill(0);
            b[56..60].fill(0);
            b[68..72].fill(0);
            a.extend(b);
            let mut summary = Summary::default();
            assert!(summary.feed(&a, 10).unwrap());
            let result = summary.finish(false);
            assert_eq!(result["observed_file_pathnames"], 2);
            assert_eq!(result["logical_pathname_bytes"], 30);
            assert_eq!(result["identified_unique_files"], 1);
            assert_eq!(result["observed_identified_allocation_bytes"], 4096);
            assert!(!result.to_string().contains("efefef"));
            let mut smaller = Summary::default();
            assert!(!smaller.feed(&a, 1).unwrap());
            assert_eq!(smaller.finish(false)["partial"], true);
        }
    }
}

#[cfg(windows)]
mod native {
    use super::*;
    use std::{
        ffi::c_void,
        fs, io,
        os::windows::{fs::OpenOptionsExt, io::AsRawHandle},
    };
    #[link(name = "kernel32")]
    unsafe extern "system" {
        fn GetFileInformationByHandleEx(
            file: *mut c_void,
            class: i32,
            buffer: *mut c_void,
            length: u32,
        ) -> i32;
    }
    const FILE_ATTRIBUTE_TAG_INFO: i32 = 9;
    const DIRECTORY_INFO: i32 = 0x13;
    const DIRECTORY_RESTART: i32 = 0x14;
    const MAX_BATCHES: usize = 4096;
    pub(super) fn measure(path: &Path, limit: usize) -> Result<Value, Box<dyn std::error::Error>> {
        use std::{
            os::windows::ffi::OsStrExt,
            path::{Component, Prefix},
        };
        fn safe_name(name: &std::ffi::OsStr) -> bool {
            if name.encode_wide().any(|unit| matches!(unit, 0 | 58)) {
                return false;
            }
            let text = name.to_string_lossy();
            let stem = text
                .split('.')
                .next()
                .unwrap_or("")
                .trim_end_matches(' ')
                .to_ascii_uppercase();
            if matches!(
                stem.as_str(),
                "CON" | "PRN" | "AUX" | "NUL" | "CONIN$" | "CONOUT$" | "CLOCK$"
            ) {
                return false;
            }
            !stem
                .strip_prefix("COM")
                .or_else(|| stem.strip_prefix("LPT"))
                .is_some_and(|n| {
                    matches!(
                        n,
                        "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "¹" | "²" | "³"
                    )
                })
        }
        let mut components = path.components();
        if !matches!(components.next(),Some(Component::Prefix(prefix)) if matches!(prefix.kind(),Prefix::Disk(_) | Prefix::VerbatimDisk(_)))
            || components.next() != Some(Component::RootDir)
            || components.any(|c| !matches!(c,Component::Normal(name) if safe_name(name)))
        {
            return Err("Select an absolute ordinary local-drive directory path".into());
        }

        let dir = fs::OpenOptions::new()
            .access_mode(0x81)
            .share_mode(7)
            .custom_flags(0x0220_0000)
            .open(path)?;
        let mut tag = [0_u32; 2];
        // This open directory handle and initialized output array outlive the Win32 call.
        let ok = unsafe {
            GetFileInformationByHandleEx(
                dir.as_raw_handle(),
                FILE_ATTRIBUTE_TAG_INFO,
                tag.as_mut_ptr().cast(),
                8,
            )
        };
        if ok == 0 {
            return Err(io::Error::last_os_error().into());
        }
        if tag[0] & 0x10 == 0 || tag[0] & 0x400 != 0 || tag[1] != 0 {
            return Err("Expected an ordinary non-reparse directory handle".into());
        }
        let mut buffer = [0_u64; records::BATCH_LIMIT / 8];
        let mut summary = records::Summary::default();
        for batch in 0..MAX_BATCHES {
            let class = if batch == 0 {
                DIRECTORY_RESTART
            } else {
                DIRECTORY_INFO
            };
            buffer.fill(0);
            // The fixed array provides the initialized, aligned memory documented for this explicit handle query.
            let ok = unsafe {
                GetFileInformationByHandleEx(
                    dir.as_raw_handle(),
                    class,
                    buffer.as_mut_ptr().cast(),
                    records::BATCH_LIMIT as u32,
                )
            };
            if ok == 0 {
                let e = io::Error::last_os_error();
                return if e.raw_os_error() == Some(18) {
                    Ok(summary.finish(false))
                } else {
                    Err(e.into())
                };
            }
            // Reinterpret only the bounded byte representation of the initialized array.
            let bytes = unsafe {
                std::slice::from_raw_parts(buffer.as_ptr().cast::<u8>(), records::BATCH_LIMIT)
            };
            if !summary.feed(bytes, limit)? {
                return Ok(summary.finish(false));
            }
        }
        Ok(summary.finish(true))
    }
}

/// Windows only. There is no fallback or background sweep on any other platform.
pub fn observe(path: &Path, limit: usize) -> Result<Value, Box<dyn std::error::Error>> {
    if !(1..=MAX_ENTRIES).contains(&limit) {
        return Err("Entry cap must be between 1 and 100000".into());
    }
    #[cfg(windows)]
    {
        native::measure(path, limit)
    }
    #[cfg(not(windows))]
    {
        let _ = path;
        Err("Windows directory observation is unavailable on this platform".into())
    }
}
