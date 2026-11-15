# Retained Windows fixture collision and deterministic repair

Postmerge native run [43694791424](https://github.com/Herbertofury/Athena/actions/runs/43694791424), Windows job 132752847326, failed at `music_precision.rs:12` before the new Scrapbook tests. Linux passed. The premerge #215 Windows/Linux run 43694262075 had passed; it does not erase this failure.

Observed diagnostic:

```text
upgrade_preserves_unknown_precision_and_old_import_contract ... FAILED
called Result::unwrap() on an Err value:
Os { code: 80, kind: AlreadyExists, message: "The file exists." }
tests/music_precision.rs:12:35
```

The helper used only process ID plus system-clock nanoseconds for each SQLite fixture. Both tests run concurrently in one process, and clock readings need not be unique. The native store correctly refused to overwrite an existing path. The subsequent missing-browser-artifact upload error followed the early test stop; no artifacts were deleted.

The helper now adds an atomic per-process sequence. A deterministic test requests 800 names concurrently from eight threads using an identical fixed clock tick and requires all names to differ. No production storage validation, exclusivity, permissions or assertions changed. Three local music-precision tests pass with the repaired helper. Hosted Windows/Linux verification is required separately and recorded in this PR's checks. Existing source data and databases are untouched.
