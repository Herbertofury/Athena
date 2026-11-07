# Preserve working evidence links after the Atlas move

## What changed

Athena's active Research catalog contained 36 links to two historical files in
Engineering Atlas: nine method citations and 27 raw-result citations. Both files
were already preserved in Athena. The deterministic importer now links to their
**immutable Athena import commit**, not a branch or a newer experiment.

- Source revision: `4ed47c5c324231d65b81c3c846bd8fa3f880bee8`.
- Athena preservation revision: `af594fd2cdd5c00f01178ee353965a54b01b05d7`.
- [Preserved method](https://github.com/Herbertofury/Athena/blob/af594fd2cdd5c00f01178ee353965a54b01b05d7/engineering/experiments/json-lab/README.md).
- [Preserved raw results](https://github.com/Herbertofury/Athena/blob/af594fd2cdd5c00f01178ee353965a54b01b05d7/engineering/experiments/json-lab/results-2026-10-26.json).

Each catalog citation retains the original URL/revision and the preserved
SHA-256 and Git blob identity. The rendered link says it is an exact Athena copy;
its title exposes original attribution and the full content hash. The retained
raw evidence, original snapshots and source repository are unchanged.

This is an availability/correctness migration. It does not rerun a benchmark,
alter a measurement, promote a candidate or claim that one parser is generally
faster. The semantic comparison confirms exactly 36 URL replacements and 36
provenance additions, with every other catalog value unchanged.

## Verified evidence

The original public history bundle, a fresh fetch of the pinned Athena commit,
and current local files were compared byte-for-byte. An independent review
repeated that comparison. [The receipt](preserved-byte-verification.json) records:

- Method: 3,615 bytes, Git blob `2dd9df2193e5c3766b966be13f84cbe25b920c58`.
- Raw results: 40,839 bytes, Git blob `662fd9ed7b612b7aa3abe1b3c155006a38e7cae6`.
- All relative links in the method README resolve to retained paths in the same
  immutable Athena commit.

[The semantic diff](citation-semantic-diff.json) confirms no remaining active
Engineering Atlas URL in the generated runtime catalog. Original URLs remain
only as provenance. This is not a claim that all repository history, wiki pages
or archived snapshots have been rewritten or should be rewritten.

## Tests and isolation

The candidate was tested in a fresh checkout of Athena main
`ee911ee94acae88ee037885daba35a6723e5d7f2`. It does **not** contain the separate
unapproved cancellation candidate or any private Foundry material.

- [78 importer tests passed](importer-tests.log), including changed-byte rejection
  and exact measurement/provenance checks.
- [13 focused Node tests passed](focused-tests.log), including rendered safe links
  and visible attribution. One runs the 78-test Python suite.
- [70 main-based root Node tests passed](main-only-aggregate-tests.log), with all
  Python wiki, fixture, loopback, packaging and catalog checks. These overlapping
  counts are not additive.
- Both adapter generators and the original Explorer generator reproduce their
  outputs. [Syntax and generation checks](generator-checks.log) pass.
- The reviewed runtime allowlist changes the two Research asset hashes and the
  generated Engineering provenance-manifest hash. Packaging initially refused
  the stale manifest hash before publication; that omission was corrected and
  [packaging passed](package-review.log). Native Lab modules and every other allowlisted hash remain
  main's exact bytes.
- An actual-Chromium citation check is prepared for the existing CI lane. It has
  not been run locally; the earlier local browser restriction is not retried.

## Remaining limits

The broader engineering-only link checker still flags an **unchanged** runtime
README link that crosses into Athena's root documentation. The target exists;
the checker's assumed repository boundary is narrower than the monorepo. Its
[failure log](research-checker-existing-failure.log) is retained and is not
reported as passing or silently relaxed by this patch.

Actual Chromium acceptance of this revision awaits CI. Pages setup, Windows
acceptance, private Foundry integration, other source-draft reconciliation and
the final source-deletion gate remain separate. No PR, source deletion, source
visibility change or permission change is part of this patch.

## Reproduce

```sh
python3 -m unittest discover -s engineering/tests -p test_research_explorer.py
python3 engineering/scripts/build_research_explorer.py --check
python3 scripts/build_engineering_workspaces.py --check
node --test tests/engineering_workspaces.test.cjs tests/research_citations.test.cjs
npm test
npm run test:browser
```

Logs redact only local repository and temporary package-output paths. Exact original/retained log hashes
are in `log-manifest.json`.
