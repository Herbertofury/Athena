# Two-consumer Agent-Foundry retirement review

This is a bounded read-only review, not fleet migration or retirement certification. [Machine-readable receipt](bloom-modhunter-consumer-audit-2026-11-15.json) records exact public source heads, hashes, scan exclusions and transition status. Source repositories and all consumer instructions remain unchanged.

## Fresh findings

- Bloom-and-Boom `a38b442c82559ca1c6af94a4b7edafbcd770201b`: 28 tracked text files inspected, 5 paths uninspected; seven files contain legacy references.
- Modhunter `1a99a66d346b1593273afc7c2b12e2d493c8d5e0`: 359 tracked text files inspected, 61 paths uninspected; three files contain legacy references.
- Agent-Foundry main still resolves to `87166b5f6a621c61b90bbbfe90835a3752c1c51b`. Both consumers pin its 1.1.2 core; all 16 local managed snapshots match the preserved canonical hashes. Neither has an Athena lock. These local files survive removal of a remote URL; their presence is not proof of harness behavior.
- Athena's existing read-only transition planner finds no destination conflicts and proposes 16 paths for Athena 2.0.1. A mechanically clean proposal is not semantic approval or completed adoption. No apply command was run.

## Dependency classification and concrete next actions

1. **Local instruction routing:** both root AGENTS.md files direct readers to `.agents/foundry/AGENTS-adapter.md`; that adapter directs proposed shared changes back to Agent-Foundry. This is an active guidance/maintenance dependency, not demonstrated application runtime failure. Review Athena policy differences, preserve every local/nested instruction and skill, prepare tested rollback, then perform only an explicitly scoped consumer transition and actual harness acceptance.
2. **Bloom canonical guidance URL:** its root AGENTS.md links the legacy PRODUCT_INVARIANTS anchor. Migrate the routing only alongside reviewed adoption, not a blind URL replacement that changes policy authority.
3. **Bloom historical build evidence:** BUILD-AND-TESTING, REFERENCE2, REFERENCE3 and STATUS link Minecraft Dev Kit reference tooling, authority documentation and historical CI run 37574846858. Preserve dates and original provenance. Recover/reconcile referenced skill capabilities and CI evidence before offering durable Athena replacements; do not rewrite history as fresh verification. This review did not rerun those builds or inspect private bundles.
4. **Modhunter project-local skill:** `.agents/skills/modhunter-profile-lifecycle/SKILL.md` remains local and is referenced by its own AGENTS.md. Do not promote this project-specific contract into the shared core or overwrite it during adoption.
5. **Skill propagation remains distinct:** pinned Agent-Foundry tools/README.md separates desired-state skill plan/apply/status (copy/symlink), per-skill packaging and validation from repository core adoption. Athena's eight-skill structural preflight and 16-document reference bundle do not establish installed-client parity, rights clearance, target-native adapters or propagation rollback. No skill was executed, installed or copied by this pass.
6. **History and unseen consumers:** a source commit and file digests are not recoverable complete history/wiki/releases. Preserve existing source, audit remaining explicit consumers, reconcile refs/wiki/releases and independently restore verified backups. These two fresh checkouts do not close any fleet or retirement gate.

## Method and limitations

Used Athena `a3c6058a` audit_consumers.py and plan_transition.py; their exact blob hashes were compared with the remote tree before running. Fresh GitHub main snapshots were checked against API-resolved commits; working trees remained clean afterward. The first local shared-clone attempt encountered missing promisor objects; a fresh shallow public clone succeeded. This is not a full-history backup. Scans skip unsupported/binary paths, and textual counts do not discover dynamic runtime dependencies. No private contents, absolute machine paths or credentials are included in the receipt. No other project was changed. Existing Atlas/Foundry/Constellation/Agent-Foundry retirement gates remain open.
