# Supplemental Atlas repository metadata preservation

This snapshot supplements the existing Git/wiki bundles and source-work records. It closes the missing labels, milestone linkage, detailed PR metadata and complete deployment-list inventory. The original repository is read-only and has not been deleted or archived.

## Reconciliation

- 15 issue records (14 PRs and release-acceptance issue 15), 14 detailed PR records, 12 labels and milestone 1 are retained with original IDs and timestamps. Issue 15 retains its original milestone description and labels; ongoing acceptance remains work, not a completion claim.
- 16 branch identities, zero tags, zero releases/assets and zero currently available Actions artifacts were observed. Git refs/history are separately preserved by the main/delta bundle restoration.
- All 171 deployment records were paginated rather than truncating at the first 100. Status retrieval succeeded for 104 deployments (520 status records); 67 returned HTTP403. Those denials are explicitly retained and were not retried or bypassed. Successful statuses retain their recorded state and URLs, not external page content. This is an unresolved preservation gap, not a full-status-history claim.
- Three workflow definitions are inventoried. The existing retirement audit retains 522 run summaries; source workflows themselves are retained in Git. Summaries are not raw logs.
- Source issue and PR comment counts are zero, and inline review-comment counts are zero at this snapshot. Existing source-work retains reviews/discussions. GitHub Discussions is disabled.
- A link inventory classifies original source URLs and native/preserved destinations. It is a mapping, **not an HTTP redirect**. The source text and original provenance are intentionally not rewritten. No GitHub user-attachment URLs were found in the inspected retained source text/wiki.

## What deleting the GitHub repository still removes

Deletion removes the original repository, issue/PR/milestone UI identities and original Pages URL. A file snapshot cannot transfer those GitHub identities, incoming links, watchers, permissions, settings or service configuration. This snapshot observed no stars, forks or subscribers. The Pages configuration endpoint was inaccessible to unauthenticated public retrieval (404); no settings, secrets, deploy keys, webhooks or private integrations were read or exported. Projects being enabled is not proof that no project exists. Account-level projects and unavailable local/uncommitted files are outside this repository export.

Expired CI artifacts/logs are already unavailable and cannot be recreated from workflow summaries. Historical deployment log/environment URLs are recorded but are not promised to survive deletion. External consumers of original URLs cannot be exhaustively discovered; the active native Athena app's legacy references were separately verified as provenance only. No claim of universal lossless service migration or automatic deletion authorization is made.

Public GitHub API records were retrieved without credentials. Irrelevant public user-profile fields were removed; the original source author login and substantive issue/PR content remain. No private repository input, credentials, account secrets or paid assets are included.

Run `python tests/atlas_metadata_test.py` for offline integrity, cross-record identity and deployment coverage checks. `manifest.json` records hashes and explicit scope limits. Original source remains untouched.
