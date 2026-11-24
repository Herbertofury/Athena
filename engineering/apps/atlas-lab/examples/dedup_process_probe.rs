//! Fixed pure strategies only. Memory is sampled before evidence serialization.
#[path = "../../../experiments/process-memory-lab/linux_memory.rs"]
mod linux_memory;
use atlas_lab::{
    build_identity::sha256_hex,
    collection::{indexed_unique, reference_unique},
    experiment_runner::{generated_input, run_builtin},
};
use sha2::{Digest, Sha256};
use std::{
    hint::black_box,
    io::{self, Write},
    time::Instant,
};
type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;
struct DigestWriter(Sha256);
impl Write for DigestWriter {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        self.0.update(bytes);
        Ok(bytes.len())
    }
    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}
fn main() -> Result<()> {
    let args: Vec<_> = std::env::args().collect();
    if args.len() != 2 || !["baseline", "indexed", "engine"].contains(&args[1].as_str()) {
        return Err("Choose fixed baseline, indexed or engine mode".into());
    }
    if !cfg!(target_os = "linux") {
        return Err("Linux self-memory evidence only".into());
    }
    let lane = &args[1];
    if lane == "engine" {
        let result = run_builtin(|| false)?;
        println!("{}", serde_json::to_string(&result)?);
        return Ok(());
    }
    let before_input = linux_memory::memory()?;
    let input = generated_input(6000, 4001)?;
    let mut input_hash = DigestWriter(Sha256::new());
    serde_json::to_writer(&mut input_hash, &input)?;
    let input_hash = {
        let digest = input_hash.0.finalize();
        let mut text = String::with_capacity(64);
        const HEX: &[u8; 16] = b"0123456789abcdef";
        for byte in digest.iter().copied() {
            text.push(HEX[(byte >> 4) as usize] as char);
            text.push(HEX[(byte & 15) as usize] as char);
        }
        text
    };
    let after_input = linux_memory::memory()?;
    let started = Instant::now();
    let output = if lane == "baseline" {
        reference_unique(black_box(&input))
    } else {
        indexed_unique(black_box(&input))
    };
    black_box(&output);
    let elapsed_ns = started.elapsed().as_nanos();
    let retained_output = linux_memory::memory()?;
    println!(
        "{}",
        serde_json::to_string(
            &serde_json::json!({"schema_version":1,"lane":lane,"input_count":input.len(),"input_sha256":input_hash,"output":output,"elapsed_ns":elapsed_ns,"before_input":before_input,"after_input":after_input,"retained_output":retained_output,"source_sha256":sha256_hex(include_bytes!("dedup_process_probe.rs")),"runner_sha256":sha256_hex(include_bytes!("../src/experiment_runner.rs")),"strategies_sha256":sha256_hex(include_bytes!("../src/collection.rs")),"observer_sha256":sha256_hex(include_bytes!("../../../experiments/process-memory-lab/linux_memory.rs")),"compiler":env!("ATLAS_RUSTC_VERSION"),"profile":env!("ATLAS_BUILD_PROFILE"),"opt_level":env!("ATLAS_OPT_LEVEL"),"flags_sha256":env!("ATLAS_BUILD_FLAGS_SHA256"),"target":env!("ATLAS_BUILD_TARGET"),"lock_sha256":sha256_hex(include_bytes!("../Cargo.lock")),"scope":"Fresh process, one full strategy call; Linux self high-water through output retention before evidence serialization; includes input and observer overhead; not app or browser peak"})
        )?
    );
    Ok(())
}
