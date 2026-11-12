# Bound helper output before accepting a result

**Evidence state:** actual fixed child processes on Linux, checked 2026-11-11. Generated payloads only; no production-helper, subprocess-tree, security-sandbox or target-performance acceptance. [Lab and complete receipts](../experiments/pipe-budget-lab/README.md) · [Research note](../research/2026-11-11-subprocess-pipe-foundations.md).

## Decision and concrete gap

An app's importer, converter or compiler helper can print more than the parent expects, fill its error pipe, exit with a valid-looking partial result, or close output while remaining alive. Capturing everything and checking its size afterward does not bound capture. Parsing one successful JSON value does not establish successful completion.

Existing Athena experiment controllers already preserve output and use time limits. Some check captured output sizes after subprocess.run completes; the [fresh-process workload](../experiments/dedup-process-lab/README.md) also explicitly leaves clean cancellation unmeasured. This separate lab evaluates incremental pipe admission and direct-child lifecycle. It does not modify those controllers or assert they are vulnerable in their bounded existing workloads.

## Primary constraints

- Python warns that waiting with undrained pipes can deadlock, that communicate buffers output in memory, and that a communicate timeout does not itself kill the child. Terminate and kill have platform-specific behavior. [subprocess](https://docs.python.org/3.12/library/subprocess.html#subprocess.Popen.communicate).
- Selector pipe support is platform-specific: Unix supports pipes; Windows selectors do not. [selectors](https://docs.python.org/3.12/library/selectors.html).
- Nonblocking descriptor mode is available through [os.set_blocking](https://docs.python.org/3.12/library/os.html#os.set_blocking). [time.monotonic](https://docs.python.org/3.12/library/time.html#time.monotonic) supplies a clock that does not run backward with wall-clock adjustments.
- Linux pipes have finite capacity; EOF depends on write-end closure, while writes with no readers can generate SIGPIPE/EPIPE. [Linux pipe(7)](https://man7.org/linux/man-pages/man7/pipe.7.html).

The implementation's budgets, fixed modes and success gate are experiment policy, not requirements imposed by these APIs.

## What actually runs

The controller can start only its included owned Python helper with one enumerated mode. It uses an absolute interpreter and helper path, isolated Python, no shell, DEVNULL input, closed inherited descriptors and a minimal explicit environment. It has no arbitrary command/executable option. Both output pipes are binary and nonblocking, and a selector drains them together.

Defaults are 4 KiB stdout, 4 KiB stderr, 8 KiB combined, 1 KiB per read, two seconds for the run, 150 ms terminate grace and one second kill/reap wait. They are small trusted-fixture settings, not suggested application defaults. An observer/cancellation callback must be trusted, nonblocking and bounded. A callback can defeat the scheduling assumptions if it blocks.

Before each read, the controller calculates the remaining per-stream and combined allowance. It may read one sentinel byte to establish overflow. Every returned byte, including that sentinel, remains in the receipt with its stream identity and SHA-256. Capture stops at a budget failure; unread or later output is deliberately not described as preserved. The receipt's EOF and capture-complete fields make that distinction explicit.

All captures remain raw bytes until both streams reach EOF and the direct child exits. Then a zero exit status and a strict, small JSON document contract are required for acceptance. The JSON decoder rejects duplicate keys, malformed/multiple documents, invalid UTF-8 and the wrong shape. A nonzero exit never gains a valid result merely because it printed success-shaped JSON first. Stderr is kept separately rather than merged into a misleading single chronology.

## Observed cases and negative control

The ten-case demonstration includes ordinary success, byte-split UTF-8, simultaneous pipe pressure, stdout/stderr floods, nonzero exit, duplicate JSON, EOF while still alive, success bytes followed by a hang, and cancellation of a helper that ignores SIGTERM.

The simultaneous-pressure fixture writes 262,144 bytes to each pipe. With explicit larger quotas, the controller captures both exact byte streams, sees both EOFs and exit zero, then correctly rejects the stdout as non-JSON. This is a pipe-drain correctness result, not a workload-performance measurement.

With a 32-byte stdout budget and seven-byte reads, the flood fixture stops at 33 observed bytes. A separate finite control uses ordinary capture_output on the same helper's one-MiB output and only checks its 32-byte intended limit afterward. It has already retained 1,048,576 bytes before that check. The control demonstrates where the check occurs, not measured whole-process memory or a vulnerability claim. Large demonstration captures are stored losslessly as zlib/base64 with complete byte counts and hashes, not omitted samples.

The EOF-then-hang fixture shows both pipe ends complete while its process remains alive. It reaches the run deadline and is stopped/reaped, never accepted. The success-then-hang fixture likewise cannot publish its valid-looking prefix. Split multibyte UTF-8 succeeds because chunks are not decoded independently.

## Cleanup is part of the result

On cancellation, deadline, output overflow or controller failure, the parent closes its capture resources, requests direct-child termination, waits a finite grace interval, escalates to kill when needed, and confirms reaping. It uses the owned Popen object, never a PID copied from a receipt. A PID in evidence is not authority to signal a later process.

Initial review found that a selector/stream close error could skip child cleanup entirely. An owned failure probe reproduced the escape and immediately stopped/reaped that fixture itself. The repaired controller isolates cleanup stages, retains stage-specific errors and continues the remaining cleanup. A first wait error still attempts bounded kill/reap. If reaping is unconfirmed, CleanupPending carries the receipt and the exact owned process object back to the caller. It is not a successful cancellation or permission to abandon ownership.

Close errors are not blindly retried. Cleanup errors prevent acceptance even if the process was eventually reaped. The test suite covers close and wait faults as well as ordinary termination, escalation and a modeled cleanup-pending case. Independent review exercised additional signal/poll failures and repeated descriptor accounting. These injections establish the tested error handling, not all possible OS failure outcomes.

## Scope that must not be inferred

- This is not a sandbox. The helper has the same user authority and is trusted local code. Minimal environment and fixed argv do not constrain filesystem/network access or malicious behavior. Recorded source hashes are evidence identity, not tamper-resistant attestation.
- Only the direct child is owned and stopped. No descendant/process-group/job-object cleanup is implemented or tested. A real tool that spawns children requires a separate platform-specific ownership design.
- Capture caps constrain retained child output, not child allocations, CPU, file writes, kernel pipe storage, interpreter overhead, JSON/hex copies or parent RSS. No resource-limit system setting is changed.
- The run deadline is not a hard wall-time guarantee: process creation, scheduling, trusted callbacks and OS operations can delay observation. Cleanup adds its separate grace/wait budgets. Report actual elapsed time rather than promising an exact cutoff.
- No Windows/macOS execution, adversarial executable, crash recovery, real converter/compiler, browser UX or performance improvement is established.

## Adoption choices

For a genuinely small, trusted, already bounded command, ordinary subprocess.run may be the simplest correct choice. For large known output, evaluate incremental or file-backed capture with an explicit disk policy. File redirection alone only moves the resource risk to disk. For interactive bidirectional protocols, consider a framed async transport and test backpressure on input as well; this experiment sends no stdin payload.

Before target use, record the helper version/current controller, output contract, actual supported platforms and realistic corpus. Exercise simultaneous diagnostics, long lines, output floods, invalid encoding, partial records, navigation/cancellation, close faults, process creation failures and helper descendants. Keep old valid UI results separate from a failed new attempt. Require representative resource/latency measurements and complete correctness/security/UX acceptance before recommending any controller replacement.
