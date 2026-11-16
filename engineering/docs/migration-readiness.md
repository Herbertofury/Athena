# Native migration readiness view

The compiled `/migration` page connects Athena's native Learning History,
Engineering, Foundry, Continuity and Guidance routes. Learning History links back
to it; the frozen packaged home navigation and manifest are not changed.
`/api/runtime` advertises the route. The page checks this local engine's response
separately from its embedded evidence snapshot. Engine availability is never
interpreted as completed migration.

The snapshot was reconciled against five published source documents at Athena
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
