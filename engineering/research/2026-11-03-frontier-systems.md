# Frontier systems review — November 3, 2026

**Scope:** release correctness, local storage, browser transport/GPU, and agent security. This is a focused follow-on to the October 31 stack expansion, not a claim of exhaustive 2026 coverage.

## Executive decisions

1. **Keep Rust as the Atlas core; refresh the pinned stable toolchain deliberately.** The official release listing identifies Rust 1.99.1 (October 15, 2026). A newer compiler is a compatibility candidate, not an automatic speed win. Run the full Linux/Windows test and strict-lint matrix on the exact toolchain before changing the repository pin. Rust 1.98.0 added buffered primitive-integer formatting through format_into and algebraic floating-point methods. The latter deliberately permits non-associative reordering and is unsuitable where bitwise reproducibility is required. [FR110301](https://github.com/rust-lang/rust/releases/tag/1.99.1) · [Rust 1.98 release notes](https://blog.rust-lang.org/2026/08/20/Rust-1.98.0/)

2. **Treat SQLite 3.54.1 as the 3.54 trial baseline, not 3.54.0.** The 3.54.0 release reports query-planner improvements, O_TMPFILE use where supported, and Windows SRWL mutex changes; its speedtest1 result is build/workload dependent. The 3.54.1 patch fixes a heap-buffer overflow present in some 32-bit 3.54.0 builds. The WAL-reset corruption fix was already present in 3.51.3 and 3.53.0. Compare 3.54.1 against the exact currently shipped SQLite build using Atlas transaction, crash-recovery, concurrent-writer, checkpoint, and full-output suites. Keep x86 and x64 as distinct cohorts. [FR110302](https://www.sqlite.org/news.html) · [FR110303](https://www.sqlite.org/releaselog/3_54_0.html)

3. **Add WebTransport to the real-time transport evaluation set, not as a blanket WebSocket replacement.** Its streams, out-of-order delivery and unreliable datagrams can suit independent control/media channels, but it requires a secure context and HTTP/3 deployment; browser support is broad in current browsers but not universal. Build a feature-detected transport adapter with a tested fallback, reconnect/backpressure behavior and explicit datagram-loss semantics. Benchmark end-to-end latency and recovery, not just raw throughput. [FR110304](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API)

4. **Promote WebGPU kernel manifests and correctness cases into the browser-GPU test design.** Hugging Face's 207 versioned kernel packages bundle WGSL templates, interfaces, correctness cases and benchmark cases, with Fleet collecting opt-in hardware evidence. This is a strong model for reproducible kernel packaging and heterogeneous-device validation. It is not evidence that a particular kernel accelerates Atlas or a target application. Reproduce one bounded operation on at least two GPU/browser cohorts, check numerical error and fallback, then measure the full path including transfers, compilation and startup. [FR110305](https://huggingface.co/blog/webgpu-kernels)

5. **Harden agent tool execution against indirect prompt injection and delegated-credential abuse.** OWASP's Q2 roundup distinguishes incidents from research demonstrations and controlled validations; it documents ordinary collaboration/web text influencing privileged agent actions and shows how delegated identity/secret scope determines impact. Require authorization outside the model for every consequential action, provenance labels on retrieved content, least-privilege short-lived credentials, destination/egress allowlists, secret isolation from untrusted context, and immutable action logs. Model refusal is defense-in-depth, never the authorization boundary. [FR110306](https://genai.owasp.org/2026/07/08/genai-and-agentic-ai-exploit-roundup-q2-2026/)

## Candidate ranking by Atlas relevance

| Rank | Candidate | Decision | Why it matters | Gate before adoption |
|---:|---|---|---|---|
| 1 | SQLite 3.54.1 | Evaluate first | Storage engine under the Rust journal and local catalog; query-planner and platform changes | Exact-version parity, durability/recovery, concurrent access, x86/x64 and real database sizes |
| 2 | Rust 1.99.1 | Compatibility refresh | Current stable toolchain; maintainability and compiler correctness are baseline requirements | Full platform matrix, strict Clippy, reproducible builds, no dependency drift |
| 3 | OWASP agent controls | Adopt as governance requirements | Prevents untrusted content from steering privileged tools | Adversarial tests for issue/PR/web content, secrets, redirects and destination policy |
| 4 | WebTransport | Prototype behind adapter | Potential multi-stream and datagram semantics for live data/media | HTTP/3 availability, browser fallback, packet loss, reconnect and backpressure |
| 5 | WebGPU kernel manifests | Prototype one bounded kernel | Portable packaging and correctness evidence for GPU compute | Numerical parity, device diversity, startup/transfer costs and end-to-end benefit |

## Experiment protocols to add to the queue

### SQLite 3.54.1 migration comparison

- Pin the current production SQLite build and 3.54.1 by exact source ID/build flags; do not compare moving package aliases.
- Replay representative catalog/search, snapshot journal, source-index and concurrent reader/writer workloads using identical databases.
- Measure cold/warm p50/p95/p99 query latency, writes/s, checkpoint duration, peak RSS, WAL growth, fsync count where observable, and recovery time after process termination.
- Include multi-connection WAL checkpoint/write overlap, disk-full, interrupted transaction, schema migration, and backup/restore cases.
- Require byte-identical logical exports and integrity checks; retain failed/corrupt cases. Do not import the vendor speedtest1 percentage as an Atlas result.

### Rust toolchain refresh

- Build and test the exact currently pinned toolchain and 1.99.1 on Windows and Linux.
- Separate clean build, incremental build, test compile, runtime and binary-size cohorts.
- Retain compiler version, target triple, linker, flags, cache state, build resource limits and full diagnostics.
- Reject a toolchain switch if correctness, reproducibility, strict-lint or target compatibility fails, even if one compile-time metric improves.

### WebTransport transport adapter

- Keep transport selection behind a capability-tested interface; WebSocket remains the compatibility baseline.
- Test reliable ordered streams separately from unreliable datagrams; define which messages may be dropped and how state is resynchronized.
- Inject loss, reordering, server restart, network handoff, stalled consumers and backpressure.
- Measure connection setup, p50/p95/p99 delivery latency, reconnect time, memory and server resource cost under identical message traces.

### WebGPU correctness-first kernel trial

- Select one operation with a stable CPU reference and realistic input sizes.
- Record adapter/device/browser/driver, shader/package hash, compilation and warm-cache state.
- Test edge shapes, non-finite values, overflow/underflow, precision tolerances and deterministic fallback.
- Include upload/download, shader compilation, scheduling and UI responsiveness in end-to-end timings.
- Fleet/community measurements may guide device selection but remain external evidence until reproduced locally.

### Agent tool authorization tests

- Treat GitHub comments, issue/PR text, web pages, scraped posts, documents and model-generated summaries as untrusted data.
- Simulate instructions to reveal environment variables, alter repository permissions, publish private data, invoke unrelated tools or redirect output to attacker-controlled destinations.
- Enforce a policy decision outside the model before each write, credential access, network destination or irreversible action.
- Verify audit records capture principal, tool, operation, input provenance, destination, approval and outcome without logging secret values.
- Test denial, partial failure and rollback/compensation; never assume a prompt instruction or model-generated plan grants authority.

## Newer agent-security evidence: Q3 2026

The Q3 roundup, published October 8, postdates the Q2 source and should be the current incident-review starting point. It covers July 1–September 30 and groups seven entries into three connected components of an OpenAI campaign, three Anthropic incidents, and one research-demonstrated Copilot exploit family; these are not seven independent attacks. The roundup is explicitly selected, not exhaustive, and separates occurrence dates from disclosure dates. Use it to extend the regression corpus, but retain each underlying primary advisory and distinguish confirmed incidents from research demonstrations. [FR110307](https://genai.owasp.org/2026/10/08/genai-and-agentic-ai-exploit-roundup-q3-2026/)

The practical control implication is unchanged but the test corpus must be refreshed: indirect instructions from PRs/issues, collaboration data and web content; delegated identity/OAuth scope; secret-bearing tool context; and agent execution/publishing privileges all require independent policy enforcement and audit evidence.

## Evidence limits and follow-up

- This pass reviewed official release notes, official browser documentation, the primary Hugging Face article and OWASP's Q2 and newer Q3 dated roundups. It did not execute candidates, update dependencies, change runtime defaults, or claim a measured speedup.
- Rust 1.99.1 is identified from the official release listing; read its full release notes before a toolchain migration.
- SQLite 3.54.1's reported 32-bit issue does not affect 64-bit builds, but x86 remains a separate supported target and should not be silently dropped.
- WebTransport's Baseline label is not a guarantee for every browser version, enterprise proxy, network or server configuration.
- WebGPU Fleet data is opt-in external evidence; it is not a substitute for controlled local reproduction.
- OWASP's roundup is a selected set, not an exhaustive incident census. Preserve its distinction between confirmed activity, research disclosures and controlled validations.

**Next implementation sequence:** add these protocols as explicit comparison plans; run SQLite 3.54.1 and Rust 1.99.1 compatibility gates in isolated branches; implement the agent authorization regression suite before expanding autonomous tool permissions; prototype WebTransport and WebGPU only behind opt-in capability gates.
