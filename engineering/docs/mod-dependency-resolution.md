# Build dependency evidence: graphs, locks and actual files

## Decision and scope

A successful dependency graph is not proof that its selected libraries work together. A lockfile can pin a module version while the bytes at those coordinates change. A report about resolved artifacts is not automatically evidence that a checksum-enforcement path was exercised. The [laboratory](../experiments/dependency-resolution-lab/README.md) makes these distinctions observable using a pinned real Gradle distribution and original resource-only Maven modules.

This is not a Fabric/Forge/NeoForge solver, game mod, plugin migration, binary compatibility test or performance comparison. No class is compiled or loaded from the fixture JARs. The Gradle 9.2.1 control is historical and is not a recommendation for any project to upgrade or downgrade. Runtime execution compatibility is a separate [versioned matrix][DR11013].

## Measured graph distinctions

The original `addon:1.0` POM requests `core:2.0`; the root also requests `core:1.0`.

- Default resolution selects core 2.0 and retains the root's requested 1.0 edge, with a `CONFLICT_RESOLUTION` reason. A requested version in a build file is not necessarily the selected version.
- A root strict 1.0 constraint selects core 1.0, even though the ordinary transitive edge requests 2.0. `BY_ANCESTOR` and constraint reasons are retained. The initial hypothesis that this necessarily fails was wrong.
- Two incompatible root strict requirements, 1.0 and 2.0, fail. The retained graph has unresolved edges rather than invented selected artifacts.
- Forcing 1.0 also selects core 1.0, with `FORCED` rather than ancestor reasoning. Successful force resolution does not demonstrate that addon code can use that older version.
- A constraint on an absent module does not introduce it. This fixture does not test how an ordinary constraint on an already-present module interacts with a higher transitive requirement.

[Rich versions][DR11005], [constraints][DR11003] and [force rules][DR11004] have distinct semantics. Do not flatten every graph request into a universal exact-version requirement or treat a downgrade as inherently safe. Preserve requested selectors, selected modules, constraint flags, reasons and unresolved edges. The [diagnostic guide][DR11006] explains the corresponding dependency and dependencyInsight views.

## Measured lock and byte distinctions

The dynamic selector `core:1.+` initially selects 1.1 and writes a lockfile. In independent clean repositories containing a new 1.2 release, the unlocked case selects 1.2 and the locked case stays at 1.1. Removing 1.1 causes the locked case to fail instead of silently switching to 1.2.

Replacing the original resource-only 1.1 JAR with different original bytes leaves the lockfile and selected module unchanged, and resolution succeeds without checksum enforcement. The artifact hash changes. [Locking][DR11001] is a version-selection contract, not a content digest or proof that a mutable repository cannot replace a release. The lab deliberately mutates an ordinary release; it does not mark it changing or use a SNAPSHOT.

Gradle then generates SHA-256 verification metadata from known original local inputs, including both the JAR and POM. Fresh verified-file resolution accepts those inputs and rejects either changed JAR bytes or changed POM bytes. The changed POM adds only a description, so graph selection can remain unchanged while its metadata identity fails. A resolved graph still exists in both verification-failure cases.

[Verification documentation][DR11002] warns that bootstrapping hashes can record already-compromised inputs. Here the small inputs are generated from original declared fixtures and their bytes are independently reproducible; this does not establish trust in arbitrary downloaded modules. Signature checks, repository authentication, remote caches, changing modules, build-produced project artifacts, plugin resolution, transforms and variant-aware platform selection were not tested.

## An API-path failure worth retaining

The first probe enumerated `resolvedConfiguration.resolvedArtifacts` and read each `ResolvedArtifact.file`. On this Gradle 9.2.1/local-Maven fixture, changed JAR bytes were returned despite the verification metadata. That contradicted the original expectation. The final experiment retains that exact legacy-only control and a separate case that resolves `configuration.files` before enumerating artifacts. The latter fails with the changed JAR; no lenient/off flag or ignored-artifact rule is used.

The [legacy API documentation][DR11007] and pinned implementation distinguish [artifact enumeration][DR11008] from [file traversal][DR11009]. In this revision, the file resolver calls `artifactsAccessed`, whose [verification implementation][DR11010] processes queued checks and reports fatal failures. This supports the bounded observation, not a claim about every Gradle API, every release, remote repositories or every downstream build. It is not a proposal to use the legacy path to avoid validation.

For a real build or audit, a known-bad input must fail through the exact task and file-consuming API being relied on. Merely reading a graph, seeing a verification XML file or producing an artifact inventory does not establish that gate. Any target change still requires its own authorized comparison and native acceptance.

## Practical workflow receipt

1. Record the current project revision and complete game/loader/build/JDK tuple. Identify the actual resolvable configuration and terminal task, rather than substituting a convenient diagnostic task.
2. Preserve the graph: root and transitive requests, selected versions, strict/ordinary requirements, forces, substitution, capabilities and variants where actually present. Explain each override and unresolved edge.
3. Keep a reviewable lock policy and repository identity. Test a newly available version, a missing locked version and changed bytes at the same coordinates. Do not silently rewrite locks just to recover a failing build.
4. Establish trustworthy artifact and metadata expectations. Review newly generated checksums against independently trusted originals; generating them is not provenance verification.
5. Exercise the exact verified-file path using known-bad JAR and metadata controls. Keep nonzero exits and diagnostics; do not normalize an integrity failure into a clean graph result.
6. Test binary/API use, loader acceptance, remapping, packaging, client/server behavior and required saves in the actual authorized target. This lab establishes none of them.

Use the [receipt template](../templates/dependency-resolution-receipt.md). These steps are evidence gates, not universal resolution-policy recommendations.

## Evidence limits

The [retained receipt](../experiments/dependency-resolution-lab/observed-2026-11-11.json) contains all 15 run records, complete original repository bytes, resolved artifact bytes/hashes, graph observations, lock and verification text, raw stdout/stderr, exact command controls and runtime labels. Input identity, repository generation, graph topology, selected-artifact identity and derived outcomes are checked offline. A mismatch is not relabeled as success.

These are internal consistency checks, not signatures or authenticated execution. Coordinated edits to evidence, hashes and code can remain consistent. Runtime labels and free-text logs are not independently attested. The explicit regression accepting a changed Python label documents this boundary. A fresh actual Gradle replay is separate evidence.

All cases use a new local repository, build root and Gradle user home. No remote dependency requests, external plugins, game artifacts or project settings are involved. The pinned distribution matches its [published checksum][DR11011] and [source tag][DR11012], but was not rebuilt from source or signature-verified. Single-use daemons, post-capture log limits and one Linux/JVM environment are disclosed in the lab. No Windows, cross-version, cache or performance equivalence is claimed.

[DR11001]: https://docs.gradle.org/9.2.1/userguide/dependency_locking.html
[DR11002]: https://docs.gradle.org/9.2.1/userguide/dependency_verification.html
[DR11003]: https://docs.gradle.org/9.2.1/userguide/dependency_constraints.html
[DR11004]: https://docs.gradle.org/9.2.1/userguide/resolution_rules.html
[DR11005]: https://docs.gradle.org/9.2.1/userguide/dependency_versions.html
[DR11006]: https://docs.gradle.org/9.2.1/userguide/viewing_debugging_dependencies.html
[DR11007]: https://docs.gradle.org/9.2.1/javadoc/org/gradle/api/artifacts/ResolvedConfiguration.html
[DR11008]: https://github.com/gradle/gradle/blob/30ecdc708db275e8f8769ea0620f6dd919a58f76/platforms/software/dependency-management/src/main/java/org/gradle/api/internal/artifacts/ivyservice/DefaultResolvedConfiguration.java
[DR11009]: https://github.com/gradle/gradle/blob/30ecdc708db275e8f8769ea0620f6dd919a58f76/platforms/software/dependency-management/src/main/java/org/gradle/api/internal/artifacts/ivyservice/resolveengine/artifact/ResolvedArtifactSetResolver.java
[DR11010]: https://github.com/gradle/gradle/blob/30ecdc708db275e8f8769ea0620f6dd919a58f76/platforms/software/dependency-management/src/main/java/org/gradle/api/internal/artifacts/ivyservice/ivyresolve/verification/ChecksumAndSignatureVerificationOverride.java
[DR11011]: https://downloads.gradle.org/distributions/gradle-9.2.1-bin.zip.sha256
[DR11012]: https://github.com/gradle/gradle/tree/v9.2.1
[DR11013]: https://docs.gradle.org/9.2.1/userguide/compatibility.html
