# Retain the first actual-workshop browser failure

GitHub Actions [run 42400728455](https://github.com/Herbertofury/Athena/actions/runs/42400728455) tested exact commit `ea5eb5731a4c83011c61e0c4bfaf7ef176bfb51e` in Chromium 151.0.7922.34. Thirteen static-app checks passed, including the Media corrections, but the workshop gate failed at its first directory assertion. Rust and accessibility gates had not run when the runner stopped.

The browser had updated its URL to `#workshops` while the assertion still read the old home DOM. The subsequent failure screenshot shows all five correct workshop cards. The initial real-click path waited only for the URL; later helper paths already waited for rendered content. The two unchanged original JSON reports are retained here.

The narrow correction uses one serialized readiness predicate after real clicks, programmatic routes and Back/Forward: target hash plus the exact five unique/correctly linked cards, or the target workshop lesson DOM. All original count, content, download, interaction and receipt assertions remain. Deterministic contracts reject stale home, partial/duplicate/wrong-link directories and stale detail views, and propagate failed waits. No arbitrary sleep, skipped check, rendering-code change or security relaxation was introduced.

The corrected full browser run must pass before this release is called browser-accepted. DOM contracts are not native rendering evidence. No local browser was retried after its prior socket restriction.

Original artifact: `athena-browser-evidence`, ID `13584792996`, 4,965,676 bytes, SHA-256 `94632e5446de18be6bcc723edd96139a597b7f37384070c671d13bd38910ea50`. It contains the full failure screenshot and static reports. These fixtures contain no private account or user database.
