# Truthful initial player-readiness deadline

October 29, 2026. Baseline media workbench from Atlas `acea8481b1345903fef43f28325a119de759ab8e`.

Inventory reused the existing native/HLS and official YouTube player paths. Their library loaders already had deadlines, but an attached player that never became ready could leave “Loading selected player” visible indefinitely. Library availability, player readiness and actual playback are separate observations.

The workbench now reports **readiness not verified** after a cooperative 30-second initial deadline. It preserves source metadata and permits explicit retry. This status does not claim failure, readiness or playback and does not terminate an eventually successful stream. A later actual ready event updates the status normally. Native errors, fatal HLS errors, YouTube errors, loader rejection, selection changes and cleanup clear the timer. Generation checks prevent an old deadline or callback from overwriting a newer selection. No automatic Play call, provider request retry, library upgrade or authentication change is introduced; autoplay stays off.

Three controlled-clock regression tests failed baseline. Seven tests now execute the actual `addVideo` function with minimal DOM/native/HLS/YouTube fixtures: timeout status, late native readiness, stale selection, native error, official-player readiness without play, stale official callback, fatal HLS error and library failure (some checks share a test). Existing HLS event-envelope tests retain their original assertions with an explicit timer stub for the new callback dependency.

All 221 Node and 227 Python tests pass, and generated content-addressed assets match their sources. The new identity is `atlas-real-media-v13-player-ready-deadline`; the pinned HLS 1.7.3 bundle, five real-public card records and other media modules remain unchanged. Older hashed assets are retained.

**Not verified in this pass:** a loaded browser window, real initial-player timeout, actual source playback or input/paint/scroll performance. Browser runtime access is blocked. Existing playback receipts remain historical evidence for their recorded harnesses and are not relabeled as v13 acceptance. HTTP-served assets and deployment are checked separately after publication.

Run `node --test tests/player-ready-timeout.test.mjs` and `python3 scripts/build_media_lab.py --check` from the repository root. [Verification](verification.json) records source identities and scope. Raw baseline failures and local execution logs are retained. No cross-project recommendation is made.
