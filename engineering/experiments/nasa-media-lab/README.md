# NASA selected-media evidence laboratory

[Adapter guide](../../docs/adapters/nasa.md) · [Dated research](../../research/2026-11-11-nasa-media.md) · [Actual observation receipt](public-validation-2026-11-11.json)

This isolated Python module normalizes already-captured responses from the NASA Image and Video Library. It reuses the strict JSON decoder in the existing [site extraction laboratory](../site-extraction-lab/README.md). It makes no requests, follows no references, downloads no media and changes no application runtime.

## Input and ownership

`media.normalize(nasa_id, observations)` accepts a bounded literal selected ID and an exact list of response dictionaries. Each dictionary has:

- `role`: `search`, `asset`, `metadata-location` or `caption-location`.
- `request_url` and `final_url`: the exact request and final response locations.
- `status`: an integer HTTP status, with booleans rejected.
- `complete`: an explicit boolean indicating a complete body.
- `body`: response bytes. Optional `failure` records a transport failure.

The caller owns collection, permission checks, safe transport and redirect policy. The module checks the documented API host, HTTPS request transport, selected ID, operation and query scope. It rejects redirected/final-mismatched, incomplete, oversized, malformed and wrong-identity attempts. A returned HTTP collection href is preserved separately from the actual HTTPS request and is not followed or treated as a redirect.

The returned `Evidence.observations` is private normalized evidence. It includes bounded body prefixes, strictly decoded source JSON, original descriptions and other fields, per-attempt states and issues. It must not be used as a public export. `Evidence.receipt()` returns a copy of a fixed sanitized snapshot containing only supported role/state labels, counts, hashes, byte lengths, contradiction flags and false acceptance gates. Neither later private-evidence edits nor receipt edits affect that snapshot. Unknown envelope extensions are not traversed or copied.

## Roles and completeness

Search is a selected query page, not the complete catalog. Preserve source fields separately, including description versus description_508, publishing center versus photographer/secondary creator, and declared link rel/render. Mixed, duplicate and wrong selections stay explicit. Missing, null and empty source fields remain distinguishable in retained evidence.

An asset response is an ordered manifest of references. Reference strings are classified as NASA, external or unsafe, never dereferenced. Classification is diagnostic and grants no permission or authenticity. The metadata and caption operations return location pointers only; even an observed pointer does not establish file contents, transcript completeness, playback or rights.

The actual captured video example has an empty selected search while its manifest and caption location remain available. This discrepancy is deliberately preserved. Empty search results do not imply deletion, and a successful later attempt never erases an earlier failure. Different observations of the same role are conservatively marked contradictory; this flags a need to inspect their request and timing, not proof that the service is inconsistent.

## Bounds and unsupported cases

At most 32 envelopes are visited. Body retention is capped at 128 KiB per response and 512 KiB total. JSON has a 24-level nesting limit, 12,000-node limit, 1,024-element array/object limit and 16 KiB per-string UTF-8 limit. Duplicate JSON keys, non-finite numbers, invalid UTF-8, surrogate strings and exceeded limits cannot become accepted metadata. Oversized bodies retain a bounded prefix plus full-body hash and size; caller allocation and full-body hashing work are outside retention budgets. Extra attempts are counted without traversing their contents.

The initial identifier contract intentionally accepts only 1–256 ASCII letters, digits, underscores or hyphens; it does not claim every future NASA identifier is supported. The module does not prove collection completeness or server version from a version string. Unknown source fields and versions remain in private evidence for review. A source hostname, filename extension, successful JSON response or SHA-256 digest does not prove media authenticity, usable media bytes or licensing.

## Offline reproduction

From the repository root:

```sh
python -m unittest discover -s engineering/tests -p 'test_nasa*.py' -v
python engineering/scripts/check_research.py
```

Tests use synthetic source records and a stored sanitized receipt. The six real response bodies and headers remain outside the repository. Their hashes and byte counts are retained in the receipt, tied to the exact implementation hash. Stored-receipt tests verify that record, not current network availability. No credentials, private fixtures, scheduled requests, media processing or target project adoption are included.
