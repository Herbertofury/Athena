# Modrinth adapter research

[Adapter laboratory](README.md) · Reviewed October 26, 2026

## Current route

Most public metadata requests need no token. Use canonical IDs, an identifiable User-Agent and provider limits; keep private operations separate.

## Reuse before replacement

The bounded Rust public-project adapter is the baseline. Expand official metadata/media fields and established tests, not a parallel scraper.

## Acceptance workload

Project identity; gallery order; originals/previews; version IDs; malformed/oversized responses; rate limits; failed-refresh preservation.

## Evidence status

Live metadata collection, durable receipt and all six returned gallery entries/original URLs tested. Long description text is now retained verbatim when present; parsing or playing its linked media remains outside the implementation. No recommendation transfers to a project until it beats that project's actual baseline without sacrificing requirements.

[Primary platform reference](https://docs.modrinth.com/api/) · [Shared collection contract](contract.md)

## Bounded batch lane · 2026-10-27

An optional Rust CLI collector uses the official multiple-project API with 1–20 canonical IDs, the existing 2 MiB total response budget, transport guards, explicit missing IDs and atomic snapshot/attempt writes. Five real public comparisons retained identical typed gallery/metadata projections with one request instead of three. Timing was mixed (batch faster in three pairs), not a universal speed claim. The local Collection form and queue now support the same bounded batch. Separate loopback checks verified real results, security guards and reopened durable output; visual browser acceptance is not claimed. [Raw evidence and scope](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/modrinth-batch-lab/README.md).

## Long description retention · 2026-10-27

[Measured body-projection study](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/body-projection-lab/README.md) preserves all earlier fields and exact long-form text in three public responses and reopened snapshots. The added data costs a small measured parse increase; it is not a speedup or proof of lag-free cards. Missing/legacy text stays unknown, markup is inert, and linked media are not fetched or executed.

## Public version/file metadata · 2026-10-27

The optional CLI now collects 1–20 official version records using the existing bounded transport. Original per-version JSON retains files/hashes, dependency metadata, compatibility, changelog and unknown fields without fetching or executing file links. Separate atomic snapshots preserve last-good data on missing/failed refreshes. Three public records survived exact payload save/reopen, a missing ID retained prior generations, and injected transaction failure rolled back cleanly in fixtures. This is coverage expansion, not a measured speedup or file-safety certification. At the original CLI review, the queue/form did not expose this lane. The queued follow-up is documented below; authenticated and exhaustive catalogue coverage remain unimplemented. [Evidence, source and limitations](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/modrinth-version-lab/README.md).


## Queued version workflow · 2026-10-27

The local Collection form and queue now reuse the existing official version client and complete raw snapshot store. A small hash/generation receipt avoids copying or rounding provider content in the UI result. Three real public versions, an explicit missing-ID refresh and a subsequent saved-record experiment passed 32 HTTP checks; 47 saved-runner regression checks also passed. Earlier generations remained intact. Native-browser interaction is still unverified, and no speedup or parser promotion is claimed. Snapshot and queue-finalization transactions are separate, so crash recovery can repeat a public read and append another snapshot. [Exact source and retained evidence](https://github.com/Herbertofury/Engineering-Atlas/tree/00ca25218cce535df15eb03c502c7fde2ed4dc8e/experiments/version-collection-queue-lab).

## Single-project request binding · 2026-10-27

The Rust single-project client and snapshot store now bind the returned canonical ID/current slug to the requested identity before accepting data. Three generated mismatches previously created successful stored attempts; all now fail before writes. Canonical IDs keep exact case, slugs accept ASCII case differences, and eight-character slugs still work. Last-good snapshots are preserved.

Three retained public responses preserve the complete existing typed projection across canonical and slug request forms. Local checks passed: 86 Rust unit tests, four persistence integration tests, 74 Python and 85 JavaScript tests, formatting, Clippy and site asset checks. This is offline correctness evidence, not new live collection, arbitrary-field completeness or a performance claim. [Reproducer, raw before/after evidence and pinned upstream lookup source](https://github.com/Herbertofury/Engineering-Atlas/tree/03f10eeca4c2eced6bb33d97dbdd3e695a8ae000/experiments/project-identity-lab). [Exact-commit CI](https://github.com/Herbertofury/Engineering-Atlas/actions/runs/40597057179).

## Complete received project JSON · 2026-10-28

[Optional CLI, immutable envelope, tests and raw cost receipts](https://github.com/Herbertofury/Engineering-Atlas/tree/c610c81bc0c947f7f1d979e67a5da6eb1f888df3/experiments/project-raw-lab). The new complete-response lane reuses the existing official client, request binding, two-MiB budget, transport guards and atomic FULL-policy snapshot store. Original UTF-8 JSON stays local, including unknown fields and absent/null/empty distinctions. A separate provider namespace leaves legacy projection and queued workflow behavior unchanged; no migration or deletion occurs.

Three retained real public responses each contained 29 additional top-level fields beyond the small projection, including license and compatibility metadata. Every previous projected field matched, and every original byte survived save/reopen plus failed refresh. Twelve measured pairs per response followed four retained warmup pairs. Storage grew, and write costs were mixed: complete-path median write/commit costs were about 1.772, 1.922 and 1.676 ms. Outputs differ in coverage, so this is a cost report, not a fair speed ranking. Exact source and harness hashes accompany final receipts.

Implemented and tested locally: the optional single-project CLI, private validated envelope, storage/readback, six new parser/persistence/rollback checks and an invalid-CLI-input gate. Local regression passed 91 Rust unit tests, five persistence integration tests, 95 Node and 74 Python checks. No new provider requests or credentials were used in this pass. Fresh network execution of the new CLI coordinator, queued/native UI coverage, linked-media completeness, peak memory and power-loss durability remain unverified. The full received response is not all project content or authenticated platform coverage. No other-project recommendation follows. [Exact-commit CI](https://github.com/Herbertofury/Engineering-Atlas/actions/runs/40615874523).

## Queued complete-response archival · 2026-10-28

[Implementation, retained-data integration and 45 loopback checks](https://github.com/Herbertofury/Engineering-Atlas/tree/9a2c8b0943b5eba078840757fa18494bf886e06b/experiments/project-archive-queue-lab). The native Collection form now exposes a fixed single-project archive job, reusing the existing serial worker, request guards, immutable envelope and snapshot store. Original JSON remains local; Overview receives only a 468–469 byte receipt in the measured retained-data cases. Legacy projection and version collection stay available.

Three retained public responses passed actual queue/coordinator completion with a fixture-supplied fetch, then three failed refreshes preserved last-good bytes. All 45 real loopback checks passed, including exact compiled UI asset bytes and Host/Origin/request-marker/size/schema controls. These checks did not submit an accepted provider request. Native-browser clicks and fresh successful worker-to-provider execution remain unverified; snapshot commit and job finalization are separate, so exactly-once collection is not claimed. No remote listener, credentials or raw-payload HTTP endpoint was added.

Local regression: 95 Rust unit tests, five persistence integration tests, 96 Node and 74 Python checks. Exact 21 remote files, Linux/Windows CI and Pages deployment were verified. This is workflow/data completeness, not a performance promotion or another-project recommendation. [Exact-commit CI](https://github.com/Herbertofury/Engineering-Atlas/actions/runs/40619358695).

## Exact readback and selected real-browser checks · 2026-10-28

[Bounded read API, actual reader and 73 localhost checks](https://github.com/Herbertofury/Engineering-Atlas/tree/9dbe9e82fc48d3459f469755f5879f7fdcb0c52b/experiments/project-archive-view-lab). The saved-response inspector verifies identity, string generation, bounded UTF-8 bytes and hash without parsing/re-serializing provider numbers. Markup remains text, downloads use original bytes, and cancellation/stale/failure paths retain the prior verified selection. A database-size preflight also preserves valid UTF-16 database records; this is bounded-read protection, not a peak-memory measurement.

[Actual cloud-desktop Chromium follow-up and label repair](https://github.com/Herbertofury/Engineering-Atlas/tree/690a5993c05cb7c34f1872d6a52235363c1a53b0/experiments/job-label-lab). The real dialog preserved generation 9007199254740993 and future integer 18446744073709551617. Its generated download matched all 217 stored bytes; a retained public Sodium download matched all 12,840 original bytes. A corrupt-record error preserved the previous verified dialog. Overview had mislabeled archive jobs as deduplication experiments; an explicit operation discriminator now names them correctly and leaves unknown jobs unrecognized rather than inventing an experiment type.

One actual form submission attempted fresh unauthenticated public collection, but failed to connect. Job 7 remained failed and prior generation 1 stayed intact. This is a retained failure, not fresh-provider success. No tunnel, broader binding, account grant or bypass retry was introduced; the owned loopback test server was stopped. Selected real-browser controls now have evidence, but Windows, every UI control, peak memory/full UI latency and successful fresh collection remain separate gates. Original third-party response bodies and databases stay private.

## October 28 research expansion

[Current platform-family research](mod-hosts.md) adds author/avatar attribution, full body/media/files, follow/import distinctions and current interface limits. [Coverage catalog](coverage-catalog.md) and [authenticated fixtures](authenticated-research.md) describe the remaining work. This update preserves the evidence status above; it does not broaden an earlier narrow success or erase a failure.
