# Simulation, spatial indexing and no-loss performance

**Reviewed October 26, 2026.** This page ranks methods by workload and records a measured counterexample to a common “always faster” claim. It does not recommend replacing an existing game engine without compatibility and behavior proof.

## Ranked choices by workload

| Situation | Evaluate first | Conditional alternative | Avoid |
|---|---|---|---|
| Sparse, similarly sized spatial objects | Conservative spatial partitioning | Existing broad phase or brute-force baseline for small populations | Calling a grid universally fastest |
| Dense clusters or widely varying object sizes | Existing mature broad phase; measure tree/hierarchical alternatives | A grid only after cell size and memory costs are demonstrated | Assuming fewer candidate pairs guarantees lower total cost |
| Frequently queried, rarely changed data | Explicit dependency/change summaries | Per-item checks if writes dominate or invalidation is hard | Skipping data without a correct change contract |
| Reproducible simulation/rollback | Fixed mutation ordering and validated determinism settings | Explicitly documented non-deterministic presentation-only paths | Disabling determinism to advertise a lossless speedup |
| Hidden order-dependent bugs | Seeded schedule variation plus invariant checks in tests | Static dependency/ambiguity analysis | Randomizing production behavior as a “fix” |
| Rendering upgrades with identical quality required | Matched image/temporal-quality settings and frame-time comparison | New optional quality/performance modes with clear labeling | Counting reduced visual quality as a no-loss optimization |

These are our synthesis and experiment priorities, not a benchmark ranking of complete engines.

## Current upstream evidence

**Bevy 0.20**, released October 8, 2026, adds opt-in column-level change summaries and seeded schedule randomization. Summary tracking increases mutation work, so its value depends on the read/write pattern. The same release's Solari defaults disable ReSTIR and explicitly warn about shadow-quality loss in some scenes. Therefore, an upgrade's default FPS increase cannot be assumed lossless. These are upstream statements, not locally reproduced Bevy results. [SIM01](https://bevy.org/news/bevy-0-20/)

**Jolt 5.6.0**, latest official release observed July 11, 2026. Its current architecture documentation conditions deterministic simulation on mutation order and matching code/settings. Cross-platform determinism requires the corresponding build option; broad-phase query results have separate nondeterminism caveats. Keep those contracts when evaluating threading or rollback. No Jolt benchmark or engine migration was run here. [SIM02](https://github.com/jrouwe/JoltPhysics/blob/master/Docs/Architecture.md)

The foundational NVIDIA broad-phase chapter explains spatial subdivision and its object-size/distribution considerations. It is historical algorithm background, not a new 2026 performance result or a reproduction of its GPU implementation. [SIM03](https://developer.nvidia.com/gpugems/gpugems3/part-v-physics-simulation/chapter-32-broad-phase-collision-detection-cuda)

## Our measured spatial experiment

An original Python illustration compares exhaustive pair testing with a conservative grid for **2D circles on a bounded integer lattice**. Every circle is placed into all grid cells touched by its axis-aligned bounds, candidate pairs are deduplicated, and the same exact integer overlap predicate filters both methods. This avoids floating-point disagreement within this narrow contract. Oversized cell coverage falls back to exhaustive testing rather than silently omitting collisions.

[Raw results and reproduction](../experiments/spatial-lab/README.md) include sparse, dense, mixed-radius and fallback workloads. The sparse workload deliberately contains overlaps. One hundred generated equivalence trials plus tangent, negative-coordinate, zero-radius, input-order, invalid-input and fallback tests check the illustration. This is not continuous collision detection, collision response, a production broad-phase library, a GPU test or an engine benchmark.

The first run showed the key tradeoff: the grid was much faster for sparse objects but slower for dense and mixed-radius sets. The final retained run adds guaranteed sparse overlaps and hashes its harness/implementation. Use its table rather than pooling the two runs. Publishing slower cases is part of the result, not a failure to market the method.

## Acceptance before use

1. Keep object domains and semantics fixed: dimensions, shape types, motion/swept behavior, tangency and tolerance rules.
2. Compare exact candidate completeness or final results against a reference across dense clusters, huge/small mixtures, negative coordinates and fast motion.
3. Measure construction, updates, deduplication, query time and memory together. Include deletion, teleportation and object-size changes.
4. Test deterministic replay and stable externally observable ordering where required.
5. For GPU methods, include transfers, synchronization, fallback and supported hardware. A device-only kernel chart is not a frame-time result.
6. For rendering, keep quality settings fixed and inspect motion, disocclusion, shadows and temporal stability, not only a still screenshot.

**Do not transplant this integer-only teaching implementation into floating-point gameplay and call it validated.** It rejects other domains deliberately; changing an application's supported domain would violate a no-loss migration.
