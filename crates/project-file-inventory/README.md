# Read-only project file inventory

Cross-project pillar: improve metadata enumeration and content processing separately,
with measured equivalence and visible partial/error/cancel states. Never imply MFT
makes content hashing, archive decompression, semantic parsing or network reads free.

## What ships here

Dependency-free reusable Rust prototype with a real Windows `FSCTL_ENUM_USN_DATA`
volume reader and streaming portable directory fallback. `volume_with_fallback`
attempts only an explicitly selected drive, then starts a new directory generation
on non-NTFS/network/permission/unsupported-record failure. `walk` handles folders,
network shares and mounted USB devices without elevation or content reads. Folder
selection must NEVER become implicit full-volume scanning. No journal creation,
privilege enablement, raw disk writes, automatic UAC, extraction or file mutations.
No MTP virtual-device adapter yet; mounted filesystem paths only.

Consumers MUST discard provisional rows on `ScanEvent::Reset`, including records
emitted before an NTFS error; commit only on successful uncancelled completion with
zero errors. Directory entry errors are reported, not silently hidden. Run scans off
the UI thread, with a bounded consumer queue and cancellation flag. Cancellation is
checked between entries/batches, not during a synchronous OS call; blocked network
I/O is not guaranteed immediately cancellable. Very deep trees hold one iterator per
level and may hit descriptor limits; errors remain visible.

USN rows carry UTF-16 names, file/parent IDs and attributes, NOT full paths, sizes or
allocation totals. Preserve unpaired UTF-16, don't flatten to lossy strings for keys.
Do not treat one returned name as a complete hard-link inventory. Path reconstruction,
hard-link aliases, allocation accounting, consistent snapshots and USN incremental
refresh/recovery remain consumer integration work. A changing filesystem is not a
transactionally consistent snapshot. Directory traversal avoids symlink/reparse
recursion but is not a security boundary against adversarial path replacement.

## Why this design

WizTree says it reads NTFS's MFT, while other filesystem/folder scans use alternate
paths. This implementation uses Microsoft's supported enumeration API rather than
copying WizTree proprietary code or claiming byte-for-byte engine parity. NTFS alone
does not guarantee access: existing process rights may deny volume opening. The
fallback continues normally without silently changing user privileges.

## Project adoption map

- Athena: project discovery/storage metadata workers; expose backend, entry counts,
  failures, cancellation and whether the index is partial in the native progress UI.
- MO2R/Modhunter: candidate discovery only. Resolve through actual MO2 virtual paths
  and use separate bounded readers for BSA/BA2/FUZ/plugin payloads. Never re-scan the
  full drive per refresh or touch original mods. Do not replace working release paths
  until Windows comparison and incremental refresh acceptance pass.
- Noxviola: local import/download library indexing, NOT saved-tab SQLite lookup or
  browser content fetch. Huge OneTab collections need indexed/paged DB queries.
- Modding-Knowledge/database manager: local artifact inventory, not remote catalog
  queries. Store generation + source + completeness; separate path count, unique-file
  count, logical size, allocated size. No fabricated storage totals from USN records.

No consumer runtime has been switched yet. This is a shared foundation, not a claim
that all projects now have WizTree speed. Copy/fork integrations should share a pinned
version and contract fixtures rather than silently diverging.

## Verification 2026-11-17

- Ten unit tests (including injected second-page failure/reset and cancellation without fallback): V2 parser bounds/truncation/unknown version/name offset/zero length,
  lossless UTF-16, traversal, symlink cycle, cancellation, missing root, invalid drive.
- `cargo check --target x86_64-pc-windows-gnu` passes (compile only).
- `cargo run --release --example bench`: synthetic Linux warm-cache fixture of 10,100
  entries, 12 alternating runs. stat-per-entry median 8.314ms; directory-entry-type
  median 1.829ms. Equal entry counts, no contents read. This is NOT NTFS throughput,
  live Windows, cold disk, memory/RSS, or UI frame-time evidence.
- `cargo run --release --example scan -- <folder>`; explicit Windows volume opt-in:
  `cargo run --release --example scan -- --volume=C` (diagnostic fast path only).

Release gates: Windows NTFS/USB/network/non-NTFS access-denied fallback; compare full
path identity coverage (including hard links) against traversal; concurrent mutation,
rename, reparse replacement and journal reset; unknown USN versions; cold/warm P50/P95,
peak memory, bytes/IO calls and UI input latency. Never omit safety/error work merely
to improve a timing. Incremental USN replay requires journal identity/wrap recovery and
cannot reconstruct prior contents from journal records.

## Primary sources studied

- https://diskanalyzer.com/about (MFT mechanism and alternate scans)
- https://diskanalyzer.com/guide (admin rights and volume export conditions)
- https://learn.microsoft.com/en-us/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data
- https://learn.microsoft.com/en-us/windows/win32/api/winioctl/ns-winioctl-usn_record_v2
- https://learn.microsoft.com/en-us/windows/win32/fileio/change-journal-records
