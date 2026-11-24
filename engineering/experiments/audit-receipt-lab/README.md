# Reject contradictory audit evidence

Reviewed 2026-10-28. This repairs the existing pinned analyst runner, not the scanner, dependency graph, collection adapters or other projects.

## Reproduced failure and repair

The original runner decoded ordinary JSON and checked a zero count without binding it to the finding flag/list. Eight generated outputs could therefore be called clear: boolean/float counts, contradictory flags or finding lists, duplicate count keys, non-finite extra values, numeric overflow and missing warnings. [Failure reproduction](failure-reproduction.json) retains the exact generated wire data and both outcomes. The archived [baseline](baseline_runner.py) is evidence only, not the accepted runner. No malicious executable or real vulnerability was executed.

The repaired [runner](../dependency-audit-lab/run_pinned_audit.py) reuses the existing strict receipt decoder, rejects duplicate/non-finite values, requires an integer nonnegative count and a boolean flag, and binds both to the finding-list length. Warning output must be present and have the expected container shape. All unfiltered settings remain mandatory. Unknown valid fields survive unchanged. Raw stdout/stderr still precede validation, so rejection retains evidence and an incomplete, non-clear receipt.

Eight of eight original false-clear fixtures are rejected. Four new test functions cover typed and contradictory fields, malformed wire data, raw failure retention, unknown-field parity and prior genuine scanner receipts. Existing known-finding and nonzero-exit behavior remains non-clear; timeouts retain partial evidence. Passing these generated cases is not malicious-tool attestation or a universal scanner-output proof.

## Genuine audit, separate from fixtures

[Final receipt](verified-receipt.json) and [application](verified-audit-0.json), [compression](verified-audit-1.json), [parser](verified-audit-2.json) results came from the already-installed, SHA-256-pinned cargo-audit 0.22.2 against clean RustSec revision `99670cfc0bc574433034b75876a4b791ccaa2efb`. Its upstream head was independently rechecked on October 28 and had not changed from October 27. Each of the three fixed, frozen lockfiles returned zero known matches, no ignored advisories and no warnings. This is scoped known-advisory matching, not whole-machine or other-project clearance. Original database/worktree, old receipts and rollback source remain intact.

The runner uses its existing per-audit timeout, output budget checks and fixed lockfile set; no network/security settings, credentials or dependencies were changed. No throughput, latency, memory or general self-modification claim follows from this correctness repair. Local regression and exact-commit CI are separate evidence gates.

## Dated upstream review, not a new ranking

- [RustSec head](https://github.com/RustSec/advisory-db/commit/99670cfc0bc574433034b75876a4b791ccaa2efb), [hls.js v1.7.3](https://github.com/video-dev/hls.js/releases/tag/v1.7.3) and [serde_json v1.0.154](https://github.com/serde-rs/json/releases/tag/v1.0.154) remain at the previously reviewed checkpoints. A new observation date does not mean a new release.
- [SQLite release history](https://www.sqlite.org/changes.html) still lists 3.54.1 (October 16). Its stated 32-bit fix and workload-dependent performance claims are not Atlas measurements; no version is promoted here.
- [Hardware-assisted database memory safety paper](https://arxiv.org/abs/2610.11525), version 1 submitted October 8: the authors compare MTE/CHERI across several databases and report safety/performance/portability tradeoffs. This pass reviewed the abstract only, not a reproduced paper result. Required hardware and full target comparisons are not established; do not treat it as a universal stack winner.
- [Codeberg gumbo-parser source](https://codeberg.org/grisha/gumbo-parser) was requested read-only but denied by robots.txt. No bypass, source-currentness assertion or execution followed. Earlier evidence remains distinct from this blocked review.

No finding from this pass is added to another project's wiki or TODO.
