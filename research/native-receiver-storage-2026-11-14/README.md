# Native receiver receipt recovery

Adds explicit save-last-good and restore actions to the native Athena receiver workspace, without changing archived Atlas source or receiver algorithms. No automatic storage reads/writes and no automatic runs. Stored receipts stay in this browser origin; storage can be cleared or evicted, so downloaded backups remain necessary.

The helper validates compatible harness, completed state, workload bounds, all lane/round parity and finite durations before saving. A SHA-256 envelope detects accidental alteration on restore; it is not an authenticity signature. A successful save requires exact read-back after the browser's atomic setItem. Quota/security failure does not intentionally remove previous storage. Malformed/incomplete/oversized/corrupt recovery cannot replace in-memory last-good. Navigation and newer operations discard pending async recovery completion. Historical recovered measurements are labeled historical, never new performance acceptance.

This is browser-local recovery across reload, not guaranteed disk flush, multi-device sync, trusted imported evidence, cross-tab serialization or physical power-loss survival. Source algorithms and bundled workers remain byte-exact. Tests cover roundtrip, tampering, quota, readback failure, malformed/partial/oversized receipts and unavailable storage. Hosted Chromium adds full reload and byte-identical recovery after real complete receiver runs.

Local full npm suite passes. Exact-head hosted acceptance and publication are separate gates recorded in the PR.
