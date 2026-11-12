# Asset compatibility receipt template

**Template only. No export, import, native-runtime or visual result is asserted.**

## Identity, rights and toolchain

- Original asset/creator/license; reuse/modification/redistribution scope:
- Original authoring file and resource hashes; original or synthetic fixture label:
- Authoring tool/exporter/plugin versions and settings:
- Output artifact/container/asset version and SHA-256:
- Required/used extensions, decoder/transcoder versions and complete external-resource inventory:
- Target engine/importer/runtime version, OS/architecture, renderer and hardware:
- Editor import settings and packaged/runtime loading path:
- Coordinate/unit/front/pivot/socket conventions:

## Required invariants and budgets

- Hierarchy, mesh/material IDs, UVs, normals/tangents, alpha and metadata:
- Skeleton/bind pose/weights, morph targets and animation behavior:
- Interruption, attachment ownership, gameplay-event authority:
- Predeclared geometric/animation/image tolerances and visual reviewer:
- Startup/scene-ready/frame-tail, CPU/GPU memory and package-size budgets:

## Separate acceptance gates

Valid statuses: not_run, passed, failed, blocked, not_applicable. Record evidence for each artifact and attempt; justify not_applicable.

| Gate | Status | Evidence hash/link | Remaining limitations |
|---|---|---|---|
| Provenance and rights | not_run | none | unassessed |
| Format/resource validation with pinned options | not_run | none | unassessed |
| Required runtime capabilities/extensions | not_run | none | unassessed |
| Semantic roundtrip | not_run | none | unassessed |
| Native packaged import/render | not_run | none | unassessed |
| Animation/extrema/interruption | not_run | none | unassessed |
| Visual fidelity in declared scenes | not_run | none | unassessed |
| Malformed/missing/unsupported inputs | not_run | none | unassessed |
| Complete-pipeline performance | not_run | none | unassessed |

## Comparison and decision

- Untouched control, explicit lossless variant, each declared lossy variant:
- Trial order/cache state, complete outputs, all failures and measurements:
- Transfer/read, validation, decode/transcode, upload, scene-ready and steady-state results:
- Peak memory measurement scope and unknown allocations:
- Chosen tradeoff, rejected alternative, reviewer/date:
- Current status: **not assessed**. Remaining native and licensing gates:

Do not replace missing evidence with successful schema validation or an attractive concept render. See [asset import acceptance](../docs/asset-import-acceptance.md).
