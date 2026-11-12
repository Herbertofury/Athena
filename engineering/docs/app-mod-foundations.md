# App, mod and asset foundations

This is the shared entry point for Athena's November 11 foundation research. It connects twenty separately reviewed contributions into a usable sequence while preserving their original guides, sources, experiments, failures and evidence limits. It is a research integration candidate, not a production release or approval to change another project.

## Start with the outcome

Choose a route below, write down the current target revision and required behavior, then run the relevant lab before designing a target-specific comparison. An experiment passing here does not prove that its approach is safe, faster, compatible or accessible in the target application.

### Build an app that can recover

1. [Recovery-first architecture](recovery-first-app-foundations.md) sets ownership, durability, cancellation and release boundaries. Use the [SQLite recovery drill](../experiments/sqlite-recovery-drill/README.md) to distinguish file integrity from complete semantic recovery.
2. [Bounded read queries](../experiments/sqlite-query-boundary-lab/README.md) restrict trusted-schema reads, operations and complete-result budgets. These controls are not a hostile-database sandbox or strict CPU/RSS deadline.
3. [FTS consistency and rebuilds](fts-consistency-foundations.md) tests whether search postings agree with canonical content. A healthy database or normal row count does not establish a healthy external-content search index.
4. [Conditional edits](conditional-edit-foundations.md) separates current representations, stale writes and revalidation. [Retry and idempotency](retry-and-idempotency-foundations.md) separates a safe repeat from an operation whose outcome is unknown.
5. [UI, card and media acceptance](ui-card-media-acceptance.md) and [Unicode discovery and composition](unicode-search-and-text-input.md) connect complete data to usable presentation. Synthetic timing arithmetic and string tests do not replace browser, assistive-technology or native-webview acceptance.

### Import files and run owned helpers

1. [Bounded file ingestion](bounded-file-ingestion-foundations.md) retains explicit inventory, byte and cancellation boundaries.
2. [Read-only ZIP inspection](zip-inspection-foundations.md) checks complete streams, names, framing and CRC within a deliberately restrictive ZIP32 subset. Refusal is not proof that an arbitrary archive is malicious, and successful inspection does not authorize extraction or execution.
3. [Subprocess pipe ownership](subprocess-pipe-foundations.md) drains both output pipes and separates capture budgets, pipe EOF, process exit and cleanup. Its trusted fixed helper is not arbitrary-command isolation or process-tree control.

These labs concern different resources. A row limit is not a query CPU limit; a captured-output limit is not a child-memory limit; an archive output limit is not a security sandbox. Compose the boundaries explicitly instead of treating one passing gate as all of them.

### Build and package a mod

1. [Build and native acceptance](mod-build-acceptance.md) fixes the game, loader, Java, mappings, dependency and packaging lane before testing. Keep client, server, save and interruption outcomes separate.
2. [Dependency language semantics](mod-dependency-semantics.md) tests Fabric/Maven API interpretation on declared synthetic cases. [Dependency resolution and verification](mod-dependency-resolution.md) then separates selection, version locks, resolved bytes and checksum enforcement. Neither lab implements a universal mod resolver or proves the provenance of downloaded binaries.
3. [JVM loading boundaries](mod-classloading-boundaries.md) distinguishes discovery, linking, initialization and invocation. Fresh fixture loaders do not establish game hot reload or compatibility.
4. [Bytecode selector acceptance](mod-bytecode-acceptance.md) tests exact selection and drift with original class fixtures. A selector count is not semantic correctness or an in-game injection result.
5. [Resource packaging](mod-resource-packaging.md) checks resource names, visibility, collisions and byte identity after packaging. Finding a resource is not proving that the target renderer, game or loader accepts it.

The [mod development overview](mods.md) retains earlier research and links every new layer. Use the specific receipt linked from each guide rather than collapsing every result into a single compatibility flag.

### Carry an asset into its real renderer

1. [Asset import acceptance](asset-import-acceptance.md) records the original visual/semantic contract and the actual target importer, renderer, packaged build and required extensions.
2. [glTF validation boundaries](gltf-validation-boundaries.md) demonstrates why zero reported validator errors can coexist with changed animation, missing animation or unsupported required behavior. The original fixture-data gate is narrower than arbitrary glTF fidelity.
3. [Texture semantics](texture-semantics.md) separates linear-light color filtering, scalar data, alpha association and cutout coverage. The [pinned CPU resampling lab](../experiments/texture-resampling-lab/README.md) preserves actual numeric results and deliberately wrong semantic controls. These two-sample CPU results do not establish GPU filtering, mip quality, normal-map correctness or game acceptance.
4. Run the target import, animation, materials, lighting and packaged-runtime checks in the [asset receipt](../templates/asset-compatibility-receipt.md). Structural evidence does not establish visual equivalence or complete animation playback. Use the [texture acceptance receipt](../templates/texture-acceptance-receipt.md) for texture roles, alpha mode, mip/compression behavior and actual renderer evidence.

The [game and asset overview](game-assets.md) connects these additions to existing asset-pipeline research.

### Collect provider data without overstating coverage

1. [WordPress collection evidence](adapters/wordpress-collections.md) reuses the existing single-post parser while reconciling supplied REST pages. The real broad collection has 1,115 missing pages after two captures; a separate two-ID query covers its selected scope. Neither is a stable snapshot or complete history.
2. Keep request failures, conflicting records, protected/null bodies, author joins and featured-media identity separate. Media discovery is not delivery, decoding or playback. The offline [collection experiment](../experiments/site-extraction-lab/wordpress_collection.py) performs no network or account action.
3. [Commons upload revisions](adapters/wikimedia-commons.md#november-11-scoped-revision-evidence) preserve two upload events that share a SHA-1, exact returned continuation fields and the difference between incomplete broad history and an exhausted filtered window. The [offline replay](../experiments/commons-audio-lab/README.md#november-11-scoped-upload-revision-chains) keeps hidden/missing metadata, request failures and conflicting variants explicit; no stable snapshot or media playback is inferred.
4. [Bluesky thread context](adapters/bluesky.md#scoped-thread-context--november-11-2026) reuses the existing post normalizer to preserve ancestor/reply relationships, unavailable states and URI/CID reference agreement. Three real public captures show why reply counts and absent arrays are different observations. The [offline thread experiment](../experiments/bluesky-thread-lab/README.md) does not establish complete history, verified deletion, cryptographic authorship or playback.
5. Use the [provider adoption contract](adapters/validation-and-adoption.md) before recommending a target integration. Actual transport, permissions, complete required fields/media and interrupted user flows still need an equivalent-work comparison against that target's current implementation.

## A shared evidence contract

| Gate | Evidence needed | What it does not establish |
|---|---|---|
| Identify the inputs | Target revision, original inputs, versions, hashes and complete workload | Authenticity or permission merely because a checksum matches |
| Establish component behavior | Exact commands, runtime, synthetic/real labels, expected failures and full output | That a different API path or version behaves the same way |
| Preserve the required result | Explicit data, warning, security, recovery and user-experience checks | Complete native acceptance from partial or structural checks |
| Test the real target | Its current baseline, complete equivalent workload and relevant interrupted/repeated flows | A universal recommendation or permission to upgrade another project |
| Accept a change | Reviewable comparison, rollback/recovery plan and all target gates passed | A speedup established only by warm-cache timing, dropped work or hidden warnings |

Source observations, stored receipt validation, fresh execution and target acceptance are separate evidence. Retained receipts are internally checkable records, not signed or authenticated execution. Preserve contradicted hypotheses and initial failures rather than rewriting them as successes.

## Integration and reproducibility

The [integration record](../research/2026-11-11-foundations-integration.md) identifies every originating PR and frozen head, the shared-file union, aggregate checks and remaining gaps. All existing source records and twenty additive fragments remain in the [complete source index](../data/source-index.json). The Research Explorer's existing catalog and rankings are unchanged; these new guides and experiments are navigated here rather than represented as new ranked catalog entries.

The published checker fix now permits the canonical repository’s reviewed sibling docs directory while retaining custom-root confinement, traversal and symlink protections. The complete research check and Engineering aggregate tests pass locally; this does not establish hosted-CI or native-app acceptance. The exact published host-navigation repair also prevents an obsolete lesson-close event from rerendering a newly selected route; its browser acceptance is reported separately for the combined head. No workflow, merge or deployment change is included. Read each experiment's requirements before executing it: dependency-backed runs require its exact pinned local dependency, while offline receipt tests are a different verification stage.

See [research method](research-method.md), [testing and release](testing-release.md) and [cross-project adoption guidance](../CONTRIBUTING.md) for the broader contract.
