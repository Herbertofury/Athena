//! Fixed saved-record experiment. No network, arbitrary code or automatic promotion.
use crate::build_identity::sha256_hex as digest;
use crate::{
    Decision, Evidence, Gate, Trial, experiment_runner::StopReason,
    modrinth_versions::VersionRecord,
};
use serde::Serialize;
use std::{
    hint::black_box,
    time::{Duration, Instant},
};
type Parser = fn(&[u8]) -> Result<VersionRecord, Box<dyn std::error::Error>>;
#[derive(Clone, Copy)]
struct Budget {
    warmups: usize,
    pairs: usize,
    iterations: usize,
    stress: usize,
    time: Duration,
}
impl Default for Budget {
    fn default() -> Self {
        Self {
            warmups: 4,
            pairs: 20,
            iterations: 100,
            stress: 10000,
            time: Duration::from_secs(15),
        }
    }
}
#[derive(Debug, Serialize)]
pub struct Source {
    pub canonical_id: String,
    pub project_id: String,
    pub generation: String,
    pub payload_sha256: String,
    pub payload_bytes: usize,
    pub provenance: &'static str,
}
#[derive(Debug, Serialize)]
pub struct Sample {
    pub phase: &'static str,
    pub round: usize,
    pub strategy: &'static str,
    pub completed_iterations: usize,
    pub elapsed_ns: u64,
    pub equal_complete_output: bool,
}
#[derive(Debug, Serialize)]
pub struct Outcome {
    pub accepted: bool,
    pub canonical_id: Option<String>,
    pub project_id: Option<String>,
    pub payload: Option<String>,
    pub error: Option<String>,
}
#[derive(Debug, Serialize)]
pub struct Failure {
    pub phase: &'static str,
    pub case_index: usize,
    pub strategy: &'static str,
    pub input: String,
    pub expected: Outcome,
    pub observed: Outcome,
}
#[derive(Debug, Serialize)]
pub struct RunOutput {
    pub evidence: Evidence,
    pub warmup_trials: Vec<Trial>,
    pub samples: Vec<Sample>,
    pub decision: Decision,
    pub reason: StopReason,
    pub completed: bool,
    pub source: Source,
    pub first_failure: Option<Failure>,
    pub iterations_per_sample: usize,
    pub runner_revision: String,
    pub elapsed_ms: u64,
    pub limitations: Vec<&'static str>,
}
pub fn policy() -> Gate {
    Gate {
        minimum_pairs: 15,
        minimum_stress_cases: 10000,
        minimum_speedup: 1.1,
        memory_budget_bytes: 64 * 1024 * 1024,
    }
}
fn same(a: &VersionRecord, b: &VersionRecord) -> bool {
    a.canonical_id == b.canonical_id
        && a.project_id == b.project_id
        && a.payload.get() == b.payload.get()
}
fn outcome(value: Result<&VersionRecord, &dyn std::error::Error>) -> Outcome {
    match value {
        Ok(r) => Outcome {
            accepted: true,
            canonical_id: Some(r.canonical_id.clone()),
            project_id: Some(r.project_id.clone()),
            payload: Some(r.payload.get().into()),
            error: None,
        },
        Err(e) => Outcome {
            accepted: false,
            canonical_id: None,
            project_id: None,
            payload: None,
            error: Some(e.to_string()),
        },
    }
}
fn view(result: &Result<VersionRecord, Box<dyn std::error::Error>>) -> Outcome {
    outcome(result.as_ref().map_err(|e| e.as_ref()))
}
fn stop_reason(
    start: Instant,
    budget: Budget,
    should_stop: &mut impl FnMut() -> bool,
) -> Option<StopReason> {
    if should_stop() {
        Some(StopReason::Cancelled)
    } else if start.elapsed() >= budget.time {
        Some(StopReason::BudgetExhausted)
    } else {
        None
    }
}
struct Context {
    evidence: Evidence,
    warmups: Vec<Trial>,
    samples: Vec<Sample>,
    source: Source,
    iterations: usize,
    started: Instant,
}
fn finish(c: Context, reason: StopReason, failure: Option<Failure>) -> RunOutput {
    let decision = policy().evaluate(&c.evidence);
    RunOutput {
        completed: reason == StopReason::Completed,
        evidence: c.evidence,
        warmup_trials: c.warmups,
        samples: c.samples,
        decision,
        reason,
        source: c.source,
        first_failure: failure,
        iterations_per_sample: c.iterations,
        runner_revision: digest(include_str!("version_experiment_runner.rs").as_bytes()),
        elapsed_ms: c.started.elapsed().as_millis().min(u64::MAX as u128) as u64,
        limitations: vec![
            "Stored snapshot provenance is recorded, not independently authenticated by this run",
            "Generated stress augmentations are separate from the unchanged stored timing input",
            "No network, storage or UI speedup is measured here",
            "Build fingerprints do not establish identical CPUs, host load or isolation",
            "Peak process memory and per-strategy cancellation acceptance are unmeasured; no promotion",
            "Failure payloads remain in the local database; review before any publication",
            "Only fixed compiled strategies run; no source rewriting, arbitrary executable or deployment",
        ],
    }
}
struct Measurement {
    sample: Sample,
    stop: Option<StopReason>,
    failure: Option<Failure>,
}
#[derive(Clone, Copy)]
struct SampleContext<'a> {
    phase: &'static str,
    round: usize,
    input: &'a str,
    reference: &'a VersionRecord,
    budget: Budget,
    started: Instant,
}
fn measure(
    parser: Parser,
    name: &'static str,
    context: SampleContext<'_>,
    should_stop: &mut impl FnMut() -> bool,
) -> Measurement {
    let SampleContext {
        phase,
        round,
        input,
        reference,
        budget,
        started,
    } = context;
    let began = Instant::now();
    let mut sample = Sample {
        phase,
        round,
        strategy: name,
        completed_iterations: 0,
        elapsed_ns: 0,
        equal_complete_output: true,
    };
    for i in 0..budget.iterations {
        if let Some(reason) = stop_reason(started, budget, should_stop) {
            sample.elapsed_ns = began.elapsed().as_nanos().min(u64::MAX as u128) as u64;
            return Measurement {
                sample,
                stop: Some(reason),
                failure: None,
            };
        }
        let result = parser(black_box(input.as_bytes()));
        sample.completed_iterations = i + 1;
        if !result.as_ref().is_ok_and(|r| same(black_box(r), reference)) {
            sample.elapsed_ns = began.elapsed().as_nanos().min(u64::MAX as u128) as u64;
            sample.equal_complete_output = false;
            return Measurement {
                sample,
                stop: Some(StopReason::CorrectnessFailure),
                failure: Some(Failure {
                    phase,
                    case_index: i,
                    strategy: name,
                    input: input.into(),
                    expected: outcome(Ok(reference)),
                    observed: view(&result),
                }),
            };
        }
    }
    sample.elapsed_ns = began.elapsed().as_nanos().min(u64::MAX as u128) as u64;
    Measurement {
        sample,
        stop: None,
        failure: None,
    }
}
pub fn run_stored_version(
    id: &str,
    generation: i64,
    input: &str,
    should_stop: impl FnMut() -> bool,
) -> Result<RunOutput, &'static str> {
    run_with(
        id,
        generation,
        input,
        Budget::default(),
        crate::version_validation_candidate::parse_version,
        should_stop,
    )
}
fn run_with(
    id: &str,
    generation: i64,
    input: &str,
    budget: Budget,
    candidate: Parser,
    mut should_stop: impl FnMut() -> bool,
) -> Result<RunOutput, &'static str> {
    if generation < 1
        || input.len() > 256 * 1024
        || budget.warmups > 4
        || budget.pairs == 0
        || budget.pairs > 20
        || budget.iterations == 0
        || budget.iterations > 100
        || budget.stress > 10000
        || budget.time > Duration::from_secs(15)
    {
        return Err("Saved-version experiment budget rejected");
    }
    let started = Instant::now();
    let reference = crate::modrinth_versions::parse_version(input.as_bytes())
        .map_err(|_| "Saved version is invalid")?;
    if reference.canonical_id != id {
        return Err("Saved version identity mismatch");
    }
    let source = Source {
        canonical_id: id.into(),
        project_id: reference.project_id.clone(),
        generation: generation.to_string(),
        payload_sha256: digest(input.as_bytes()),
        payload_bytes: input.len(),
        provenance: "local stored Modrinth-version snapshot; selected once at worker start",
    };
    let mut c = Context {
        evidence: Evidence {
            candidate_revision: format!(
                "fixed-fields:{}:validator:{}",
                digest(
                    include_str!("../../../experiments/version-validation-lab/candidate.rs")
                        .as_bytes()
                ),
                digest(include_str!("validated_raw.rs").as_bytes())
            ),
            baseline_revision: format!(
                "value-tree:{}",
                digest(include_str!("modrinth_versions.rs").as_bytes())
            ),
            workload_id: format!(
                "version:{}:sha256:{}:iterations:{}",
                id, source.payload_sha256, budget.iterations
            ),
            environment_id: format!(
                "{}; runner:{}",
                crate::build_identity::environment("bounded shared-process version worker"),
                digest(include_str!("version_experiment_runner.rs").as_bytes())
            ),
            trials: Vec::new(),
            stress_cases: 0,
            stress_failures: 0,
            correctness_failures: 0,
        },
        warmups: Vec::new(),
        samples: Vec::new(),
        source,
        iterations: budget.iterations,
        started,
    };
    for round in 0..budget.warmups + budget.pairs {
        let phase = if round < budget.warmups {
            "warmup"
        } else {
            "timing"
        };
        let mut times = [0u64; 2];
        let order = if round % 2 == 0 { [0, 1] } else { [1, 0] };
        for strategy in order {
            let (parser, name): (Parser, &'static str) = if strategy == 0 {
                (crate::modrinth_versions::parse_version, "baseline")
            } else {
                (candidate, "candidate")
            };
            let m = measure(
                parser,
                name,
                SampleContext {
                    phase,
                    round,
                    input,
                    reference: &reference,
                    budget,
                    started,
                },
                &mut should_stop,
            );
            times[strategy] = m.sample.elapsed_ns;
            c.samples.push(m.sample);
            if let Some(reason) = m.stop {
                if reason == StopReason::CorrectnessFailure {
                    c.evidence.correctness_failures += 1;
                }
                return Ok(finish(c, reason, m.failure));
            }
        }
        let trial = Trial {
            baseline_ns: times[0],
            candidate_ns: times[1],
            equal_complete_output: true,
            peak_bytes: 0,
            cancelled_cleanly: None,
        };
        if round < budget.warmups {
            c.warmups.push(trial);
        } else {
            c.evidence.trials.push(trial);
        }
    }
    let prefix = input
        .trim_end()
        .strip_suffix('}')
        .ok_or("Saved version must be an object")?;
    for case in 0..budget.stress {
        if let Some(reason) = stop_reason(started, budget, &mut should_stop) {
            return Ok(finish(c, reason, None));
        }
        let tail = match case % 7 {
            0 => "\"\\uD800\"".into(),
            1 => "1e400".into(),
            2 => format!("{}0{}", "[".repeat(130), "]".repeat(130)),
            _ => format!("\"case-{case}-full-\\u00e9\""),
        };
        let generated = if case % 7 == 3 {
            format!("{prefix},\"id\":\"{id}\"}}")
        } else {
            format!("{prefix},\"__atlas_generated_stress_case\":{tail}}}")
        };
        let a = crate::modrinth_versions::parse_version(generated.as_bytes());
        let b = candidate(generated.as_bytes());
        c.evidence.stress_cases += 1;
        let equal = match (&a, &b) {
            (Ok(a), Ok(b)) => same(a, b),
            (Err(_), Err(_)) => true,
            _ => false,
        };
        if !equal {
            c.evidence.stress_failures += 1;
            return Ok(finish(
                c,
                StopReason::CorrectnessFailure,
                Some(Failure {
                    phase: "generated-stress",
                    case_index: case,
                    strategy: "candidate",
                    input: generated,
                    expected: view(&a),
                    observed: view(&b),
                }),
            ));
        }
    }
    if let Some(reason) = stop_reason(started, budget, &mut should_stop) {
        return Ok(finish(c, reason, None));
    }
    Ok(finish(c, StopReason::Completed, None))
}
#[cfg(test)]
mod tests {
    use super::*;
    fn fixture() -> String {
        r#"{"id":"abcdefgh","project_id":"AANobbMI","name":"fixture","version_number":"1","date_published":"2026-10-27","game_versions":["1.21.1"],"loaders":["fabric"],"files":[],"dependencies":[],"unknown":18446744073709551617}"#.into()
    }
    fn budget() -> Budget {
        Budget {
            warmups: 1,
            pairs: 5,
            iterations: 2,
            stress: 64,
            time: Duration::from_secs(2),
        }
    }
    #[test]
    fn hash_matches_known_standard_vector() {
        assert_eq!(
            digest(b"abc"),
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
    }
    #[test]
    fn complete_run_keeps_raw_samples_and_blocks_promotion() {
        let f = fixture();
        let r = run_with(
            "abcdefgh",
            7,
            &f,
            budget(),
            crate::version_validation_candidate::parse_version,
            || false,
        )
        .unwrap();
        assert!(r.completed);
        assert_eq!(r.samples.len(), 12);
        assert_eq!(r.evidence.trials.len(), 5);
        assert_eq!(r.evidence.stress_cases, 64);
        assert_eq!(r.source.payload_sha256, digest(f.as_bytes()));
        assert!(matches!(r.decision, Decision::Incomplete(_)));
    }
    #[test]
    fn interrupted_sample_is_retained_without_fabricated_pair() {
        let mut checks = 0;
        let r = run_with(
            "abcdefgh",
            1,
            &fixture(),
            budget(),
            crate::version_validation_candidate::parse_version,
            || {
                checks += 1;
                checks > 1
            },
        )
        .unwrap();
        assert_eq!(r.reason, StopReason::Cancelled);
        assert_eq!(r.samples[0].completed_iterations, 1);
        assert!(r.evidence.trials.is_empty());
        assert!(!r.completed);
    }
    #[test]
    fn zero_time_budget_retains_zero_iteration_receipt() {
        let mut b = budget();
        b.time = Duration::ZERO;
        let r = run_with(
            "abcdefgh",
            1,
            &fixture(),
            b,
            crate::version_validation_candidate::parse_version,
            || false,
        )
        .unwrap();
        assert_eq!(r.reason, StopReason::BudgetExhausted);
        assert_eq!(r.samples[0].completed_iterations, 0);
    }
    fn bad(input: &[u8]) -> Result<VersionRecord, Box<dyn std::error::Error>> {
        let mut r = crate::modrinth_versions::parse_version(input)?;
        r.project_id = "WRONGID1".into();
        Ok(r)
    }
    #[test]
    fn known_failure_is_stabilize_even_before_a_complete_pair() {
        let r = run_with("abcdefgh", 1, &fixture(), budget(), bad, || false).unwrap();
        assert_eq!(r.reason, StopReason::CorrectnessFailure);
        assert_eq!(r.evidence.correctness_failures, 1);
        assert!(r.evidence.trials.is_empty());
        assert!(r.first_failure.is_some());
        assert!(matches!(r.decision, Decision::Stabilize(_)));
    }
    #[test]
    fn rejects_wrong_identity_generation_and_oversize_input() {
        assert!(run_stored_version("ijklmnop", 1, &fixture(), || false).is_err());
        assert!(run_stored_version("abcdefgh", 0, &fixture(), || false).is_err());
        assert!(run_stored_version("abcdefgh", 1, &" ".repeat(256 * 1024 + 1), || false).is_err());
    }
}
