# November 11, 2026: bytecode injection acceptance foundation

## Gap and decision

Athena main `44384b809c80e03adbd62f8be9617d01e6ad9922` was checked for existing Mixin/bytecode experiments and guides. Its mod principles, archive labs and prior build/version-semantics drafts address different contracts. This contribution adds bytecode-selector drift evidence and a native injection acceptance design, without repeating dependency parsing, changing the catalog rankings or editing another project.

## Measured versus documented

The [laboratory](../experiments/bytecode-selector-lab/README.md) compiles eleven original sources twice and reads the generated classfiles with ASM 9.11.1. Its 22 observations meet all 132 predeclared count expectations. The [receipt](../experiments/bytecode-selector-lab/observed-2026-11-11.json) retains complete driver output, input/class hashes, runtime identity, instruction summaries and comparisons. Forty-seven offline tests check expected behavior and evidence mutations. No synthetic fixture is represented as a real mod trace. Independent review reproduced the Java observations and identified a Python boolean/integer/float equality loophole in derived receipt comparison; type-strict comparison and five mutation regressions now cover it.

The [guide](../docs/mod-bytecode-acceptance.md) separately summarizes pinned upstream Mixin source and version-scoped documentation. It does not claim that ASM inspection runs Mixin. Public hooks, exact selectors, cardinality checks, debug exports and native behavioral tests are presented as different evidence layers.

## Concrete findings

- Exact descriptors distinguish overloads; owner identity distinguishes otherwise similar calls.
- Count parity can coexist with changed immediate argument-producing instructions.
- A valid always-throwing compiled method has no return instruction. Historical wiki wording that assumes a method always has a return is too broad; pinned upstream implementation searches typed returns.
- All eleven debug/no-debug pairs change the artifact hash but retain equal inspected summaries. The summaries deliberately omit important class attributes and control-flow destinations.
- Minimum-only match checks and stable ordinals cannot establish the intended semantic operation. The laboratory demonstrates structural counterexamples; actual injector behavior remains unrun.

## Reproduction failures and limitations

Both requested `--release` values were rejected by this executor. Source/target 21 is recorded explicitly and is not a replacement claim for cross-release API enforcement. A driver flag error (`-g:all`) was corrected to `-g`; its failed/partial stage is retained in the sanitized setup-attempt file. Expectations were not changed to turn a semantic mismatch into a pass.

The GitHub connector did not support the attempted tag-list endpoint, and an assumed upstream `0.8.7` tag lookup returned 404. Rather than treating that as a verified release, source references use the observed upstream master commit `4053421aa10aaac6127d969028a29c94fe3054f6`. That source revision is not claimed to be the installed version of any loader. ASM registry bytes and source artifacts were inspected separately; no signature verification or source-to-binary reproducible build is claimed.

Full baseline Research checks still contain the inherited cross-root link error involving `apps/atlas-lab/README.md` and repository-root `docs/athena-local-runtime.md`. This contribution does not change or waive that checker. Focused checks and the independent full-suite baseline comparison are reported separately in the draft PR.

## Alternatives and remaining gates

A public event can satisfy an extension point without depending on arbitrary bytecode layout, if its timing, data and behavior suffice. A specific injection can address a missing hook but adds compatibility work. A universal handwritten Mixin emulator was rejected: it would duplicate fork/version-specific selectors, remapping and transformation order while obscuring the actual runtime boundary.

The next useful test is an authorized native fixture on the exact target fork and current implementation, including known-bad selectors, competing modifications and all required state paths. This work changes no installed mod, game, held project or release. No target recommendation, native compatibility, performance improvement, merge or deployment is established.

## Sources

Primary sources opened and checked 2026-11-11 UTC. Historical wiki edit dates, current documentation headings, source commit and tested artifact version are kept distinct in [the source fragment](../data/sources.d/mod-bytecode-20261111.json).

[BI11001](https://github.com/SpongePowered/Mixin/wiki/Advanced-Mixin-Usage---Callback-Injectors), [BI11002](https://github.com/SpongePowered/Mixin/wiki/Injection-Point-Reference), [BI11003](https://github.com/SpongePowered/Mixin/blob/4053421aa10aaac6127d969028a29c94fe3054f6/src/main/java/org/spongepowered/asm/mixin/injection/Inject.java), [BI11004](https://github.com/SpongePowered/Mixin/blob/4053421aa10aaac6127d969028a29c94fe3054f6/src/main/java/org/spongepowered/asm/mixin/injection/At.java), [BI11005](https://github.com/SpongePowered/Mixin/blob/4053421aa10aaac6127d969028a29c94fe3054f6/src/main/java/org/spongepowered/asm/mixin/MixinEnvironment.java), [BI11006](https://github.com/SpongePowered/Mixin/blob/4053421aa10aaac6127d969028a29c94fe3054f6/src/main/java/org/spongepowered/asm/mixin/injection/points/BeforeReturn.java), [BI11007](https://docs.fabricmc.net/develop/loader/), [BI11008](https://asm.ow2.io/versions.html), [BI11009](https://asm.ow2.io/javadoc/org/objectweb/asm/ClassReader.html), [BI11010](https://asm.ow2.io/javadoc/org/objectweb/asm/MethodVisitor.html), [BI11011](https://repo.maven.apache.org/maven2/org/ow2/asm/asm/9.11.1/asm-9.11.1.jar), [BI11012](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html#jvms-4.3.3), [BI11013](https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/tools/JavaCompiler.html), [BI11014](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html), [BI11015](https://docs.fabricmc.net/develop/events/), [BI11016](https://repo.maven.apache.org/maven2/org/ow2/asm/asm/9.11.1/asm-9.11.1-sources.jar).
