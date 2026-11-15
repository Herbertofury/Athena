# Unsigned evaluation artifacts

A successful native CI job may retain an unsigned Windows or Linux unified
candidate for 14 days. It is not a promoted release, installer, signed executable,
owner-PC acceptance or repository-retirement gate. Python 3.13+ and compatible OS
runtime dependencies remain prerequisites; Python is not bundled.

The build uses the exact checked-out commit and just-built native store/engine.
The existing package generator preserves the reviewed runtime bytes. Cargo
metadata is filtered for the actual compiler host and collected offline after
compilation. The archive includes a sanitized dependency inventory, retained
license/notice files, instructions, package hashes and both binaries. No original
DB, credential, private source checkout path or user collection is included.

License expressions use a bounded parser for the pinned graph's known permissive
licenses; unknown sources, path dependencies, expressions or missing notices fail
closed. The two owner-code crates are identified without inventing a project-wide
license. Inventory and notices are not full redistribution clearance or legal
advice. Native vendored code, runtime assets and downstream distribution can carry
additional obligations. Existing runtime license files remain included. The
builder retains nested license files (including bundled crypto notices), not just
Cargo's license label. Review is still needed before any broader release.

ZIP entry order, timestamp and permissions are stable for identical bytes in the
same tooling environment. This is not a reproducible-source-build or cross-zlib
archive identity claim. `candidate.json` records source commit, binary/archive
hashes, compiler identity, lockfile/allowlist hashes and packed/unpacked sizes; these are integrity/provenance records, not a
signature or proof of trusted binary origin.

Extraction refuses absolute, parent, drive/ADS, backslash, reserved-device,
trailing-dot/space, non-ASCII/control-character and case-alias paths; all destination
ancestors must be non-symlinks. Before opening ZIP metadata, compressed input is capped at 256 MiB and its directory
is scanned within 2 MiB with at most 2000 records. Extraction is bounded to 2000 ordinary entries/600 MiB, uses
exclusive new files and verifies the complete package before restoring executable
bits on its two expected Linux binaries. Inputs are CI-produced trusted candidates,
not a general untrusted executable installer. Trusted/quiescent directories remain
required; pathname checks are not protection against hostile concurrent writers.
Failures can leave a partial new output, never an overwritten existing destination.

The extracted archive, not a fresh parallel package, runs the actual Chromium
workflow: same-document Lab/Foundry, explicit local synthetic media, edits/history,
restart, conflicts and stopped backup. Its binaries must exactly match the current
build and package integrity is checked again afterward. The artifact upload is a
success-only final step. Failed tests retain diagnostic reports but do not publish
a candidate bundle. No installation or release promotion occurs.

Local preliminary evidence: filtered Linux Cargo graph included 141 packages with
244 retained notice files (1,159,948 bytes). Unfiltered offline metadata initially
needed an uncached other-target crate; host filtering resolved the issue without a
download. Synthetic archive tests verify deterministic packaging, integrity,
exclusive destinations, unsafe Windows paths and license refusals. Hosted exact
Windows/Linux results remain required; this note is not evidence of their success.
