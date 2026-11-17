# Startup challenger review

User goal: before continuing repository work, inspect comparable or stronger
implementations/features to learn from, reuse where permitted, compose and improve.
Athena should begin this check on startup. Existing COMPETITORS.md and Guidance
CHALLENGER_INTEGRATION_STANDARD remain canonical; no second ranking database.

## Implemented scope

After initial app rendering, an optional startup section loads independently. It
reads the bundled Software catalog and existing local active owned project goals.
It queues lexical candidate matches with source/license/evidence labels and source
check dates. Links open the existing native Software details/search. It never sends
project text to an external service, changes projects, installs anything, copies
candidate code, automatically adopts a candidate or claims one is superior.

This is an automatic **local reference review queue**, not a fresh Internet search
or live upstream/version/license verification. Missing matches remain an open
research need, not evidence that custom code is best. All queue rows are unreviewed.
The source catalog is the same existing generated catalog used by Software discovery.

The fetch times out at8 seconds; unavailable code/catalog yields a local notice and
never gates other workspaces. Catalog parse budget8MiB/5000 apps; review20 projects,
8 meaningful terms each,3 lexical matches per term and3 shown candidates per project.
Deferred coverage is displayed. Project processing yields between projects to avoid
one long startup task. Queue is session-only and regenerated once per app startup;
no scheduler or authoritative research receipt is claimed.

## Repository governance

Guidance release2.0.2 adds an explicit before-continuing bounded challenger pass to
the shared adapter and standard. Existing repository-owned instructions and stronger
requirements stay intact. This release does not silently update installed consumers:
they must use the established reviewed governance adoption path. Preserve versions,
licenses, provenance, target benchmarks and adopt/adapt/compose/reject/unresolved
reasons. Continue independent work when discovery is unavailable rather than stall.

## Remaining acceptance

Fresh upstream discovery requires an authorized backend/connector, network budget,
source adapters, cancellation and privacy boundary. Actual code inspection, license
reuse decisions and same-workload comparisons remain required for adoption. Native
startup queue does not complete those steps. Persistent review outcomes, broader
project coverage and direct task-scoped source refresh remain future work.

## Fresh public GitHub backend (explicit CLI, not automatic startup network)

`scripts/refresh_challenger_sources.py` is a callable Python backend and command-line
entry point for bounded live source metadata. It reuses existing URL-audit status
classification. It accepts only explicit public repository IDs or an explicit public
search query; it never reads goals, chat, local repositories or credentials.

```sh
python3 scripts/refresh_challenger_sources.py --repo rust-lang/rust --refresh --output new-review.json
python3 scripts/refresh_challenger_sources.py --public-query 'browser sidebar rust' --refresh --output new-search.json
```

The switch explicitly sends only those IDs/query words to GitHub. Fixed HTTPS API
host, no redirects, no authorization token, one-megabyte responses, up to three
repositories and four observations each (plus one discovery request), per-request
socket timeout and30-second request-admission budget. Socket timeouts are not a hard
whole-process deadline. Results distinguish denied/rate-limited/missing/unknown and
budget exhaustion without inventing an empty result or a license permission.

Receipts retain source URLs, observation times and response digests. Repository
identity/public visibility is checked before follow-ups. Commit SHA pins the license
observation; release tag/date is independently observed via GitHub's latest-release
endpoint, not assumed equal to the default-branch commit. `NOASSERTION`, missing or
custom licenses remain unreviewed. Source code is not downloaded/executed. Search
covers only the first three updated matches, not best-quality ranking or exhaustive
coverage. Output refuses overwrite. The native startup queue does not yet invoke
this backend or import receipts: both are explicit remaining integration work.
