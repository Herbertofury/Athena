# glTF validation boundary laboratory

**Measured official-validator behavior on original synthetic data.** This is not a renderer, importer, animation player, optimizer benchmark or game test. A triangle with two linear translation keys is constructed in [fixtures.mjs](fixtures.mjs); all bytes are original, and the external buffer is provided only from an exact in-memory map.

## Results

Ten final expectations match, with one passing limited fixture gate:

- Complete original triangle: zero issues; geometry and declared animation data retained.
- Changed translation endpoint: zero issues, but original data contract fails.
- Removed animation: zero issues, but animation retention fails.
- Out-of-range index: `ACCESSOR_INDEX_OOB`.
- Same bad index without a resource callback: `IO_ERROR`; index bytes remain unvalidated.
- Non-increasing animation time: `ACCESSOR_ANIMATION_INPUT_NON_INCREASING`.
- Matrix-defined animated node: `ANIMATION_CHANNEL_TARGET_NODE_MATRIX`.
- Unsupported required extension: zero errors and informational `UNSUPPORTED_EXTENSION`, with coverage gate false.
- Missing resource map entry: `IO_ERROR`, failed callback request retained.
- Two defects with one-issue cap: truncated report, rejected as complete evidence.

[observed-2026-11-11.json](observed-2026-11-11.json) retains the generated documents and hexadecimal buffers, raw reports, callback requests, document/resource/report hashes, limited projections, separate gates, all four input hashes and all nine dependency member hashes. Report hashes detect inconsistent edits to non-gating stats too. No issue filter or severity override is used. Timestamp output is disabled in validator reports for comparison; the enclosing receipt has its own UTC observation timestamp.

## Dependency identity

The official npm package is `gltf-validator@2.0.0-dev.3.10`, published 2024-10-22. Its registry `gitHead` is `bcd52cc4ba5f333b2999a58f67cc05ddf28b4fb1`. The 110,015-byte tarball matched npm's SHA-512 integrity and SHA-1; SHA-256 is `4e03dbdc3bc0d1342afd5d2d7ae341a7e3474502ccb872b02dbbaddaee0fdec6`. [dependency.json](dependency.json) records URLs, digests, member lengths/hashes and the 18 extension names returned by this package. This is declared support, not complete coverage: the pinned upstream README marks KHR_animation_pointer support as partial. The runtime verifies all nine extracted files and the capability list before validation. The package is not committed here. Registry signatures and a Dart-source-to-JavaScript rebuild were not verified.

The retained execution used Node.js v24.22.1 on Linux x64. This control does not recommend a Node, validator or target-project upgrade. Reproduction needs Node 20+ and the exact locally extracted package; the runner itself downloads nothing.

## Offline checks

From `engineering`:

```sh
node --test experiments/gltf-validation-lab/tests.mjs
node experiments/gltf-validation-lab/run.mjs --verify-receipt experiments/gltf-validation-lab/observed-2026-11-11.json
```

The 50 tests require no validator package or network. They verify receipt consistency, known data differences, resource/extension/completeness gates, issue accounting, malformed input and mutation rejection. The receipt parser deliberately requires the exact pretty-printed JSON serialization with trailing newline. This rejects duplicate keys and alternate numeric encodings; it is an evidence-file convention, not a claim that other JSON whitespace is invalid glTF. Boolean/integer fields use strict types and integer checks.

## Fresh validator execution

Obtain the exact official tarball URL in `dependency.json`, verify the published integrity and extract its package into a new local directory. Do not substitute an arbitrary package with the same name. Pass its extracted `package` directory:

```sh
node experiments/gltf-validation-lab/run.mjs --package /path/to/package --output /path/to/new-gltf-receipt.json
```

The output must not exist. Exit 0 means all declared fixture expectations matched, including intentional failures. Exit 1 means a complete run contains unexpected outcomes, retained in its new receipt. Exit 2 means invalid evidence/setup or an incomplete runner stage. No subprocess orchestration or external asset fetcher is implemented. The tested assets are fixed and tiny; this is not a hostile-code or hostile-asset sandbox, a general URI resolver or a memory/time benchmark.

## Failed expectation and limited projection

[initial-hypothesis.json](initial-hypothesis.json) preserves a rejected initial inference: omitting the callback was expected to yield zero errors, but the package returns `IO_ERROR`. The final expectation was corrected openly; the bad index is still not inspected in that case. The full initial ten-report probe is also retained in the working evidence, separately from the accepted fresh receipt.

The data projection compares only the original triangle's selected scene/node transforms, positions/indices and animation sampler/channel data. It handles bounded scalar and vector accessors used by these fixtures, not every glTF layout. It does not sample interpolation or render motion, inspect materials/textures, enforce all asset semantics or prove visual equivalence. Capability and report hashes are consistency evidence, not signed execution attestation. A coordinated edit of raw report data and derived hashes can remain internally consistent. In particular, report.info statistics are not independently verified by receipt checking; a fresh validator execution is separate evidence. An explicit regression records that limitation. A target's native support remains explicitly `not_run`.

Read the [guide](../../docs/gltf-validation-boundaries.md), [research record](../../research/2026-11-11-gltf-validation.md) and [source fragment](../../data/sources.d/gltf-validation-20261111.json) before applying this to another workflow.
