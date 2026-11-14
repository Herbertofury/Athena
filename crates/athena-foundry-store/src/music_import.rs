//! Explicit offline MusicHub mapping import. Never contacts a provider or replaces a bookmark.
use crate::{Result, Store, metadata::NativeSoundtrack};
use rusqlite::params;
use serde::Deserialize;
use std::collections::HashSet;
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MusicImport {
    pub version: u32,
    pub rows: Vec<NativeSoundtrack>,
}
impl Store {
    pub fn import_music(&mut self, import: &MusicImport) -> Result<usize> {
        if import.version != 1 || import.rows.len() > 1000 {
            return Err("Unsupported music import version or count".into());
        }
        let mut keys = HashSet::new();
        for row in &import.rows {
            row.assignment.validate()?;
            let timestamp = row.updated_at.ok_or("Source timestamp required")?;
            crate::metadata::validate_timestamp(timestamp)?;
            if !keys.insert((&row.assignment.theme_id, &row.assignment.room_id)) {
                return Err("Duplicate target room".into());
            }
        }
        let tx = self.db.transaction()?;
        let schema: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if !(4..=12).contains(&schema) {
            return Err("Explicit soundtrack schema upgrade required".into());
        }
        for row in &import.rows {
            let a = &row.assignment;
            // Plain INSERT is deliberate: any occupied room aborts the entire transaction.
            tx.execute("INSERT INTO soundtracks(theme_id,room_id,provider,url,label,status,source_id,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8)", params![a.theme_id,a.room_id,a.provider,a.url,a.label,a.status,a.source_id,row.updated_at])?;
        }
        tx.commit()?;
        Ok(import.rows.len())
    }
}
