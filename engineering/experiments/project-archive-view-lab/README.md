# Exact saved-response inspection and export

2026-10-28. Builds on queued archival at `9a2c8b0943b5eba078840757fa18494bf886e06b`; no collector or authentication replacement.

## Implemented boundary

A read-only route on the existing loopback server retrieves one saved canonical project ID. It validates the stored record and returns the original JSON bytes, with canonical identity, exact string generation and SHA-256 headers. Invalid IDs, missing records and corrupt/misbound/oversized records are errors, never successful empty responses. Existing Host, CSP, no-store, nosniff and database concurrency controls remain; POST Origin/request-marker checks are unchanged. No arbitrary path/URL, new remote listener, credential or private platform session is accepted.

The reader streams at most two MiB, checks content type/length/identity/generation/hash, rejects redirects and invalid UTF-8, and has a 15-second abort deadline. It does not parse/re-serialize provider JSON, so large integer spelling, whitespace and unknown fields survive. A stale response cannot replace a newer selection. Failure/cancellation retain the previous verified response, with an explicit reopen control. The implemented dialog uses textContent, not HTML; links and markup remain inert. The download uses original bytes. Hash agreement is consistency evidence, not a signature or proof of provider ownership.

## Stored-size guard

[SQLite octet_length](https://www.sqlite.org/lang_corefunc.html#octet_length) can inspect a column's stored byte length from metadata. A SQL CASE returns no payload for stored values above four MiB before copying TEXT into Rust. Four MiB in database encoding admits every otherwise-valid two-MiB UTF-8 record even in a UTF-16 database; the normal parser still enforces the two-MiB UTF-8 acceptance limit. A UTF-16 compatibility test prevents rejecting valid source data because encoded storage is larger. This is bounded-read protection, not a measured process/peak-memory claim.

[JSON interoperability guidance](https://www.rfc-editor.org/rfc/rfc8259.html#section-6) explains why ordinary numeric conversion is not a lossless wire format. [TextDecoder BOM behavior](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder/ignoreBOM) informs the strict text view; exports always use the retained bytes rather than re-encoding a parsed object.

## Evidence and status

- Implemented: local read route, bounded JavaScript reader, selection/cancel/last-good state and read-only dialog/download controls.
- Unit tested: seven reader/state tests cover exact UTF-8/text and large generations, malformed identities/deadlines, header/hash/length errors, oversized streams, invalid UTF-8, timeout, stale responses and failure/cancellation retention. Two Rust tests cover pre-copy stored-size rejection and valid UTF-16 storage.
- Real local HTTP: [73 checks](http-receipt.json) verify exact served UI assets, three retained public responses, a generated generation above 2^53, raw large-number spelling, missing/corrupt/oversized records and existing security controls.
- Actual JavaScript reader against that local server: eight checks preserve all expected byte hashes and retain last-good data on rejection/cancellation. These are included in the HTTP receipt.
- Not verified: native-browser dialog interaction or file-save clicks, fresh provider calls, whole-app input/paint latency, peak memory, authenticated coverage or remote hosting.

The fixtures copy an inactive test database without modifying its source, then add explicitly generated read cases. Original third-party bodies and all databases stay local. Test generation/verification scripts refuse occupied ports and active jobs, issue no accepted collection request, and stop their own server. Initial pre-hardening runs remain in the private test directories; the published receipt uses the final bounded-read implementation.

No new provider requests or grants were made. This is exact-data access, not a speed or other-project recommendation. Snapshot ownership is not cryptographic tamper resistance against local database edits.

## Reproduce

Build the pinned Rust 1.99.1 application with locked dependencies. Run `prepare_fixture.py` with an inactive retained-data test database and a fresh output directory. Run `verify_http.py` against that copy, the compiled binary and the legitimately retained public response directory. It checks compiled assets and invokes `read_saved.mjs`, the actual JavaScript reader integration. Keep databases and original provider text out of public Atlas; retain the receipts and source hashes.
