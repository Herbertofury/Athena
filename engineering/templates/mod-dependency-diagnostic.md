# Mod dependency diagnostic receipt

Status: `not_run`. Template only; no values below establish compatibility.

## Scope and authority

- Target project and exact baseline revision:
- Game, loader, loader version, metadata schema, Java and physical side:
- Authorized read-only inventory or separately authorized repair:
- Original artifact sources, names, sizes and digests:
- Sanitized metadata evidence; original and resolved values:
- Active dependency overrides and where they apply:

## Edge observations

For every relevant edge, retain:

- Owning artifact digest, mod ID and resolved version:
- Target ID, dependency kind and unmodified expression/array:
- Physical-side applicability and reason:
- Evaluator and wrapper version/digest:
- Parsed hard restrictions and recommendation, where supported:
- Observed target artifact/version or explicit absence:
- Outcome: `not_run`, `not_applicable`, `missing`, `matching`, `nonmatching`, `malformed` or `unsupported`:
- Blocking failure, warning or advisory classification under that loader:
- Original sanitized diagnostic and complete related failures:
- Before/after ordering edges and cycle evidence, separately:

## Tests and evidence

Every result starts `not_run`. Record the command/launch path, environment, expected/actual output and retained failure evidence for each:

- Required absent and present; compatible and incompatible bounds:
- Optional absent and present; compatible and incompatible bounds:
- Malformed, wrong-dialect, opaque and prerelease inputs:
- Physical-side filtering and ordering cycles:
- Wrapper behavior and complete loader resolution:
- Clean installed launch, resources, networking and save/reload:

## Any candidate repair

- Exact authorization and proposed artifact/metadata change:
- Preserved original inventory and isolated candidate:
- Baseline-versus-candidate comparison on the same target/workload:
- Correctness, security, feature and warning coverage:
- Runtime results and unresolved gates:
- Rollback evidence and remaining risks:

A parser match or edited requirement is not native acceptance. See [dependency semantics](../docs/mod-dependency-semantics.md) and the [API laboratory](../experiments/mod-version-semantics-lab/README.md).
