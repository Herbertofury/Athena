# Spatial grid versus exhaustive pairs: measured illustration

October 26, 2026. Python 3.12.14, Linux x86_64. Nine randomized-order rounds per workload, one full invocation per sample. Generated integer-lattice circles, fixed seed 20261026, exact sorted overlap-pair equality checked after every invocation. Index construction, validation, candidate deduplication and filtering are inside the grid timing. No cached inventory or partial result is substituted.

This is an original single-threaded algorithm experiment, **not Jolt, Bevy, CUDA, GPU physics or production-game acceptance**. CPU isolation, memory and frame pacing were not measured.

## Final-run medians

| Distribution | Objects | Overlaps | Exhaustive ms | Grid ms | Exhaustive / grid |
|---|---:|---:|---:|---:|---:|
| sparse_1000 | 1000 | 20 | 103.141 | 5.287 | 19.51× |
| dense_500 | 500 | 54058 | 37.277 | 159.313 | 0.23× |
| mixed_radius_500 | 500 | 9080 | 34.977 | 252.644 | 0.14× |
| huge_radius_fallback | 200 | 204 | 4.775 | 4.443 | 1.07× |

A ratio above 1 favors the grid; below 1 favors exhaustive testing. The grid loses on dense and mixed-radius workloads despite reducing the candidate set. Cell construction, membership duplication and deduplication can outweigh saved pair tests. A huge-radius case invokes an explicit exhaustive fallback, retaining every result.

The sparse scene includes twenty deliberately overlapping pairs, so its speed result is not only an empty-result shortcut. The initial exploratory scene lacked these injected overlaps; its raw results are retained locally, not pooled into this table. The final run is identified by hashes of both the harness and implementation.

## Files and reproduction

- [Raw samples, input/output hashes and round orders](results-2026-10-26.json)
- [Harness](run.py)
- [Original implementation](../../examples/spatial_grid.py)
- [Equivalence and edge-case tests](../../tests/test_spatial_grid.py)

From the repository root, run `python experiments/spatial-lab/run.py > results.json`. No third-party dependency is required. Run the full test suite with `python -m unittest discover -s tests -v`.

## Scope and limitations

Coordinates and radii must be bounded integers; radii are nonnegative. This narrow contract permits exact arithmetic in Python and is deliberately not a general floating-point collision API. Cell size is fixed at 4 for this comparison, not tuned per workload. The method rebuilds the index each invocation; incremental updates, trees, sweep-and-prune, hierarchy and GPU alternatives were not measured. Candidate storage can be quadratic in dense cases, and the per-circle cell budget is not a global memory cap. A production design needs explicit total resource budgets and cancellation without loss.

Use this result to reject the universal “spatial hashing is always faster” claim, not to infer that exhaustive search is always best for dense production physics. See [method recommendations](../../docs/simulation-and-spatial-methods.md).
