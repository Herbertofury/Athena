# Windows optimization comparison worksheet

Status: template only. No target-machine benchmark results are claimed.

## Experiment contract
- Candidate / exact version / official source:
- Goal and minimum worthwhile improvement (declare before testing):
- Windows build, hardware class, driver versions (redact personal identifiers):
- Original settings and exact rollback:
- Required functionality, security, accessibility, offline/data durability constraints:
- Backup restore check and consent for any sensitive change:

## Paired protocol
1. Same input files, scene/task, resolution, app version and background workload.
2. Capture baseline and candidate in alternating order; at least five runs each as an initial screening, more where variance warrants. Report all runs, not only fastest.
3. Separate cold/warm caches, plugged-in/battery, idle/sustained thermals. Avoid comparing different power conditions.
4. Record task completion and correctness before speed. Capture wall time; relevant p50/p95/p99 frame or interaction times; CPU/RAM/disk; power/temperature where supported. Record measurement overhead and unsupported counters.
5. Validate restart, crash recovery, retained data, offline use and task-specific dependencies. Revert and retest the original configuration.

| Run | Baseline/candidate | Cold/warm | Duration | Correct? | Tail latency | RAM | Disk I/O | Power/temp | Failure/evidence |
|---|---|---|---|---|---|---|---|---|---|
| Not run | | | | | | | | | |

## Decision
- Raw evidence location (private by default for personal traces):
- Difference and run-to-run variability:
- Regression or failure, including unsuccessful trials:
- Security/energy/noise tradeoff:
- Rollback verified:
- Outcome: not run / inconclusive / rejected / accepted for named workload only.

Publish only sanitized summaries and non-sensitive reproducible fixtures. No private paths, account identifiers, memory captures or tokens in public Athena.
