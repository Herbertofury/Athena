# Research roadmap

## Established foundation

Conditional stack selection; measurement/equivalence contract; bounded file pipelines; desktop process boundaries; version-aware mod development; asset/native acceptance; security/release discipline; source and benchmark validation tools.

## Next deep investigations (not yet completed)

- Windows storage/metadata costs, archive central-directory reuse and safe parallel scanning.
- Worker-count sweeps at 4/8/16/32/64 with memory, IO and input-latency constraints.
- Rust/native boundaries, IPC serialization and shared immutable indexes.
- Modern desktop runtimes: stable releases versus prereleases on the same workload.
- Incremental computation, reliable invalidation and crash-safe journals.
- JVM profiling and game-version-specific mod APIs; Sims package/runtime research.
- Graphics/frame pacing, native asset pipelines, animation/export correctness.
- Database/search indexing, large catalog interaction, accessibility and localization.
- Local AI/tooling evaluation, privacy, model quality/cost and reproducibility.
- Supply-chain provenance, dependency updates, sandboxing and secure integrations.

Each investigation needs a decision record, primary sources, representative workload and rejected alternatives. This is a living backlog, not a promise that every topic is already researched or that one stack wins them all.

## October 31 research completed; execution remains planned

The [October 31 synthesis](../research/2026-10-31-stack-expansion.md) adds 68 reviewed candidates and 14 paper records, including two explicitly limited reviews. The catalog now exposes 38 complete comparison proposals. This completes a source-research expansion, not the application experiments listed above.

The next tractable execution sequence is: calibrate diagnostics; establish complete output and cancellation contracts; sweep bounded CPU/I/O admission; compare parsing/representations and memory costs; validate build cache/linker changes; then evaluate UI scheduling and asset pipelines on target workloads. Specialized GPU, compiler and storage papers remain gated by artifact, platform and fidelity prerequisites. Use the [existing test queue](research-test-queue.md) and retain failed attempts.
