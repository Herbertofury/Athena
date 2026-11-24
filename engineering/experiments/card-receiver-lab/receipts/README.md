# Complete-input validation receipts, not transformed-result transport

Measured 2026-10-28. This isolated candidate is limited to identity-preserving validation. The main thread already owns all generated records and keeps them unchanged. Both worker lanes receive and validate every record, complete deterministic metadata, exact encoded byte length and SHA-256. The clone baseline returns the full graph; the receipt candidate returns exact dimensions, byte length, digest and explicit successful-validation identity. The caller checks the receipt and unique request ID, retains the original complete records and independently compares their serialized content with the original after timing. Nothing is sampled or silently dropped.

This is not suitable for a worker that produces new records, transformations or provider content. It would be incorrect to replace those outputs with an input receipt. Do not generalize this optimization to adapters or other projects without an actual target comparison.

## Real browser observations

Harness atlas-complete-receiver-v6-late-guard; loaded script receiver.7bbd271ef8a6a760.js. Eight served assets matched exact SHA-256 values. Two runs per payload size, three alternating pairs each, retain 24 full samples with complete parity and scheduling gates. Reopening the page between passes is not a cold-cache claim. New worker startup and full input cloning remain inside both lanes' request duration.

| Metadata per record, 200 records | Clone / receipt median, pass 1 | Clone / receipt median, pass 2 |
|---|---:|---:|
| 8 KiB | 215.0 / 122.7 ms | 74.4 / 59.5 ms |
| 64 KiB | 296.2 / 302.5 ms | 285.9 / 203.6 ms |

Smaller cases favored the receipt in both observations; dense direction still changed. All regressions and raw frame gaps remain in the receipts. This is not a stable universal speedup, causal comparison against the earlier transfer runs, INP, physical paint or measured heap/RSS. No default promotion.

## Cancellation and failure retention

Actual receipt-mode cancellation interrupted the first worker with zero accepted samples. The completed download before and after cancellation remained identical: 7,211 bytes, SHA-256 `8544ffdde55ee2cad1daa3f455d11aef9a58451e95de5cf942291bbf3b910a0f`. Because the first lane is clone, this is workflow cancellation evidence, not proof that a receipt-specific worker message was interrupted. A fresh dense run recovered with six complete samples. All raw cancellation/recovery data is retained.

Generated tests use the actual worker and client functions: complete data must validate before a receipt exists; bad metadata fails; wrong digest/dimensions/truthy success fail acceptance; stale request IDs are ignored; cancellation and synchronous post failures terminate and clear the worker without fallback. A generated late-callback fixture exposed continued payload consumption after settlement. The new settled guard reduces those reads from one to zero before any decoding; this is a fixture, not a measured real-browser late-message outage. The old source commits and failed evidence remain intact.

Local full suites passed: 136 Node tests and 84 Python tests. CI and the served-asset receipt are separate evidence gates. Working card/media applications, provider adapters, storage and all other projects remain unchanged. Remaining gates include larger repeatability, actual input latency and memory, and a justified integration workload rather than synthetic results alone.
