# Receipt wire-decoding repair

Checked 2026-10-27. Baseline: `c42e3712b3c80064135afe4213ce69a002ff6a21`.
This changes the fixed analyst runner, not the app collector or another project.

## Reproduced failure

The runner called Python's default JSON decoder before its structural receipt
validator. Duplicate keys were silently collapsed to their final value, so a
contradictory source identity or nested parity assertion could become a seemingly
valid receipt. Non-finite constants in unknown fields were also accepted.
[Before](before.json), [after](after.json), and [reproducer](reproduce.py) retain
three generated mutations of an existing valid receipt. These are deliberately
invalid protocol fixtures, not observed upstream corruption or an attack claim.

## Implementation

The runner now uses `decode_receipt` before structural acceptance. It rejects
repeated object keys at every nesting depth, including equivalent escaped keys;
non-finite constants and floating-point overflow are rejected. Complete unknown
fields, finite numbers, Unicode and separate objects with the same field names
remain intact. The raw stdout/stderr files are written before decoding, so
rejected evidence is retained rather than rewritten. The original gate is kept
as [baseline source](baseline-gate.py).

Seven focused tests cover contradictory/equal duplicates, escaping, nested
arrays, non-finite numbers, malformed/multiple documents, complete-field parity,
all 16 retained receipts, runner wiring and CI discovery. They pass normally and
under Python optimization. All 74 Python and 78 JavaScript tests pass locally;
source checks and both content-addressed site builds pass. The CI JavaScript
command now discovers every `tests/*.test.mjs`, including the previously omitted
media-event identity test file. No existing checks were disabled.

## Bounded real-input regression

[Fresh raw results](fresh/summary.json) retain 16 successful executions of the
same already-built Rust examples, with input/binary hashes and complete record
parity: three retained public upstream responses and one explicitly generated
whitespace augmentation, repeated twice for timing and allocation. Each process
has the existing 20-second budget. All 16 old final receipts decode identically
and retain structural acceptance. This is a receipt correctness regression, not
a new parser ranking, speed claim or native card/storage acceptance.

No arbitrary executable trust, cryptographic attestation, unbounded-input safety
or new authenticated adapter coverage is established. Python's normal finite
floating-point decoding remains unchanged, including its rounding behavior.
