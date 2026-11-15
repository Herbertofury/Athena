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
Data is per-browser, subject to the host storage quota;
this is not the full-scale SQLite continuity store. Valid larger drafts remain
exportable if durable host storage refuses a write; no guessed record-count limit
silently drops notes. Private notes are not published.

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

## Explicit evidence dependencies and reusable context

Each note can link another note at the exact revision the user reviewed. Cross-project
links retain the original source and reviewed text when later revisions arrive.
Project context includes every selected root and its transitive dependencies, with
explicit coverage counts and advisory changed/ignored/missing evidence findings.
Cycles terminate without dropping data. No shared-word inference, popularity score,
automatic authority verdict, or remote provider message is introduced.

Users can keep working/exporting despite warnings, inspect old and current evidence,
mark a newer baseline reviewed, or unlink while preserving the policy history.
Context Markdown and structured JSON are deterministic and include provenance; the
full continuity JSON still retains complete revision history. This is newly authored
Athena implementation of verified Constellation0.20.1 project-intelligence concepts.
Source semantics are deliberately improved: a newer observed revision is not treated
as proven better, and an idle/unknown conversation is never inferred completed.

Evidence baseline: reconstructed Constellation0.20.1 tree
`89b711f46672830e786ba3afcdf0d1973325a896`, not root package0.16.1. The staged0.20.2
source is incomplete and remains a separate recovery gate; no full-parity claim.

Continuity storage schema2 accepts and losslessly upgrades schema1 notes in memory;
the original stored copy is only replaced on a successful write. Exported schema2
identifies dependency-policy history explicitly. Older runtimes should retain an
unrecognized snapshot rather than overwrite it.

## Local historical evidence review

The [read-only review CLI](../../tools/continuity-review/README.md) accepts an
explicitly selected local Continuity JSON export. It shows every included note
revision, source and timestamp, changed fields, and reviewed dependency baselines
in Markdown or JSON. It reuses the native validation and context compiler; it does
not import, restore, capture, transmit or alter owner data. This is a command-line
review companion, not a new graphical workspace or full Constellation parity.
