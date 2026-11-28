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
| Immutable output revisions | Native note revision history and bounded opaque local file journal; rich artifact/media reader parity pending |
| Full-text indexing, project brain, continuity export | Native substring search and JSON export; indexed search and bounded synthesis pending; bounded additive local backup import implemented |
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


## Explicit additive local backup import

Select an exported Athena Continuity JSON file in the native workspace to add
missing notes. Identical IDs are retained once; any conflicting ID or top-level
extension metadata refuses the entire batch before saving. No incoming entry can
overwrite an existing revision, policy or dependency. Unknown fields are retained.
Schema1 imports upgrade through the existing validator. This is not a Constellation
extension database importer, browser capture, remote sync or full migration.

Admission is strict UTF-8 JSON, up to16 MiB, nesting128 and100 total notes after
merge. These are explicit import/UI budgets, not a storage quota or truncation.
Duplicate keys, numbers that cannot round-trip as JSON without numeric change,
unsupported schemas and malformed data are refused. Larger valid collections must
remain preserved outside this import path; no records are silently dropped.

The most recent file selection wins and unmount cancels late results. The merge
uses the current mounted draft after reading. Use a single editing tab: the shared
host does not provide cross-tab compare-and-swap or external update synchronization.
Browser persistence may reject even admitted imports (including the host's250000
character settings budget); the complete admitted draft remains exportable, with
explicit unsaved wording. Do not close that page before exporting an unsaved draft.

Local contract/DOM tests pass using synthetic data. Local Chromium launch was
blocked by singleton socket EPERM, not a test pass. Browser acceptance and exact
served manifest identity must be checked in CI before delivery. No owner backup,
installed extension, provider session or source retirement was accepted here.


## Local opaque artifact revision journal

The native Continuity workspace now offers an explicitly opened browser-local
artifact journal. Select a file and choose either a new artifact or an existing
artifact before retaining a new immutable revision. Original binary bytes, name,
MIME label, timestamp, sequence and SHA-256 are retained in one IndexedDB transaction.
Identical latest bytes/name/MIME are a no-op. Parallel connections append against
the latest committed sequence rather than replacing another revision.

This newly authored shared storage module is not a second Modding-Knowledge database:
it holds private operator-selected bytes, not shared public knowledge. Existing
Foundry image/video adapters are session renderers; the Engineering snapshot archive
accepts fixed public provider records. Neither was an arbitrary local-file journal.
No source extension code, browser capture, provider credentials or sessions were copied.

Files remain opaque: no HTML/SVG execution, preview, image decode or autoplay. Each
explicit download rechecks its exact bytes against the stored hash and uses an
application/octet-stream Blob. Four prepared download links are admitted at once,
including pending reads. Finish downloads before explicitly releasing their links;
disposal releases all session links. This limit does not remove stored revisions.

Admission budgets are 8 MiB per nonempty file, 64 MiB of distinct bytes and 100
revisions. Browser quota can be lower. Failures abort the complete transaction,
including any new blob, preserving earlier committed revisions. No deletion,
eviction, truncation or automatic cleanup of user data is implemented. Hashing
and bounded cursor reads are not a measured latency or peak-memory guarantee.

Storage is origin-scoped IndexedDB, **not an encrypted vault**, tamper-proof record,
owner-authenticity proof, remote backup or native Rust/SQLite store. Same-origin
scripts and browser-profile access can read it; clearing/evicting browser storage
can lose it. SHA-256 verifies consistency of bytes, not provenance or metadata
signatures. The note JSON export does **not** contain artifact bytes. In Continuity,
open the local artifact journal and select **Export complete artifact journal** to
download a separate `.athart` backup, then store it privately. It holds filenames
and original bytes without encryption. To recover into a different profile or
origin, open its journal, choose the backup and select **Restore missing revisions**.
Restore is additive: identical revisions are skipped, conflicting or corrupt backups
are refused without changing existing entries, and repeated import is safe.

With the extracted native package, run `atlas-lab verify-continuity-artifact-backup
ARCHIVE.athart` (`atlas-lab.exe` on Windows) to check a selected file independently.
The command reads the backup without extracting or restoring it and outputs aggregate
counts, not paths or names. Pass `--include-fingerprint` only to compare the
whole-file SHA-256. A passing check is not proof of authorship or an owner-data
migration; leave originals intact until an explicit restore has been verified.
The journal remains accessible even if unrelated note JSON cannot be opened.

Local UI/hash tests and a synthetic fake-indexeddb transaction rehearsal passed;
that rehearsal is not actual browser acceptance. The hosted browser test exercises
real IndexedDB/reload/download, concurrent appends, injected quota rollback/no orphan
blobs, corruption refusal, 100-revision/64-MiB admission, and hostile HTML as inert
bytes. Require that exact candidate's hosted tests before delivery. None of this
certifies installed-provider capture, user-data migration or source retirement.


## Keeping drafts and saved workspaces separate

Continuity writes compare the last confirmed Continuity snapshot with browser
storage before writing. If a newer Continuity snapshot is detected, Athena
refuses the write and keeps the local draft exportable. Export it before
reloading. A successful note or import save retains the current Projects and
other unrelated workspace data. A failed import remains a local draft and is
not confirmation that anything was saved.

Use one editing tab. This check does not lock browser storage, synchronize
tabs, or make simultaneous reads and writes atomic. Browser quota, invalid
persisted data and unconfirmed readback do not promote a local draft to the
last confirmed save. No background sync is introduced.
