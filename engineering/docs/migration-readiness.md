# Native migration readiness view

The compiled `/migration` page connects Athena's native Learning History,
Engineering, Foundry, Continuity and Guidance routes. Learning History links back
to it; the frozen packaged home navigation and manifest are not changed.
`/api/runtime` advertises the route. The page checks this local engine's response
separately from its embedded evidence snapshot. Engine availability is never
interpreted as completed migration.

The original snapshot was reconciled against five published source documents at Athena
commit `12ebe1e06707bdc1febd3369a43221e62c332f78`. Every evidence link pins that
commit. Dated 2026-11-14 audits retain their date, explicit omissions and limits;
they are not silently promoted to current verification. The later native Learning
History implementation is linked separately. Constellation's reconstructed
0.20.1 baseline and incomplete staged 0.20.2 recovery remain distinct. Guidance
consumer coverage is scoped, not fleet-wide adoption.

This is a read-only evidence index and usable workspace navigation, not a new
source audit, parity proof, complete backlog or source-retirement certificate.
`retirement_certified` remains false and every source has explicit open gates.
There is no delete, archive, permission, install, restore or remote-refresh action.
The page makes no external fetches; source links open only when the user chooses
one. Its hash identifies the embedded snapshot, not evidence authenticity or
current upstream state. Snapshot changes require reviewed repository updates.

Tests pin source URLs, permit only known workspace routes and recorded/open states,
require all sources to retain open gates, and reject a certification assertion.
Actual portable Chromium acceptance navigates Learning History → readiness →
Learning History, checks four source cards and seven pinned links, verifies exact
snapshot bytes/hash, absence of action buttons, no browser mutation requests
during the dedicated readiness visit, POST refusal and narrow-screen overflow. Screenshot inspection is
separate from automated acceptance. Source repositories remain preserved.

## November 28 Foundry evidence

The source snapshot now pins `4e67e381b43eefd7424afe4fa9c1aad853343003`.
Its reviewed legacy-import evidence distinguishes a hash-pinned partial
import, exact soundtrack verification by room, and an optional local event
archive. All were tested with synthetic inputs on hosted Windows and Linux.
Owner data, custom catalog/media fidelity, rights, unsupported formats and
any source-retirement decision remain open.


## Review a selected Constellation v7 backup

Open **Review a saved Constellation export** from the native Migration readiness
page. Select plain JSON or one gzip member. The file is sent only to the local
Athena engine; selected and expanded data each have a 16 MiB limit. The engine
returns counts and reference diagnostics without writing the file or using a
provider. Filter missing, capped or incomplete collections and optionally save
the count-only receipt. Compare the current result to an unchanged Athena receipt
in the same page; zero and not recorded stay distinct, and fingerprints are
compared only when both review receipts include the corresponding type. The
earlier receipt remains browser-local. Fingerprints are excluded unless requested.
 This page
does not import or restore content, or certify a source for deletion.


### Stage a selected workspace project as a private candidate

Use `atlas-lab stage-constellation-projects EXPORT RECIPE CURRENT_PROJECTS NEW_CANDIDATE`
with stopped, local copies. To pin inputs, use the SHA-256 of the exact selected
export file (including compressed bytes if gzip) and the exact file downloaded by Projects’ **Export projects** button. Do not
reformat that download. Save or export any open draft before staging. The recipe is a private JSON object with `schema: 1`, `sourceSha256`,
`destinationSha256`, `namespace` (stable for this Constellation workspace),
and an ordered `selected` array (1–24). Each row has the exact source `id` and
an operator-chosen `stage` and `ownership` valid in Athena Projects. Only live
workspace project names and exact update timestamps are projected. This
shape is based on [the pinned Constellation workspace source](https://github.com/Herbertofury/Project-Constellation/blob/4fe8980f8caad979eb42dd47d64fa33190d25a2b/extension/background.js).

The command refuses ambiguous source IDs, already-present destination IDs,
changed input digests, inferred stages, deleted projects, and provider mirrors.
Descriptions, notes, chat text/URLs, source IDs and approval ledgers are not
copied. The selected names are still private. Secure the recipe and candidate
in an operator-controlled folder; Windows uses that folder's access rules.
No existing file or live Athena data is modified. Any failed write may leave
a partial new file; never import that file. In Athena Projects, choose **Import backup** and select the staged file. The
reviewer checks the destination digest against the current Projects export bytes
before opening the preview. Review names, ownership, stages and timestamps;
confirm to add only the selected metadata, or cancel without writing. If the
destination changes, export and stage again. Athena will also refuse to save
over competing edits from another tab. Keep both originals. The destination
fingerprint is a freshness check, not a signature, and is not stored in Projects.
Ordinary Projects backups are still imported through the existing review flow.
