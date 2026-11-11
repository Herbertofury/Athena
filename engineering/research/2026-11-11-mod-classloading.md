# November 11, 2026: JVM and mod environment boundaries

## Gap and decision

Athena main `44384b809c80e03adbd62f8be9617d01e6ad9922` and current drafts were reviewed before adding this work. Broad mod guidance names native client/server gates, while the build/assets, version semantics, bytecode-selector and packaging drafts cover different mechanisms. None provides executed evidence distinguishing discovery, reflective type resolution, class initialization and invocation under an absent dependency. This contribution supplies that experiment without duplicating archive or injection work.

## Measured evidence

The [laboratory](../experiments/classloading-boundary-lab/README.md) compiles nine original sources once and executes 12 isolated scenarios using complete and client-absent classpaths. All 37 predeclared observations match, including eight expected failures. A directly missing class, reflective descriptor failure, method-body linkage failure and erroneous static initialization produce distinct operation/cause-chain histories. The [receipt](../experiments/classloading-boundary-lab/observed-2026-11-11.json) retains full driver output, values, fixture initialization markers, all compiled class hashes and all 13 input hashes. Forty-eight offline tests cover the evidence contract and malformed or mutated inputs.

The common branch remains usable after its separate client branch fails. In contrast, failed initialization persists despite changing the fixture's failure flag. A fresh loader creates a distinct initialization experiment. Primitive constant access also differs from boxed field access. These are exact OpenJDK observations, not proof that arbitrary branch guards, classloader swaps or annotations solve a mod's environment boundary.

The first development execution and the final execution both matched the same predeclared outcomes. Input-type guards were tightened before the final receipt; no measured outcome was changed or failed observation erased. Source/target 21 and class major 65 are explicit, without a cross-release API check or game-runtime compatibility claim.

## Documented versus unrun

Source interpretation uses OpenJDK tag `jdk-21.0.13+9`, resolved through its annotated tag to commit `ba94eace682733f66e623c089bcafcf4a1b8e39c`. This is not a reproducible-build attestation for the installed Debian runtime. Fabric Loader source tag `0.20.1` resolves to `cb9523bc29ef775c50b6aef5e43bc56927cd8e67`; its environment and entrypoint APIs are documented separately from the Java-only experiment. The dynamic Fabric overview currently displays 26.2, which is neither the pinned source version nor a tested game target.

Pinned Fabric source explicitly distinguishes environment-specific entrypoints and warns that stripping a field does not remove its initializer bytecode. Client environment also includes integrated-server logic. None of this lab's classes uses Fabric APIs or annotations, and no loader transformation is executed. Forge/NeoForge API equivalence is not claimed.

## Alternatives and remaining gates

A handwritten classloader simulator was rejected because actual JVM resolution and erroneous-initialization behavior are the evidence needed. A full game integration was also not substituted with a synthetic success label: it needs an authorized target baseline, exact loader and real launch paths. Native networking authority, world persistence, reload, interaction and performance gates remain unrun. The [guide](../docs/mod-classloading-boundaries.md) and [receipt template](../templates/classloading-boundary-receipt.md) make those boundaries explicit.

The source index and mod navigation additions preserve main and must be unioned with concurrent draft additions during integration. No active release, held project, external target recommendation or workflow is changed. The full research gate still has the inherited cross-root link error; focused and aggregate checks are reported separately rather than weakening the checker. No merge or deployment is requested.

## Sources

Primary sources opened and checked 2026-11-11 UTC; source revisions and checked dates are separate in the [source fragment](../data/sources.d/mod-classloading-20261111.json).

[CL11001](https://github.com/openjdk/jdk21u/blob/ba94eace682733f66e623c089bcafcf4a1b8e39c/src/java.base/share/classes/java/lang/Class.java), [CL11002](https://github.com/openjdk/jdk21u/blob/ba94eace682733f66e623c089bcafcf4a1b8e39c/src/java.base/share/classes/java/lang/ClassLoader.java), [CL11003](https://github.com/openjdk/jdk21u/blob/ba94eace682733f66e623c089bcafcf4a1b8e39c/src/java.base/share/classes/java/net/URLClassLoader.java), [CL11004](https://github.com/openjdk/jdk21u/blob/ba94eace682733f66e623c089bcafcf4a1b8e39c/src/hotspot/share/oops/instanceKlass.cpp), [CL11005](https://github.com/openjdk/jdk21u/blob/ba94eace682733f66e623c089bcafcf4a1b8e39c/src/hotspot/share/runtime/reflection.cpp), [CL11006](https://github.com/openjdk/jdk21u/blob/ba94eace682733f66e623c089bcafcf4a1b8e39c/src/jdk.compiler/share/classes/com/sun/tools/javac/jvm/Gen.java), [CL11007](https://github.com/FabricMC/fabric-loader/blob/cb9523bc29ef775c50b6aef5e43bc56927cd8e67/src/main/java/net/fabricmc/api/ClientModInitializer.java), [CL11008](https://github.com/FabricMC/fabric-loader/blob/cb9523bc29ef775c50b6aef5e43bc56927cd8e67/src/main/java/net/fabricmc/api/Environment.java), [CL11009](https://github.com/FabricMC/fabric-loader/blob/cb9523bc29ef775c50b6aef5e43bc56927cd8e67/src/main/java/net/fabricmc/api/EnvType.java), [CL11010](https://github.com/FabricMC/fabric-loader/blob/cb9523bc29ef775c50b6aef5e43bc56927cd8e67/src/main/java/net/fabricmc/api/ModInitializer.java), [CL11011](https://github.com/FabricMC/fabric-loader/blob/cb9523bc29ef775c50b6aef5e43bc56927cd8e67/src/main/java/net/fabricmc/api/DedicatedServerModInitializer.java), [CL11012](https://docs.fabricmc.net/develop/loader/).
