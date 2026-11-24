//! Isolated body-buffer candidate; network and status policy remain with the caller.
use std::{error::Error, io::Read};
type Result<T> = std::result::Result<T, Box<dyn Error>>;
pub fn baseline(reader: impl Read, max: u64, advertised: Option<u64>) -> Result<Vec<u8>> {
    if advertised.is_some_and(|n| n > max) {
        return Err("Response exceeds size budget".into());
    }
    let mut bytes = Vec::new();
    reader
        .take(max.checked_add(1).ok_or("Invalid body budget")?)
        .read_to_end(&mut bytes)?;
    if bytes.len() as u64 > max {
        return Err("Response exceeds size budget".into());
    }
    Ok(bytes)
}
pub fn reserved(reader: impl Read, max: u64, advertised: Option<u64>) -> Result<Vec<u8>> {
    if advertised.is_some_and(|n| n > max) {
        return Err("Response exceeds size budget".into());
    }
    let limit = max.checked_add(1).ok_or("Invalid body budget")?;
    let mut bytes = Vec::new();
    if let Some(length) = advertised {
        bytes.try_reserve_exact(usize::try_from(length)?)?;
    }
    reader.take(limit).read_to_end(&mut bytes)?;
    if bytes.len() as u64 > max {
        return Err("Response exceeds size budget".into());
    }
    Ok(bytes)
}

/// Wait for actual body bytes before reserving. Treat length as a bounded hint,
/// never as permission to skip EOF, byte-budget or transport-error checks.
pub fn adaptive(reader: impl Read, max: u64, advertised: Option<u64>) -> Result<Vec<u8>> {
    if advertised.is_some_and(|n| n > max) {
        return Err("Response exceeds size budget".into());
    }
    let limit = max.checked_add(1).ok_or("Invalid body budget")?;
    let mut source = reader.take(limit);
    let mut prefix = [0u8; 4096];
    let n = loop {
        match source.read(&mut prefix) {
            Err(e) if e.kind() == std::io::ErrorKind::Interrupted => continue,
            result => break result?,
        }
    };
    if n as u64 > max {
        return Err("Response exceeds size budget".into());
    }
    if n == 0 {
        return Ok(Vec::new());
    }
    let capacity = usize::try_from(advertised.unwrap_or(n as u64).min(64 * 1024))?.max(n);
    let mut bytes = Vec::new();
    bytes.try_reserve_exact(capacity)?;
    bytes.extend_from_slice(&prefix[..n]);
    source.read_to_end(&mut bytes)?;
    if bytes.len() as u64 > max {
        return Err("Response exceeds size budget".into());
    }
    Ok(bytes)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{self, Cursor};
    #[test]
    fn full_bytes_and_bounds_match_across_hints() {
        for size in [
            0_usize, 1, 31, 4095, 4096, 4097, 65535, 65536, 65537, 131072,
        ] {
            let input: Vec<_> = (0..size).map(|i| (i % 251) as u8).collect();
            for max in [
                0,
                size as u64,
                size.saturating_sub(1) as u64,
                size as u64 + 17,
            ] {
                for hint in [None, Some(0), Some(size as u64), Some(max + 1)] {
                    let expected = baseline(Cursor::new(&input), max, hint);
                    let candidate = adaptive(Cursor::new(&input), max, hint);
                    assert_eq!(expected.is_ok(), candidate.is_ok());
                    if let (Ok(a), Ok(b)) = (expected, candidate) {
                        assert_eq!(a, input);
                        assert_eq!(a, b);
                    }
                }
            }
        }
    }
    struct InterruptedOnce {
        once: bool,
        data: Cursor<Vec<u8>>,
    }
    impl Read for InterruptedOnce {
        fn read(&mut self, b: &mut [u8]) -> io::Result<usize> {
            if !self.once {
                self.once = true;
                return Err(io::ErrorKind::Interrupted.into());
            }
            self.data.read(b)
        }
    }
    #[test]
    fn interrupted_first_read_and_misleading_empty_hint_preserve_data() {
        let input = vec![0, 255, 3, 4];
        assert_eq!(
            adaptive(
                InterruptedOnce {
                    once: false,
                    data: Cursor::new(input.clone())
                },
                32,
                Some(0)
            )
            .unwrap(),
            input
        );
    }
    #[test]
    fn impossible_budget_rejected_before_reading() {
        struct Unreadable;
        impl Read for Unreadable {
            fn read(&mut self, _: &mut [u8]) -> io::Result<usize> {
                panic!("Must not read")
            }
        }
        assert!(adaptive(Unreadable, u64::MAX, None).is_err());
        assert!(adaptive(Unreadable, 1, Some(2)).is_err());
    }
}
