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
