# Composed offline provider foundation

November 11, 2026. This candidate joins the published RSS preservation stack with the published Discord component/media-state stack in one tested Engineering tree. Both retain their source-specific APIs and evidence limits. It does not add a live collector or connect Discord to Athena's UI.

## Preserved contributions

- Base [RSS integration #56](https://github.com/Herbertofury/Athena/pull/56), head `9590843fad1ac5e35858d5424e944604278ff178`, includes title, publication-date and format-gate fixes from #5, #14 and #53.
- Donor [Discord media states #55](https://github.com/Herbertofury/Athena/pull/55), head `388cd5f8ad6de8329bc4f87b1620a73180eaa62d`, includes [component projections #54](https://github.com/Herbertofury/Athena/pull/54).
- Common foundation [#43](https://github.com/Herbertofury/Athena/pull/43), head `7ba88d30229f3073c9aa738f087b9199ffae16ae`.

All 23 nonconflicting donor paths are imported byte-for-byte, including the Discord normalizer, regressions, source fragments, licensed documentation fixture and historical/current receipts. The source index contains the union of both sides. The experiment directory retains the YouTube format-boundary section and appends both Discord sections. [The preservation manifest](preservation.json) pins those imports and 19 prior RSS, WordPress, Bluesky and YouTube implementation/evidence files. No original receipt is regenerated, relabeled or discarded.

The shared RSS extractor is unchanged from #56. Discord still imports its helpers from that extractor. Combining their modules needs execution checks even when their edited functions do not overlap: module loading, common URL/JSON helpers, exceptions, mutable input state and receipt boundaries can interact.

## What the composition checks exercise

Run from the repository root:

```sh
python3 -m unittest discover -s engineering/tests -p 'test_provider_foundation_integration.py' -v
python3 -m unittest discover -s engineering/tests
python3 engineering/scripts/check_research.py
```

Seven composition tests check exact source-file preservation, shared-helper binding, expected RSS title/date and Discord flag/visibility semantics, all 24 operation orders of two successful and two rejected synthetic inputs, complete record/receipt equality, unchanged source inputs, partial/access-limited retention, the original official Discord code-example replay, and the additive source/document unions. Network socket creation is blocked during composition/replay tests. The checks preserve deliberate unknown states and do not reinterpret missing scan hints as clean content.

For the existing retained-source results, use the separate [RSS replay instructions](../rss-integration-lab/README.md), [Discord component example](../discord-component-embed-lab/README.md) and [Discord media-state preservation](../discord-media-state-lab/README.md). Raw retained feed responses are not redistributed. The Discord fixture is an official code example inside a synthetic message envelope, not a live API message. Synthetic flag tests are not proof of live provider fields.

## Validation at this integration checkpoint

The [fresh offline replay receipt](validation-2026-11-11.json) confirms all 70 retained RSS records and receipts match #56, four WordPress and three Bluesky captures retain complete normalized and historical receipt output, the 463-byte topic response remains rejected, and the original Discord example replays exactly. The receipt publishes hashes and counts rather than retained source prose. No previous receipt is changed.

Local aggregate checks pass: 1,062 Engineering Python tests, 420 Engineering Node tests, the root build, 141 root Node tests, 105 Media tests, 313 root Python tests and seven generated-asset checks. These suite totals overlap and should not be summed as unique scenarios. Independent review verifies complete records and errors across 36 interleaved provider outcomes, plus nine standalone-donor Discord outcomes using its original helpers.

## Evidence boundaries and alternatives

Keeping the two branches separate avoids composition risk but leaves the foundation fragmented. Replacing the RSS extractor with the donor's older copy would lose title/date/format fixes. This candidate instead imports only the donor's delta, keeps the newer shared extractor, and tests complete results together. It does not silently merge, close or replace either source draft.

No network collection, account access, private messages, grants, credentials, artwork fetch, media download/playback, source freshness claim, browser/Rust/native-target acceptance or performance claim is added. Existing runtime, packaging, workflows and held work remain unchanged. A matching hash proves byte identity, not authenticity or permission. A stored receipt is checkable historical evidence, not an authenticated execution attestation. Exact-head hosted CI must be reported separately; an absent run is not a pass.
