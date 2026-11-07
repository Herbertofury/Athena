//! Same-transaction prepared-statement experiment; no relaxed durability settings.
use rusqlite::{Connection, params};
use serde::Serialize;
use std::{path::Path, time::Instant};
#[derive(Debug, Serialize)]
pub struct Sample {
    pub payload_bytes: usize,
    pub round: usize,
    pub strategy: String,
    pub write_commit_ns: u128,
    pub read_all_ns: u128,
    pub database_bytes: u64,
    pub rows: usize,
    pub complete_output_equal: bool,
}
pub fn run(directory: &Path) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    // Refuse to reuse a directory, so this experiment cannot overwrite an existing database.
    std::fs::create_dir(directory)?;
    let mut samples = Vec::new();
    for payload_bytes in [512usize, 8192, 65536] {
        let rows: Vec<(i64, Vec<u8>)> = (0..256)
            .map(|i| {
                (
                    i,
                    (0..payload_bytes)
                        .map(|n| ((n * 17 + i as usize * 13) % 251) as u8)
                        .collect(),
                )
            })
            .collect();
        for round in 0..7 {
            let strategies = if round % 2 == 0 {
                [false, true]
            } else {
                [true, false]
            };
            for reuse in strategies {
                let strategy = if reuse {
                    "prepare_once"
                } else {
                    "prepare_per_record"
                };
                let path = directory.join(format!("{payload_bytes}-{round}-{strategy}.sqlite"));
                let mut c = Connection::open(&path)?;
                c.execute_batch("PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; CREATE TABLE cards(id INTEGER PRIMARY KEY,payload BLOB NOT NULL);")?;
                let sync: i64 = c.query_row("PRAGMA synchronous", [], |r| r.get(0))?;
                if sync != 2 {
                    return Err("FULL durability setting not applied".into());
                }
                let start = Instant::now();
                let tx = c.transaction()?;
                if reuse {
                    let mut statement =
                        tx.prepare("INSERT INTO cards(id,payload) VALUES(?1,?2)")?;
                    for (id, payload) in &rows {
                        statement.execute(params![id, payload])?;
                    }
                } else {
                    for (id, payload) in &rows {
                        tx.execute(
                            "INSERT INTO cards(id,payload) VALUES(?1,?2)",
                            params![id, payload],
                        )?;
                    }
                }
                tx.commit()?;
                let write_commit_ns = start.elapsed().as_nanos();
                drop(c);
                // Reopen and verify every byte, not only row counts. OS caches are not claimed cold.
                let c = Connection::open(&path)?;
                let start = Instant::now();
                let mut s = c.prepare("SELECT id,payload FROM cards ORDER BY id")?;
                let read: Vec<(i64, Vec<u8>)> = s
                    .query_map([], |r| Ok((r.get(0)?, r.get(1)?)))?
                    .collect::<Result<_, _>>()?;
                let read_all_ns = start.elapsed().as_nanos();
                let equal = read == rows;
                if !equal {
                    return Err("Complete stored payload mismatch".into());
                }
                let integrity: String = c.query_row("PRAGMA integrity_check", [], |r| r.get(0))?;
                if integrity != "ok" {
                    return Err("Integrity check failed".into());
                }
                samples.push(Sample {
                    payload_bytes,
                    round,
                    strategy: strategy.into(),
                    write_commit_ns,
                    read_all_ns,
                    database_bytes: std::fs::metadata(&path)?.len(),
                    rows: rows.len(),
                    complete_output_equal: equal,
                });
            }
        }
    }
    Ok(
        serde_json::json!({"schema_version":1,"scope":"measured_local_generated_workload","sqlite_version":rusqlite::version(),"os":std::env::consts::OS,"arch":std::env::consts::ARCH,"rows_per_transaction":256,"journal_mode":"DELETE","synchronous":"FULL","rounds":7,"samples":samples,"limitations":["Not a comparison with any project's current implementation","Virtualized filesystem and host caches; no physical power-loss test","Reopening does not establish a cold OS cache","No memory or concurrent UI measurements","Same single transaction and exact input in both strategies; not a transaction-batching comparison"]}),
    )
}
