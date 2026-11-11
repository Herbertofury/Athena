# Resource packaging laboratory

Measured Gradle archive behavior on **original synthetic resources**, not a game mod, texture, asset importer, remapper, loader or performance benchmark. Gradle 9.2.1 is a pinned historical control, not a current-version recommendation. Its [source revision][RP11006], [release notes][RP11009], [published checksums][RP11004] and [exact checksum][RP11005] are recorded separately. The downloaded 135,535,598-byte binary ZIP matched SHA-256 `72f44c9f8ebcb1af43838f45ee5c4aa9c5444898b3468ab3f4af7b6076c5bc3f`. No source-to-binary reproducible build or signature verification was performed.

## Workload and results

`fixtures.json` declares three original payloads as hexadecimal: small JSON, a text message and all 256 byte values. The binary is deliberately not represented as a valid game asset. Variant A creates them in forward order with 2020 timestamps; variant B reverses creation order and uses 2024 timestamps, in another clean root. The shared build has no external plugins, repositories, compilation or game dependency.

`build.gradle` creates five successful JAR tasks per variant:

- `defaultJar`: Gradle archive defaults, with explicit duplicate failure policy. Both complete 1,302-byte outputs are identical.
- `timestampJar`: opt into source timestamps. Payloads remain complete; archive bytes differ. Generated manifest/directory timestamps also remain, so fresh executions need not reproduce these two hashes.
- `missingJar`: deliberately exclude the binary. Both 903-byte outputs are identical but incomplete.
- `excludeJar`: collide primary and alternate text, reversing copy-source order. First wins; resulting payloads and bytes differ.
- `includeJar`: retain both occurrences, in opposite orders. Both are 1,465 bytes but have different hashes.

Two more tasks in variant A use `FAIL` with different and identical payloads at the same path. Both fail with Gradle's actual “has already been copied there” diagnostic. Their partial artifacts are not included among the ten successful archives. All ten resource/occurrence expectations and five pair comparisons match the predeclared rules. The [receipt](observed-2026-11-11.json) retains raw logs, complete small archive bytes, occurrence-aware inventory, all six input hashes, environment identity and derived findings.

## Run offline checks

From `engineering`:

```sh
python -m unittest discover -s tests -p 'test_resource_packaging_lab.py' -v
python experiments/resource-packaging-lab/run.py --verify-receipt experiments/resource-packaging-lab/observed-2026-11-11.json
```

The 48 tests do not launch Java or download anything. They recompute retained artifacts and reject malformed, incomplete or type-coerced evidence, including duplicate JSON keys, invalid scopes and misleading summary fields. A self-consistent mismatch remains a measured mismatch and exits nonzero; editing a result field cannot convert it to success.

## Run a fresh Gradle observation

Obtain `gradle-9.2.1-bin.zip` from the exact official URL in [dependencies.json](dependencies.json), verify it against the published checksum, then supply the local file. The runner downloads nothing and rechecks bytes/hash before unpacking into a fresh temporary directory. Bash, a compatible local JVM, and Python 3.10+ are required. The retained execution used Python 3.12.14 and OpenJDK 21.0.13 on Linux x86_64. Windows-native execution was not attempted.

```sh
python experiments/resource-packaging-lab/run.py --distribution /path/to/gradle-9.2.1-bin.zip --output /path/to/new-resource-receipt.json
```

The output path must not already exist. Gradle uses an isolated home, offline mode, no build/configuration cache and forced tasks. A compatible runtime and successful build execution are still required; offline does not mean a JVM emulator. `--no-daemon` may create a single-use JVM to honor settings. Each subprocess has a 180-second timeout and a post-capture output-size check. Runtime/compiler/OS differences can affect archive metadata or compression; do not require a new environment to reproduce every archived byte before understanding the difference.

## Boundaries and retained failures

`setup-attempts.json` records an early diagnostic-parser error. The first validator expected the word “duplicate” and rejected the actual failure message; it wrote no accepted receipt and did not retain raw streams. An instrumented repeat retained all four build logs and archive hashes before the matcher was corrected. The current fresh run is separate evidence, not a relabeling of a failure.

Archive inspections use `ZipInfo` objects rather than names to preserve duplicates. Entry and size limits apply to this tiny fixture, with no extraction of the generated JARs. Source path checks and strict receipt comparisons are not a general security claim. Base64 artifacts and hashes establish internal consistency, not provenance authentication. No consumer preference among duplicate names, cross-platform reproducibility, source permission perturbation, game compatibility or target improvement was tested.

Read the [acceptance guide](../../docs/mod-resource-packaging.md) and [dated research](../../research/2026-11-11-mod-resource-packaging.md) before transferring any idea.

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
