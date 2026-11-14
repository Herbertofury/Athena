# Texture acceptance receipt

## Decision and target

- Current target revision, platform, driver/API, importer and shader:
- Baseline and candidate transform/tool versions, dependency identity and options:
- Asset permission/source identity, exact original file hash and decoded sample hash:
- User-visible defect or goal, required output and disqualifying regressions:

## Semantics at every boundary

Record file → decoder → working buffer → resizer/mip generator → compressor → importer → GPU format/view → shader → framebuffer. For every boundary record channel order, dimensions/stride, primaries/transfer, alpha association and meaning, precision/range, orientation, any conversion, and actual sampled/read-back evidence. Keep color and numeric-data paths distinct.

- Material role and channel map:
- Transfer/profile policy and reason:
- Alpha representation, cutoff/blend state and zero-alpha policy:
- Sampler, UV transform/wrap, mip construction and LOD policy:
- Compression settings, runtime format/view, fallback and minimum-device support:

## Equivalent-work checks

- Dark/light/colored backgrounds, partial alpha and hidden RGB controls:
- Unequal-alpha and all-transparent cases:
- Scalar/normal-texture interpretation and shader readback:
- Cutout silhouettes, all mips and LOD transitions:
- Atlas seams/gutters, UV edges and oblique camera angles:
- Decoder/import failures, cancellation and repeated import:
- Actual-asset visual review and accessibility needs:
- Full-pipeline timing/memory with correctness and fidelity held fixed, if performance is claimed:

## Results and provenance

- Full commands, raw outputs/captures, warnings and failures:
- Baseline/candidate hashes and environment versions:
- Checks passed, failed, skipped and never run:
- Independent replay/reviewer, any disagreement and resolution:
- Source facts vs hypothesis vs measured result vs target acceptance:
- Decision, constraints, rollback and next unpassed gate:

A consistent JSON receipt or successful decode is not proof of execution, visual correctness or target acceptance. Keep failed evidence and use a new result for a retry.
