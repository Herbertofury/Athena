# File, config and archive pipelines

**Status: architecture and experiment plan, not a measured universal implementation.**

## Pipeline

Enumerate → validate path/type → inspect archive/index → read required bytes → hash/parse → classify ownership → reconcile → commit ordered results → publish a complete snapshot.

Split immutable inspection from state mutation. Independent reads/parsing may run concurrently; journal/cache/recovery updates need deterministic ownership and crash-safe ordering. Do not hold a global mutation lock during slow reads if immutable work can be prepared first.

## Reduce redundant operations

Measure the count of directory enumerations, metadata lookups, archive opens, bytes read, parses, owner comparisons and IPC messages. On Windows, Rust's DirEntry metadata/type APIs can use enumeration information without extra system calls; this is not permission to remove fresh reparse/identity checks before opening or modifying a file. [R01](sources.md#r01)

Build reusable immutable lookup indexes for one scan. Bound archive expansion, entry counts, recursion, path length and text buffers. Reject traversal, malformed archives and unexpected link/reparse behavior. Revalidate before deferred reopening; parallel scheduling widens the interval in which the filesystem can change.

## Worker sweep: 4 / 8 / 16 / 32 / 64

Expose a validated setting or an explained automatic mode. Run one candidate at a time against the same corpus, with repeated paired trials. Include a serial/reference implementation when practical. Record:

- Complete-result latency and time to useful rows.
- Output hash, counts, warnings and provenance equivalence.
- Peak memory, outstanding buffers/handles and storage queue pressure.
- UI input latency and concurrent-app impact.
- Cancellation latency, restart, malformed inputs and stale-path races.

Reject a higher count if it worsens the relevant budget, produces different results or exceeds safe memory/handle limits. A 64-worker option is not a recommendation to use 64 workers. Prefer the smallest measured count near the best result, and describe the hardware/workload on which it was chosen. Do not transfer the winning value to every machine without testing.

For Tokio, avoid a task transition for every tiny filesystem action when a bounded batch can safely do the same work. The official guide explicitly discusses spawn_blocking overhead and batching. [R02](sources.md#r02)[R03](sources.md#r03)

## Required adversarial cases

Changed file with reused timestamp; add/remove during scan; symlink/junction replacement before deferred read; unreadable file; duplicate metadata; partial/corrupt archive; cancellation with active workers; crash before/after ordered commit; repeated scan while previous scan is active. Preserve failures rather than silently skipping entries.
