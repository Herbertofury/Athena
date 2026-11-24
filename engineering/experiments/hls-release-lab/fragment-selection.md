# Fragment selection is a separate acceptance gate

Reviewed 2026-10-29. This follow-up does not upgrade a player or claim a playback repair.

## Primary report and limits

[Upstream issue 8100](https://github.com/video-dev/hls.js/issues/8100) reports repeated segment requests around quality switches. Its later comments distinguish aligned renditions from shifted boundaries and acknowledge that some repeated requests can fill a gap. The issue remains open. Reported bandwidth/stall observations belong to the reporter, not this evaluation. A blanket rule to skip an already seen sequence number is not established as correct. Source: HLSRESUME8100.

## What was measured here

The fragment-finder source and its binary-search dependency are byte-identical in the integrity-verified official 1.7.3 and 1.7.4 packages. The [new evaluator](fragment-selection.mjs) checks both source identities before compiling with pinned esbuild 0.28.2. It uses 100 generated fragments at each of two levels, four previous-fragment positions, same-level/up-switch choices, four buffer shortfalls and two lookup tolerances.

The [128 recorded selections](fragment-selection-results.json) agree across versions for every paired case. An independent execution reproduces the complete case list. Source-level selection of an earlier segment is observable here, but these fixtures do not establish whether actual media was fully buffered or whether skipping it would leave a hole. They do not measure player requests, startup latency, decoding, down-switch/emergency-abort behavior, audio/video continuity or shifted rendition timelines.

The prior trailing-decimal parser improvement remains supported by its own 63 fixtures. It must not be generalized into a claim that the whole newer player resolves unrelated buffering reports. Neither release is promoted based on this selection matrix.

## Reproduce and retain evidence

Stage the official packages using the existing [release study instructions](README.md). Then run `node experiments/hls-release-lab/fragment-selection.mjs VERIFIED_STAGE TRUSTED_ESBUILD_INSTALL NEW_OUTPUT`. The output directory must be new. No network requests are needed; the fixture disables fetch. Compiled source remains outside the repository, with artifact and evaluator hashes retained in the receipt.

[Negative checks](fragment-selection-verification.json) reject an existing evidence directory and a mutated source before compilation. Initial source observations and both failure logs remain retained privately. Next acceptance work needs aligned-versus-shifted controls and permitted real-player request/buffer evidence, not a speculative skip patch. The working vendor, autoplay setting and other projects remain unchanged.
