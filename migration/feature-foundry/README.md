# Feature Foundry → Athena preservation ledger

Feature Foundry's Living World studio belongs in Athena's Build workspace. Its exact source and history are being preserved before retiring the old repository. **Do not delete Feature-Foundry yet.**

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

The derived Athena module mounts under #build inside the existing app shell. It preserves the original living-world UI rather than replacing it with links or an iframe. Namespaced persistence, scoped styles/events and teardown protect the other workspaces.

The browser module exposes 27 theme/world choices, five active ecology actors, media controls and six provider mapping/search routes. Native SQLite/window operations and provider account authorization are explicitly unconnected. Local source preservation is not proof that those capabilities have been migrated. Media starts paused. Authenticated playback has not been tested and no account session has been copied.

## Deletion gates

1. Verify exact target source blobs and independently restore the published history bundle.
2. Download and verify all six original release assets, preserve them under Athena without executing installers, and verify the target copies.
3. Pass the derived workspace's real-browser parity, mount/unmount/abort and persistence tests, then full Athena navigation tests.
4. Verify native source compilation/runtime or provide an explicitly accepted replacement. Do not silently drop SQLite and desktop functionality.
5. Verify the exact deployed app identity, assets and source-independent links. Reconcile any new source changes immediately before deletion advice.
6. Retain failures and last-good artifacts. The user will delete the source only after all gates are satisfied.

No source repository deletion, visibility change, settings change or grant creation is part of this migration.
