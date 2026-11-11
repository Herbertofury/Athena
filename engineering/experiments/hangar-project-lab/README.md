# Hangar project and selected-version evidence

A bounded **offline Python experiment**, not a network collector, HTTP cache,
installer, runtime integration, or target-project recommendation. It processes
caller-supplied responses for a public Hangar project, a selected public version,
and an independently captured main page. It does not fetch anything.

## Contract

Load `metadata.py` using `importlib` (register the module in `sys.modules` before
execution, as the test does). Supply the frozen `Response` envelope:

- `request_url`, `final_url`: exact canonical HTTPS numeric-ID route;
- `captured_at`: timezone-aware ISO timestamp, caller asserted;
- `status`: integer HTTP status;
- `content_type`: JSON for objects, plain text for a main-page response;
- `body`: exact bytes, `byte_count`: their observed count;
- `complete`: explicit boolean transport-completion evidence.

Call `capture_project(response, project_id)`,
`capture_version(response, project_id, version_id)`, or
`capture_main_page(response, project_id)`. Accepted routes respectively are
`/api/v1/projects/{id}`, `/api/v1/projects/{id}/versions/{version_id}`, and
`/api/v1/pages/main/{id}` on `https://hangar.papermc.io`.
Aliases, query strings, search/list scopes, redirects, different origins and
noncanonical numeric IDs are rejected. There is no pagination or latest selection.

Every call returns immutable `Evidence`: `accepted`, `raw_body`, `record`, and
`receipt()`. Decoded records and receipts are fresh copies. Only a receipt is
publication-oriented: fixed outcome codes, canonical request identity, capture
metadata, byte count and body digest. It excludes third-party prose, namespace
names, arbitrary supplied URLs and all headers. The hash identifies supplied
response bytes; it does not authenticate the provider, a release, or a file.
Raw bodies and records are private in-memory evidence, **not sanitized exports**.
Persist them only under the applicable permissions and retention policy.

## Meaning and limits

- The entire object is retained in `record['source']`, including unknown fields,
  original URLs, dependency order, platform mappings, review/channel fields,
  counters and nulls. Exact original bytes remain separately available.
- Required object identity and `visibility == 'public'` must match the requested
  numeric IDs. Missing or non-public visibility fails closed. A main-page result
  is only an independent public-route body observation; it **does not establish
  project visibility** and cannot be used alone as an accepted public project.
- Namespace ownership is a namespace association, not a human identity. Project
  `avatarUrl` is projected as a project icon, not an owner or person avatar.
- Field states distinguish unknown/missing, null, empty and present. A separate
  main-page body never replaces a null project `mainPageContent`. Search/detail
  and list/selected captures must not be merged as if one atomic snapshot.
- Version names are provider display identities, not asserted semantic versions.
  A selected version ID does not establish an immutable external release.
- Platform and plugin dependencies, formatted platform ranges, review states,
  channel flags and unknown future values are preserved, not interpreted as
  executable compatibility, security review acceptance or install instructions.
- `externalUrl`, `downloadUrl`, and `fileInfo` retain independent states. External
  references are not resolved; an external path containing `latest` can change.
  Stored-file metadata and provider-supplied hashes are not verified file bytes.
  No download, digest verification, archive inspection or installation occurs.
- Markdown source text is preserved completely. The reused helper's ordered
  link/media projection is explicitly incomplete and fetches no media. Unsafe
  projected references are marked rejected, while raw text remains unchanged.
  Render raw content only with a separate safe rendering policy.
- Header data is deliberately not accepted or retained by this adapter. Transport
  collection and header-derived cache policy belong in independent receipts.
  An offline research capture is not permission to reuse it as an HTTP cache.

## Defensive bounds and outcomes

Limits are 1 MiB response bytes, JSON nesting depth 24, 20,000 tree nodes,
4,096 entries per collection, 262,144 characters per string/main page and
512 characters per JSON key. Original bytes within the limit remain available
on rejected outcomes. Oversized bytes are not retained or hashed. A byte cap does
not itself bound upstream acquisition; the caller must enforce transport limits.

Duplicate keys, non-finite numbers (including exponent overflow), surrogate
errors, malformed JSON, invalid known field shapes, identity mismatches,
unsafe structured URL fields, and incomplete/byte-mismatched envelopes reject.
HTTP 401/403/404/429/5xx and every non-200 result remain explicit failure evidence.
Each retry is a new observation; it does not replace an earlier failure.
There is no error fallback to empty successful content.

Reference projections remove query strings/fragments, reject credentials,
non-HTTP(S) schemes, local/private literal addresses and local hostnames.
This is a conservative reference filter, **not an SSRF-safe fetcher**: no DNS
resolution, redirect authorization or destination verification occurs. Unknown
URLs can remain in raw text; neither raw text nor a reference grants network
permission. Status, capture time and completeness are caller assertions, not
independently authenticated acquisition evidence.

## Validation and sources

Run from repository root:

`python -m unittest discover -s engineering/tests -p test_hangar_project.py -v`

The tests use **synthetic fixtures**, never captured provider prose. They cover
lossless source retention, independent body provenance, immutable access,
field states, public identity checks, external/stored metadata, future states,
malformed and duplicate JSON, URL rejection, response failures and bounds.
Actual captures and their sanitized replay receipts are separate evidence.

The schema was inspected against the official
[public OpenAPI document](https://hangar.papermc.io/v3/api-docs/public), including
`FileInfo`, `PlatformVersionDownload`, and `PluginDependency`, on 2026-11-11.
The reusable strict JSON, reference and Markdown helpers are in
[site extraction lab](../site-extraction-lab/README.md); they are unchanged.

Rejected alternative: flatten external references into one apparent downloadable
file or merge a fetched main page into project detail. Either would erase the
source's nulls and independent provenance and imply file/release guarantees
that the selected metadata cannot establish.

## Actual public replay and independent review

The [sanitized actual receipt](public-validation.json) records seven bounded responses: official schema and terms plus five project/search/version/page reads. Three singular objects/pages are replayed through this adapter. Project detail retains a null body while the independent main page holds 2,906 bytes; selected version 238 binds to project 14 and has three mutable external download references, all unverified. Search/list responses provide context, not complete collection support.

[Final validation](validation.json): 21 synthetic tests, three receipt-consistency tests, 1,003 engineering Python tests, 420 engineering/experiment Node tests and 13 independent tests pass. Root checks, build and all seven generator checks pass. The independent review found and reproduced a lone-surrogate JSON-key gap; UTF-8 key validation and a regression now reject it while retaining raw failure bytes. The earlier failure and an initial stale receipt-hash failure remain documented. No test was weakened or rerun for luck.
