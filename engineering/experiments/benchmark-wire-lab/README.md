# Benchmark wire-format contradiction repair

Reviewed 2026-10-28. Scope: the actual Atlas benchmark and worker-sweep command-line input paths. All inputs here are synthetic correctness fixtures, not measured application performance.

## Reproduction and repair

At baseline `b66e2f0b2a559504d284fd9ac85dc2f924c0f137`, Python's default JSON decoder kept the last duplicate key. A candidate sample containing both `status: error` and `status: complete` was reported as complete and output-equivalent, with the fixture's apparent 2x ratio. No claim is made that historical real measurements contained such contradictions.

- [Contradictory input](evidence/contradictory-candidate.json)
- [Original comparator source](evidence/baseline-compare.py.txt)
- [Observed baseline result](evidence/baseline-result.json)
- [Observed repaired result](evidence/repaired-result.json)

Both CLIs now reuse `decode_receipt` from the existing upstream-validation laboratory. They reject duplicate keys throughout the record, escaped duplicate names, NaN/Infinity and float overflow before validating or ranking samples. Unknown finite fields stay intact. Existing comparison and resource-budget rules are unchanged.

## Verification

`tests/test_benchmark_wire.py` executes both real CLIs in normal and optimized Python. Eight malformed inputs per CLI and mode give 32 rejected executions; four valid executions preserve the synthetic 2x comparator output and smallest tied worker selection (4), explicitly not accepted in an application. The repaired valid comparator stdout is byte-identical to the saved original implementation.

Run: `python3 -m unittest discover -s tests -p test_benchmark_wire.py -v`.

This does not authenticate input hashes, certify sampling quality, protect an already-decoded dictionary from prior information loss, or establish a performance improvement. No other project's defaults or recommendations are changed.
