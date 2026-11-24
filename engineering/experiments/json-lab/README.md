# Measured Python JSON lab — October 26, 2026

Real local execution on generated inputs, not fake timing fixtures or a production workload. Official PyPI binary wheels were installed into an isolated temporary virtual environment. No application dependency or user installation was changed.

## Environment and protocol

CPython 3.12.14, Linux 6.18.55, x86_64; orjson 3.13.0; ujson 6.0.0. CPU model, frequency isolation and shared-host contention were not controlled, so do not extrapolate to another machine. Fifteen library-order-randomized rounds per operation, 30 iterations per sample, three warmups before each sample, GC enabled. In-process warmed timings exclude imports, startup, file IO and memory measurement. Each decode creates the complete Python value; each encode produces UTF-8 bytes. Semantic hashes are verified before timing and after every sample.

The generated corpus includes one small manifest, 2,000 nested catalog records and 10,000 finite numeric values. Input generation is outside timing. Numbers in the timing corpus fit the shared contract. Twelve additional adversarial inputs are reported separately rather than silently removed from compatibility analysis.

## Final-run medians

Milliseconds per operation; smaller is faster. No confidence interval or production-tail claim is implied.

| Workload | Operation | stdlib | orjson | ujson |
|---|---|---:|---:|---:|
| small_manifest | decode | 0.005319 | 0.001244 | 0.001641 |
| small_manifest | encode_utf8 | 0.005428 | 0.000290 | 0.002884 |
| small_manifest | decode_encode_utf8 | 0.008111 | 0.001136 | 0.003841 |
| catalog_2000 | decode | 5.446132 | 2.728550 | 3.072228 |
| catalog_2000 | encode_utf8 | 3.736651 | 0.433333 | 2.797623 |
| catalog_2000 | decode_encode_utf8 | 9.141594 | 2.831794 | 6.070959 |
| numeric_10000 | decode | 0.945062 | 0.245341 | 0.639901 |
| numeric_10000 | encode_utf8 | 2.556445 | 0.284759 | 0.919011 |
| numeric_10000 | decode_encode_utf8 | 3.620743 | 0.631562 | 1.627870 |

Observed speed order: orjson, then ujson, then stdlib in all nine cases. This is not a universal winner: adversarial results disqualify some paths for some contracts. In particular, orjson turns 18446744073709551617 into a rounded float; all three defaults collapse duplicate keys to the last value. See [ranked recommendations](../../docs/ranked-recommendations.md).

## Reproduce and inspect

- [Tested harness](run.py)
- [Pinned package versions](requirements-pinned.txt)
- [Raw samples, round orders, hashes and semantic outcomes](results-2026-10-26.json)

Create an isolated environment, install the pinned requirements from PyPI, then run `python run.py --output results.json`. The output includes its harness SHA-256. Package versions are pinned, but this is not a wheel-hash lockfile. Record wheel hashes and actual CPU/OS details for stricter cross-machine reproduction.

The first exploratory run used the same workload and timing logic before automatic date/harness-hash recording was added; it ranked the libraries in the same order. Its raw timings are retained locally rather than pooled. The final file above is the only result used in this table. No failed timing sample was discarded.

## Limits and next tests

This hand-selected corpus is insufficient for a blanket migration. Add representative licensed/redacted files, exhaustive conformance/fuzz cases, peak RSS, allocations, cold startup, downstream validation and the exact target interpreter/build. For embedded runtimes, first prove native-extension packaging/version compatibility. Define duplicate-key, Unicode and numeric policies explicitly.
