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

Local Chromium could not start because the execution sandbox denied its socket operation. That failure is retained. The separate full browser harness, [scripts/test_lab_runtime.cjs](https://github.com/Herbertofury/Athena/blob/main/scripts/test_lab_runtime.cjs), covers native dialog/download behavior, shared navigation, strict CSP and restart reload against the actual Rust process; its CI result must be read before claiming browser acceptance. Its optional `ATHENA_LAB_HTTP_ONLY=1` mode is explicitly labeled HTTP-only and does not establish browser parity.

These tests use generated snapshots and a fixed built-in workload. They do not prove live collection on every provider, Windows correctness, crash/power-loss durability, resource/performance superiority, full Foundry integration, autonomous self-improvement, or readiness to delete Engineering Atlas. Private Foundry content is excluded.
