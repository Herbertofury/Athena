# Athena shared agent guidance migration

**Destination:** Athena. **Source:** [Herbertofury/Agent-Foundry](https://github.com/Herbertofury/Agent-Foundry), pinned `87166b5f6a621c61b90bbbfe90835a3752c1c51b`. **Retirement: NOT READY.** Preserve the source; do not delete or archive it.

This is the AGENTS.md/Skills/repository-alignment project, distinct from the creative Feature Foundry app. Athena absorbs its capabilities under the Athena name. Modding-Knowledge remains a separate database home. Project-specific instructions never become public shared policy automatically.

## Capability reconciliation

| Capability | This slice | Remaining acceptance |
|---|---|---|
| Versioned 16-file engineering core | Native `guidance/`, Athena identity and release 2.0.1 | Native application navigation/editor/search and real project acceptance |
| Explicit repository plan/apply/status | Ported with local-rule preservation and test coverage | Reviewed migration for existing Foundry locks; each consumer tested separately |
| Desired-state multi-agent Skill installs | Source inventoried, not ported | Target-native compatibility; unmanaged conflict/rollback tests |
| Eight packaged Skills and domain assets | Source inventoried, not copied | Per-component rights/private-data review; preserve capabilities/assets and author attribution |
| Deterministic bundles, receipts, supply chain | Source inventoried | Athena-owned packaging/attestation/release compatibility |
| Protocol/adapters, evals, failure intelligence | Standards preserved; registry snapshot retained | Actual runtime adapters/evals and incident workflows |
| Wiki, source history and releases | Source commit/tree and all 528 file digests recorded | Full history, live wiki, release artifacts, old links and external dependencies reconciled |

## Retirement gates

1. Reconcile every source capability against an implemented Athena capability, an explicitly accepted replacement, or a retained archive dependency. A filename inventory is not parity.
2. Review all third-party rights, credentials/private material and assets before publication; preserve notices. No overall license is guessed.
3. Preserve accessible history, wiki and release provenance, and verify recovery independently. Hashes alone are not a recoverable backup.
4. Inventory consumers referencing `.agents/foundry`, `.agent-foundry`, old source URLs, wiki links and release bundles. Review/migrate only explicitly scoped targets, preserving root/nested/override rules and edits.
5. Run complete source/tooling/packaging suites, target-native adapters, and Athena UI end-to-end acceptance. Fixture tests are not an installed fleet.
6. Verify exact remote blobs, applicable CI, live wiki and actual app loading separately. Only then tell the user separately whether this source is safe for **them** to delete. Never delete it automatically.

## Scope and security

No fleet writes, source deletion, archive/visibility changes, new credentials, grants, external skill execution or private-data publication are part of this slice. No root AGENTS.md or personal assistant instructions are changed. Existing consumers keep their known-good Foundry pins until reviewed migration, rather than a blind rename that loses authority boundaries.
