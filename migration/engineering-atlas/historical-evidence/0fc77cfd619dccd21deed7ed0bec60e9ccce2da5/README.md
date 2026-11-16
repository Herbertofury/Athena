# Native cloud application acceptance

Reviewed 2026-10-28. The actual compiled Rust app ran in the cloud desktop on loopback only, against a copied public-response database. This closes the prior executor/browser loopback boundary for local UI checks, without changing network or security settings.

The browser connected to the worker, displayed prior success and failure history, opened the saved Sodium response, and downloaded exactly the 12,840 stored bytes with the displayed SHA-256. A missing canonical ID produced an explicit error; Show last verified response reopened the unchanged prior response. All five original database snapshots remained identical.

The UI queued and completed the actual built-in identifier comparison: 15 timed pairs and 10,000 generated stress cases. Its acceptance gate remained Incomplete. Successful job execution is not promotion or autonomous self-modification.

The native app's RustSec checkpoint request failed to connect and was recorded as failed. This is not a successful live upstream check. The existing data remained available. No credentials, account data or remote access were added.

[Sanitized verification summary](summary.json). Raw downloaded public JSON, database copy and experiment results are retained privately. These interaction checks do not establish card visibility, input latency, browser peak memory or authenticated-provider coverage.
