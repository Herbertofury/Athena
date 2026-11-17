//! Bounds-checked USN_RECORD_V2 decoder. Unknown versions fail closed.
use crate::Entry;
use std::io::{self, Error, ErrorKind};
fn invalid() -> Error {
    Error::new(
        ErrorKind::InvalidData,
        "malformed or unsupported USN record",
    )
}
fn u16at(b: &[u8], p: usize) -> u16 {
    u16::from_le_bytes(b[p..p + 2].try_into().unwrap())
}
fn u32at(b: &[u8], p: usize) -> u32 {
    u32::from_le_bytes(b[p..p + 4].try_into().unwrap())
}
fn u64at(b: &[u8], p: usize) -> u64 {
    u64::from_le_bytes(b[p..p + 8].try_into().unwrap())
}
pub fn decode_page(bytes: &[u8], mut emit: impl FnMut(Entry)) -> io::Result<u64> {
    if bytes.len() < 8 {
        return Err(invalid());
    }
    let next = u64at(bytes, 0);
    let mut p = 8;
    while p < bytes.len() {
        let b = &bytes[p..];
        if b.len() < 60 {
            return Err(invalid());
        }
        let len = u32at(b, 0) as usize;
        if len < 60 || len > b.len() || u16at(b, 4) != 2 {
            return Err(invalid());
        }
        let name_len = u16at(b, 56) as usize;
        let offset = u16at(b, 58) as usize;
        if offset < 60 || offset % 2 != 0 || name_len % 2 != 0 || offset + name_len > len {
            return Err(invalid());
        }
        let name = b[offset..offset + name_len]
            .chunks_exact(2)
            .map(|x| u16::from_le_bytes([x[0], x[1]]))
            .collect();
        emit(Entry::Ntfs {
            id: u64at(b, 8),
            parent: u64at(b, 16),
            attributes: u32at(b, 52),
            name,
        });
        p += len;
    }
    Ok(next)
}
#[cfg(test)]
mod tests {
    use super::*;
    fn page() -> Vec<u8> {
        let mut b = vec![0; 72];
        b[0..8].copy_from_slice(&77u64.to_le_bytes());
        b[8..12].copy_from_slice(&64u32.to_le_bytes());
        b[12..14].copy_from_slice(&2u16.to_le_bytes());
        b[64..66].copy_from_slice(&4u16.to_le_bytes());
        b[66..68].copy_from_slice(&60u16.to_le_bytes());
        b[68..72].copy_from_slice(&[65, 0, 0, 216]);
        b
    }
    #[test]
    fn valid_preserves_utf16() {
        let mut out = Vec::new();
        assert_eq!(decode_page(&page(), |e| out.push(e)).unwrap(), 77);
        match &out[0] {
            Entry::Ntfs { name, .. } => assert_eq!(name, &vec![65, 0xd800]),
            _ => panic!(),
        }
    }
    #[test]
    fn truncated_never_panics() {
        let b = page();
        for n in 0..b.len() {
            let r = decode_page(&b[..n], |_| {});
            if n != 8 {
                assert!(r.is_err(), "{n}");
            }
        }
    }
    #[test]
    fn wrong_version() {
        let mut b = page();
        b[12] = 3;
        assert!(decode_page(&b, |_| {}).is_err());
    }
    #[test]
    fn invalid_name() {
        let mut b = page();
        b[66] = 59;
        assert!(decode_page(&b, |_| {}).is_err());
    }
    #[test]
    fn zero_record() {
        let mut b = page();
        b[8] = 0;
        assert!(decode_page(&b, |_| {}).is_err());
    }
}
