//! Local source soundtrack metadata. Status is provenance, never playback verification.
use crate::{Result, Soundtrack, Store, nonempty, validate_soundtrack};
use rusqlite::{OptionalExtension, params};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub struct NativeAssignment {
    pub theme_id: String,
    pub room_id: String,
    pub provider: String,
    pub url: String,
    pub label: String,
    pub status: String,
    pub source_id: Option<String>,
}
#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub struct NativeSoundtrack {
    pub assignment: NativeAssignment,
    pub updated_at: Option<i64>,
}
pub(crate) fn now() -> Result<i64> {
    Ok(SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_secs()
        .try_into()?)
}
impl NativeAssignment {
    pub(crate) fn from_soundtrack(s: &Soundtrack) -> Self {
        Self {
            theme_id: s.theme_id.clone(),
            room_id: s.room_id.clone(),
            provider: s.provider.clone(),
            url: s.url.clone(),
            label: s.label.clone(),
            status: "USER_ASSIGNED".into(),
            source_id: None,
        }
    }
    pub(crate) fn validate(&self) -> Result<()> {
        validate_soundtrack(&Soundtrack {
            theme_id: self.theme_id.clone(),
            room_id: self.room_id.clone(),
            provider: self.provider.clone(),
            url: self.url.clone(),
            label: self.label.clone(),
        })?;
        if !nonempty(&self.status, 128)
            || !self
                .status
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"_- ".contains(&b))
        {
            return Err("Status must be a bounded provenance label".into());
        }
        if let Some(id) = &self.source_id
            && (!nonempty(id, 256)
                || !id
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b"_-.:/".contains(&b)))
        {
            return Err("Source ID must be a bounded nonsecret identifier".into());
        }
        Ok(())
    }
}
pub(crate) fn validate_timestamp(timestamp: i64) -> Result<()> {
    if timestamp < 0 || timestamp > now()? {
        return Err("Legacy timestamp is negative or in the future".into());
    }
    Ok(())
}
impl Store {
    pub fn migrate_soundtrack_metadata(&mut self) -> Result<()> {
        let tx = self.db.transaction()?;
        let v: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if matches!(v, 4..=13) {
            return Ok(());
        }
        if v != 3 {
            return Err(
                "Run explicit upgrade-backups and upgrade-history before upgrade-soundtracks"
                    .into(),
            );
        }
        tx.execute_batch("ALTER TABLE soundtracks ADD COLUMN status TEXT NOT NULL DEFAULT 'LEGACY_UNSPECIFIED'; ALTER TABLE soundtracks ADD COLUMN source_id TEXT; ALTER TABLE soundtracks ADD COLUMN updated_at INTEGER; PRAGMA user_version=4;")?;
        tx.commit()?;
        Ok(())
    }
    pub fn assign_native(&mut self, v: &NativeAssignment) -> Result<NativeSoundtrack> {
        v.validate()?;
        let timestamp = now()?;
        let tx = self.db.transaction()?;
        if !matches!(
            tx.query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))?,
            4..=13
        ) {
            return Err("Run explicit upgrade-soundtracks first".into());
        }
        tx.execute("INSERT INTO soundtracks(theme_id,room_id,provider,url,label,status,source_id,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8) ON CONFLICT(theme_id,room_id) DO UPDATE SET provider=excluded.provider,url=excluded.url,label=excluded.label,status=excluded.status,source_id=excluded.source_id,updated_at=excluded.updated_at",params![v.theme_id,v.room_id,v.provider,v.url,v.label,v.status,v.source_id,timestamp])?;
        tx.commit()?;
        Ok(NativeSoundtrack {
            assignment: v.clone(),
            updated_at: Some(timestamp),
        })
    }
    pub fn soundtrack_native(&self, theme: &str, room: &str) -> Result<Option<NativeSoundtrack>> {
        read_checked(&self.db, theme, room)
    }
}

fn read_checked(
    db: &rusqlite::Connection,
    theme: &str,
    room: &str,
) -> Result<Option<NativeSoundtrack>> {
    if !matches!(
        db.query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))?,
        4..=13
    ) {
        return Err("Run explicit upgrade-soundtracks first".into());
    }
    let value=db.query_row("SELECT theme_id,room_id,provider,url,label,status,source_id,updated_at FROM soundtracks WHERE theme_id=?1 AND room_id=?2",params![theme,room],|r|Ok(NativeSoundtrack{assignment:NativeAssignment{theme_id:r.get(0)?,room_id:r.get(1)?,provider:r.get(2)?,url:r.get(3)?,label:r.get(4)?,status:r.get(5)?,source_id:r.get(6)?},updated_at:r.get(7)?})).optional()?;
    if let Some(v) = &value {
        v.assignment.validate()?;
        if let Some(t) = v.updated_at {
            validate_timestamp(t)?;
        }
    }
    Ok(value)
}

#[derive(Serialize)]
pub struct VersionedSoundtrack {
    pub value: Option<NativeSoundtrack>,
    pub version: String,
}
fn versioned(
    theme: &str,
    room: &str,
    value: Option<NativeSoundtrack>,
) -> Result<VersionedSoundtrack> {
    let canonical = serde_json::to_string(&(theme, room, &value))?;
    Ok(VersionedSoundtrack {
        version: crate::concurrency::version(Some(&canonical)),
        value,
    })
}
impl Store {
    pub fn soundtrack_versioned(&self, theme: &str, room: &str) -> Result<VersionedSoundtrack> {
        versioned(theme, room, self.soundtrack_native(theme, room)?)
    }
    pub fn compare_assign_soundtrack(
        &mut self,
        expected: &str,
        input: &Soundtrack,
    ) -> Result<Option<VersionedSoundtrack>> {
        let v = NativeAssignment::from_soundtrack(input);
        v.validate()?;
        let tx = self
            .db
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let current = read_checked(&tx, &v.theme_id, &v.room_id)?;
        if versioned(&v.theme_id, &v.room_id, current)?.version != expected {
            return Ok(None);
        }
        let timestamp = now()?;
        tx.execute("INSERT INTO soundtracks(theme_id,room_id,provider,url,label,status,source_id,updated_at) VALUES(?1,?2,?3,?4,?5,'USER_ASSIGNED',NULL,?6) ON CONFLICT(theme_id,room_id) DO UPDATE SET provider=excluded.provider,url=excluded.url,label=excluded.label,status='USER_ASSIGNED',source_id=NULL,updated_at=excluded.updated_at",params![v.theme_id,v.room_id,v.provider,v.url,v.label,timestamp])?;
        let result = versioned(
            &v.theme_id,
            &v.room_id,
            Some(NativeSoundtrack {
                assignment: v.clone(),
                updated_at: Some(timestamp),
            }),
        )?;
        tx.commit()?;
        Ok(Some(result))
    }
}
