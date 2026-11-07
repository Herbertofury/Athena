# Bounded Modrinth version metadata

2026-10-27. Official source: COL04. Reuses Atlas's existing public client,
fixed HTTPS origin, disabled redirects, timeout, one-request-per-second pacing,
429 cooldown and 2 MiB total body budget. This is an extension of the adapter,
not a parallel scraper or imported third-party executable.

## Implemented

`collect-modrinth-versions OUTPUT.sqlite CANONICAL_VERSION_ID...` accepts 1–20
unique canonical IDs. Results follow requested order, reject duplicate/unrequested
identities and explicitly list missing versions. The CLI lane stores original
per-version JSON objects, retaining unknown fields, null/absent distinctions,
file URLs and hashes, dependency declarations, compatibility and changelog text.
Links and markup are inert. No files are downloaded, executed or certified safe.

Strict JSON parsing rejects invalid Unicode, nonfinite numeric forms and excessive
depth before raw preservation. Identity decoding rejects duplicate binding fields.
Compatibility lists and file metadata receive structural checks, not complete
validation of every future provider field or interpretation of dependency rules.
Known integer file sizes must fit u64. Uninterpreted large integer spellings remain
in the original payload; receipt serialization must not pass through a Value tree.

Snapshots use provider `modrinth-version`, separate from project snapshots, with
namespaced attempt IDs and atomic snapshot/attempt writes. Existing tables and
project behavior are retained. FULL durability configuration and close/reopen tests
are not a hardware power-loss guarantee. Failed or missing refreshes never replace
last-good version payloads.

## Evidence

- Three real public version IDs discovered in already-collected public project
  responses: Ag5S66CF (Iris), g6ju16VJ (Sodium), 1rb9wI5K (Lithium). This does not
  claim these are the latest versions or a complete project history.
- All three JSON payloads matched byte-for-byte between CLI receipt payload and
  reopened SQLite payload; full semantic objects also matched. One file per
  version, one dependency in the Iris response. No attachment download occurred.
- A separate request for 00000000 returned explicitly missing and retained all
  previous generations. SQLite integrity_check returned ok.
- Fixture tests cover malformed/oversized data, unknown fields and a large integer,
  duplicate/unrequested IDs, missing results, forged binding metadata, restart
  persistence and transaction rollback on injected failure.
- 63 Rust unit and four integration tests passed; clippy and formatting passed.
  Source build and raw public metrics are retained in the companion receipt.

Full third-party changelogs and local databases stay outside the public repository.
Public evidence contains IDs, counts, hashes and outcomes, not copied long-form
content. This expands coverage, not an established performance improvement over
an earlier implementation: Atlas previously had project version IDs only. No
queued UI, authentication, exhaustive catalogue, media playback, full dependency
resolution or other project's acceptance is claimed.
