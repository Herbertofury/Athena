//! Fixed, bounded built-in experiment. No arbitrary code, downloads or automatic promotion.
use crate::{
    Decision, Evidence, Gate, Trial,
    collection::{indexed_unique, reference_unique},
};
use serde::Serialize;
use std::{
    hint::black_box,
    time::{Duration, Instant},
};
type Strategy = for<'a> fn(&'a [String]) -> Vec<&'a str>;
#[derive(Clone, Copy)]
struct Budget {
    input_count: usize,
    modulus: usize,
    warmups: usize,
    pairs: usize,
    stress_cases: usize,
    time: Duration,
}
impl Default for Budget {
    fn default() -> Self {
        Self {
            input_count: 6000,
            modulus: 4001,
            warmups: 2,
            pairs: 15,
            stress_cases: 10_000,
            time: Duration::from_secs(15),
        }
    }
}
#[derive(Debug, Serialize, PartialEq)]
pub enum StopReason {
    Completed,
    Cancelled,
    BudgetExhausted,
    CorrectnessFailure,
}
#[derive(Debug, Serialize)]
pub struct Failure {
    pub phase: &'static str,
    pub case_index: usize,
    pub input: Vec<String>,
    pub baseline_output: Vec<String>,
    pub candidate_output: Vec<String>,
}
#[derive(Debug, Serialize)]
pub struct RunOutput {
    pub evidence: Evidence,
    pub warmup_trials: Vec<Trial>,
    pub decision: Decision,
    pub reason: StopReason,
    pub completed: bool,
    pub first_failure: Option<Failure>,
    pub elapsed_ms: u64,
    pub limitations: Vec<&'static str>,
}
pub fn policy() -> Gate {
    Gate {
        minimum_pairs: 15,
        minimum_stress_cases: 10_000,
        minimum_speedup: 1.1,
        memory_budget_bytes: 64 * 1024 * 1024,
    }
}
fn finish(
    evidence: Evidence,
    warmup_trials: Vec<Trial>,
    reason: StopReason,
    first_failure: Option<Failure>,
    started: Instant,
) -> RunOutput {
    let decision = policy().evaluate(&evidence);
    RunOutput {
        completed: reason == StopReason::Completed,
        evidence,
        warmup_trials,
        decision,
        reason,
        first_failure,
        elapsed_ms: started.elapsed().as_millis().min(u64::MAX as u128) as u64,
        limitations: vec![
            "Generated identifiers, not a target application corpus",
            "Peak memory is unmeasured; review eligibility remains blocked",
            "Cooperative runner cancellation is tested separately, not asserted as per-strategy acceptance",
            "Timing shares a local service process; no isolated-host or whole-app speed claim",
            "Only built-in strategies run; no source rewriting, external candidates or deployment",
        ],
    }
}
fn failure(
    phase: &'static str,
    case_index: usize,
    input: &[String],
    a: &[&str],
    b: &[&str],
) -> Failure {
    Failure {
        phase,
        case_index,
        input: input.to_vec(),
        baseline_output: a.iter().map(|v| (*v).to_string()).collect(),
        candidate_output: b.iter().map(|v| (*v).to_string()).collect(),
    }
}
fn measure(strategy: Strategy, input: &[String]) -> (u64, Vec<&str>) {
    let start = Instant::now();
    let result = strategy(black_box(input));
    black_box(&result);
    (
        start.elapsed().as_nanos().min(u64::MAX as u128) as u64,
        result,
    )
}
/// Shared bounded input for the actual runner and isolated process measurements.
pub fn generated_input(count: usize, modulus: usize) -> Result<Vec<String>, &'static str> {
    if count == 0 || count > 6000 || modulus == 0 || modulus > 4001 {
        return Err("Built-in input bounds rejected");
    }
    Ok((0..count)
        .map(|i| format!("provider:item-{:05}", (i * 37) % modulus))
        .collect())
}
pub fn run_builtin(should_stop: impl FnMut() -> bool) -> Result<RunOutput, &'static str> {
    run_with(Budget::default(), indexed_unique, should_stop)
}
fn run_with(
    budget: Budget,
    candidate: Strategy,
    mut should_stop: impl FnMut() -> bool,
) -> Result<RunOutput, &'static str> {
    if budget.input_count == 0
        || budget.input_count > 6000
        || budget.modulus == 0
        || budget.modulus > 4001
        || budget.warmups > 2
        || budget.pairs == 0
        || budget.pairs > 15
        || budget.stress_cases > 10_000
        || budget.time > Duration::from_secs(15)
    {
        return Err("Built-in experiment budget rejected");
    }
    let started = Instant::now();
    let mut evidence = Evidence {
        candidate_revision: "indexed-unique-v1".into(),
        baseline_revision: "linear-unique-v1".into(),
        workload_id: format!(
            "generated-{}-ids-mod-{}-v1",
            budget.input_count, budget.modulus
        ),
        environment_id: format!(
            "{}; runner:{}",
            crate::build_identity::environment("bounded shared-process worker"),
            crate::build_identity::sha256_hex(include_bytes!("experiment_runner.rs"))
        ),
        trials: Vec::new(),
        stress_cases: 0,
        stress_failures: 0,
        correctness_failures: 0,
    };
    let mut warmups = Vec::new();
    macro_rules! checkpoint {
        () => {
            if should_stop() {
                return Ok(finish(
                    evidence,
                    warmups,
                    StopReason::Cancelled,
                    None,
                    started,
                ));
            }
            if started.elapsed() >= budget.time {
                return Ok(finish(
                    evidence,
                    warmups,
                    StopReason::BudgetExhausted,
                    None,
                    started,
                ));
            }
        };
    }
    checkpoint!();
    let input = generated_input(budget.input_count, budget.modulus)?;
    for round in 0..budget.warmups + budget.pairs {
        checkpoint!();
        let (a, b) = if round % 2 == 0 {
            (
                measure(reference_unique, &input),
                measure(candidate, &input),
            )
        } else {
            let b = measure(candidate, &input);
            (measure(reference_unique, &input), b)
        };
        let trial = Trial {
            baseline_ns: a.0,
            candidate_ns: b.0,
            equal_complete_output: a.1 == b.1,
            peak_bytes: 0,
            cancelled_cleanly: None,
        };
        if !trial.equal_complete_output {
            let failed = failure(
                if round < budget.warmups {
                    "warmup"
                } else {
                    "timing"
                },
                round,
                &input,
                &a.1,
                &b.1,
            );
            // A failed warmup is retained in evidence too, so a known failure cannot be hidden by missing samples.
            if round < budget.warmups {
                warmups.push(trial.clone());
            }
            evidence.trials.push(trial);
            return Ok(finish(
                evidence,
                warmups,
                StopReason::CorrectnessFailure,
                Some(failed),
                started,
            ));
        }
        if round < budget.warmups {
            warmups.push(trial);
        } else {
            evidence.trials.push(trial);
        }
    }
    let mut state = 0x71f023abcde9981u64;
    for case in 0..budget.stress_cases {
        checkpoint!();
        let input: Vec<String> = (0..case % 128)
            .map(|_| {
                state ^= state << 13;
                state ^= state >> 7;
                state ^= state << 17;
                format!("provider:{}/{}", state % 4, state % 31)
            })
            .collect();
        let a = reference_unique(&input);
        let b = candidate(&input);
        evidence.stress_cases += 1;
        if a != b {
            evidence.stress_failures += 1;
            return Ok(finish(
                evidence,
                warmups,
                StopReason::CorrectnessFailure,
                Some(failure("stress", case, &input, &a, &b)),
                started,
            ));
        }
    }
    checkpoint!();
    Ok(finish(
        evidence,
        warmups,
        StopReason::Completed,
        None,
        started,
    ))
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn shared_input_keeps_complete_original_fixture_and_bounds() {
        let input = generated_input(6000, 4001).unwrap();
        assert_eq!(
            crate::build_identity::sha256_hex(&serde_json::to_vec(&input).unwrap()),
            "2e5f76f3033afcac857586b31035db5cebb5cd721c4678987ba77b87cfd51b11"
        );
        for (count, modulus) in [(0, 1), (6001, 1), (1, 0), (1, 4002)] {
            assert!(generated_input(count, modulus).is_err());
        }
    }
    fn small() -> Budget {
        Budget {
            input_count: 64,
            modulus: 31,
            warmups: 1,
            pairs: 5,
            stress_cases: 20,
            time: Duration::from_secs(2),
        }
    }
    fn broken(_: &[String]) -> Vec<&str> {
        Vec::new()
    }
    fn broken_small(input: &[String]) -> Vec<&str> {
        if input.len() == 1 {
            Vec::new()
        } else {
            indexed_unique(input)
        }
    }
    #[test]
    fn complete_run_reports_actual_counts_without_blessing_missing_evidence() {
        let r = run_with(small(), indexed_unique, || false).unwrap();
        assert!(r.completed);
        assert_eq!(r.evidence.trials.len(), 5);
        assert_eq!(r.warmup_trials.len(), 1);
        assert_eq!(r.evidence.stress_cases, 20);
        assert!(matches!(r.decision, Decision::Incomplete(_)));
        assert!(
            r.evidence
                .trials
                .iter()
                .all(|t| t.peak_bytes == 0 && t.cancelled_cleanly.is_none())
        );
    }
    #[test]
    fn cancellation_retains_completed_trials() {
        let mut checks = 0;
        let r = run_with(small(), indexed_unique, || {
            checks += 1;
            checks == 4
        })
        .unwrap();
        assert_eq!(r.reason, StopReason::Cancelled);
        assert!(!r.completed);
        assert_eq!(r.warmup_trials.len(), 1);
        assert_eq!(r.evidence.trials.len(), 1);
    }
    #[test]
    fn exhausted_budget_never_claims_completion() {
        let mut b = small();
        b.time = Duration::ZERO;
        let r = run_with(b, indexed_unique, || false).unwrap();
        assert_eq!(r.reason, StopReason::BudgetExhausted);
        assert!(r.evidence.trials.is_empty());
    }
    #[test]
    fn failed_warmup_is_stabilization_not_missing_evidence() {
        let r = run_with(small(), broken, || false).unwrap();
        assert_eq!(r.reason, StopReason::CorrectnessFailure);
        assert!(matches!(r.decision, Decision::Stabilize(_)));
        let failure = r.first_failure.unwrap();
        assert_eq!(failure.phase, "warmup");
        assert_eq!(failure.input.len(), 64);
        assert!(!failure.baseline_output.is_empty());
        assert!(failure.candidate_output.is_empty());
    }
    #[test]
    fn stress_failure_retains_exact_reproducer() {
        let r = run_with(small(), broken_small, || false).unwrap();
        assert_eq!(r.evidence.stress_cases, 2);
        assert_eq!(r.evidence.stress_failures, 1);
        assert_eq!(r.first_failure.unwrap().phase, "stress");
        assert!(matches!(r.decision, Decision::Stabilize(_)));
    }
    #[test]
    fn oversized_configuration_is_rejected_before_work() {
        let mut b = small();
        b.input_count = 6001;
        assert!(run_with(b, indexed_unique, || false).is_err());
    }
}
