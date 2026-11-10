# Feature Foundry → Athena preservation ledger

Feature Foundry's Living World studio belongs in Athena's Build workspace. Its exact source and recoverable Git history are now preserved on Athena main. **Do not delete Feature-Foundry yet.**

## Current transfer status (2026-11-10)

Verified against Athena main commit `44384b809c80e03adbd62f8be9617d01e6ad9922`:

- [PR #3](https://github.com/Herbertofury/Athena/pull/3) merged at that commit. All 100 original main files are present under [`feature-foundry/source/`](../../feature-foundry/source/), with source tree `21803ee6e7dda0e2d0de540477bab0ef618ccf8f`. The self-contained [history bundle](feature-foundry-history.bundle) preserves all 10 original commits, branches `main` and `build/living-world-v24`, and tag `v24.0.0`. Original commits are recoverable from the bundle; they were not grafted into Athena's native Git ancestry.
- [PR #21](https://github.com/Herbertofury/Athena/pull/21) merged at `cd70050b4b2f21174a785d0bcc4b9e5e1353de70`. Four unchanged original release files are present under [`releases/v24.0.0/`](releases/v24.0.0/): the source ZIP, Windows EXE, Windows MSI and `SHA256SUMS.txt`. These are repository copies, not a recreated GitHub Release or installer acceptance.
- The original web ZIP and complete-release ZIP are not copied into public Athena. Both remain in the original private Feature-Foundry release and in a verified private recovery archive. The complete-release ZIP contains the exact original web ZIP. All six original release assets remain unchanged in the source release and are verified in the private recovery archive.
- The original private source repository remains intact at `e1ba080b5c7590f1c844a6ed13b3a471709920b9`. Full unified application, native runtime and deployment acceptance remain incomplete. Repository preservation does not make the source deletion-ready.

## Original recovery evidence

- All 100 files of main, commit `e1ba080b5c7590f1c844a6ed13b3a471709920b9`, verified by original Git blob and SHA-256 hashes.
- All 10 commits across main and build/living-world-v24, with exact original commit identities, trees and blobs. Both branches and tag v24.0.0 are included in a complete self-contained Git bundle.
- MIT licensing and the original source-contract, authority and browser tests.
- The original recovery's local contract/authority tests, TypeScript check and Vite production build passed. These historical checks are not a native build or browser pass.
- At the original recovery, repository metadata reported no wiki or Pages site; all-state issue and pull-request lists were empty and Actions reported zero runs.
- Six original v24.0.0 release assets were inventoried with official SHA-256 hashes. The [release inventory](release-inventory.json) now records current preservation locations while retaining the original release body, publication timestamp, asset identities and hashes.

## Restore independently of the original repository

Verify the bundle's SHA-256 against history-recovery.json. Then:

```sh
git clone --mirror feature-foundry-history.bundle restored-feature-foundry.git
git --git-dir=restored-feature-foundry.git fsck --full
git clone restored-feature-foundry.git feature-foundry
cd feature-foundry
git log --all --oneline
git show-ref
npm ci --ignore-scripts
npm test
npm run typecheck
npm run build
```

No dependency cache, user credentials, account sessions, or generated workspace files belong in this snapshot. Historical sources are unchanged, including their original Feature Foundry branding. Changes for Athena's mount lifecycle are maintained separately, rather than falsifying original artifacts.

## Application integration

The derived Athena Build workspace is separate from this unchanged source snapshot. It is not included in the current main application build. Development descriptions and local tests of derived candidates do not establish merged or deployed functionality.

Full unified browser behavior, persistence, native SQLite/window operations, provider authorization and deployment require separate acceptance evidence. No installer was executed for these repository transfers, and no account session was copied.

## Deletion gates

1. Source/history preservation completed on 2026-11-10: exact target source blobs and an independently restored history bundle were verified. Recheck if source refs change.
2. Complete release transfer remains open. All six assets are verified in private recovery, but only four are copied into Athena. The original web ZIP and complete-release ZIP are absent from public Athena. No installer execution or release recreation is implied.
3. Pass the derived workspace's real-browser parity, mount/unmount/abort and persistence tests, then full Athena navigation tests.
4. Verify native source compilation/runtime or provide an explicitly accepted replacement. Do not silently drop SQLite and desktop functionality.
5. Verify the exact deployed app identity, assets and source-independent links. Reconcile any new source changes immediately before deletion advice.
6. Retain failures and last-good artifacts. The user will delete the source only after all gates are satisfied.

No source repository deletion, visibility change, settings change or grant creation is part of this migration.
