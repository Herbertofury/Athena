# Actual Athena lesson search: offline candidate comparison

**R&D only. Candidate rejected for native promotion pending repair and fuller target
acceptance.** This follows the synthetic offline receipt in PR #183 with actual
Athena data and the actual current JavaScript search implementation.

Run `python research/offline-target-search-2026-11-15/compare.py` from Athena.
Requires preinstalled Python/SQLite FTS5 and Node, no installs or remote services.
The JavaScript harness executes the current `dist/app.js` search function in a VM
with rendering stubs, loading the actual `dist/catalog.js`. Candidate SQLite
uses exactly the same searchable lesson fields, not privileged full lesson bodies.
Each run records source hashes, source revision and frozen query-file hash.

## Observed result, not a product recommendation

98 real lesson records; 12 author-selected cases. Baseline's first-five target
success: **6/12**; FTS5 BM25 candidate: **10/12**. This metric means the nominated
lesson appears in the first five returned items, or no result appears for an
out-of-corpus query. It is **not** overall precision, exhaustive relevance or a
blind user evaluation. Baseline renders all matches without ranked ordering;
`baseline_expected_anywhere` and total result counts preserve that distinction.
The initial test cases were selected from current lesson titles/topics before
running either algorithm, not tuned after seeing candidate scores.

Candidate **regresses two existing behaviors**: `subnet` substring matching and
empty-query browsing. Those failures remain in the receipt, not dropped from a
winning average. OR-token matching can additionally yield false positives; two
negative queries do not establish specificity. BM25 is not declared superior.

101 repeated timings per case are retained, but the baseline includes rendering
stub calls and uses Node while the candidate uses Python/SQLite. Therefore these
numbers are diagnostic, **not an equivalent-runtime performance verdict**. No
browser input latency, DOM visibility, frame timing or full-app memory measured.
Reopening the candidate database preserves results. A second complete run matched
all non-timing results and provenance fields exactly.

## Implementation and boundaries

`baseline.cjs` extracts and executes the actual one-line app search function; it
fails if that extraction contract changes. It uses no browser or network API.
`compare.py` creates a temporary FTS5 database and destroys it after verification.
Python socket access is blocked by an audit hook; Node is not OS-network-isolated.
Neither script changes settings, sources, native behavior, models or public data.
The benchmark compares lessons only; certificates and other workspaces are out of
scope even though baseline still runs its certificate filtering code.

Next: preserve empty/substring contracts, label larger independently reviewed query
sets (including ambiguity/negatives), benchmark equivalent runtimes and real UI,
and measure complete persistence, restart, concurrency and bounded resource usage.
Only then consider native promotion; until then keep existing behavior unchanged.
