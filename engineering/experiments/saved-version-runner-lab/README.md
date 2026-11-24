# Saved-record experimentation in the local queue

2026-10-27. The local Rust prototype now runs the fixed version-validation
comparison on an existing saved record. No arbitrary executable, network fetch,
source rewrite, credential or automatic promotion is enabled by this action.

## Implemented workflow

Collect public version metadata with the existing `collect-modrinth-versions`
CLI into the same database, start `serve`, and use **Saved version validation**
in Experiments. The queue accepts one canonical version ID, not a path or URL.
The worker selects one stored generation once, verifies its identity, and freezes
its exact payload for the run. This does not attest live freshness or authenticate
the provenance of a manually edited database.

The operation has a 256 KiB source limit, four warmup pairs, up to 20 measured
pairs of 100 complete parses, 10,000 bounded generated stress variations and a
cooperative 15-second budget. Oversized records are rejected for this experiment,
not truncated or deleted. The collector retains its separate 2 MiB response limit.

Source SHA-256, exact generation string, baseline/candidate/validator source
fingerprints and measurement-harness identity accompany the results. Build
identity records the actual compiler, target, profile, optimization level,
opaque compiler-flag fingerprint and Cargo.lock hash. CI explicitly selects
Rust 1.99.1. These fingerprints do not prove identical CPUs or isolated host load.
The source/flag hashes contain no raw credentials or compiler paths.

## Failure and compatibility behavior

Raw strategy samples retain iteration counts when interruption occurs between
or inside samples; an incomplete pair is not invented. A new optional correctness
failure count makes an early mismatch a stabilization decision even with zero
complete timing pairs. It defaults to zero for existing evidence and is omitted
when zero. Old evidence remains readable. Repair lineage now also requires the
same declared environment identity. Existing source and databases remain retained;
older binaries need not understand newly added job variants or failure fields.

Missing or misbound snapshots fail explicitly without starting a pretend empty
experiment. Readback checks reject a stored payload whose identity differs from
its lookup key. Job inputs reject extra fields. The original default version
parser is unchanged; the fixed-slot strategy is called only by the experiment.

Peak process memory and per-strategy cancellation acceptance remain unmeasured
in this service run, so completed execution still yields an incomplete promotion
gate. Requested-allocation observations from a separate instrumented experiment
are not silently substituted for those missing measurements.

## Verified evidence

- Final loopback verification: 47 checks, including same-origin/Host guards,
  unknown commands/fields, body and ID bounds, exact served UI bytes, source and
  compiled-harness identities, successful execution and journal persistence.
- The retained real public Sodium version completed 20 timing pairs and 10,000
  generated stress cases with complete-output equality. Runner elapsed time was
  184 ms on this host; this is not network, GUI or whole-app latency.
- A separate, explicitly generated larger cancellation fixture retained its
  partial warmup sample. The preceding completed record, snapshots and collection
  attempts were unchanged. Both journal entries and SQLite integrity survived
  graceful shutdown.
- All 23 existing identifier-runner HTTP checks passed again.
- Local checks: 73 Rust unit tests, four persistence integration tests, four
  candidate-example tests, 48 Node tests and 53 Python tests, plus formatting and
  clippy. Static DOM targets are present, but native-browser visual/input QA for
  the local interface remains unverified.

The first HTTP check failed because the test converted case-insensitive header
names into a case-sensitive dictionary. Its failed receipt remains; the test was
corrected and rerun. This was not evidence that the server lacked no-store.
Earlier intermediate receipts are not pooled into the final pass.

## Dependency review

SHA01 supplies standard SHA-256 provenance, not authentication. sha2 0.11.1 and
its required new packages were added without upgrading existing locked versions.
The earlier studies retain their old lock fingerprints and are not pooled with
this service run. AUDIT01 matched the resulting 185-dependency lock against
RustSec database 3279c99911354c400e1d41e47c7d60e39258b147: no known vulnerability
matches or warnings were reported. This is not a complete code-security audit,
malware scan, zero-day guarantee or binary-content scan.

Run verify_http.py with an explicit built binary, an authorized seed database,
a saved version ID and a NEW output directory. It preserves logs, receipts and
its copied test database; no prior evidence is overwritten. Full provider text
and local databases are not included in the public repository.
