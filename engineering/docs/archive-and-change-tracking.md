# Archive indexing and trustworthy change tracking

Reviewed **2026-10-26**. This is an architectural investigation and experiment plan, not a measured application speedup. It complements [worker tuning](file-pipelines.md): more threads cannot fix repeated parsing or an invalid freshness contract.

## Reduce work before multiplying workers

Instrument archive opening, directory parsing, member lookup, decompression, manifest parsing, ownership resolution and publication separately. Count each operation as well as timing it. If every configuration lookup reopens every mod JAR, first build one immutable archive inventory per verified scan generation. Preserve all candidate owners and duplicate entries; an index is not permission to choose the first plausible match.

The current Rust zip documentation, observed at **9.1.2**, exposes shared archive metadata and a constructor for readers that reuse it. That constructor is unsafe: the caller must prove the reader and metadata describe compatible archive bytes. The documentation also warns that extraction is non-atomic and concurrent destination modification is outside its path protection. These are design constraints, not a recommendation to introduce unsafe code into an existing application. [ARCH01](https://docs.rs/zip/latest/zip/read/struct.ZipArchive.html)

A defensible implementation starts with the currently pinned library. Prefer its safe APIs. If they require an independent parse per worker, measure that cost before considering a more complex optimization. Do not transplant a latest-version example into an older dependency without checking its actual contract.

## Separate identity from location

A pathname identifies where to look, not immutable content. Replacement at the same path, in-place writes and changes during a scan invalidate simplistic metadata reuse. A proposed generation protocol is:

1. Open and validate the source under the application's existing path and reparse-point rules.
2. Establish the application's required identity/content evidence and construct the directory index.
3. Give workers compatible read handles or an immutable snapshot; never reopen a mutable pathname and assume it is the same archive.
4. Collect worker results with the generation identifier and ordered diagnostics.
5. Revalidate the source before publishing. If the generation changed, discard dependent results and report/retry under an explicit policy.

This is a design hypothesis requiring platform-specific implementation and race tests. Size plus timestamp alone is not proof of unchanged bytes; identity alone does not detect in-place mutation. If exact freshness requires hashing, keep that work and reduce redundant reads elsewhere. Do not silently trade verification for speed.

## Parallel readers are not automatically independent

libzip **1.12.1** documents independent archive objects as usable across threads, but requires synchronization when sharing one object. Separate read-only opens are an alternative. Its filename contract also distinguishes ZIP forward slashes from literal backslashes. A language-level thread-safe wrapper does not remove the underlying stream and naming rules. [ARCH02](https://libzip.org/documentation/libzip/)

Measure three candidates: serial indexed reads; bounded independent archive readers; and a producer/consumer pipeline with one reader feeding bounded parse jobs. Cap queued bytes, open handles and decompressed bytes, not merely job count. Choose based on complete-result latency and responsiveness, not aggregate worker utilization. Do not use a global pool that can starve unrelated application work.

## Watchers accelerate invalidation; they do not certify freshness

Microsoft documents two important lost-event cases for ReadDirectoryChangesW: a successful completion can return zero bytes after buffer overflow, and ERROR_NOTIFY_ENUM_DIR means the change details could not be recorded. Both require enumerating the affected directory/subtree again. Network directory monitoring has a 64 KB buffer constraint. [WATCH01](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readdirectorychangesw)

Proposed state machine:

- **Unknown:** no valid inventory. Start a full verification pass.
- **Scanning:** maintain a generation and accumulate invalidations arriving during enumeration.
- **Verified:** only after required checks and queued changes are reconciled.
- **Dirty:** a known change invalidates dependent results, not unrelated immutable facts.
- **Rescan required:** lost events, watcher failure or ambiguous replacement invalidates the affected scope. Never map these events to “nothing changed.”

Ensure watcher reattachment after failure. A rescan repairs inventory, but does not by itself prove that the next event will be observed. Avoid a scan-then-watch gap: establish observation and reconcile changes across the baseline boundary. Surface provisional results as provisional. A periodic reconciliation may provide resilience but cannot justify labeling old data current before verification.

## Adversarial acceptance matrix

Run the same scenarios against the reference and candidate:

- Duplicate member names, case collisions, Unicode and ambiguous manifest ownership.
- Unsupported/encrypted/corrupt archives with identical error visibility.
- Archive replacement and same-size in-place edits during parsing.
- Cancellation during decompression, parser failure, and restart after interruption.
- Bursts exceeding notification buffers; zero-byte success and explicit overflow errors.
- Watcher disconnection, directory rename/delete/recreate, and reattachment.
- Nested archives, extreme compression ratios and oversized declared metadata.
- Reparse-point changes between validation and open, plus attempted extraction escapes if extraction is part of the product.

Enforce streaming byte/resource budgets even when headers claim small sizes. Preserve the existing supported-input policy; an optimization that newly rejects valid supported archives is a behavior change requiring a separate decision. For read-only identification, do not extract archives unnecessarily or execute bundled code.

## What would establish a real improvement?

Record archive-open and central-directory parse counts, compressed/decompressed bytes, peak memory, handles, queue depth, full output/diagnostic equivalence, time to usable rows and time to verified completion. Compare 4/8/16/32/64 workers only after removing repeated indexing. Include concurrent UI activity and cancellation. Retain the smallest configuration that achieves the accepted outcome without regressions; document slower and rejected candidates too.

No result in this page establishes that any particular worker count, archive library or watcher implementation is best for a named application.
