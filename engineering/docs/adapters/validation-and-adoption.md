# Adapter validation, adoption and maintenance

[Adapter laboratory](README.md) · October 27, 2026 (America/Denver)

## What qualifies as full support

Full support is a vector of tested capabilities for a specified account and site scope. It is not a badge earned by recognizing a domain or retrieving a title. Each adapter needs separate results for discovery, author identity, avatars, body, media, files, history, local follow, native follow, native-follow import, authentication, rate recovery and removal handling. Unsupported native operations must be presented as such even when local tracking works.

Use these evidence levels: `candidate`, `primary_documented`, `public_observed`, `fixture_tested`, `authenticated_tested`, and `accepted_in_target`. A blocked or inaccessible source remains `unverified` for that operation. Evidence can differ across operations on the same platform. Preserve earlier narrower success and failure receipts when new research is added.

## Required correctness corpus

| Case | Expected result |
|---|---|
| Same display name, different account IDs | Two identities until explicit linking evidence or user confirmation |
| Author renamed or moved domain | Stable identity with versioned alias/redirect evidence |
| Team project with several contributors | All supported contributor roles retained; no invented sole author |
| Mirror uploader differs from original author | Two roles and original-source provenance; no avatar substitution |
| Reblog/quote/forward | Publishing account and original author separately retained |
| More than one gallery page | Correct ordering and explicit continuation until completion |
| Mixed image, video, audio and ZIP/package | Correct roles; no loss from a thumbnail-only normalization |
| Missing/default avatar | Truthful fallback, not a random body image |
| Public preview of a locked post | `preview_only` or membership requirement; never complete |
| Logged-in account has no relevant entitlement | A denied/limited state, no retry loop or cross-account cache leak |
| Paid post becomes public | Access transition detected without a duplicate release |
| Edited old/pinned post | Body/media revision detected without relying only on new timestamps |
| Expired signed media URL | Re-resolve within the authorized session; preserve failure if unavailable |
| File renamed or replaced | Stable release/file relation, new integrity metadata and revision history |
| Game/edition/loader mismatch | Compatibility difference preserved; no automatic wrong-file choice |
| Rate limit or partial API response | Retain usable data and warnings, apply provider backoff, preserve cursor |
| Removed/deleted item | Explicit tombstone/state; no fabricated replacement from a mirror |
| Spoofed host or malicious HTML | Reject unbound identity/URLs and unsafe rendering |
| Follow retry or app restart | No duplicate notification or unintended native follow mutation |
| Native follow unsupported | Local tracking still works with clear capability labeling |

Record the actual field-level completeness denominator. A corpus of easy public cards cannot establish support for private posts, download entitlements, large histories or custom avatars. Synthetic edge cases are useful parser tests, but they remain labeled synthetic and cannot substitute for live access evidence.

## Proving a better method before changing GameSync Next

The requested boundary is explicit: research and isolated experiments belong in Engineering Atlas; GameSync Next changes require a demonstrated improvement against its current implementation. Reading a repository is not permission to publish its private code or traces into this public Atlas.

1. In a private comparison record, pin the exact target revision, adapter path and current behavior. Preserve existing user preferences and architecture constraints.
2. Select the same permitted creator/post/file corpus and account states for baseline and candidate. Define the user-visible gap before testing.
3. Compare normalized identity, complete body, ordered media, files, warnings and access states. A candidate that retrieves more required content must demonstrate why those additions are correct.
4. Measure first correct card, complete enrichment, network requests/bytes, memory, durable storage and p50/p95 latency under equivalent cold/warm conditions. Keep full outputs and failures.
5. Exercise login expiry, provider errors, restart/resume and actual media decode/playback. A faster title-only result is not an improvement over complete output.
6. Run the target's required tests and real-browser acceptance in an isolated branch/worktree. Do not interrupt active project work or mix separate source roots.
7. Transfer only the proven result with a reversible change and a factual summary. Preserve the previous method when it still covers cases the candidate cannot handle.

No new method in this catalog is promoted to GameSync Next by documentation alone. A provider's API can be the best starting candidate without being the proven winner for the target workload.

## Research maintenance

For each site record the checked date, source URLs, observed interface/version, operation-level evidence, outstanding fixture, API or policy changes, aliases, and the reason for the preferred route. Source review dates use UTC; human-facing research notes may also state the user's local calendar date.

Review volatile login, billing, quota, download and API-policy sources at least weekly when active work depends on them. Review stable schema references when the provider changes or a fixture fails. A source fingerprint change creates a review item; it does not automatically justify replacing a working adapter. Preserve redirects and deprecated endpoints as history, with a current route separately stated.

Use the existing source register and offline research checks. Checks validate structure and references; they do not prove a site is reachable or that a paid session works. Never refresh a `checked_at` date without actually reviewing that source. For a broad catalog, rotate lower-priority site checks and explicitly retain each row's real last-check date.

## Keeping source and wiki aligned

Canonical documents live under `docs/adapters/`. A wiki projection should preserve internal navigation, link uncopied evidence to its canonical repository location, and include a source backlink. Before publishing, fetch the latest wiki revision and preserve unrelated edits. Publish only reviewed documentation and sanitized evidence; do not overwrite project implementation files during a research refresh.

GitHub documents both browser editing and the wiki's separate Git repository. Repository-content API access alone does not establish that the current environment can push that wiki. If publication is blocked, save the complete prepared source and identify the pending wiki step honestly. [GitHub wiki editing](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages)

Scheduled maintenance, if configured by the user, must obey the same evidence and access rules. If a credential expires or a review cannot be completed, report the blocked operation rather than marking a page current. A maintained catalog can cover a very large ecosystem without claiming that every website on the internet has been tested.
