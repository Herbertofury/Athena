//! Explicitly enabled bounded recovery log. Typed events, no arbitrary history payload.
use crate::{Result, Store, backup};
use rusqlite::{OptionalExtension, Transaction, params};
use serde::Serialize;
use sha2::{Digest, Sha256};
const DDL: &str = "CREATE TABLE workspace_revisions(id INTEGER PRIMARY KEY AUTOINCREMENT,json TEXT NOT NULL,sha256 TEXT NOT NULL,event TEXT NOT NULL CHECK(event IN ('baseline','save','restore')),source_revision INTEGER); PRAGMA user_version=3;";
#[derive(Debug, Serialize)]
pub struct Revision {
    pub id: i64,
    pub event: String,
    pub source_revision: Option<i64>,
}
pub(crate) fn append(
    tx: &Transaction<'_>,
    json: &str,
    event: &str,
    source: Option<i64>,
) -> Result<i64> {
    let digest = digest_hex(json);
    tx.execute(
        "INSERT INTO workspace_revisions(json,sha256,event,source_revision) VALUES(?1,?2,?3,?4)",
        params![json, digest, event, source],
    )?;
    let id = tx.last_insert_rowid();
    // Keep the last50 immutable snapshots. Trimming is explicit policy, not an unbounded audit archive.
    tx.execute("DELETE FROM workspace_revisions WHERE id NOT IN (SELECT id FROM workspace_revisions ORDER BY id DESC LIMIT 50)",[])?;
    Ok(id)
}
impl Store {
    /// Read and authenticate a retained typed snapshot without mutation.
    pub fn read_revision(&self, id: i64) -> Result<String> {
        if id < 1 {
            return Err("Revision ID must be positive".into());
        }
        let schema: i64 = self.db.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if !matches!(schema, 3..=13) {
            return Err("Explicit upgrade-history required".into());
        }
        let (text, digest): (String, String) = self.db.query_row(
            "SELECT json,sha256 FROM workspace_revisions WHERE id=?1",
            [id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )?;
        if text.len() > 4_000_000 || digest_hex(&text) != digest {
            return Err("Revision digest mismatch or size limit; no changes made".into());
        }
        let text = backup::normalize(&text)?;
        backup::require_storage_version(&text, schema)?;
        Ok(text)
    }

    pub fn migrate_history(&mut self) -> Result<()> {
        let tx = self.db.transaction()?;
        let version: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if matches!(version, 3..=13) {
            return Ok(());
        }
        if version != 2 {
            return Err("Run upgrade-backups first; history requires schema2".into());
        }
        let active: Option<String> = tx
            .query_row(
                "SELECT json FROM workspace_backup WHERE singleton=1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        let active = active
            .map(|v| -> Result<String> {
                let n = backup::normalize(&v)?;
                backup::require_storage_version(&n, version)?;
                Ok(n)
            })
            .transpose()?;
        tx.execute_batch(DDL)?;
        if let Some(json) = active {
            append(&tx, &json, "baseline", None)?;
        }
        tx.commit()?;
        Ok(())
    }
    pub fn revisions(&self) -> Result<Vec<Revision>> {
        let version: i64 = self.db.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if !matches!(version, 3..=13) {
            return Err("Run explicit upgrade-history before reading revisions".into());
        }
        Ok(self
            .db
            .prepare("SELECT id,event,source_revision FROM workspace_revisions ORDER BY id DESC LIMIT 50")?
            .query_map([], |r| {
                Ok(Revision {
                    id: r.get(0)?,
                    event: r.get(1)?,
                    source_revision: r.get(2)?,
                })
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?)
    }
    pub fn restore_revision(&mut self, id: i64) -> Result<i64> {
        if id < 1 {
            return Err("Revision ID must be positive".into());
        }
        let tx = self.db.transaction()?;
        let version: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if !matches!(version, 3..=13) {
            return Err("Run explicit upgrade-history before restoring".into());
        }
        let (text, digest): (String, String) = tx.query_row(
            "SELECT json,sha256 FROM workspace_revisions WHERE id=?1",
            [id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )?;
        if digest_hex(&text) != digest {
            return Err("Revision digest mismatch; current backup unchanged".into());
        }
        let encoded = backup::normalize(&text)?;
        backup::require_storage_version(&encoded, version)?;
        tx.execute("INSERT INTO workspace_backup VALUES(1,?1) ON CONFLICT(singleton) DO UPDATE SET json=excluded.json",[&encoded])?;
        let new_id = append(&tx, &encoded, "restore", Some(id))?;
        tx.commit()?;
        Ok(new_id)
    }
}

fn digest_hex(text: &str) -> String {
    Sha256::digest(text.as_bytes())
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}
