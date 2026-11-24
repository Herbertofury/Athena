//! Allocation-only experiment using full retained public bytes and bounded stream fragments.
#[path = "../../../experiments/version-validation-lab/allocation_counter.rs"]
mod allocation_counter;
#[path = "../../../experiments/body-reader-lab/reader.rs"]
mod reader;
use atlas_lab::build_identity::sha256_hex;
use std::io::Read;
struct Fragments<'a> {
    input: &'a [u8],
    chunk: usize,
}
impl Read for Fragments<'_> {
    fn read(&mut self, buffer: &mut [u8]) -> std::io::Result<usize> {
        let n = buffer.len().min(self.chunk).min(self.input.len());
        buffer[..n].copy_from_slice(&self.input[..n]);
        self.input = &self.input[n..];
        Ok(n)
    }
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<_> = std::env::args().collect();
    if args.len() != 2 {
        return Err("Supply retained public response path".into());
    }
    let mut input = Vec::new();
    std::fs::File::open(&args[1])?
        .take(2 * 1024 * 1024 + 1)
        .read_to_end(&mut input)?;
    if input.len() > 2 * 1024 * 1024 {
        return Err("Input exceeds budget".into());
    }
    let mut samples = Vec::new();
    for chunk in [1, 31, 4096, 65536] {
        for (hint_mode, advertised) in [
            ("unknown", None),
            ("exact", Some(input.len() as u64)),
            ("overstated", Some(2 * 1024 * 1024)),
            ("understated", Some(0)),
        ] {
            for lane in ["baseline", "reserved", "adaptive"] {
                let start_live = allocation_counter::live_requested();
                let (result, stats) = allocation_counter::measure(|| {
                    let source = Fragments {
                        input: &input,
                        chunk,
                    };
                    if lane == "baseline" {
                        reader::baseline(source, 2 * 1024 * 1024, advertised)
                    } else if lane == "reserved" {
                        reader::reserved(source, 2 * 1024 * 1024, advertised)
                    } else {
                        reader::adaptive(source, 2 * 1024 * 1024, advertised)
                    }
                });
                let bytes = result?;
                if bytes != input || allocation_counter::accounting_error() {
                    return Err("Parity or accounting failure".into());
                }
                samples.push(serde_json::json!({"lane":lane,"fragment_bytes":chunk,"hint_mode":hint_mode,"advertised_length":advertised,"complete_bytes_equal":true,"output_capacity":bytes.capacity(),"start_live_requested_bytes":start_live,"allocations":allocation_counter::row(stats)}));
            }
        }
    }
    println!(
        "{}",
        serde_json::to_string_pretty(
            &serde_json::json!({"compiler":env!("ATLAS_RUSTC_VERSION"),"profile":env!("ATLAS_BUILD_PROFILE"),"target":env!("ATLAS_BUILD_TARGET"),"lock_sha256":sha256_hex(include_bytes!("../Cargo.lock")),"schema_version":1,"complete":samples.len()==48,"input_sha256":sha256_hex(&input),"input_bytes":input.len(),"samples":samples,"counter_sha256":sha256_hex(include_bytes!("../../../experiments/version-validation-lab/allocation_counter.rs")),"reader_sha256":sha256_hex(include_bytes!("../../../experiments/body-reader-lab/reader.rs")),"harness_sha256":sha256_hex(include_bytes!("body_reader_allocations.rs")),"scope":"Generated fragmentation of full retained bytes; requested Rust allocations only, not real HTTP, RSS or speed; baseline adds only checked limit arithmetic for safe experiment bounds"})
        )?
    );
    Ok(())
}
