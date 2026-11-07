# Verified Engineering Atlas transfer

This ZIP is the user-requested relocation of the public Engineering Atlas main snapshot, with explicit Athena UI branding, preserved wiki pages, and migration manifests. The source repository remains untouched.

- ZIP SHA-256: `9fab5ca27ace20d317f7a8c6acf2c45e3bb513a5d1ed2894050ba1cdcea94298`.
- Source main: `089b4ecfc4046fbef6eb70469185801bc3382759`.
- 1,702 exact file entries; two full-history bundles are adjacent under `migration/engineering-atlas/` and independently verified by the manifest.
- No local scratch logs, secrets or learning-owned files are in the archive. Existing public experiment evidence is preserved, not reclassified as new private telemetry.
- The import workflow verifies the ZIP and every file hash, refuses path escapes and conflicts, runs the existing checks, then commits only reserved paths. It uses the ordinary ephemeral repository token, no persistent credentials.

An uploaded ZIP is not proof of finished migration. Native wiki, remote content, source recovery, hosted app, pending drafts and external dependencies must still be verified before source deletion is considered.
