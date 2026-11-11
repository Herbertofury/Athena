# Crossref singleton DOI-card evidence gate

An offline, bounded research experiment for **caller-selected DOI metadata**, not
an HTTP client, DOI resolver, search index, citation crawler, renderer, or target
application recommendation. It builds on the existing site's strict JSON helper
and declared `lxml>=5,<7` dependency without modifying shared extractors. Current
Crossref-developed [crossref-commons](https://gitlab.com/crossref/crossref_commons_py)
is a future transport baseline to compare, not something reimplemented here.

## Run and interface

From `engineering/`:

```sh
python3 -m unittest discover -s tests -p 'test_crossref_work.py' -v
```

Import `work.py` with this directory on `sys.path`, then:

```python
batch = reconcile(selected_doi, captures)
receipt = public_receipt(batch)
```

`selected_doi` is an exact builtin string. `captures` is an exact builtin list of
exact builtin dictionaries with `requestUrl`, `finalUrl`, `status`, `headers`,
`complete`, and `body` (exact bytes). Optional `error` is a transport error: missing,
null, or an empty string means no reported error; a nonempty string fails even for
HTTP 200. Other types produce `invalid_transport_error`. Extra JSON metadata is
retained privately. The caller materializes files; this module does not read body
paths, send HTTP requests, follow links, or write receipts. `bodyFile` is only inert
metadata if supplied.

The public API is `reconcile` and `public_receipt`; lower-level helpers assume the
validation sequence used by `reconcile`. Invalid caller types, cycles, or resource
caps abort before any snapshot is made. Valid bounded capture inputs with source
failures produce immutable `Observation` entries with static error codes, full
private capture evidence, body byte counts/hashes, and `card=None`. A failed body is
not parsed or discarded. Success never removes earlier failures. Differing
successful raw body hashes set `conflicting=True`; this conservative signal can
include formatting/envelope differences and does not claim semantic contradiction.
Identical repeat observations also remain. No author lists or records are merged.

Each successful `Card` privately contains:

- Original selected and source DOI strings, complete frozen envelope including
  unknown fields, request/final URL and transport evidence on its observation.
- All known title variants (`title`, `subtitle`, `original-title`, `short-title`,
  `container-title`, `short-container-title`) without unescaping/flattening. Unknown
  future variants remain in the raw envelope. Author objects preserve exact order,
  names, affiliations, ORCID strings, and unknown fields. None establish identity.
- Exact raw abstract and a separate **incomplete diagnostic** projection.
- Separate `published`, `issued`, `published-online`, `published-print`, `created`,
  `deposited`, and `indexed` date objects. Valid date-part rows retain year, month,
  or day precision. Date validation temporarily uses default calendar components
  only to validate a partial date; no invented component is stored. Date-time strings
  and numeric timestamps remain independent source values. Timestamp units are not
  assumed or converted; indexing never establishes publication recency.
- Directional `update_to` / `updated_by` objects preserving DOI, type, source, label,
  and typed updated date, plus raw objects. A correction is not automatically a
  retraction. Typed relations retain relation name, `id-type`, `id`, `asserted-by`,
  order, and raw data. Assertions from `object` or `subject` are not verified edges.
- Deposited licenses retain URL, content version, start date and delay; resource
  links retain URL, MIME, intended application and content version. These are
  **unverified pointers**, including unsafe/non-HTTP strings if deposited. Never
  pass them to a renderer/fetcher without independent validation and authorization.
  A license deposit is not a grant of reuse rights and a link is not retrieved text.

`Field(state, value)` distinguishes `missing`, `null`, `empty`, `invalid`, and
`present`. Present typed date objects carry independent parts/date-time/timestamp
states. An empty object stays `empty`; malformed optional metadata stays `invalid`
with its frozen original value instead of rejecting the whole DOI record. Required
DOI/envelope/transport failures do reject the card. Dataclasses are frozen and nested
JSON maps/lists become mapping proxies/tuples, so caller mutation cannot rewrite
prior evidence. Do not serialize the private dataclasses as a public report.

## Supported subset and limits

Only an exact HTTPS authority `api.crossref.org` and `/works/{doi}` path are allowed.
No credentials, explicit ports, query (even an empty `?`), fragment, redirects,
nonofficial host, or DOI resolver route. Request and final URLs must be identical.
The supported DOI subset is ASCII `10.` plus 4–9 digits, `/`, and 1+ printable
non-space ASCII suffix characters, excluding backslash; maximum 2,048 characters.
DOI comparison folds only ASCII case. Original strings are preserved; punctuation
is never trimmed. Endpoint paths receive **one** strict UTF-8 percent-decoding pass
before comparison; selected DOI strings are never decoded. `%252F` becomes literal
`%2F`, not `/`. This is a conservative route/identity subset, not universal DOI
syntax validation or a claim that identifiers exist.

Acceptance requires integer HTTP 200, literal `complete=True`, JSON content type
(optional explicit UTF-8 charset), no duplicate case-insensitive header names,
UTF-8 bytes, envelope `status="ok"`, `message-type="work"`,
`message-version="1.0.0"`, an object message and matching DOI. Other message versions
need deliberate support, not guessed compatibility. Explicit UTF-8 decoding rejects
UTF-16/32 and BOM; strict JSON rejects duplicate keys, NaN/infinity and surrogate
strings. A response is still caller-supplied evidence, not proof of provenance.

Limits: 32 captures, 2,000,000 body bytes per capture, 8,000,000 body bytes per batch,
100,000 JSON nodes and depth 48 per validated object, 100,000 UTF-8 metadata string
bytes per capture. JSON strings/keys are also byte-bounded, integers have a 4,096-bit
cap, and only exact builtin JSON types are accepted before copying. Parser recursion
failures become source failures. XML has the same depth/node ceilings plus libxml's
normal non-huge parser limits. No installation or network use occurs in this module.

## Abstract projection boundary

Raw source is authoritative. Plaintext is recorded literally. Markup is interpreted
as an XML fragment inside a **local wrapper declaring the `jats` prefix** as
`http://jats.nlm.nih.gov`; this explicitly supports Crossref fragments whose prefix
is otherwise unbound. It does not mutate the source, prove its namespace, or claim
canonical JATS conformance. Existing explicit namespace declarations retain their
own interpretation. The projection is ordered start/text/end events with attributes;
unknown math/media elements are retained, as are opaque comments/processing
instructions. It is not a flattened text extractor and does not silently erase
unsupported media. Malformed fragments, unknown entities, depth limits, and even
unexpected XML helper failures retain the raw abstract with `projection_error`.
DTD/entity declarations are rejected before parsing. Entity expansion, DTD loading,
network access, recovery and huge-tree mode are disabled. Do not render projected
attributes, URLs or text as trusted HTML. `complete` and `safe_render` are always
false, including for plaintext. There is no complete-media or safe-render claim.

## Public evidence boundary

`public_receipt` constructs a whitelist rather than redacting a private dump:
body/selected-DOI/request/final URL hashes; body byte counts; bounded exact HTTP status
and capture completeness; fixed error codes; per-field states/counts; abstract
hash/bytes/projection state; typed date precision/state. No DOI strings, source URLs,
headers, prose, names, affiliations, ORCID, date text, arbitrary relation labels,
license pointers, transport error text or unknown fields leave the boundary.
All acceptance gates are fixed false: author identity, full text, rights,
publication recency, safe rendering, complete media, and target acceptance.
`acceptedSingleton` means only that this captured envelope passed this local gate.

## Evidence and limitations

The unit tests are **synthetic fixtures**, covering identity, hostile types/cycles,
limits, UTF-8, duplicate keys/nonfinite/surrogates, failures/conflicts, immutable
snapshots, date precision, typed directional updates/relations/pointers, XML order,
DTD rejection, parser fault injection, and receipt privacy. They do not establish
live service availability or general content coverage.

An actual offline replay on 2026-11-11 used three previously captured public HTTP
200 responses, totaling 76,436 bytes. All three passed the singleton gate:

| Capture | Body bytes | Abstract bytes | Authors | Links | Licenses | Relations |
|---|---:|---:|---:|---:|---:|---:|
| Software citation principles, `10.7717/peerj-cs.86` | 15,425 | 1,039 | 4 | 4 | 1 | 4 |
| SciPy original, `10.1038/s41592-019-0686-2` | 52,592 | 569 | 112 | 3 | 2 | 6 |
| SciPy correction, `10.1038/s41592-020-0772-5` | 8,419 | 118 | 35 | 3 | 2 | 1 |

All abstracts required the local JATS wrapper interpretation. Software citation's
2016 publication remained separate from 2026 indexing. SciPy's 2020 publication
remained separate from 2026 indexing. The original's `updated-by` correction and
the correction's `update-to` original remained reciprocal directional observations,
not a self-retraction or merged author list. Correction print date retained month
precision `[2020, 3]`; online date retained `[2020, 2, 24]`. No linked media or full
text was fetched. Raw captures remain private; the companion receipt/research note
records sanitized evidence independently from these synthetic tests.

Current primary guidance: [REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/),
[usage tips](https://www.crossref.org/documentation/retrieve-metadata/rest-api/tips-for-using-the-crossref-rest-api/),
[updates](https://www.crossref.org/documentation/register-maintain-records/maintaining-your-metadata/registering-updates/),
and [relationships](https://www.crossref.org/documentation/schema-library/markup-guide-metadata-segments/relationships/).
Historical `CrossRef/rest-api-doc` schema examples are compatibility references,
not authoritative current required-field or timestamp-unit guarantees. This
experiment does not change another project or establish an accepted adapter.
