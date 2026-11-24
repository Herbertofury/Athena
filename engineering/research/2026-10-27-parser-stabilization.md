# Source review and parser stabilization · 2026-10-27

Sources: SIMD01, SIMD02, JSON09, CODE01, CODE02. See the
[full experiment and retained failures](../experiments/rust-json-parser-lab/README.md).

The latest inspected simd-json development head was
0af2fec36fb7096412288515aa0a498b0de61340, while the tested registry release was
0.18.1 from 61d649d13fae83ac6d9f587863696be2741f5b8b. Development fixes are not
silently treated as released artifacts. A narrow, reviewed Unicode-decoder
backport was isolated and tested; no upstream executable or application update
was substituted. Other newer upstream changes are outside that backport.

The reference parser also needed scrutiny: floating-point discrepancies favored
the candidate in the observed generated corpus. Accurate-reference results are
kept separate from the ordinary-reference run rather than relabeling failures.
Neither parser's ordinary large-integer behavior provides arbitrary precision.

At 05:52 UTC, public Codeberg browser views reconfirmed unchanged orjson head
bd00937c5c46ab20eb5d7fe1cfc034b906c4578f and Zig head
cb6f0c25f176dbebf0c6801170c360c2c1198524. These were metadata/source observations,
not fresh builds or full audits. RustSec's repository returned no commits since
04:42 UTC when checked at 05:37; this narrow delta is not a vulnerability scan.
Tokio latest remained 1.54.1. Tauri's repository latest-release endpoint returned
tauri-cli-v2.12.4; that must not be misreported as the Tauri library version.
