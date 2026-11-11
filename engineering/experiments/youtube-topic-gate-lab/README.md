# YouTube topic response: RSS envelope rejection

## Observed defect and bounded repair

On 2026-11-11, one authorized GET of the official documented YouTube topic
`https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC_x5XG1OV2P6uZZ5FSM9Ttw`
returned HTTP 200 and 463 bytes. The supplied capture is an Atom subscription-topic
descriptor: root `{http://www.w3.org/2005/Atom}feed`, zero entries and no channel ID.
This is **not evidence that the channel has no videos**, or that current uploads,
history, pagination, entry mappings or media access work. No Atom collector,
subscription, account access, polling client or runtime integration was added.

The existing RSS extractor at baseline commit
`7ba88d30229f3073c9aa738f087b9199ffae16ae` searched `./channel/item` under any XML
root. Replaying the actual supplied bytes returned `[]`. That was a false empty
parser success, not collection acceptance. [before.json](before.json) retains that
outcome. [after.json](after.json) records the same bytes explicitly rejected with
`ExtractionError`. Both retain input length, SHA-256 and extractor hash without
publishing response prose or private capture paths.

The repair is confined to `rss()` in
[the existing extractor](../site-extraction-lab/extractors.py). It requires:

- An unnamespaced `rss` root.
- Exactly one unnamespaced core `channel`, directly under that root.
- Any unnamespaced core `item` directly under that channel, excluding opaque foreign-extension payloads.

This is an **envelope gate, not full RSS schema or version certification**.
Version attributes remain unrestricted for compatibility. Foreign-namespace
extension subtrees are opaque, including their unqualified payload elements, and
are not mistaken for core nodes. Valid empty RSS
channels still return `[]`. Existing fields, identity checks, warning behavior
and DTD/entity rejection are unchanged. Malformed XML keeps its existing XML
syntax error behavior. Unsupported Atom/RDF/HTML roots and malformed core RSS
placement cannot silently become an empty success.

A full Atom adapter was rejected for this patch: a zero-entry topic descriptor
cannot validate real entry normalization or collection coverage. Such an adapter
needs separately authorized, substantive source evidence and its own tests.

## Offline reproduction

The original raw capture remains private and is deliberately absent from this
repository. Given that exact authorized capture, run from the repository root:

```sh
python3 engineering/experiments/youtube-topic-gate-lab/probe.py --response /path/to/authorized-response.bin
```

The tool only reads local bytes and invokes the existing RSS parser. To reproduce
the baseline against a separately available checkout of the stated revision,
pass `--extractor /path/to/baseline/extractors.py`. The input hash must be
`f43e820f3c928fae60e93e1feeb5cb36d2c852849a760e85dd929471faefd6be`.
The baseline extractor hash is recorded in `before.json`; do not replace it with a
synthetic approximation. Receipts describe parser behavior only and explicitly
keep `collection_accepted` false.

## Regression checks

```sh
python3 -m unittest discover -s engineering/tests -p 'test_rss_format_gate.py' -v
python3 -m unittest discover -s engineering/tests -p 'test_site_extraction_lab.py' -v
```

Observed: 11 new focused tests and all 24 existing extraction tests pass. New
fixtures are explicitly synthetic, covering unsupported roots, malformed core
placement, foreign extensions, version compatibility, valid empty feeds, existing
record mapping, malformed XML and unchanged DTD/entity rejection. They do not
represent actual YouTube entries or establish provider support.

The initial implementation was checked: `scripts/check_research.py` passed
with existing stale-source warnings. That initial full suite ran
988 tests with two failures: the historical Bluesky and WordPress receipt tests
pinned the complete pre-change `extractors.py` hash. The other 986 tests
passed. Those failures were retained. The final reconciliation below replayed
the original captures and preserved historic identities rather than silently
relabeling the observations.

## Retained review correction and shared-parser replays

Independent review found that the first envelope implementation descended into
foreign-namespace extension payloads. Six synthetic payload cases that previously
produced valid records were rejected. The corrected traversal stops at namespace
boundaries while retaining malformed core-envelope checks; all six cases now
match baseline output. Comments and processing instructions remain supported.
The initial failure and intermediate implementation hash remain in local review
evidence. This is a compatibility correction, not a broadened collection claim.

Changing the shared file also invalidated two historical receipt hash checks.
The original captures are replayed offline using
[compare_retained_receipts.py](compare_retained_receipts.py) against the exact
baseline and candidate modules in separate interpreters. It compares complete
normalized outputs before comparing their sanitized projections. No new network
requests are made. The WordPress and Bluesky receipts preserve their original
hash maps, source dates, failures and complete prior content, with additive replay
provenance rather than relabeled historical observations.

Given the original authorized capture manifests and baseline tree, run:

```sh
python3 engineering/experiments/youtube-topic-gate-lab/compare_retained_receipts.py --baseline /path/to/baseline --candidate . --baseline-tree /path/to/base-tree.json --manifest /path/to/authorized-manifest.json --family wordpress
```

Use `--family bluesky` with its corresponding original manifest. These external
inputs are deliberately not copied into the repository. Regression tests preserve
the full original receipts via reconstruction digests and reject changed complete
outputs even when a sanitized projection remains equal.

## Final local validation

At extractor SHA-256 `a18a749f9fcffa6d2a43842ca3a350aebb4320d05ed10a211790efb05a41ed0b`,
all 996 engineering Python tests and 420 engineering Node tests pass. This includes
11 new gate tests, 3 actual-receipt checks and 3 reconciliation regressions; all
24 existing extraction tests remain unchanged and passing. Independent review
passed its 10-test baseline/actual comparison suite plus the extension regression
and independently reproduced both retained-provider comparisons. All seven
original WordPress/Bluesky responses retain complete normalized-output equality.

Root build/tests and seven generated-asset checks pass. The research checker
accepts 2,419 sources and 288 Markdown files with 135 existing stale-source
notices retained. These are local results. Browser/Rust checks were not run for
this offline-only parser change; hosted CI, integration and target acceptance
are separate. No benchmark or performance improvement is claimed.
