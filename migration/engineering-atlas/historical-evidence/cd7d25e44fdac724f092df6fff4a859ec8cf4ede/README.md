# Budgeted complete-data preparation

Reviewed 2026-10-28. Isolated candidate; no default or target-project change.

## Actual implementation

Reuse the existing generated card model and unchanged complete receiver. The baseline serializes the full array before encoding. The candidate serializes each full record and uses TextEncoder.encodeInto into one bounded buffer. It avoids the dataset-sized intermediate JSON string, while retaining spare capacity. A short encode throws rather than returning truncated success. Unicode, nested unknown fields and exact serialized digests are tested.

The allocation formula applies to this bounded generated model only. It is not an upper bound for arbitrary provider records. Invalid or insufficient budgets fail closed. No fields, validation, security checks or receiver work are skipped.

## Measured scope

[Summary](summary.json): three passes, 90 fresh Node 24.22.1 processes; five alternating-order pairs per workload per pass. Every sample passed full receiver validation and exact digest/byte-count parity. Each child has an 8-second CPU and 12-second wall budget; the pass has a 120-second start budget. Node's 512-MiB old-heap option is **not** a physical RSS limit. External buffers and runtime allocations remain included in process peak RSS.

For 1,000 records with 64-KiB metadata each, median preparation plus complete verification improved in all three passes: 1175.00→989.81 ms, 1042.51→852.81 ms and 1264.69→946.42 ms. Median process peak RSS fell from approximately 546,000 KiB to 495,000 KiB. Small and medium workload timing directions varied, so there is no universal winner. Retain the baseline and investigate browser behavior before integration.

These are generated Node workloads, not card visibility, input latency, browser memory, real provider data or another project's acceptance. Peak RSS includes the whole process; differences cannot be attributed solely to the encoder. Raw stdout/stderr and source fingerprints are retained privately. Public summaries exclude session identifiers and raw browser traces.

## Reproduction and safeguards

On Linux with Node installed, run `python3 experiments/budgeted-preparation-lab/run.py --output NEW_DIRECTORY`. The runner rejects malformed, incomplete, wrong-lane, nonfinite and allocation-inconsistent receipts. Tests run normally and with Python optimization; no acceptance gate relies on assert. The final runner adds explicit failure recording and receiver/baseline provenance. Earlier passes remain separate evidence, not rewritten as final-runner executions.

Sources: ENCODE01 (WHATWG Encoding encodeInto), NODERSS01 (Node process.resourceUsage, maxRSS in KiB). [Source register](../../data/source-index.json).
