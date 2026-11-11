//! Local-only snapshot persistence. No automatic app-data discovery or HTTP API.
//! Linux is supported; other platforms fail closed until their secure filesystem
//! primitives and atomic replacement behavior have independent acceptance.
use std::{fmt, io, path::Path};

pub const SNAPSHOT_FILENAME: &str = "living-world-snapshot.json";
pub const MAX_SNAPSHOT_BYTES: usize = 16 * 1024 * 1024;

#[derive(Debug)]
pub enum Error {
    UnsupportedPlatform,
    Invalid(&'static str),
    Io(io::Error),
}
impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnsupportedPlatform => {
                write!(f, "Secure snapshot persistence is supported only on Linux")
            }
            Self::Invalid(reason) => write!(f, "{reason}"),
            Self::Io(error) => write!(f, "Snapshot I/O failed: {error}"),
        }
    }
}
impl std::error::Error for Error {}
impl From<io::Error> for Error {
    fn from(e: io::Error) -> Self {
        Self::Io(e)
    }
}

/// Replacement has committed whenever this receipt is returned. If the directory
/// sync is unconfirmed, do not blindly retry: the new file is already visible.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SnapshotReceipt {
    pub filename: &'static str,
    pub bytes: usize,
    pub directory_synced: bool,
}

pub struct FoundrySnapshotStore {
    #[cfg(target_os = "linux")]
    directory: std::fs::File,
    #[cfg(target_os = "linux")]
    operation: std::sync::Mutex<()>,
}
impl FoundrySnapshotStore {
    /// Opens an existing, absolute, owner-private directory without following any
    /// symlink components. It never creates or discovers a user's app directory.
    /// The directory handle remains bound to that inode even if its name changes.
    pub fn open(directory: &Path) -> Result<Self, Error> {
        #[cfg(target_os = "linux")]
        {
            Ok(Self {
                directory: linux::open_directory(directory)?,
                operation: std::sync::Mutex::new(()),
            })
        }
        #[cfg(not(target_os = "linux"))]
        {
            let _ = directory;
            Err(Error::UnsupportedPlatform)
        }
    }
    pub fn save_world_snapshot(&self, state: &str) -> Result<SnapshotReceipt, Error> {
        #[cfg(target_os = "linux")]
        {
            let _operation = self
                .operation
                .lock()
                .map_err(|_| Error::Invalid("Snapshot operation lock poisoned"))?;
            linux::save(&self.directory, state)
        }
        #[cfg(not(target_os = "linux"))]
        {
            let _ = state;
            Err(Error::UnsupportedPlatform)
        }
    }
    pub fn load_world_snapshot(&self) -> Result<Option<String>, Error> {
        #[cfg(target_os = "linux")]
        {
            let _operation = self
                .operation
                .lock()
                .map_err(|_| Error::Invalid("Snapshot operation lock poisoned"))?;
            linux::load(&self.directory)
        }
        #[cfg(not(target_os = "linux"))]
        {
            Err(Error::UnsupportedPlatform)
        }
    }
}

#[cfg(target_os = "linux")]
mod linux {
    use super::*;
    use std::{
        ffi::{CStr, CString},
        fs::File,
        io::{Read, Write},
        os::{
            fd::{AsRawFd, FromRawFd},
            unix::{ffi::OsStrExt, fs::MetadataExt},
        },
        path::Component,
    };

    const NAME: &CStr = c"living-world-snapshot.json";
    const READ_FLAGS: i32 = libc::O_RDONLY | libc::O_CLOEXEC | libc::O_NOFOLLOW | libc::O_NONBLOCK;
    fn open_at(dir: &File, name: &CStr, flags: i32, mode: u32) -> io::Result<File> {
        // SAFETY: descriptor is borrowed for this call and CStr is NUL terminated.
        // Only a successful, newly owned descriptor is converted into File.
        let fd =
            unsafe { libc::openat(dir.as_raw_fd(), name.as_ptr(), flags, mode as libc::mode_t) };
        if fd < 0 {
            Err(io::Error::last_os_error())
        } else {
            Ok(unsafe { File::from_raw_fd(fd) })
        }
    }
    fn private_directory(dir: &File) -> Result<(), Error> {
        let m = dir.metadata()?;
        // SAFETY: geteuid has no memory arguments and cannot fail.
        let uid = unsafe { libc::geteuid() };
        if !m.is_dir() || m.uid() != uid || m.mode() & 0o077 != 0 {
            return Err(Error::Invalid(
                "Snapshot directory must be owner-private (0700 or stricter)",
            ));
        }
        Ok(())
    }
    pub(super) fn open_directory(path: &Path) -> Result<File, Error> {
        if !path.is_absolute() {
            return Err(Error::Invalid("Snapshot directory must be absolute"));
        }
        let mut directory = File::open("/")?;
        let mut any = false;
        for component in path.components() {
            match component {
                Component::RootDir => (),
                Component::Normal(name) => {
                    let name = CString::new(name.as_bytes())
                        .map_err(|_| Error::Invalid("Directory contains NUL"))?;
                    directory = open_at(&directory, &name, READ_FLAGS | libc::O_DIRECTORY, 0)?;
                    any = true;
                }
                _ => {
                    return Err(Error::Invalid(
                        "Snapshot directory contains unsupported components",
                    ));
                }
            }
        }
        if !any {
            return Err(Error::Invalid("Root is not a snapshot directory"));
        }
        private_directory(&directory)?;
        Ok(directory)
    }
    struct Lock<'a>(&'a File);
    impl<'a> Lock<'a> {
        fn acquire(directory: &'a File, mode: i32) -> Result<Self, Error> {
            private_directory(directory)?;
            // SAFETY: flock borrows the live directory descriptor, no pointers.
            if unsafe { libc::flock(directory.as_raw_fd(), mode | libc::LOCK_NB) } != 0 {
                return Err(io::Error::last_os_error().into());
            }
            Ok(Self(directory))
        }
    }
    impl Drop for Lock<'_> {
        fn drop(&mut self) {
            // SAFETY: descriptor remains live for this guard's lifetime.
            unsafe {
                libc::flock(self.0.as_raw_fd(), libc::LOCK_UN);
            }
        }
    }
    fn regular_private(file: &File) -> Result<(), Error> {
        let m = file.metadata()?;
        // SAFETY: geteuid has no memory arguments and cannot fail.
        let uid = unsafe { libc::geteuid() };
        if !m.is_file() || m.uid() != uid || m.nlink() != 1 || m.mode() & 0o022 != 0 {
            return Err(Error::Invalid(
                "Snapshot must be an owner-owned regular file without hard links or shared writes",
            ));
        }
        Ok(())
    }
    fn existing(dir: &File) -> Result<Option<File>, Error> {
        match open_at(dir, NAME, READ_FLAGS, 0) {
            Ok(f) => {
                regular_private(&f)?;
                Ok(Some(f))
            }
            Err(e) if e.raw_os_error() == Some(libc::ENOENT) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }
    fn validate(state: &str) -> Result<(), Error> {
        if state.len() > MAX_SNAPSHOT_BYTES {
            return Err(Error::Invalid("Snapshot exceeds 16 MiB"));
        }
        serde_json::from_str::<Box<serde_json::value::RawValue>>(state)
            .map_err(|_| Error::Invalid("Snapshot is not valid JSON"))?;
        Ok(())
    }
    pub(super) fn load(dir: &File) -> Result<Option<String>, Error> {
        let _lock = Lock::acquire(dir, libc::LOCK_SH)?;
        let Some(file) = existing(dir)? else {
            return Ok(None);
        };
        if file.metadata()?.len() > MAX_SNAPSHOT_BYTES as u64 {
            return Err(Error::Invalid("Snapshot exceeds 16 MiB"));
        }
        let mut bytes = Vec::new();
        file.take((MAX_SNAPSHOT_BYTES + 1) as u64)
            .read_to_end(&mut bytes)?;
        if bytes.len() > MAX_SNAPSHOT_BYTES {
            return Err(Error::Invalid("Snapshot exceeds 16 MiB"));
        }
        let state =
            String::from_utf8(bytes).map_err(|_| Error::Invalid("Snapshot is not UTF-8"))?;
        validate(&state)?;
        Ok(Some(state))
    }
    struct Temporary<'a> {
        dir: &'a File,
        name: CString,
        active: bool,
    }
    impl Drop for Temporary<'_> {
        fn drop(&mut self) {
            if self.active {
                // SAFETY: both the directory descriptor and C string remain live.
                // unlinkat removes only this entry, never follows a symlink.
                unsafe {
                    libc::unlinkat(self.dir.as_raw_fd(), self.name.as_ptr(), 0);
                }
            }
        }
    }
    pub(super) fn save(dir: &File, state: &str) -> Result<SnapshotReceipt, Error> {
        save_impl(dir, state, |_| Ok(()), || Ok(()), |d| d.sync_all())
    }
    // Hooks stay private: tests inject write/rename-boundary/directory-sync faults.
    fn save_impl<W, B, S>(
        dir: &File,
        state: &str,
        before_write: W,
        before_replace: B,
        sync_directory: S,
    ) -> Result<SnapshotReceipt, Error>
    where
        W: FnOnce(&mut File) -> io::Result<()>,
        B: FnOnce() -> io::Result<()>,
        S: FnOnce(&File) -> io::Result<()>,
    {
        validate(state)?;
        let _lock = Lock::acquire(dir, libc::LOCK_EX)?;
        existing(dir)?;
        let mut random = [0_u8; 16];
        getrandom::fill(&mut random)
            .map_err(|_| Error::Invalid("Unable to create unpredictable snapshot staging name"))?;
        let suffix = random
            .iter()
            .map(|b| format!("{b:02x}"))
            .collect::<String>();
        let name =
            CString::new(format!(".living-world-snapshot.{suffix}.tmp")).expect("fixed ASCII name");
        let mut file = open_at(
            dir,
            &name,
            libc::O_WRONLY | libc::O_CREAT | libc::O_EXCL | libc::O_CLOEXEC | libc::O_NOFOLLOW,
            0o600,
        )?;
        let mut temporary = Temporary {
            dir,
            name,
            active: true,
        };
        before_write(&mut file)?;
        file.write_all(state.as_bytes())?;
        file.sync_all()?;
        before_replace()?;
        // Recheck collision type without following it. Rename itself never follows
        // the destination, even if a noncooperating writer changes it after this.
        existing(dir)?;
        private_directory(dir)?;
        regular_private(&file)?;
        let staged = open_at(dir, &temporary.name, READ_FLAGS, 0)?;
        regular_private(&staged)?;
        let expected = file.metadata()?;
        let actual = staged.metadata()?;
        if (expected.dev(), expected.ino()) != (actual.dev(), actual.ino()) {
            return Err(Error::Invalid("Snapshot staging identity changed"));
        }
        // SAFETY: both names are live NUL-terminated strings, both descriptors
        // refer to the same open directory; no user-controlled relative path.
        if unsafe {
            libc::renameat(
                dir.as_raw_fd(),
                temporary.name.as_ptr(),
                dir.as_raw_fd(),
                NAME.as_ptr(),
            )
        } != 0
        {
            return Err(io::Error::last_os_error().into());
        }
        temporary.active = false;
        // Failure here is after commit, so return an honest receipt, not a false
        // precommit error inviting an unsafe blind retry.
        Ok(SnapshotReceipt {
            filename: SNAPSHOT_FILENAME,
            bytes: state.len(),
            directory_synced: sync_directory(dir).is_ok(),
        })
    }
    #[cfg(test)]
    mod tests {
        include!("foundry_snapshot_tests.rs");
    }
}

// Intentionally not connected to FoundrySnapshotStore. Native acceptance and
// independent review are required before changing the production platform gate.
#[cfg(all(windows, test))]
#[path = "foundry_snapshot_windows_experimental.rs"]
mod windows_experimental;
