<!-- Athena managed engineering page. Original source and revision are retained in migration/engineering-atlas. -->
[← Atlas home](https://github.com/Herbertofury/Athena/wiki/Engineering-Home) · [Canonical source](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/roadmap.md)

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
