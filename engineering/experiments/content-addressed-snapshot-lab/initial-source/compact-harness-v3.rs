//! Fixed retained-public-input comparison against the actual SnapshotStore.
use atlas_lab::{
    build_identity::sha256_hex,
    compact_addressed_candidate::CompactStore,
    content_addressed_candidate::AddressedStore,
    modrinth::{parse_project, parse_project_record},
    snapshots::SnapshotStore,
};
use rusqlite::Connection;
use std::{
    io::{Read, Write},
    path::Path,
    time::Instant,
};
type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;
fn make_workload(
    records: &[(String, String)],
    repeat: usize,
    unique: bool,
) -> Result<Vec<(String, String)>> {
    if records.is_empty() || records.len() > 5 || repeat == 0 || repeat > 16 {
        return Err("Workload bounds rejected".into());
    }
    let mut output = Vec::with_capacity(records.len() * repeat);
    for _ in 0..repeat {
        for (id, original) in records {
            let mut text = original.clone();
            if unique {
                if text.contains("\"_atlas_generated_observation\"") {
                    return Err("Reserved generated field already present".into());
                }
                let end = text.rfind('}').ok_or("Expected object input")?;
                text.insert_str(
                    end,
                    &format!(",\"_atlas_generated_observation\":{}", output.len()),
                );
                parse_project_record(text.as_bytes(), id)?;
            }
            output.push((id.clone(), text));
        }
    }
    Ok(output)
}
fn workload_digest(records: &[(String, String)]) -> String {
    use sha2::Digest;
    let mut hash = sha2::Sha256::new();
    for (id, text) in records {
        hash.update((id.len() as u64).to_le_bytes());
        hash.update(id.as_bytes());
        hash.update((text.len() as u64).to_le_bytes());
        hash.update(text.as_bytes());
    }
    hash.finalize().iter().map(|x| format!("{x:02x}")).collect()
}
fn verify_history(path: &Path, lane: &str, expected: &[(String, String)]) -> Result<()> {
    let c = Connection::open(path)?;
    let sql = if lane == "compact" {
        "SELECT s.generation,s.canonical_id,p.payload,s.observed_at FROM snapshots s JOIN payloads p ON p.id=s.payload_id ORDER BY s.generation"
    } else if lane == "addressed" {
        "SELECT s.generation,s.canonical_id,p.payload,s.observed_at FROM snapshots s JOIN payloads p ON p.hash=s.payload_hash ORDER BY s.generation"
    } else {
        "SELECT generation,canonical_id,payload,observed_at FROM snapshots ORDER BY generation"
    };
    let mut statement = c.prepare(sql)?;
    let rows = statement
        .query_map([], |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, String>(3)?,
            ))
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;
    if rows.len() != expected.len() {
        return Err("History count mismatch".into());
    }
    for (i, ((generation, id, body, time), (want_id, want_body))) in
        rows.iter().zip(expected).enumerate()
    {
        if *generation != i as i64 + 1 || id != want_id || body != want_body || time.len() != 19 {
            return Err("Incomplete history parity".into());
        }
    }
    let mut attempts_statement=c.prepare("SELECT id,requested_id,outcome,generation,recorded_at FROM collection_attempts ORDER BY id")?;
    let attempts = attempts_statement
        .query_map([], |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, Option<i64>>(3)?,
                r.get::<_, String>(4)?,
            ))
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;
    if attempts.len() != expected.len() {
        return Err("Attempt count differs".into());
    }
    for (i, (row, want)) in attempts.iter().zip(expected).enumerate() {
        if row.0 != i as i64 + 1
            || row.1 != format!("modrinth-project-raw:{}", want.0)
            || row.2 != "success"
            || row.3 != Some(i as i64 + 1)
            || row.4.len() != 19
        {
            return Err("Attempt history differs".into());
        }
    }
    let wrong_provider: i64 = c.query_row(
        "SELECT count(*) FROM snapshots WHERE provider!='modrinth-project-raw'",
        [],
        |r| r.get(0),
    )?;
    if wrong_provider != 0 {
        return Err("Provider history differs".into());
    }
    if lane != "baseline" {
        let mut stmt = c.prepare(if lane == "compact" {
            "SELECT lower(hex(hash)),payload FROM payloads"
        } else {
            "SELECT hash,payload FROM payloads"
        })?;
        let mut rows = stmt.query([])?;
        let mut count = 0;
        while let Some(row) = rows.next()? {
            let key: String = row.get(0)?;
            let body: String = row.get(1)?;
            if key != sha256_hex(body.as_bytes()) {
                return Err("Payload address differs from complete bytes".into());
            }
            count += 1;
        }
        let unique = expected
            .iter()
            .map(|(_, text)| text.as_str())
            .collect::<std::collections::HashSet<_>>()
            .len();
        if count != unique {
            return Err("Unexpected orphan or missing payload".into());
        }
    }
    let integrity: String = c.query_row("PRAGMA integrity_check", [], |r| r.get(0))?;
    if integrity != "ok" {
        return Err("Database integrity failure".into());
    }
    let foreign_keys: i64 =
        c.query_row("SELECT count(*) FROM pragma_foreign_key_check", [], |r| {
            r.get(0)
        })?;
    if foreign_keys != 0 {
        return Err("Foreign-key failure".into());
    }
    Ok(())
}
fn run(manifest: &Path, out: &Path) -> Result<()> {
    let mut manifest_bytes = Vec::new();
    std::fs::File::open(manifest)?
        .take(16385)
        .read_to_end(&mut manifest_bytes)?;
    if manifest_bytes.len() > 16384 {
        return Err("Manifest exceeds budget".into());
    }
    let names: Vec<String> = serde_json::from_slice(&manifest_bytes)?;
    if names.len() != 5 {
        return Err("Exactly five retained public generation inputs required".into());
    }
    let mut records = Vec::new();
    let mut inputs = Vec::new();
    for name in names {
        let mut bytes = Vec::new();
        std::fs::File::open(name)?
            .take(2 * 1024 * 1024 + 1)
            .read_to_end(&mut bytes)?;
        if bytes.len() > 2 * 1024 * 1024 {
            return Err("Input exceeds budget".into());
        }
        let project = parse_project(&bytes)?;
        let text = String::from_utf8(bytes)?;
        parse_project_record(text.as_bytes(), &project.id)?;
        inputs.push(serde_json::json!({"id":project.id,"bytes":text.len(),"sha256":sha256_hex(text.as_bytes())}));
        records.push((project.id, text));
    }
    if records.iter().map(|(_, x)| x.len()).sum::<usize>() > 4 * 1024 * 1024 {
        return Err("Corpus exceeds budget".into());
    }
    std::fs::create_dir(out)?;
    let mut raw = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(out.join("samples.jsonl"))?;
    let began = Instant::now();
    let mut samples = Vec::new();
    for (workload, repeat, unique) in [
        ("retained", 1, false),
        ("duplicate_replay", 16, false),
        ("unique_augmented_replay", 16, true),
    ] {
        let expected = make_workload(&records, repeat, unique)?;
        let unique_payloads = expected
            .iter()
            .map(|(_, text)| text.as_str())
            .collect::<std::collections::HashSet<_>>()
            .len();
        if unique && unique_payloads != expected.len() {
            return Err("Unique control is not unique".into());
        }
        let workload_sha256 = workload_digest(&expected);
        let orders = [
            ["baseline", "addressed", "compact"],
            ["baseline", "compact", "addressed"],
            ["addressed", "baseline", "compact"],
            ["addressed", "compact", "baseline"],
            ["compact", "baseline", "addressed"],
            ["compact", "addressed", "baseline"],
        ];
        for round in 0..12 {
            for lane in orders[round % orders.len()] {
                if began.elapsed().as_secs() > 120 {
                    return Err("Experiment wall budget exceeded; prior samples retained".into());
                }
                let path = out.join(format!("{workload}-{round}-{lane}.sqlite"));
                let setup = Instant::now();
                drop(
                    std::fs::OpenOptions::new()
                        .write(true)
                        .create_new(true)
                        .open(&path)?,
                );
                let mut base = if lane == "baseline" {
                    Some(SnapshotStore::open(&path)?)
                } else {
                    None
                };
                let mut candidate = if lane == "addressed" {
                    Some(AddressedStore::open(&path)?)
                } else {
                    None
                };
                let mut compact = if lane == "compact" {
                    Some(CompactStore::open(&path)?)
                } else {
                    None
                };
                let setup_ns = setup.elapsed().as_nanos();
                let write = Instant::now();
                let mut writes = Vec::new();
                for (id, text) in &expected {
                    let start = Instant::now();
                    let record = parse_project_record(text.as_bytes(), id)?;
                    if let Some(s) = base.as_mut() {
                        s.save_modrinth_project_record(id, &record)?;
                    } else if let Some(s) = candidate.as_mut() {
                        s.save(id, &record)?;
                    } else {
                        compact.as_mut().unwrap().save(id, &record)?;
                    }
                    writes.push(start.elapsed().as_nanos());
                }
                let write_ns = write.elapsed().as_nanos();
                drop(base);
                drop(candidate);
                drop(compact);
                let read = Instant::now();
                if lane == "baseline" {
                    let s = SnapshotStore::open(&path)?;
                    for (id, _) in &records {
                        let got = s
                            .latest_modrinth_project_record(id)?
                            .ok_or("Missing baseline")?;
                        let want = expected.iter().rev().find(|(k, _)| k == id).unwrap();
                        if got.raw_json() != want.1 {
                            return Err("Baseline latest differs".into());
                        }
                    }
                } else if lane == "addressed" {
                    let s = AddressedStore::open(&path)?;
                    for (id, _) in &records {
                        let got = s.latest(id)?.ok_or("Missing candidate")?;
                        let want = expected.iter().rev().find(|(k, _)| k == id).unwrap();
                        if got.1.raw_json() != want.1 {
                            return Err("Candidate latest differs".into());
                        }
                    }
                }
                // The compact lane has the same read and full-byte validation contract.
                if lane == "compact" {
                    let s = CompactStore::open(&path)?;
                    for (id, _) in &records {
                        let got = s.latest(id)?.ok_or("Missing compact candidate")?;
                        let want = expected.iter().rev().find(|(k, _)| k == id).unwrap();
                        if got.1.raw_json() != want.1 {
                            return Err("Compact latest differs".into());
                        }
                    }
                }
                let read_ns = read.elapsed().as_nanos();
                verify_history(&path, lane, &expected)?;
                let file_bytes = std::fs::metadata(&path)?.len();
                if file_bytes > 64 * 1024 * 1024 {
                    return Err("Database exceeds budget".into());
                }
                let sample = serde_json::json!({"round":round,"lane":lane,"workload":workload,"generated_augmentation":unique,"workload_sha256":workload_sha256,"unique_input_payloads":unique_payloads,"replay_factor":repeat,"generations":expected.len(),"setup_ns":setup_ns,"parse_write_commit_ns":write_ns,"per_generation_parse_write_commit_ns":writes,"reopen_latest_verify_ns":read_ns,"database_bytes":file_bytes,"exact_payload_and_history_parity":true,"integrity_ok":true});
                writeln!(raw, "{}", serde_json::to_string(&sample)?)?;
                raw.flush()?;
                samples.push(sample);
            }
        }
    }
    if samples.len() != 108 {
        return Err("Incomplete sample matrix".into());
    }
    let receipt = serde_json::json!({"schema_version":3,"complete":samples.len()==108,"inputs":inputs,"samples":samples,"scope":"Actual SnapshotStore versus isolated text-hash and integer-reference schemas; retained public generations and labeled repeated replay; no application migration","limitations":["Timestamp fields are each preserved and format-checked, not expected equal across separately timed databases","Peak memory and physical power-loss durability unmeasured","Reopen is not cold cache","All three lanes parse full responses and commit each generation under existing EXTRA synchronization contract"],"source_sha256":sha256_hex(include_bytes!("compact_addressed_lab.rs")),"reference_candidate_sha256":sha256_hex(include_bytes!("../../../experiments/content-addressed-snapshot-lab/store.rs")),"candidate_sha256":sha256_hex(include_bytes!("../../../experiments/content-addressed-snapshot-lab/compact_store.rs")),"baseline_sha256":sha256_hex(include_bytes!("../src/snapshots.rs"))});
    std::fs::write(
        out.join("receipt.json"),
        serde_json::to_vec_pretty(&receipt)?,
    )?;
    println!("{{\"complete\":true,\"samples\":108}}");
    Ok(())
}
fn main() -> Result<()> {
    let args: Vec<_> = std::env::args().collect();
    if args.len() != 3 {
        return Err("Usage: compact_addressed_lab MANIFEST NEW_DIRECTORY".into());
    }
    run(Path::new(&args[1]), Path::new(&args[2]))
}

#[cfg(test)]
mod tests {
    use super::*;
    fn input() -> Vec<(String, String)> {
        vec![("AANobbMI".into(),r#" {"id":"AANobbMI","slug":"sodium","title":"Fixture","description":"data","project_type":"mod","versions":[],"future":18446744073709551617} "#.into())]
    }
    #[test]
    fn duplicate_and_unique_controls_preserve_original_wire_content() {
        let source = input();
        let duplicated = make_workload(&source, 3, false).unwrap();
        assert!(duplicated.iter().all(|row| row == &source[0]));
        let unique = make_workload(&source, 3, true).unwrap();
        assert_ne!(unique[0].1, unique[1].1);
        for (i, (id, text)) in unique.iter().enumerate() {
            assert_eq!(
                text.replace(&format!(",\"_atlas_generated_observation\":{i}"), ""),
                source[0].1
            );
            assert_eq!(
                parse_project_record(text.as_bytes(), id)
                    .unwrap()
                    .project()
                    .id,
                "AANobbMI"
            );
        }
        assert_ne!(workload_digest(&duplicated), workload_digest(&unique));
    }
    #[test]
    fn reserved_fields_and_invalid_bounds_fail_closed() {
        let mut source = input();
        source[0].1 = source[0]
            .1
            .replace("\"future\"", "\"_atlas_generated_observation\"");
        assert!(make_workload(&source, 1, true).is_err());
        assert!(make_workload(&input(), 0, true).is_err());
        assert!(make_workload(&input(), 17, true).is_err());
        assert!(make_workload(&[], 1, true).is_err());
    }
}
