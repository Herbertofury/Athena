# Review a local Project Constellation v7 export

From a verified unified Athena package, explicitly select a stopped local
Project Constellation export:

```text
./atlas-lab review-constellation-v7 /path/to/export.json
```

On Windows use `atlas-lab.exe`. No browser, network request, account, file
rewrite, import, or restore is involved. The JSON receipt reports only
coverage, writer-reported counts, bounded export omissions, basic dangling
turn/revision links, and selected artifact and lifecycle counts. Missing is
distinct from empty. Unsupported or malformed exports are refused without
echoing file paths, row IDs or raw content. Files above 16 MiB remain outside
this preview; keep the original and do not truncate it. Review only stopped
exports from trusted local directories.

Add `--include-fingerprint` only when a private exact-byte comparison is
needed. SHA-256 is omitted by default. Keep the receipt private when the
counts or fingerprint are sensitive. A fingerprint is not authentication
or proof a report can be restored. This preview does not certify full
migration, browser attachment fidelity, owner data or source retirement.
