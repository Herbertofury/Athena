# Ranked recommendations: best choices and what to avoid

**Local parser evidence: October 26, 2026. Current-source extension: October 31, 2026.** Project-neutral recommendations, ordered within a stated job. Rankings distinguish local measurements, upstream claims and experimental ideas. A disqualifying requirement outranks speed. No score combines unrelated languages, hardware or workloads into a fictional universal winner.

## The practical leaderboard

| Job | First choice to evaluate | Second choice / fallback | Avoid as the default |
|---|---|---|---|
| Python JSON, ordinary finite values and compatible integer bounds | **orjson 3.13.0**, fastest in this local generated-workload comparison | Standard-library json when deployment simplicity or hooks dominate | A parser swap without large-integer, invalid-input and output-type checks |
| Python JSON requiring exact integers above 64 bits or custom decode hooks | **Standard-library json**, with an explicit validation policy | A separately tested schema-aware solution | orjson as an unqualified lossless replacement |
| New Python JSON dependency | **orjson**, subject to the contract above | Standard library when sufficient | **ujson for a new default**: maintenance-only upstream and concerning default-acceptance cases in this lab |
| C++ selective JSON access | **simdjson 5.1.0** as the current benchmark candidate | Full DOM alternatives when traversal/access demands it | Treating selective field access as equivalent to validating every required field |
| C JSON DOM and mutation workflows | **yyjson 0.13.0** as a strong candidate | Existing correct implementation if integration cost dominates | Comparing its DOM chart with a different parser's selective-access API as if they do the same work |
| Go JSON hot paths | **Sonic 1.15.4** as a conditional candidate | encoding/json for compatibility baseline | Blindly enabling the fastest config or ignoring first-use compilation/memory behavior |
| Large file/config inventories | **One verified inventory/index plus bounded independent work** | Serial indexed baseline on constrained storage | Reopening/reparsing everything per lookup; unbounded workers; dropping errors |
| Worker limits | **Smallest near-fastest configuration passing correctness and UX/resource gates** | Existing known-good setting when none qualify | “64 is best because it is the largest number” |
| WebAssembly runtime choice | **Representative feature/correctness/startup/execution/bridge-cost comparison** | Keep the current runtime until a migration wins | Selecting from arithmetic throughput alone |
| New toolchain adoption | **Pinned stable release with compatible tooling and representative build tests** | Isolated experimental branch | Whole-project rewrites justified only by a new language/version headline |

The last four rows are engineering recommendations, not measured rankings of named products. C/C++/Go candidates have not been benchmarked locally in this pass. [Parser evidence](#parser-evidence-and-caveats) and [2026 paper review](paper-watchlist-2026.md) explain the limits.

## Local Python measurement: speed order versus adoption order

Three generated inputs, 15 randomized-order rounds per operation, 30 iterations per sample, CPython 3.12.14 on Linux x86_64. Real timings, synthetic input data. Complete materialized values were compared before timing and after each sample. Encode measurements produce UTF-8 bytes for every implementation. Raw observations and script are in the [JSON lab](../experiments/json-lab/README.md).

**Observed speed order: orjson → ujson → standard library**, for all nine workload/operation combinations in the first run. The retained final-run table in the lab is authoritative if later runs differ. This is not the adoption order: correctness, compatibility and maintenance can move a slower implementation ahead.

Important adversarial observations from the tested versions:

- orjson decoded `18446744073709551617` to a float, losing exact integer identity. Standard json and ujson returned the exact Python integer. Do not use this orjson path where that domain is required.
- All three default decoders accepted duplicate keys and retained the last value. None of these default modes is a duplicate-key rejection policy.
- orjson rejected the tested NaN/Infinity and lone-surrogate inputs; the other two accepted them.
- ujson accepted the tested leading-zero number and unescaped control character that the other two rejected.
- All three rejected the tested invalid UTF-8 byte, trailing comma and concatenated documents.

These are 12 targeted cases, not an exhaustive conformance suite or a finding that every accepted extension is inherently a bug. The product's contract decides required behavior. The timing corpus intentionally stays inside the shared supported subset; its equivalence result does not erase the adversarial differences.

## Parser evidence and caveats

- **orjson:** upstream documents UTF-8 bytes output, held GIL and unsupported embedded mobile/PyPy/subinterpreter targets. Its official README identifies both [GitHub](https://github.com/ijl/orjson) and [Codeberg](https://codeberg.org/ijl/orjson) repositories. Direct browser inspection subsequently verified the Codeberg repository and README; its displayed head matched GitHub master at `bd00937c5c46ab20eb5d7fe1cfc034b906c4578f`. The tested distribution remains the PyPI wheel, not a locally built mirror artifact. [JSON01]
- **ujson:** upstream explicitly places the project in maintenance-only mode and recommends migration to orjson. This supports caution for new adoption, not a claim that every existing installation is exploitable. [JSON02](https://github.com/ultrajson/ultrajson)
- **Standard json:** hooks permit custom integer/decimal handling and duplicate-key policy. Its defaults permit non-finite numbers, so strictness requires deliberate configuration and tests. [JSON03](https://docs.python.org/3.12/library/json.html)
- **simdjson:** a serious SIMD candidate; its performance guidance distinguishes allocation-included and allocation-excluded runs. Reusing a parser can matter, but this must not hide cold-start or lifetime costs. [JSON04](https://github.com/simdjson/simdjson), [performance guide](https://github.com/simdjson/simdjson/blob/master/doc/performance.md).
- **yyjson:** the upstream DOM comparison itself notes that simdjson On Demand can be faster for known fields, and its displayed benchmark charts include old hardware/toolchains. The latest release date does not refresh old performance evidence. [JSON05](https://github.com/ibireme/yyjson)
- **Sonic:** the README's broad best-performance claim is not independently reproduced here. It distinguishes compatibility/default/fastest configurations, warns about huge-schema first-hit compilation and describes retained source-buffer memory. Test cold and steady-state behavior separately. [JSON06](https://github.com/bytedance/sonic)

The October 26 review recorded simdjson 5.0.5 (October 14, 2026), yyjson 0.13.0 (September 8), and Sonic 1.15.4 (September 11). On October 31, live metadata identified **simdjson 5.1.0, published October 30**; its large-integer builder and long-exponent fixes extend the validation corpus. [IO31002](https://api.github.com/repos/simdjson/simdjson/releases/latest) Availability is not proof of superiority or compatibility with a pinned target.

## October 31: practical next comparisons

These priorities are research choices, not newly measured winners. Establish the actual current implementation, then change one cost center at a time. The [dated review](../research/2026-10-31-stack-expansion.md) and [complete plans](research-test-queue.md) carry the protocols.

| Observed problem | First comparison to consider | Constraint that can reject it |
|---|---|---|
| Unattributed CPU, allocation or wait time | Calibrated samply/Scalene/async-profiler or explicit resource counters; TypeCraft and OmniProfiler as deeper research | Missing symbols, instrumentation perturbation, unsupported language/platform or inaccurate attribution. [EV31001](https://github.com/mstange/samply) · [RT31021](https://github.com/plasma-umass/scalene) · [RT31023](https://github.com/async-profiler/async-profiler) · [EV31012](https://www.usenix.org/system/files/osdi26-li-zecheng.pdf) · [EV31014](https://www.usenix.org/system/files/osdi26-hu-yigong.pdf) |
| Foreground stalls during CPU/file work | Bounded admission, owned buffers and separate CPU/I/O pools | Task count alone does not cap bytes; cancellation must reconcile already-running effects. [RT31010](https://github.com/piscinajs/piscina) · [IO31012](https://docs.rs/tokio/latest/tokio/task/fn.spawn_blocking.html) · [IO31014](https://docs.rs/rayon/latest/rayon/struct.ThreadPoolBuilder.html) |
| Slow rebuilds | sccache with invalidation tests; mold/Wild with the current linker as control | Wild has no incremental linking yet; mold 3's rewrite is not a documented speedup over 2.42.1. [RT31001](https://github.com/rui314/mold/releases/tag/v3.0.0) · [RT31003](https://github.com/wild-linker/wild/releases/tag/0.11.0) · [RT31005](https://github.com/mozilla/sccache/releases/tag/v0.19.0) |
| Long main-thread work or offscreen layout | Chunked yielding, content-visibility, then a separately tested virtualization/state strategy | Retain complete results, accessibility, search, focus and memory budgets. [RT31012](https://wicg.github.io/scheduling-apis/) · [RT31014](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility) |
| Image/asset pipeline saturation | libvips, fastgltf and independently pinned texture/animation steps | Preserve color/alpha, glTF extensions, topology, skinning, warnings and full frame delivery. [GP31022](https://github.com/libvips/libvips/releases/tag/v8.18.7) · [GP31016](https://github.com/spnda/fastgltf/releases/tag/v0.9.1) · [GP31018](https://github.com/guillaumeblanc/ozz-animation/releases/tag/0.17.0) · [GP31020](https://github.com/KhronosGroup/KTX-Software/releases/tag/v4.4.2) |
| Allocator or compression dominates a complete journey | mimalloc versus current allocator; LZ4/libdeflate versus a format-compatible control | Whole-process memory, thread/ABI behavior, total I/O and unchanged durable output outrank a kernel chart. [IO31010](https://github.com/microsoft/mimalloc) · [IO31023](https://github.com/lz4/lz4/blob/v1.10.0/README.md) · [IO31025](https://github.com/ebiggers/libdeflate/blob/v1.26/README.md) |
| Repeated join materialization or vector I/O | Tessera or RaBitQ-SSD as workload-specific research | Current-engine baseline, skew, complete build cost and matched measured recall are mandatory. [IO31039](https://arxiv.org/html/2610.40620v1) · [IO31044](https://arxiv.org/html/2610.02652v1) |

Do not select the newest timestamp blindly: Node 26.13.0's LTS transition contains no new code, TypeScript 7.1 is beta, KTX 5 is RC, and DuckDB 2 files introduce a downgrade boundary. A stable version's publication and a current documentation page are different evidence. [RT31032](https://nodejs.org/en/blog/release/v26.13.0) · [RT31036](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/) · [GP31021](https://github.com/KhronosGroup/KTX-Software/releases/tag/v5.0.0-rc2) · [IO31052](https://duckdb.org/2026/10/21/announcing-duckdb-200)

## Always use these decision rules

1. Define supported inputs, exact outputs, warnings, security boundaries and failure behavior before benchmarking.
2. Measure the whole user operation as well as the suspected kernel; include integration/serialization/FFI costs.
3. Retain raw samples, revisions, flags, workload hashes and failed trials. Say what was not measured.
4. Require a meaningful improvement and an explicit memory/responsiveness/cancellation budget.
5. Treat vendor “fastest,” paper “state of the art” and GitHub stars as leads, not acceptance.
6. Check provenance, license, maintenance status and runtime compatibility before adoption.

## Avoid these patterns

- Lossy number conversions, missing diagnostics or weaker validation presented as optimization.
- Multiplying workers while one large subtree or global lock remains serial.
- Benchmarking only the fields a lazy parser happened to touch while promising full validation.
- Disabling durability, path checks or sandboxing to win a timing chart.
- Claiming a paper was reproduced after only reading its abstract or running a toy analogue.
- Treating unavailable Codeberg content as evidence against a project, or claiming it was reviewed.

## Simulation and spatial workloads

[Simulation and spatial methods](simulation-and-spatial-methods.md) adds current Bevy/Jolt constraints and an original measured grid-versus-exhaustive experiment, including cases where the grid loses.

## Best coding and release evidence

[Code-quality evidence](code-quality-and-evidence.md) ranks verification methods and reviews current modernization, secure-code, reviewer-evaluation and provenance research.

## Worker transport and ownership

[Worker transport guidance](worker-transport-and-ownership.md) and its measured Node roundtrip lab distinguish sender-preserving copies from exclusive ownership transfer and cross-process API limitations.

## Query-shaped indexes, measured costs

[SQLite index decisions](sqlite-index-decisions.md) and the local paired-query lab retain complete results while measuring read gains, write regressions, build cost and allocated database pages.

## Promotion rule

**Candidate → locally measured → target-validated → recommended default for that target.** A result can move backward when a counterexample appears. These recommendations are a current shortlist, not a blanket migration command. Contributions should attach a falsifying case as readily as a speed win.
