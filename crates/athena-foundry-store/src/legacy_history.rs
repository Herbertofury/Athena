//! Export original event bytes as an inert separate archive, never active revisions.
use crate::{Result, open_standalone_legacy, require_ordinary_table};
use serde::Serialize;
use std::path::Path;

const MAX_ROWS: i64 = 5_000;
const MAX_ROW_BYTES: i64 = 256 * 1024;
const MAX_TOTAL_BYTES: i64 = 6 * 1024 * 1024;

#[derive(Serialize)]
pub struct Event {
    id: i64,
    event_type: String,
    created_at: i64,
    payload_json: String,
    payload_sha256: String,
}

#[derive(Serialize)]
pub struct History {
    schema: u32,
    format: &'static str,
    events: Vec<Event>,
}

pub fn archive_history(path: &Path) -> Result<History> {
    let db = open_standalone_legacy(path)?;
    for table in ["theme_packages", "rooms", "room_soundtracks", "history"] {
        require_ordinary_table(&db, table)?;
    }
    let count: i64 = db.query_row("SELECT count(*) FROM history", [], |r| r.get(0))?;
    if count > MAX_ROWS {
        return Err("Legacy history exceeds the archive row limit; no partial export".into());
    }
    let mut events = Vec::with_capacity(usize::try_from(count)?);
    let mut sizes = db.prepare("SELECT id,typeof(id),typeof(event_type),typeof(payload_json),typeof(created_at),length(CAST(event_type AS BLOB))+length(CAST(payload_json AS BLOB)) FROM history ORDER BY id")?;
    let mut load =
        db.prepare("SELECT event_type,payload_json,created_at FROM history WHERE id=?1")?;
    let mut rows = sizes.query([])?;
    let (mut sum, mut previous) = (0_i64, 0_i64);
    while let Some(row) = rows.next()? {
        let id: i64 = row.get(0)?;
        if id <= previous
            || row.get_ref(1)?.as_str()? != "integer"
            || row.get_ref(2)?.as_str()? != "text"
            || row.get_ref(3)?.as_str()? != "text"
            || row.get_ref(4)?.as_str()? != "integer"
        {
            return Err("Unexpected legacy history row shape".into());
        }
        previous = id;
        let size: i64 = row.get(5)?;
        sum = sum
            .checked_add(size)
            .ok_or("Legacy history size overflow")?;
        if size > MAX_ROW_BYTES || sum > MAX_TOTAL_BYTES {
            return Err("Legacy history exceeds the archive byte limit; no partial export".into());
        }
        let (event_type, payload_json, created_at): (String, String, i64) =
            load.query_row([id], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))?;
        // Validate syntax without parsing/reformatting the committed payload text.
        if serde_json::from_str::<serde::de::IgnoredAny>(&payload_json).is_err() {
            return Err("Invalid legacy history JSON; no partial export".into());
        }
        let payload_sha256 = crate::history::digest_hex(&payload_json);
        events.push(Event {
            id,
            event_type,
            created_at,
            payload_json,
            payload_sha256,
        });
    }
    if events.len() != usize::try_from(count)? {
        return Err("Legacy history count changed".into());
    }
    Ok(History {
        schema: 1,
        format: "feature-foundry-v24-history",
        events,
    })
}
