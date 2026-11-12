# November 11, 2026: mod builds and asset acceptance

Primary sources checked **2026-11-11 UTC**. This is **primary-documented research plus proposed test designs**, not measured mod compatibility, game execution or target acceptance.

## Gap and prior work

Athena main `44384b809c80e03adbd62f8be9617d01e6ad9922` already contains mod-development and asset principles plus Fabric, NeoForge, BepInEx, Blender, glTF Transform and fastgltf candidates. Existing comparisons and catalog entries are retained unchanged. This contribution adds operational steps and reusable receipts rather than duplicating those candidates or expanding their rankings.

The current open-draft titles/scopes were reviewed before authoring. Release integration, native platform work, preservation, site-adapter implementations and curriculum changes are outside this contribution. No source repository, runtime, dependency, user save or game asset is modified.

## New deliverables

- [Mod build acceptance](../docs/mod-build-acceptance.md): compatibility lanes; three distinct Java environments; dependency resolution versus integrity/trust; production packaging; dedicated-server and native lifecycle gates; conditional cross-ecosystem boundaries.
- [Asset import acceptance](../docs/asset-import-acceptance.md): version/extension/resource inventory; editor versus packaged loading; semantic and visual fidelity; failure fixtures; complete-pipeline metrics.
- [Mod receipt](../templates/mod-compatibility-receipt.md) and [asset receipt](../templates/asset-compatibility-receipt.md): all scenarios begin not_run; evidence, remaining limits and failed attempts stay separate.
- Fifteen additive source observations in [the new fragment](../data/sources.d/mod-build-assets-20261111.json), indexed without replacing older records.

## Findings that affect a build decision

1. Historical Forge 1.20.1 and modern setup pages specify different Java requirements. Fabric's opened setup page has a 26.2 heading while its Java sentence names 26.1; the guide preserves the actual scope rather than inferring a tested newer lane.
2. A dependency lock chooses versions, verification checks configured artifact evidence, and initial trust remains a separate review. Neither establishes production packaging completeness.
3. Fabric's remapping/non-remapping packaging paths and NeoForge's development/production dependency handling make clean installed-artifact tests necessary.
4. A single-player test can conceal physical-server failures. Unit, server, client, installed launch, save and interrupted-flow results must remain distinct.
5. GLB is not synonymous with self-contained. Format validation and supported extensions do not demonstrate correct native rendering or gameplay.
6. Direct authoring-file import can add build-tool dependencies and editor-platform restrictions; it is not universally preferable to explicit exports.

These implications are research synthesis, not measured improvements or instructions to change another project. No actual project comparison was run. Required native and performance acceptance remains open.

## Source IDs

[MB11001](https://docs.minecraftforge.net/en/1.20.1/gettingstarted/), [MB11002](https://docs.fabricmc.net/develop/getting-started/setting-up), [MB11003](https://docs.neoforged.net/docs/gettingstarted/), [MB11004](https://docs.gradle.org/current/userguide/toolchains.html), [MB11005](https://docs.gradle.org/current/userguide/dependency_locking.html), [MB11006](https://docs.gradle.org/current/userguide/securing_dependencies.html), [MB11007](https://docs.fabricmc.net/develop/loom/), [MB11008](https://docs.neoforged.net/toolchain/docs/dependencies/nonmclibs/), [MB11009](https://docs.minecraftforge.net/en/1.20.1/concepts/sides/), [MB11010](https://docs.fabricmc.net/develop/automatic-testing), [MB11011](https://docs.bepinex.dev/master/articles/user_guide/installation/index.html), [MB11012](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html), [MB11013](https://github.com/KhronosGroup/glTF-Validator), [MB11014](https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_3d_scenes/available_formats.html), [MB11015](https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_3d_scenes/model_export_considerations.html).

## Research limits and failed retrievals

The old Gradle dependency-verification page yielded navigation rather than guidance; its own current navigation led to the substantive Securing Dependencies page. A guessed Fabric testing URL failed; the page's official navigation identified automatic-testing. The pinned Blender 4.5 manual request returned HTTP 402. Two GitHub extension-directory pages could not be retrieved. No claims about those extension implementations or Blender settings were taken from inaccessible content. Sources above were opened beyond search snippets.

No proprietary game files, third-party art or raw user traces are included. No universal ranking, latest-version recommendation or native-game success is claimed. Dynamic documentation must be rechecked against the selected target before implementation.
