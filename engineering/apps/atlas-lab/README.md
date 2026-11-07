# Athena Lab · executable R&D foundation

**Status: early working CLI and local-interface prototype, not a finished autonomous self-improving application.**

This Rust application starts the evidence and collection core. It does not replace the Atlas research library. It cannot yet generate arbitrary code changes, deploy itself, run an unattended code-improvement loop, or collect every platform. A loopback-only interface and durable job queue are implemented; browser visual/input QA remains pending. There is no Windows installer yet.

## What executes now

- A complete-output comparison gate separates incomplete evidence, stabilization work, insufficient improvement and eligibility for review. Eligibility is not deployment permission.
- SQLite records experiments transactionally. Repairs create a new linked record; they cannot overwrite the failed record through this API. The decision is computed by the gate, not supplied by the caller. Repair records must keep the baseline/workload and declared environment identity and identify a new candidate revision.
- A real algorithm experiment compares linear exact identifier deduplication with a hash-indexed implementation. Both retain first-seen order, case, Unicode distinctions and arbitrarily long string identifiers. Ten thousand generated differential cases run in the unit suite.
- A read-only Modrinth adapter retrieves one public project's defined metadata projection from the official HTTPS endpoint. It rejects arbitrary URLs, redirects, malformed fields and oversized responses; supplies a specific User-Agent; imposes timeouts and a serial cooldown; respects rate-limit responses. It downloads no mod files and accepts no credentials.
- Successful project snapshots are committed with their collection receipt. Failed refreshes do not replace a previous generation. Canonical IDs survive slug changes. This is a selected metadata projection, **not all fields, assets/downloads or a complete platform catalogue**.

## Run

Install the official Rust toolchain selected by `rust-toolchain.toml`, then run in this directory:

```sh
cargo test --locked
cargo clippy --locked --all-targets -- -D warnings
cargo run --locked -- serve local.sqlite
cargo run --locked -- modrinth-project sodium
cargo run --locked -- collect-modrinth sodium local.sqlite
cargo run --locked --release -- dedup-lab experiments.sqlite
cargo run --locked --release -- storage-lab NEW_OUTPUT_DIRECTORY
```

The first two commands make no platform requests. Cargo may download pinned registry dependencies. The Modrinth commands explicitly make public API requests. The labs run fixed built-in strategies on generated identifiers or an existing saved version record, not downloaded third-party implementations.

The dedup lab intentionally remains ineligible for review: it does not yet measure peak memory, exercise cancellation or attach run-specific stress evidence. Unit test coverage is not silently substituted for runtime evidence. Timings from this narrow generated workload are not end-to-end application speed claims.

## Safety and limitations

- No credentials, account sessions, paywall bypasses or arbitrary command execution.
- The journal is append-only through the application API, not cryptographically tamper-proof against local database edits.
- A timeout, HTTP failure or schema failure is not an empty successful collection.
- Modrinth cooldowns are per client instance. The fixed GitHub upstream reader persists its budget in the selected database, not globally across databases or the shared originating IP. Do not launch parallel processes or create databases to evade provider limits.
- No crash/power-loss durability certification, process sandbox, parallel collector orchestration or production promotion/rollback mechanism yet. SQLite transactions are not a substitute for those tests.
- Native dependency builds and platform behavior need separate Linux and Windows CI evidence. A Linux pass is not a Windows release.
- Rust/SQLite/reqwest are evaluated starting choices, not universal winners. Storage alternatives and UI choices remain an explicit experimental decision.

## Next implementation milestones

1. Extend the durable leased queue with cancellation, backoff and stronger crash injection; current tests cover separate-connection claims, expired-lease recovery and stale-worker fencing.
2. Isolated benchmark workers with resource measurements, exact source/workload identities and baseline/candidate replay.
3. Stabilization cases with reproducible failures, diagnosis, actual code repairs, retained speed and adversarial regression suites.
4. Complete real-browser visual, interaction and accessibility acceptance for the local UI; HTTP-only tests do not establish these.
5. Candidate patches in isolated worktrees, locked checks and rollback verification before any controlled promotion. A model-backed patch generator is not configured; general recursive self-improvement is not claimed.
6. More official-platform adapters with explicit authentication and content-access capabilities, not an “all websites work” badge.

## Primary references checked October 26, 2026

Source-register IDs: [R05], [DB05], [NET01], [COL01], [COL02].

- [Rust installation](https://rust-lang.org/tools/install/) · actual local compiler 1.99.1.
- [rusqlite](https://docs.rs/rusqlite/0.41.0/rusqlite/) · pinned 0.41.0 with bundled SQLite.
- [reqwest client](https://docs.rs/reqwest/0.13.5/reqwest/blocking/struct.ClientBuilder.html) · pinned 0.13.5; blocking CLI client, not a UI-thread architecture recommendation.
- [Modrinth API overview](https://docs.modrinth.com/api/) and [project operation](https://docs.modrinth.com/api/operations/getproject/) · public metadata, canonical identifiers and provider limits.

## Current local-interface boundary

`serve` binds only `127.0.0.1:41379`. It exposes no CORS permission; write requests require the exact local Origin and a custom same-origin header, and requests with unexpected Host values are rejected. SQL work is moved off async executor threads and bounded to four concurrent database operations. One serial worker executes permitted public metadata jobs. Job output and terminal status commit in one transaction; an expired worker cannot finalize a later attempt. A crash may repeat a public read, so this is not exactly-once network execution. Project collection results and CLI snapshots remain separate representations. Queued version collection writes complete raw SnapshotStore records and a bounded job receipt; snapshot and queue finalization are separate transactions, so crash recovery may append another snapshot.

A prototype dashboard exposes collection and evidence state. Its explicit run control now queues a bounded built-in comparison; it does not enable arbitrary code generation or autonomous deployment. The local HTTP smoke pass verified real queued public collection, input limits and origin/host guards; cloud-browser access to the isolated loopback preview was unavailable, so visual and browser-interaction acceptance is explicitly pending.

[Card-density browser lab](../../docs/card-lab/index.html) is a separate generated-data measurement harness, not a claim about any project's current UI. [Storage lab evidence](../../experiments/rust-storage-lab/README.md) compares preparation strategies with the same transaction and durability boundaries.

## Optional bounded public batch collection

`cargo run --locked --release -- collect-modrinth-batch OUTPUT.sqlite AANobbMI gvQqBUqZ YL57xq9U` collects 1–20 unique canonical Modrinth IDs through one official request and commits successful projections plus missing-identity receipts atomically. The existing single-project CLI remains available. The local Collection form and queue also accept comma-separated canonical IDs through the same bounded batch implementation. Read the [measured scope and limits](../../experiments/modrinth-batch-lab/README.md) before interpreting request reduction as speed. No authentication is needed or configured.

Queue integration verification: 22 loopback HTTP checks exercised a real three-project batch, active-job deduplication, forbidden origins/hosts, malformed IDs, request limits, module serving, graceful shutdown and complete recorded output after SQLite reopen. Partial batches are marked failed/partial while retaining returned records and missing IDs. Oversized result envelopes become explicit failures, not silently truncated successes or repeated finalization loops. Local visual browser acceptance is still separate and has not been established by these HTTP checks.

## Isolated serialization research

`Queue::overview_raw_candidate` is an experimental full-result serializer, not used by the HTTP overview route. The [stabilization record](../../experiments/overview-serialization-lab/README.md) retains naive-parser failures, the checked repair, complete-output comparisons and qualified Linux memory measurements. No production switch follows automatically from this experiment.

## Bounded queued experiment

The explicit Run bounded comparison button runs only the two built-in identifier strategies, with 2 warmups, 15 timed pairs and 10,000 run-specific differential stress cases. A cooperative 15-second budget and shutdown checks preserve partial results. Raw results and failures are journaled; earlier successful evidence is retained. Peak memory is unmeasured, so the gate still returns Incomplete and no candidate is promoted. This queued runner is separate from the older CLI lab described above. See [runner evidence](../../experiments/bounded-runner-lab/README.md).

## Event-driven queue wake-up

Successful enqueues notify a capacity-one channel, and the worker drains ready jobs without a mandatory sleep between them. The one-second idle recovery scan remains; provider cooldowns and transaction boundaries are unchanged. The [actual Atlas HTTP comparison](../../experiments/queue-wakeup-lab/README.md) retains full results, cancellation checks and the prior baseline. This removes measured dispatch delay, not algorithm work or evidence gates.

## Safe failure categories

Collection failures now return fixed category messages for transport problems, malformed JSON and known cooldown/rate-limit/cancellation/size conditions. Raw URLs, headers, error strings and response bodies are not echoed into job results. Unknown failures remain generic; a category is not a complete root-cause diagnosis. Tests include synthetic secret-bearing URLs and unknown private-looking error text. Earlier unexplained failures remain unexplained in historical receipts.

## Long description retention

The Modrinth projection retains its full long-description text when provided. Absence in legacy or partial responses is unknown, not an empty description. Markup remains inert; no body-linked image, video or attachment is automatically fetched. [Body comparison and reopened parity](../../experiments/body-projection-lab/README.md) report the real data gain and parse overhead without a UI speed claim.

## Isolated HTTP overview candidate

`cargo run --locked --release -- serve-candidate TEST_COPY.sqlite` exposes the checked-raw serializer only when explicitly selected. Use a fresh or copied test database, not a working production database. The HTML labels the experimental mode and responses include its strategy identity. Normal `serve` retains the Value serializer. Both now read job rows and aggregate counts in one transaction after a real concurrent-write inconsistency was reproduced. [HTTP evidence and retained failures](../../experiments/overview-http-lab/README.md) include complete parity, stress repair and unresolved maximum-latency tradeoffs. No automatic promotion or other-project change occurs.


## Saved-version R&D action

The Experiments panel now offers a fixed comparison of the baseline version
validator and the isolated fixed-field candidate. Collect a canonical public
version into the SAME database first, then start the local interface:

```sh
cargo +1.99.1 run --release --locked -- collect-modrinth-versions local.sqlite g6ju16VJ
cargo +1.99.1 run --release --locked -- serve local.sqlite
```

The ID above was observed in a public response at review time; it is an example,
not a promise of perpetual availability. The experiment itself makes no provider
request. It retains exact source/hash/generation identity, up to 20 timing pairs,
10,000 generated stress variations and raw partial samples within a cooperative
15-second budget. Missing process-memory and per-strategy cancellation evidence
still block promotion. The default collection parser is not replaced.

[Protocol, limits and verification](../../experiments/saved-version-runner-lab/README.md).
Current verification is loopback HTTP and source/DOM wiring, not native-browser
visual/input acceptance. No installer, credential integration, arbitrary code
execution or general autonomous self-modification is claimed.

## Collect versions before experimenting

In Collection, submit 1–20 canonical version IDs. The queue saves complete original public JSON to the same database used by Experiments. Wait for a complete/partial receipt in Overview, then enter a successfully saved version ID under Saved version validation. No separate CLI step is required; the CLI remains supported. See [real HTTP evidence and remaining browser acceptance gap](../../experiments/version-collection-queue-lab/README.md). No binary files are fetched, no experimental parser is promoted, and no API grant is created.

## Fixed public upstream checkpoints · October 27, 2026

The Collection panel can queue a read-only checkpoint for RustSec advisory-db, hls.js or serde_json. The same bounded path is available with `cargo run --locked -- review-upstream local.sqlite rustsec` (or `hls`, `serde-json`). It requests official public JSON without credentials and retains complete original response bytes, receipt hash, revision, provider timestamp and observation time. Unknown fields are retained, not projected away.

Only these three compiled sources are accepted. Release metadata is not source-signature verification, a dependency audit, an upgrade, a registry-newest guarantee or evidence of better performance. A changed response can mean metadata drift rather than a changed revision. No release assets execute or download. Current tests and exact limitations: [upstream review evidence](../../experiments/upstream-review-lab/README.md).

The reader shares the existing bounded JSON transport with Modrinth without new dependencies. It reserves a request transactionally before HTTP, limits each database to 30 requests per hour, persists server cooldowns, and blocks interrupted reservations for manual reconciliation. There is deliberately no automatic reset or credential escalation. A process killed between reservation and completion requires investigation; the UI does not yet offer a reconciliation operation. Queue finalization and snapshot commit remain separate transactions, so a crash can cause a later duplicate observation, not exactly-once delivery. Previously saved generations remain intact.

## Optional complete project-response archive

`cargo +1.99.1 run --release --locked -- collect-modrinth-raw ID_OR_SLUG OUTPUT.sqlite` uses the existing public client and stores complete received JSON locally, returning only a bounded ID/hash/generation receipt. It makes an official public API request; no credentials are used. Old projection and queued UI modes remain unchanged. This lane is implemented and tested with generated cases and three retained public responses; the new CLI coordinator has not been freshly network-tested in this pass. It is not full project-content or authenticated coverage. [Coverage, persistence tests and measured costs](../../experiments/project-raw-lab/README.md).

### Complete-response collection form

The local Collection panel now offers an explicit full-response archive form using `CollectModrinthRaw`. It reuses the CLI's validated envelope/store and the existing serial worker; Overview receives a compact hash/generation receipt instead of copying full provider JSON. Fixture-supplied public responses passed the actual queue/coordinator path, and 45 loopback HTTP/asset/security checks passed. Fresh successful provider execution through this new worker branch and native-browser interaction are not yet verified. [Measured coverage and limitations](../../experiments/project-archive-queue-lab/README.md).

### Inspect exact saved JSON

The Collection panel implements a saved-response inspector for one canonical project ID, with strict identity/hash/UTF-8 checks, a bounded stream, cancellation, last-good retention and an original-byte download. It reads local snapshots only; no provider request or sign-in occurs. The local read route and actual JavaScript reader passed 73 HTTP and eight reader checks. Native-browser dialog/download interaction remains unverified. [Read boundaries and reproduction](../../experiments/project-archive-view-lab/README.md).

### Selected native checks

Cloud-desktop Chromium now verifies the saved-response dialog, exact JSON download and last-good reopening for the tested cases. Overview archive-job labels were corrected after that inspection. One fresh public collection attempt failed at connection; it was recorded as failed without losing previous data. This is not Windows/full-native, performance or live-provider success acceptance. [Evidence and remaining gates](../../experiments/job-label-lab/README.md).

## Recorded acceptance policies · October 28, 2026

New experiment-journal rows retain an exact versioned acceptance policy, also exposed in CLI and queued HTTP results. Linked repairs must preserve that policy, not simply raise a budget or lower an acceptance threshold. Legacy rows are preserved with policy unknown and cannot be retroactively labeled policy-equivalent repair parents. Decimal/hexadecimal strings preserve full integer and floating-point identity across browser JSON. This does not make the journal tamper-proof or authorize deployment. [Failure, migration and real HTTP/CLI evidence](../../experiments/gate-policy-lab/README.md).

## Verified connection requirements

Snapshot, queue and journal connections share a fail-closed synchronization/foreign-key/journal-mode check. They request EXTRA without changing an existing safe journal mode; temporary/in-memory fixtures remain explicitly non-durable. This strengthens the DELETE-journal configuration contract, not a speed claim or power-loss certification. [Baseline failures, implementation and HTTP regression evidence](../../experiments/sqlite-contract-lab/README.md).

### Fresh public archive verification · October 28, 2026

The existing CLI and actual queued worker have now successfully requested and persisted selected live Modrinth project responses. Four CLI successes and one queued success retained five generations; missing-project requests failed explicitly without replacing them. Independent hashes and twelve loopback checks passed. A changed provider downloads counter remained separate evidence. Native cloud-browser navigation to the executor's localhost still failed, so this adds live provider/HTTP coverage, not GUI or universal adapter acceptance. [Receipts and exact limits](../../experiments/project-raw-live-lab/README.md).

### Inspect saved version objects · October 30, 2026

The same saved-response inspector now reads complete individual version JSON objects. Select Project response or Version object and enter the matching canonical ID. Type-bound headers and hashes prevent cross-namespace substitution, and the original bytes can be downloaded with a type-specific filename. Changing type or closing a viewer with a pending load cancels that load while retaining previous verified data. File URLs remain inert metadata; no binary file is fetched. [Implementation and actual HTTP regression evidence](../../experiments/version-archive-view-lab/README.md) distinguish controlled UI tests from still-unverified native browser interaction.

### Unconfirmed submission recovery · October 30, 2026

All six enqueue actions now use a bounded receipt wait. If the reply stalls or cannot be verified, the control becomes available again and the UI asks you to check Overview before submitting again: the job may already exist. No POST is automatically retried or described as cancelled merely because its receipt timed out. Complete integer receipt IDs remain strings rather than rounded JavaScript numbers. [Reproduced failures and actual local queue/transport evidence](../../experiments/job-submission-recovery-lab/README.md) keep browser interaction acceptance separate.

### Exact overview job identities · October 30, 2026

Overview adds an exact decimal `id_text` field while preserving the numeric `id` for compatibility. The UI uses exact text for card keys and labels, preventing different large IDs from collapsing into one card. Malformed or duplicate identities fail before changing visible cards/counts; safe legacy IDs remain supported. [Actual HTTP/renderer reproduction and repair](../../experiments/job-identity-lab/README.md) preserve the six-job/five-card baseline and both six-card repaired modes. This is controlled DOM evidence, not native paint or latency acceptance.

### Inspect saved fixed upstream responses · October 30, 2026

The saved-data inspector also accepts RustSec, HLS.js and serde_json snapshots. Choose Saved upstream response and enter `rustsec`, `hls` or `serde-json`. This reads previously stored data, not a new provider checkpoint, and does not reset request budgets or interrupted reservations. Source-bound validation and exact-byte downloads reuse the existing archive path. [Evidence and remaining browser gates](../../experiments/upstream-archive-view-lab/README.md).

### Preserve Overview after a malformed result · October 30, 2026

Overview prepares every card before committing its keyed cache and summary metrics. A late preparation failure no longer mixes new counts with old cards or leaks an uncommitted card into the next successful refresh. [Actual renderer and loopback evidence](../../experiments/overview-last-good-lab/README.md) distinguishes this correctness repair from unverified native-browser performance.

### Scope Overview reuse to an engine instance · October 30, 2026

Overview responses carry a public ephemeral instance label. A newly started engine cannot reuse the previous engine's cached job cards merely because job IDs, states and attempts collide. Missing labels disable reuse; malformed labels retain the last-good view. No database path or credential is exposed. [Restart evidence and limits](../../experiments/overview-engine-identity-lab/README.md).
