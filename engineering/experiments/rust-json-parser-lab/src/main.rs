use serde_json::{Value, json};
use std::{hint::black_box, time::Instant};
fn baseline(input: &[u8]) -> Result<Value, String> {
    serde_json::from_slice(input).map_err(|e| e.to_string())
}
fn candidate(input: &[u8]) -> Result<Value, String> {
    let mut copy = input.to_vec();
    simd_json::serde::from_slice(&mut copy).map_err(|e| e.to_string())
}
fn equivalent(a: &Result<Value, String>, b: &Result<Value, String>) -> bool {
    match (a, b) {
        (Ok(x), Ok(y)) => x == y,
        (Err(_), Err(_)) => true,
        _ => false,
    }
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    if args.is_empty() || args.len() > 8 {
        return Err("Supply 1..8 local public JSON fixture paths".into());
    }
    let inputs: Vec<Vec<u8>> = args.iter().map(std::fs::read).collect::<Result<_, _>>()?;
    if inputs.iter().any(|b| b.len() > 2 * 1024 * 1024) {
        return Err("Fixture exceeds 2 MiB budget".into());
    }
    let started = Instant::now();
    let mut budget_exceeded = false;
    let mut workloads = Vec::new();
    for (index, bytes) in inputs.iter().enumerate() {
        let a = baseline(bytes);
        let b = candidate(bytes);
        let equal = equivalent(&a, &b) && a.is_ok();
        let mut trials = Vec::new();
        if equal {
            for round in 0..24 {
                let measure = |simd: bool| {
                    let began = Instant::now();
                    let mut last = None;
                    for _ in 0..100 {
                        last = Some(black_box(if simd {
                            candidate(black_box(bytes))
                        } else {
                            baseline(black_box(bytes))
                        }));
                    }
                    (began.elapsed().as_nanos(), last.unwrap())
                };
                let (b, c) = if round % 2 == 0 {
                    (measure(false), measure(true))
                } else {
                    let c = measure(true);
                    (measure(false), c)
                };
                trials.push(json!({"round":round,"warmup":round<4,"baseline_100_ns":b.0,"candidate_including_copy_100_ns":c.0,"full_value_equal":equivalent(&b.1,&c.1)}));
                if started.elapsed().as_secs() > 45 {
                    budget_exceeded = true;
                    break;
                }
            }
        }
        workloads.push(json!({"fixture_index":index,"input_bytes":bytes.len(),"initial_full_value_equal":equal,"baseline_accepted":a.is_ok(),"candidate_accepted":b.is_ok(),"trials":trials}));
        if budget_exceeded {
            break;
        }
    }
    let mut adversarial = Vec::new();
    for input in [
        "18446744073709551617",
        "1e400",
        "NaN",
        "\"\\uD800\"",
        "{\"id\":1,\"id\":2}",
        "-0.0",
        "2.2250738585072014e-308",
        "9007199254740993",
        "{\"a\":1,}",
    ] {
        let a = baseline(input.as_bytes());
        let b = candidate(input.as_bytes());
        adversarial
            .push(json!({"input":input,"equivalent":equivalent(&a,&b),"baseline":a,"candidate":b}));
    }
    let mut failures = 0;
    let mut examples = Vec::new();
    let mut state = 0x9e3779b97f4a7c15u64;
    let mut cases = 0;
    for case in 0..10_000 {
        if budget_exceeded || started.elapsed().as_secs() > 45 {
            budget_exceeded = true;
            break;
        }
        cases += 1;
        state ^= state << 13;
        state ^= state >> 7;
        state ^= state << 17;
        let input = if case % 5 == 0 {
            format!("{{\"number\":{}.{}e-10}}", state, state % 997)
        } else {
            format!(
                "{{\"id\":\"{}\",\"items\":[{},\"é\\n{}\",null,true]}}",
                state,
                state % 999,
                state % 31
            )
        };
        let a = baseline(input.as_bytes());
        let b = candidate(input.as_bytes());
        if !equivalent(&a, &b) {
            failures += 1;
            {
                examples.push(json!({"case":case,"input":input,"baseline":a,"candidate":b}));
            }
        }
    }
    let mut unicode_cases = 0;
    let mut unicode_failures = Vec::new();
    for cp in 0..=65535u32 {
        if started.elapsed().as_secs() > 45 {
            budget_exceeded = true;
            break;
        }
        let input = format!("\"\\u{cp:04X}\"");
        let a = baseline(input.as_bytes());
        let b = candidate(input.as_bytes());
        unicode_cases += 1;
        if !equivalent(&a, &b) {
            unicode_failures.push(json!({"input":input,"baseline":a,"candidate":b}));
        }
    }
    let mut pair_failures = Vec::new();
    let mut pair_cases = 0;
    for high in [0xd800u32, 0xd801, 0xda00, 0xdbff] {
        for low in [0u32, 0xdbff, 0xdc00, 0xdc01, 0xde00, 0xdfff, 0xe000, 0xffff] {
            let input = format!("\"\\u{high:04X}\\u{low:04X}\"");
            let a = baseline(input.as_bytes());
            let b = candidate(input.as_bytes());
            pair_cases += 1;
            if !equivalent(&a, &b) {
                pair_failures.push(json!({"input":input,"baseline":a,"candidate":b}));
            }
        }
    }
    #[cfg(target_arch = "x86_64")]
    let cpu = json!({"avx2":std::is_x86_feature_detected!("avx2"),"sse4_2":std::is_x86_feature_detected!("sse4.2")});
    #[cfg(not(target_arch = "x86_64"))]
    let cpu = json!(null);
    println!(
        "{}",
        serde_json::to_string_pretty(
            &json!({"scope":"isolated parsing component; real public JSON input; no target adoption","versions":{"serde_json":"1.0.154","simd_json":"0.18.1"},"cpu_features":cpu,"workloads":workloads,"adversarial":adversarial,"generated_stress":{"cases":cases,"failures":failures,"failure_evidence":examples,"seed":"9e3779b97f4a7c15"},"unicode_single_escape":{"cases":unicode_cases,"failure_evidence":unicode_failures},"unicode_pairs":{"cases":pair_cases,"failure_evidence":pair_failures},"elapsed_ms":started.elapsed().as_millis(),"complete":!budget_exceeded,"budget_exceeded":budget_exceeded,"limitations":["Candidate includes a fresh input copy for destructive parsing","No peak-memory, end-to-end adapter or hardware-isolation measurement","Four warmup rounds retained but excluded from rankings","Candidate default features only; no approximate numbers or known-key mode","Failures remain disqualifying evidence, not removed as inconvenient inputs"]})
        )?
    );
    Ok(())
}
