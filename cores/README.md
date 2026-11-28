# Shared cores

Reusable capability names describe their function. Athena hosts and maintains the
source; consumer products keep their own names, interface, configuration and data.
No application needs an online Athena service to start or read its saved content.

| Core | Source responsibility | Acceptance boundary |
| --- | --- | --- |
| [feed-core](feed-core/README.md) | Feed records, source choices, filtering, lexical ranking, portable preferences and feed import/export; Python collection adapter | Node contract fixtures pass; INTA is the first integration target. Full independent second-host acceptance remains open. |
| [ticker-core](ticker-core/README.md) | Content-neutral scrolling timing, pause, motion/focus/visibility lifecycle and cleanup | Deterministic lifecycle fixtures pass; actual browser harness is included and runs in CI. Consumer layout acceptance is separate. |

The [shared capability registry](../guidance/registry/shared-capabilities.json)
remains the single portfolio routing index. Existing download, request-coalescing
and web-extraction capabilities remain at their current owners; these cores do not
replace them or introduce another framework. See the
[reuse policy](../docs/REUSABLE-PACKAGE-COORDINATION.md).

## Consume a pinned copy

Pin an exact source commit and SHA-256 digest per source file in the consumer's
dependency manifest. Bundle those exact bytes locally; preserve authorship and source provenance,
run the core tests and the real consumer acceptance, and retain the prior digest
for rollback. A byte match establishes provenance, not application compatibility.
Change reusable behavior here, then update consumers through reviewed dependency
changes. Do not silently fork generic logic inside a product page.

## Verify

```sh
node --test cores/feed-core/tests/*.test.cjs cores/ticker-core/tests/*.test.cjs
python3 -m unittest discover -s cores/feed-core/python -p 'test_*.py'
node cores/feed-core/benchmark.cjs
node cores/browser-check.cjs
```

The first command runs JavaScript contract tests, the second runs Python collection
fixtures, the third measures full-output lexical ranking, and the fourth uses the
repository's Playwright development dependency and an installed Chromium browser.
`CHROMIUM_PATH` can select an explicitly installed test browser. No test contacts
news publishers or sends articles to third-party AI services. The scheduled
[shared-core workflow](../.github/workflows/shared-feed-cores.yml) detects runtime
drift; a scheduled workflow is subject to GitHub runner and scheduling availability.

The current packages are reusable implementation candidates, not a claim of
complete GameSync parity or a universal autonomous repair system. Each real host
must accept its own publication, storage, synchronization, accessibility and
offline behavior before those capabilities are advertised.

## Licensing

These private packages are marked `UNLICENSED`: no public redistribution license
has been established for the new source. Repository ownership is unchanged.
A repository owner must choose any future package license explicitly; reference
implementations retain their own licenses and were not copied into these cores.
