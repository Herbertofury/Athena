# November 11, 2026: mod resource packaging foundation

## Gap and decision

Athena main `44384b809c80e03adbd62f8be9617d01e6ad9922` and the open foundation drafts were reviewed before this contribution. Existing archive experiments read and compare archives; build/asset acceptance guidance, version API semantics and bytecode-selector work address other boundaries. The missing practical contract was an executed build-tool demonstration of resource packaging, duplicate handling and reproducibility versus completeness. No held project, release file, catalog ranking or target build configuration is changed.

## Measured evidence

The [new laboratory](../experiments/resource-packaging-lab/README.md) executed a SHA-256-verified Gradle 9.2.1 binary distribution on original resource-only inputs. Its [receipt](../experiments/resource-packaging-lab/observed-2026-11-11.json) contains ten complete small JARs as base64, four raw build-run records, input hashes and occurrence-aware entries. Ten archive expectations and five cross-root comparisons passed, including two intentionally incomplete yet reproducible archives. Both planned duplicate failures occurred, including identical-byte duplication. Forty-eight offline tests recompute evidence and exercise malformed/mutated receipts.

All expected outcomes is not equivalent to all artifacts being suitable for release: the missing-resource and duplicate-retaining cases are deliberately unsuitable controls. Reversing explicit copy-source order changes `EXCLUDE` winners and `INCLUDE` occurrence order. Changing source timestamps only affects the opt-in timestamp-preserving pair among the source-order/timestamp controls. The [guide](../docs/mod-resource-packaging.md) keeps artifact identity, payload completeness, duplicate policy and actual consumer acceptance separate.

The observed default JAR timestamps are 1980-02-01 00:00:00; file/directory permissions are 0644/0755. This is one pinned toolchain on Linux. Source permissions, compression implementations on another runtime, final game builds, signing, remapping and native resource loading remain untested. No elapsed-time claim is made from build logs.

## Failures and alternatives

An early diagnostic matcher expected the word “duplicate,” whereas this Gradle version reports a file “has already been copied there.” The first rejection had only its validation error retained. A second instrumented rejection retained all build logs and archive hashes. The corrected matcher checks the real message, path, failed task and nonzero exit. [Setup attempts](../experiments/resource-packaging-lab/setup-attempts.json) remain separate from the fresh accepted receipt. No fixture outcome was changed to make a failed expectation pass. Self-review then tightened generated-manifest accounting: missing, changed and duplicate manifests are rejected by three regressions, and the exact allowed duplicate-path set is checked. These mutations previously escaped the per-archive resource check because it excluded the generated manifest. The retained measured archives were already correct; a fresh receipt follows the hardening.

A handwritten ZIP writer was rejected as the primary experiment because it would test Python's own packaging rather than the Gradle contract. Python is used only to inspect actual Gradle output and validate retained evidence. A full game build was not needed to demonstrate this packaging gap and would require a distinct authorized target baseline. Global `EXCLUDE`, universal `FAIL`, and implicit duplicate merging are not offered as unconditional target recommendations.

Versioned Gradle documentation was initially inaccessible through the web retrieval tool; the same public official pages were retrieved successfully through a direct read. This was a retrieval limitation, not a bypass of an access denial. The installed version output and upstream tag both identify source commit `30ecdc708db275e8f8769ea0620f6dd919a58f76`. The current release checksum page also lists 9.9.1; the experiment deliberately stays on historical 9.2.1 and makes no “latest is best” claim.

## Integration and remaining gates

The source fragment is additive and main's existing registry is preserved. Concurrent drafts also append navigation/index entries; integrate those as a union, not by replacing one draft's file with another. The existing full research gate has the inherited cross-root `apps/atlas-lab/README.md` link error. This contribution does not weaken or repair that unrelated gate. Focused checks, full-suite counts and exact remote/CI state are reported separately.

Next acceptance work belongs on an explicitly authorized target's terminal artifact, against its current build and complete asset requirements. No game compatibility, performance gain, upgrade, merge or deployment is established here.

## Sources

Primary sources opened and checked 2026-11-11 UTC. Documentation version, tested distribution and checked date are separate in the [source fragment](../data/sources.d/mod-resource-packaging-20261111.json).

[RP11001](https://docs.gradle.org/9.2.1/userguide/working_with_files.html), [RP11002](https://docs.gradle.org/9.2.1/dsl/org.gradle.api.tasks.bundling.Jar.html), [RP11003](https://docs.gradle.org/9.2.1/javadoc/org/gradle/api/file/DuplicatesStrategy.html), [RP11004](https://gradle.org/release-checksums/), [RP11005](https://downloads.gradle.org/distributions/gradle-9.2.1-bin.zip.sha256), [RP11006](https://github.com/gradle/gradle/commit/30ecdc708db275e8f8769ea0620f6dd919a58f76), [RP11007](https://docs.gradle.org/9.2.1/userguide/compatibility.html), [RP11008](https://docs.python.org/3.12/library/zipfile.html), [RP11009](https://docs.gradle.org/9.2.1/release-notes.html), [RP11010](https://docs.gradle.org/9.2.1/userguide/gradle_daemon.html#sec:disabling_the_daemon), [RP11011](https://docs.gradle.org/9.2.1/javadoc/org/gradle/api/file/CopySpec.html).
