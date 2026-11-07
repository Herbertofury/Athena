//! Verified connection contract; configured synchronization is not a power-loss test.
use rusqlite::Connection;

pub(crate) fn configure(c: &Connection) -> rusqlite::Result<()> {
    if !c.is_autocommit() {
        return Err(rusqlite::Error::InvalidQuery);
    }
    c.busy_timeout(std::time::Duration::from_secs(5))?;
    // EXTRA additionally synchronizes the directory after DELETE-journal unlink.
    // Do not silently migrate an existing database's journal mode.
    c.execute_batch("PRAGMA foreign_keys=ON; PRAGMA synchronous=EXTRA;")?;
    verify(c)
}

fn verify(c: &Connection) -> rusqlite::Result<()> {
    let sync: i64 = c.query_row("PRAGMA synchronous", [], |r| r.get(0))?;
    let foreign_keys: i64 = c.query_row("PRAGMA foreign_keys", [], |r| r.get(0))?;
    let mode: String = c.query_row("PRAGMA journal_mode", [], |r| r.get(0))?;
    let permitted_mode = matches!(mode.as_str(), "delete" | "truncate" | "persist" | "wal")
        || (mode == "memory" && c.path().is_some_and(str::is_empty));
    if sync != 3 || foreign_keys != 1 || !permitted_mode {
        return Err(rusqlite::Error::InvalidQuery);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_relaxed_or_missing_contract() {
        let c = Connection::open_in_memory().unwrap();
        configure(&c).unwrap();
        c.execute_batch("PRAGMA synchronous=FULL;").unwrap();
        assert!(verify(&c).is_err());
        configure(&c).unwrap();
        c.execute_batch("PRAGMA foreign_keys=OFF;").unwrap();
        assert!(verify(&c).is_err());
        configure(&c).unwrap();
        c.execute_batch("PRAGMA journal_mode=OFF;").unwrap();
        assert!(configure(&c).is_err());
    }
    #[test]
    fn refuses_configuration_inside_transaction() {
        let c = Connection::open_in_memory().unwrap();
        c.execute_batch("BEGIN;").unwrap();
        assert!(configure(&c).is_err());
        assert!(!c.is_autocommit());
        c.execute_batch("ROLLBACK;").unwrap();
    }
    #[test]
    fn disk_reopen_preserves_rows_and_journal_mode() {
        let root = std::env::temp_dir().join(format!(
            "atlas-sync-contract-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir(&root).unwrap();
        for mode in ["DELETE", "WAL"] {
            let path = root.join(format!("{mode}.sqlite"));
            let c = Connection::open(&path).unwrap();
            c.pragma_update(None, "journal_mode", mode).unwrap();
            c.execute_batch(
                "CREATE TABLE existing(v BLOB); INSERT INTO existing VALUES(x'00ff01');",
            )
            .unwrap();
            drop(c);
            let c = Connection::open(&path).unwrap();
            let before: String = c
                .query_row("PRAGMA journal_mode", [], |r| r.get(0))
                .unwrap();
            configure(&c).unwrap();
            assert_eq!(
                c.query_row("PRAGMA journal_mode", [], |r| r.get::<_, String>(0))
                    .unwrap(),
                before
            );
            assert_eq!(
                c.query_row("SELECT v FROM existing", [], |r| r.get::<_, Vec<u8>>(0))
                    .unwrap(),
                vec![0, 255, 1]
            );
            c.execute_batch("PRAGMA journal_mode=MEMORY;").unwrap();
            assert!(configure(&c).is_err());
        }
    }
}
