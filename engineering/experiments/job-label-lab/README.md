# Correct operation identity in Overview

2026-10-28; discovered in actual cloud-desktop Chromium against the local app at source `9dbe9e82fc48d3459f469755f5879f7fdcb0c52b`.

## Failure and repair

The fallback in the real Overview renderer labeled every unrecognized job as “Identifier deduplication.” New complete-project archive jobs therefore looked like algorithm experiments. The retained [baseline expression](baseline-label-expression.txt) reproduces the error with the actual serialized job shape. The repair uses an explicit discriminator for every current operation; only the real DedupExperiment gets that label. Unknown/malformed operations remain visible but are identified as unrecognized or invalid, not silently reclassified. Archive results also show their canonical ID, exact generation string and retained byte count.

Three focused tests cover the actual baseline failure, all current operation kinds and unknown/malformed records. The native interface was reloaded with the rebuilt executable; all six existing archive jobs showed correct labels and the successful receipts showed their archived identity/generation/size. A same-document hash navigation did not reload old JavaScript; the explicit reload was necessary and is not claimed as an automatic frontend-update feature.

## Native viewer verification

The actual cloud-desktop browser successfully opened the saved-response dialog and downloaded original JSON. A generated case preserved generation `9007199254740993` and raw future integer `18446744073709551617`; its downloaded 217 bytes matched the stored record exactly. After a corrupt-record error (422), reopening the last verified response retained the correct prior identity and text.

A real retained Sodium response also opened and downloaded as exactly 12,840 bytes, matching original source SHA-256 `80b9186e951352b4b265e20cf6e5f57c8646f11b09d6f3a1a8492046acfaf9c0`. Original third-party JSON and databases remain private; [before](native-before.json) and [after](native-after.json) observations contain only scoped metadata/hashes.

The tested executable was launched on the same cloud desktop as the browser, still bound only to loopback, with a bounded lifetime. No tunnel, wider network binding, credentials or security-setting change was introduced. Earlier command-runner loopback attempts were not reachable from the browser; their failure is not erased. The owned desktop test server was explicitly stopped afterward.

## Live collection result remains a failure

One actual form submission attempted the fixed, unauthenticated public Modrinth request. It failed to connect. Job 7 was correctly marked failed and prior generation 1 remained available and byte-identical. The [failure receipt](live-request-failure.json) is retained. Browser control initially failed before submission; the database confirmed no new job before one retry after runtime recovery. No provider-bypass retry, token, proxy change or fallback success was used.

This closes selected dialog/download/label checks on one cloud Chromium environment. It does not establish Windows desktop behavior, all native interactions, peak memory, full UI latency, successful fresh collection, or another project's acceptance. The native cancellation control is still separately unverified; its state logic has unit coverage.
