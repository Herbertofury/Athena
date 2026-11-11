# November 11, 2026: texture meaning through resampling

## Decision and contribution

Main `44384b809c80e03adbd62f8be9617d01e6ad9922` and open drafts through #43 were checked. Existing asset-validation work concerns structural glTF validation; it does not exercise texture filtering. This separate contribution adds a [semantics guide](../docs/texture-semantics.md), [original resampling experiment](../experiments/texture-resampling-lab/README.md), offline contract tests, [acceptance receipt](../templates/texture-acceptance-receipt.md) and ten primary sources. It changes no target app, mod, release implementation, workflow, importer or catalog ranking.

## Measured result

Actual pinned stb_image_resize2 2.50 C execution processes 16 original two-pixel rows with BOX/CLAMP, no SIMD, and one Linux compiler configuration. All declared outcomes match, including seven intentional intent mismatches. The [retained receipt](../experiments/texture-resampling-lab/observed-2026-11-11.json) contains source hashes, dependency identity, commands, full console output, environment labels and API/intended references.

Black/white color averages to 128 in encoded-byte space and 188 after linear-light filtering and sRGB re-encoding. Constant patches return the same result in both paths: those patches alone cannot establish correct transfer handling. Alpha-aware processing excludes hidden red/green from the tested blue edge. Generic four-channel sRGB also transforms the supposed alpha to 188 instead of 128. Scalar and FLOAT association controls expose different semantic mistakes despite successful API calls.

The mask observation is only a thresholded sample-count fraction changing from 50% to 100% at cutoff 0.5. It is not screen-space coverage or accepted mip generation. Equal-alpha FLOAT examples do not exercise unequal-alpha weighting, a fully transparent output, HDR or negative samples.

## Source review and consequences

Official specifications, pinned upstream source/license and vendor documentation were read. CSS Color supplies transfer equations, Compositing supplies source-over algebra, and the resizer documents its layouts. glTF's material interpretation must not be replaced by generic PNG color-management assumptions: glTF ignores embedded image color metadata. OpenGL 4.6 permits sRGB conversion after filtering while preferring before, disqualifying universal GPU claims from the CPU result. Vulkan format queries and NVIDIA's separately documented mip controls identify additional acceptance questions, not local results.

Use discriminating numeric controls, then evaluate actual assets in their importer/shader. Successful decode or structural validation can coexist with wrong semantics. No library, compressor or production upgrade is selected here. Upstream's security-response caveat and license remain visible; its header is not vendored.

## Independent review and validation

A separate reviewer compiled the pinned header afresh and reproduced all 16 outputs exactly, matching prior semantic evidence and the binary hash on this host. Fifteen adverse receipt mutations were rejected. Coordinated fabricated binary hashes still pass consistency verification. The docs disclose that limitation and a focused regression preserves it: receipt fields do not authenticate execution.

All 38 focused tests pass. The initial aggregate attempt exposed an incorrectly ordered additive source index; it was sorted without weakening the validator. Initial and repaired logs are retained locally. The full candidate Python suite ran 364 tests: 363 passed, with only the inherited cross-root research-link error. The Research Explorer generated-output check passes. The source register validates all 2,216 sources, including ten new entries; all changed-document local links resolve. All 1,553 materialized baseline blobs were verified against main. Application/Rust, browser, native GPU, actual-asset visual acceptance, performance and cross-platform determinism checks were not run.

A too-large Vulkan single-page response and unavailable speculative vendor URL were replaced with readable official chapter/product pages. An optional local HTML parser was unavailable; existing plain-text extracts supplied the CSS/Compositing sections. None of those failures is claimed as successful source evidence.

## Integration and boundaries

This contribution is independent of pending unified-foundations draft #43. Existing sources remain intact; concurrent source-index and game-assets navigation additions must be unioned. No merge or deployment is requested. The inherited research checker rejects the root-level runtime-document link from `engineering/apps/atlas-lab/README.md` because it checks engineering-root containment. This contribution does not change that checker or count its error as a pass.

## Primary sources

Checked 2026-11-11 UTC. Version/publication dates are separate in the [source fragment](../data/sources.d/texture-semantics-20261111.json). Vulkan is rolling documentation with no immutable revision established. The vendor page's observed release notes do not establish the latest binary.

[TX11001](https://www.w3.org/TR/2026/CRD-css-color-4-20261103/), [TX11002](https://www.w3.org/TR/2024/CRD-compositing-1-20240321/), [TX11003](https://github.com/nothings/stb_image_resize/blob/703100c5f8a0b75b4861e401db567f1d82d545b8/stb_image_resize2.h), [TX11004](https://github.com/nothings/stb_image_resize/blob/703100c5f8a0b75b4861e401db567f1d82d545b8/README.md), [TX11005](https://github.com/nothings/stb_image_resize/blob/703100c5f8a0b75b4861e401db567f1d82d545b8/LICENSE), [TX11006](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html), [TX11007](https://www.w3.org/TR/2025/REC-png-3-20250624/), [TX11008](https://www.khronos.org/registry/OpenGL/specs/gl/glspec46.core.pdf), [TX11009](https://docs.vulkan.org/spec/latest/chapters/formats.html), [TX11010](https://developer.nvidia.com/texture-tools-exporter).
