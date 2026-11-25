# Storage management: source study and original experiment

Owner request: use sucodeee's storage-management reference for Athena. Tracker: [Athena #269](https://github.com/Herbertofury/Athena/issues/269).

## Current implementation · 2026-11-21

[Merged Athena #318](https://github.com/Herbertofury/Athena/pull/318) adds **Storage Observatory** to the main app at `#storage`. The [workspace contract](../integration/WORKSPACE-CONTRACT.md) describes the read-only view; the [optional one-shot Linux CLI](../../experiments/storage-observatory/README.md#optional-measured-root-report-linux) is run separately on a directory the operator explicitly selects. The app reads two selected report files in memory only. It never starts a scan, saves or uploads a report, or performs cleanup.

Capped, denied or otherwise incomplete traversal stays **observed only**. The app shows differences only for two complete, compatible reports after the operator confirms the same folder and settings; the v1 format cannot verify that identity. Logical and uniquely attributed allocation are not free or reclaimable space. The measured CLI is Linux-only; a passing Windows app build is not a Windows scanner result.

The source and demo notes below record the original study as it stood on 2026-11-16.

## Evidence ledger

- [Exact owner-supplied post](https://x.com/sucodeee/status/2121983864440864921): published November 15, 2026, by sucodeee. Describes storage cards for Mac/Web and credits @kshvbgde as inspiration. It links MetalForge. This is a design reference, not evidence of a disk-management engine.
- Browser initially reported media unavailable. One Play action recovered playback of the 24-second video. The inspected frame shows a dark card, segmented luminous ring, center percentage, right-hand category/value list, total allocation and cache suggestion. Full frame-by-frame video inspection is not claimed.
- [Storage Ring live specimen](https://metalforge.xyz/storagering): browser rendered and progressed from a scanning state through 326.5 GB of 512 GB used to 185.5 GB free. The specimen displays example paths, nine categories, a Rescan button and cache suggestion. These are demo observations, NOT a scan of the owner's machine.
- [Storage Columns](https://metalforge.xyz/storagecolumns) and [Storage Tiles](https://metalforge.xyz/storagetiles): primary site links and titles verified. Their separate motion/interaction behavior has not yet been tested.
- [License notices](https://metalforge.xyz/licenses): expressly distinguish open-source dependencies from MetalForge's proprietary code. Dependency licenses do not license the product's effects.
- [Terms](https://metalforge.xyz/terms): generated-effect source redistribution and bulk export are restricted. Terms name MSL/Swift output; do not assume the same document resolves every Web artifact permission. The publicly viewable editor is not permission to publish its source in Athena's reusable-code library.
- Live Code button showed a sign-in gate. No account was created, subscription purchased, source downloaded, hidden endpoint probed, or proprietary implementation copied. Therefore no source revision, actual shader algorithm, compilation result, or dependency-security audit is available.

## Directly observed design and interaction inventory

The ring divides storage categories into differently colored LED-like cells. The total and category list provide a second information channel beyond the ring. An empty arc conveys remaining capacity. The left chart/right legend creates useful selection-to-detail adjacency. The card has subtle border, depth and glow on a dark dotted canvas. Observed scanning updates both headline values and category allocations, with a current example path; completed state replaces that with free space and a cache hint.

The editor exposes light/dark/page-following appearance; Twinkle, Fireflies, Drizzle, Ripples, Breathe and Still modes; speed and card width; separate Ring, Disk, Empty Space, LED Cells and Colours groups; and editable status/action labels. Instructions advertise click selection with Cmd/Shift additive selection. Those instructions are not evidence every combination or keyboard interaction works. Cleanup/delete controls were NOT invoked. No actual source implementation is inferred from the controls.

Transferable ideas: visually rich but legible capacity allocation, coordinated list/chart selection, explicit loading/completion states, extensible category metadata, configurable motion and appearance, concise contextual recommendations. Avoid importing the dangerous implication that a pretty Clear caches button proves safe cleanup. Real cleanup needs per-resource ownership, exclusion rules, recoverability and authorization.

## Original Athena experiment · 2026-11-16

[Storage Observatory](../../experiments/storage-observatory/index.html) is new semantic HTML/CSS/JavaScript, not a recreation of proprietary source. It deliberately uses a distinct band-based allocation layout, not copied LED assets or shaders. It includes:

- Five explicitly fictional Athena-relevant categories: sources, design library, build artifacts, media references and database snapshots.
- A textual category list, keyboard-operable selection buttons, pressed state and live selection description. The visual meters are decorative; all values remain in text.
- Local JSON snapshot import, maximum 64 KiB and 100 categories; positive safe-integer capacity, nonnegative integer byte counts, unique bounded names, disjoint total no greater than capacity.
- Imported-source status that cannot be upgraded to trusted scan through input data. All imported names go through textContent. Unknown metadata is dropped. No network calls, storage persistence or filesystem mutations.
- Invalid input preserves the prior snapshot. Repeated/reset imports use a generation guard so a slow older read cannot overwrite newer state. Reset and reload discard imported data.
- Responsive layout and reduced-motion handling. No external assets, font downloads, trackers, WebGL or animation loop.

Original demo limits: calculated unallocated capacity is NOT a measured free-space value. No scanner, duplicate finder, native filesystem bridge, delete control, cache cleanup, scheduler, persistent storage or integration into the production navigation is implemented. It is a separate experiment pending review, not a shipped storage manager.

## Original experiment verification · 2026-11-16

Run from repository root: `node --test experiments/storage-observatory/*.test.mjs` (uses the existing linkedom dev dependency).

Six tests pass: coherent demo allocation; source trust downgrade/metadata discard; malformed/overcapacity/duplicate/unsafe-number input; empty/zero/full cases; category and byte-size bounds; DOM selection, safe text rendering, failed-import preservation and reset-vs-late-import race. Initial DOM test caught reliance on event.target after async completion; handler now captures its input synchronously and the rerun passed.

A local HTTP server started, but Cloud Browser could not reach `http://127.0.0.1:8768/experiments/storage-observatory/` (`ERR_CONNECTION_REFUSED`). Thus no rendered experiment screenshot, real keyboard/assistive-technology test, narrow-screen visual acceptance, or browser performance result is claimed. Source reference screenshots are not experiment acceptance. Full Athena regression suite was not run for this isolated experiment.

## Follow-up gates / to-do

- [x] Record source, precise access boundary, attribution, licensing constraints and original experiment.
- [x] Implement/test bounded read-only visualization and local untrusted snapshot import.
- [ ] Complete separate Columns/Tiles and original @kshvbgde lineage study; inspect actual downloadable implementation only through authorized access with artifact-specific rights.
- [ ] Render the experiment in the intended native runtime; test keyboard-only, screen reader, high zoom, narrow viewport, light/dark and reduced motion. Measure text/indicator contrast rather than declaring compliance from styling.
- [ ] Bind a native read-only allocation adapter to explicitly selected Athena-owned roots. Distinguish logical versus physical/allocated bytes, capacity versus free/available bytes, symlinks/junctions, hardlinks, sparse/compressed files, mount boundaries, unreadable entries, changing files and database WAL/journals.
- [ ] Make source identity, time, partial/error state and stale snapshots visible. Cancellation must not yield a fake completed scan; avoid persisting private paths in public reports or telemetry.
- [ ] Prove imported reports cannot inject paths/actions and scanning cannot escape authorized roots; compare fixture totals against independent filesystem measurements on Windows and Linux. Add overlapping-category and live-file-change cases.
- [ ] Add useful project-aware breakdowns and history only after measured data works. Never label all caches/build outputs disposable; active database snapshots or downloaded licensed assets may be irreplaceable.
- [ ] If cleanup is later requested, design a separate preview/confirmation/recoverable-operation layer with revalidation, ownership proofs, busy-file handling and rollback. Permanent deletion requires action-time confirmation. This study authorizes no cleanup.
- [ ] Review the merged workspace visually and with actual Athena workloads. The merge is not a deployment, source retirement, continuous monitor, or native Windows storage acceptance.

### Compare by category

Once both local reports pass the existing same-scope comparison gates, confirm
that they measured the same folder and settings. Athena shows signed changes
by exact category name and lets you sort by the size of the change. Shared
search filters the comparison and reference list together. Categories that only
occur in one report are labelled as such, never compared with an assumed zero.
These are differences between observed inputs, not growth causation or
reclaimable space. No file names, changes to data, or upload are introduced.

### Windows directory-record qualification

A Rust acceptance fixture targets Microsoft's documented
[handle-based directory record](https://learn.microsoft.com/en-us/windows/win32/api/winbase/ns-winbase-file_id_extd_dir_info)
and [record layout](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-fscc/36172f0b-8dce-435a-8748-859978d632f8).
It reads one buffer from an isolated test directory on Windows and checks that
two names for the same hardlink share an exact 128-bit ID, a separate file has a
different ID, Unicode name units round-trip, and all bytes remain unchanged.
Portable synthetic tests reject invalid offsets, truncated records and invalid
name extents instead of returning a partly decoded inventory. No production
scanner, recursive walk, provider dependency or administrator setup is added.

For a product scanner, verify identity together with the volume, use anchored
child access, skip reparse points without following them, report access and
change limits as partial, and distinguish sparse/compressed allocation and
alternate streams before accepting real comparisons. A
[volume-wide USN enumeration](https://learn.microsoft.com/en-us/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data)
requires a different scope and is not used by this fixture. No scan speed or
disk-reclaimability claim follows from the batch decoder.
