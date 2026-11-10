//! Test-only, local NTFS prototype. Not a production backend or acceptance claim.
//! Cooperating processes serialize through a permanent protected lock entry.
//! Like Linux's recheck + renameat, this is NOT a compare-and-swap defense against
//! arbitrary malicious same-user mutation. No elevation, discovery, ACL repair,
//! remote filesystem, inherited ACL, or privileged volume flush is supported.
use super::{Error, MAX_SNAPSHOT_BYTES, SNAPSHOT_FILENAME, SnapshotReceipt};
use std::{
    ffi::c_void,
    io,
    mem::{offset_of, size_of},
    path::Path,
    ptr::{null, null_mut},
};
use windows_sys::{
    Wdk::{
        Foundation::OBJECT_ATTRIBUTES,
        Storage::FileSystem as nt,
        System::SystemServices::{FILE_FS_DEVICE_INFORMATION, FILE_REMOTE_DEVICE},
    },
    Win32::{
        Foundation::*,
        Security::{Authorization::*, *},
        Storage::FileSystem::*,
        System::{IO::*, SystemServices::ACCESS_ALLOWED_ACE_TYPE, Threading::*},
    },
};

const LOCK_NAME: &str = ".living-world-snapshot.lock";
fn invalid(message: &'static str) -> Error {
    Error::Invalid(message)
}
fn win(ok: i32) -> Result<(), Error> {
    if ok == 0 {
        Err(io::Error::last_os_error().into())
    } else {
        Ok(())
    }
}
fn status(code: NTSTATUS) -> Result<(), Error> {
    // NtCreateFile is synchronous here; pending is not a successful completion.
    if code != 0 {
        Err(io::Error::from_raw_os_error(unsafe { RtlNtStatusToDosError(code) } as i32).into())
    } else {
        Ok(())
    }
}
struct Handle(HANDLE);
impl Drop for Handle {
    fn drop(&mut self) {
        unsafe {
            CloseHandle(self.0);
        }
    }
}
struct Local(*mut c_void);
impl Drop for Local {
    fn drop(&mut self) {
        unsafe {
            LocalFree(self.0);
        }
    }
}

// All NT calls use generated ABI types. Names and descriptors outlive the call;
// newly returned handles have exactly one owner. No caller supplies nested names
// except the initial, strictly validated drive-root NT object name.
fn open_at(
    root: HANDLE,
    name: &str,
    access: u32,
    share: u32,
    disposition: u32,
    directory: bool,
    sd: *mut c_void,
) -> Result<Handle, Error> {
    let mut name: Vec<u16> = name.encode_utf16().collect();
    let length = u16::try_from(name.len() * 2).map_err(|_| invalid("Name too long"))?;
    let mut string = UNICODE_STRING {
        Length: length,
        MaximumLength: length,
        Buffer: name.as_mut_ptr(),
    };
    let attributes = OBJECT_ATTRIBUTES {
        Length: size_of::<OBJECT_ATTRIBUTES>() as u32,
        RootDirectory: root,
        ObjectName: &mut string,
        Attributes: OBJ_CASE_INSENSITIVE,
        SecurityDescriptor: sd.cast(),
        SecurityQualityOfService: null_mut(),
    };
    let mut handle = null_mut();
    let mut iosb = IO_STATUS_BLOCK::default();
    let result = unsafe {
        nt::NtCreateFile(
            &mut handle,
            access | SYNCHRONIZE,
            &attributes,
            &mut iosb,
            null(),
            FILE_ATTRIBUTE_NORMAL,
            share,
            disposition,
            nt::FILE_OPEN_REPARSE_POINT
                | nt::FILE_SYNCHRONOUS_IO_NONALERT
                | if directory {
                    nt::FILE_DIRECTORY_FILE
                } else {
                    nt::FILE_NON_DIRECTORY_FILE
                },
            null(),
            0,
        )
    };
    // Even an unexpected informational/failure status must not leak a valid
    // returned handle. Retain strict status==0 acceptance, with RAII first.
    let owned = if handle.is_null() || handle == INVALID_HANDLE_VALUE {
        None
    } else {
        Some(Handle(handle))
    };
    status(result)?;
    owned.ok_or_else(|| invalid("Invalid native file handle"))
}
fn information<T: Default>(h: &Handle, class: FILE_INFO_BY_HANDLE_CLASS) -> Result<T, Error> {
    let mut result = T::default();
    win(unsafe {
        GetFileInformationByHandleEx(
            h.0,
            class,
            (&mut result as *mut T).cast(),
            size_of::<T>() as u32,
        )
    })?;
    Ok(result)
}
#[derive(Clone, PartialEq, Eq, Debug)]
struct Identity {
    volume: u64,
    id: [u8; 16],
}
fn inspect(h: &Handle, directory: bool) -> Result<Identity, Error> {
    if unsafe { GetFileType(h.0) } != FILE_TYPE_DISK {
        return Err(invalid("Not a disk object"));
    }
    let tag: FILE_ATTRIBUTE_TAG_INFO = information(h, FileAttributeTagInfo)?;
    let standard: FILE_STANDARD_INFO = information(h, FileStandardInfo)?;
    if tag.FileAttributes & FILE_ATTRIBUTE_REPARSE_POINT != 0
        || tag.ReparseTag != 0
        || (tag.FileAttributes & FILE_ATTRIBUTE_DIRECTORY != 0) != directory
        || standard.Directory != directory
        || standard.DeletePending
        || (!directory && standard.NumberOfLinks != 1)
    {
        return Err(invalid(
            "Unsafe snapshot object type, reparse point, or link count",
        ));
    }
    if directory {
        let case: FILE_CASE_SENSITIVE_INFO = information(h, FileCaseSensitiveInfo)?;
        // Reject every flag, including future unknown flags; old systems that
        // cannot answer the query are unsupported rather than guessed safe.
        if case.Flags != 0 {
            return Err(invalid("Case-sensitive directories unsupported"));
        }
    }
    let id: FILE_ID_INFO = information(h, FileIdInfo)?;
    Ok(Identity {
        volume: id.VolumeSerialNumber,
        id: id.FileId.Identifier,
    })
}
fn local_ntfs(h: &Handle) -> Result<(), Error> {
    let mut device = FILE_FS_DEVICE_INFORMATION::default();
    let mut iosb = IO_STATUS_BLOCK::default();
    status(unsafe {
        nt::NtQueryVolumeInformationFile(
            h.0,
            &mut iosb,
            (&mut device as *mut FILE_FS_DEVICE_INFORMATION).cast(),
            size_of::<FILE_FS_DEVICE_INFORMATION>() as u32,
            nt::FileFsDeviceInformation,
        )
    })?;
    if device.DeviceType != FILE_DEVICE_DISK || device.Characteristics & FILE_REMOTE_DEVICE != 0 {
        return Err(invalid("Only local disk volumes are supported"));
    }
    let mut name = [0u16; 32];
    win(unsafe {
        GetVolumeInformationByHandleW(
            h.0,
            null_mut(),
            0,
            null_mut(),
            null_mut(),
            null_mut(),
            name.as_mut_ptr(),
            name.len() as u32,
        )
    })?;
    let end = name
        .iter()
        .position(|c| *c == 0)
        .ok_or_else(|| invalid("Unknown filesystem"))?;
    if name[..end] != "NTFS".encode_utf16().collect::<Vec<_>>() {
        return Err(invalid("Only NTFS is supported"));
    }
    Ok(())
}

// The first drive root must really be a volume root. A SUBST mapping to a
// nested path could otherwise skip the component-by-component reparse checks.
// Inspect the opened handle; do not check a drive mapping then reopen by path.
fn volume_root(h: &Handle) -> Result<(), Error> {
    let mut buffer = [0u16; 128];
    let length = unsafe {
        GetFinalPathNameByHandleW(
            h.0,
            buffer.as_mut_ptr(),
            buffer.len() as u32,
            VOLUME_NAME_GUID | FILE_NAME_NORMALIZED,
        )
    };
    if length == 0 {
        return Err(io::Error::last_os_error().into());
    }
    if length as usize >= buffer.len() {
        return Err(invalid("Drive root is not a volume root"));
    }
    let name = String::from_utf16(&buffer[..length as usize])
        .map_err(|_| invalid("Invalid volume root name"))?;
    let Some(guid) = name
        .strip_prefix("\\\\?\\Volume{")
        .and_then(|n| n.strip_suffix("}\\"))
    else {
        return Err(invalid("Drive root is not a volume root"));
    };
    if guid.len() != 36
        || !guid.bytes().enumerate().all(|(i, b)| {
            if [8, 13, 18, 23].contains(&i) {
                b == b'-'
            } else {
                b.is_ascii_hexdigit()
            }
        })
    {
        return Err(invalid("Drive root is not a volume root"));
    }
    Ok(())
}

struct User {
    token_data: Vec<usize>,
}
impl User {
    fn current() -> Result<Self, Error> {
        let mut raw = null_mut();
        if unsafe { OpenThreadToken(GetCurrentThread(), TOKEN_QUERY, 1, &mut raw) } == 0 {
            if unsafe { GetLastError() } != ERROR_NO_TOKEN {
                return Err(io::Error::last_os_error().into());
            }
            win(unsafe { OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut raw) })?;
        }
        let token = Handle(raw);
        let mut length = 0;
        unsafe {
            GetTokenInformation(token.0, TokenUser, null_mut(), 0, &mut length);
        }
        if length < size_of::<TOKEN_USER>() as u32 || length > 65536 {
            return Err(invalid("Invalid token user length"));
        }
        let mut token_data = vec![0usize; (length as usize).div_ceil(size_of::<usize>())];
        win(unsafe {
            GetTokenInformation(
                token.0,
                TokenUser,
                token_data.as_mut_ptr().cast(),
                length,
                &mut length,
            )
        })?;
        let user = Self { token_data };
        if unsafe { IsValidSid(user.sid()) } == 0 {
            return Err(invalid("Invalid token SID"));
        }
        Ok(user)
    }
    fn sid(&self) -> PSID {
        unsafe { (*(self.token_data.as_ptr().cast::<TOKEN_USER>())).User.Sid }
    }
    fn descriptor(&self) -> Result<Local, Error> {
        let mut string = null_mut();
        win(unsafe { ConvertSidToStringSidW(self.sid(), &mut string) })?;
        let allocated = Local(string.cast());
        let mut length = 0;
        // SID strings are produced by Windows and bounded by the SID format.
        while length < 256 && unsafe { *string.add(length) } != 0 {
            length += 1;
        }
        if length == 256 {
            return Err(invalid("Invalid SID string"));
        }
        let sid = String::from_utf16(unsafe { std::slice::from_raw_parts(string, length) })
            .map_err(|_| invalid("Invalid SID string"))?;
        drop(allocated);
        let sddl: Vec<u16> = format!("O:{sid}D:P(A;;FA;;;{sid})")
            .encode_utf16()
            .chain(Some(0))
            .collect();
        let mut descriptor = null_mut();
        win(unsafe {
            ConvertStringSecurityDescriptorToSecurityDescriptorW(
                sddl.as_ptr(),
                SDDL_REVISION_1,
                &mut descriptor,
                null_mut(),
            )
        })?;
        Ok(Local(descriptor))
    }
}
fn private(h: &Handle, user: &User) -> Result<(), Error> {
    let mut owner = null_mut();
    let mut acl = null_mut();
    let mut descriptor = null_mut();
    let code = unsafe {
        GetSecurityInfo(
            h.0,
            SE_FILE_OBJECT,
            OWNER_SECURITY_INFORMATION | DACL_SECURITY_INFORMATION,
            &mut owner,
            null_mut(),
            &mut acl,
            null_mut(),
            &mut descriptor,
        )
    };
    if code != ERROR_SUCCESS {
        return Err(io::Error::from_raw_os_error(code as i32).into());
    }
    let _allocated = Local(descriptor);
    let mut control = 0;
    let mut revision = 0;
    if descriptor.is_null() || unsafe { IsValidSecurityDescriptor(descriptor) } == 0 {
        return Err(invalid("Invalid security descriptor"));
    }
    win(unsafe { GetSecurityDescriptorControl(descriptor, &mut control, &mut revision) })?;
    if owner.is_null()
        || unsafe { IsValidSid(owner) } == 0
        || unsafe { EqualSid(owner, user.sid()) } == 0
        || control & SE_DACL_PROTECTED == 0
        || control & SE_DACL_PRESENT == 0
        || acl.is_null()
        || unsafe { IsValidAcl(acl) } == 0
    {
        return Err(invalid(
            "Requires current-user owner and protected non-null valid DACL",
        ));
    }
    // A deliberately small auditable subset: one ordinary, non-inheriting owner
    // allow ACE. Reject every group, deny, object, callback, inheritance, or
    // conditional form rather than trying to approximate effective access.
    if unsafe { (*acl).AceCount } != 1 || unsafe { (*acl).AclRevision } != ACL_REVISION as u8 {
        return Err(invalid("Unsupported DACL form"));
    }
    let mut ace = null_mut();
    win(unsafe { GetAce(acl, 0, &mut ace) })?;
    let acl_start = acl as usize;
    let acl_end = acl_start
        .checked_add(unsafe { (*acl).AclSize } as usize)
        .ok_or_else(|| invalid("ACL length overflow"))?;
    let ace_start = ace as usize;
    if ace_start < acl_start + size_of::<ACL>()
        || ace_start
            .checked_add(size_of::<ACE_HEADER>())
            .is_none_or(|end| end > acl_end)
    {
        return Err(invalid("ACE outside ACL"));
    }
    let header = unsafe { std::ptr::read_unaligned(ace.cast::<ACE_HEADER>()) };
    let sid_offset = offset_of!(ACCESS_ALLOWED_ACE, SidStart);
    if header.AceType != ACCESS_ALLOWED_ACE_TYPE as u8
        || header.AceFlags != 0
        || (header.AceSize as usize) < sid_offset + 8
        || ace_start
            .checked_add(header.AceSize as usize)
            .is_none_or(|end| end > acl_end)
    {
        return Err(invalid("Unsupported ACE form or bounds"));
    }
    let sid_bytes = unsafe { ace.cast::<u8>().add(sid_offset) };
    // Validate the SID header and complete subauthority extent BEFORE invoking
    // SID APIs, which otherwise can inspect beyond a malformed ACE's payload.
    let count = unsafe { *sid_bytes.add(1) } as usize;
    if count > 15 || header.AceSize as usize != sid_offset + 8 + 4 * count {
        return Err(invalid("Invalid ACE SID extent"));
    }
    let sid: PSID = sid_bytes.cast();
    let allow = unsafe { std::ptr::read_unaligned(ace.cast::<ACCESS_ALLOWED_ACE>()) };
    if unsafe { IsValidSid(sid) } == 0
        || unsafe { EqualSid(sid, user.sid()) } == 0
        || allow.Mask != FILE_ALL_ACCESS
    {
        return Err(invalid("DACL must grant only owner full file access"));
    }
    Ok(())
}
fn components(path: &Path) -> Result<Vec<String>, Error> {
    // Deliberately narrower than Win32 normalization: no UNC/device paths,
    // separators other than backslash, ADS, relative/dot/empty names, reserved
    // DOS names, trailing spaces/dots, non-Unicode paths or ambiguous prefixes.
    let path = path
        .to_str()
        .ok_or_else(|| invalid("Non-Unicode path unsupported"))?;
    let b = path.as_bytes();
    if b.len() < 4 || !b[0].is_ascii_alphabetic() || &b[1..3] != b":\\" {
        return Err(invalid("Requires an explicit drive-absolute directory"));
    }
    let mut result = vec![format!("\\??\\{}:\\", &path[..1])];
    for part in path[3..].split('\\') {
        let base = part.split('.').next().unwrap_or("").to_ascii_uppercase();
        if part.is_empty()
            || part == "."
            || part == ".."
            || part.ends_with(['.', ' '])
            || part.chars().any(|c| c < ' ' || "<>:\"/|?*".contains(c))
            || matches!(
                base.as_str(),
                "CON" | "PRN" | "AUX" | "NUL" | "CONIN$" | "CONOUT$"
            )
            || (base.starts_with("COM") || base.starts_with("LPT"))
                && base.len() == 4
                && base.as_bytes()[3].is_ascii_digit()
        {
            return Err(invalid("Ambiguous or unsupported directory component"));
        }
        result.push(part.to_owned());
    }
    Ok(result)
}

pub(super) struct Store {
    directory: Handle,
    lock: Handle,
    identity: Identity,
    lock_identity: Identity,
}
impl Store {
    pub(super) fn open(path: &Path) -> Result<Self, Error> {
        let names = components(path)?;
        let user = User::current()?;
        let mut directory = open_at(
            null_mut(),
            &names[0],
            FILE_READ_ATTRIBUTES | FILE_TRAVERSE | READ_CONTROL,
            FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
            nt::FILE_OPEN,
            true,
            null_mut(),
        )?;
        let volume = inspect(&directory, true)?.volume;
        local_ntfs(&directory)?;
        volume_root(&directory)?;
        for (index, name) in names[1..].iter().enumerate() {
            let access = FILE_READ_ATTRIBUTES
                | FILE_TRAVERSE
                | READ_CONTROL
                | if index + 2 == names.len() {
                    FILE_LIST_DIRECTORY | FILE_ADD_FILE | FILE_DELETE_CHILD
                } else {
                    0
                };
            directory = open_at(
                directory.0,
                name,
                access,
                FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
                nt::FILE_OPEN,
                true,
                null_mut(),
            )?;
            if inspect(&directory, true)?.volume != volume {
                return Err(invalid("Directory changed volume"));
            }
            local_ntfs(&directory)?;
        }
        let identity = inspect(&directory, true)?;
        private(&directory, &user)?;
        let sd = user.descriptor()?;
        let lock = open_at(
            directory.0,
            LOCK_NAME,
            FILE_READ_DATA | FILE_WRITE_DATA | FILE_READ_ATTRIBUTES | READ_CONTROL,
            FILE_SHARE_READ | FILE_SHARE_WRITE,
            nt::FILE_OPEN_IF,
            false,
            sd.0,
        )?;
        if inspect(&lock, false)?.volume != volume {
            return Err(invalid("Lock changed volume"));
        }
        private(&lock, &user)?;
        let lock_identity = inspect(&lock, false)?;
        let store = Self {
            directory,
            lock,
            identity,
            lock_identity,
        };
        store.check(&user)?;
        Ok(store)
    }
    fn check(&self, user: &User) -> Result<(), Error> {
        if inspect(&self.directory, true)? != self.identity {
            return Err(invalid("Directory identity changed"));
        }
        local_ntfs(&self.directory)?;
        private(&self.directory, user)?;
        if inspect(&self.lock, false)?.volume != self.identity.volume {
            return Err(invalid("Lock volume changed"));
        }
        if inspect(&self.lock, false)? != self.lock_identity {
            return Err(invalid("Lock identity changed"));
        }
        private(&self.lock, user)?;
        let named = open_at(
            self.directory.0,
            LOCK_NAME,
            FILE_READ_ATTRIBUTES | READ_CONTROL,
            FILE_SHARE_READ | FILE_SHARE_WRITE,
            nt::FILE_OPEN,
            false,
            null_mut(),
        )?;
        if inspect(&named, false)? != self.lock_identity {
            return Err(invalid("Lock entry identity changed"));
        }
        private(&named, user)
    }
    fn existing(&self, user: &User) -> Result<Option<Handle>, Error> {
        match open_at(
            self.directory.0,
            SNAPSHOT_FILENAME,
            FILE_READ_DATA | FILE_READ_ATTRIBUTES | READ_CONTROL,
            FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
            nt::FILE_OPEN,
            false,
            null_mut(),
        ) {
            Ok(h) => {
                if inspect(&h, false)?.volume != self.identity.volume {
                    return Err(invalid("Snapshot volume changed"));
                }
                private(&h, user)?;
                Ok(Some(h))
            }
            Err(Error::Io(e)) if e.raw_os_error() == Some(ERROR_FILE_NOT_FOUND as i32) => Ok(None),
            Err(e) => Err(e),
        }
    }
    pub(super) fn load(&self) -> Result<Option<String>, Error> {
        let user = User::current()?;
        self.check(&user)?;
        let _lock = Lock::acquire(&self.lock, false)?;
        self.check(&user)?;
        let Some(h) = self.existing(&user)? else {
            return Ok(None);
        };
        let standard: FILE_STANDARD_INFO = information(&h, FileStandardInfo)?;
        if standard.EndOfFile < 0 || standard.EndOfFile as u64 > MAX_SNAPSHOT_BYTES as u64 {
            return Err(invalid("Snapshot exceeds 16 MiB"));
        }
        let mut bytes = Vec::new();
        let mut buffer = [0u8; 65536];
        while bytes.len() <= MAX_SNAPSHOT_BYTES {
            let count = buffer.len().min(MAX_SNAPSHOT_BYTES + 1 - bytes.len());
            let mut read = 0;
            win(unsafe {
                ReadFile(
                    h.0,
                    buffer.as_mut_ptr(),
                    count as u32,
                    &mut read,
                    null_mut(),
                )
            })?;
            if read == 0 {
                break;
            }
            bytes.extend_from_slice(&buffer[..read as usize]);
        }
        let state = String::from_utf8(bytes).map_err(|_| invalid("Snapshot is not UTF-8"))?;
        validate(&state)?;
        self.check(&user)?;
        private(&h, &user)?;
        inspect(&h, false)?;
        Ok(Some(state))
    }
    pub(super) fn save(&self, state: &str) -> Result<SnapshotReceipt, Error> {
        self.save_impl(state, |_| Ok(()), || Ok(()))
    }
    fn save_impl<W, B>(
        &self,
        state: &str,
        before_write: W,
        before_replace: B,
    ) -> Result<SnapshotReceipt, Error>
    where
        W: FnOnce(&Handle) -> Result<(), Error>,
        B: FnOnce() -> Result<(), Error>,
    {
        validate(state)?;
        let user = User::current()?;
        self.check(&user)?;
        let _lock = Lock::acquire(&self.lock, true)?;
        self.check(&user)?;
        self.existing(&user)?;
        let mut random = [0u8; 16];
        getrandom::fill(&mut random).map_err(|_| invalid("Unable to generate staging name"))?;
        let suffix = random
            .iter()
            .map(|b| format!("{b:02x}"))
            .collect::<String>();
        let name = format!(".living-world-snapshot.{suffix}.tmp");
        let sd = user.descriptor()?;
        let h = open_at(
            self.directory.0,
            &name,
            FILE_WRITE_DATA | FILE_READ_ATTRIBUTES | READ_CONTROL | DELETE,
            FILE_SHARE_READ,
            nt::FILE_CREATE,
            false,
            sd.0,
        )?;
        let mut staged = Staging {
            h,
            committed: false,
        };
        inspect(&staged.h, false)?;
        private(&staged.h, &user)?;
        before_write(&staged.h)?;
        write_all(&staged.h, state.as_bytes())?;
        win(unsafe { FlushFileBuffers(staged.h.0) })?;
        before_replace()?;
        self.existing(&user)?;
        self.check(&user)?;
        if inspect(&staged.h, false)?.volume != self.identity.volume {
            return Err(invalid("Staging volume changed"));
        }
        private(&staged.h, &user)?;
        rename(&staged.h, &self.directory, SNAPSHOT_FILENAME)?;
        staged.committed = true;
        // Rename succeeded: never turn a later durability observation into a
        // precommit failure. No unsupported directory/privileged volume flush.
        Ok(SnapshotReceipt {
            filename: SNAPSHOT_FILENAME,
            bytes: state.len(),
            directory_synced: false,
        })
    }
}
fn validate(state: &str) -> Result<(), Error> {
    if state.len() > MAX_SNAPSHOT_BYTES {
        return Err(invalid("Snapshot exceeds 16 MiB"));
    }
    serde_json::from_str::<Box<serde_json::value::RawValue>>(state)
        .map_err(|_| invalid("Snapshot is not valid JSON"))?;
    Ok(())
}
fn write_all(h: &Handle, mut bytes: &[u8]) -> Result<(), Error> {
    while !bytes.is_empty() {
        let mut written = 0;
        win(unsafe {
            WriteFile(
                h.0,
                bytes.as_ptr(),
                bytes.len().min(u32::MAX as usize) as u32,
                &mut written,
                null_mut(),
            )
        })?;
        if written == 0 {
            return Err(
                io::Error::new(io::ErrorKind::WriteZero, "Zero-length snapshot write").into(),
            );
        }
        bytes = &bytes[written as usize..];
    }
    Ok(())
}
struct Lock<'a>(&'a Handle);
impl<'a> Lock<'a> {
    fn acquire(h: &'a Handle, exclusive: bool) -> Result<Self, Error> {
        let mut overlapped = OVERLAPPED::default();
        win(unsafe {
            LockFileEx(
                h.0,
                LOCKFILE_FAIL_IMMEDIATELY
                    | if exclusive {
                        LOCKFILE_EXCLUSIVE_LOCK
                    } else {
                        0
                    },
                0,
                1,
                0,
                &mut overlapped,
            )
        })?;
        Ok(Self(h))
    }
}
impl Drop for Lock<'_> {
    fn drop(&mut self) {
        let mut o = OVERLAPPED::default();
        unsafe {
            UnlockFileEx(self.0.0, 0, 1, 0, &mut o);
        }
    }
}
struct Staging {
    h: Handle,
    committed: bool,
}
impl Drop for Staging {
    fn drop(&mut self) {
        if !self.committed {
            let disposition = nt::FILE_DISPOSITION_INFORMATION { DeleteFile: true };
            let mut iosb = IO_STATUS_BLOCK::default();
            // Best-effort removal by owned handle, never a substituted pathname.
            // Crash may leave a harmless private orphan. Never scan/delete it.
            unsafe {
                nt::NtSetInformationFile(
                    self.h.0,
                    &mut iosb,
                    (&disposition as *const nt::FILE_DISPOSITION_INFORMATION).cast(),
                    size_of::<nt::FILE_DISPOSITION_INFORMATION>() as u32,
                    nt::FileDispositionInformation,
                );
            }
        }
    }
}
fn rename(file: &Handle, directory: &Handle, name: &str) -> Result<(), Error> {
    let name: Vec<u16> = name.encode_utf16().collect();
    let bytes = offset_of!(nt::FILE_RENAME_INFORMATION, FileName) + name.len() * 2;
    // usize allocation provides alignment required by the generated struct;
    // allocate at least its full size, including ABI trailing padding.
    let mut storage = vec![
        0usize;
        bytes
            .max(size_of::<nt::FILE_RENAME_INFORMATION>())
            .div_ceil(size_of::<usize>())
    ];
    let info = storage.as_mut_ptr().cast::<nt::FILE_RENAME_INFORMATION>();
    unsafe {
        (*info).Anonymous.ReplaceIfExists = true;
        (*info).RootDirectory = directory.0;
        (*info).FileNameLength = (name.len() * 2) as u32;
        std::ptr::copy_nonoverlapping(
            name.as_ptr(),
            std::ptr::addr_of_mut!((*info).FileName).cast::<u16>(),
            name.len(),
        );
        let mut iosb = IO_STATUS_BLOCK::default();
        status(nt::NtSetInformationFile(
            file.0,
            &mut iosb,
            info.cast(),
            bytes as u32,
            nt::FileRenameInformation,
        ))
    }
}

#[cfg(test)]
#[path = "foundry_snapshot_windows_tests.rs"]
mod tests;
