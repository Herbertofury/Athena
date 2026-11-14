# Pinned CPU texture resampling lab

This experiment sends original tiny arrays through actual stb_image_resize2 2.50. It separates library behavior from the texture meaning supplied by the caller. It does not decode files, use a GPU, build mip chains or test a game.

## Inputs and reproducibility

- `fixtures.json`: 16 original two-pixel rows, library controls, intended contracts and expected semantic matches. Seven controls deliberately mismatch the intended contract.
- `driver.c`: an original C driver using BOX/CLAMP to resize 2×1 to 1×1 with SIMD disabled.
- `dependency.json`: exact upstream commit, URL, byte count, SHA-256 and Git blob identity. The header is **not vendored**.
- `run.py`: compiles and runs in a temporary directory, retains raw output and compiler logs, checks independently calculated API/intent references, and writes a receipt without replacing an existing output or partial record.
- `observed-2026-11-11.json`: the preserved executed result. Byte outputs allow one unit of rounding tolerance; FLOAT allows 1e-6. All observed values also match the separately enumerated expectations exactly in independent replay.

Obtain the header from the URL in `dependency.json` under the applicable upstream license and save it outside the repository. Review the file before compiling; the runner checks the pinned bytes, not the safety of arbitrary source. No dependency is fetched by the runner. Supply a C99 compiler (`cc` in the observed run) and Python 3:

```sh
python3 engineering/experiments/texture-resampling-lab/run.py   --header /path/to/stb_image_resize2.h --output /path/to/new-receipt.json
python3 engineering/experiments/texture-resampling-lab/run.py   --verify-receipt engineering/experiments/texture-resampling-lab/observed-2026-11-11.json
cd engineering
python3 -m unittest discover -s tests -p 'test_texture_resampling_lab.py' -v
```

Use a new output path for each replay. Partial evidence is retained; never replace a failed run to make a result look clean. The compiler is invoked without fast-math, with `-O0`, C99 and warning flags. Upstream documents additional platform/compiler determinism requirements; this experiment does not certify cross-platform or SIMD determinism. Optimized performance is unmeasured.

## Results and limits

Black/white sRGB averaging yields 188 after linear-light processing rather than the encoded average 128. The appropriate straight-alpha layout prevents hidden red/green from affecting the tested visible blue edge; generic four-channel sRGB also incorrectly transforms the opacity channel for that intended contract. Applying sRGB to scalar data turns its intended 128 average into 188. FLOAT controls show matching straight/associated composites and the loss from double weighting. See [the guide](../../docs/texture-semantics.md) for the numeric table and practical implications.

The mask result is only thresholded sample-count coverage: two samples at alpha 0 and 1 become one at 128/255, changing the passing fraction at cutoff 0.5 from 50% to 100%. No surface coverage, mip quality or runtime acceptance is established.

Receipt verification checks current source hashes, dependency identity, shape/type constraints, raw/derived consistency and declared outcomes. **It is not authentication or execution attestation.** Coordinated replacement of both binary hashes or plausible environment labels remains acceptable. Fresh independent execution, reviewable inputs and external provenance are needed to support execution claims. The temporary executable is not retained, and input/header checksums alone do not establish a trusted compiler or reproducible toolchain.

The tests cover receipt rejection, expected numeric results, transfer boundaries, preservation guards and the explicit attestation limitation. They do not compile C. A separate [independent replay](independent-replay-2026-11-11.json) compiled the pinned header, reproduced all 16 outputs, and rejected 15 adverse receipt variants. Its [review results](independent-review-results.json) retain those checks and the accepted attestation limitation. This one-host replay is not broader interoperability evidence.

Only two-sample BOX reductions are measured. Unequal-alpha FLOAT samples, fully transparent output, normal vectors, HDR/negative values, ICC management, other filters, image decoders, UV seams, compression, GPU blending, mip chains, memory use and speed remain untested. No production project or security-sensitive implementation is modified.
