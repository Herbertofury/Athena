# Mod dependency semantics and diagnosis

**Decision:** can a dependency diagnostic explain a loader's decision without changing its meaning? Pin the game, loader, loader version, metadata schema and installed artifacts before answering. This guide is primary-documented synthesis. The linked laboratory measures only named version APIs on synthetic inputs.

## Do not flatten these contracts

| Layer | Preserve | False shortcut |
|---|---|---|
| Artifact | File digest, source and packaging identity | The filename proves the installed mod version |
| Metadata | Original bytes, schema, mod ID and resolved version | Every archive represents exactly one mod |
| Dependency edge | Owner, target ID, original expression, dependency kind | Every edge means required |
| Applicability | Exact physical side and loader-specific rules | A client-only requirement applies everywhere |
| Ordering | Before/after direction, independently from presence | Version compatibility makes ordering safe |
| Evaluation | API/wrapper identity, parsed form, result and error | A successful parse proves the intended bound |
| Runtime | Actual installed launch and lifecycle evidence | A metadata match proves binary/gameplay compatibility |

These are proposed diagnostic fields, not a universal interchange schema. Keep unknown or unsupported meaning visible instead of guessing.

## Documented lanes

- **Fabric schema 1:** dependency kinds distinguish hard requirements (`depends`), warnings (`recommends`), advisory metadata (`suggests`), warning conflicts (`conflicts`) and hard incompatibilities (`breaks`). Terms in one range string combine with AND; strings in an array combine with OR. Preserve the array structure. [MV11001](https://wiki.fabricmc.net/documentation:fabric_mod_json_spec)
- **Forge 1.20.1:** `mandatory`, `versionRange`, `ordering` and physical `side` are separate fields. One `mods.toml` can describe several mods. `${file.jarVersion}` uses manifest `Implementation-Version`; the development placeholder is not installed-release evidence. The documented empty range matches any version. [MV11002](https://docs.minecraftforge.net/en/1.20.1/gettingstarted/modfiles/)
- **NeoForge 1.21.11:** an optional dependency may be absent, but compatibility is still checked when present. Required, optional, incompatible and discouraged edges must remain distinct. Its documented wildcard is `*`. Ordering cycles are an independent failure mode. The documentation warns that Minecraft snapshots/prereleases/release candidates need not sort properly as Maven versions. [MV11003](https://docs.neoforged.net/docs/1.21.11/gettingstarted/modfiles/)

These lanes are intentionally not a direct field-for-field conversion table. Check the exact target's wrapper and metadata parser before implementing diagnostics. In particular, the raw Maven empty-range result in the laboratory differs from Forge's documented empty-range contract. That is a boundary to investigate, not evidence that Forge is broken.

## Measured pitfalls worth testing

The [60-case laboratory](../experiments/mod-version-semantics-lab/README.md) calls Fabric Loader 0.20.1 and Maven Artifact 3.9.9 APIs directly. Every case retains its operands, expected and actual result, and raw output. It exposes these practical traps:

1. Fabric build metadata can compare equal where Maven distinguishes it. Case, `final` and `sp` also differ. Do not normalize or strip suffixes before evaluation.
2. Maven's raw range parser treats bare `1.2.3` and even Fabric-looking `^1.2.3` as recommendations, not hard bounds. `containsVersion(9.0)` is true for both tested strings. Record recommendation and hard restrictions separately.
3. A Maven interval supplied to the tested Fabric predicate API becomes an opaque version expression and does not match the numeric candidate. Not every wrong-dialect input is rejected with a parse error.
4. Both tested half-open upper-bound forms include `2.0-rc.1` while excluding `2.0`. A bound is not an implicit stable-only release filter.

These are API results, not claims about Forge or NeoForge resolution. Maven 3.9.9 is a historical control, not a claim about their bundled library. The Maven reference also distinguishes its ordering and hard/soft requirements from SemVer 2. [MV11004](https://maven.apache.org/pom.html#version-order-specification)

## Nondestructive diagnostic workflow

1. Save a sanitized inventory of the installed artifact digests, loader/runtime identity and metadata. Record originals and resolved substitutions separately. Do not rewrite metadata or download replacement mods during diagnosis.
2. Classify each edge using the exact target's rules: not applicable on this side, missing, matching, nonmatching, malformed or unsupported. Retain warnings and advisory edges even when they do not block startup.
3. Explain a failing edge with its owner, target, declared kind/range, observed version and evaluator. Keep all failures, not only the first. Report the applicable ordering graph separately.
4. Check the interpretation with the pinned upstream API and, where relevant, wrapper. Use the laboratory as a regression template, not a substitute for the wrapper or full solver.
5. If a proposed repair is authorized, retain the old inventory and compare an isolated candidate in the actual target. Test required/optional presence, invalid and out-of-range versions, side exclusions, conflicting requirements and ordering cycles. Log native startup, resources, multiplayer and save/reload independently.
6. Keep overrides visible in the evidence. Fabric documents them as temporary modpack-developer tools; they change requirements, not implementation compatibility. No override is applied by this guide or lab. [MV11013](https://docs.fabricmc.net/players/troubleshooting/dependency-overrides)

Use the [diagnostic receipt](../templates/mod-dependency-diagnostic.md). Its initial state is `not_run`, not accepted.

## Alternatives and next acceptance gate

- **Generic SemVer package:** simple and useful for a truly SemVer-owned format; rejected as a drop-in evaluator for these heterogeneous loader contracts.
- **Handwritten cross-loader resolver:** may offer a common UI, but duplicates opaque-version, alias, optionality and wrapper behavior. Not implemented here.
- **Pinned upstream adapters plus lossless metadata:** reduces duplicated version rules, but adds dependency/version maintenance and still needs full-loader tests. This is a research design, not an accepted target-project recommendation.

Before recommending adoption, compare against the target project's current diagnostics with identical artifacts and required behavior. Measure false accepts/rejects, explanation completeness and whole-workflow cost. This contribution does not run that comparison, change a modpack, or claim native acceptance.
