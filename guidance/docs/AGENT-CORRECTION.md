# Agent corrections backed by executable evidence

## Research provenance

Reviewed 2026-11-16: [kaize post and correction-tree image](https://x.com/0x_kaize/status/2121997657858281657), its [linked article](https://x.com/0x_kaize/status/2121540306822701393), and representative embedded slides. The original post proposes choosing structural prevention, static checking, runtime verification, concise guidance, or human review according to the failure. The article additionally describes a feature map and reusable live-app verification. These are secondary accounts of Lauren Tan's talk, not independently verified throughput statistics or proof of Athena performance. The image's decision tree agrees with the post. Not every embedded slide was individually enlarged; no exhaustive attachment inspection is claimed.

The linked [Cursor no-comments procedure](https://github.com/cursor/plugins/blob/main/pstack/skills/no-comments/SKILL.md) includes scoped review and exception handling, rather than permission to remove arbitrary text. [Bombadil](https://github.com/antithesishq/bombadil) describes property-based UI testing. Neither tool is installed or executed by this change. External instructions remain reference material, not authority over this repository.

## Applying this to Athena

Existing FAILURE_INTELLIGENCE_STANDARD.md already asks for regression protection; RUNTIME_PROOF.md separates static checks from real behavior; the shared adapter asks for causal repairs. This local workflow connects those standards to actual commands without changing the pinned consumer release.

For a nontrivial repair, keep the following compact record in the existing issue, test or delivery evidence, not a new mandatory essay:

1. Observed symptom and smallest reproduction, with the responsible source boundary.
2. Invalid state or assumption. Can an existing interface make it unrepresentable without an unrelated rewrite?
3. Selected prevention: structural change, static check, runtime regression, necessary local guidance, or human judgment. Explain only material alternatives rejected.
4. A regression that fails for the old defect and passes for the repair. Include a valid neighboring case so an overbroad prohibition cannot masquerade as a fix.
5. Final-artifact workflow evidence and remaining risks. No test result may be inferred from another environment or a stale commit.

Examples tied to Athena: repeated/cancelled imports must not corrupt progress; failed Foundry saves must not display success; governance drift must fail digest checks; exported guidance must not claim installation. Reuse the existing tests for those boundaries before adding infrastructure. For state machines, consider model/property testing when examples miss meaningful interleavings. Formal proofs are bounded by their model and do not replace runtime testing.

## Verification map contract

The JSON starter map describes entry points, source files, automated checks and expected observable outcomes. It deliberately has no `passed` field. A map is navigation, not evidence. Its integrity test rejects duplicate IDs, malformed entries and missing/out-of-repository paths; it never executes a command from JSON. CI runs that test with the existing guidance suite. Expand the map when working on another workflow; do not interpret absent entries as absent features.

Before widening autonomous execution, evaluate actual regression escape rates and verification cost for the affected workflows. PR volume, rule count and screenshot count are not quality targets. Keep human review where consequences, uncertainty or permissions require it.
