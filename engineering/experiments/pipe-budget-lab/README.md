# Incremental pipe-budget and direct-child lab

Actual subprocess execution of a fixed owned helper on Linux. Generated payloads only. **Not a command runner, security sandbox, subprocess-tree manager or target upgrade.** [Guide](../../docs/subprocess-pipe-foundations.md) · [Research record](../../research/2026-11-11-subprocess-pipe-foundations.md).

From `engineering` with Python 3.12 on Linux:

```sh
python3 -m unittest discover -s tests -p 'test_pipe_budget.py' -v
python3 -O -m unittest discover -s tests -p 'test_pipe_budget.py' -v
python3 experiments/pipe-budget-lab/run_demo.py /tmp/athena-pipes-NEW
```

Choose a nonexistent output directory. Demo/test receipts are retained; tests keep their `athena-synthetic-pipes-*` temporary directories. Each normal test checks that its direct child was reaped. The cleanup-pending test uses a fake owned process, not a deliberately leaked real process. No external requests, arbitrary commands, packages or user files are involved.

## Evidence

- [Ten real-process scenarios plus the finite post-capture control](demo-result.json). Full bytes are hex or, for large captures, lossless zlib/base64, with hashes and exact counts.
- [Initial 27-test log](initial-tests.log), before cleanup fault hardening.
- [Actual initial close-failure probe](initial-close-failure-probe.json), including the harness's own recovery of its child.
- [Final 31-test log](focused-tests.log) and [optimized run](optimized-tests.log).
- [Independent review](review-summary.json) and [aggregate checks](validation-summary.json).

The byte-admission tests distinguish per-stream from combined caps and count an overflow sentinel. Lifecycle tests distinguish EOF, process exit, return status, valid protocol output and confirmed reaping. Invalid/partial output, cancellation, deadline and cleanup errors never become accepted documents. Large output is not parsed until it is fully captured within the selected budgets; successful JSON bytes do not override nonzero exit or a hang.

Only trusted, nonblocking observer/cancellation callbacks are supported. The run timeout is cooperative around OS calls and creation; cleanup adds separate finite waits. Direct-child termination is not descendant cleanup. Output quotas are not process RSS, CPU, disk or network limits. Receipts preserve the bytes actually observed, not unread tail data after an interrupted capture.

No native Windows/macOS, real application helper, performance, production security or target acceptance is claimed. Source and runtime identities are recorded for reproduction, not treated as a cryptographic execution sandbox.
