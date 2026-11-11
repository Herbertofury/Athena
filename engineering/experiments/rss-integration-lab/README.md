# Combined RSS preservation

November 11, 2026. One offline parser now combines the existing title, publication-date and feed-format fixes. It retains title/date metadata from valid RSS without turning unsupported Atom into a successful empty feed.

## Exact source contributions

- [Title draft #5](https://github.com/Herbertofury/Athena/pull/5), `11b361cf092c068135da68d608255e14e5a94bd0`.
- [Date draft #14](https://github.com/Herbertofury/Athena/pull/14), `08a1b912303f9133904506035481efa4886ab43a`, includes #5. Its date helper, receipt projection and 24 title/date tests are preserved unchanged.
- [Format draft #53](https://github.com/Herbertofury/Athena/pull/53), `027d44702ac5300ed67c2cd88cec5c184870d4ff`, is this integration's base. Its envelope validation, foreign-extension handling and 11 gate tests are unchanged.

This is a new draft, not a merge or acceptance of the source drafts. Current main, other branches, runtime wiring and workflows are untouched. Source references retain their original checked dates; this pass did not re-fetch providers.

## Combined result

Exact retained NASA (60 items) and RRe36 (10 items) feed bytes now retain all 70 titles and all 70 publication-date source strings. An independent standard-library RFC-date conversion agrees with all 70 UTC instants. Removing only the two intentionally added projections restores complete baseline normalized records and receipt output, including body, identity, people and enclosure access states. New reports publish hashes/counts only, not original feed prose or raw dates.

The retained 463-byte YouTube topic descriptor remains explicitly rejected. It is not evidence of an empty channel, current upload collection or media acceptance. Four retained WordPress captures and three Bluesky captures produce complete normalized and sanitized outputs identical to their original implementations after the shared source change.

The previous #53 WordPress, Bluesky and topic replay reports remain byte-exact under [pr53-receipts](pr53-receipts/manifest.json). Current replay pointers are updated only after actual replay. All original provider observations, timestamps, failures and original implementation hashes are retained. The original #14 [date receipt](../site-extraction-lab/rss-publication-date-validation-20261108.json) is copied unchanged and remains historical.

## Reproduce

Run repository tests with `python -m unittest discover -s engineering/tests`. The complete retained source responses are not redistributed. Obtain or supply the exact inputs independently, then use the offline comparison tool:

```sh
python engineering/experiments/rss-integration-lab/compare.py \
  --baseline /path/to/pr53/extractors.py \
  --candidate engineering/experiments/site-extraction-lab/extractors.py \
  --response /path/to/retained-feed.xml \
  --expected-sha256 EXPECTED_INPUT_SHA256 \
  --origin https://example.test/feed
```

The expected input hashes and current implementation hash are in [the integration receipt](validation-2026-11-11.json). The input digest is checked before loading parser modules. Socket operations are prohibited. Output contains only scoped evidence, hashes and counts. Input/module paths are trusted local inputs, not a general sandbox for untrusted Python modules.

## Limits and rejected alternatives

Replacing the whole extractor with old #14 would drop #53's gate; applying only #53 would still omit titles/dates. This integration combines the exact narrow behaviors and verifies the shared-source consumers instead. Raw provider responses, executable downloads and original artwork are not copied.

Date support remains the existing bounded RFC subset. Missing, empty, invalid, unsupported, ambiguous and unknown/missing-zone values stay explicit. No date is invented from the current clock or channel. `-0000` means a UTC instant with unknown original timezone. No Atom collector, live history, UI rendering/date sorting, browser, Rust, native target or performance acceptance is claimed. Existing workflow filters exclude engineering-only changes; no hosted pass follows from a lack of runs. The inherited #43 accessibility failure is unchanged and is not addressed here.
