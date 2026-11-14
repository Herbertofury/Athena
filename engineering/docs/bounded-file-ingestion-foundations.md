# Bound file work and keep incomplete scans honest

November 11, 2026. Source-backed architecture and an [executed local-file experiment](../experiments/bounded-file-scan-lab/README.md). The experiment fingerprints generated, nonrecursive Linux files. It does not install, extract, parse, modify or accept a real project's files.

## What this adds to the existing plans

The existing [file pipeline](file-pipelines.md), [archive/change tracking guide](archive-and-change-tracking.md) and [worker-sweep evaluator](worker-sweep-tool.md) specify useful gates. This contribution executes a narrow missing part: bounded admission and descriptor-based reads under replacement, partial failure and cancellation. The [archive stream repair](../experiments/archive-stream-lab/README.md) concerns a JavaScript saved-response reader, not local filesystem identity. No native snapshot, active release or existing scanner is changed.

The decision is not “how many threads are fastest?” It is “what work and state may coexist, and when is a complete result justified?” Keep these separate:

- **Discovered:** a name appeared during enumeration.
- **Opened:** a descriptor references an object.
- **Observed:** the reader reached EOF, satisfied its declared byte/type/identity checks and produced a hash.
- **Complete for the controlled input set:** every admitted entry has an acceptable outcome and the scan's consistency checks passed.
- **Publishable in the target:** the target's own quiescence/snapshot, persistence and user-visible requirements also hold.

A successful local hash does not prove a directory-wide snapshot or that the pathname still names those bytes when a later installer reopens it.

## Separate resource budgets

The Python 3.12 [`Executor.map` contract](https://docs.python.org/3.12/library/concurrent.futures.html) collects input iterables immediately. A worker count alone does not bound queued work. The same reference states that cancelling pending futures does not stop already-running calls (FI26005). Version-check the API actually installed rather than projecting a newer buffering option onto an older runtime.

The lab admits at most a configured number of outstanding futures, while each reader owns one file descriptor and one current payload chunk. Its envelope is deliberately explicit:

| Resource | Enforced lab scope |
|---|---|
| Initial names | At most `entries` retained, plus one observed entry to detect overflow |
| Submitted, uncollected futures | At most `inflight` |
| Concurrent reader slots/file descriptors | At most `workers` |
| Current returned payload bytes | At most `workers × chunk_bytes` in the instrumented reader code |
| Bytes returned by reads per file | At most `file_bytes + 1`; the extra byte detects growth beyond the cap |
| Output rows | One outcome for every retained initial name, including refusals/cancellation |

Those are not a total-memory or total-descriptor guarantee. The root/scandir handles, futures, Python objects, filenames, digest state, exception machinery, OS buffers and page cache are separate costs. The receipt measures reader ownership counters only. Filename/object storage depends on the local filesystem/runtime; the experiment does not establish hostile FUSE or arbitrary filesystem allocation bounds.

An oversized enumeration is explicitly incomplete and starts no reads. It does not pretend the retained prefix is the whole directory. For large real datasets, choose bounded batches plus a durable generation protocol, or an external sorter/journal with a separately tested disk budget. Silently dropping errors or tails is not batching.

## A pathname is not an immutable input

Linux [`open`](https://man7.org/linux/man-pages/man2/open.2.html) documents both the persistence of an open-file reference after pathname changes and the limited scope of `O_NOFOLLOW`: it rejects a symbolic link in the last component, not arbitrary symlinks earlier in a path (FI26001).

The lab therefore opens one trusted directory and only passes enumerated basenames relative to its descriptor. It uses fresh metadata checks instead of treating a cached directory-entry observation as current. Python's [`os` documentation](https://docs.python.org/3.12/library/os.html) explicitly describes `DirEntry` caching and descriptor-relative operations (FI26006). Raw filename bytes are retained as hexadecimal in receipts, including an undecodable-byte test; display text is not substituted for filesystem identity.

The observed contract is narrow:

1. Enumerate a bounded initial entry set and record directory identity/metadata.
2. Record fresh metadata for each name. Nonregular files, hard links and oversized files remain visible as refused outcomes.
3. Open each regular candidate relative to the root descriptor, without following the final symlink, and compare descriptor metadata with the preflight observation.
4. Read to EOF under the chunk/file budget, keeping every short read. Compare the final descriptor and current basename metadata with the earlier observation.
5. Re-enumerate the directory and report membership/metadata changes, then expose all outcomes in deterministic byte-name order.

The [`read` reference](https://man7.org/linux/man-pages/man2/read.2.html) permits short successful reads; a short chunk is not EOF (FI26003). Tests force small read fragments and still compare the complete digest. Growth beyond the file cap is a visible failure, not a truncated successful record.

There is a deliberately bad control: validate a regular pathname, replace it with a symlink, then reopen it by pathname. It reads another generated file. The descriptor-relative candidate refuses that tested final-component substitution. This is an executed race demonstration, not proof of containment against arbitrary malicious filesystem behavior.

## Metadata checks detect some races, not snapshots

Linux [`stat`](https://man7.org/linux/man-pages/man2/stat.2.html) warns that fields can reflect different moments during a call (FI26002). Matching size/mtime alone is especially weak. The lab also compares device/inode, mode, link count and ctime, and detects its tested same-size edit even after mtime is restored. That is a specific result on the recorded filesystem, not a theorem that metadata catches every mutation.

Files can change after the last check. An entire directory is not read atomically. A hash produced while bytes are changing may describe a mixed read rather than any single committed version. If correctness requires a coherent generation, the caller must maintain quiescence throughout scanning and publication or use a supported immutable snapshot/content-addressed input mechanism with its own verification. The teaching-only selection helper refuses a new manifest without an explicit quiescence assertion and retains the exact previous object after partial failure. A Boolean supplied after the fact cannot make inputs quiescent.

No watcher is implemented. Linux [`inotify`](https://man7.org/linux/man-pages/man7/inotify.7.html) documents overflow and application consistency challenges (FI26009). Watcher silence is not proof that nothing changed; recovery must restore both inventory and observation coverage. The existing archive/change guide provides the broader reconciliation plan.

## Partial failure must remain useful

Each retained entry gets an outcome: observed, oversized, unsupported, changed, I/O failure, worker failure or an explicit cancellation state. A failed file does not erase successful observations, and successful neighbors do not convert an incomplete generation into an accepted manifest. Receipts retain exact errno and bytes consumed without exposing raw exception text or absolute input paths.

Independent review found and reproduced an initial cleanup bug: an injected reader-close error escaped the worker and discarded the whole scan result. The candidate now records that error, removes the successful digest, retains other outcomes and finishes accounting cleanup. It also invalidates a result on an injected root-close error. The Linux [`close` guidance](https://man7.org/linux/man-pages/man2/close.2.html) cautions against retrying a failed close because the descriptor number may already be reused (FI26004). No close retry was added.

Initial/final enumeration I/O failures are explicitly incomplete. Root-open failures, unsupported platforms and unexpected coordinator/executor or coordinator-hook failures raise; callers must retain their previous generation on exceptions too. This is not a durable journal or an atomic compare-and-swap publication API. The runner saves completed trial evidence before checking its assertions.

## Cancellation and security are distinct limits

Cancellation stops further admission, attempts to cancel queued futures, marks every unstarted initial entry and lets active readers observe the flag between read operations. Shutdown waits for running calls. It does not interrupt a blocked regular-file syscall, a fault hook or a stalled network filesystem, and no cancellation-latency budget is measured. `O_NONBLOCK` avoids the tested FIFO-open wait after a race; it does not provide a universal nonblocking regular-file reader.

The trusted root and its ancestry are a precondition. This is not a root-path resolution sandbox, mount boundary, arbitrary device-node defense or protection from privileged hostile mutation. A device can have side effects at open, before a subsequent `fstat`. Do not point this research function at hostile roots or use its flags as a general import-security recipe. Linux [`openat2` resolution flags](https://man7.org/linux/man-pages/man2/openat2.2.html) are a separate mechanism worth evaluating for a real recursive containment design; this lab neither calls nor validates it (FI26007).

The Windows [`CreateFileW` contract](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew) has its own access, sharing, reparse and device semantics (FI26008). These Linux flags and metadata assumptions are not a Windows implementation. Existing native snapshot drafts are independent work and are not accepted or modified by this experiment.

## Before selecting a faster target implementation

Keep the target's currently supported inputs and errors fixed. This lab deliberately refuses hard links and does not recurse, parse or decompress; adopting those restrictions could break a real app. Compare a serial reference with equivalent complete output first, then measure end-to-end latency, real peak RSS/handles, UI interference and cancellation on the target storage and packaged runtime. Retain both slower and faster cases. Charge scanning, parsing, ordering, verification, commit and recovery rather than timing only the parallel read loop.

The actual 1/2/4-worker runs here establish complete-output parity and scoped resource counters on a tiny generated corpus. They contain no speed ranking and do not choose a worker default. See the [lab](../experiments/bounded-file-scan-lab/README.md), [dated research record](../research/2026-11-11-bounded-file-ingestion.md) and [source register](../data/source-index.json) for exact evidence and remaining gates.
