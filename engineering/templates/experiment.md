# Experiment: <falsifiable improvement>

## Before running

Hypothesis; exact baseline/candidate revisions; target platform/hardware; workload hash; expected complete result; warnings and error semantics; allowed nonsemantic normalization fields; trial count/order; background load; acceptance target and resource ceilings.

## Run matrix

Reference/serial where practical, then 4, 8, 16, 32 and 64 workers if safe and applicable. Separate cold, warm and changed-input conditions. Do not run candidates simultaneously. Record skipped unsafe configurations with the reason.

## Evidence

Raw timings; useful-result and verified-completion latency; p50/p95; peak memory/IO/handles; responsiveness; normalized output hashes; complete entry/warning counts; cancellation/restart/error results; source/build/artifact identities.

## Conclusion

Absolute and relative change, uncertainty, regressions, recommended setting for this workload, rejected settings, whether target acceptance passed, and exact next step. No synthetic data or cached-only response may masquerade as a measured complete outcome.
