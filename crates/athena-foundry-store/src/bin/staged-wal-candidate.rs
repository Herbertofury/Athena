//! Experimental worker: only invoke on disposable captured copies via the R&D wrapper.
use rusqlite::{
    Connection, OpenFlags,
    backup::{Backup, StepResult},
};
use std::{
    fs,
    io::Read,
    path::Path,
    time::{Duration, Instant},
};
type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;
const LIMIT: u64 = 64 * 1024 * 1024;
fn runtime_gate(version: i32) -> Result<()> {
    if version < 3_054_000 {
        return Err("SQLite 3.54.0 or newer required before opening captured input".into());
    }
    Ok(())
}
fn headers(db: &[u8], wal: &[u8]) -> Result<()> {
    if db.len() < 100 || &db[..16] != b"SQLite format 3\0" || db[18..20] != [2, 2] || wal.len() < 32
    {
        return Err("Invalid SQLite/WAL header".into());
    }
    let page = u16::from_be_bytes([db[16], db[17]]) as u32;
    let page = if page == 1 { 65536 } else { page };
    let magic = u32::from_be_bytes(wal[..4].try_into()?);
    let wal_page = u32::from_be_bytes(wal[8..12].try_into()?);
    if !(512..=65536).contains(&page)
        || !page.is_power_of_two()
        || ![0x377f0682, 0x377f0683].contains(&magic)
        || u32::from_be_bytes(wal[4..8].try_into()?) != 3_007_000
        || wal_page != page
    {
        return Err("Invalid or mismatched SQLite/WAL page size".into());
    }
    Ok(())
}
fn validate_frames(wal: &[u8]) -> Result<()> {
    if wal.len() < 32 {
        return Err("Truncated WAL".into());
    }
    let page = u32::from_be_bytes(wal[8..12].try_into()?) as usize;
    if !(512..=65536).contains(&page)
        || !page.is_power_of_two()
        || !(wal.len() - 32).is_multiple_of(page + 24)
    {
        return Err("Truncated WAL frame".into());
    }
    let little = wal[..4] == 0x377f0682u32.to_be_bytes();
    let mut sums = [0u32; 2];
    let checksum = |data: &[u8], sums: &mut [u32; 2]| {
        for pair in data.as_chunks::<8>().0 {
            let word = |b: &[u8]| {
                if little {
                    u32::from_le_bytes(b.try_into().unwrap())
                } else {
                    u32::from_be_bytes(b.try_into().unwrap())
                }
            };
            sums[0] = sums[0].wrapping_add(word(&pair[..4])).wrapping_add(sums[1]);
            sums[1] = sums[1].wrapping_add(word(&pair[4..])).wrapping_add(sums[0]);
        }
    };
    let matches = |sums: [u32; 2], bytes: &[u8]| {
        sums[0].to_be_bytes() == bytes[..4] && sums[1].to_be_bytes() == bytes[4..8]
    };
    checksum(&wal[..24], &mut sums);
    if !matches(sums, &wal[24..32]) {
        return Err("WAL header checksum failed".into());
    }
    for frame in wal[32..].chunks_exact(page + 24) {
        if frame[8..16] != wal[16..24] || frame[..4] == [0, 0, 0, 0] {
            return Err("WAL frame identity failed".into());
        }
        checksum(&frame[..8], &mut sums);
        checksum(&frame[24..], &mut sums);
        if !matches(sums, &frame[16..24]) {
            return Err("WAL frame checksum failed".into());
        }
    }
    Ok(())
}
fn prefix(path: &Path, count: usize) -> Result<Vec<u8>> {
    let mut out = vec![];
    fs::File::open(path)?
        .take(count as u64)
        .read_to_end(&mut out)?;
    Ok(out)
}
fn integrity(db: &Connection) -> Result<()> {
    let mut q = db.prepare("PRAGMA integrity_check(1)")?;
    let mut rows = q.query([])?;
    if rows
        .next()?
        .ok_or("Missing integrity result")?
        .get::<_, String>(0)?
        != "ok"
        || rows.next()?.is_some()
    {
        return Err("Staged integrity failed".into());
    }
    Ok(())
}
fn run(source: &Path, target: &Path) -> Result<()> {
    runtime_gate(rusqlite::version_number())?; // Must precede every Connection open.
    let wal = source.with_file_name(format!(
        "{}-wal",
        source
            .file_name()
            .ok_or("Missing filename")?
            .to_str()
            .ok_or("UTF8 path required")?
    ));
    let mut total = 0;
    for p in [source, wal.as_path()] {
        let m = fs::symlink_metadata(p)?;
        if !m.is_file() || m.file_type().is_symlink() {
            return Err("Ordinary staged files required".into());
        }
        total += m.len();
    }
    if total > LIMIT {
        return Err("Combined staged input exceeds limit".into());
    }
    let wal_bytes = prefix(&wal, LIMIT as usize + 1)?;
    if wal_bytes.len() as u64 > LIMIT {
        return Err("WAL grew beyond limit".into());
    }
    headers(&prefix(source, 100)?, &wal_bytes)?;
    validate_frames(&wal_bytes)?;
    if target.exists() || target.is_symlink() {
        return Err("Target must be new".into());
    }
    let deadline = Instant::now() + Duration::from_secs(8);
    let mut db = Connection::open_with_flags(source, OpenFlags::SQLITE_OPEN_READ_WRITE)?;
    db.busy_timeout(Duration::ZERO)?;
    db.progress_handler(1000, Some(move || Instant::now() >= deadline))?;
    let pages = u64::try_from(db.query_row("PRAGMA page_count", [], |r| r.get::<_, i64>(0))?)?;
    let page_size = u64::try_from(db.query_row("PRAGMA page_size", [], |r| r.get::<_, i64>(0))?)?;
    if pages.checked_mul(page_size).is_none_or(|n| n > LIMIT) {
        return Err("Recovered logical database exceeds limit".into());
    }
    integrity(&db)?;
    fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(target)?;
    let mut out = Connection::open_with_flags(target, OpenFlags::SQLITE_OPEN_READ_WRITE)?;
    out.busy_timeout(Duration::ZERO)?;
    out.progress_handler(1000, Some(move || Instant::now() >= deadline))?;
    {
        let backup = Backup::new(&db, &mut out)?;
        let mut done = false;
        for _ in 0..2048 {
            if Instant::now() >= deadline {
                return Err("Backup deadline exceeded".into());
            }
            let step = backup.step(128)?;
            let progress = backup.progress();
            if u64::try_from(progress.pagecount)?
                .checked_mul(page_size)
                .is_none_or(|n| n > LIMIT)
                || fs::metadata(target)?.len() > LIMIT
            {
                return Err("Backup output exceeds limit".into());
            }
            match step {
                StepResult::Done => {
                    done = true;
                    break;
                }
                StepResult::More => (),
                _ => return Err("Backup busy or locked; no retry".into()),
            }
        }
        if !done {
            return Err("Backup step budget exceeded".into());
        }
    }
    let mode: String = out.query_row("PRAGMA journal_mode=DELETE", [], |r| r.get(0))?;
    if mode != "delete" {
        return Err("Standalone journal mode not established".into());
    }
    integrity(&out)?;
    drop(out);
    drop(db);
    if fs::metadata(target)?.len() > LIMIT || prefix(target, 20)?[18..20] != [1, 1] {
        return Err("Standalone output bounds failed".into());
    }
    println!(
        "{{\"candidate\":true,\"sqlite_runtime\":\"{}\",\"sqlite_version_number\":{}}}",
        rusqlite::version(),
        rusqlite::version_number()
    );
    Ok(())
}
fn main() {
    let a: Vec<_> = std::env::args_os().collect();
    let result = if a.len() == 3 {
        run(Path::new(&a[1]), Path::new(&a[2]))
    } else {
        Err("Usage: staged-wal-candidate DISPOSABLE_COPY NEW_STAGED_OUTPUT".into())
    };
    if let Err(e) = result {
        eprintln!("{e}");
        std::process::exit(1);
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn runtime_refuses_old_before_open() {
        assert!(runtime_gate(3_053_999).is_err());
        assert!(runtime_gate(3_054_000).is_ok());
    }
    #[test]
    fn mismatch_and_truncation_refuse() {
        let mut db = vec![0; 100];
        db[..16].copy_from_slice(b"SQLite format 3\0");
        db[16] = 16;
        db[18..20].copy_from_slice(&[2, 2]);
        let mut wal = vec![0; 32];
        wal[..4].copy_from_slice(&0x377f0682u32.to_be_bytes());
        wal[4..8].copy_from_slice(&3_007_000u32.to_be_bytes());
        wal[8..12].copy_from_slice(&4096u32.to_be_bytes());
        assert!(headers(&db, &wal).is_ok());
        wal[8..12].copy_from_slice(&8192u32.to_be_bytes());
        assert!(headers(&db, &wal).is_err());
        assert!(headers(&db, &wal[..16]).is_err());
    }
}
