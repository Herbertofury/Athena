# 2026 papers and Codeberg-linked methods

**Initial review: October 26, 2026; expanded October 31, 2026.** Ranked by practical adoption readiness for the stated task, not by citation count or a universal quality score. Reading a paper is not reproducing it. No research prototype below was installed or executed in this pass.

## 1. Evaluate first: multidimensional runtime benchmarking

**Wasure**, submitted February 5, 2026. The paper describes configurable runtime/benchmark comparisons, repeated execution, feature checks and peak RSS/VMS collection. Its implementation targets Linux/macOS and notes limited Windows support. Best use here: borrow the experiment dimensions before making a runtime migration decision; verify the artifact and current runtime support before execution. **Evidence: paper-reviewed, not locally reproduced.** [PAPER01](https://arxiv.org/html/2602.05488v1)

Experiment to run next: one identical module corpus with expected outputs, separate compilation/instantiation/steady execution, host-call-heavy cases, memory ceilings and required feature probes. Do not hide compilation in a prebuilt cache when startup is the user-visible bottleneck.

## 2. Specialized diagnostic candidate: isolate compiler regressions

**WarpL**, ICSE 2026. Fine-grained mutation helps isolate inefficient Wasm instruction sequences. The authors report diagnosis in 10 of 12 cases, including six previously unknown issues; they also describe substantial reduction time and remaining human root-cause analysis. The [research repository](https://github.com/BZTesting/WarpL) contains prototype code and experiment data, but its API metadata did not identify a license or latest release. **Evidence: paper/repository reviewed; reproduction and reuse-license clearance pending.** [PAPER02](https://arxiv.org/html/2604.13693v1)

Use when an actual minimized runtime/compiler regression exists, not as a first-line substitute for application profiling. Do not import prototype code without checking applicable licensing. A mutation that runs faster is not automatically a semantics-preserving production fix.

## 3. Research-stage: heavy-light incremental join maintenance

**Maintaining Queries under Updates Using Heavy-Light Partitioning of the Input Relations**, submitted May 8, 2026. The paper generalizes delta queries, materialized-view trees and heavy/light partitioning for join maintenance, with asymptotic update bounds. It is not a desktop benchmark or a ready-made replacement for a local database. **Evidence: theoretical paper reviewed; no implementation/performance reproduction here.** [PAPER03](https://arxiv.org/html/2605.08397v1)

Evaluate only after profiling repeated joins with small updates. Compare against ordinary indexes and simple incremental aggregates first. Include skew, deletions, burst updates, state size and recovery; an amortized bound does not guarantee low latency for each individual update.

## Codeberg-linked engineering: inspect, do not blindly migrate

### Zig 0.17.0: useful design lessons, migration constraints

Zig's official site identifies Codeberg as its canonical repository and lists 0.17.0, released October 1, 2026. Its release notes describe separating build configuration from execution, explicit configuration dependencies and improved incremental compilation for x86_64 Linux. They also document breaking APIs and a ZLS compatibility gap. Rank it **conditional/experimental for an existing toolchain migration**, not “always replace Rust/C++.” [TOOL01](https://ziglang.org/news/migrating-from-github-to-codeberg/), [TOOL02](https://ziglang.org/download/0.17.0/release-notes.html)

The transferable hypothesis is explicit dependency tracking and explaining invalidation, not changing language for its own sake. Test delete/rename/configuration/environment changes and side effects before accepting skipped work as correct. An initial fetch failed, but later direct browser inspection verified the canonical Codeberg repository, README and current master head `cb6f0c25f176dbebf0c6801170c360c2c1198524` on October 26. This is a development revision, not proof that a master build is preferable to the pinned stable release. No full code audit or Zig build was performed.

### orjson's alternative Codeberg repository

The upstream README confirms [codeberg.org/ijl/orjson](https://codeberg.org/ijl/orjson) as an alternative repository. The [local parser lab](../experiments/json-lab/README.md) tested PyPI wheels, not a Codeberg build. Keep host provenance, tested distribution and source revision distinct. After the initial fetch failure, direct browser inspection verified the repository/README and head `bd00937c5c46ab20eb5d7fe1cfc034b906c4578f`, matching GitHub master at that observation. This establishes matching observed head identifiers, not independent wheel reproducibility or a complete source audit.

## What is deliberately not ranked as a winner

- A paper abstract alone, unreproduced benchmark screenshot, or repository marketing sentence.
- A prototype without a checked license and build/dependency review.
- A Linux result extrapolated to Windows, a CPU benchmark extrapolated to game frame pacing, or an interpreter result extrapolated to JIT/AOT mode.
- An unavailable source page. Record the access gap; do not invent its contents.

This watchlist is a first researched set, not an exhaustive survey of all 2026 papers or all hosting platforms. Broader parsing, runtime, incremental-state, graphics and security investigations remain on the [roadmap](roadmap.md).

## Representation-contract screen · 2026-10-27

[Two additional paper reviews](../research/2026-10-27-representation-contracts.md) separate approximate reconstruction and thresholded telemetry from byte-exact snapshot requirements. No research prototype was run; the generated probe tests a fidelity boundary, not runtime superiority.

## October 31 expansion: fourteen additional paper records

**Checked October 31, 2026 UTC.** Twelve full texts and two explicitly limited reviews extend the same catalog. Every record remains a research candidate; no artifact was executed and no author-reported speedup became an Atlas measurement. Publication precision and reproduction gaps remain in each record.

| Paper and primary evidence | Review depth | Useful hypothesis and adoption boundary |
|---|---|---|
| **mold: A Massively Parallel Linker** · [RT31029](https://arxiv.org/html/2608.23228v1) | Full text + artifact protocol | Parallelize eligible linker phases; the paper measures historical mold 2.42.0/lld 22.1.8, not the October Rust rewrite. Keep filesystem, RAM, warmup and failed-link conditions. |
| **ParaWeb** · [RT31031](https://arxiv.org/abs/2608.19935) | Full text; artifact unavailable | Reusable worker/GPU patterns for restricted numerical data. Count compilation and transfer; CPU Float64 and GPU f32 need declared tolerances; small reductions can lose. |
| **The Unseen Delta** · [RT31030](https://conf.researchr.org/details/issta-2026/issta-2026-research-papers/73/The-Unseen-Delta-Characterizing-the-Compiler-Optimization-Landscape-via-Top-Down-Dif) | Abstract/metadata only | Compiler-difference diagnosis lead. Full mechanism, artifact, licensing and quantitative effect remain unreviewed. |
| **The Essence of Entity Component System** · [GP31034](https://boyang.cs.uwm.edu/publication/sac2026_ECS.pdf) | Full text + artifact inspection | Use access/synchronization reasoning to design ECS tests. One Scala Tower Defense case and a representative run do not select a universally fastest ECS. |
| **Variable-Rate Texture Compression: Real-Time Rendering with JPEG** · [GP31036](https://onlinelibrary.wiley.com/doi/10.1111/cgf.70338) | Full 2026 journal text + artifact; 2025 preprint lineage | Demand-driven diffuse RGB decode. Preserve material scope and quality; one timing lane excludes CUDA/OpenGL switching, and full cache/mipmap/index memory matters. |
| **CuRast** · [GP31039](https://arxiv.org/html/2604.21749v2) | Full text + artifact inspection | Specialized opaque CUDA rasterization. Keep scene geometry/textures identical, retain unsupported transparency/platforms and measure complete frame tails. |
| **GPU View-Adaptive Crack-Free Subdivision of Bezier Surfaces** · [GP31041](https://gpuopen.com/learn/gpu-view-adaptive-subdivision/) | Author article + artifact; full PDF unread | Explore work generation and compact patches. Test supported hardware and Execute Indirect fallback separately; inspect shared edges and all runtime memory. |
| **Tessera** · [IO31039](https://arxiv.org/html/2610.40620v1) | Full text + artifact README | October 29 preprint: avoid materialized join rows before aggregation. Evaluate skew, actual queries and current engines; some paper baselines have one run. |
| **Tile-Based Decompression in Compiled GPU Engines** · [IO31042](https://arxiv.org/html/2610.32695v1) | Full text | October 23 preprint: trade decode work for reduced device-memory traffic. Published core inputs are GPU-resident; transfer and regressing queries stay visible. |
| **RaBitQ-SSD** · [IO31044](https://arxiv.org/html/2610.02652v1) | Full text + artifact constraints | October 2 preprint: RAM/disk split vector codes and pipelined reads. Compare at matched measured recall; include index build, scratch space, Linux/CPU and format constraints. |
| **RubikFS** · [IO31047](https://www.usenix.org/conference/fast26/presentation/huang) | Full text; artifact not retrieved | Read-only image layout and compression. EROFS/Linux changes, preprocessing and FEMU/QEMU evaluation constrain portability and deployment claims. |
| **TypeCraft** · [EV31012](https://www.usenix.org/system/files/osdi26-li-zecheng.pdf) | Full text | Attribute memory accesses to types/fields before layout changes. Preserve ABI/serialization; x86, DWARF and weaker C++/Go attribution limit coverage. |
| **Diagnosing Performance Issues in Application-Defined Resources** · [EV31014](https://www.usenix.org/system/files/osdi26-hu-yigong.pdf) | Full text + pinned OmniProfiler artifact README | Diagnose resource-pool/cache waits beyond CPU samples. Paper calls it gigiprofiler; LLVM 17, source documentation and configured LLM access complicate reproduction. |
| **Controlling Opaque-Component Effects with Semisolates and Try** · [EV31017](https://www.usenix.org/system/files/osdi26-lamprou.pdf) | Full text + tool documentation/release | Inspect effects of trusted commands. Not an untrusted-code sandbox; network effects remain allowed by default and selective file application is not universal atomic rollback. |

The [dated synthesis](../research/2026-10-31-stack-expansion.md) explains priorities and current release corrections. The [38-plan directory](research-test-queue.md#planned-comparison-directory) supplies the corresponding controls and rejection gates.
