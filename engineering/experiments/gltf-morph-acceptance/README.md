# Morph export acceptance: static and editable are different lanes

Use this offline gate from an asset export test or directly after a trustworthy
decoder has read an original fixture. It checks one explicitly selected node
in a dense float GLB 2 sample projection. It does not load a GLB, call a tool,
re-export an asset, or stamp a delivery as ready. Do not run it on asset
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
