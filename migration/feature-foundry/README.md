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
- The original snapshot reported no wiki or Pages and no issues/PRs/runs. Recheck before retirement: the 2026-11-14 authenticated inventory now includes open acceptance issue #1. Snapshot metadata is not a current completeness claim.
- Six original v24.0.0 release assets are inventoried. Four files are preserved and hash-verified: source ZIP, Windows EXE/MSI and SHA256SUMS.txt. That was the original partial-preservation checkpoint. A later independent check recovered all six exact assets from each of two existing owner-held backups; see [release recovery](release-recovery-2026-11-14.json). These backup bytes have not been published into Athena, and this does not establish current sharing ACLs, perpetual storage or full retirement readiness.
- Fresh authenticated refs on 2026-11-14 show source main `07d66bde6b758992d04a6b580f159599c705de55`, three documentation commits beyond the bundled main. The reviewed competitive-landscape document and README link are now reconciled without reverting privacy redactions; the original bundle does not yet contain those three commit identities.

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

Athena now has a native Foundry module under #build, not an iframe. PRs #73–#81 implement neutral theme/room selection, visual ecology forms, pointer/keyboard placement and pinning, local persistence, per-room/all-room backups and recovery protection, undo/redo, reset, precise object inspection, left/right/hidden inspector docking and named room layouts. At main `ba960d48d21bcb0e9ee5322731890a6dc97a1641`, focused and full tests plus hosted Chromium/unified acceptance passed; Pages and all 69 allowlisted served asset hashes were verified.

This is **partial native parity**, not a substitute for all original functionality. Cinematic Three.js rendering, animated mascots, rights-gated artist worlds, native SQLite/Tauri/provider flows and full floating/resizable panels are not yet accepted. Browser acceptance does not establish Windows-native or game acceptance. See the dated [retirement audit](retirement-audit-2026-11-14.json).

## Deletion gates

1. Verify exact target source blobs and independently restore the published history bundle.
2. Download and verify all six original release assets, preserve them under Athena without executing installers, and verify the target copies.
3. Pass the derived workspace's real-browser parity, mount/unmount/abort and persistence tests, then full Athena navigation tests.
4. Verify native source compilation/runtime or provide an explicitly accepted replacement. Do not silently drop SQLite and desktop functionality.
5. Verify the exact deployed app identity, assets and source-independent links. Reconcile any new source changes immediately before deletion advice.
6. Retain failures and last-good artifacts. The user will delete the source only after all gates are satisfied.

No source repository deletion, visibility change, settings change or grant creation is part of this migration.

## Release recovery addendum (2026-11-14)

The original web ZIP and complete-release ZIP are no longer missing bytes: both match the original release inventory in two independently read backup containers. All six release assets match size and SHA-256; nested ZIP CRC checks passed without executing installers. The original 533-byte checksum asset was verified separately from the different 421-byte checksum inside the complete-release ZIP. The dated audit and prior failure reports are retained unchanged.

Only release-byte discovery is resolved. Private issue content, later original identifying history, full native parity, live-data migration, rights/privacy review, source-independent links and native acceptance remain separate gates. The 67 blocked Atlas deployment-status histories are still unresolved. No repository deletion or archival is authorized. See [acceptance issue #60](https://github.com/Herbertofury/Athena/issues/60).
