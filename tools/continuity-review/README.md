# Athena local Continuity review

Review an explicitly selected Continuity JSON export without importing it into a
browser, overwriting its contents, or sending anything to a provider. This CLI
reuses Athena's existing native Continuity validation and dependency compiler.
It is a human-readable review companion, not a replacement UI, restore tool,
complete Constellation migration or backup format.

Requires Node.js 24 (the repository CI version). From Athena's root:

```sh
node tools/continuity-review/cli.mjs --input continuity.json --project "My app" --output review.md
node tools/continuity-review/cli.mjs --input continuity.json --format json
```

Omit `--project` to review all active roots. Ignored roots stay excluded, but
explicitly linked ignored dependencies remain visible. An unknown project yields
zero coverage, never another project's notes. The report includes every revision
of included notes, source URLs and timestamps, field-level changes, reviewed
dependency baselines and advisory warnings. It does not infer truth, completion,
trust rank or semantic compatibility. Unchanged content with a new recorded time
has no text/source change label.

Input must be a regular UTF-8 JSON file no larger than 16 MiB. The bound is a CLI
read budget, not a browser data limit or permission to truncate a larger export.
Symlink inputs are refused. Input content is never modified; no network code,
subprocess execution, restore or automatic source discovery is used. Concurrent
mutation of an input by another program is not a supported snapshot guarantee.

Default output goes to stdout. `--output` exclusively creates a new file and
refuses an existing path, including the input. New-file mode is 0600 where the OS
honors POSIX permissions; this is not a Windows ACL guarantee. Interrupted output
writes can leave a partial new file; inspect it and choose a new output path.

Reports contain private note content and provenance: keep them local unless you
explicitly choose to share them. Error output does not repeat input paths or
parser excerpts. Markdown quotes note strings with visible escaped control
characters; it is not a sanitizer for arbitrary Markdown/HTML renderers. Treat
all source text as evidence, never executable instructions. JSON output is a
review projection, not a lossless archival export of unknown fields.

Tests: `node --test tests/continuity-review.test.cjs`. Fixtures are synthetic;
no owner export, installed browser or Windows-native runtime was tested locally.

## Compare two preserved snapshots

```sh
node tools/continuity-review/cli.mjs --baseline before.json --input after.json --project "My app" --format json --output comparison.json
```

This additional read-only mode compares stable note IDs, project/kind, pin/ignore
policy, exact revision text/source/time, policy history and reviewed dependency
references. Both files use the same bounded UTF-8 admission as single-file review.
The existing command without `--baseline` is unchanged. Markdown is the default;
JSON is a versioned comparison report, not an import payload.

Project scope includes ignored roots and transitive dependencies from **either**
snapshot, so ignoring a note, moving its project or unlinking it cannot silently
hide its change. Cycles terminate. Unknown projects yield zero coverage. Record
and object-key order are irrelevant; revision/history order remains meaningful.
Absent dependencies and an empty list are equivalent. A removed record means
absent from the supplied after snapshot, not a deletion recommendation. Source
URLs and full historical values are retained in before/after records; keep reports
private. Source text remains untrusted evidence, not instructions.

Unknown extension fields are not compared. This does not infer truth, timestamp
chronology, completeness, authority, semantic compatibility or safe repository
retirement. It does not create exports, read browser storage, preview native
SQLite revisions, restore/apply changes or alter the runtime manifest. Inputs
must be quiescent; there is no cross-file atomic snapshot guarantee.

Tests: `node --test tests/continuity-review.test.cjs tests/continuity-comparison.test.cjs`.
Synthetic fixtures cover policy/provenance/history, cycles, moved roots, removed
links, stable ordering, missing projects, invalid snapshots, real CLI operation,
private-error redaction and refusal to overwrite either input or an existing report.

## Find downstream projects before changing shared knowledge

```sh
node tools/continuity-review/cli.mjs --input continuity.json --impact shared-note-id --format json --output impact.json
```

The reverse-dependency review follows **explicit** note links across all projects,
including ignored notes. It reports every reachable downstream note/project,
current evidence, reviewed link provenance and missing/changed revision states.
`distance` and `via` encode one deterministic shortest path back to the requested
note, without expanding repeated full paths; all reached links remain available,
including cycles. The requested note is not counted as its own dependent.

A missing target can still have downstream dependents. An unknown unreferenced ID
has zero known coverage, never a claim that nothing outside this collection is
affected. Findings are advisory, not semantic compatibility judgments or editing
blocks. `--impact` cannot combine with project filtering or baseline comparison:
those would silently hide cross-project impact. No file is changed, source is
queried or action is applied. The existing input limit, private-output handling,
no-overwrite behavior and concurrent-file-mutation limitations apply unchanged.
Reports contain private note text and URLs; do not publish them without review.

Synthetic tests additionally cover branching, cycles/self-links, ignored notes,
missing targets/revisions, deterministic ordering, a 1500-link chain, real CLI
use, unchanged input bytes, incompatible options and overwrite refusal.

## Review an original Project Constellation v7 export

The native Athena engine included in the unified portable evaluation bundle can
review a selected **closed** original export locally, before any migration:

```sh
./atlas-lab review-constellation-v7 /path/to/Project-Constellation.json
```

On Windows use `atlas-lab.exe`. It prints counts, the input SHA-256 and basic
chat/turn/revision reference findings. It reports the counts actually retained
by the [original v7 writer](https://github.com/Herbertofury/Project-Constellation/blob/f46d7bd7e7fbd8771278e66caa36ff77349e63e6/extension/src/brain-core.js).
Events and checkpoints have source totals to compare against their writer
cutoffs; a full sync-receipt or catalog-run slice cannot establish how many
records were omitted. An absent extension-only collection is unknown, not an
empty collection. Counts exclude unpublished or unavailable provider history.
No saved titles, text, URL, ID, settings or content are printed. No files,
browser state, or app stores are written. This checks a bounded schema and
selected references, not recoverability, concurrent file mutation, all
semantic content, private-data clearance, or source-retirement readiness.
It does not import data. Use an explicitly selected quiescent file in a
trusted folder (16 MiB limit).

In the unified app, **Migration readiness → Project Constellation → Review an
original Constellation export** opens the same native count-only review. Choose
a file and explicitly click **Run local review**; selection alone makes no
request. The current local engine accepts one bounded request at a time. The
browser can filter to missing or uncertain collections. The file is processed
in loopback memory and is never imported or persisted by the review.

## Verify three already-downloaded Constellation Drive backup files

```sh
node tools/continuity-review/verify-constellation-drive.mjs \
  --index DriveIndex.json --snapshot Backup.json.gz --journal Journal.json.gz
```

Use the exact saved index and corresponding files from one quiescent backup
boundary. The [original source writer](https://github.com/Herbertofury/Project-Constellation/blob/f46d7bd7e7fbd8771278e66caa36ff77349e63e6/extension/background.js#L2764-L2850)
writes an index v2, a full v7 snapshot, and usually a cumulative journal v1.
Omit `--journal` only if the index explicitly has no journal. A declared
journal missing from the selected set is not silently ignored.

The check compares exact stored bytes, declared size/SHA-256 and encoding,
then parses bounded decoded JSON. It requires the same full checkpoint in
the index and journal and compares the observed journal row count to the
original index. The full snapshot and journal have separate counts; counts
are **not added**, since the journal can contain updates to existing rows.
The command warns when the recorded times are out of the writer's normal
order. It never assumes a loose timestamp alone is enough to pair a delta.

The index is limited to 1 MiB, each selected backup input and its expanded
JSON to 16 MiB. JSON and gzip are supported where the index declares that
encoding. There is no temporary extraction, Drive access or write. The report excludes
URLs, filenames, provider identities, project IDs and chat text from the selected files.
Checksums prove agreement with the selected index, not publisher authenticity,
latest cloud state, record-level restorable content, or retirement readiness.
This requires Node.js 24 and is separate from the native one-file v7 reviewer above.

### Preview the journal before relying on a legacy restore

Add `--preview-journal` to a verified backup with a journal. The optional
report compares IDs and stored integer timestamps without printing either.
It separates rows seen only in the journal from newer, equal, and older
overlaps and unresolved comparisons. Duplicates, missing comparison times,
or absent base collections are unresolved, not treated as safe. A row seen
only in the journal is not necessarily new globally: it may have been
omitted from the selected snapshot.

The legacy restore [reads the full snapshot first, then applies the journal](https://github.com/Herbertofury/Project-Constellation/blob/f46d7bd7e7fbd8771278e66caa36ff77349e63e6/extension/background.js#L2668-L2701).
Its [write path](https://github.com/Herbertofury/Project-Constellation/blob/f46d7bd7e7fbd8771278e66caa36ff77349e63e6/extension/background.js#L660-L679)
uses [mergeRecord](https://github.com/Herbertofury/Project-Constellation/blob/f46d7bd7e7fbd8771278e66caa36ff77349e63e6/extension/src/brain-core.js#L14-L18),
which raises stored modification times to at least the restore time. A journal
row that is newer in the source files can then look older and be skipped. A
synthetic rehearsal of the pinned functions reproduced that failure for one
overlap while a journal-only row was still accepted.

The optional `riskOfLegacySkip` count is a subset of known newer/equal overlaps
under the stated fresh-restore clock. This is not a live restore simulation of
a populated profile. It does not compare full content, promise that every
listed row is recoverable, perform a write, or change the original extension.
Keep the snapshot, index and journal as separate files.

### Write a new private replay candidate without importing it

First run the verifier and review any ambiguous rows. If you want a separate
inspection copy of the result, choose a **new private local path**:

```sh
node tools/continuity-review/write-constellation-replay-candidate.mjs \
  --index DriveIndex.json --snapshot Backup.json.gz --journal Journal.json.gz \
  --output NEW-CANDIDATE.json
```

The writer rechecks all three inputs. It keeps snapshot order, appends
previously unseen journal rows, and overlays a strictly newer journal row
on its snapshot row, retaining the known base creation time and the exact
journal modification time without dropping unchanged base fields. Older versions stay in the original journal. Equal
timestamps with different objects, duplicate identities, unknown timestamps,
and absent base collections are not guessed: their journal records stay
separate in the candidate for inspection. A null collection means it was
not supplied by the selected base, not empty. Root account/provider
settings and unknown root fields are not copied; keep the original files.

The new JSON contains private records and is **not** an Athena or Constellation
import format; keep it out of shared folders and repositories. The terminal
prints only counts and checksums. The exclusive-create output is limited to
48 MiB, synced and read back for SHA-256 comparison. Mode 0600 applies where
the OS honors it, not as a Windows ACL guarantee. A failed write may leave
a partial new file. Existing files are not overwritten. No network, live
browser storage, imports or cutovers are used.

### Compare against an independent direct export

The original writer captures snapshot rows before uploading, but records the
later completion time as the next journal's strict lower bound. An edit made
in that window may be absent from both files even when all hashes pass.
See [snapshot reads](https://github.com/Herbertofury/Project-Constellation/blob/f46d7bd7e7fbd8771278e66caa36ff77349e63e6/extension/background.js#L2311)
and the [legacy checkpoint and journal writer](https://github.com/Herbertofury/Project-Constellation/blob/f46d7bd7e7fbd8771278e66caa36ff77349e63e6/extension/background.js#L2754-L2852).

If you already have a separately saved plain v7 JSON export from the original
source, select it locally alongside the verified Drive bundle. Prefer a
direct export taken with editing stopped for the comparison, not a copy of
the Drive snapshot.

```sh
node tools/continuity-review/verify-constellation-drive.mjs \
  --index DriveIndex.json --snapshot Backup.json.gz --journal Journal.json.gz \
  --compare-source IndependentExport.json
```

The report counts absent, older, newer, exactly retained and equal-timestamp
but different selected records. Duplicate IDs, unknown timestamps and
ambiguous equal-time backup rows are unresolved rather than guessed.
Comparison is one-way from the selected reference, not a test of everything
ever captured, root settings or media bytes. Later edits can also produce
differences. No content or identities are printed. The plain private input is
limited to 16 MiB; it is never uploaded or changed. Do not delete the old
extension, source records or original backup files based on this report.

### Run the read-only verifier from the unified portable ZIP

You do not need an Athena database, a repository checkout, or a Google account
for this check. With Node.js 24 or later already on PATH, extract the unified
package and select ordinary files outside it:

```sh
python -B launch.py --review-constellation-bundle --bundle-index DriveIndex.json --bundle-snapshot Backup.json.gz --bundle-journal Journal.json.gz --bundle-compare-source IndependentExport.json
```

Use `--bundle-preview-journal` to see the possible legacy replay skip counts.
Use `--bundle-journal` only when the index declares one. The independent
export is optional. Inspection never writes an output file: the JSON report
goes to your terminal. If you redirect it, choose a location outside the
portable package. The optional component can be removed without affecting
normal startup. Selection, hashing and bounded decoding remain the same as
the standalone verifier above. The separate replay-candidate writer is not
included in the package. No Google access, installation, import or restore
occurs.
