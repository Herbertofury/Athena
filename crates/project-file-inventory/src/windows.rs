use crate::{Entry, Report, usn};
use std::{
    ffi::c_void,
    io, ptr,
    sync::atomic::{AtomicBool, Ordering},
};
type Handle = *mut c_void;
#[link(name = "kernel32")]
unsafe extern "system" {
    fn CreateFileW(
        name: *const u16,
        access: u32,
        share: u32,
        security: *const c_void,
        creation: u32,
        flags: u32,
        template: Handle,
    ) -> Handle;
    fn CloseHandle(handle: Handle) -> i32;
    fn DeviceIoControl(
        handle: Handle,
        code: u32,
        input: *const c_void,
        input_len: u32,
        output: *mut c_void,
        output_len: u32,
        returned: *mut u32,
        overlapped: *mut c_void,
    ) -> i32;
    fn GetVolumeInformationW(
        root: *const u16,
        name: *mut u16,
        name_len: u32,
        serial: *mut u32,
        max_component: *mut u32,
        flags: *mut u32,
        fs: *mut u16,
        fs_len: u32,
    ) -> i32;
    fn GetDriveTypeW(root: *const u16) -> u32;
}
struct OwnedHandle(Handle);
impl Drop for OwnedHandle {
    fn drop(&mut self) {
        unsafe {
            CloseHandle(self.0);
        }
    }
}
#[repr(C)]
struct EnumData {
    start: u64,
    low: i64,
    high: i64,
}
fn wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(Some(0)).collect()
}
pub fn enumerate(
    drive: char,
    cancel: &AtomicBool,
    mut emit: impl FnMut(Entry),
) -> io::Result<Report> {
    let root = wide(&format!("{}:\\", drive));
    let mut fs = [0u16; 32];
    // Reject mapped network shares before attempting a local volume handle.
    if unsafe { GetDriveTypeW(root.as_ptr()) } == 4 {
        return Err(io::Error::new(
            io::ErrorKind::Unsupported,
            "network volume: use directory fallback",
        ));
    }
    if unsafe {
        GetVolumeInformationW(
            root.as_ptr(),
            ptr::null_mut(),
            0,
            ptr::null_mut(),
            ptr::null_mut(),
            ptr::null_mut(),
            fs.as_mut_ptr(),
            fs.len() as u32,
        )
    } == 0
    {
        return Err(io::Error::last_os_error());
    }
    if &fs[..5] != [78, 84, 70, 83, 0] {
        return Err(io::Error::new(
            io::ErrorKind::Unsupported,
            "non-NTFS volume: use directory fallback",
        ));
    }
    let device = wide(&format!("\\\\.\\{}:", drive));
    // Read-only access; no backup privilege adjustment, journal creation, raw writes or UAC.
    let h = unsafe {
        CreateFileW(
            device.as_ptr(),
            0x80000000,
            7,
            ptr::null(),
            3,
            0,
            ptr::null_mut(),
        )
    };
    if h as isize == -1 {
        return Err(io::Error::last_os_error());
    }
    let h = OwnedHandle(h);
    let mut request = EnumData {
        start: 0,
        low: 0,
        high: i64::MAX,
    };
    let mut buffer = vec![0u8; 64 * 1024];
    let mut report = Report::default();
    loop {
        if cancel.load(Ordering::Relaxed) {
            report.cancelled = true;
            return Ok(report);
        }
        let mut returned = 0u32;
        let ok = unsafe {
            DeviceIoControl(
                h.0,
                0x000900b3,
                (&request as *const EnumData).cast(),
                std::mem::size_of::<EnumData>() as u32,
                buffer.as_mut_ptr().cast(),
                buffer.len() as u32,
                &mut returned,
                ptr::null_mut(),
            )
        };
        if ok == 0 {
            let e = io::Error::last_os_error();
            if e.raw_os_error() == Some(38) {
                return Ok(report);
            }
            return Err(e);
        }
        if returned as usize > buffer.len() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "invalid returned length",
            ));
        }
        let next = usn::decode_page(&buffer[..returned as usize], |entry| {
            report.entries += 1;
            emit(entry);
        })?;
        if next <= request.start {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "non-advancing enumeration cursor",
            ));
        }
        request.start = next;
    }
}
