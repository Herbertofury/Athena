# Conditional edits without silent overwrites

**Evidence state:** original executed synthetic experiment, checked 2026-11-11. Not an accepted change to Athena's application API or any mod tool. [Runnable lab and receipts](../experiments/conditional-edit-lab/README.md) · [Dated research](../research/2026-11-11-conditional-edit-foundations.md).

## Decision and concrete failure

Two editors load the same configuration. A changes its title. B changes its enabled flag while retaining the old title. Sending B's whole document without tying it to the version B actually edited silently restores the old title. A successful retry system does not solve this: it can faithfully execute the wrong stale replacement exactly once.

The hypothesis tested here is narrower: in one generated SQLite document, evaluate a client's strong base validator and perform its replacement/history append within one write transaction. A second edit from the same old base must fail without changing either table. This is a correctness experiment, not a latency or throughput comparison.

## Primary documented boundaries

- RFC 9110 specifies strong comparison for If-Match, weak comparison for If-None-Match, and If-Match evaluation first. A wildcard checks existence, not the editor's version. Matching If-None-Match produces 304 for GET/HEAD and 412 for other methods. [Sections 13.1–13.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1).
- A successful PUT may return a validator only under the standard's unchanged-representation requirement. A 304 Content-Length, when included, describes the corresponding representation rather than an empty payload. [PUT](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.3.4) · [Content-Length](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.6).
- 428 requires a conditional request, should explain how to resubmit, and must not be cached. [RFC 6585 §3](https://www.rfc-editor.org/rfc/rfc6585.html#section-3).
- No-cache requires validation before reuse; it is not no-store. Private excludes shared-cache storage. [RFC 9111 §5.2.2](https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2.4).
- SQLite permits one simultaneous writer; BEGIN IMMEDIATE acquires a write transaction and can encounter contention. [SQLite transactions](https://www.sqlite.org/lang_transaction.html).

The following implementation choices and acceptance proposals are this experiment's design, not claims that the standards mandate its database, schema or UI.

## Executed design

The fixed `/document` resource stores exactly the accepted UTF-8 JSON bytes plus a generated fixture epoch and revision. Validation rejects duplicate keys, unexpected fields, invalid field types and oversized content without normalizing the accepted bytes. Its ETag includes epoch, revision and a SHA-256 digest. Identical-byte writes still advance the revision; an A→B→A sequence does not reuse the original tag in the tested database lifetime.

The write path validates input, begins an immediate transaction, reads the current version, evaluates conditions, changes the document under a matching revision predicate, appends the new history row, then commits. Fault injection after the update and before commit leaves the complete prior snapshot unchanged. Two concurrent connections using the same base tag produce one success and one 412 across five test rounds. The wire server itself is synchronous; this is not a concurrent HTTP-server benchmark.

The demonstration uses actual sockets bound only to an ephemeral 127.0.0.1 port. Six fresh generated databases retain request/response headers, exact body bytes as hex, initial/final state and history. It exercises stale edits, weak write tags, absent preconditions, wildcard overwrites, a minimal client cache model, and exact-byte responses. Unit tests add malformed conditions, duplicate headers, precondition ordering, rollback, revision exhaustion and response-loss boundaries.

### The negative control matters

`If-Match: *` deliberately allows both generated editors' replacements, leaving B's document as the final state. It is accepted here to expose its weaker meaning. Therefore “every write has If-Match” is insufficient to claim lost-update protection. A product that promises stale-edit refusal would need to prohibit the wildcard in its edit workflow or explicitly distinguish an authorized overwrite action. This lab does not implement that product policy.

### A response is not a transaction receipt

An injected response write failure occurs after a committed update. The handler attempts one response, closes the connection and does not manufacture a second error status implying rollback. The saved document and history remain committed. Retrying the old tag then gets 412, which does not establish whether that client or a different editor made the current version. An operation identifier and durable result lookup answer a different question. See the independently proposed [retry boundary draft](https://github.com/Herbertofury/Athena/pull/32); this branch neither depends on nor changes it.

## Client integration proposal, not implemented UI

For a target that needs conflict detection, evaluate this state machine against its actual editor:

1. Retain the loaded body and its validator together as the edit base. Keep unsaved input separately.
2. Send the base validator with the intended replacement. Do not substitute a newer tag merely because a background read supplied one.
3. On 200, adopt the returned exact representation and tag only if the UI still owns that operation. Test navigation and newer edits while a response is in flight.
4. On 412, retain unsaved input, obtain the current representation, and compare base/current/proposed values. Offer review or explicit conflict resolution. Never silently take the tag from an error and resubmit the unchanged stale replacement.
5. On 428, start from a representation and tag obtained together. On disconnect, timeout or uncertain response, reconcile the outcome before retrying. Do not erase the user's draft.

The cache demonstration keeps previously stored bytes on 304, then retrieves new bytes when the old validator no longer matches. It models one owned client only. It does not establish browser, service worker, shared-cache or CDN behavior. A bodyless response must not become an empty application document through a convenient generic response handler.

## Costs, rejected alternatives and disqualifiers

- Last-writer-wins is simpler when overwrite is truly the product contract; it fails the stale-edit requirement measured here.
- Wildcards retain existence checks but fail version protection, as shown by the negative control.
- Client-only compare-before-save has a race between its read and the server's mutation. The tested transaction couples those decisions.
- Automatic three-way merge may suit structured collaborative data, but field conflicts, ordered arrays and invariant violations require a separate model. It is absent here.
- Pessimistic editing locks introduce ownership/expiry/recovery work. This lab does not compare their usability or cost.
- Every accepted write hashes at most 1 KiB and appends history. History is unbounded across repeated calls; this is not a bounded long-running store. No full-document approach is recommended for large blobs without target measurements.
- Restoring an old database can restore an old epoch and revision. The tag scheme is not a backup-restore/replay fence, cross-replica clock or globally proven uniqueness mechanism.
- No content negotiation/compression, resource creation/deletion, PATCH, Range, Last-Modified, If-Range, multi-resource transaction or authorization model is implemented. These require new semantics and tests, not an extrapolation of the current pass.

## Security and acceptance gates

The server checks a single Host, an optional matching Origin, a fixture-specific write-intent header, type/length and conditional-header budgets. Those checks are fixture hygiene, not authentication. Any local client can construct matching headers. No credentials, private documents, external URLs or user files are used. Python explicitly warns that [http.server is not recommended for production](https://docs.python.org/3.12/library/http.server.html).

Before recommending this pattern in a target, record its current revision and mutation/cache behavior; reproduce the real lost-edit case; test authorization before precondition disclosure, user/tenant isolation, actual browser/proxy behavior, response ownership, cancellation, resource lifecycle, retries, restore/recovery, database contention and realistic document/history sizes. Require complete correctness/security/UX acceptance and a meaningful target benefit. The present evidence establishes none of those target results and no speed improvement.
