# Atlas draft reconciliation, November 14, 2026

## Preservation and product acceptance are separate

Fresh source PR metadata for #5–#13 was compared with Athena's preserved issue descriptions and PR identities. All nine exact head/base pairs, titles and descriptions match. An independent restoration of Athena's original history bundle passed Git fsck and recovered every exact PR head and full tree. `identity-review.json` records identities and changed-file lists. The source repository was not modified.

The stacked chain is #13 → #12 → #11 → #10 → #9 → #8 → #7; #5 and #6 are independent of it. PR #8's body mentions an earlier successful CI head: use the actual current head `990447b5f82b51d4a77f2d1c404836f3781e485f` recorded here, not the older head for acceptance.

## Bounded functional port in this checkpoint

- #5: new hls.js/serde_json observation admission rejects prerelease/malformed version tags even if the provider's flag is false. Historical payload replay and last-good snapshots remain intact. RustSec stays unchanged. This is actual Athena local-engine code, not a link to Atlas.
- #12/#13: Athena's existing offline site extractor now scans whole srcset URL tokens before applying public filtering. Empty separators recover without crashing; commas in query, fragments and rejected credentials cannot manufacture suffix references. Descriptors remain opaque. This is an offline extraction module, not full native-browser/provider acceptance.
- Historical source references, sanitized regression receipts and independent oracle are retained alongside the port. No upstream private capture was added. Original source-host citations remain provenance only.

## Evidence

Before the tokenizer port, the 20 imported regression tests produced 11 failures and 19 errors (subtests can produce multiple errors). After the port all 20 passed; the complete current Python suite passed 366 tests. The independent boundary oracle tested 105,987 generated inputs with zero mismatches. These are offline/synthetic tests, not fresh provider, media playback or native browser tests. See retained logs and oracle receipt. The actual Rust library passed 153 tests, including the imported admission/history regressions; Rust formatting passed.

The source-index validator initially rejected a reordered base entry; restored its required base-first, sorted-fragment structure without weakening validation. The final structure check passes and still reports dated sources needing refresh. Source freshness is not silently certified.

## Still-open draft acceptance gates

- #6 research: preserved in full Git history, not yet reconciled into active source catalog.
- #7/#8 cancellation/deadline experiments: preserved, not declared equivalent to Athena's evolved native adapters. Need current-path stalled-reader/timeout/last-good tests and measured non-regression before promotion.
- #9 local gallery compare and #11 primitive URL type checking: draft UI/comparator not present in active Engineering media source at review. Need native Athena control integration, malformed-field/last-good/cancel tests, and real-browser acceptance. No external Modrinth media decoding is implied.
- #10 malformed Overview metrics: archived regression cases require replay against current native Lab adapter before claiming parity.
- #12/#13 descriptor validity, browser currentSrc selection, media loading, arbitrary-content sanitization and full adapter acceptance remain out of scope.
- This checkpoint does not archive expired workflow artifacts or unknown unpublished local work; it does not authorize source deletion. Source metadata publication, final hosted CI, native/served acceptance and owner retirement decision remain separate checks.
