# Worker transport: rank the whole boundary, preserve ownership

**Reviewed October 26, 2026.** Actual Node 24.22.1 worker-thread measurements accompany this guide. They are not measurements of Electron utility processes, browser renderers, Rust service IPC or an application.

## Best fit by contract

| Contract | Evaluate first | Alternative | Avoid |
|---|---|---|---|
| Large typed payload; caller must retain its original buffer | **Copy once, transfer the copy, transfer the result back** in the tested Node boundary | Structured clone for simpler ownership semantics | Transferring the caller's shared original |
| Exclusively owned payload; sender may relinquish every alias | **Ownership transfer** as a candidate | Clone if ownership cannot be proved | Calling detachment a harmless implementation detail |
| Small control messages | **Simple structured data and a measured baseline** | Existing JSON protocol if interoperability needs it | A complex binary/shared-memory protocol without an end-to-end win |
| Cross-language/external protocol | **Explicit schema, numeric/Unicode policy and compatibility tests** | Binary formats after versioned migration tests | Inferring support from Node's worker API |
| Concurrent shared state | **Clear ownership first** | Shared memory only with a proved synchronization/lifetime design | Calling SharedArrayBuffer a drop-in transfer optimization |

The measured sender-preserving paths ranked copy-plus-transfer ahead of structured clone, with JSON roundtrip slower, on this generated payload set. The exclusively owned path is a different contract and must not be blended into that ranking. It was not consistently fastest in this noisy run.

## Current documented boundaries

Node's worker-thread API supports transferable ArrayBuffers; transfer detaches the sender and all views sharing that buffer. Structured cloning can preserve types such as BigInt that ordinary JSON does not encode. SharedArrayBuffers have different sharing semantics and cannot be put in a transfer list. These contracts were checked against the **24.22.1 documentation**, matching the tested runtime, rather than assuming the current 26.x page is identical. [N02](https://nodejs.org/docs/latest-v24.x/api/worker_threads.html)

Electron's `utilityProcess.postMessage` documents a transfer list of **MessagePortMain** objects. That is not the same contract as Node worker ArrayBuffer transfer. Verify the exact API at each hop; a worker-thread result is not proof of zero-copy transport across a process/native boundary. [E02](https://www.electronjs.org/docs/latest/api/utility-process)

## What the local test actually does

The [transport lab](../experiments/worker-transport-lab/README.md) sends generated Uint32 payloads of 4 KiB, 256 KiB and 4 MiB to one persistent worker. The worker calculates the same numeric sum and returns the complete payload. Four paths are measured: structured clone, copy-plus-transfer, exclusive ownership transfer, and a JSON array/string protocol. JSON encoding, parsing and conversion back to Uint32 are inside its measured roundtrip. Copy-plus-transfer includes the protective copy inside timing.

All returned payload hashes, sums and retained-original hashes are checked. Exclusive ownership transfer deliberately prepares its owned input before timing, then proves that input is detached; it is clearly separated from sender-preserving comparisons. Worker startup, peak memory and application responsiveness are not measured. No runtime/security settings are changed.

## Integration checklist

1. Profile serialization, queueing, worker computation and response handling separately, then measure the entire operation.
2. Declare who owns each buffer at every boundary. Enumerate aliases and retained views before transfer.
3. Bound outstanding messages and bytes. A fast transport can still create unbounded memory pressure.
4. Preserve order, correlation IDs, cancellation, errors and restart behavior. Do not drop stale responses without preserving the required final result/error state.
5. Keep schemas/versioning explicit across languages; test integer range, empty buffers, malformed payloads and partial failures.
6. Benchmark representative payload sizes. Do not spread a 4 MiB result to tiny UI messages or assume transfer is always faster.
7. Verify the installed app's actual runtime and bridge. Do not replace its architecture solely to fit a microbenchmark.

**Always use explicit ownership and end-to-end evidence. Avoid universal “zero-copy means free” claims.**
