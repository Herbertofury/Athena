# Bounded public-project batching · 2026-10-27

**Implemented optional Atlas CLI path; verified request-count reduction, not a universal latency win.** Source [COL03].

The existing one-project collector remains available. The new `collect-modrinth-batch OUTPUT.sqlite CANONICAL_ID...` path uses the official multi-project operation. It reuses the typed projection, HTTPS-only transport, disabled redirects, timeouts, content-type validation, 2 MiB response budget, one-request-per-second initiation limit and 429 cooldown. A batch accepts 1–20 unique canonical eight-character IDs. This is an Atlas safety budget, not a claimed provider limit. Slugs remain supported by the single-project path.

The parser rejects duplicate/unrequested response identities and malformed records, restores requested order, and reports omitted identities explicitly. Missing entries never overwrite last-good snapshots. Successful snapshots and per-identity attempt receipts commit in one transaction; validation or database failure cannot partially commit earlier rows. Missing does not imply private, deleted or nonexistent.

## Real public comparison

Five alternating-order pairs collected Sodium, Lithium and Iris. Each sample used a fresh TLS client; baseline inter-request cooldown was included, initial separation was outside timing. All five complete **typed projection** comparisons matched, including gallery and version arrays. No gallery cap or fields were removed for timing.

- Requests per three projects: **3 single versus 1 batch**.
- Median wall time: **4575.898 ms single versus 4121.534 ms batch**.
- Batch was faster in only **3 of 5 pairs**. Network/CDN conditions were uncontrolled; this small run does not establish robust latency benefit.
- The real CLI durable-write check reopened SQLite and matched all three projections, with 6/0/4 gallery entries and 264/180/243 version IDs. Integrity check returned `ok`.

[Summary and build identities](summary-2026-10-27.json) · [durable receipt](durable-receipt-2026-10-27.json). Complete per-pair outputs and timings: [pair 0](pair-0-2026-10-27.json), [pair 1](pair-1-2026-10-27.json), [pair 2](pair-2-2026-10-27.json), [pair 3](pair-3-2026-10-27.json), [pair 4](pair-4-2026-10-27.json).

## Correctness and reproduction

New coverage includes 1000 reversed/partial batch permutations, identity guards, request/body bounds, forged missing-state rejection, injected mid-transaction database failure, last-good preservation and reopen parity. Final local Rust suite: 37 unit tests plus 3 integration tests; clippy passed. The thousand-case regression was added after the live run without changing measured collection code; retained hashes identify that distinction.

From `apps/atlas-lab`, explicitly run `cargo run --locked --release --example modrinth_batch_lab -- AANobbMI gvQqBUqZ YL57xq9U` for the bounded live comparison. This makes up to 20 public requests and is never run by CI or the background worker. It writes JSONL incrementally and stops on network or parity failure, retaining prior samples. The durable command is `cargo run --locked --release -- collect-modrinth-batch OUTPUT.sqlite AANobbMI gvQqBUqZ YL57xq9U`.

## Boundaries

This is not the full provider response: description-body content and other fields outside the existing projection remain outside scope. Gallery URLs are metadata, not downloaded images. No image decode, video, account access, peak memory, concurrent UI, power-loss durability or other-project baseline was tested. A combined response above 2 MiB fails explicitly rather than being truncated; use smaller batches. The timing run covered the CLI collector. The later local UI/queue integration is verified separately below. Nothing was promoted to another project's implementation, wiki or TODO.

## Local queue integration

The Collection form accepts one slug/ID or comma-separated canonical IDs; the Rust queue independently validates and bounds the request. Missing identities produce a partial failed job with returned data retained. Full results and terminal states remain one atomic queue transaction. An oversized envelope produces an explicit failed receipt rather than a truncated success.

[22 real loopback HTTP checks](queue-http-receipt-2026-10-27.json) passed, including three live projects, source guards, duplicate requests, request limits, module assets, shutdown and SQLite reopen parity. [Reproduction helper](queue_http_check.py) uses a fresh temporary database and refuses to overwrite an existing test database; build the release binary first. It makes a public Modrinth request and is not run by CI. The final local suite has 40 Rust unit tests plus 3 integration tests, 30 Node tests and 53 Python tests. HTTP/module tests do not establish visual browser or installed-desktop acceptance.
