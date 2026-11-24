# Prove a restore instead of trusting a backup label

Measure a synthetic recovery window and verify content separately.

## Learning goals

- Distinguish RPO, RTO and actual recovery measurements.
- Explain backup independence and failure domains.
- Verify a copy without claiming a complete disaster-recovery test.

## Learn

A backup is a recoverable copy made for a defined purpose. Synchronization and redundancy can replicate accidental deletion or corruption, so they do not automatically provide independent recovery points. Decide what failures must be survived: a lost disk, an account takeover, ransomware, regional loss or an accidental overwrite require different designs.

Recovery point objective, or RPO, states the acceptable data-loss window measured in time. Recovery time objective, or RTO, states the target time to restore the defined service after disruption. Objectives express needs. Actual recovery time and the age of the usable restored point are measurements. Neither objective is guaranteed by a backup job’s green status.

Define exactly what “recovered” means. A file can be readable while the application cannot start. A database can open while related files are from a different point in time. Include dependency order, identity access, keys, configuration and a user workflow in a real plan. Keep recovery material protected but available to the authorized recovery team.

A useful restore test retrieves a selected recovery point into an isolated destination, verifies expected content and performs representative operations. Preserve the source and avoid overwriting the only remaining copy. Check whether the recovered data is trusted, not merely old. A backup that contains the same compromise may restore the problem.

Cedar’s paper scenario has a disruption at 10:20 UTC, a last usable recovery point at 10:00 and validated return to service at 10:55. The measured data-loss window is 20 minutes and recovery time is 35 minutes. Against RPO 15 minutes and RTO 60 minutes, the scenario misses RPO but meets RTO. Passing one does not cancel failing the other.

Our executable lab uses an isolated temporary directory and synthetic bytes for a real local copy-and-hash check. The scenario times are supplied fictional timestamps; they are not a measured disaster recovery. The temporary directory is created and cleaned by the program. It never restores over a user path and does not change backup settings.

## Worked example

The copy experiment returns matching hashes for original and restored synthetic files, then detects a changed byte in a second copy. That is real evidence of those local file comparisons. The timing exercise separately calculates 20 minutes of potential loss and 35 minutes to service validation from invented records. An honest report says both things and identifies the missing application, dependency, key-recovery and failure-domain tests. It does not say “all backups verified” or “RPO achieved” based on one copy.

## Practice safely

1. Calculate the scenario’s recovery time and data-loss window before running the tool.
2. Run python3 labs/security-foundations/offline_lab.py recovery.
3. Compare actual values with the stated RPO and RTO separately.
4. Run the integrity command for the actual local synthetic-copy check.
5. List the dependencies absent from a one-file restore.
6. Write an acceptance record distinguishing real local outputs from fictional timing assumptions.

## Evidence to keep

- Correct separate RPO/RTO calculations.
- Actual synthetic-copy output.
- A list of untested service dependencies and failure domains.

## Original check 1

A 20-minute loss window is compared with an RPO of 15 minutes. What is the result?

- RPO missed by five minutes in this scenario
- RPO met because the restore was fast
- RTO must also fail
- All data is necessarily lost

<details><summary>Answer and explanation</summary>

RPO missed by five minutes in this scenario. The recovery point is older than the stated acceptable loss window. Recovery speed is a different measure.

</details>

## Original check 2

Why is synchronization alone not sufficient evidence of a backup strategy?

- Synchronization never transfers data
- It can propagate deletion or corruption to the other copy
- All replicas are offline
- It always proves independence

<details><summary>Answer and explanation</summary>

It can propagate deletion or corruption to the other copy. Independent recoverable versions and failure-domain separation need deliberate design.

</details>

## Original check 3

A restored file’s hash matches a trusted original. What remains unproven?

- Whether those compared bytes match
- The hash comparison result
- Every application dependency and end-to-end recovery workflow
- The fact that the local copy exists

<details><summary>Answer and explanation</summary>

Every application dependency and end-to-end recovery workflow. Byte equality is useful but narrow. It does not validate the full service and all dependencies.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

Only the temporary file-copy check is physically executed. No real backup system, application restore, ransomware recovery or business continuity exercise is performed.

## Official references

- [NIST SP 800-34 Revision 1: Contingency Planning](https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final)

- [Python hashlib documentation](https://docs.python.org/3/library/hashlib.html)

