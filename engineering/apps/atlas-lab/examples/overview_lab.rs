//! Bounded serialization experiment using replayed public metadata, not production acceptance.
use atlas_lab::jobs::{Job, Queue};
use serde_json::{Value, json};
use std::{fs::File, io::Write, path::Path, time::Instant};
fn process_peak_rss_kib() -> Option<u64> {
    #[cfg(target_os = "linux")]
    {
        // Current executable's address-space high-water mark, not launcher's wait4 history.
        let status = std::fs::read_to_string("/proc/self/status").ok()?;
        let line = status.lines().find(|line| line.starts_with("VmHWM:"))?;
        let mut fields = line.split_whitespace();
        if fields.next()? != "VmHWM:" {
            return None;
        }
        let kib = fields.next()?.parse().ok()?;
        if fields.next()? != "kB" {
            return None;
        }
        Some(kib)
    }
    #[cfg(not(target_os = "linux"))]
    {
        None
    }
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() == 5 && args[1] == "fixture" {
        let path = Path::new(&args[2]);
        if path.exists() {
            return Err("Refusing to overwrite prior fixture evidence".into());
        }
        let count: usize = args[3].parse()?;
        if ![1, 10, 50].contains(&count) {
            return Err("Expected 1, 10 or 50 replay jobs".into());
        }
        let capture: Vec<Value> = serde_json::from_reader(File::open(&args[4])?)?;
        let projects = capture
            .iter()
            .find(|v| v["kind"] == "sample")
            .ok_or("Missing public sample")?["projects"]
            .clone();
        let ids: Vec<String> = projects
            .as_array()
            .ok_or("Missing projects")?
            .iter()
            .map(|p| p["id"].as_str().map(str::to_string).ok_or("Missing ID"))
            .collect::<Result<_, _>>()?;
        let result = json!({"batch":{"requested_ids":ids,"projects":projects,"missing_ids":[]},"scope":"replayed public metadata fixture; not a new network collection"});
        let mut q = Queue::open(path)?;
        for i in 0..count as i64 {
            q.enqueue(
                &Job::CollectModrinthBatch {
                    projects: ids.clone(),
                },
                i * 3,
            )?;
            let c = q
                .claim("fixture", i * 3 + 1, 1000)?
                .ok_or("Claim missing")?;
            q.finish_output(&c, true, i * 3 + 2, Some(&result))?;
        }
        println!(
            "{}",
            json!({"fixture_jobs":count,"public_project_count":ids.len(),"network_requests":0})
        );
        return Ok(());
    }
    if args.len() != 4 || !["baseline", "candidate"].contains(&args[1].as_str()) {
        return Err(
            "Use fixture DB COUNT PUBLIC_CAPTURE or baseline|candidate DB ITERATIONS".into(),
        );
    }
    let iterations: usize = args[3].parse()?;
    if !(1..=30).contains(&iterations) {
        return Err("Iteration budget is 1..=30".into());
    }
    if !Path::new(&args[2]).exists() {
        return Err("Fixture database must exist".into());
    }
    let q = Queue::open(Path::new(&args[2]))?;
    let mut samples = Vec::new();
    let mut reference = None;
    for iteration in 0..iterations {
        let start = Instant::now();
        let output = if args[1] == "baseline" {
            serde_json::to_vec(&q.overview()?)?
        } else {
            q.overview_raw_candidate()?
        };
        let elapsed_ns = start.elapsed().as_nanos();
        std::hint::black_box(&output);
        if let Some(expected) = &reference {
            if expected != &output {
                return Err("Full serialized output changed within a fixed workload".into());
            }
        } else {
            reference = Some(output.clone());
        }
        samples.push(json!({"iteration":iteration,"elapsed_ns":elapsed_ns,"output_bytes":output.len(),"full_output_stable":true}));
    }
    eprintln!(
        "{}",
        json!({"strategy":args[1],"iterations":iterations,"samples":samples,"process_peak_rss_kib":process_peak_rss_kib(),"limitations":["Replayed queue history, not live production load","Retains first output for full-byte stability checks outside timer","RSS includes process startup, SQLite, validator, output and retained reference","OS/filesystem cache uncontrolled; not cold-disk measurement","No UI or network request timing"]})
    );
    std::io::stdout().write_all(reference.as_ref().ok_or("No output")?)?;
    Ok(())
}
