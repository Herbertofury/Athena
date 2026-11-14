# Foundry private recovery tools

Python standard-library tools; no browser access, downloads, uploads or provider requests. Keep inputs/outputs private and OUTSIDE Athena static/runtime directories. These tools do not establish repository deletion readiness.

## Preserve exact browser values
Operator-prepared JSON maps the nine allowlisted original Foundry keys to exact raw strings. Unknown keys refuse; malformed original JSON strings, absent/empty distinction and UTF-16 surrogates remain preserved.

    python3 capsule/capsule.py pack VALUES.json NEW-CAPSULE.json
    python3 capsule/capsule.py unpack CAPSULE.json NEW-VALUES.json

capsule/assess.py exposes assess(capsule_object): checksum-verified count-only structural diagnostics, not automatic import approval. It returns no original identifiers, selectors or values. Checksums detect accidental corruption, not malicious forgery. No browser capture or complete app backup is performed.

## Prepare original SQLite safely
Stop ALL original writes first. Select an exclusive NEW output and private scratch directory:

    python3 sqlite/prepare.py --source ORIGINAL.sqlite --destination NEW-PREPARED.sqlite --scratch PRIVATE-SCRATCH --source-quiescent

Copies bounded DB/WAL into staging, fingerprints original DB/WAL/SHM before/after, opens only copies in SQLite. Refuses source changes, symlinks, active rollback journals, existing outputs and source-sidecar aliases. Never changes original journal mode. Not a live/concurrent snapshot guarantee. Later native import copies only supported reviewed records, not all original history/assets. Retain originals.

## Convert an explicitly mapped scrapbook

    python3 scrapbook/convert.py --catalog CATALOG.json --source SCRAPBOOK.txt --mapping REVIEWED.json --new-bundle NEW-PRIVATE-DIRECTORY
    python3 scrapbook/verify.py --catalog CATALOG.json --bundle PRIVATE-DIRECTORY

Supply the current Athena catalog explicitly. Bundle retains exact original bytes, exact mapping, workspace and manifest. Verification checks hashes and deterministic recomputation. No live state changes or automatic schema upgrades.

Mapping exact fields: sourceSha256, coordinatePolicy="proportional-centers", assetReview="manual-equivalence-confirmed", stackingReview="independent-surfaces-reviewed", themeId, roomId, assets (original asset ID to reviewed catalog ID), rows. Each row geometry requires index, sourceFrame/targetFrame ({left,top,width,height}), sourceSize/targetSize ({width,height}), anchor (null for UI; {sourceKey,sourceId,nativeKey} for stickers, nativeKey scene or inspector). See scrapbook/test_convert.py fixture() for complete synthetic examples. Never guess measurements, asset equivalence or anchors.

Output JSONv9 requires the matching browser model or explicitly migrated native schema12 (upgrade-origins after previous migrations). Supports duplicate identity, nine source transform origins, rotation/skew/signed scale, numeric color filters, visibility/opacity/order and reviewed UI/sticker surfaces. For fractional origin f and source/target intrinsic sizes S/T, compensated target center adds (f-.5)*(S-T) after proportional center mapping. All absolute transformed corners and clipping are checked. Converted sticker coordinates can differ deliberately from original pins.

Unknown fields/assets, gravity, non-normal blend, nonzero blur, unresolved anchors, same-surface stack ties, invalid bounds and clipping refuse. Blur kernel/clipping equivalence is unproven. No full original-format or rendered visual-fidelity claim.

## Deterministic tests, no installs
Provide absolute paths to an already-built schema12 CLI and current Athena model/catalog. Node must be installed. From this directory:

    export ATHENA_NATIVE_BIN=/absolute/path/to/athena-foundry-store
    export ATHENA_CATALOG=/absolute/path/to/dist/workspaces/foundry/catalog.json
    export ATHENA_LAYOUT_MODEL=/absolute/path/to/dist/workspaces/foundry/layout-state.mjs
    python3 -B -m unittest discover -s capsule -p 'test_*.py'
    python3 -B -m unittest discover -s sqlite -p 'test_*.py'
    python3 -B -m unittest discover -s scrapbook -p 'test_*.py'

13 capsule/assessment + 5 SQLite + 12 converter tests. Inputs are synthetic; temporary new DBs only, never supplied user databases. TMPDIR may select private writable test space. Missing required environment variables fail explicitly.

New private outputs use Unix0600, bundle directories0700. Windows ACL/real-browser acceptance unverified. Source-only package: no databases, binaries, private exports/bundles or logs. Source application/runtime is not modified.
