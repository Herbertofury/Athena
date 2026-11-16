# Atlas recovery refresh, 2026-11-16

This refresh closes a concrete archival delta, not product or deletion acceptance.
The live source main and all branch heads are unchanged. GitHub regenerated only
three synthetic PR merge refs (5, 6, 7). The adjacent small delta preserves them;
the older published bundles remain untouched and preserve previous identities.

Independent restoration from the published main and November 13 delta verified
all 1,540 source files. A fresh restore adding this delta passed `git fsck --full`
and matches all 39 live refs. The wiki bundle independently restores cleanly;
all 75 source pages byte-match the preserved snapshot. Exact identities and
current metadata observations are in `verification.json`.

## Reproduce without the source repository

From the Athena root:

```sh
git clone --mirror migration/engineering-atlas/engineering-atlas-history.bundle /tmp/atlas-recovered.git
git -C /tmp/atlas-recovered.git fetch "$PWD/migration/engineering-atlas/cutover-2026-11-13/history-delta.bundle" '+refs/*:refs/*'
git -C /tmp/atlas-recovered.git fetch "$PWD/migration/engineering-atlas/retirement-2026-11-16/merge-ref-delta.bundle" '+refs/*:refs/*'
git -C /tmp/atlas-recovered.git fsck --full
python scripts/verify_atlas_cutover.py
```

Use a fresh destination. Older dangling synthetic merge commits reported by fsck
are expected retained objects, not corruption. The existing source verifier
validates the original historical baseline; the adjacent verification receipt
records the current ref identities, not a rewritten historical manifest.

## Remaining boundaries

No source application code changed. The nine open drafts remain retained candidates,
not accepted functionality. No releases or current artifacts exist; 522 workflow
summaries remain available. Issue title/body/state/comment-count/update timestamps
match the prior preserved inventory. Existing expired-log limitations are unchanged.

All three workflows returned for Athena main `f05cfc038` succeeded (native Foundry,
learning checks, Pages). This is not a fresh complete Engineering test run, native
desktop visual acceptance, authenticated-provider playback, or owner-data migration.
This check does not inspect unavailable computers for uncommitted work. Source
history recovery and broader product acceptance remain distinct. No source deletion,
archive, remote settings change, or deletion-readiness certification was performed.
