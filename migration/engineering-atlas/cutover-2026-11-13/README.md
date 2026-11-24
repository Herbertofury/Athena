# Engineering Atlas → Athena reconciliation, 2026-11-13

Athena is the continuing implementation, research, wiki and candidate-evaluation destination. Do not schedule new work against Engineering-Atlas. The source repository has not been deleted or archived.

## Complete source inventory

- Source main: `db5a18b65ccb2a71cf28a018ba30fcac40b2431e`.
- All 1,540 tracked source files are represented in `engineering/`; `source-manifest.json` records original content hashes and destination hashes at reconciliation. Existing Athena improvements remain intact.
- Since the previous `089b4ec` snapshot, the SQLite settings validation fix and competitor/reuse hub are reconciled. The README is three-way merged, not replaced by stale source branding.
- All 39 current source refs are recoverable using the original history bundle plus `history-delta.bundle`. The original bundle is unchanged and also retains older ephemeral merge refs.
- Source wiki remains at `57872b979a5a66ae2ee6bc411637d98eb2f2e04b`; its original bundle and all 75 source pages remain preserved. Athena's existing 79 namespaced pages remain, with the newer competitor hub added separately.
- No source releases were returned at this review. PR/issue state is retained in adjacent JSON; the nine open drafts are now the [Athena candidate queue](CANDIDATE-QUEUE.md), not lost work or accepted changes.

## Runtime and checks

The engineering lab already runs within Athena. This change activates the source's Linux/Python/Node and Linux/Windows Rust checks at the repository root, including differential/stress examples and the isolated compressed-storage candidate. Source workflows under `engineering/.github` are historical inputs, not active workflows.

The monorepo link checker now recognizes Athena's parent repository for integrated documentation, while isolated test roots retain their original boundary. Node DOM tests use Athena's locked dependencies.

Run `python scripts/verify_atlas_cutover.py` to verify every source file is represented, reconstruct both bundles, run Git integrity checks, and compare every source blob and current source ref. Current Athena files may intentionally evolve; recorded destination hashes describe this snapshot, not a freeze on future changes.

## Verification and remaining retirement gates

Local evidence is retained in `evidence/`. Hosted workflow success, final published commit, native wiki sync, served app identity and native desktop acceptance must be checked on the exact merged revision. This document does not claim those gates have passed.

The prior archival limitation remains: historical workflow summaries are retained, but expired logs/artifacts cannot be reconstructed from summaries. Source PR discussion and external/local state still require retirement review. Candidate retention is not candidate completion. Keep Engineering-Atlas available until the owner decides those retirement limitations are acceptable; do not delete it automatically.

Private Feature Foundry content is not included or authorized by this migration.
