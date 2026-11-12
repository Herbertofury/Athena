# Bounded read-only ZIP inspection lab

Original Python experiment over owned generated immutable ZIP bytes. **Never extracts, executes or recursively opens package content.** Not a production parser, malicious-input sandbox, general ZIP compatibility result or target app upgrade. [Guide](../../docs/zip-inspection-foundations.md) · [Research note](../../research/2026-11-11-zip-inspection-foundations.md).

From `engineering`, with Python 3.12 and its zlib module:

```sh
python3 -m unittest discover -s tests -p 'test_zip_inspection.py' -v
python3 -O -m unittest discover -s tests -p 'test_zip_inspection.py' -v
python3 experiments/zip-inspection-lab/run_demo.py /tmp/athena-zip-NEW
```

Choose a nonexistent output directory. All generated archives and receipts are retained. Tests preserve `athena-synthetic-zip-*` temporary directories rather than deleting earlier evidence. The demo has no external network calls, dependencies, user archives or filesystem destinations for archive members.

## Retained evidence

- [Complete nine-case demonstration](demo-result.json), including generated archive base64, full result receipts, two small name-read controls and source hashes.
- [Initial 35-test run](initial-tests.log), which passed before independent review found an untested error-path counter omission.
- [Review finding and repair](initial-review-finding.json).
- [Final 37-test run](focused-tests.log) and [optimized-Python run](optimized-tests.log).
- [Independent review summary](review-summary.json).
- [Aggregate validation and limitations](validation-summary.json).

Supported fixture subset: ZIP32 STORE/DEFLATE, fixed ordinary contiguous records, CP437/UTF-8 names, normal files and empty stored directories. No ZIP64, descriptors, extras, comments, split volumes, encryption, links, prefixes, appended data or general feature compatibility. See the guide before interpreting refusal as corruption.

The 37 tests cover valid byte/digest parity, exact limits, metadata preflight, duplicate/portable-name conflicts, unsupported structures, dishonest counts and sizes, actual decompression limits, CRC, full stream completion, partial failure, cancellation, opaque nested ZIPs and no file I/O inside inspection. The nine demonstration scenarios are valid mixed entries, duplicate-name selection, dishonest-size selection, actual output budget, partial CRC failure, traversal, canonical-name collision, trailing-stream accounting and cooperative cancellation.

Observed output is counted even on the repaired trailing-stream rejection. One sentinel byte can exceed the selected output budget; it is not accepted as verified content. No unbounded zlib flush or full member materialization is used. The input is already in memory; process RSS, CPU deadlines and upstream acquisition remain outside these counters.

No extraction, real mod corpus, Windows/macOS execution, authentication/signature verification, universal bomb protection, performance improvement or production acceptance is claimed. Python, zlib and Unicode database versions are recorded separately from documentation versions.
