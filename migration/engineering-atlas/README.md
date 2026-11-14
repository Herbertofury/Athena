See the [2026-11-14 native parity and retirement audit](retirement-2026-11-14/README.md) for current verification. Older gate lists below are historical.

# Current cutover status

The [2026-11-13 reconciliation](cutover-2026-11-13/README.md) supersedes the source-main revision and open-work inventory below. Athena is the active destination. Historical snapshots remain intact; do not treat preserved candidate branches as accepted implementations.

# Engineering Atlas → Athena migration

Athena is the new home for the learning academy and engineering research. This directory preserves provenance, independent history, and unfinished work. **The source repository is not yet safe to delete.**

## What is carried over

- `../../engineering/` contains every tracked file from Atlas main, with explicitly listed current UI/branding changes. The original bytes remain in the Git history bundle.
- `wiki/` is the exact 75-page native wiki snapshot. `../../wiki/Engineering-*.md` prepares 79 Athena-native pages, including four previously prepared App Study pages. Native publication requires separate verification.
- `engineering-atlas-history.bundle` contains all source heads and pull refs, including unfinished work through draft PR 13. `engineering-atlas-wiki-history.bundle` preserves wiki history.
- `pull-requests.json` preserves PR descriptions, states and exact heads/bases. `discussions.json` records inspected comments/reviews; these were empty for PRs 1–12. PR 13 is a final patch checkpoint and remains draft.
- `workflow-runs.json` retains 509 observed workflow summaries, not expiring logs or artifact bytes. No releases existed at inventory.
- `file-manifest.json`, `source-refs.json`, `wiki-refs.json`, and `wiki-page-map.json` retain exact object and content identities.

## Restore without Engineering Atlas online

```sh
git clone --mirror engineering-atlas-history.bundle recovered-atlas
git -C recovered-atlas fsck --full
git clone --mirror engineering-atlas-wiki-history.bundle recovered-atlas-wiki
git -C recovered-atlas-wiki fsck --full
git bundle list-heads engineering-atlas-history.bundle
```

The bundle preserves original commits, authors and refs. It does not accept the unfinished branches into Athena main. To examine a candidate, create a local branch from its exact saved ref after fetching the bundle. No account credentials are included.

## Name and compatibility

Current interfaces are Athena-branded. The internal `atlas-lab` Rust crate, CLI and database path remain unchanged to avoid silently breaking scripts, saved data or experiment identities. Historic evidence retains original names. Research code lives under `engineering/`; run its existing tools from that directory.

## Verification status and deletion gate

The main source import is verified at Athena commit `af594fd2cdd5c00f01178ee353965a54b01b05d7`: all 1,703 expected files match, including 1,538 source-main files. Independent restoration of both published bundles retains every ref with clean `git fsck`. All 79 Engineering native wiki pages match their hashes at wiki commit `39e4ea8dd42dc6cc67aa82f9302bcb035091e25a`; learning pages and the original welcome remain intact.

The [dated verification directory](verification-2026-11-07/) retains the current Pages artifact (all 272 files match the original docs), public deployment/release inventory, [draft work ledger](verification-2026-11-07/PENDING-WORK.md), test logs and failures. The current cutover updates active Explorer links, issue submission, refresh destination, namespaced wiki projection and generated assets. Historical source citations and the original snapshots remain explicitly historical.

Linux checks passed: 325 Python, 284 JavaScript, 150 main Rust, 25 Rust example and four storage tests, plus Rust formatting/clippy and generated-asset validation. A formatting error and a disk-exhaustion linker failure were retained and repaired/retested. These are not real-browser visual/input acceptance or Windows release proof.

Still required before telling the user to delete the source:

- Configure Athena GitHub Pages, then verify the hosted app, served hashes, navigation and loaded harness identity in a real browser. Automatic enablement was denied; no permission bypass was attempted.
- Activate and run destination Linux/Windows engineering CI. The proposed root workflow is retained in the incoming archive, but its creation was denied because the available GitHub App lacks workflow permission. Existing source workflows remain inert under `engineering/.github/`.
- Reconcile nine current source drafts (#5–#13) as Athena review work. Their exact heads, metadata and complete history are preserved; they are not merged or accepted.
- Review historic source-host citations and any external/local-only work. No GitHub attachment URLs were found in main/wiki Markdown and PR metadata, but that is not a universal local-state inventory.
- Older Actions logs are not fully archived. The 509-run metadata snapshot, current artifact bytes and deployment inventory are preserved; expiring historical logs are not implied by those records.

Do not delete, archive or change the visibility of Engineering Atlas as part of this transfer. No claim of complete migration or release is made while any gate remains open.
