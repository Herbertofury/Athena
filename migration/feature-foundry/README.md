# Feature Foundry → Athena preservation ledger

Feature Foundry's Living World studio belongs in Athena's Build workspace. Its exact source and history are being preserved before retiring the old repository. **Do not delete Feature-Foundry yet.**

## Current-tree privacy correction (2026-11-13)

The private release-folder link and V33 Drive source identifier have been withheld from two current source files. Artist-catalog provenance redaction is not included: publication of that payload was held for further privacy review. The original source manifest remains a historical identity record; the separate privacy-redaction receipt records changed hashes. No history was rewritten and no bundle, backup or source repository was deleted. Historical copies and author metadata therefore remain accessible in existing Git history and the retained history bundle. This is limited current-tree exposure reduction, not complete erasure.

Reference images are not cleared for new runtime redistribution. Artist authority marks its five artist families as reference/curation only until permission or licensing is recorded. Preserve those gates.

## What has been recovered

- All 100 files of main, commit `e1ba080b5c7590f1c844a6ed13b3a471709920b9`, verified by original Git blob and SHA-256 hashes.
- All 10 commits across main and build/living-world-v24, with exact original commit identities, trees and blobs. Both branches and tag v24.0.0 are included in a complete self-contained Git bundle.
- MIT licensing and the original source-contract, authority and browser tests.
- Original local contract/authority tests, TypeScript check and Vite production build pass. This is not a native build or browser pass.
- Repository metadata reports no wiki or Pages site; all-state issue and pull-request lists are empty and Actions reports zero runs.
- Six original v24.0.0 release assets are inventoried with official SHA-256 hashes. Their bytes have **not** yet been preserved.

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

The intended native module mounts under #build inside the existing shell, not an iframe. It is not present in the reviewed public-preview build. The prior claim of an integrated 27-world browser module was not supported by the current tree and is withdrawn. Source preservation, historical build records and catalog counts do not establish native workspace parity. Desktop commands, SQLite data migration, provider authorization and full visual/interaction acceptance remain pending.

## Deletion gates

1. Verify exact target source blobs and independently restore the published history bundle.
2. Download and verify all six original release assets, preserve them under Athena without executing installers, and verify the target copies.
3. Pass the derived workspace's real-browser parity, mount/unmount/abort and persistence tests, then full Athena navigation tests.
4. Verify native source compilation/runtime or provide an explicitly accepted replacement. Do not silently drop SQLite and desktop functionality.
5. Verify the exact deployed app identity, assets and source-independent links. Reconcile any new source changes immediately before deletion advice.
6. Retain failures and last-good artifacts. The user will delete the source only after all gates are satisfied.

No source repository deletion, visibility change, settings change or grant creation is part of this migration.
