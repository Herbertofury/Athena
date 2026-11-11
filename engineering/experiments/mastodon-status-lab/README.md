# Mastodon selected-status evidence gate

This offline Python experiment adds Mastodon status attribution to Athena's existing extraction foundation. It reuses the strict JSON decoder and ordered HTML-event extractor from [site-extraction-lab](../site-extraction-lab/README.md). It has no HTTP client, credentials, browser, account writes, renderer or application integration.

## Decision and contract

Bind one explicitly selected status to the HTTPS instance that supplied it. Preserve the original status and author, any nested boost/original distinction, exact source HTML, reply/edit/visibility/content-warning fields, and ordered media references. Optionally corroborate an embedded author against a separately captured public profile. This is evidence for adapter construction, not full Mastodon support or a target recommendation.

Load `statuses.py` with Python's importlib and call:

- `normalize(origin, status_id, observations, profile_join=None)`: the origin is a lowercase HTTPS origin without path, credentials, query or fragment. IDs are opaque nonempty strings, never numeric conversions. Each observation is exactly `{'role': 'status' | 'profile', 'body': bytes, 'http': int, 'complete': bool, 'redirected': bool}`. No string-to-boolean or number coercion occurs.
- The optional join is exactly `{'status_id': str, 'account_id': str}`. It names a status in the selected boost chain and its instance-local account. A match requires matching account IDs and nonempty valid absolute HTTP(S) profile URLs. It does not authenticate account ownership or a federation identity.
- `receipt(result)` returns a defensive copy of a normalization-time public whitelist. Everything else in the result is private source evidence, including failed captures, original HTML, prose, IDs, profile fields, media URLs and extensions. Do not serialize the complete result into a public log.

Multiple observations are retained, not silently overwritten. A partial, redirected, HTTP-error or malformed observation remains visible even if another attempt parses. Contradictory successful observations prevent an unqualified profile join. Missing observations do not imply success.

## Attribution, completeness and delivery

Instance-local status/account IDs, federation URI and canonical profile URL remain distinct. A boost's outer actor/event and nested original author/body retain separate nodes. Media attachment order is preserved; full-size `url`, scaled `preview_url` and `remote_url` are separate declared roles with missing, null, empty or declared states. No link is requested. A preview or link card never substitutes for original attachment delivery.

The exact source `content` string is independent of a lossy ordered-event projection. The existing helper can omit URL queries, invisible/ellipsis layout or other visual context. The adapter retains only the helper's event projection, not its serialized HTML or aggregated text. HTML parse failures retain the original source and report `projection_failed`. Treat source strings and events as untrusted inert data; neither output is a sanitizer or a rendering approval. The deleted-status redraft `text` field is not a fallback for missing content.

`field_states` preserves omitted versus explicitly empty content/media/reblog and other selected fields. Convenience empty attachment arrays do not establish a complete media list when the field was missing. A null `media_attachments` array is invalid schema, not an empty successful collection. Quotes, polls, cards and custom emoji are preserved privately with explicit extension states; their detailed behavior is unsupported. Missing/optional profile fields, migration and server-specific extensions stay in the bounded private source object.

HTTP 401, 403, 404 and 429 are separate states; 404 is `not_found_or_inaccessible`, never deletion. Redirects, partial responses and HTTP 206 are not normal successful captures. The caller must supply honest HTTP/completeness/redirect evidence; the offline normalizer cannot verify the request's origin, authorization or network history.

## Bounds

At most 16 observations and one MiB of total retained response bytes are accepted per call. Oversize captures retain a bounded prefix, original byte count and SHA-256 with `byte_budget`; their JSON is not parsed. Each decoded input is bounded to 20,000 nodes and depth 32, each boost chain to eight statuses, and each status to 32 attachments. Duplicate JSON keys, nonfinite numbers, malformed UTF-8/surrogates, wrong field types and duplicate chain/media identities fail closed. Caller envelope errors raise `Invalid`; provider capture failures remain result states.

The caller already holds each input byte string: byte limits bound retained/parsing work, not allocation of caller inputs or the full-byte hashing operation. These limits are defensive experiment parameters, not a measured performance claim.

## Actual replay and synthetic coverage

The [dated receipt](public-validation-2026-11-11.json) records three real anonymous captures: two selected public statuses and one profile, totaling 12,867 bytes. The statuses preserve 724 and 567 UTF-8 bytes of original HTML; the latter has four ordered image metadata entries with distinct original/preview roles. The profile joins the first status's author. No media bytes, access-restricted fixture, boost, edit or migration was captured live.

Raw JSON and headers are retained externally, not committed. The receipt has hashes, lengths, fixed states, role summaries and capture times, not raw prose, account handles, identifiers or delivery URLs. Stored-receipt tests check the artifact contract and implementation hash; they do not recreate the live read. Defensive boost, private visibility, malformed input, access failure, contradiction and privacy tests use explicitly synthetic fixtures.

From repository root:

```sh
python -m unittest discover -s engineering/tests -p 'test_mastodon*.py' -v
python engineering/scripts/check_research.py
```

Local tests do not establish browser layout, image decode, video/audio playback, feed pagination, complete account history, authenticated access, native follow actions, edit/deletion synchronization, compatible-server certification or application acceptance. See the [research record](../../research/2026-11-11-mastodon-statuses.md) and its eight official/public source entries for the decisions and limits.
