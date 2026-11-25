# Morph export acceptance: static and editable are different lanes

Use this offline gate from an asset export test or directly after a trustworthy
decoder has read an original fixture. It checks one explicitly selected node
in a dense float GLB 2 sample projection. The original projection gate does not load a GLB,
call a tool, re-export an asset, or stamp a delivery as ready. Do not run it on asset
metadata alone: valid glTF, animated object transforms, and a successful export
can all coexist with missing or orphaned morph controls.

```sh
node engineering/experiments/gltf-morph-acceptance/gate.mjs expected.json decoded.json
node --test engineering/tests/gltf-morph-acceptance.test.mjs
```

The asset QA caller supplies two separate UTF-8 JSON files (at most 2 MiB each)
or calls `checkMorphEvidence(contract, evidence)` directly. The command reads
only those files, prints one JSON decision and exits 0 (matched), 2 (rejected)
or 3 (inconclusive). Nothing is written to either input.

## Check original file bytes directly

```sh
node engineering/experiments/gltf-morph-acceptance/check-glb.mjs expected.json candidate.glb
node --test engineering/tests/gltf-morph-acceptance.test.mjs engineering/tests/gltf-morph-glb-direct.test.mjs
```

Use the same independently authored contract below. Pin your expected asset's
SHA-256 and selected node/mesh indexes, plus exact desired control names and
thresholds. The binary command hashes the actual input, will not resolve paths
from the file or fetch any network resource, and decodes the selected node's
supported float32 POSITION deltas and attached scalar weights directly.
It checks GLB boundaries and accessor ranges against the declared buffer view.
Exit codes: 0 matched, 2 explicitly rejected, 3 inconclusive. This still is not
a complete glTF validator: it does not validate other nodes, decode materials,
prove provenance beyond the expected digest, or check visual equivalence.
Caps: 16 MiB GLB, 2 MiB embedded JSON, 2,048 positions per primitive and
512 frames per weight track, plus the gate's combined sample limit. External
buffers, required extensions, sparse/quantized/compressed values, cubic
tracks and unnamed targets are outside the supported lane. For format-wide
validation use the independent [Khronos glTF Validator][validator]. A broader
decoder can supply reviewed projections to the original gate instead.

The test fixtures are original verification geometry exported by Blender 4.3.2.
The editable file has four positions, two named morphs and one attached weight
channel; a Godot 4.7.2 import retained both names and changing tracks. The
same input with subdivision and Blender's Apply Modifiers export produced nine
positions, zero morph targets and one orphan weight channel. The checker denies
both editable and clean-static acceptance for that output. This comparison
does not claim the unsubdivided result is visually equivalent to the bake.

To regenerate the two original examples into a new folder with Blender:

```sh
blender --factory-startup --disable-autoexec --background --python-exit-code 1 \
  --python engineering/experiments/gltf-morph-acceptance/generate_blender_probe.py -- NEW_FIXTURE_DIR
```

A later version of Blender may legitimately emit different bytes or fix the
orphan condition. The checked-in test data pins the original two exact exports.

[validator]: https://github.com/KhronosGroup/glTF-Validator

## Expected versus measured

- **Contract:** `schema: 1`, `lane: "editable-animated"` or `"static"`,
  `sourceSha256` as a lowercase 64-character exact expected asset digest, and
  exact nonnegative `nodeIndex` and `meshIndex`. Editable contracts also list
  unique ordered `targets`, plus positive `minAbsPositionDelta` and
  `minWeightChange`. Choose thresholds for your known nontrivial fixture.
- **Decoded evidence:** `schema: 1`, `sampleFormat: "glb-2-dense-f32-exhaustive"`,
  the same digest computed over the actual source file, and node and mesh
  indices from that decode. Include the selected mesh's ordered `targetNames`
  (e.g. the exporter-provided `extras.targetNames` convention). Include
  `primitives`, each with decoded base `positionCount` and `targetPositions`:
  an array of flattened numeric XYZ delta arrays in target order. Use complete
  decoded POSITION samples, not accessor min/max metadata.
- **Weight tracks:** `weightTracks` holds records with `nodeIndex`,
  `animationIndex`, explicit `interpolation` (expand omitted glTF default to
  LINEAR), decoded `times` and flattened `weights` in keyframe-major target
  order. Include all weight tracks attached to the selected node. A channel on
  another node, or motion in translation/rotation/scale, does not prove the
  requested weight track exists. Require nonzero XYZ component delta and a
  changing weight for every requested named target, and matching target order
  and sample counts across the selected primitives. An intended static lane
  instead requires zero controls and no attached weight track.

The reported digest binds the identities declared by independently prepared
contract and projection. It is not independently recomputed by this checker
and cannot authenticate somebody else's decoded report. The test remains
inconclusive for unsupported encodings (including sparse/quantized/compressed
samples), cubic interpolation, or exceeded sample budgets. It does not test
mesh bounds, materials, skinning, other nodes, exact final appearance, or live
consumer operation. Check those separately in the intended importer and engine.

If applying a modifier bakes a desired visual effect but removes editable
controls, report that tradeoff. Do not label the baked result as editable just
because it still moves. Keep independent static-geometry proof or label a
separate editable variant and its changed geometry until both requirements
have actually passed. See the Khronos [morph target](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#morph-targets)
and [animation](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#animations)
contracts.
