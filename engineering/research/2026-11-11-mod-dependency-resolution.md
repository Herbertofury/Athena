# November 11, 2026: build dependency selection and integrity

## Gap and decision

Main `44384b809c80e03adbd62f8be9617d01e6ad9922` and active drafts through #41 were checked before work. The version-API lab, resource packaging lab, class-loading lab and asset validation lab answer other questions. This contribution tests an actual build resolver: transitive selection, strict/force overrides, lock persistence, changed coordinate bytes and whether the chosen API actually triggers verification. It modifies no target project, release implementation, workflow, held material or catalog ranking.

## Measured result

The [original local-Maven lab](../experiments/dependency-resolution-lab/README.md) uses a checksum-pinned Gradle 9.2.1 distribution in 15 isolated offline cases. All declared outcomes match, including four expected build failures. It retains full repository bytes, resolved artifact bytes, requested/selected graph edges, selection reasons, lock/verification files, commands and raw console records. No fixture JAR contains executable classes.

A root strict constraint and a force both downgrade the ordinary transitive request, with different selection reasons. Incompatible strict requirements fail. A lock holds a dynamic version despite a new release but does not hold its artifact bytes. Verified-file resolution rejects changed JAR and POM content; a resolved graph can precede that failure. The explicit legacy artifact-enumeration control returns changed JAR bytes in this pinned configuration. See the [guide](../docs/mod-dependency-resolution.md) for exact scope and upstream implementation context.

## Preserved failures and rejected assumptions

Two exploratory predictions were wrong: the root strict constraint was expected to fail against an ordinary transitive higher request, and legacy artifact enumeration was expected to enforce the changed JAR checksum. Both actually succeeded. [Initial evidence](../experiments/dependency-resolution-lab/initial-observations.json) includes their complete console/graph/output records, the original build hash and a separate file-collection follow-up that failed verification. The final fixture declarations reflect those observed distinctions; this is an iterative engineering experiment, not a pre-registered blind benchmark.

Independent review identified an early receipt-validation gap: synchronized deletion of graph edges, or removal of a failed-run graph, was accepted. The hardened runner requires every fixture's graph and checks its component/edge topology, including unresolved negative-case edges. XML structure, exact typed nested values, output-preservation guards and malformed receipt regressions are also checked. These checks improve accidental/inconsistent-edit detection, not cryptographic authenticity. An explicitly accepted coordinated runtime-label edit demonstrates the remaining trust boundary.

Using a handwritten dependency solver was rejected because it would only demonstrate our own rules. Treating locks as content checks, force as compatibility repair, checksum bootstrap as trusted provenance, or an absent constraint as a transitive-version comparison was rejected. No target recommendation follows without an actual current-target baseline and required native checks.

## Sources and boundaries

Versioned official documentation and pinned implementation files were read. Two exploratory documentation URLs and one guessed source path returned 404; those were not used as sources. The large recursive repository-tree request yielded no usable content; ordinary code search located the implementation paths subsequently read at the verified release commit. The source tag and installed revision agree. Distribution checksum verification does not prove a source-reproducible build or a signature chain.

This is one Linux/JVM/tool version and local original Maven data. No remote caches, SNAPSHOTs, project-built dependencies, plugins, variants, API compilation, mod metadata solver or game target is accepted. The [receipt template](../templates/dependency-resolution-receipt.md) keeps graph, lock, file, trust and native stages separate.

## Verification results

All 58 focused offline tests pass. An independent actual Gradle replay reproduces all 15 declared outcomes, four expected failures, and the same semantic graph, repository, artifact, lock and verification fields. Runtime logs and recording timestamps differ between runs. The independent replay confirms input hashes remained unchanged. The candidate full Python suite ran 384 tests: 383 passed, with only the inherited cross-root research-link error. Research Explorer validation passes unchanged. The first Explorer command used a nonexistent checker filename and failed; the actual repository command, `build_research_explorer.py --check`, was then used successfully, with both logs retained locally.

All 1,551 materialized baseline blobs are verified against main. The combined source register validates 2,219 entries, including all 13 new cited primary sources; 17 local links in changed Markdown resolve. These contribution checks do not waive the inherited full research error.

## Integration

The additive source fragment preserves main's existing register. Concurrent index/navigation additions must be unioned. The full baseline research gate has the inherited cross-root link error from `apps/atlas-lab/README.md` to the root-level runtime document; that target exists outside the engineering root. This contribution neither changes nor weakens the checker. Focused results, full-suite counts and exact remote/CI state are reported separately. No merge or deployment is requested.

## Primary sources

Checked 2026-11-11 UTC. Version/publication and checked date remain distinct in the [source fragment](../data/sources.d/mod-dependency-resolution-20261111.json).

[DR11001](https://docs.gradle.org/9.2.1/userguide/dependency_locking.html), [DR11002](https://docs.gradle.org/9.2.1/userguide/dependency_verification.html), [DR11003](https://docs.gradle.org/9.2.1/userguide/dependency_constraints.html), [DR11004](https://docs.gradle.org/9.2.1/userguide/resolution_rules.html), [DR11005](https://docs.gradle.org/9.2.1/userguide/dependency_versions.html), [DR11006](https://docs.gradle.org/9.2.1/userguide/viewing_debugging_dependencies.html), [DR11007](https://docs.gradle.org/9.2.1/javadoc/org/gradle/api/artifacts/ResolvedConfiguration.html), [DR11008](https://github.com/gradle/gradle/blob/30ecdc708db275e8f8769ea0620f6dd919a58f76/platforms/software/dependency-management/src/main/java/org/gradle/api/internal/artifacts/ivyservice/DefaultResolvedConfiguration.java), [DR11009](https://github.com/gradle/gradle/blob/30ecdc708db275e8f8769ea0620f6dd919a58f76/platforms/software/dependency-management/src/main/java/org/gradle/api/internal/artifacts/ivyservice/resolveengine/artifact/ResolvedArtifactSetResolver.java), [DR11010](https://github.com/gradle/gradle/blob/30ecdc708db275e8f8769ea0620f6dd919a58f76/platforms/software/dependency-management/src/main/java/org/gradle/api/internal/artifacts/ivyservice/ivyresolve/verification/ChecksumAndSignatureVerificationOverride.java), [DR11011](https://downloads.gradle.org/distributions/gradle-9.2.1-bin.zip.sha256), [DR11012](https://github.com/gradle/gradle/tree/v9.2.1), [DR11013](https://docs.gradle.org/9.2.1/userguide/compatibility.html).
