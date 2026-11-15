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
