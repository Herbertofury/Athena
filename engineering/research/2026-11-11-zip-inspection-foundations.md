# Read-only ZIP inspection foundations

## Corpus gap and scope

Inspected main `44384b809c80e03adbd62f8be9617d01e6ad9922`, archive/change-tracking and file-pipeline guides, planned archive comparisons, existing archive labs and current research drafts #27–35. Existing saved-response archive labs operate on retained JSON evidence, not compressed-package member admission and decompression. File-ingestion draft #33 handles local file identity, not ZIP internals. The planned duplicate-name, bomb-budget and traversal cases therefore remain a meaningful independent gap.

This branch reconstructs and verifies all 1,549 baseline Engineering blobs, then adds an original restrictive ZIP32 experiment, practical guide, tests, complete generated receipts and source records. It does not touch an active runtime, integrated release, Foundry work, another draft's implementation, private or held material, workflow, installation or extraction path.

## Sources and design

[Seven source records](../data/sources.d/zip-inspection-20261111.json): ZI26001–ZI26007. Python 3.12 zipfile, zlib and unicodedata documentation; PKWARE APPNOTE 6.3.10 (2022-11-01); Microsoft's naming and console-device guides; UAX #15 (current page observed Unicode 18.0.0 revision 58, 2026-08-12). Relevant sections were opened and read on 2026-11-11. Executed Python Unicode data is older and recorded explicitly; newest documentation is not treated as the installed implementation.

The [guide](../docs/zip-inspection-foundations.md) separates documented API behavior, original restrictive policy, actual generated-fixture observations and future target gates. The [lab](../experiments/zip-inspection-lab/README.md) admits bounded immutable archive bytes, checks count/record/member identity before metadata construction, and counts bounded full-stream output instead of trusting declared expansion size. No source code or long text from the specifications is reproduced.

## Results and retained failures

The initial 35 tests passed. Independent adversarial review found that a trailing compressed payload rejection happened before counting the output just returned by zlib. A three-byte fixture was correctly rejected but reported zero decoded bytes. The [finding record](../experiments/zip-inspection-lab/initial-review-finding.json) distinguishes that observed defect from the passing initial suite. The repair counts output before rejection and adds regression coverage; volume-label and too-low feature-version acceptance were also tightened to the stated subset.

The final 37 tests pass normally and under Python -O. Nine demonstration cases retain exact generated archives, source identities and full results. Two small ordinary-library controls show why name-based reads and declared sizes are not the same as the lab's stronger admission/full-stream contract. A generated high-expansion fixture stops at one explicit sentinel byte beyond its selected output limit. No uncontrolled decompression of that large control is performed.

The tests do not establish general ZIP compatibility, safe extraction, a process sandbox, malicious-file completeness, publisher trust, target acceptance or a speed advantage. Initial unsupported-feature refusals may reject valid files; no supported-input contract in an existing app is narrowed.

## Validation and integration

See [validation summary](../experiments/zip-inspection-lab/validation-summary.json) and [independent review](../experiments/zip-inspection-lab/review-summary.json). The inherited main cross-root README link failure remains disclosed, not repaired or waived. Root CI excludes Engineering-only paths; verify the exact publication head separately rather than claiming local passes imply hosted CI.

Only one existing Engineering file changes: an additive source-index entry. Keep the baseline source file first and union sorted fragment additions from every draft during later integration. This research draft does not merge, deploy, alter actual target recommendations or authorize extraction/execution/deletion.
