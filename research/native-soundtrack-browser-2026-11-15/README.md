# Browser-to-native soundtrack acceptance

This extends the existing Windows/Linux Chromium → Python loopback bridge → Rust SQLite acceptance harness, not the runtime or public manifest. All labels/URLs/database records are synthetic; source repositories and user databases are untouched.

The new check uses the existing UI to save bookmarks in two rooms, checks exact stored Unicode labels through real HTTP reads, makes a concurrent same-origin assignment, then proves the UI refuses a stale save while retaining the typed draft. The new clear endpoint is exercised through actual browser `fetch`: stale token rejected with unchanged database bytes, current-token scoped removal, unrelated room unchanged, and idempotent clear with no file changes. A real bridge stop/relaunch then verifies both removed and retained records. UI refresh shows the cleared state without discarding the draft.

External requests are blocked and recorded; this workflow must add none. No autoplay attributes are permitted and all present media elements must remain paused. This is explicitly **not** provider playback, sign-in, original MusicHub visual parity, packaged installer or owner-device acceptance. Clearing currently uses the documented endpoint, not a new UI button.

Local `node --check scripts/test_foundry_native_browser.mjs` passes. No attempt was made to retry the previously denied local browser sandbox. Actual Chromium acceptance is gated by the associated hosted Windows/Linux CI results; syntax validation alone is not execution evidence. The existing workflow retains `browser-results/foundry-native/report.json` and screenshots, including failures. A green final report must contain the named new check rather than merely an older harness result.

## Retained first hosted failure

Run43700524080 failed this new check on both OS after the UI had saved the first bookmark: the harness encoded room-ID colons as `%3A`, whereas the existing native API accepts canonical literal-colon IDs. The GET returned400 and the helper attempted to parse an empty error response. The test now validates IDs against that existing route grammar and uses the canonical path; server validation was not loosened. The original run/artifacts remain evidence, and a new exact-head Windows/Linux execution is required.
