# Portable unified local profile

The optional `scripts/package_native.py --engine BUILT_ATLAS_LAB --engine-sha256
REVIEWED_SHA256` packages the existing unified Rust engine alongside the native
store CLI. Existing standalone packages remain unchanged. Both binaries must be
locally built/reviewed for the selected platform; hashes establish exact bytes,
not publisher authenticity. No binaries, user DBs or credentials are committed.

Runtime assets come from the already-published allowlist through the existing
`package_app.py` generator. This does not change any runtime source, reviewed
allowlist or held runtime manifest. The package receipt includes the generated
runtime manifest/redirect and all helper bytes. Verification opens no DB or binary.

After explicit separate first-run creation, start with:

```
python -B launch.py --database EXISTING_NATIVE_SCHEMA15.sqlite --journal EXTERNAL_EVIDENCE.sqlite
```

Both paths are explicit and outside the package, with no `..` components. A new
journal must have no stale sidecars. Existing native engine guards additionally
reject cross-store main/sidecar aliases and hardlinks before opening either store.
The two SQLite stores have distinct roles but share one local Athena navigation
and origin. This is not an account grant, automatic import, live backup or restore.
The Python SQLite WAL guard and held R&D #229 remain unchanged and unincluded.

On POSIX the verified engine replaces the launcher process. Windows10+ uses an
owned Job Object with kill-on-close and process-creation job membership,
then resumes the suspended engine. Unsupported job/attribute/nested-job behavior
fails closed without breakaway fallback. Normal exit preserves the engine status;
Ctrl-C and exceptional cleanup terminate only the owned job. The supervisor reports
unverified shutdown if bounded waiting fails. Do not infer power-loss durability or
universal no-orphan behavior from a limited hosted test. No service or installation
is registered and no OS security settings are changed.

## Acceptance evidence and limits

Workspace disk exhaustion blocked the first tests. A separately verified `/tmp`
tmpfs allowed isolated source/testing without deleting other workers' files. Prior
source and held patches were retained. Six existing package tests, five parent-path
tests and four new optional-profile tests passed. Twenty-eight portable regressions
then passed using the explicitly selected retained schema15 CLI. The first aggregate
attempt omitted that binary path and failed with missing-fixture errors; it was not
counted as code acceptance.

Actual Linux packaged HTTP acceptance passed: guards, stale CAS, dual-store state,
controlled stop/listener closure and restart. It used verified prior #228 engine
SHA256 `85dd1345f58b9b4e214fd3c0e9c24bdafd8cf99071b64e98d2d3e32ab45d65a7`
and retained fixture CLI SHA256
`607e41797043539b80a8e706a2c8296de1e3646542fc00c5357d86001937e91d`.
That CLI is not claimed to be the latest source. Exact-current binaries and real
Chromium tests must pass on hosted Windows/Linux before merge. Windows-specific
failure injection and forced-supervisor-exit tests are skipped locally on Linux,
not reported as passed. No user-machine, installer, private migration, all-media
or repository-deletion readiness claim follows from this portable profile.

Windows API reference: [creation-time job-list attribute](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-updateprocthreadattribute).
This avoids a separate post-create assignment step; it is not proof of transactional
OS behavior under every forced termination inside CreateProcess itself.
