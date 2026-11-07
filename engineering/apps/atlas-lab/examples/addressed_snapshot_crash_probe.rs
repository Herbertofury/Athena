//! Owned-fixture process interruption probe. Never accepts network input.
use atlas_lab::{
    compact_addressed_candidate::CompactStore, content_addressed_candidate::AddressedStore,
    modrinth::parse_project_record, snapshots::SnapshotStore,
};
use rusqlite::Connection;
use std::{
    io::{Read, Write},
    path::Path,
};
#[path = "../../../experiments/process-memory-lab/linux_memory.rs"]
mod linux_memory;
type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;
fn main() -> Result<()> {
    let args: Vec<_> = std::env::args().collect();
    if args.len() != 5 {
        return Err(
            "Usage: probe write|verify baseline|addressed|compact PUBLIC_JSON OWNED_DB".into(),
        );
    }
    let action = args[1].as_str();
    let lane = args[2].as_str();
    if !["write", "write-memory", "verify"].contains(&action)
        || !["baseline", "addressed", "compact"].contains(&lane)
    {
        return Err("Unknown fixed probe mode".into());
    }
    let memory_before = if action == "write-memory" {
        Some(linux_memory::memory()?)
    } else {
        None
    };
    let mut bytes = Vec::new();
    std::fs::File::open(&args[3])?
        .take(2 * 1024 * 1024 + 1)
        .read_to_end(&mut bytes)?;
    if bytes.len() > 2 * 1024 * 1024 {
        return Err("Input exceeds budget".into());
    }
    let project = atlas_lab::modrinth::parse_project(&bytes)?;
    let record = parse_project_record(&bytes, &project.id)?;
    let path = Path::new(&args[4]);
    if action == "write" || action == "write-memory" {
        std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(path)?;
        let memory_retained = if lane == "baseline" {
            let mut store = SnapshotStore::open(path)?;
            store.save_modrinth_project_record(&project.id, &record)?;
            println!("READY");
            std::io::stdout().flush()?;
            for _ in 0..1000 {
                store.save_modrinth_project_record(&project.id, &record)?;
            }
            if action == "write-memory" {
                Some(linux_memory::memory()?)
            } else {
                None
            }
        } else if lane == "compact" {
            let mut store = CompactStore::open(path)?;
            store.save(&project.id, &record)?;
            println!("READY");
            std::io::stdout().flush()?;
            for _ in 0..1000 {
                store.save(&project.id, &record)?;
            }
            if action == "write-memory" {
                Some(linux_memory::memory()?)
            } else {
                None
            }
        } else {
            let mut store = AddressedStore::open(path)?;
            store.save(&project.id, &record)?;
            println!("READY");
            std::io::stdout().flush()?;
            for _ in 0..1000 {
                store.save(&project.id, &record)?;
            }
            if action == "write-memory" {
                Some(linux_memory::memory()?)
            } else {
                None
            }
        };
        if action == "write-memory" {
            println!(
                "{}",
                serde_json::json!({"schema_version":1,"lane":lane,"observations":1001,"input_sha256":atlas_lab::build_identity::sha256_hex(&bytes),"before_input":memory_before,"retained_connection":memory_retained,"after_connection_drop":linux_memory::memory()?,"observer_sha256":atlas_lab::build_identity::sha256_hex(include_bytes!("../../../experiments/process-memory-lab/linux_memory.rs")),"scope":"Linux self-observation after exec; status accounting is approximate; smaps_rollup is instantaneous, not peak"})
            );
        }
        println!("DONE");
        return Ok(());
    }
    if !path.is_file() {
        return Err("Owned fixture database missing".into());
    }
    let latest = if lane == "baseline" {
        SnapshotStore::open(path)?
            .latest_modrinth_project_record(&project.id)?
            .ok_or("Missing baseline snapshot")?
            .raw_json()
            .as_bytes()
            .to_vec()
    } else if lane == "compact" {
        CompactStore::open(path)?
            .latest(&project.id)?
            .ok_or("Missing compact snapshot")?
            .1
            .raw_json()
            .as_bytes()
            .to_vec()
    } else {
        AddressedStore::open(path)?
            .latest(&project.id)?
            .ok_or("Missing addressed snapshot")?
            .1
            .raw_json()
            .as_bytes()
            .to_vec()
    };
    if latest != bytes {
        return Err("Latest complete bytes differ".into());
    }
    let c = Connection::open(path)?;
    let sql = if lane == "baseline" {
        "SELECT generation,canonical_id,payload FROM snapshots ORDER BY generation"
    } else if lane == "compact" {
        "SELECT s.generation,s.canonical_id,p.payload FROM snapshots s JOIN payloads p ON p.id=s.payload_id ORDER BY s.generation"
    } else {
        "SELECT s.generation,s.canonical_id,p.payload FROM snapshots s JOIN payloads p ON p.hash=s.payload_hash ORDER BY s.generation"
    };
    let mut stmt = c.prepare(sql)?;
    let mut rows = stmt.query([])?;
    let mut count = 0_i64;
    while let Some(row) = rows.next()? {
        count += 1;
        if row.get::<_, i64>(0)? != count
            || row.get::<_, String>(1)? != project.id
            || row.get::<_, String>(2)?.as_bytes() != bytes
        {
            return Err("Complete committed history differs".into());
        }
    }
    if count < 1 {
        return Err("First committed generation lost".into());
    }
    let attempts: i64 = c.query_row(
        "SELECT count(*) FROM collection_attempts WHERE outcome='success' AND id=generation",
        [],
        |r| r.get(0),
    )?;
    if attempts != count {
        return Err("Partial attempt/generation transaction".into());
    }
    let all_attempts: i64 =
        c.query_row("SELECT count(*) FROM collection_attempts", [], |r| r.get(0))?;
    let matching_attempts: i64 = c.query_row(
        "SELECT count(*) FROM collection_attempts WHERE requested_id=?1",
        [format!("modrinth-project-raw:{}", project.id)],
        |r| r.get(0),
    )?;
    let provider_rows: i64 = c.query_row(
        "SELECT count(*) FROM snapshots WHERE provider='modrinth-project-raw'",
        [],
        |r| r.get(0),
    )?;
    if all_attempts != count || matching_attempts != count || provider_rows != count {
        return Err("Extra or misidentified history".into());
    }
    if lane != "baseline" {
        let payloads: i64 = c.query_row("SELECT count(*) FROM payloads", [], |r| r.get(0))?;
        if payloads != 1 {
            return Err("Unexpected orphan or duplicate payload".into());
        }
    }
    let integrity: String = c.query_row("PRAGMA integrity_check", [], |r| r.get(0))?;
    if integrity != "ok" {
        return Err("Integrity failure".into());
    }
    let foreign_keys: i64 =
        c.query_row("SELECT count(*) FROM pragma_foreign_key_check", [], |r| {
            r.get(0)
        })?;
    if foreign_keys != 0 {
        return Err("Foreign-key failure".into());
    }
    println!(
        "{}",
        serde_json::json!({"schema_version":1,"lane":lane,"committed_generations":count,"complete_payload_history_equal":true,"attempt_atomicity":true,"integrity_ok":true,"sqlite":rusqlite::version(),"scope":"Process kill recovery only; not physical power-loss durability"})
    );
    Ok(())
}
