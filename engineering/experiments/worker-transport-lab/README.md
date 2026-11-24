# Node worker transport: measured local roundtrips

October 26, 2026. Node 24.22.1, V8 13.6.233.17-node.58, Linux x64. One persistent worker, 15 randomized-order rounds, two warmups per method per payload. Each result contains the complete original Uint32 payload plus the same computed sum. All returned and retained-original hashes are checked; the ownership-transfer probe also checks detachment.

## Medians in milliseconds

| Payload bytes | Structured clone | Copy + transfer | Exclusive transfer* | JSON roundtrip |
|---:|---:|---:|---:|---:|
| 4096 | 1.042 | 0.451 | 0.829 | 1.471 |
| 262144 | 4.170 | 2.412 | 1.756 | 37.841 |
| 4194304 | 47.144 | 35.732 | 38.510 | 464.838 |

*Exclusive transfer has a different ownership contract: preparing a fresh exclusive buffer is outside its timer, and sending detaches that buffer. It is not a drop-in sender-preserving comparison. Copy-plus-transfer includes copying inside its timer and retains the original. The exclusively owned route was not consistently fastest; shared-host scheduling/GC noise and computation remain in the result. No statistical significance claim is made.

The JSON path includes Array.from, stringify, transport, worker parse/sum/stringify, return transport, parent parse and Uint32 conversion. The other paths include their transport, worker sum and complete response. Result hashing is outside timing but executed after every invocation. This measures these concrete protocol implementations, not a parser-only or pure memcpy benchmark.

## Reproduce

- [Harness](run.mjs)
- [Raw samples, round orders, environment and harness hash](results-2026-10-26.json)

Run `node experiments/worker-transport-lab/run.mjs results.json` from the repository root using the recorded Node version. There are no third-party dependencies. The worker is terminated in a finally block; message waits have a 30-second timeout. This is an experiment harness, not a production queue or fault-tolerant IPC library.

Four semantic probes verify sender/alias detachment, BigInt structured cloning, ordinary JSON's unsupported BigInt encoding, and SharedArrayBuffer transfer-list rejection. The 204 measured/warmup roundtrips all verify full results. These are separate from the Python repository unit-test count.

## Limits

Generated unsigned integer arrays only; no strings, objects, images, file handles, pooled Node Buffers, cross-process hops, cancellation workload or hostile payloads. Startup, memory, main-thread interaction latency, physical CPU model/frequency and isolation were not measured. Do not project these numbers onto Windows, Electron utilityProcess, browser IPC, WASM imports or Rust sockets. [Method and ownership guidance](../../docs/worker-transport-and-ownership.md).
