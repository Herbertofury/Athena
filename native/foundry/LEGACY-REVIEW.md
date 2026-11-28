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
database before publishing. Existing files and live profiles are not replaced.
The report identifies that the importer is partial. Skipped original history,
custom records, media fidelity, the owner's original data and source retirement
are separate checks. Report troubleshooting facts without publishing private data.
