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
