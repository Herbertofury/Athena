# Offline Bluesky thread evidence

November 11, 2026. [Research and official contracts](../../research/2026-11-11-bluesky-threads.md) · [local public-form receipt](public-validation-2026-11-11.json) · [synthetic defensive tests](../../tests/test_bluesky_threads.py).

[threads.py](threads.py) normalizes supplied getPostThread JSON bytes for an explicitly selected DID post URI, descendant depth and ancestor height. It reuses the existing Bluesky post normalizer and strict JSON decoder. It makes no HTTP requests, reads no account, grants no access, changes no native social state and fetches no media.

## Real scoped observations

Three anonymous official AppView captures returned twelve post representations across nine distinct identities. At depth zero, the selected post had replyCount=6 with replies absent. At depth two, six immediate replies and two grandchildren were returned. A selected reply returned its parent without that parent's other children. These are different request scopes, not complete imports or evidence that absent arrays are empty histories.

Raw captures, response headers, text, handles, URLs and viewer metadata stay external. The committed-form receipt is only a prepared local artifact. No publication is implied. No blocked/notFound live fixture was encountered; tests for those cases are synthetic.

## API and private evidence

```python
from threads import normalize_capture, receipt

attempt = normalize_capture(
    already_captured_bytes,
    uri=explicit_did_post_uri,
    depth=2,
    parent_height=2,
    http_status=200,
)
public_form = receipt(attempt)
```

The caller supplies its actual request scope and observed HTTP status. This does not authenticate a network transcript. The private attempt retains exact bytes, decoded unknown fields and the existing normalizer's full body/facets/embeds. Never publish the private attempt. Repeated attempts can be kept together with normalize_captures, which returns each attempt separately rather than replacing a failure with a later success. It does not reconcile snapshots or prove history across requests.

Receipt output uses a fixed projection: input and identity hashes, lengths, request geometry, thread states/relationships, body and facet counts, supported media representation counts and explicit false acceptance gates. It excludes prose, handles, avatars, URLs, raw errors, unknown fields and viewer/threadgate content. Hashes remain linkable; this is data minimization, not anonymization or authentication. Treat the returned private data and public dictionary as mutable Python objects, not tamper-proof signed evidence.

This validates selected thread structure and relationships, not every lexicon field. Timestamps are retained strings rather than fully parsed dates; unknown ancillary metadata and threadgate content are not schema-certified. A normalized capture is not a claim that every field is valid.

## Scope and failure rules

- The outer returned identity must agree with the explicitly selected DID URI. Handle resolution is not attempted. Available descendants and ancestors preserve their own authors; the requested post is not necessarily the conversation's original root.
- Visible parent relationships and supplied reply root/parent references must agree, including a CID when the referenced visible post is present. Duplicate conflicting representations, sibling duplication and identity/reference cycles are rejected. CID tokens are opaque identities, not a cryptographic verification result.
- Visible posts, blocked posts, notFound observations and unknown future variants remain separate. A future variant without identity cannot establish request binding. NotFound does not distinguish nonexistent, removed or moderated content.
- Absent replies, empty replies and replyCount are separate observations. Matching counts, request bounds or a successful normalization never establish complete history. Authentication and moderation can change a view. Ancestor context need not include all that parent's children.
- Unknown embed variants, including a currently documented gallery type unsupported by the existing adapter, remain incomplete/unsupported. A video URL or image count is not media transfer, decode or playback.
- Bounded malformed responses and HTTP failures remain private failed attempts with static public error classification. Caller argument and byte-limit failures reject before capture retention. No automatic retry, fallback host or credentials exist.

## Bounds and reproduction

The local experiment permits one MiB per capture and up to eight captures per batch. It bounds JSON to 50,000 nodes/depth 64 and thread traversal to 256 nodes/depth 24. Integer arguments reject booleans; Unicode and finite-number checks apply to all parsed content. These are in-memory work limits, not service-wide limits or hostile-process isolation. The official parameter schema allows larger requested values, but the local parser will not traverse an unbounded response.

From repository root:

```sh
python -m unittest discover -s engineering/tests -p 'test_bluesky_thread*.py' -v
python -m unittest discover -s engineering/tests -p 'test_site_extraction_bluesky.py' -v
```

The raw public responses remain outside the candidate. Receipt contract tests verify the stored claims and implementation hashes; they cannot repeat an absent live capture. No browser, target workload, account-specific moderation, comprehensive history or performance acceptance is claimed. See the external handoff for retained review failures and final local check outcomes.
