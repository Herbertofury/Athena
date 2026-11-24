# Native verified-audio workspace

Athena’s `#audio` route imports the retained single-public-file experiment into the native workspace lifecycle, not an iframe. Source verification, selection and event modules remain byte-exact. Metadata is dated 2026-10-29, not freshly fetched or automatically declared current.

Explicit Load requests at most the declared 153,301 bytes with credentials omitted and verifies SHA-256 before attachment. No autoplay. Metadata, readiness, trusted playing, pause, buffering and errors remain separate. Failure/cancellation retains an existing verified clip within the workspace. Navigation cancels requests, detaches/pauses the player and revokes owned blobs. Export receipts before leaving; no persistence claim.

Native lifecycle tests use labeled synthetic loader results, not real provider acceptance. Chromium acceptance uses an explicitly intercepted truncated synthetic response to confirm rejection and exports a failure receipt; it does not claim decoding or actual playing. Existing standalone audio core tests retain the validation boundary coverage.

Local full npm test passed. The official pinned Playwright Chromium download failed with truncated ZIP responses; local browser execution could not start because the executable was absent. The failure is retained separately. Hosted results must be verified for the exact published head. No source repository deletion, private data, credential use, target-project adoption or performance superiority claim.
