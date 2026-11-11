# Mod version semantics laboratory

**Measured upstream API behavior on synthetic inputs, not mod compatibility.** This small original driver uses official version APIs instead of implementing a competing parser. Sixty fixed cases cover ordering, metadata/case differences, aliases, wildcard/caret/tilde ranges, opaque strings, recommendation-versus-hard-range behavior and malformed intervals.

## What ran

- Fabric Loader **0.20.1**, tag commit `cb9523bc29ef775c50b6aef5e43bc56927cd8e67`.
- Maven Artifact **3.9.9**, tag commit `8e8579a9e76f7d015ee5ec7bfcdc97d260186937`, a deliberately fixed historical control, not a latest-version or Forge/NeoForge dependency claim.
- OpenJDK **21.0.13**, Python **3.12.14**, Linux x86_64. Full runtime identity is in the receipt.
- 20 comparison cases, 20 Fabric predicate cases, 20 Maven range cases. **60/60 matched the predeclared expectations**, including seven expected parse failures. The experiment ran on 2026-11-11 UTC.

[Inputs](cases.json) · [Dependency manifest](dependencies.json) · [Original Java driver](VersionProbe.java) · [Offline runner](run.py) · [Complete observed receipt](observed-2026-11-11.json)

## Selected results

Comparison rows show the relation of the left operand to the right. These observations are exact for the pinned APIs, not universal definitions.

| Left / right | Fabric `Version` | Maven `ComparableVersion` |
|---|---|---|
| `1.0.0+one` / `1.0.0+two` | equal | less |
| `1.0.0-ALPHA` / `1.0.0-alpha` | less | equal |
| `1.0.0-final` / `1.0.0` | less | equal |
| `1.0.0-sp` / `1.0.0` | less | greater |
| `1.2` / `1.2.0` | equal | equal |
| `1.02.0` / `1.2.0` | equal | equal |

The last row is accepted API behavior; neither call is being used as a strict SemVer validator.

| API | Expression / candidate | Observed result |
|---|---|---|
| Fabric predicate | `^1.2.3` / `2.0` | false |
| Raw Maven range | `^1.2.3` / `9.0` | true; recommendation, no hard restriction |
| Raw Maven range | `1.2.3` / `9.0` | true; recommendation, no hard restriction |
| Raw Maven range | `[1.2.3]` / `1.2.4` | false |
| Fabric predicate | `[1.0,2.0)` / `1.5` | false, not a parse error |
| Fabric predicate | `>=1.0 <2.0` / `2.0-rc.1` | true |
| Raw Maven range | `[1.0,2.0)` / `2.0-rc.1` | true |
| Fabric predicate | empty string / `1.2.3` | true |
| Raw Maven range | empty string / `1.2.3` | false |
| Fabric predicate | `>nightly` / `nightly` | `VersionParsingException` |
| Raw Maven range | `[2.0,1.0]` / `1.5` | `InvalidVersionSpecificationException` |

Maven's `getRestrictions().size()` and `hasRestrictions()` are both retained: a recommendation can contain an unrestricted entry while reporting no hard restriction. Do not treat a nonempty list or successful parse as the intended constraint. The Forge 1.20.1 documentation gives different empty-range behavior from the raw Maven API, so loader wrappers must be tested separately.

## Reproduce without changing a game installation

Requirements: Python 3.10+ and a JDK with source-file launch support. Only the environment above was exercised here; Java 21 is the reproduction baseline. There are no Python package dependencies. The Java probe needs a compiler-capable runtime, not merely a minimal JRE.

Obtain the two exact files from the official HTTPS URLs in [dependencies.json](dependencies.json), after reviewing their provenance and licenses, and place them together in a local dependency directory outside the repository. No third-party JARs are committed. The runner **does not download**, search a mod installation or launch a game. It verifies size and SHA-256 before constructing an explicit two-file classpath.

From `engineering/`:

```sh
python3 experiments/mod-version-semantics-lab/run.py --dependency-dir /path/to/verified-dependencies > /path/to/new-receipt.json
python3 -m unittest discover -s tests -p 'test_mod_version_semantics.py' -v
```

Use a new output file for each run. Exit codes: `0` complete observations match expectations, `1` complete observations contain mismatches, `2` harness/dependency/process failure. On exit 1, the JSON includes every observation and all mismatch IDs. On exit 2, stderr identifies the failure and no successful receipt is issued. Preserve that failed attempt too. Timing and memory are not benchmarked.

The 34 offline tests validate fixture structure, dependency integrity checks, result ordering/completeness, known-bad rows and retained receipt consistency, including its fixed scope label and legal result shapes. They **do not rerun Java** or establish that an upstream artifact is trustworthy. A local hash pins the observed bytes; it is not a signature or independent proof of supply-chain authenticity.

## Evidence contract and boundaries

The receipt records UTC time, environment, SHA-256 of fixtures/manifest/driver/runner, dependency identities, all observations, mismatches and complete raw stdout. The validator recomputes those input identities and reconstructs observations from raw output. This detects inconsistency, not fabrication by someone able to replace all files.

Inputs are bounded to 256 cases and 256 KiB JSON; TSV sent to Java is bounded to 64 KiB. Duplicate JSON keys, non-finite JSON, control characters, unsafe dependency names and unsupported operations are rejected. Missing, extra, reordered or malformed result rows fail closed. Only expected version parsing exceptions become `parse_error`; unrelated Java failures terminate the run. The process has a 30-second timeout.

This is not a sandbox for untrusted libraries. Only the pinned official libraries were executed. No whole mod solver, metadata JSON/TOML parser, Fabric array-OR combination, Forge/NeoForge wrapper, Gradle resolver, installed mod, resource, save, network session, throughput or native acceptance is tested. Versions and grammars are not portable merely because these cases pass.

See [dependency diagnosis](../../docs/mod-dependency-semantics.md) and the [dated research record](../../research/2026-11-11-mod-version-semantics.md) for source identities, alternatives and next gates.
