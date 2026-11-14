# Bounded local-file scan lab

November 11, 2026. Original standard-library Python code, real Linux filesystem operations, synthetic generated inputs. Read the [foundation guide](../../docs/bounded-file-ingestion-foundations.md) for sources and design limits. Nothing is imported into Athena's production runtime.

## Defined experiment

Fingerprint one directory without recursion. Retain a bounded initial entry set; cap submitted futures, concurrent readers, per-reader chunk size and per-file bytes. Preserve a deterministic outcome for every retained initial name, including refusal, error and cancellation. Keep complete original bytes represented by SHA-256 and exact lengths for successful observations. Reject partial/incomplete scans for the teaching-only manifest selection helper.

The root and its ancestry must be trusted, owned fixture paths. This is not a hostile filesystem sandbox or an immutable snapshot. The helper requires the caller to maintain quiescence throughout scan and publication. Its Boolean flag is not proof that the caller did so.

## Reproduce with fresh generated inputs

From `engineering`:

```sh
python3 -m unittest discover -s tests -p 'test_bounded_file_scan.py' -v
python3 experiments/bounded-file-scan-lab/run_demo.py --output /tmp/athena-file-scan-NEW
```

The driver requires a new directory and creates every input. Tests retain `athena-synthetic-file-scan-*` directories and complete receipts. Inputs are not user data. Race controls rename original generated files into retained locations before replacement; nothing is deleted. The scanner does not write input content, though ordinary reads can change filesystem access metadata. Never run this research function against an arbitrary home folder, mounted device, live mod folder or private source tree.

## Results and failure evidence

- [Initial focused run](tests-initial.log): 30/30 passed.
- [Independent finding](initial-review-finding.json): an injected reader-close error escaped cleanup and prevented a returned scan receipt. This is a labeled reproduction record, not a fabricated raw log. Independent review also clarified resource accounting and trust/cleanup boundaries.
- [Final focused run](tests-final.log): 32/32 passed, including reader/root close-error regressions. Close is not retried; successful digests are invalidated and previous results remain available.
- [Complete demonstration receipt](demo-receipt.json): 1/2/4-worker lanes produce identical full outcomes on ten generated files. Other trials retain a known-bad check-then-reopen control, descriptor-relative symlink refusal, partial I/O failure, cancellation, entry overflow and same-size mutation with restored mtime. No timing comparison or speed ranking is made.
- [Validation summary](validation-summary.json) and [research record](../../research/2026-11-11-bounded-file-ingestion.md) distinguish aggregate tests, exact sources and unrun acceptance.

Tests include empty/exact-limit files, oversized inputs, full entry limits, short reads, symlinks/hard links/FIFOs/directories, path replacement before/after open, root rename, in-place changes, growth/truncation, added/renamed entries, injected read/worker/enumeration/close failures, pre-admission and active cancellation, raw non-UTF-8 filename bytes, ordered serial/parallel parity and last-good selection. A barrier-based fixture actually observes four simultaneous reader slots and four 64-byte current chunks. That is an instrumented ownership observation, not a whole-process memory measurement.

## Explicit limits

- **Linux only.** Actual run: Python 3.12.14. Other platforms are refused by the function; the Linux-specific suite is explicitly skipped there, not silently accepted. No Windows/macOS/native packaged app test was performed.
- **No snapshot proof.** `all_checks_passed` means these checks passed for the observed input set. Matching metadata and a hash do not establish a directory-wide point-in-time state or future pathname freshness. Every receipt explicitly sets `snapshot_guarantee=false`.
- **Partial coverage is labeled.** Overflow retains only the bounded enumerated prefix and admits no readers. Prefix order is not promised by the filesystem. Such a receipt is incomplete, not a full listing.
- **Not a security sandbox.** Root ancestry, mounts and device objects are trusted preconditions. Final-component nofollow and a post-open type check do not prevent every possible device-open side effect. No hostile mount, device, privileged writer or recursive path containment is tested.
- **Narrow input contract.** Only regular files with one link are read; there is no recursive traversal, archive decompression, text parsing, ownership classification, user-file copy or installation. Those restrictions may be unacceptable for a target and must not be silently adopted.
- **Scoped resource counters.** Reader handles/current chunk payload are counted; root/scandir descriptors, Python/runtime overhead, filename storage, exception state, process RSS and kernel cache are not. A global disk/CPU/time budget is not implemented.
- **Cooperative cancellation.** Admission stops and queued futures may cancel; running readers check between operations and shutdown joins them. A blocked syscall or hook is not forcibly interrupted. No hard deadline or measured user-visible cancellation latency is claimed.
- **Failure surface.** Per-entry and enumeration I/O errors return explicit outcomes/diagnostics. Root-open/platform/argument failures and unexpected coordinator/executor/hook errors raise; the caller must retain last-good state on exceptions. Selection is a pure teaching helper, not a persistent or concurrent publication mechanism.

All data, hashes, resource counts and failure labels are scoped to these retained synthetic trials. No worker default, whole-app speedup, security certification, target recommendation, merge or deployment follows from them.
