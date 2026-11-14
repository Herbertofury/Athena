# Resource packaging acceptance for mods

## Decision and scope

A repeatable JAR can be consistently missing an asset. A successful task can silently discard one of two resources at the same archive path. Treat artifact reproducibility, resource completeness, duplicate policy and native interpretation as separate gates. The [resource-only laboratory](../experiments/resource-packaging-lab/README.md) provides measured counterexamples with a real, pinned Gradle distribution and original inputs. It does not build, load or recommend changes to any target project.

## What was measured

Gradle 9.2.1 on Linux/JDK 21 packaged three synthetic resources in two clean project roots. Source creation order was reversed and file modification times changed from 2020-01-01 to 2024-01-01 UTC. Both builds used an isolated Gradle home, offline mode, forced task execution and disabled build/configuration caches. The ten successful archives and two expected failures are retained in the [receipt](../experiments/resource-packaging-lab/observed-2026-11-11.json).

- Default archive pairs were byte-identical, including the complete 256-byte binary resource. The default is not simulated by Python. Actual Gradle tasks produced the bytes.
- Opting into filesystem timestamps changed the archive bytes. The resource payloads were still complete. Timestamp-preserving outputs also retain generated manifest/directory timestamps, so their hashes are not expected to stay stable across fresh executions.
- Both builds that intentionally omitted the binary resource were also byte-identical. Reproducibility did not establish completeness.
- `EXCLUDE` kept the first resource at a repeated path. Reversing the two copy sources changed the retained payload. The primary-first variant happened to match the primary inventory but still discarded the alternate input.
- `INCLUDE` retained both same-name entries in opposite orders. A dictionary keyed by path would lose this evidence. No statement about which entry a game, classloader or other ZIP reader chooses is established.
- `FAIL` rejected both different-byte and identical-byte duplicate paths. Content equality did not make the second occurrence acceptable.

The pinned [file guide][RP11001] documents reproducible archives by default starting with Gradle 9.0: deterministic order, fixed timestamps, directory permissions 0755 and file permissions 0644. The observed JAR entries use 1980-02-01 00:00:00 and those permission bits. The [Jar API][RP11002] and [duplicate strategy API][RP11003] describe distinct settings. This experiment changes order and timestamps, not source permission bits or operating systems. It does not prove cross-JDK, cross-Gradle or cross-OS byte equivalence.

## Practical acceptance sequence

1. **Identify the actual build.** Record the project's current revision, loader/plugin chain, Gradle distribution checksum, Java runtime and compiler target independently. The [Gradle execution matrix][RP11007] cannot establish loader support. A tested historical control is not a migration recommendation.
2. **Specify expected contents before packaging.** Record every required final path, payload identity, transformations, generated metadata and permitted merge rule. Include asset references, namespaces and case rules appropriate to the actual target. Inventory exact names and occurrences, not just unique filenames or file count.
3. **Inspect the terminal deliverable.** Check the JAR after resource processing, shading, remapping and any signing step required by that project. An intermediate task's contents do not establish the released artifact. Check binary bytes rather than a text round-trip.
4. **Make duplicates a deliberate decision.** A failure policy exposes collisions; an exclusion policy can hide missing overrides; inclusion can leave interpretation to a consumer. Legitimate service-descriptor or metadata merging needs an explicit, format-aware rule and tests, rather than an unreviewed global exclusion. No one policy is a universal replacement for target requirements.
5. **Perturb clean builds.** Repeat from isolated roots with changed source order and timestamps, capture complete logs, and compare artifact bytes plus occurrence-aware payload inventories. If bytes differ, localize the metadata or payload change rather than declaring compatibility lost. If bytes match, still check the intended contents.
6. **Exercise the real consumer.** Resource discovery, decode/import, reload, dedicated-server boundaries, renderer/animation semantics and interactions with other mods need the authorized native target. This lab does not satisfy those gates.

Gradle's [content expansion API][RP11011] uses Groovy's template engine. Restrict intended metadata processing to the declared textual inputs and explicit encoding; do not assume arbitrary binary assets are text templates. This is documented pipeline guidance, not a measured filtering or corruption experiment in this lab.

## Evidence handling and limits

The Python reader retains every `ZipInfo` occurrence, which the [Python API][RP11008] explicitly supports. Entry counts, expanded sizes and paths are checked before bounded member reads. The reader is scoped to tiny original fixtures, not offered as a general hostile-archive security boundary. Build output size is checked after subprocess capture; the timeout and post-capture check are not a streaming memory quota.

The receipt includes full small archive bytes as base64, allowing offline inventory, CRC and payload-hash recomputation without the Gradle distribution. Input hashes and type-strict derived comparisons catch accidental or inconsistent edits. They are consistency checks, not signatures or proof against an actor who rewrites every field. A fresh execution is a separate observation.

Both expected failed tasks keep their diagnostics. Partially written failed-task archives are not promoted to successful artifacts. An early harness diagnostic mismatch is retained separately rather than erased. Complete build logs may contain Gradle's generic suggestions to use a scan or contact support; neither was followed. `--no-daemon` still used a single-use JVM as [documented][RP11010], and that output remains visible.

See the [research record](../research/2026-11-11-mod-resource-packaging.md), [receipt template](../templates/resource-packaging-receipt.md), and existing [mod guide](mods.md). No target baseline comparison, native acceptance, performance benefit, merge or deployment is claimed.

[RP11001]: https://docs.gradle.org/9.2.1/userguide/working_with_files.html
[RP11002]: https://docs.gradle.org/9.2.1/dsl/org.gradle.api.tasks.bundling.Jar.html
[RP11003]: https://docs.gradle.org/9.2.1/javadoc/org/gradle/api/file/DuplicatesStrategy.html
[RP11004]: https://gradle.org/release-checksums/
[RP11005]: https://downloads.gradle.org/distributions/gradle-9.2.1-bin.zip.sha256
[RP11006]: https://github.com/gradle/gradle/commit/30ecdc708db275e8f8769ea0620f6dd919a58f76
[RP11007]: https://docs.gradle.org/9.2.1/userguide/compatibility.html
[RP11008]: https://docs.python.org/3.12/library/zipfile.html
[RP11009]: https://docs.gradle.org/9.2.1/release-notes.html
[RP11010]: https://docs.gradle.org/9.2.1/userguide/gradle_daemon.html#sec:disabling_the_daemon
[RP11011]: https://docs.gradle.org/9.2.1/javadoc/org/gradle/api/file/CopySpec.html
