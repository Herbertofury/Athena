# Dependency resolution laboratory

A real offline Gradle 9.2.1 experiment over original tiny local-Maven modules. It resolves resource-only JARs; it does not compile or run their contents, use external plugins, contact remote repositories, or test a mod/game. Read the [guide](../../docs/mod-dependency-resolution.md) and [dated research](../../research/2026-11-11-mod-dependency-resolution.md) for source-backed boundaries.

## Fifteen controlled cases

`fixtures.json` records the exact repository versions, mutations, build mode, lock/verification inputs and declared outcomes. `run.py` generates all POM, metadata and tiny JAR bytes, while the real Gradle build makes the selection and verification decisions.

1. Default graph conflict selects 2.0 rather than the directly requested 1.0.
2. Root strict 1.0 overrides an ordinary transitive 2.0 request.
3. Incompatible root strict 1.0 and 2.0 requirements fail.
4. Force selects 1.0, with a distinct reason.
5. An absent-module constraint adds no dependency.
6. Dynamic 1.+ selects 1.1 and writes a lock.
7. A new 1.2 changes unlocked selection.
8. The existing lock keeps 1.1 despite 1.2.
9. A missing locked 1.1 fails.
10. Changed 1.1 JAR bytes still resolve under the same lock without verification.
11. Known original inputs generate JAR and POM SHA-256 expectations.
12. Verified-file resolution accepts those original inputs.
13. The explicit legacy artifact-only API control returns changed JAR bytes.
14. File-collection resolution rejects the changed JAR under verification.
15. File-collection resolution rejects the changed POM under verification.

All 15 declared outcomes match, including four expected failed builds. That does not make all configurations safe: the locked-but-changed and legacy-only controls intentionally expose missing acceptance gates. The strict and legacy results contradicted initial hypotheses; their complete exploratory run records and the first build script remain in `initial-observations.json` and `initial-build.gradle`.

## Offline verification

From `engineering`:

```sh
python -m unittest discover -s tests -p 'test_dependency_resolution_lab.py' -v
python experiments/dependency-resolution-lab/run.py --verify-receipt experiments/dependency-resolution-lab/observed-2026-11-11.json
```

All 58 offline tests pass. The tests need only Python 3.10+ and retained evidence, not Java or a download. They check input identity, complete generated repository and artifact bytes, required graph topology, typed values, lock/verification structure and raw/derived consistency. Receipt verification is not execution authentication: changing an unverified runtime label can remain internally consistent, and a regression explicitly records that limit.

## Actual replay

Obtain the exact official Gradle ZIP identified by [dependencies.json](dependencies.json), check it against the [official checksum][DR11011], and supply the local file. The runner downloads nothing and verifies all 135,535,598 bytes against SHA-256 `72f44c9f8ebcb1af43838f45ee5c4aa9c5444898b3468ab3f4af7b6076c5bc3f` before extraction. Its [source tag][DR11012] and installed version output identify revision `30ecdc708db275e8f8769ea0620f6dd919a58f76`. This historical control is not a current-release or project migration recommendation.

```sh
python experiments/dependency-resolution-lab/run.py --distribution /path/to/gradle-9.2.1-bin.zip --output /path/to/fresh-resolution.json
```

Bash, a compatible local JVM and Python are required. Output and its `.partial.json` companion must not already exist. Each completed run prefix is retained before analysis, so a later failure does not erase preceding results. The partial file is not an accepted receipt. Input hashes are captured before execution and must remain unchanged before a final receipt is written. Failed Gradle tasks keep exit codes and console diagnostics; secondary HTML reports and temporary caches are not retained. Paths under the owned temporary root are replaced by `<run>`/`<temp>`; remaining logs and observations are not silently rewritten.

The measured environment is Linux x86_64, Python 3.12.14, OpenJDK 21.0.13 and Gradle 9.2.1. Each case has a new build/repository/user-home root, offline mode, forced task execution, one worker and disabled build/configuration caches. `--no-daemon` can still create a single-use JVM, which the logs show. Each subprocess has a 180-second timeout and a 128 KiB post-capture output check, not a streaming memory quota. Generic Gradle suggestions to use scans or external support were not followed.

## Limits that matter

The complete tiny repository bytes are regenerated independently of Gradle and recorded. No signatures, source-to-binary rebuild, remote repository/cache behavior, changing/SNAPSHOT modules, project dependencies, compile/runtime API use, version catalogs, plugin resolution, variants, transforms, capabilities, shading or game-loader semantics were tested. An absent-module constraint tests only that it does not introduce the module.

The 9.2.1 legacy enumeration result is limited to the exact local fixture and API path. It is not advice to bypass verification and not a claim about other releases or every API. The graph is deliberately captured before the verified-file stage, demonstrating that a resolved graph can precede a file-integrity failure. Do not turn that graph into an acceptance receipt by dropping the failed stage.
[DR11011]: https://downloads.gradle.org/distributions/gradle-9.2.1-bin.zip.sha256
[DR11012]: https://github.com/gradle/gradle/tree/v9.2.1
