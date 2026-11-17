//! Read-only metadata enumeration. No content reads, journal creation or elevation.
use std::{
    io,
    path::{Path, PathBuf},
    sync::atomic::{AtomicBool, Ordering},
};
pub mod usn;
#[cfg(windows)]
mod windows;
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Entry {
    Path {
        path: PathBuf,
        directory: bool,
        symlink: bool,
    },
    /// File identity, NOT an absolute path; USN enumeration doesn't supply size.
    Ntfs {
        id: u64,
        parent: u64,
        name: Vec<u16>,
        attributes: u32,
    },
}
#[derive(Debug, Default)]
pub struct Report {
    pub entries: u64,
    pub errors: u64,
    pub cancelled: bool,
}
/// Stream a folder tree without following symlinks/reparse points or reading content.
/// Keeps only open directory iterators (depth bounded), never collects all entries.
/// Errors are delivered explicitly; caller must not label a partial scan complete.
pub fn walk(root: &Path, cancel: &AtomicBool, mut emit: impl FnMut(io::Result<Entry>)) -> Report {
    let mut report = Report::default();
    let mut stack = Vec::new();
    match std::fs::symlink_metadata(root) {
        Ok(m) if m.is_dir() && !reparse(&m) => match std::fs::read_dir(root) {
            Ok(d) => stack.push(d),
            Err(e) => {
                report.errors += 1;
                emit(Err(e));
            }
        },
        Ok(_) => {
            report.errors += 1;
            emit(Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "root must be a non-link directory",
            )));
        }
        Err(e) => {
            report.errors += 1;
            emit(Err(e));
        }
    }
    while let Some(dir) = stack.last_mut() {
        if cancel.load(Ordering::Relaxed) {
            report.cancelled = true;
            break;
        }
        let item = match dir.next() {
            Some(v) => v,
            None => {
                stack.pop();
                continue;
            }
        };
        match item.and_then(|e| Ok((e.file_type()?, e.path()))) {
            Ok((kind, path)) => {
                // Windows junctions can appear as directories rather than symlinks.
                #[cfg(windows)]
                let link = match std::fs::symlink_metadata(&path) {
                    Ok(m) => reparse(&m),
                    Err(e) => {
                        report.errors += 1;
                        emit(Err(e));
                        continue;
                    }
                };
                #[cfg(not(windows))]
                let link = kind.is_symlink();
                report.entries += 1;
                emit(Ok(Entry::Path {
                    path: path.clone(),
                    directory: kind.is_dir(),
                    symlink: link,
                }));
                if kind.is_dir() && !link {
                    match std::fs::read_dir(path) {
                        Ok(d) => stack.push(d),
                        Err(e) => {
                            report.errors += 1;
                            emit(Err(e));
                        }
                    }
                }
            }
            Err(e) => {
                report.errors += 1;
                emit(Err(e));
            }
        }
    }
    report
}
fn reparse(m: &std::fs::Metadata) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        m.file_attributes() & 0x400 != 0
    }
    #[cfg(not(windows))]
    {
        m.file_type().is_symlink()
    }
}
/// Explicit whole-volume NTFS inventory. Does not elevate; unsupported/denied returns
/// an error so the caller can use `walk` within its original authorized scope.
/// Callback batches are provisional until success. On failure discard that generation
/// before fallback, rather than mixing partial NTFS records with path records.
pub fn ntfs_volume(
    drive: char,
    cancel: &AtomicBool,
    emit: impl FnMut(Entry),
) -> io::Result<Report> {
    if !drive.is_ascii_alphabetic() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "expected drive letter",
        ));
    }
    #[cfg(windows)]
    {
        windows::enumerate(drive, cancel, emit)
    }
    #[cfg(not(windows))]
    {
        let _ = (cancel, emit);
        Err(io::Error::new(
            io::ErrorKind::Unsupported,
            "NTFS volume enumeration requires Windows",
        ))
    }
}
/// Streaming consumers must discard their provisional rows on every `Reset`.
#[derive(Debug)]
pub enum ScanEvent {
    Reset {
        backend: &'static str,
        fallback_reason: Option<String>,
    },
    Entry(io::Result<Entry>),
}
/// Whole-volume fast path with automatic portable fallback. Only call for a volume
/// the user explicitly selected, never promote a selected folder into a drive scan.
pub fn volume_with_fallback(
    drive: char,
    cancel: &AtomicBool,
    mut emit: impl FnMut(ScanEvent),
) -> io::Result<Report> {
    if !drive.is_ascii_alphabetic() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "expected drive letter",
        ));
    }
    run_backends(
        |out| ntfs_volume(drive, cancel, out),
        |_error, out| {
            #[cfg(windows)]
            {
                Ok(walk(Path::new(&format!("{}:\\", drive)), cancel, out))
            }
            #[cfg(not(windows))]
            {
                let _ = out;
                Err(_error)
            }
        },
        &mut emit,
    )
}
fn run_backends(
    fast: impl FnOnce(&mut dyn FnMut(Entry)) -> io::Result<Report>,
    fallback: impl FnOnce(io::Error, &mut dyn FnMut(io::Result<Entry>)) -> io::Result<Report>,
    emit: &mut dyn FnMut(ScanEvent),
) -> io::Result<Report> {
    emit(ScanEvent::Reset {
        backend: "ntfs",
        fallback_reason: None,
    });
    match fast(&mut |v| emit(ScanEvent::Entry(Ok(v)))) {
        Ok(r) => Ok(r),
        Err(e) => {
            emit(ScanEvent::Reset {
                backend: "directory",
                fallback_reason: Some(e.to_string()),
            });
            fallback(e, &mut |v| emit(ScanEvent::Entry(v)))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn failure_discards_provisional_generation() {
        let mut events = Vec::new();
        let result = run_backends(
            |out| {
                out(Entry::Ntfs {
                    id: 1,
                    parent: 2,
                    name: vec![65],
                    attributes: 0,
                });
                Err(io::Error::new(
                    io::ErrorKind::PermissionDenied,
                    "injected second page failure",
                ))
            },
            |_, out| {
                out(Ok(Entry::Path {
                    path: PathBuf::from("fallback"),
                    directory: false,
                    symlink: false,
                }));
                Ok(Report {
                    entries: 1,
                    ..Report::default()
                })
            },
            &mut |event| events.push(event),
        )
        .unwrap();
        assert_eq!(result.entries, 1);
        assert_eq!(events.len(), 4);
        assert!(matches!(
            &events[0],
            ScanEvent::Reset {
                backend: "ntfs",
                ..
            }
        ));
        assert!(matches!(
            &events[1],
            ScanEvent::Entry(Ok(Entry::Ntfs { .. }))
        ));
        assert!(matches!(
            &events[2],
            ScanEvent::Reset {
                backend: "directory",
                fallback_reason: Some(_)
            }
        ));
        assert!(matches!(
            &events[3],
            ScanEvent::Entry(Ok(Entry::Path { .. }))
        ));
    }
    #[test]
    fn cancelled_scan_does_not_restart_fallback() {
        let r = run_backends(
            |_| {
                Ok(Report {
                    cancelled: true,
                    ..Report::default()
                })
            },
            |_, _| panic!("must not restart cancellation"),
            &mut |_| {},
        )
        .unwrap();
        assert!(r.cancelled);
    }
    #[test]
    fn invalid_drive() {
        assert!(ntfs_volume(':', &AtomicBool::new(false), |_| {}).is_err());
    }
    #[test]
    fn traversal_and_cancel() {
        let root = std::env::temp_dir().join(format!("inventory-test-{}", std::process::id()));
        std::fs::create_dir_all(root.join("child")).unwrap();
        std::fs::write(root.join("child/a"), b"content").unwrap();
        let mut entries = Vec::new();
        let flag = AtomicBool::new(false);
        let r = walk(&root, &flag, |v| entries.push(v.unwrap()));
        assert_eq!(r.entries, 2);
        assert_eq!(r.errors, 0);
        let r = walk(&root, &AtomicBool::new(true), |_| panic!());
        assert!(r.cancelled);
        #[cfg(unix)]
        {
            std::os::unix::fs::symlink(&root, root.join("loop")).unwrap();
            let r = walk(&root, &flag, |v| {
                v.unwrap();
            });
            assert_eq!(r.entries, 3);
        }
        std::fs::remove_dir_all(root).unwrap();
    }
    #[test]
    fn missing_root_is_partial() {
        let r = walk(
            Path::new("/nonexistent-inventory-root"),
            &AtomicBool::new(false),
            |v| assert!(v.is_err()),
        );
        assert_eq!(r.errors, 1);
    }
}
