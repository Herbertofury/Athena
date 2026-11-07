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

The migration's baseline is main, not the unfinished draft stack. Independent local Python/JavaScript checks and source/asset validation are recorded in `validation.json`. These checks are not browser or real provider acceptance.

Still required before telling the user to delete the source:

- Verify the final remote Athena tree, fresh complete archive recovery, and exact-head Linux/Windows CI.
- Publish and read back all 79 native Athena wiki pages without overwriting the learning wiki or the user's welcome.
- Verify the combined hosted app, live served assets, navigation, loaded harness identity and old-host dependencies.
- Account for workflow logs/artifacts and any external attachments or source-only local candidates. The connector does not provide collection-level deployment/artifact inventory; metadata alone does not preserve these.
- Reconcile each open draft's review state and remaining acceptance gates in Athena before retiring its old workflow.
- Review remaining historical source-host links; immutable source citations are intentionally not falsified as new Athena commit URLs.

Do not delete, archive or change the visibility of Engineering Atlas as part of this transfer. No claim of complete migration or release is made while any gate remains open.
