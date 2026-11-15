# Native project continuity

## Implemented slice

Athena's `#continuity` route is a native workspace using the shared navigation,
search and local workspace persistence. Users create source-attributed decisions,
next actions, resources and blockers, revise them without losing prior revisions,
pin, ignore/restore, search historical sources, and export local JSON backups.
No embedded app, duplicate product branding, provider traffic, credentials,
browser-session import, approval execution, or remote synchronization is included.
A source link is a claim's provenance, not a truth certificate. Missing notes never
imply completed work. Explicit save failure is shown and the draft stays exportable.
Data is per-browser, subject to quota and a 240,000-character workspace budget;
this is not the full-scale SQLite continuity store. Private notes are not published.

## Source inventory and remaining acceptance

Public source reviewed: [Project-Constellation at 82cea484](https://github.com/Herbertofury/Project-Constellation/tree/82cea48448219c57fad8e0c22e986c8f56913286), version 0.16.1.
The source remains intact. This slice is newly written Athena code implementing
its project-memory/revision/policy concepts, not a wholesale extension copy.
No root LICENSE was found in that source; do not infer third-party reuse rights.

| Capability | Athena status / remaining gate |
| --- | --- |
| Project decisions/actions with provenance and pin/ignore history | Native manual-entry slice implemented; no source dataset imported |
| Immutable output revisions | Native note revision history; complete artifact/media revision parity pending |
| Full-text indexing, project brain, continuity export | Native substring search and JSON export; indexed search, bounded synthesis and restore/import pending |
| Mounted chat capture across provider adapters | Not ported; maintain browser-scoped, explicit consent and private-data boundaries |
| Output Vault, artifact files and rich reader | Not ported; reconcile media/files with existing Athena workflows |
| Tab state, execution pulse and reliability supervisor | Not ported; do not infer completion from idle or missing signal |
| Recovery checkpoints, deduplicated continuation, uncertain effects | Not ported; require installed-browser and restart testing, explicit opt-in |
| Approval automation | Not imported; no privilege expansion or approval bypass |
| Google Drive/GitHub sync | Not imported; requires authorized scopes, conflict/replay and remote round-trip tests |
| Extension identity, browser grants and installation | Existing source remains authoritative until a separately accepted transition |
| Source history, releases, wiki and open issue reconciliation | Pending; #19 PC Bridge and #48 release gates remain; #40/#43 watchdog state untouched |

## Tests and retirement

`node --test tests/continuity.test.cjs` covers immutable history, restore from
serialized state, search, duplicates, invalid URLs and budgets. Browser tests must
also exercise the final route, save/reload, revision, ignore/restore and navigation.
This first slice **does not certify source-repository deletion readiness** or full
Constellation migration. Preserve source/history, owner data and all existing grants.
Modding-Knowledge remains the separate shared public data repository.

Local verification: all 278 Node contract tests passed. Chromium launch is blocked
by the local executor socket sandbox; the real-browser test is retained for CI.
