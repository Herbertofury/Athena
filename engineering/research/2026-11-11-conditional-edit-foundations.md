# Conditional-edit foundations research

## Inspected baseline and gap

Main `44384b809c80e03adbd62f8be9617d01e6ad9922` contains guidance about validators, request identity and partial downloads but no executed stale-edit/If-Match experiment. Checked the existing web/security, application study, concurrency and storage material and current research drafts #27–34. Retry/idempotency #32 concerns operation identity; file-ingestion #33 concerns filesystem identity; neither tests replacement preconditions over HTTP. The new branch is independent and based on the same exact main, with 1,549 Engineering baseline blobs verified before edits.

## Contribution

- [Practical guide](../docs/conditional-edit-foundations.md): edit-base ownership, cache representation retention, conflict review, costs and target acceptance boundaries.
- [Original executable lab](../experiments/conditional-edit-lab/README.md): SQLite-backed single-document conditional writes plus real owned-loopback requests.
- [Five primary-source records](../data/sources.d/conditional-edit-20261111.json): CE26001, CE26002, CE26003, CE26004, CE26005.

The sources are RFC 9110 (June 2022), RFC 6585 (April 2012), RFC 9111 (June 2022), the Python 3.12 http.server documentation (rendered 3.12.16), and SQLite transaction documentation. Relevant sections were opened and read on 2026-11-11. Stable standards supply behavioral constraints; publication recency is not evidence of suitability or speed. Implementation code is original, not copied from an article or another project.

## Acceptance and observations

Predeclared invariant: two writers presenting one old strong validator must yield exactly one replacement/history append; stale, weak and missing conditions must not mutate state. Preserve exact accepted representation bytes; couple version comparison, mutation and history within one transaction. Include a wildcard negative control rather than claiming every conditional request prevents overwrites.

Initial 36-test suite passed. Independent review confirmed atomic writes, framing and condition ordering but highlighted that response transport can fail after commit. The original handler could attempt an error response after a failed success response. It was hardened to attempt a response only once and a new real-HTTP injected-response regression verifies the commit remains present after disconnect. This is a review-driven hardening finding, not a claim that the initial suite failed. Both logs are retained.

Final focused suite has 37 passing tests in normal and optimized Python. Six fresh-database demonstrations pass using actual loopback sockets with complete retained exchanges. The database concurrency test uses two connections in five rounds; server requests themselves are synchronous. Independent code review also exercised eight same-base writers. See the review artifact for exactly what the reviewer ran.

No lost-update guarantee is claimed for wildcard writes. No power-loss, backup restore, browser/proxy cache, authenticated multi-user, production load, real application or target-project improvement result exists. The minimal client cache model is not a browser substitute. No merge, deploy, application API change or automatic conflict resolution is included.

## Validation and integration

The [validation summary](../experiments/conditional-edit-lab/validation-summary.json) distinguishes local passes from the unchanged main link-check failure in `apps/atlas-lab/README.md` pointing to `../../../docs/athena-local-runtime.md`. No check is weakened or waived. Root CI excludes Engineering-only changes; exact publication-head runs, checks and statuses must be verified separately and cannot be inferred from local results.

All existing Engineering files remain byte-identical except one additive source-index entry. Later integration must union this fragment with other drafts, retaining the baseline file first and sorted additions. Active integrated-release, Foundry, Windows snapshot, held material, existing draft content, workflows and private sources are untouched.
