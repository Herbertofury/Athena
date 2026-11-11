# Recovery-first app foundations: 2026-11-11

## Decision and inspected baseline

How can Athena provide reusable architecture, performance, storage and security foundations without converting a technology catalog into unearned production claims?

Inspected public Athena main `44384b809c80e03adbd62f8be9617d01e6ad9922`, including the stack map, performance/storage/security guides, 38 planned comparisons and existing SQLite contract/content-addressing labs. All 1,549 engineering input blobs were reconstructed with matching Git blob identities. The new contribution fills a specific gap: an executable database-aware backup, fresh-destination restore and transactional migration drill with explicit failure states.

Active Foundry/native integration drafts were inspected for scope only. This contribution does not modify their source, runtime manifests, workflow, browser harness, release assets, user state or production SQLite settings. It changes one source-index entry and adds new original research/example files.

## Outputs

- [Recovery-first application architecture](../docs/recovery-first-app-foundations.md): operation ownership, bounded work, cancellation/retry ambiguity, backup/restore, schema evolution, privileged boundaries and release evidence.
- [Runnable SQLite drill](../experiments/sqlite-recovery-drill/README.md): source, reproducible invocation, tests and retained synthetic evidence.
- [Fifteen source observations](../data/sources.d/recovery-first-app-foundations-20261111.json), all primary documentation reviewed on 2026-11-11. Documentation versions and local executed versions are separate.

No existing technology rating, measured comparison cohort, active application behavior or performance recommendation was promoted.

## Evidence and negative controls

On Linux/Python 3.12.14/SQLite 3.53.1, all 17 new test methods passed. A raw main-file copy of a controlled live WAL database passed structural integrity but missed one committed record. Two other fixtures passed structural integrity while containing a broken foreign key or mismatched payload identity. These observations justify separate completion and semantic checks within this fixture, not a claim that a production backup is now safe.

Controlled migration exceptions and child-process exits preserve the expected precommit or committed state. A backup copied back into a new isolated database preserves complete v1 payload while the source remains migrated to v2. The lab intentionally does not replace an active database, use real user data, enforce hostile filesystem isolation, claim hard deadlines, compare performance or simulate physical power loss.

## Validation and retained failures

- Focused final recovery suite: 20/20 passed. Initial focused run is also retained.
- Complete engineering Python suite: 346 tests, 345 passed and one inherited error, no skips after including the exact root report-template fixture.
- Pristine main comparison: 326 tests, 325 passed and the same single error. The unchanged research checker rejects the existing `apps/atlas-lab/README.md` link to `../../../docs/athena-local-runtime.md`, outside the engineering root. The failure is not suppressed or fixed here.
- Research Explorer, card assets and media assets generated-content checks passed. The complete engineering JavaScript suite passed 303/303 after installing the pinned root dependency tree with lifecycle scripts disabled.
- The first source-index attempt sorted the baseline file after fragments; its check failed. The corrected index preserves the loader's baseline-first contract. The initial JavaScript attempt lacked the root LinkeDOM dependency; that setup failure is retained locally rather than treated as a product failure or erased.
- Version-specific Tokio URL verification attempts were inaccessible through the research tool. The final links use the successfully read official `latest` pages and record their observed 1.54.1 version. They are not represented as immutable URLs.

[Validation receipt](../experiments/sqlite-recovery-drill/validation-summary.json) records the exact scope. Hosted CI and remote publication must be checked for the final commit; local evidence is not a substitute. No merge or deployment is requested.

## Independent review correction

The initial 17-method suite compared item payloads but omitted owner content and migrated labels from its digest. Independent review reproduced those omissions. The final validator includes complete owner and item records in a logical digest, checks the v2 label invariant, and retains separate original-payload/owner digests for cross-version comparisons. Three new tests reject the missing coverage and exercise deadline expiry during copying. Initial evidence remains visible and is not promoted to full-content proof.

## Sources and revisit conditions

Source IDs: [AF26001], [AF26002], [AF26003], [AF26004], [AF26005], [AF26006], [AF26007], [AF26008], [AF26009], [AF26010], [AF26011], [AF26012], [AF26013], [AF26014], [AF26015].

Revisit when the target's runtime/SQLite version, schema, filesystem, shell security boundary or data volume changes. Before adoption, add actual application migrations, cross-platform and disk-fault tests, real workload timing and a tested platform-specific publication/restore boundary. A passing generated drill is one foundation, not the acceptance decision.
