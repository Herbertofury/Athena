# Retain complete project JSON without a redundant raw-buffer copy

2026-10-28. Actual Atlas baseline: commit `863506c125d4eeee4aa3e5f9efe1ecd17013b547`, `modrinth::parse_project_record`. This is a bounded ownership improvement in Atlas, not a recommendation to another project or a language ranking.

## Actual implementation

The HTTP client already owns its response Vec, and the archive reader already owns a String from SQLite. Both previously borrowed those bytes into a constructor that copied the entire payload to a second owned buffer. `parse_project_record_owned` now consumes the existing buffer, runs the same request binding, size, JSON and project validation, and transfers it through checked `String::from_utf8`. The read path uses the equally owning `String::into_bytes` conversion. No unchecked UTF-8, lossy conversion, skipped field, cache or schema change is introduced. The borrowed constructor remains available for callers that must keep their input.

Primary source OWNED01: [Rust 1.99.1 String conversions](https://doc.rust-lang.org/std/string/struct.String.html#method.from_utf8). Checked conversion reuses the Vec rather than copying its bytes. The inverse is `into_bytes`. The existing stable standard-library method is a better fit for this ownership problem than adding a new parser or unsafe shortcut; this is a scoped design choice, not proof that Rust is universally best.

## Equal-data evidence

Three retained public Modrinth responses (Sodium, Iris and Lithium) and a clearly generated 1.5 MiB stress record were compared using the actual old constructor and the new one. Eight alternating allocation pairs per input preserve every original byte, every typed field and unknown raw values. Every owned result reuses its incoming allocation. Every post-drop requested-live delta is zero and the counter reports no accounting error. The counter is reused from the existing version-validation study, not a new allocator implementation.

For each public input the candidate performs exactly one fewer allocation and requests exactly one payload-length fewer bytes: 12,840 / 7,267 / 6,200 bytes. Requested peak deltas improve by less than that for the public records because typed-field parsing has its own earlier peak. The generated case eliminates an additional 1,500,188-byte copy. Incoming buffers were already allocated before measurement in both lanes: these deltas exclude those inputs and are not total memory, RSS, native allocations or physical peak claims. See the `*-allocations.json` raw receipts; their adapter hashes identify the pre-wiring candidate checkpoint.

A separate uninstrumented executable used eight warmup plus 32 measured alternating pairs per input. Median validation/envelope nanoseconds, borrowed versus owned: Sodium 21,743.5 / 20,714.5; Iris 15,718 / 15,765; Lithium 13,204.5 / 12,683.5; generated stress 407,471 / 267,469.5. The tiny Iris regression is retained. These are microsecond component timings, not full collection, SQLite, durable-write or UI latency. Allocation elimination is established; uniform speedup is not.

## Correctness and integration gates

Three new integration tests verify allocation identity, exact bytes, Unicode/String ownership and identical rejection messages for wrong request identities, invalid IDs, malformed/nonobject JSON, invalid UTF-8, missing title and oversized input. Full regression: 97 Rust unit tests, five persistence tests and three new ownership tests; strict Clippy passed. The existing 73 actual loopback read/security checks and eight JavaScript reader checks also passed against the rebuilt application, including retained public byte identity, corrupt/oversized read refusal, exact generation strings and compiled UI assets. No accepted provider request was submitted.

The write schema, FULL durability configuration and transaction boundaries are unchanged. No power-loss, network throughput, authenticated collection, native GUI or other-project improvement is claimed. The failed initial test command used an incorrect log-output directory and did not run tests; that error is retained separately rather than counted as validation. Original fixtures and databases remain private. Working borrowed API and prior source commits remain available for rollback.

## Spare-capacity stabilization and final evidence

The first ownership-only draft could retain excess network-buffer capacity after the old copy would have discarded it. Its preliminary receipts are kept, with their exact [adapter checkpoint](pre-wiring-adapter.rs), [allocation harness](preliminary-allocation-harness.rs) and [timing harness](preliminary-timing-harness.rs). Their allocation deltas did not establish equal steady retained capacity. This was found during source/lifecycle review before publication, not concealed as a general memory win.

The final constructor discards excess capacity through the standard owned boxed-slice conversion after unchanged validation. Exact-capacity inputs still transfer directly; spare-capacity inputs may reallocate. A dedicated unit test checks the final payload capacity equals its byte length for exact, +64 and +65,536-byte spare buffers. No unsafe conversion or truncated data is used.

The [final raw comparisons and summary](final/summary.json) cover all four inputs with both exact and double-length incoming capacities: 64 allocation pairs and 256 measured timing pairs, plus warmups. The refined allocation comparison drops the old caller buffer before measuring final retention. Final retained-record requested bytes match exactly in every pair, all complete outputs match, and post-drop deltas remain zero. With exact capacities, one full-payload allocation is avoided. With spare capacities, total requested bytes can tie the original path because shrinking is counted; lower requested peak deltas do not prove native allocator or RSS peaks. Incoming buffers remain excluded from the delta, explicitly.

Final real-response median component times (borrowed / owned, microseconds) were 21.880 / 21.249, 16.375 / 16.078 and 13.278 / 12.624 for exact inputs, and 24.474 / 21.664, 16.481 / 16.165 and 12.909 / 12.578 for spare inputs. The earlier slight Iris regression remains in its original receipt, rather than being erased by the later run. Generated stress results are separate. These small local component differences are not a full-app speed promise.

Final regression includes 98 Rust unit tests, five persistence tests and three ownership integration tests, strict Clippy, plus a second 73-check real HTTP and eight-check JavaScript reader pass against the final binary. The reused queue/coordinator regression is fixture-fed, not fresh provider success; last-good persistence and compact receipts remain checked. Schemas, durable-write policy, access controls and all original response bytes remain unchanged.

Primary source OWNED02: [Vec::into_boxed_slice capacity contract](https://doc.rust-lang.org/std/vec/struct.Vec.html#method.into_boxed_slice), Rust 1.99.1, checked 2026-10-28. Discarding excess capacity may reallocate; it is not universally free.
