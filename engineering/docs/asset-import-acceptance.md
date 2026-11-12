# Asset import acceptance: source, format, runtime and appearance

Reviewed **2026-11-11 UTC**. This expands [game-asset principles](game-assets.md) into a proposed acceptance process. Use the [asset receipt template](../templates/asset-compatibility-receipt.md). The gates below are test designs, not measured results or permission to use third-party assets.

## Why a valid file is not enough

The glTF specification distinguishes JSON asset versions from the GLB container version. Required extensions must also appear in the used-extension list. A GLB may still reference external resources. Therefore, “GLB,” “glTF 2.0,” and “self-contained” are different claims. [MB11012](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)

Khronos's validator reports format, reference, buffer and selected extension issues in JSON. It documents resource-validation controls and partial coverage for at least one extension, so capture the exact validator version, options, report and unsupported-extension warnings. Validator success cannot demonstrate a target engine's rendering or gameplay behavior. [MB11013](https://github.com/KhronosGroup/glTF-Validator)

## Gate A: preserve identity and provenance

Retain the authoring source and an untouched export. Record source/texture hashes, creator, license, modification rights, redistribution scope, tool/exporter version, export settings and output hashes. Check each dependency rather than inferring its license from the repository containing a link.

For generated or original fixtures, say so. Keep real user assets private unless publication is authorized. Generate a small asymmetric calibration object and labeled axes yourself rather than copying an unknown asset just to make a test pass.

## Gate B: build an explicit capability matrix

For every target importer and runtime build, list:

- Container and asset version support, with `asset.minVersion` when present.
- Every used and required extension, supported decoder/transcoder versions, and known gaps.
- All external resources and how the packaged runtime resolves them.
- Mesh primitives, materials, alpha mode, normals/tangents, UV sets, skins, joints, morph targets, animation channels/interpolation and user metadata needed by the application.
- Coordinate system, units, front direction, pivot/socket conventions and the owner of every conversion.

**Acceptance rule proposed here:** reject an unsupported required capability before calling the asset ready. Optional fallback is acceptable only if it preserves the declared required appearance and behavior. “No exception thrown” is not the oracle.

Do not implement an unchecked resource fetcher to satisfy the matrix. External paths/URLs need a separate bounded, authorized resolution policy, and a missing file must not silently use a stale cached resource.

## Gate C: distinguish editor import from packaged loading

Godot's documentation describes glTF editor import as parsing, scene generation, import settings and persisted scene output. Direct `.blend` import invokes Blender's glTF export and requires Blender; it is unavailable in Android and web editors. Explicit glTF export trades a simpler importer dependency chain for a separate export artifact that can become stale. [MB11014](https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_3d_scenes/available_formats.html)

Godot also distinguishes camera forward (-Z) from an oriented model's front (+Z). A shared right-handed coordinate system alone does not settle forward-facing behavior. [MB11015](https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_3d_scenes/model_export_considerations.html)

**Proposed probes:** import in a fresh project, then package and run on every promised OS/render backend. Keep editor-generated imports, runtime loaders and conversion tools in the receipt. Change the authoring source and an external texture separately to prove reimport invalidation. Exercise missing texture, malformed resource, unknown required extension and incompatible decoder cases. Preserve errors rather than silently substituting unrelated defaults.

**Rejected shortcut:** choose direct `.blend` import universally because it avoids a checked-in export. It introduces an external tool requirement and is not eligible for every editor platform. Conversely, explicit glTF is not automatically faithful; stale-export and fidelity checks still apply.

## Gate D: test semantic and visual fidelity independently

| Original fixture to design | Semantic assertion | Native visual/behavioral assertion |
|---|---|---|
| Asymmetric labeled axes and off-center pivot | Units, transforms, hierarchy and socket orientation match the declared convention. | Camera/model forward and attachment motion are correct. |
| Two-material mesh with transparency boundary | Material assignment, alpha mode and required UVs survive. | Edges, sorting, normal response and intended backfaces match the reference. |
| Skinned mesh with nontrivial bind pose | Joint identities, weights and inverse-bind relationships survive. | Extreme poses do not explode or detach. |
| Morph target with animation | Target count/order, weights and animation channel remain present. | Shape transitions and shading match the declared budget. |
| Interpolated animation and interrupt transition | Duration, key/value data and interpolation are retained. | Mid-keyframe behavior and interruption are correct, not only key poses. |
| Optional and required extension pair | Extension classification and fallback requirements are preserved. | Unsupported required case fails visibly; allowed fallback meets the contract. |
| External-resource GLB | Inventory includes every resource and content hash. | Packaged offline run resolves complete assets or reports the missing dependency. |

Use deterministic cameras, lighting, tone mapping, resolution and render backend for image comparisons. Store semantic counts/IDs and rendered references; either can detect failures the other misses. Set tolerances before optimization. Add human review for motion, readability and clipping rather than treating one image metric as complete aesthetic acceptance.

For an attached prop, test the actual character proportions, view/camera, ownership handoff, interrupted animation and repeated equip/unequip. Swept motion or interpolation needs explicit treatment; a finite pose sample alone is not continuous collision proof. Gameplay events remain authoritative even when an animation is interrupted.

## Gate E: evaluate compression as a whole pipeline

Compare untouched export, explicit lossless processing and each declared lossy candidate separately. Keep decoder, image formats, extensions, device, caches, network/IO conditions and accepted fidelity fixed. Record:

1. Encoded bytes, all resource bytes and package bytes.
2. Read/transfer, parse/validation, decode/transcode, upload and scene-ready times separately.
3. Peak CPU memory, GPU allocations where measurable, and steady-state frame tails.
4. Semantic, visual, animation and error-behavior results for every candidate.

A smaller archive can increase decode memory or delay first useful render. An importer that skips resources is doing less work. No compression, importer or authoring tool is recommended for a target project until its current implementation is the control and the full acceptance contract passes.

## Remaining research

This contribution has not run the native fixtures, tested codec support, validated proprietary package formats, benchmarked rendering, or established licensing for any third-party asset. Pinned Blender-manual retrieval was unsuccessful, so no new Blender-specific export-setting assertion is based on that unavailable page. Exact importer/extension versions and target workloads must be selected before execution.
