# Native Lab draft correctness continuation

Ports #7/#8 cancellation and request-wide archive deadlines and #10 malformed Overview count validation through Athena's native Lab generator. The shared archive reader also feeds Athena's native Audio workspace; regenerated both surfaces plus content-addressed legacy research assets. No legacy repository changes.

## Reproduction and verification

- Native Lab DOM regression reproduced loss of last-good cards for an array-valued counts map. The fix validates before cards/cache/metrics commit and recovers on a healthy response. Original nine regression tests include 10,000 generated healthy count maps.
- Stalled cancellation and abort-ignoring body-read regressions failed before the port. The baseline was interrupted after preserving failures because its pending promise did not settle; no false completion claimed.
- Candidate: 34 focused source/native tests, 321 complete Engineering JavaScript tests, and 225 Athena DOM tests pass. These counts describe tests, not native-browser acceptance.
- Initial broader test caught a stale native Audio copy; regenerated the actual dependent workspace instead of relaxing its byte-parity test. Retained failure evidence and reran successfully.
- Archive deadlines settle the caller; a permanently uncooperative underlying operation can still remain pending. No automatic retry of uncertain writes, timeout weakening, result truncation or performance superiority claim.

Hosted CI, served assets and fresh real Chromium acceptance are separate pending gates. Source preserved #9/#11 gallery compare and #6 research still require reconciliation; this port does not call them complete.

## Packaging and runtime follow-up

The public-preview packager correctly rejected stale reviewed hashes after the shared modules changed. Updated only the six affected Lab/Audio allowlist entries; packaged93 runtime files and verified92 served asset bytes against the real loopback Rust engine. Browser launch was blocked by the execution environment's process-socket restriction before page creation; no browser pass is claimed and no restriction was bypassed. Exact-head hosted Chromium remains the acceptance route.
