# Challenger & Integration Standard

> **Challenge before reinventing. Compose the strongest authorized pieces.**

This standard governs substantial invention, integration, modernization, conversion, migration, performance engineering, and tooling work.

## Baseline-to-beat objective
The challenger pass is not only an anti-reinvention search. Identify the strongest credible existing solution, define the user-valued dimensions that matter, and turn challenger evidence into a **beat-the-baseline plan**. Preserve protected dimensions, reuse/compose superior authorized pieces, and seek a real advantage rather than shipping a weaker clone. If only parity is proven, say parity.

## Search surface
Use a bounded, relevance-driven pass across upstream projects, GitHub, GitLab, Codeberg, significant forks, package/plugin ecosystems, standards, reference implementations, mature libraries/frameworks, and authorized internal/commercial implementations when relevant.

## Candidate decisions

| Decision | Meaning |
|---|---|
| <code>adopt</code> | use substantially as-is |
| <code>merge</code> | ingest useful internals into the target |
| <code>port</code> | move implementation across version/platform/runtime |
| <code>wrap</code> | keep implementation behind a stable adapter |
| <code>backport</code> | bring a newer technique to an older fixed target |
| <code>compose</code> | combine best-of-breed pieces from multiple candidates |
| <code>reject</code> | evidence shows the candidate is not a fit |
| <code>unresolved</code> | more evidence is genuinely needed |

## Evidence to capture
For load-bearing candidates record source/provenance, version/date, authorization or license status where relevant, exact-target compatibility, capability/fidelity advantages, performance implications, maintenance fit, and decision rationale.

## Reuse-before-rebuild
If an authorized mature implementation already solves the hard part better, do not recreate an inferior duplicate merely to avoid integration work.

## Composition is first-class
Do not force one winner when the strongest system can combine different candidates' best parser, cache, compatibility layer, UI behavior, or orchestration.

## Anti-research-stall
Once the high-value search space is covered and the integration set is actionable, cross into implementation. Further read-only work requires a named correctness blocker.

## Acceptance
A challenger pass succeeds when it materially changes confidence, design, or implementation—or establishes with evidence that custom implementation remains the strongest route.

## Resume/startup review

Before continuing a repository task, read its backlog, current implementation and
previous challenger decisions. Check for comparable or stronger maintained features
and implementations relevant to that task. Reuse the existing source catalog and
prior evidence; refresh stale or missing load-bearing claims with primary sources,
actual code where available, version/date and license. Record what can be learned,
reused or composed, what to improve beyond the current baseline, and what remains
unknown. This is additive improvement, not an instruction to replace the project.

Keep this pass bounded and nonblocking: once there is enough evidence, implement
and test. If discovery is unavailable, record the gap and continue independent
already-authorized work. Never invent superiority, silently copy restricted code,
transmit private project context, install a candidate or expand authority merely
because a search found it. Show adopt/adapt/compose/reject/unresolved decisions and
verify equivalent outputs, compatibility and user-valued performance before claiming
an improvement. A bundled startup catalog match is a queue item, not fresh research.
