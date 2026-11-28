# Review a closed Feature Foundry database before importing

This offline CLI prepares an independent snapshot of a deliberately stopped
Feature Foundry v24 source using Athena's existing checked SQLite copy
implementation. It reports the SHA-256 to record and what the native importer
recognizes or skips. It does not migrate the original in place.

```text
python -B launch.py --prepare-foundry-legacy OLD.sqlite --legacy-output REVIEW.sqlite --source-quiescent
python -B launch.py --import-foundry-legacy REVIEW.sqlite --legacy-output NEW-ATHENA.sqlite --expected-legacy-sha256 REVIEW_HASH
```

Use new paths outside the verified package. Keep Feature Foundry closed and
preserve the original plus any recovery files. The same Windows/POSIX
exclusive publication rules and existing Python SQLite WAL qualification
apply. The second operation checks the exact reviewed bytes before starting,
uses a private staging folder, and requires a standalone current Athena
database before publishing. Before publishing, Athena reopens the new database and compares every supported
soundtrack field by exact theme and room, including original second-resolution
timestamps and unset millisecond precision. Existing files and live profiles are not replaced.
The report identifies that the importer is partial. Skipped original history,
custom records, media fidelity, the owner's original data and source retirement
are separate checks. Report troubleshooting facts without publishing private data.

To preserve original legacy events outside the active database:

```text
python -B launch.py --archive-foundry-legacy-history REVIEW.sqlite --legacy-output PRIVATE-HISTORY.json --expected-legacy-sha256 REVIEW_HASH
```

The archive retains each event's original JSON text and SHA-256 in event-ID
order. It is inert: Athena does not turn those events into active revisions or
replay them. The terminal shows only the count and hashes. Keep the archive in
a private folder (with private inherited permissions on Windows): original event contents may include personal data. An
invalid event or an exceeded row/byte budget stops the export without writing
a partial archive. This export does not cover other skipped database tables.

To retain the original catalog without making it active, run:

```text
python -B launch.py --archive-foundry-legacy-catalog REVIEW.sqlite --legacy-output PRIVATE-CATALOG.json --expected-legacy-sha256 REVIEW_HASH
```

The new private archive preserves every documented original field for theme
packages, rooms, ecology objects, artist worlds, districts and weather, and
music routes, including original JSON text and its individual SHA-256. The
receipt includes counts and hashes only. Absent optional tables are reported
separately from empty ones. No catalog row is installed, executed or attached
to an active profile; soundtrack assignments, other tables and referenced media
files are not included. The seven-family output uses archive schema 2. Keep the reviewed source and any
associated files. Malformed input, a changed source hash or an existing output
is refused, with no replacement.


Open **Migration readiness → Feature Foundry → Review an original catalog
archive** in the local Athena package to browse an unchanged archive. The
viewer searches a selected family and checks the original JSON fingerprint
before opening any record. Both supported archive schemas remain readable.
It reads the file in the current browser only, does not write it back, and
cannot activate anything.


To verify the whole file against a separate trusted receipt, paste its archive
SHA-256 into the viewer before choosing the file. A mismatch stops the file
before any records appear. The viewer also displays the SHA-256 for a file
opened without a pin; an unpinned hash is not independent proof of origin.
