# Athena's local evidence engine

Athena's learning shell, Research explorer, Media metadata workbench and R&D Lab now share one document and navigation. The Lab uses the retained Rust/SQLite engine, not a browser-only mock or an iframe containing another app.

## Start the local app

From the repository root, with the pinned Rust toolchain and Node/Python dependencies available:

```sh
npm ci --ignore-scripts
npm run build
python3 scripts/build_engineering_workspaces.py --check
python3 scripts/build_lab_workspace.py --check
python3 scripts/package_app.py --profile public-preview --allowlist config/runtime-public-preview.json --output athena-local-package
cd engineering/apps/atlas-lab
cargo run --locked -- serve-athena /absolute/path/to/your-evidence.sqlite /absolute/path/to/athena-local-package
```

Use a new package output directory. The package step refuses unreviewed or changed runtime files. Choose a database location outside the served package. Existing compatible journal databases are reused without reset; use a separate test database for experiments you do not want in your normal journal. Open `http://127.0.0.1:41379/#lab` after the engine reports readiness. The process uses the original fixed loopback address and stops with Ctrl+C. A public static Athena page never probes or connects to localhost.

The legacy `serve` and isolated `serve-candidate` modes remain available for old evidence reproduction. Unified `serve-athena` selects the baseline overview, not the unproven candidate.

## What the native Lab retains

| Capability | Boundaries |
| --- | --- |
| Recent jobs and metrics | Exact job IDs, ephemeral engine identity, keyed rendering and last-good view survive malformed responses. The durable database is authoritative. |
| Public metadata collection | Original bounded Modrinth projection, complete project response and version-object actions. Explicit submission only; no sign-in, mod downloads or arbitrary URLs. |
| Fixed upstream checkpoints | RustSec, hls.js and serde_json only, preserving existing database request budgets and failure handling. |
| Saved JSON inspector | Original bytes, namespace, canonical ID, generation and SHA-256 checks. Inert markup, exact downloads, cancellation and last-good reopening. |
| Bounded comparisons | Original fixed deduplication and saved-version experiments, journal records, raw samples and acceptance policy. Execution is not promotion. |
| Shell lifecycle | Native scoped UI, shared theme/search, panel routing, polling/read cleanup, and a warning when a submission outcome is uncertain. Navigation does not cancel a durable job or automatically retry a POST. |

Search filters visible recent jobs only. Shared browser state retains the current panel and an uncertain-submission warning, not the provider response or SQLite database. Switching away closes an archive viewer; the complete archive remains in SQLite and can be opened again.

## Security stays local

- Existing exact Host, Origin and `X-Atlas-Request` write checks remain. No wildcard CORS, API grants, account tokens or remote bind address were added.
- A strict same-origin Content Security Policy remains. Generated workspace CSS is an external local asset, without `unsafe-inline` or `unsafe-eval` exceptions.
- Startup verifies manifest identity, canonical approved paths, byte lengths and SHA-256 hashes within bounded memory limits. Approved bytes are frozen in memory. Unknown files, database files, dotfiles, traversal paths, symlinks and unapproved file types are not a directory-serving fallback.
- A hash is an integrity identity, not proof that arbitrary code is trustworthy. Use a reviewed Athena package, not a third-party package supplied with its own manifest.
- Third-party previews and player scripts are disabled in the privileged local runtime. Media metadata and receipts remain available. Serve the public static package separately to test official players without giving third-party scripts access to the local evidence API. Autoplay remains off.
- Local request guards are not a sandbox against malicious programs already running under your operating-system account. The journal is not cryptographically tamper-proof.

## Evidence and limits

The initial local pass compiled the real engine, passed 153 Rust tests and all-target clippy, and passed 19 focused adapter/theme tests. Real loopback HTTP checks verified 31 served assets against the package manifest, rejected invalid write origins and hosts, preserved complete generated archive bytes, executed a bounded deduplication job through the actual queue and journal, and retained that job/archive after a controlled process restart.

The first local Chromium attempt could not start because its execution sandbox denied a socket operation. That failure is retained. Full browser acceptance then passed in [GitHub Actions run 42360535804](https://github.com/Herbertofury/Athena/actions/runs/42360535804), for exact repository commit `74c8191f776838edce29fc56d57c27bf46393a9a`:

- **9/9 static Chromium checks** covered real learning state, native Research catalog/filter/shortlist retention, both-theme sampled contrast, Media metadata without automatic provider requests, the public Lab's no-localhost boundary, and tested mobile layouts.
- **8/8 actual Rust-backed Chromium checks** verified the unified native Lab under strict CSP, original-byte archive dialog/download and last-good reopening, the bounded queued experiment with raw evidence, shared navigation, controlled restart reload, and final SQLite integrity/count.
- **191 Rust all-target tests** passed with zero failures, and clippy passed. This wider CI count includes example-target tests beyond the historically recorded 153-test local run.
- Chromium was `151.0.7922.34`. All 31 served runtime assets matched the verified package; no CSP violations, script errors or unexpected external requests were recorded in the tested flows. Final SQLite verification was `ok` with exactly one synthetic job.

The package SHA-256 was `e98a0d006c976761c882a5a0c2142a688f7b668570bac0ad59168bbde5b5f016`. [Retained reports, logs and exact identities](https://github.com/Herbertofury/Athena/tree/main/research/runtime-integration-2026-11-07/ci) preserve the measured scope. The original artifact is `athena-browser-evidence`, ID `13570015396`, digest `sha256:9b3c9fb000aad856db73b01f5d4fd22360210473d73b9ea02aea45d8fe1ea133`.

The optional `ATHENA_LAB_HTTP_ONLY=1` harness mode remains explicitly labeled HTTP-only. Both modes require the same final read-only integrity/count check. GitHub Pages still reports its existing setup Not Found condition with automatic enablement off, so these are actual loopback CI browser results, not verification of a deployed public site.

These tests use generated snapshots and a fixed built-in workload. They do not prove live collection on every provider, Windows correctness, crash/power-loss durability, resource/performance superiority, full Foundry integration, autonomous self-improvement, or readiness to delete Engineering Atlas. Private Foundry content is excluded.

### Explicit archived project generation

The loopback Engineering backend exposes `GET /api/project-archive/{canonical_id}/{generation}` for an explicitly selected positive integer generation. It returns the exact validated archived project JSON and existing generation/SHA-256 provenance headers. Missing or wrong-project generations return 404, invalid generation values return 400, and invalid stored payloads return 422. It never substitutes the latest record when a historical selection is missing or corrupt. The existing latest-record endpoint remains unchanged.

This is native backend/API capability, not a new graphical history selector or a completed source-repository migration. No provider request, media download, archive deletion or owner-data migration is involved. Existing loopback origin/host protections apply. SQLite fixture and handler tests verify old/new generations, preserved Unicode/unknown fields, retained failures, restart, wrong IDs, missing/invalid generations and corrupt/oversized records.

`GET /api/project-history/{canonical_id}?limit=50&before=123` discovers retained project generations without returning payload contents. Limit is 1–100; omit `before` for newest-first, then pass `next_before` from the response. Generations/cursors are decimal strings to preserve full SQLite integer identity in JavaScript. Missing IDs or exhausted pages return an empty list. Unknown/duplicate malformed query parameters are rejected rather than guessed. New insertions do not shift older keyset pages; this is not a frozen multi-request database snapshot.

Each entry contains generation, stored observation timestamp and byte count in the **database encoding**. Listing is not payload validation or a source-truth verdict: corrupt payloads remain discoverable as metadata, and explicit retrieval rejects them. No payload JSON is parsed/copied just to list history. Existing loopback checks and bounded database concurrency apply. This API does not add a graphical history selector or certify migration retirement.

Version archives have matching endpoints: `GET /api/version-history/{version_id}?limit=50&before=123` and `GET /api/version-archive/{version_id}/{generation}`. History uses the same bounded metadata/keyset rules but isolates the version namespace, even where a project has the same ID. Explicit generation retrieval preserves the stored version JSON object and rejects invalid/missing/corrupt selections without latest fallback. Linked files remain metadata and are never downloaded or executed. Batch separators are not part of the archived version object. Backend fixture tests cover historical/restarted retrieval, namespace separation, exact Unicode/unknown fields, failure retention and pagination. This remains an API, not a graphical history browser or owner-data migration.

### Saved upstream observation history

`GET /api/upstream-history/{source_id}?limit=50&before=123` lists bounded
metadata for the fixed `hls`, `serde-json` or `rustsec` source only. Limits are
1–100; positive generation cursors are returned as strings. This shares the
archive keyset pagination contract, not a frozen multi-request snapshot.
`GET /api/upstream-archive/{source_id}/{generation}` returns that exact validated
stored response with its generation and payload hash. Unknown sources or invalid
parameters return 400; absent or wrong-source generations return 404; corrupt or
oversized stored responses return 422. None silently falls back to latest.

The original latest-only endpoint remains unchanged. Read-only history does not
fetch upstream data, download assets, adopt versions, modify receipts or make
source truth/security claims. Tests use generated public-shaped fixtures and
SQLite reopen, not real provider activity, UI selection or power-loss durability.

## Explicit unified native profile

Build `engineering/apps/atlas-lab` and prepare the same reviewed public runtime
package described above. With an **existing schema15** native Foundry database
outside that package, select both stores explicitly:

```
atlas-lab serve-unified /private/evidence.sqlite /absolute/verified-package /private/authoring.sqlite
```

The Lab and Feature Workshop now use the same `http://127.0.0.1:41379` navigation
and document. The Rust engine links the existing native Foundry library directly;
there is no iframe, subprocess command proxy, remote bind or new API grant.
The evidence journal and authoring database remain distinct. `serve-athena` and
the standalone Python Foundry profile are preserved. This command never upgrades,
imports, restores or discovers a source database on startup. Prepare a separate
upgraded copy explicitly if an older native schema needs migration.

The unified profile provides native backup/CAS save, revision listing/read and
explicit reviewed restore, soundtrack read/library/CAS assignment/clear. Legacy
source import remains in its existing explicitly configured standalone profile;
this does not claim all original app capabilities or retirement readiness.

### Ownership and request boundaries

Both DBs must be external to the served package. Selected symlinks, symmetric
main/sidecar name collisions, and existing cross-store or within-store hardlink
aliases are refused before opening the evidence queue. Use private directories:
these startup checks are not protection against a malicious local process replacing
paths afterward. The authoring main-file size check is64MiB, not a bound on WAL,
total disk usage or growth after the check.

Native authorization (exact Host, Origin for writes, X-Athena-Native, fetch-site),
If-Match and framing checks precede body reads. Four shared permits bound buffered
bodies and native DB workers; each body is limited to4MB and5seconds. Reads share
the same admission budget. The existing Atlas write header is not interchangeable
with native authorization. Native SQL uses a10second cooperative VM progress
budget, including initial integrity queries. A15second response timeout reports
an uncertain outcome, never success or an automatic retry; the permit stays held
until any detached worker actually finishes. This is **not** hard cancellation of
blocked OS I/O or a guarantee that a timed-out write did not commit. Refresh and
review the native state before another write. No schema or original data is
silently rewritten.

Only the unified profile allows `blob:` image/media for user-selected local PNG
and video. Script, frame and connection restrictions remain same-origin; no remote
players, inline/eval script or autoplay are enabled. Browser acceptance separately
checks local decoding/playback and native persistence. Hosted runner evidence is
not owner-device installation or private migration acceptance.

## Compare retained learning records

The native `/learning` view can pin one selected record and show it beside a
second selected record. This is an explicit read-only inspection tool: it does
not start an experiment, select a winner, promote code, or write a comparison to
the journal. The pin is page-local and is cleared on reload. Clear comparison
returns to the selected record without changing retained evidence.

Both evidence and complete-run payloads remain verbatim text, including integers
larger than JavaScript's safe numeric range and literal HTML-like strings. The
view reports exact retained-text identity/difference, not semantic equality or
performance superiority. Missing, unsupported or over-budget payloads are
explicitly unavailable, never treated as equal empty evidence. Compare workload,
environment, correctness and failed trials before drawing conclusions.

The page retains at most one pinned and one selected record. Each displayed raw
field is capped at 2,097,152 JavaScript code units in addition to the server's
existing 2 MiB per-field returned-data budget; DOM copies and response parsing
have overhead, so this is not a whole-browser memory limit or hostile-server
sandbox. A pending/failed selection cannot be pinned, and stale responses cannot
overwrite a newer selection. Existing owner-journal access controls apply.

Validation includes DOM regressions for exact large integers/HTML literals,
missing data, repeated pin/clear, stale selection and oversized response refusal.
The packaged native-browser harness checks two actual retained synthetic runs,
no comparison write requests, narrow layout, exact text and reload clearing on
Windows and Linux. A synthetic fixture is not an authentic target-project speed
comparison or complete migration acceptance.
