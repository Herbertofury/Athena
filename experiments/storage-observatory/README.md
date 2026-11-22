# Athena Storage Observatory (isolated experiment)

Original read-only capacity visualization. Start a static HTTP server from the repository root and open `experiments/storage-observatory/`. Do not open as file:// because module imports need an HTTP origin.

`node --test experiments/storage-observatory/*.test.mjs` runs the six model/DOM tests using the existing linkedom dependency. No new dependencies.

Demo values are fictional. User-selected JSON reports are read into memory only, not uploaded, saved or disk-verified. The browser page cannot scan, clean, delete or access arbitrary native files. See [research, limitations and backlog](../../docs/ui-design-library/storage-management-study.md).

## Optional measured root report (Linux)

`measure.py` now produces a bounded aggregate report from one explicitly selected
named Linux directory. It does not scan anything until started manually.
Use only a directory you own and have selected for this purpose. Choose
recognizable (and, if sharing, non-sensitive) labels. Send the JSON output to
stdout or a **new** report file outside the observed root, then open it with the
existing file picker. A supplied report stays unverified by the page.

```sh
python3 -B experiments/storage-observatory/measure.py /absolute/selected/root \
  --category 'Source files=src' --category 'Media files=assets'
python3 -m http.server 8000 --bind 127.0.0.1
```

The observed value is `st_blocks × 512` once per file (device and inode). The
logical value counts every in-scope regular-file pathname. Hardlinks seen in
separate categories are charged physically to a separate Shared row; neither
category's logical pathnames disappear. Reflinks, compression, directories,
filesystem overhead and free or reclaimable space are not estimated. An inode
linked from outside the root may be shared with other work; do not interpret
unique file blocks as exclusively owned by this project or reclaimable.

Local data does not enter the browser except the selected report. The report
contains UTC observation time, aggregate counters and explicit display labels,
not paths, directory-entry names or data-file bytes. The scanner uses Linux
no-follow directory descriptors and checks mount IDs, including same-device
mounts. Owned directories are opened for enumeration with `O_NOATIME`; no file
contents are opened, and symlinks, mount crossings and special entries are
excluded and counted. It skips unreadable or changed entries and flags entry,
depth or cooperative time limits (20,000 / 24 / 5 seconds). Interrupting the run
does not emit a complete report. This is an observation, not a snapshot: it
cannot guarantee a stable result with active outside moves, writes, mount
changes or hung IO. Folder renames on a live tree, permission changes and
unsupported filesystem semantics should be treated as unresolved. This local
prototype has no Windows backend, no automatic scan, no integration into the
main Athena navigation, and no control that changes or deletes files.

Acceptance: `python3 -B -m unittest discover -s experiments/storage-observatory
-p test_measure.py` (single shell line) and the Node tests above. The native
fixture compares actual sparse file and hardlink sizes/blocks/IDs against GNU
`stat`, verifies out-of-root links aren't traversed and checks source bytes and
metadata unchanged. The mount-boundary check injects a distinct mount ID; it
never mounts anything. The measured-JSON UI test uses real CLI output and
LinkeDOM; no rendered Chromium or Windows evidence.
