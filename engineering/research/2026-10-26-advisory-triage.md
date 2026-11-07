# Selected advisory triage · 2026-10-26, 23:14 UTC

Sources [E83], [E84], [E85]. This is a scoped follow-on review, not a complete security audit or a claim that all releases and papers have been reviewed.

The RustSec index now lists October 26 notices for zstd, zstd-safe, pingora-core and rustpython-vm. One reviewed zstd notice concerns residual data crossing reused stream contexts; its documented fix resets the session, with zstd >=0.14.3 patched. This makes interrupted-stream and cross-record isolation essential before accepting context reuse as a speed optimization. Old wrapper ranges and zstd-safe have separate notices: do not assume a wrapper-only upgrade fixes every path.

Selected package-name triage against Atlas Lab's 179-package Cargo.lock found none of zstd, zstd-safe, pingora-core, rustpython-vm or libcrux-ml-dsa. [Raw scope/hash receipt](2026-10-26-advisory-triage.json) records exactly what was checked. This does not clear all transitive dependencies, detect equivalent vendored code or assess other projects.

The HLS.js security listing showed no published advisories at review, not a guarantee of safety. The SQLite 3.54.1 release page matches the already measured storage-lab runtime; no upgrade or reranking follows from that observation.

The separate [parser experiment](../experiments/adapter-parser-lab/README.md) retains a slower maximum in its smallest workload rather than promoting its lower median. Neither this triage nor that generated experiment authorizes changes to another project.
