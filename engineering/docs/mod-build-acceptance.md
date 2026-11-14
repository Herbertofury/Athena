# Mod build acceptance: from source to an installed artifact

Reviewed **2026-11-11 UTC**. This is an operational research guide, not a tested mod, a loader ranking, or approval to migrate any project. Start with [mod-development principles](mods.md), then use the [compatibility receipt](../templates/mod-compatibility-receipt.md). For model and texture delivery, use [asset import acceptance](asset-import-acceptance.md).

## 1. Declare a compatibility lane before touching the build

Record the game build, loader and loader version, loader API, mappings namespace and version (or explicitly not applicable), build plugin, Gradle wrapper, Gradle JVM, Java compiler toolchain, bytecode/API target, runtime JVM, OS/architecture, and all required mod dependencies. A version range in a descriptor is an eligibility declaration, not a list of versions that passed.

| Lane observed in official documentation | Documented constraint | What it does not establish |
|---|---|---|
| Forge documentation explicitly selected for Minecraft 1.20.1 | Java 17, 64-bit JVM. [MB11001](https://docs.minecraftforge.net/en/1.20.1/gettingstarted/) | Compatibility with newer Forge, NeoForge, or an arbitrary modpack. |
| Fabric setup page headed 26.2 at review time | Its body still explicitly says Java 25 for Minecraft 26.1. Preserve that narrower wording and check the target's template. [MB11002](https://docs.fabricmc.net/develop/getting-started/setting-up) | An independently tested 26.2/26.3 toolchain or the latest loader release. |
| NeoForge setup page selected as 26.1 | Java 25, 64-bit JVM; ModDevGradle and NeoGradle are distinct template choices. [MB11003](https://docs.neoforged.net/docs/gettingstarted/) | A stable loader release for every newer vanilla version. |

**Research synthesis:** preserve an existing compatible lane before investigating upgrades. Change one independently testable layer at a time. An incompatible required mod disqualifies a loader candidate even if its empty-game benchmark is faster.

## 2. Separate the three Java questions

Gradle's JVM, the compiler/test toolchain, and the installed game's runtime are separate observations. Java toolchains select tools; `--release` constrains the compiler's language/API/bytecode target. `sourceCompatibility` and `targetCompatibility` alone do not select a JDK or prevent every newer-API reference. An IDE's Gradle JVM can differ from a terminal's selection. [MB11004](https://docs.gradle.org/current/userguide/toolchains.html)

Before running a trusted build, capture wrapper/plugin identities and the effective settings. When execution is authorized, collect `./gradlew --version`, `./gradlew -q javaToolchains`, the actual compile/test task configuration, and the installed runtime's `java -version`. The `javaToolchains` inventory alone does not identify which compiler every custom task used. Redact personal paths from published receipts.

Do not “fix” a historical build by globally replacing Java. Prefer an isolated project configuration. Do not interpret successful compilation as compatibility with APIs absent from the target game or JVM.

## 3. Keep dependency selection, bytes, and trust separate

**Documented facts:** Gradle locking records resolved versions for enabled, resolved configurations; `lockAllConfigurations()` does not cover buildscript configurations. Changing artifacts such as `SNAPSHOT` can retain coordinates while their bytes change. [MB11005](https://docs.gradle.org/current/userguide/dependency_locking.html)

Dependency verification checks configured hashes/signatures, but bootstrapping records what is currently available and therefore cannot independently establish trust. The reviewed manual excludes changing dependencies and locally produced artifacts from verification. Strict mode fails verification; lenient/off modes do not provide the same gate. [MB11006](https://docs.gradle.org/current/userguide/securing_dependencies.html)

**Proposed release gate:**

1. Inventory project, plugin/buildscript, included-build and packaged runtime dependencies separately. Record which configurations were actually resolved.
2. Pin approved versions and repository origins. Review generated locks and verification metadata before trusting them.
3. Record hashes for locally produced and embedded artifacts that upstream verification does not cover.
4. In an isolated synthetic fixture, prove that a changed dependency and a missing verification entry fail the intended gate. Keep the original failure. Do not repair it by automatically trusting the new bytes.
5. Retain the complete dependency inventory and applicable licenses. A tool's license does not license a game's code, another mod, or bundled art.

**Rejected shortcut:** a version catalog or lock file alone as a supply-chain proof. It may stabilize selection without establishing artifact identity or trust. Conversely, a correct hash does not establish permission to redistribute the file.

## 4. Verify the distributable, not only the development classpath

Fabric's reviewed Loom reference distinguishes `net.fabricmc.fabric-loom` for non-obfuscated Minecraft 26.1+ from `net.fabricmc.fabric-loom-remap` for 1.21.11 and older. Its `include` dependency configuration is non-transitive, and inclusion targets `jar` or `remapJar` according to that mode; another packaging task does not automatically inherit it. [MB11007](https://docs.fabricmc.net/develop/loom/)

NeoForge separately documents non-Minecraft dependencies on development classpaths and production jar-in-jar packaging, including a 1.21.9 versus 1.21.8-and-earlier distinction. A library reachable during development can still be missing from the installed mod. [MB11008](https://docs.neoforged.net/toolchain/docs/dependencies/nonmclibs/)

**Proposed artifact inspection:** bind the final JAR hash to its build revision and exact packaging task. Check the actual descriptor, entrypoints, environment declarations, dependency ranges, mixin configuration/reference resources where applicable, access-widening/transform resources, service metadata, resource namespaces, duplicate entries and embedded libraries. Keep source, development and production artifacts distinguishable. Test the exact distributed bytes in a clean instance with no development-only classpath. Do not assume every listed mechanism applies to every loader version.

## 5. Exercise physical and logical sides independently

Forge distinguishes physical client/server from logical client/server. Single-player hosts a logical server inside the physical client, so it can conceal client-only class loading and direct static-state sharing that fail on a dedicated server. [MB11009](https://docs.minecraftforge.net/en/1.20.1/concepts/sides/)

Fabric's testing guide offers separate unit, server GameTest and client-testing paths. Select only APIs present in the pinned target; a test task's existence is not evidence that the normal installation path passed. [MB11010](https://docs.fabricmc.net/develop/automatic-testing)

The following is an **unrun test design**, to be instantiated per target:

| Scenario | Required observation | Failure worth retaining |
|---|---|---|
| Clean client and clean dedicated server | Exact distributed artifact loads with intended dependencies and side behavior. | Development succeeds while installed server loads client-only classes. |
| Client joins server; reconnect and dimension change | Authoritative state converges without duplicated actions. | Local prediction consumes a resource twice or misses a server rejection. |
| Resource/data reload | IDs, generated assets, recipes and references remain valid; errors are visible. | A stale cache hides a missing generated file. |
| Save, orderly exit, restart and upgrade-copy load | Required state persists; unsupported schema/version is explicit. | Changed IDs silently discard saved objects. |
| Interrupted operation and repeated input | Defined cancellation/rollback and no duplicated result. | Interrupted animation still commits an action. |
| Required-mod combination | Explicit compatibility matrix with actual versions and exclusions. | Only the minimal mod set works. |

Use copies of saves and isolated instances. A failed compatibility case is not permission to overwrite a user's working world. Crash, power-loss and downgrade safety need their own evidence if promised.

## 6. Other games need their own contract

BepInEx distinguishes stable and bleeding-edge distributions and links separate installation paths for Unity Mono, IL2CPP and .NET Framework. Pin game build, backend, architecture, OS, loader channel and plugin API before selecting an artifact. [MB11011](https://docs.bepinex.dev/master/articles/user_guide/installation/index.html)

Do not transfer a Minecraft or Unity result to Sims package/script compatibility. For a proprietary game's undocumented interface, mark the observation as target-specific and incomplete; seek legitimate documentation or authorized runtime evidence. An in-process plugin is not a security boundary for untrusted code.

## 7. Compare complete outcomes only after correctness

Pre-register startup-to-playable time, resource reload time, server tick tails, frame tails, memory, full output, visual quality and acceptable regression budgets. Measure a target's current implementation against the candidate on equivalent saves, mod sets, view distances, graphics settings and hardware. Separate cold and warm runs. Report all trials and failures, not a selected average.

A completed receipt can support review; it does not certify compatibility. No experiment in this guide has run, no target-project recommendation is made, and no build/runtime upgrade is prescribed.
