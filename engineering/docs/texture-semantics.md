# Texture semantics: preserve meaning through filtering

A successful image decode or valid material file does not establish correct color, transparency, sampling or appearance. Record the meaning of each channel before resizing, generating mips, packing channels or choosing a GPU format. This guide combines documented contracts with a deliberately small [CPU experiment](../experiments/texture-resampling-lab/README.md). It accepts no production asset or game target.

## The contract to write first

For each texture, record: material role; channel order; color primaries and transfer function; straight or premultiplied alpha; whether alpha means opacity, a mask or unrelated data; value range; precision; orientation; sampler; mip policy; compression; and the exact importer/shader that consumes it. A file extension does not fill these fields in.

For color interpreted as sRGB, our experiment decodes RGB to linear light, filters, then encodes RGB for storage. The piecewise sRGB transfer function is documented in CSS Color 4, including the 0.04045 decode and 0.0031308 encode boundaries. This uses the sRGB transfer math, not CSS's complete color-interpolation policy or ICC conversion. [TX11001](https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#color-conversion-code)

For linear scalar data, preserve the numeric values instead. Applying the same sRGB conversion to a roughness, metallic or occlusion channel changes the field. Normal maps additionally encode vectors; this lab does not test vector reconstruction, renormalization or filtered normal-distribution effects. Those require a shader-specific contract and experiment.

## What the actual resizer did

The lab compiles stb_image_resize2 **2.50**, pinned at `703100c5f8a0b75b4861e401db567f1d82d545b8`, with SIMD disabled. Original two-pixel rows become one output pixel with BOX filtering and CLAMP edges. An independent Python formula checks API behavior separately from intended texture meaning. This is one C library, compiler configuration and Linux environment, not a GPU or decoder benchmark. [TX11003](https://github.com/nothings/stb_image_resize/blob/703100c5f8a0b75b4861e401db567f1d82d545b8/stb_image_resize2.h)

| Original fixture / control | Measured output | Interpretation |
|---|---|---|
| Black and white RGB bytes, generic UINT8 | 128, 128, 128 | Average of encoded byte values |
| Same bytes, UINT8_SRGB | 188, 188, 188 | Linear-light average encoded back to sRGB |
| Black and mid-gray 128, UINT8 / UINT8_SRGB | 64 / 92 in each RGB channel | The transfer distinction is not unique to endpoints |
| Constant 128 RGB, either path | 128, 128, 128 | A constant patch alone fails to expose the wrong path |
| Transparent red plus opaque blue, RGBA sRGB | 0, 0, 255, 128 | Straight-alpha weighting excludes hidden red |
| Transparent green plus opaque blue, RGBA sRGB | 0, 0, 255, 128 | Same result despite different invisible RGB |
| Transparent red plus opaque blue, generic 4CHANNEL sRGB | 188, 0, 188, 188 | Both hidden color and opacity are wrong for this intent |
| Linear scalar 0 and 255, UINT8 / UINT8_SRGB | 128 / 188 | Color conversion corrupts the intended scalar average |

All 16 cases match the pinned API reference. Seven deliberately mismatched controls fail the intended texture contract. “All declared outcomes match” includes those expected semantic failures; it does not mean every configuration is suitable. Full per-case outputs, intended values and errors are in the [receipt](../experiments/texture-resampling-lab/observed-2026-11-11.json).

## Alpha association is a pipeline property

The pinned library's RGBA layout takes straight RGB, weights it by alpha for filtering and returns straight RGB. RGBA_PM assumes the input is already associated and avoids weighting again. Generic 4CHANNEL has no alpha semantics; with sRGB it treats the fourth component like a color channel. A layout flag is a declaration about existing bytes, not a conversion that can repair mislabeled input. [TX11003](https://github.com/nothings/stb_image_resize/blob/703100c5f8a0b75b4861e401db567f1d82d545b8/stb_image_resize2.h)

For linear-light source-over compositing, associated RGB contributes directly; straight RGB contributes after multiplication by source alpha. The background contribution is attenuated by one minus source alpha. Keep blend-state factors consistent with the representation, and do not multiply associated color twice. The algebra follows the documented source-over equations. [TX11002](https://www.w3.org/TR/2024/CRD-compositing-1-20240321/#simplealphacompositing)

The FLOAT fixture averages half-transparent red and blue. Straight output `[0.5, 0, 0.5, 0.5]` and associated output `[0.25, 0, 0.25, 0.5]` both contribute `[0.25, 0, 0.25]` over black when interpreted correctly. Sending associated input through the straight path and interpreting the result as straight contributes only `[0.125, 0, 0.125]`. The values above are calculated composites from actual resizer output, not captured framebuffer pixels. Equal-alpha FLOAT inputs do not exercise unequal-alpha weighting, zero-total-alpha, HDR or negative ranges.

## File, material and GPU rules are distinct

PNG stores unassociated RGB and alpha, and alpha is not gamma corrected. Color metadata and pixel samples require interpretation by the consuming application. Converting a decoded working buffer to associated color does not change the PNG file contract. [TX11007](https://www.w3.org/TR/2025/REC-png-3-20250624/)

In glTF 2.0, material use determines texture interpretation: base-color and emissive RGB use sRGB; metallic, roughness, occlusion and normal data use their specified linear encodings. Base-color alpha is linear and the RGB must not be premultiplied. The glTF image rules require ignoring embedded color-space metadata. Do not automatically apply an image profile and then the material's sRGB decoding again. These are glTF contracts, not a universal policy for every image viewer. [TX11006](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)

Do not infer GPU filtering behavior from this CPU result. In particular, OpenGL 4.6 Core §8.24 permits sRGB conversion after filtering while recommending conversion before filtering; alpha is unchanged by sRGB conversion. Read the exact API specification, format features and target implementation, then capture a discriminating GPU test. Our 128-versus-188 pattern is a useful diagnostic candidate, not evidence that a renderer has passed. [TX11008](https://www.khronos.org/registry/OpenGL/specs/gl/glspec46.core.pdf)

## Mips, cutout masks and compression need separate acceptance

An average alpha is not a guarantee that a threshold test preserves coverage. In the measured edge row, one of two input samples passes alpha ≥ 0.5. The single output's alpha is 128/255 and passes, changing the **sample-count fraction from 50% to 100%**. This establishes only that bounded counterexample. It is not a rendered area estimate, complete mip-chain test or proof of a coverage-preserving algorithm. glTF distinguishes OPAQUE, MASK and BLEND, with MASK using a cutoff and a default cutoff of 0.5. [TX11006](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#alpha-coverage)

Choose any coverage adjustment against the actual target's cutoff, footprints, LOD transitions and silhouette requirements. Keep the unadjusted baseline. For atlases, include neighbor contamination, gutters at each mip, wrapping and oblique views. For normal maps, compare the decoded vectors and resulting lighting rather than only RGB error. These are proposed acceptance tests, not results from this contribution.

Compression adds another transform. Measure after the actual encoder, importer and shader, using the intended sRGB/linear and alpha interpretation. Validate support on the minimum target device, all mips, representative transparencies, banding and block artifacts. Neither lossless source storage nor a correct CPU average proves that the compressed runtime asset preserves the intended appearance. No compressor or format is ranked here. Vulkan documents a guaranteed baseline and additional device-dependent format features, so record the actual queried support rather than relying on a format name. [TX11009](https://docs.vulkan.org/spec/latest/chapters/formats.html)

NVIDIA's exporter documentation separately advertises cutout-coverage correction, normal-map mip processing and linear premultiplied-alpha processing. This is useful evidence that these are distinct controls to examine, not an endorsement, comparison result or acceptance of that tool in a target. [TX11010](https://developer.nvidia.com/texture-tools-exporter)

## Conditional choices and rejected shortcuts

- Use explicit sRGB processing for color only when the source and consumer agree on that transfer function. Preserve a distinct linear path for data textures.
- Use alpha-aware filtering for transparency when starting with straight color. Use the associated path only for genuinely associated data and a matching downstream contract.
- Keep a nearest-neighbor baseline when pixel-art edges are intentional. A smoother filtered result is not automatically an artistic improvement.
- Do not validate with constant-color patches alone: this lab shows both correct and incorrect transfer paths can preserve them.
- Do not adopt this library as a production dependency from these numbers. Its README warns that reported security-relevant issues may take time to fix, and its implementation/license choices need project-specific review. The dependency is supplied separately and is not vendored here. [TX11004](https://github.com/nothings/stb_image_resize/blob/703100c5f8a0b75b4861e401db567f1d82d545b8/README.md), [TX11005](https://github.com/nothings/stb_image_resize/blob/703100c5f8a0b75b4861e401db567f1d82d545b8/LICENSE)

## Evidence required before adoption

Use the [texture acceptance receipt](../templates/texture-acceptance-receipt.md). Compare the current target revision and candidate using identical assets, camera, lighting, scale, animation and output requirements. Preserve source/decode/import/upload identities and actual runtime captures over dark, light and colored backgrounds. Include mixed-alpha edges, all-transparent pixels, partial cutouts, uneven alpha, normal/scalar textures, mip transitions and failure recovery. A representative actual asset set, target-platform correctness and visual review are still required; timings should cover the full relevant pipeline without hiding work or degrading output.

[Research record](../research/2026-11-11-texture-semantics.md) · [Game assets](game-assets.md)
