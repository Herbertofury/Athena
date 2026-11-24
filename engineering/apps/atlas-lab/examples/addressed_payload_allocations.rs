//! SQLite value comparison component only; no elapsed-time or RSS claim.
#[path = "../../../experiments/version-validation-lab/allocation_counter.rs"]
mod allocation_counter;
use atlas_lab::{build_identity::sha256_hex, modrinth::parse_project};
use rusqlite::{Connection, types::ValueRef};
use std::{hint::black_box, io::Read};
type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;
fn main() -> Result<()> {
    let args: Vec<_> = std::env::args().collect();
    if args.len() != 2 {
        return Err("Supply one retained public response path".into());
    }
    let mut bytes = Vec::new();
    std::fs::File::open(&args[1])?
        .take(2 * 1024 * 1024 + 1)
        .read_to_end(&mut bytes)?;
    if bytes.len() > 2 * 1024 * 1024 {
        return Err("Input budget exceeded".into());
    }
    parse_project(&bytes)?;
    let text = String::from_utf8(bytes)?;
    let c = Connection::open_in_memory()?;
    c.execute_batch("CREATE TABLE payloads(hash TEXT PRIMARY KEY NOT NULL,payload TEXT NOT NULL)")?;
    let hash = sha256_hex(text.as_bytes());
    c.execute("INSERT INTO payloads VALUES(?1,?2)", [&hash, &text])?;
    let sql = "SELECT CASE WHEN octet_length(payload)<=4194304 THEN payload ELSE NULL END FROM payloads WHERE hash=?1";
    let mut samples = Vec::new();
    for round in 0..7 {
        for lane in if round % 2 == 0 {
            ["owned", "borrowed"]
        } else {
            ["borrowed", "owned"]
        } {
            let start_live = allocation_counter::live_requested();
            let (result, stats) = allocation_counter::measure(|| -> Result<()> {
                for _ in 0..50 {
                    let equal = if lane == "owned" {
                        let stored: Option<String> = c.query_row(sql, [&hash], |r| r.get(0))?;
                        black_box(stored.as_deref()) == Some(black_box(text.as_str()))
                    } else {
                        c.query_row(sql, [&hash], |r| Ok(matches!(r.get_ref(0)?, ValueRef::Text(stored) if black_box(stored) == black_box(text.as_bytes()))))?
                    };
                    if !equal {
                        return Err("Full payload comparison failed".into());
                    }
                }
                Ok(())
            });
            result?;
            if allocation_counter::accounting_error() {
                return Err("Allocation accounting failed".into());
            }
            samples.push(serde_json::json!({"round":round,"lane":lane,"iterations":50,"complete_bytes_equal":true,"start_live_requested_bytes":start_live,"allocations":allocation_counter::row(stats)}));
        }
    }
    println!(
        "{}",
        serde_json::to_string_pretty(
            &serde_json::json!({"schema_version":1,"complete":samples.len()==14,"input_bytes":text.len(),"input_sha256":hash,"samples":samples,"harness_sha256":sha256_hex(include_bytes!("addressed_payload_allocations.rs")),"counter_sha256":sha256_hex(include_bytes!("../../../experiments/version-validation-lab/allocation_counter.rs")),"candidate_store_sha256":sha256_hex(include_bytes!("../../../experiments/content-addressed-snapshot-lab/store.rs")),"scope":"Isolated existing SQLite payload comparison; requested Rust allocations only, excluding native SQLite allocations; not save latency, RSS, live collection or target-project adoption"})
        )?
    );
    Ok(())
}
