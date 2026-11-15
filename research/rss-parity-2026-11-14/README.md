# Current RSS preservation parity

This bounded port reconciles original Athena #14 publication dates and #53 envelope validation through the combined #56/#57 implementation, without merging their superseded application tree. Donor commit: `124cd648006cd06f8491ae70105165df00962675`. Current baseline: `a8a30f387c10c70e1e8195c37d97e9623437e20a`.

Only `rss_publication_date`, `rss`, the date projection in `receipt`, and the required datetime imports are adopted. Current ModPub attribution, ordered body handling and every unrelated extractor function remain unchanged. The two donor test files remain byte-identical. Existing RSS title preservation is retained.

Unsupported Atom or malformed core RSS is rejected rather than reported as an empty successful feed. Foreign-namespace payloads remain opaque. Publication dates retain their original value in memory; timezone-missing, unknown, invalid, ambiguous and unsupported cases remain explicit. No local timezone or current clock is guessed. Public receipts omit raw date text.

## Acceptance

- The 35 RSS tests reproduce 17 failed assertions and 55 subtest errors on the baseline. All 35 pass after this change.
- All 396 current Engineering Python tests pass.
- Tests use synthetic/offline fixtures, no new provider request or private data.
- Historical observations and receipt hashes are unchanged. This pass does not reproduce the older stack's 70 retained provider records, claim fresh live-feed support, or accept its unrelated Bluesky/Discord features.
- No runtime UI, browser, native-target or performance claim is made for this parser-only change.

Preserved donor tests cover valid empty feeds, obsolete/versionless RSS, comments, processing instructions, extension payloads, malformed envelopes, duplicate/missing dates, numeric/named/unknown timezones, strict complete-value parsing and raw-text exclusion from receipts. Earlier branch evidence remains historical rather than relabeled as current acceptance.
