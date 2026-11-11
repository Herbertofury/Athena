# Class loading and environment boundaries for mods

## The boundary to establish

A compiled class is not proof that all of its runtime paths work without client-only dependencies. Class discovery, signature reflection, static initialization and method invocation can expose different failures. The [JVM laboratory](../experiments/classloading-boundary-lab/README.md) makes these distinctions observable using nine original classes, two isolated classpaths and a real OpenJDK runtime. The profiles are called `complete` and `without_client`; neither is a Minecraft client, integrated server or dedicated server.

## Measured distinctions

All 37 predeclared observations match on Debian OpenJDK 21.0.13, including eight expected failure observations. The [receipt](../experiments/classloading-boundary-lab/observed-2026-11-11.json) records classfile hashes, exact profile membership, complete driver JSON output, result values, exception-class cause chains and fixture initialization markers. Markers cover the deliberately instrumented classes, not every class the JVM initializes. Exception messages and stack traces are not captured by this fixture.

- **Discovery is narrower than use.** Non-initializing `Class.forName` discovers classes whose later reflected signatures or method calls require the absent client class. The [Class API][CL11001] explicitly separates initialization control and linkage failures.
- **Reflection can require unused types.** Enumerating declared methods fails when an otherwise unused parameter/return type is absent. It does not execute a method body or run the fixture's initializer. OpenJDK's [reflection implementation][CL11005] resolves those type mirrors. The same fixture's explicit initialization subsequently succeeds.
- **A body failure is different from an initializer failure.** The guarded common branch runs, the client branch fails, and the common branch still runs afterward. This is an observation of the exact fixture on this runtime, not a guarantee that an arbitrary side check makes references safe across verifiers, transformers, signatures or initialization paths.
- **Static failure can leave an erroneous class.** A missing dependency reached during initialization fails once; later initialization attempts report the existing error state without re-running the marker. An ordinary exception thrown by another initializer first becomes `ExceptionInInitializerError`. Later calls report `NoClassDefFoundError`. The [OpenJDK state machine][CL11004] distinguishes these paths. Preserve the first failure when diagnosing a target.
- **Changing a condition is not a class reset.** Clearing the fixture's failure flag does not repair the already-erroneous class in that loader. A fresh fixture loader initializes a separate definition successfully. Closing a [URLClassLoader][CL11003] does not invalidate already loaded classes; this is not an instruction or proof for live game reload.
- **Constant access is not an initialization probe.** Reading the compiled primitive constant returns 7 without the class marker; reading the boxed value returns 9 and initializes it. The compiler's [constant-expression generation][CL11006] supports the distinction. Neither observation is a compatibility test.

The missing direct class lookup produces `ClassNotFoundException`; a linked dependency failure can instead produce `NoClassDefFoundError`. The latter can also indicate earlier failed initialization, not merely a missing JAR. A reflected invocation can add `InvocationTargetException` around the underlying error. Inspect the complete relevant chain, first failure and operation rather than choosing a remedy from the last exception name alone.

## Loader-specific facts, kept separate

Pinned Fabric Loader 0.20.1 source provides distinct [main][CL11010], [client][CL11007] and [server][CL11011] entrypoint interfaces and metadata keys. Its [environment enum][CL11009] says the client environment includes integrated-server logic. Physical process environment and logical gameplay authority therefore answer different questions. A client-only launch or local world does not replace a dedicated-server test. No networking authority test is performed by this lab.

The pinned [`Environment` contract][CL11008] warns that removal of an annotated element does not also remove its associated initializer bytecode. Treat annotation presence, source organization and actual runtime reachability as distinct evidence. The lab does not install Fabric, strip annotations, run entrypoints or simulate transformations. Other loader families are not asserted to share Fabric's entrypoint names or behavior. The current [loader overview][CL11012] also distinguishes the loader from game-specific API hooks; its current page version is separate from the pinned source and is not a tested game target.

## Acceptance sequence for an authorized target

1. Record the actual game, loader/fork, mappings/API, JDK and mod/dependency versions. Preserve the current working implementation before comparing a proposed change.
2. Enumerate client-only dependencies and every route to them: descriptors, fields, inheritance, static initializers, callback registration, reflection, method bodies and transformations. Checking only executed branch bodies misses other resolution paths.
3. Exercise discovery, registration/reflection, initialization and relevant invocation paths separately with the real target's available classes. Verify the intended absence of client-only definitions, including transitive dependencies and parent-loader leakage. This lab explicitly uses the platform parent rather than delegating to its application loader; [delegation behavior][CL11002] matters.
4. Keep common contracts free of unavailable types where the target requires it; place environment-specific entrypoints and implementation behind the exact loader's documented boundary, then test the actual packaged result. This is a conditional design criterion, not a patch recommendation for an unexamined project.
5. Preserve the first failure and subsequent attempts with their process/loader identity. A fresh process or loader is a different experiment, not evidence that the old initialized state recovered.
6. Run the normal dedicated-server and client launch paths, required multiplayer authority, reload, world save/reload and interactions. Static inspection or this JVM fixture does not establish any of those gates.

The [receipt template](../templates/classloading-boundary-receipt.md) and [research note](../research/2026-11-11-mod-classloading.md) keep these evidence levels separate. No target upgrade, performance benefit, game compatibility, merge or deployment is established.

[CL11001]: https://github.com/openjdk/jdk21u/blob/ba94eace682733f66e623c089bcafcf4a1b8e39c/src/java.base/share/classes/java/lang/Class.java
[CL11002]: https://github.com/openjdk/jdk21u/blob/ba94eace682733f66e623c089bcafcf4a1b8e39c/src/java.base/share/classes/java/lang/ClassLoader.java
[CL11003]: https://github.com/openjdk/jdk21u/blob/ba94eace682733f66e623c089bcafcf4a1b8e39c/src/java.base/share/classes/java/net/URLClassLoader.java
[CL11004]: https://github.com/openjdk/jdk21u/blob/ba94eace682733f66e623c089bcafcf4a1b8e39c/src/hotspot/share/oops/instanceKlass.cpp
[CL11005]: https://github.com/openjdk/jdk21u/blob/ba94eace682733f66e623c089bcafcf4a1b8e39c/src/hotspot/share/runtime/reflection.cpp
[CL11006]: https://github.com/openjdk/jdk21u/blob/ba94eace682733f66e623c089bcafcf4a1b8e39c/src/jdk.compiler/share/classes/com/sun/tools/javac/jvm/Gen.java
[CL11007]: https://github.com/FabricMC/fabric-loader/blob/cb9523bc29ef775c50b6aef5e43bc56927cd8e67/src/main/java/net/fabricmc/api/ClientModInitializer.java
[CL11008]: https://github.com/FabricMC/fabric-loader/blob/cb9523bc29ef775c50b6aef5e43bc56927cd8e67/src/main/java/net/fabricmc/api/Environment.java
[CL11009]: https://github.com/FabricMC/fabric-loader/blob/cb9523bc29ef775c50b6aef5e43bc56927cd8e67/src/main/java/net/fabricmc/api/EnvType.java
[CL11010]: https://github.com/FabricMC/fabric-loader/blob/cb9523bc29ef775c50b6aef5e43bc56927cd8e67/src/main/java/net/fabricmc/api/ModInitializer.java
[CL11011]: https://github.com/FabricMC/fabric-loader/blob/cb9523bc29ef775c50b6aef5e43bc56927cd8e67/src/main/java/net/fabricmc/api/DedicatedServerModInitializer.java
[CL11012]: https://docs.fabricmc.net/develop/loader/
