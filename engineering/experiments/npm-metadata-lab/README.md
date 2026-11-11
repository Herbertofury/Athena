# Offline npm metadata evidence gate

This experiment reads supplied captures only. It never contacts npm, fetches images or
archives, installs or resolves packages, executes scripts, or recommends a version.
It establishes an observed metadata relationship, not authenticity, compatibility,
license permission, artifact integrity, playback or application acceptance.

## Contract and use

Load `metadata.py` with its directory on `sys.path`, then call:

```python
from metadata import reconcile
report = reconcile(captures, package='is-number', version='6.0.0')
# Alternatively use tag='latest', never both selectors.
public_receipt = report.receipt()
```

Each capture is an exact builtin dict with required fields `request_url`, `final_url`,
`accept`, `status`, `content_type`, `body` (bytes), and `complete` (bool). Optional
`error` is a string. Unknown envelope fields are refused; capture timestamps and
transport headers can remain in a separate private acquisition manifest. Errors,
non-200 status, incomplete bodies, representation mismatches and identity failures
remain separate observations, never overwritten by later success. Structurally unsafe
inputs fail the entire call before snapshotting; they are not accepted observations.

Only HTTPS `registry.npmjs.org` package-root URLs without credentials, query or fragment
are supported; scope slash encoding is accepted. Both request and final URL must match
the exact requested package. A redirect to a different package or a selected-version
endpoint is retained as `provenance_mismatch`. URL checks are provenance consistency
checks, not evidence that the caller really obtained bytes from that server.

`accept` must be exactly `application/json` (full) or
`application/vnd.npm.install-v1+json` (abbreviated). Response media type, with optional
parameters, must match it. Mixed fallback Accept negotiation and version endpoints
are deliberately unsupported. Only HTTP 200 with caller-attested `complete=True`
can establish metadata. A supplied flag does not independently prove completeness.

Choose an explicit exact version-map key or a dist-tag pointer. No semver ordering,
range resolution, upgrade advice, latest-version recommendation or compatibility
inference is performed. The tag can change between captures. Same-representation
byte differences or different resolved versions increment `conflictCount`; this
conservatively includes harmless serialization/metadata variations. No timestamp
ranking or last-success-wins reconciliation occurs. Full versus abbreviated omission
alone is not a conflict, and cross-representation field-content comparison is not
implemented. Conflicts do not erase independently observed metadata.

## Scope and retention

Private `Report.observations` retain immutable exact capture and parsed document
snapshots, arbitrary publisher extension fields and the exact selected-version
object. Root and selected-version metadata stay separate. There is no fallback from
root description, README, author, license or maintainers into the selected version.
`author`, informational `maintainers`, and publishing `_npmUser` remain distinct.
Dependency strings are preserved, not resolved. Field-state labels distinguish
missing, null, empty, invalid and present; these are shallow shape checks, not full
npm schema or SPDX/license validation. Abbreviated card-field omissions are expected
representation omissions, not deletion or an empty field.

The pinned official detailed metadata contract says root README contains the first
64K of the README of the **most recently published** version. The older API overview
calls it latest; that wording is not a reliable join to the selected version or the
`latest` tag. Source README is preserved, but may already be truncated upstream.
A private Markdown projection reuses the existing shared `markdown_body` helper.
It is deliberately incomplete, not sanitized HTML or safe-to-render content. Its
references are never fetched. Helper failures preserve source and emit `projection_failed`
rather than failing the whole report. Projection is omitted above 65,536 characters while
the exact source remains retained. Selected-version README, when supplied, is kept
separately. A README's presence is not a complete documentation guarantee.

`receipt()` emits a fresh strict whitelist: schema, hashes, byte/capture/conflict
counts, fixed state labels and field-state maps, returned-version count, selected-version
hash, and separate README byte/hash/projection/media-count diagnostics. It emits no package/version/tag
identities, URLs, headers, prose, raw errors or publisher values. Hashes are equality
fingerprints, not anonymization against dictionary guesses and not archive hashes.
All six acceptance/verification gates are fixed false. Keep the report itself private;
only the receipt is designed for publication. Python object introspection or manually
forging a Report is outside this serializer's trusted-object contract.

## Bounds and limitations

At most 8 captures, 16 MiB per body, 32 MiB aggregate strings/bytes in the input tree,
300,000 tree nodes and depth 48. Exact builtin container/type checks happen before
copying; keys, strings and finite numbers are validated. Cycles, excessive nesting,
non-builtin containers, non-UTF-8 JSON bytes, duplicate JSON keys, nonfinite numbers and unpaired surrogates
are rejected. Raw bytes are bounded before parsing using the shared strict JSON
loader, then the parsed tree is bounded. This is not a streaming parser: peak memory
includes raw input, parsed data, immutable snapshots and bounded projections. Real
packuments can exceed these conservative budgets, so a refusal does not mean an npm
package is invalid. No measured memory or latency performance claim is made.

## Validation

Run from `engineering/`:

```sh
python3 -m unittest discover -s tests -p 'test_npm_metadata*.py' -v
python3 scripts/check_research.py
```

`test_npm_metadata.py` uses explicitly synthetic fixtures for scope separation,
role preservation, immutable snapshots, tag selection, representation omissions,
field states, provenance, retained failures, strict JSON, limits and receipt privacy.
Actual source replay and its acquisition manifest are separate from those tests.
Raw registry responses are not committed by this lab. This experiment is not a
production adapter and does not establish target-project adoption.

### Actual projection limitation retained

The supplied November 11 `is-number` full packument has four inline image markers
in its root README, but the inherited Markdown helper projects zero media references
for this capture (linked badge syntax is not fully recognized). This is retained as
an incomplete projection, not zero source images or evidence that media were fetched.
The README source hash and bytes bind the preserved input independently of the
projection. No shared parser behavior was changed to improve this result.
