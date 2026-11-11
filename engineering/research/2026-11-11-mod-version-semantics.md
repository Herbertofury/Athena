# November 11, 2026: executable mod dependency semantics

## Decision and corpus gap

Athena main `44384b809c80e03adbd62f8be9617d01e6ad9922` provides mod, asset and archive guidance, loader candidates and research experiments. Its engineering corpus was checked before adding this work. The separate build/asset draft focuses on packaging and acceptance receipts. This contribution addresses a distinct gap: reproducible **dependency-version meaning**, including inputs that parse but do not impose the bound an author intended.

No held project, game installation, release branch, source-index history or prior experiment is replaced. No target-project TODO or recommendation is created. The two shared-file edits are one additive source-index entry and append-only mod-guide navigation. Concurrent drafts must preserve all fragment entries and navigation during integration.

## Primary-documented findings

Loader metadata preserves more than version strings: dependency kind, physical side and load order matter. Fabric, Forge 1.20.1 and NeoForge 1.21.11 are separate versioned lanes. In NeoForge's documented lane, optional does not mean ignore incompatibility when present. Maven recommendations differ from hard ranges, and Maven ordering is not SemVer 2. The [guide](../docs/mod-dependency-semantics.md) gives concise source-linked implications without inventing a common resolver.

## Measured contribution

The [laboratory](../experiments/mod-version-semantics-lab/README.md) runs original Java glue against official Fabric Loader 0.20.1 and Maven Artifact 3.9.9 libraries. Source and artifact identities are separately recorded. The manifest hashes were observed from the official registry downloads; no independent signature verification or byte-for-byte source rebuild is claimed.

The [60 synthetic cases](../experiments/mod-version-semantics-lab/cases.json) define expected values before the executable observation. All 60 match in the [retained receipt](../experiments/mod-version-semantics-lab/observed-2026-11-11.json), including seven expected parsing failures. No input is a private mod trace. Results demonstrate API behavior, not measured compatibility with a game.

The useful differences are semantic rather than performance rankings: suffix normalization can change equality, wrong-dialect input need not fail parsing, recommendations are not hard bounds, and upper bounds need not exclude prereleases. The empty-range discrepancy between raw Maven and Forge documentation is explicitly retained as a wrapper boundary, not papered over.

## Reproducibility and preserved failures

The initial fixture assembly reused comparison/match IDs, and the harness rejected the duplicate before running Java. IDs were corrected before the measured run; no API mismatch was discarded. No third-party library implementation is copied into the repository, and no JAR binary is published. The retained output includes every result and complete stdout. Thirty-four standard-library tests exercise the offline harness and evidence invariants; Java replay is a separate explicit command. Independent review reproduced the results and prompted explicit scope-label validation plus rejection of impossible result shapes; both hardenings have mutation tests and a fresh retained replay.

Main's full research checker already rejects the `apps/atlas-lab/README.md` link to the repository-root `docs/athena-local-runtime.md` because the checker confines links to `engineering/`. This contribution does not weaken that rule or repair unrelated code. Focused passing checks must not be reported as a full repository pass. Full baseline/candidate test counts and remote checks are reported in the draft PR.

## Alternatives and remaining work

Generic SemVer and a handwritten universal resolver were considered and rejected as faithful replacements without target-specific evidence. Upstream adapters avoid duplicating some parsing rules but still require wrapper and full-loader acceptance. The 60 cases are a deliberately bounded regression set, not exhaustive fuzzing or a proof of semantic equivalence.

Next useful work is an authorized, version-pinned loader-wrapper fixture set: required/optional/negative dependencies, side applicability, metadata substitution, ordering cycles, duplicate IDs and full discovery/resolution. An actual target comparison remains necessary before recommending adoption. Native launch, resource loading, gameplay, multiplayer, save compatibility and performance are all outside this result.

## Source register

All primary sources were opened beyond search snippets and checked 2026-11-11 UTC. Version/date applicability is retained in [the indexed fragment](../data/sources.d/mod-version-semantics-20261111.json). Dynamic documentation is not an immutable runtime specification.

[MV11001](https://wiki.fabricmc.net/documentation:fabric_mod_json_spec), [MV11002](https://docs.minecraftforge.net/en/1.20.1/gettingstarted/modfiles/), [MV11003](https://docs.neoforged.net/docs/1.21.11/gettingstarted/modfiles/), [MV11004](https://maven.apache.org/pom.html#version-order-specification), [MV11005](https://github.com/FabricMC/fabric-loader/releases/tag/0.20.1), [MV11006](https://github.com/FabricMC/fabric-loader/blob/cb9523bc29ef775c50b6aef5e43bc56927cd8e67/src/main/java/net/fabricmc/loader/api/Version.java), [MV11007](https://github.com/FabricMC/fabric-loader/blob/cb9523bc29ef775c50b6aef5e43bc56927cd8e67/src/main/java/net/fabricmc/loader/api/metadata/version/VersionPredicate.java), [MV11008](https://github.com/FabricMC/fabric-loader/blob/cb9523bc29ef775c50b6aef5e43bc56927cd8e67/src/main/java/net/fabricmc/loader/impl/util/version/VersionPredicateParser.java), [MV11009](https://github.com/apache/maven/blob/8e8579a9e76f7d015ee5ec7bfcdc97d260186937/maven-artifact/src/main/java/org/apache/maven/artifact/versioning/VersionRange.java), [MV11010](https://github.com/apache/maven/blob/8e8579a9e76f7d015ee5ec7bfcdc97d260186937/maven-artifact/src/main/java/org/apache/maven/artifact/versioning/DefaultArtifactVersion.java), [MV11011](https://maven.fabricmc.net/net/fabricmc/fabric-loader/0.20.1/fabric-loader-0.20.1.jar), [MV11012](https://repo.maven.apache.org/maven2/org/apache/maven/maven-artifact/3.9.9/maven-artifact-3.9.9.jar), [MV11013](https://docs.fabricmc.net/players/troubleshooting/dependency-overrides).
