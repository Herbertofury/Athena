# glTF validation boundaries for asset pipelines

## The decision

Use format validation as one gate, not as proof that an asset still contains its intended animation or works in an engine. The [original fixture lab](../experiments/gltf-validation-lab/README.md) executes the official Khronos validator on a tiny animated triangle and controlled mutations. It does not render, play animation, import a model into an engine or change a game's assets. glTF is not assumed to be the native format for every game or mod.

## Measured counterexamples

The checksum-verified npm package `gltf-validator@2.0.0-dev.3.10` returned reports for all ten cases. All ten final declared expectations match, but **only the complete original fixture passes the limited fixture-data gate**. The [receipt](../experiments/gltf-validation-lab/observed-2026-11-11.json) preserves each input document and resource payload, full validator reports, callback requests, all package hashes and the separate data comparisons.

- Changing the final translation key from x=1 to x=4 yields zero issues. Both assets are valid; only one retains the original requested animation data. No playback or visual motion is inferred from this comparison.
- Removing the animation and its now-unused accessors yields zero issues. The [animation schema][AV11008] defines valid animation structure, not the animations a particular deliverable must retain.
- An original unsupported required extension yields zero errors and one informational `UNSUPPORTED_EXTENSION` issue. The [issue catalog][AV11003] labels its severity explicitly. Zero errors do not mean the validator understands the required extension.
- Supplying a bad index buffer produces `ACCESSOR_INDEX_OOB`. Omitting the resource callback instead produces `IO_ERROR`, and that index is not inspected. A missing mapped resource also produces `IO_ERROR`, with the failed request retained.
- Repeated timestamps and animation targeting a matrix-defined node produce distinct errors. The [specification][AV11001], [sampler schema][AV11009] and [target schema][AV11010] govern those constraints.
- A deliberately capped report is marked truncated after one error. Its issue count is not a full inventory of the combined defects.

The API promises a report, not a promise rejection for every invalid asset. All invalid fixture cases resolve with reports. Read the report's issues and completeness state; success of the JavaScript call alone is not structural validity. The [API][AV11004] exposes issue limits, resource callbacks and supported-extension discovery; the [report schema][AV11005] separates severity counts from truncation.

## Keep these gates separate

1. **Artifact identity and complete inputs.** Record the exact exported document, binary buffers, images and any required sidecar data. Record the validator and importer versions independently. The tested [npm metadata][AV11006] and [artifact][AV11007] are pinned; the package's 2024 publication date is separate from this 2026 check.
2. **Structural findings and report completeness.** Retain every issue and severity. Do not suppress issues or override severities to obtain a successful label. Review warnings and informational coverage gaps as well as errors. A truncated report is incomplete evidence.
3. **Resource availability.** Confirm which resources were actually requested and supplied. This lab uses an exact in-memory resource map, with no network or filesystem resource resolution. Supplying a buffer is not proof that every possible byte, image feature or extension was validated.
4. **Extension capabilities.** Required extension declarations matter for loading/rendering under the [specification][AV11001]. Keep the validator's supported set distinct from each target importer's and renderer's support. A custom validator or plugin may cover a requirement the standard validator cannot; that needs separate evidence. Optional and required extensions are not interchangeable. Names returned by supportedExtensions() are declared support, not proof of complete coverage: the pinned README explicitly marks KHR_animation_pointer support as partial. The lab field validator_supports_required_extensions checks name membership only.
5. **Asset-specific invariants.** Predeclare required geometry, hierarchy, animation names/channels, timestamps, target paths, interpolation, materials, skinning, morph targets, metadata and license retention before a transformation. Compare the features actually required by the asset. The lab checks only its tiny geometry/translation-data contract; it is not a general scene-equivalence checker.
6. **Native interpretation and visual behavior.** Test actual import, interpolation, looping, interruption, coordinate conventions, materials/color/alpha, lighting and target devices. Then check gameplay authority, reload, saving and interaction if the asset is used by a mod. None of these native gates was run here.

The validator's [documented coverage][AV11002] is valuable, but coverage, intended data and native behavior are different claims. Do not recommend an exporter, optimizer, codec or loader change for a target without comparing its existing implementation under the same requirements.

## Limits and retained failures

The initial probe incorrectly expected zero errors when the callback was omitted. The API wording says the external resource is not validated; it does not promise an error-free report. The observed `IO_ERROR` contradicted that inference. [Initial hypothesis evidence](../experiments/gltf-validation-lab/initial-hypothesis.json) retains the original expectation and actual report; the fresh run explicitly expects the observed failure mode. This is not represented as a successful validation of the missing data.

All source assets are original. No real texture, skin, morph target, material extension, cubic-spline path, compressed mesh or GLB container is tested. The tiny accessor reader supports only the fixture's selected scalar/vector layouts and reports other layouts outside its contract. Receipt checks do not authenticate execution or independently verify report.info statistics: coordinated changes to raw reports and derived hashes can remain consistent. Fresh execution is separate evidence. No render, perceptual comparison, speedup or native compatibility is established.

Use the [acceptance receipt template](../templates/asset-validation-receipt.md) and [research record](../research/2026-11-11-gltf-validation.md) to carry those distinctions into an authorized asset workflow.

[AV11001]: https://github.com/KhronosGroup/glTF/blob/110adbcaffe5d0ef4863eb25b98d652322146d7c/specification/2.0/Specification.adoc
[AV11002]: https://github.com/KhronosGroup/glTF-Validator/blob/bcd52cc4ba5f333b2999a58f67cc05ddf28b4fb1/README.md
[AV11003]: https://github.com/KhronosGroup/glTF-Validator/blob/bcd52cc4ba5f333b2999a58f67cc05ddf28b4fb1/ISSUES.md
[AV11004]: https://github.com/KhronosGroup/glTF-Validator/blob/bcd52cc4ba5f333b2999a58f67cc05ddf28b4fb1/node/index.js
[AV11005]: https://github.com/KhronosGroup/glTF-Validator/blob/bcd52cc4ba5f333b2999a58f67cc05ddf28b4fb1/docs/validation.schema.json
[AV11006]: https://registry.npmjs.org/gltf-validator/2.0.0-dev.3.10
[AV11007]: https://registry.npmjs.org/gltf-validator/-/gltf-validator-2.0.0-dev.3.10.tgz
[AV11008]: https://github.com/KhronosGroup/glTF/blob/110adbcaffe5d0ef4863eb25b98d652322146d7c/specification/2.0/schema/animation.schema.json
[AV11009]: https://github.com/KhronosGroup/glTF/blob/110adbcaffe5d0ef4863eb25b98d652322146d7c/specification/2.0/schema/animation.sampler.schema.json
[AV11010]: https://github.com/KhronosGroup/glTF/blob/110adbcaffe5d0ef4863eb25b98d652322146d7c/specification/2.0/schema/animation.channel.target.schema.json
