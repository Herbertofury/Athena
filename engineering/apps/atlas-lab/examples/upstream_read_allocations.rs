//! Actual SnapshotStore refresh allocation probe; fixture corruption is explicit.
#[path = "../../../experiments/version-validation-lab/allocation_counter.rs"]
mod allocation_counter;
use atlas_lab::{
    build_identity::sha256_hex,
    snapshots::SnapshotStore,
    upstream_reviews::{Source, parse_record, response_meta},
};
use std::{io::Read, path::Path};
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<_> = std::env::args().collect();
    if args.len() != 3 {
        return Err("Supply retained public HLS JSON and a NEW output directory".into());
    }
    let mut input = Vec::new();
    std::fs::File::open(&args[1])?
        .take(2 * 1024 * 1024 + 1)
        .read_to_end(&mut input)?;
    parse_record(Source::Hls, &input)?;
    let output = Path::new(&args[2]);
    std::fs::create_dir(output)?;
    let mut samples = Vec::new();
    for repetition in 0..3 {
        for corrupt in [false, true] {
            let path = output.join(format!("sample-{repetition}-{corrupt}.sqlite"));
            let mut store = SnapshotStore::open(&path)?;
            let meta = response_meta(200, &reqwest::header::HeaderMap::new(), 10000, 0);
            store.save_upstream(Source::Hls, &input, &meta)?;
            let previous = if corrupt {
                "x".repeat(5 * 1024 * 1024)
            } else {
                String::from_utf8(input.clone())?
            };
            let previous_hash = sha256_hex(previous.as_bytes());
            {
                let c = rusqlite::Connection::open(&path)?;
                c.execute(
                    "UPDATE snapshots SET payload=?1 WHERE provider='github-upstream'",
                    [&previous],
                )?;
            }
            drop(previous);
            let start_live = allocation_counter::live_requested();
            let (result, stats) =
                allocation_counter::measure(|| store.save_upstream(Source::Hls, &input, &meta));
            let receipt = result?;
            if receipt["comparison"]
                != if corrupt {
                    "previous_record_invalid"
                } else {
                    "unchanged"
                }
            {
                return Err("Comparison semantics changed".into());
            }
            drop(store);
            let reopened = SnapshotStore::open(&path)?;
            if reopened
                .latest_upstream_payload(Source::Hls)?
                .ok_or("Missing latest record")?
                .as_bytes()
                != input
            {
                return Err("Complete latest payload differs".into());
            }
            let c = rusqlite::Connection::open(&path)?;
            let old: String = c.query_row(
                "SELECT payload FROM snapshots WHERE generation=1",
                [],
                |r| r.get(0),
            )?;
            if sha256_hex(old.as_bytes()) != previous_hash
                || reopened.attempts()? != 2
                || c.query_row("SELECT count(*) FROM snapshots", [], |r| r.get::<_, i64>(0))? != 2
                || c.query_row("PRAGMA integrity_check", [], |r| r.get::<_, String>(0))? != "ok"
                || allocation_counter::accounting_error()
            {
                return Err("Retention, atomicity or accounting failure".into());
            }
            samples.push(serde_json::json!({"repetition":repetition,"generated_oversized_previous":corrupt,"previous_bytes":old.len(),"previous_sha256":previous_hash,"complete_previous_and_latest_bytes_equal":true,"attempts":2,"snapshots":2,"integrity_ok":true,"receipt":receipt,"start_live_requested_bytes":start_live,"allocations":allocation_counter::row(stats)}));
        }
    }
    let result = serde_json::json!({"scope":"Actual store save/compare/commit using retained public HLS JSON and explicitly generated corrupt prior rows; requested Rust allocations only, not SQLite native allocations, RSS, I/O or speed","complete":samples.len()==6,"input_bytes":input.len(),"input_sha256":sha256_hex(&input),"store_sha256":sha256_hex(include_bytes!("../src/snapshots.rs")),"counter_sha256":sha256_hex(include_bytes!("../../../experiments/version-validation-lab/allocation_counter.rs")),"harness_sha256":sha256_hex(include_bytes!("upstream_read_allocations.rs")),"lock_sha256":sha256_hex(include_bytes!("../Cargo.lock")),"compiler":env!("ATLAS_RUSTC_VERSION"),"profile":env!("ATLAS_BUILD_PROFILE"),"samples":samples});
    std::fs::write(
        output.join("receipt.json"),
        serde_json::to_vec_pretty(&result)?,
    )?;
    println!("{}", serde_json::json!({"complete":true,"samples":6}));
    Ok(())
}
