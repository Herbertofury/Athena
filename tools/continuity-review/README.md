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
