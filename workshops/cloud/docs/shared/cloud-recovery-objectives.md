# Measure the recovery gap and verify a local restore

Distinguish recovery-time and recovery-point targets, then recover invented data safely.

**Study time:** about 45 minutes, with pauses for prediction and practice.

## You will learn to

- Compute downtime and the age of the recoverable data point.
- Compare those observations with separate RTO and RPO targets.
- Verify a real local copy/restore without claiming cloud disaster recovery.

## Learn

Recovery objectives translate workload impact into testable targets. RTO concerns the acceptable time from service interruption to restoration. RPO concerns the acceptable gap between the recoverable data point and the incident. They answer different questions: how long service can be unavailable and how much recent work could be missing, expressed here in minutes.

A target is not a result. Define it with the people affected by downtime and data loss, then test a recovery method against it. An objective written in a diagram does not cause a backup to finish, an operator to be available or an application to restart. Dependencies and restore verification belong in the plan, not as afterthoughts.

Our invented timeline uses minutes from a fixed origin. The last recoverable point is minute 580, the incident is at 600 and service is restored at 650. The recoverable-data gap is 20 minutes and downtime is 50 minutes. Against RPO 15 and RTO 60, the scenario misses RPO while meeting RTO. Fast enough recovery can still restore data that is too old.

A backup schedule alone does not prove the most recent point is usable. A job can fail, a copy can be incomplete, an access dependency can be missing or an application can reject restored data. Verify recovery content and application behavior in an appropriate test. The strength of the evidence depends on what was actually restored and checked.

The separate restore command performs a real but tiny local exercise. It creates an owned temporary directory, writes invented report bytes, copies an earlier version, changes the source and restores the earlier copy into a new file. SHA-256 comparisons verify that the restored bytes match the earlier version, while the current source differs. It then cleans up only its own temporary directory.

This byte-for-byte local check does not establish cloud storage durability, encrypted-backup key access, database consistency, regional recovery or the fictional timeline’s measured duration. Do not time the tiny file operation and call it the service’s RTO. Keep two evidence labels: a synthetic recovery timeline and an actual local file-restore check. Real-cloud recovery remains unexecuted.

## Worked example

The recovery command reports a 20-minute data gap and 50-minute downtime: rpo_met=false, rto_met=true. The restore command independently reports that backup and restored content match the original, current source differs, and the temporary directory was removed. No user file is replaced, no account is contacted and no disaster is caused.

## Practice safely

1. Draw the three timestamps and calculate both intervals before running.
2. Run python3 labs/cloud-workshop/run_lab.py recovery.
3. Explain why meeting RTO does not imply meeting RPO.
4. Run python3 labs/cloud-workshop/run_lab.py restore and inspect all verification flags.
5. List three application-level recovery checks that byte equality does not cover.
6. Record the timeline as modeled, the file restore as local execution and cloud DR as unexecuted.

Use the [offline lab guide](../../labs/cloud-workshop/README.md) for commands and paper alternatives.

## Three original checks

### Check 1

The last recoverable point is 580 and the incident is 600. What is the data gap?

A. 15 minutes
B. 50 minutes
C. 60 minutes
D. 20 minutes

<details><summary>Answer and reasoning</summary>

D. 20 minutes. The incident minus the last recoverable point is 20 minutes.

</details>

### Check 2

The scenario meets RTO 60 but misses RPO 15. What does that mean?

A. The restored data point is too old despite acceptable modeled downtime
B. No recovery happened anywhere
C. The two objectives are identical
D. A backup always guarantees zero loss

<details><summary>Answer and reasoning</summary>

A. The restored data point is too old despite acceptable modeled downtime. Downtime is 50 minutes, but the recoverable-data gap is 20, exceeding the 15-minute objective.

</details>

### Check 3

What does the local restore actually verify?

A. Regional cloud disaster recovery
B. Equality of synthetic restored bytes to their earlier copy and cleanup of its temporary directory
C. Application-level database consistency
D. The production RTO

<details><summary>Answer and reasoning</summary>

B. Equality of synthetic restored bytes to their earlier copy and cleanup of its temporary directory. The command verifies its own bounded local operation. It cannot establish unexecuted provider-side or application recovery behavior.

</details>

## Evidence to keep

- A labelled timeline with two objective comparisons.
- Actual local restore output.
- Separate modeled, locally executed and cloud-unexecuted evidence.

## Limits

The timeline is synthetic and the restore is a local file copy. No cloud backups, keys, databases, failover, recovery service or real workload RTO/RPO was exercised.

## Official references

- https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/disaster-recovery-dr-objectives.html
- https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_planning_for_recovery_objective_defined_recovery.html
