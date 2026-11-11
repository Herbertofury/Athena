# JVM class-loading boundary laboratory

**Original synthetic Java fixtures, not a mod-loader or game test.** Nine original classes are compiled once, then copied into a complete profile (9 classes) and a profile without `client.ClientApi` (8 classes). `URLClassLoader` uses the platform loader as parent so the complete fixture cannot leak through the application's classpath. Each scenario starts with fresh loader identity and fixture markers; the retry scenario deliberately keeps a loader before explicitly replacing it.

## Result

All **37 observations** match their predeclared outcomes, including **8 expected failure observations**, across 12 scenarios. This is not 37 successful application paths. Deliberately broken cases show:

- Direct lookup of an absent class versus linkage to that absent dependency.
- Discovery without initialization versus reflective descriptor resolution.
- A guarded common path that remains usable after a client method-body failure.
- A static-initializer failure that leaves the class erroneous in that loader.
- A changed failure flag that does not repair that definition, followed by independent initialization in a fresh loader.
- A primitive constant read that does not initialize its declaring class versus a boxed field read that does.

The [receipt](observed-2026-11-11.json) contains full driver JSON stdout, all nine compiled class hashes/sizes/major versions, exact classpath inventories, per-operation values, exception-class cause chains, fixture marker histories and all 13 input hashes. Markers are deliberately instrumented fixture effects, not a complete JVM initialization trace. Messages and stack traces are not retained because the experiment compares typed exception chains and operations; real target diagnosis should retain appropriate sanitized diagnostics.

Retained environment: Debian OpenJDK 21.0.13, runtime `21.0.13+9-1-deb13u2-Debian`, `com.sun.tools.javac.api.JavacTool`, Linux x86_64, Python 3.12.14. Compiler flags are `-source 21 -target 21 -proc:none -g:none -encoding UTF-8`; generated classes have major version 65. Source/target flags do **not** enforce a cross-release API surface as `--release` would. [runtime-reference.json](runtime-reference.json) pins upstream source for interpretation, not a source-to-binary provenance claim for the installed Debian runtime.

## Offline evidence verification

From `engineering`:

```sh
python -m unittest discover -s tests -p 'test_classloading_boundary_lab.py' -v
python experiments/classloading-boundary-lab/run.py --verify-receipt experiments/classloading-boundary-lab/observed-2026-11-11.json
```

The 48 tests do not launch Java. They validate complete row identity/order, source/profile contracts, expected outcomes and strict JSON types, plus scope, malformed-output and evidence-mutation regressions. A self-consistent unexpected result remains a mismatch with nonzero status, rather than becoming acceptance. Hashes and deterministic recomputation are consistency checks, not signatures or authenticity proof.

## Fresh execution

A local compiler-capable JDK 21 and Python 3.10+ are required. There are no downloaded dependencies. Java source-file launch compiles the probe, whose JavaCompiler API then compiles and runs only the original fixtures.

```sh
python experiments/classloading-boundary-lab/run.py --output /path/to/new-classloading-receipt.json
```

The output path must not exist. All generated class files and fixture properties live in a fresh temporary directory/child JVM; no game or existing project is modified. The child clears its two fixture properties on exit. A 90-second process timeout and post-capture output limit apply; these are not a streaming memory quota or hostile-code sandbox. The fixture cannot be repurposed as a safe runner for arbitrary downloaded Java code.

Exit 0 means all declared fixture expectations matched. Exit 1 means a complete observation included mismatches, which remain in its new receipt. Exit 2 means invalid evidence or an incomplete/failed runner stage. Fresh observations are separate evidence; preserved prior receipts are never overwritten by the runner. The retained first and final development executions both matched all expectations; no unexpected fixture failure was relabeled.

## Limits

This uses one OpenJDK 21 implementation with simple original classfiles, no module-layer, custom game transformer, Mixin, Fabric/Forge/NeoForge runtime, environment annotation stripping, concurrent initialization or native multiplayer. It does not establish lazy-resolution timing for every possible class, VM or loader. A fresh URLClassLoader is not game hot reload, and close is not class unloading. The exact source/result matrix is in [cases.json](cases.json).

See the [acceptance guide](../../docs/mod-classloading-boundaries.md), [research record](../../research/2026-11-11-mod-classloading.md) and [source fragment](../../data/sources.d/mod-classloading-20261111.json) before transferring any idea.
