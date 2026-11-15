# One-origin native evidence and authoring · 2026-11-15

Implementation links Athena's existing native authoring library into the evidence
engine as an explicit dual-store profile. Existing approved runtime bytes are
unchanged; no held manifest or denied revision-preview payload is included.

Local actual HTTP acceptance uses disposable synthetic stores and the existing
built-in offline dedup experiment. It verifies both stores persist across restart,
CAS rejects stale writes, revisions remain accessible, DB/sidecar ownership,
pre-body authorization, duplicate headers, oversized length, four concurrent slow
body admission and body deadlines. Strict all-target clippy passed. The dedicated
native SQL test runs an intentionally expensive read and verifies cooperative
interruption and unchanged database bytes. No malicious private inputs are used.

The initial HTTP harness passed a Unicode body as Latin-1 text; corrected to UTF-8.
Independent review identified reciprocal/within-store alias gaps, CSP local-media
parity, pre-body admission and operation deadlines; implementation and tests were
expanded before publication. A disk-full build then left an older executable, and
one follow-on oversized-body check mistakenly ran it. That failure is retained,
not evidence of the final code. After removing only owned regenerable test outputs,
the rebuilt exact engine passed HTTP acceptance. Original source/evidence/held
patches were preserved.

Actual Windows/Linux browser acceptance is required before merge: same document
Lab/Foundry navigation, PNG decoding, synthetic VP8 playback (no autoplay), native
workspace editing/save/reload/restart/history, soundtrack conflicts and stopped
backup. Results must distinguish passed hosted tests from the user's device.

Limits: explicit schema15 authoring DB, separate evidence journal, no legacy import
in this profile, no source retirement claim. Private directory trust is necessary;
path checks are not race-proof local sandboxing. SQL deadline is cooperative and
response timeout does not prove transaction cancellation. See the runtime guide
for exact byte/time/admission bounds and uncertain-outcome behavior.
