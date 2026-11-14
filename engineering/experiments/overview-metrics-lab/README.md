# Reject malformed Overview metrics without losing the last good view

November 7, 2026. A bounded correctness repair in the actual Atlas Lab renderer,
above the local-gallery draft at commit
`a723e81c73f403190ef44a9f8bea26e0f564f4f1`. The inputs below are deliberately
**synthetic malformed responses**, not observations of a healthy Rust backend or
live provider. This work adds no adapter, credential, dependency or network call.

## Problem and acceptance criteria

The previous renderer used `value || 0` and JavaScript `+` directly on response
counts. A queued count of `"4"` and running count of `2` displayed `42`. Negative
numbers, booleans, an overflowed JSON exponent and an unsafe aggregate could also
replace last-good metrics. An array instead of the count map was accepted as zero.

The [retained baseline receipt](baseline.json) demonstrates six failures using the
actual application source and the existing controlled DOM harness. Each malformed
input was accepted and replaced the previous metrics. The
[candidate receipt](candidate.json) shows all six rejected with the previous
`3 / 4 / 5` metrics retained. Both receipts include hashes of the exact renderer,
harness and input helper used. These are correctness observations, not timings.

Acceptance for this repair is deliberately narrow:

- Present count values must be non-negative safe integers, without coercion.
- Missing states still mean zero. SQLite's existing `GROUP BY` result is sparse.
- Queued plus running must also be a safe integer, even if each operand is safe.
- Invalid envelopes/counts must fail before card preparation, metrics or engine
  cache identity commit. Refresh must report the error and retain the last-good
  cards, full recorded results and metric values, then recover on a valid reply.
- Aggregate counts are for the entire queue; they are **not** required to match the
  newest fifty displayed rows. Queued attempt zero and arbitrary recorded-result
  fields remain supported.

The existing contract is implemented in
[`Queue::overview` and the queue schema](../../apps/atlas-lab/src/jobs.rs), rather
than inferred from one fixture. No server response shape is changed.

## Implementation and rejected alternatives

`overviewMetrics` validates the envelope and count map at the start of `render`,
then prepares the three metric values. The existing last-good preparation and
commit boundary remains intact. This adds bounded validation over the returned
count map and keeps healthy sparse responses, node reuse and original recorded
JSON behavior unchanged.

Coercing strings with `Number()` or clamping bad values to zero was rejected:
that would hide a protocol failure behind apparently valid metrics. Requiring
all four keys or comparing counts with displayed rows was rejected because it
contradicts the real sparse aggregate/newest-fifty contract. This patch does not
promote the separate experimental content-identity cache candidate or change
cached-result comparison semantics.

## Reproduction

From the repository root, with Node.js available and the baseline commit fetched:

```sh
node experiments/overview-metrics-lab/reproduce.mjs a723e81c73f403190ef44a9f8bea26e0f564f4f1
node experiments/overview-metrics-lab/reproduce.mjs
node --test tests/overview-metrics.test.mjs
node --test tests/*.test.mjs
```

The optional third command-line argument to `reproduce.mjs` writes a new receipt;
leave it omitted to inspect output without replacing the retained evidence.
Nine regression tests cover malformed values for each known state, container
shapes, exact aggregation boundaries, sparse totals, fifty full-result cards,
new-engine failure/recovery, valid JSON exponent overflow, refresh error/recovery,
extra numeric state-map keys, and 10,000 deterministic generated healthy count maps. Some direct renderer test
values such as `undefined` and `NaN` are not ordinary JSON; the exponent-overflow
case is explicitly parsed from valid JSON. The refresh test executes the real
refresh function with a controlled fetch implementation, not a real HTTP server.

## Evidence limits

These checks ran under Node.js v24.22.1 in a controlled DOM, not a native browser.
There was no local Rust toolchain or connected browser for a fresh loopback/native
acceptance run. No Rust code was changed. Full repository CI, including Linux and
Windows Rust checks, is a separate verification surface and must be checked on
the published revision. Native paint, focus, accessibility, interaction and real
transport acceptance remain unverified by this repair. This is not a performance,
memory, general schema-hardening or production-readiness claim. The existing
renderer still does not promise rollback after arbitrary native DOM mutation
failures.

Local validation on this candidate: 321 Python tests and 314 JavaScript tests
passed with no skips. The source-register/internal-link check, generated Explorer
check, card/media asset identity checks, synthetic benchmark example and
`git diff --check` also passed. The synthetic benchmark is an existing fixture
sanity check, not a measured effect of this change.
