# Unfinished engineering work preserved in Athena

These nine source PRs remain drafts. Their code has **not** been merged into Athena engineering main or accepted as a better implementation. The original discussion metadata, exact heads and all branch history are preserved here. No source PR was closed or changed.

The published history bundle was downloaded back from Athena, cloned independently, checked with `git fsck --full`, and compared against every original ref. Every current open head below is present as a commit.

| Source draft | Exact preserved head | Source base | State |
| --- | --- | --- | --- |
| #5 · Guard release admission while preserving historical records | `3b8adb88da1396070bc6e87c4cbd0e82abe3a864` | `de9481e07b31a12918fa2cd53909e706d207b225` | draft, unmerged |
| #6 · Add November 3 frontier systems research and adoption gates | `4c7d1b1e706449a884278b61b9b42f7c2a1a3ef2` | `de9481e07b31a12918fa2cd53909e706d207b225` | draft, unmerged |
| #7 · Prevent stalled job cancellation from blocking UI | `1333c5dd7833573687966c32781ea87b68ec9a14` | `de9481e07b31a12918fa2cd53909e706d207b225` | draft, unmerged |
| #8 · Experiment with bounded archive deadlines | `990447b5f82b51d4a77f2d1c404836f3781e485f` | `1333c5dd7833573687966c32781ea87b68ec9a14` | draft, unmerged |
| #9 · Experiment with local gallery snapshot comparison | `a723e81c73f403190ef44a9f8bea26e0f564f4f1` | `990447b5f82b51d4a77f2d1c404836f3781e485f` | draft, unmerged |
| #10 · Preserve Overview when metrics are malformed | `a75b72424f7fd291632ec75fd3ee2859c2d02aa0` | `a723e81c73f403190ef44a9f8bea26e0f564f4f1` | draft, unmerged |
| #11 · Reject malformed gallery URL matches | `13af2857af303ac54398a88ba965a966331e1e26` | `a75b72424f7fd291632ec75fd3ee2859c2d02aa0` | draft, unmerged |
| #12 · Recover empty srcset candidates | `05ce06e79bab9ba95b1b3242ffe673d0d6d1a57e` | `13af2857af303ac54398a88ba965a966331e1e26` | draft, unmerged |
| #13 · Preserve whole srcset URLs | `460965fe992f6f43af87de17331cbb94e2118a79` | `05ce06e79bab9ba95b1b3242ffe673d0d6d1a57e` | draft, unmerged |

## Resume safely

1. Clone `../engineering-atlas-history.bundle` into an isolated working repository.
2. Inspect the desired exact head above and its original base. Review the original PR body in `pull-requests-latest.json`.
3. Port the candidate delta under Athena `engineering/`, reconcile with the current main and preserve prior failure evidence.
4. Open a new Athena draft; retain lineage back to the source PR. Re-run full target checks before recommending or accepting it.

These are archived source drafts, not recreated Athena pull requests. The live source review workflow remains until deliberately reconciled. PR 13 had no discussion comments when checked. Its source Linux/Windows CI passed at the exact head, which does not certify the later Athena tree.
