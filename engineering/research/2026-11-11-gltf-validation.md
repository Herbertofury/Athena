# November 11, 2026: structural asset validation versus retained intent

## Gap and decision

Athena main `44384b809c80e03adbd62f8be9617d01e6ad9922` has an asset-fidelity comparison plan and general import/export gates, but no executed official glTF-validator experiment. Current mod drafts cover build acceptance, dependency versions, bytecode selectors, archive packaging and JVM class loading. Archive-reading work addresses another contract. This contribution fills the validator/asset-intent gap without claiming completion of the broader asset pipeline plan.

## Measured evidence

The [lab](../experiments/gltf-validation-lab/README.md) executes the checksum-pinned official validator on ten original tiny assets. All ten final declared outcomes match, while only the complete original passes the deliberately limited fixture gate. Altering a translation endpoint or removing the animation both produces zero issues. An unsupported required extension produces only an informational issue. Missing external data and malformed index/time/target data produce distinct errors. A capped report preserves its truncated state.

The [receipt](../experiments/gltf-validation-lab/observed-2026-11-11.json) retains inputs, raw reports, requests, package/input/report hashes and separate data/capability/completeness gates. Fifty offline Node tests check behavioral distinctions and malformed or mutated evidence. The tool's fulfilled validation promises are not interpreted as error-free assets. No warning or informational issue is suppressed, and no severity is lowered.

## Preserved failed hypothesis

The initial probe expected the callback-omitted case to return zero errors based on an overly broad reading of the API's statement that external resources are not validated without the callback. Actual execution returned `IO_ERROR`. The [retained initial hypothesis](../experiments/gltf-validation-lab/initial-hypothesis.json) contains that prediction and observed report. The final fresh expectation explicitly requires the I/O failure and does not pretend that the invalid index was validated. Other measured behaviors were not rewritten to hide a mismatch.

The package tarball matched registry integrity, and all nine extracted members are pinned. Publication date (2024-10-22), npm version, metadata gitHead, specification-source commit and date checked are distinct. The npm source revision is not a reproducible source-to-binary attestation. The source index records only actually read primary sources.

## Alternatives and remaining gates

A JSON-schema-only check was rejected as the main experiment because it would miss binary accessor values and the actual validator's resource behavior. A homemade general glTF validator was also rejected; the original code only compares a narrow, declared asset-data contract alongside the official tool. No renderer or game launch was substituted with a synthetic success label.

The [guide](../docs/gltf-validation-boundaries.md) separates structural findings, resource availability, extension support, retained data and native interpretation. It offers no target optimizer/exporter/engine recommendation without a comparison to that target's current implementation. Real textures, materials, skins/morphs, cubic interpolation, compressed geometry, GLB containers, native gameplay, visual fidelity and performance remain unrun.

This is an independent asset contribution. No held material, active release, target configuration or workflow is changed. Source-index and game-asset navigation additions preserve main and should be unioned with other draft additions. The inherited full research cross-root link error is not changed or waived; Node lab checks and the existing Python suite are reported separately. No merge or deployment is requested.

## Sources

Primary sources opened and checked 2026-11-11 UTC, with distinct version/publication metadata in the [source fragment](../data/sources.d/gltf-validation-20261111.json).

[AV11001](https://github.com/KhronosGroup/glTF/blob/110adbcaffe5d0ef4863eb25b98d652322146d7c/specification/2.0/Specification.adoc), [AV11002](https://github.com/KhronosGroup/glTF-Validator/blob/bcd52cc4ba5f333b2999a58f67cc05ddf28b4fb1/README.md), [AV11003](https://github.com/KhronosGroup/glTF-Validator/blob/bcd52cc4ba5f333b2999a58f67cc05ddf28b4fb1/ISSUES.md), [AV11004](https://github.com/KhronosGroup/glTF-Validator/blob/bcd52cc4ba5f333b2999a58f67cc05ddf28b4fb1/node/index.js), [AV11005](https://github.com/KhronosGroup/glTF-Validator/blob/bcd52cc4ba5f333b2999a58f67cc05ddf28b4fb1/docs/validation.schema.json), [AV11006](https://registry.npmjs.org/gltf-validator/2.0.0-dev.3.10), [AV11007](https://registry.npmjs.org/gltf-validator/-/gltf-validator-2.0.0-dev.3.10.tgz), [AV11008](https://github.com/KhronosGroup/glTF/blob/110adbcaffe5d0ef4863eb25b98d652322146d7c/specification/2.0/schema/animation.schema.json), [AV11009](https://github.com/KhronosGroup/glTF/blob/110adbcaffe5d0ef4863eb25b98d652322146d7c/specification/2.0/schema/animation.sampler.schema.json), [AV11010](https://github.com/KhronosGroup/glTF/blob/110adbcaffe5d0ef4863eb25b98d652322146d7c/specification/2.0/schema/animation.channel.target.schema.json).
