//! Atomic snapshot-content compare-and-save. No schema changes.
use crate::{Result, Store, backup, history};
use rusqlite::{OptionalExtension, TransactionBehavior};
use sha2::{Digest, Sha256};
pub fn version(text: Option<&str>) -> String {
    match text {
        None => "\"empty\"".to_owned(),
        Some(text) => format!(
            "\"{}\"",
            Sha256::digest(text.as_bytes())
                .iter()
                .map(|b| format!("{b:02x}"))
                .collect::<String>()
        ),
    }
}
impl Store {
    pub fn compare_save_backup(&mut self, expected: &str, text: &str) -> Result<Option<String>> {
        let encoded = backup::normalize(text)?;
        let tx = self
            .db
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let schema: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if !matches!(schema, 2..=13) {
            return Err("Backup upgrade required".into());
        }
        backup::require_storage_version(&encoded, schema)?;
        let current: Option<String> = tx
            .query_row(
                "SELECT json FROM workspace_backup WHERE singleton=1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        let current = current
            .map(|v| -> Result<String> {
                let n = backup::normalize(&v)?;
                backup::require_storage_version(&n, schema)?;
                Ok(n)
            })
            .transpose()?;
        if version(current.as_deref()) != expected {
            return Ok(None);
        }
        tx.execute("INSERT INTO workspace_backup VALUES(1,?1) ON CONFLICT(singleton) DO UPDATE SET json=excluded.json", [&encoded])?;
        if matches!(schema, 3..=13) {
            history::append(&tx, &encoded, "save", None)?;
        }
        tx.commit()?;
        Ok(Some(version(Some(&encoded))))
    }
}

#[derive(serde::Serialize)]
pub struct RestoredRevision {
    pub version: String,
    pub text: String,
    pub revision: i64,
}
impl Store {
    pub fn compare_restore_revision(
        &mut self,
        expected: &str,
        id: i64,
    ) -> Result<Option<RestoredRevision>> {
        if id < 1 {
            return Err("Revision ID must be positive".into());
        }
        let tx = self
            .db
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let schema: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if !matches!(schema, 3..=13) {
            return Err("Explicit upgrade-history required".into());
        }
        let current: Option<String> = tx
            .query_row(
                "SELECT json FROM workspace_backup WHERE singleton=1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        let current = current
            .map(|v| -> Result<String> {
                let n = backup::normalize(&v)?;
                backup::require_storage_version(&n, schema)?;
                Ok(n)
            })
            .transpose()?;
        if version(current.as_deref()) != expected {
            return Ok(None);
        }
        let (text, digest): (String, String) = tx.query_row(
            "SELECT json,sha256 FROM workspace_revisions WHERE id=?1",
            [id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )?;
        if text.len() > 4_000_000 || version(Some(&text)) != format!("\"{digest}\"") {
            return Err("Revision integrity mismatch".into());
        }
        let text = backup::normalize(&text)?;
        backup::require_storage_version(&text, schema)?;
        tx.execute("INSERT INTO workspace_backup VALUES(1,?1) ON CONFLICT(singleton) DO UPDATE SET json=excluded.json",[&text])?;
        let revision = history::append(&tx, &text, "restore", Some(id))?;
        tx.commit()?;
        Ok(Some(RestoredRevision {
            version: version(Some(&text)),
            text,
            revision,
        }))
    }
}
