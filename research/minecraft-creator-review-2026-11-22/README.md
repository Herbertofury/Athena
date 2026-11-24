# Minecraft mob references: two manual followed projects

Reviewed 2026-11-22 UTC. These are public source references with an opt-in
Athena Projects import. They do not enroll anyone on a platform, create a
separate creator follow, fetch new releases, or schedule notifications.

## Add to Athena yourself

Download [manual-followed-projects.json](manual-followed-projects.json) from this
repository. In [Athena Projects](https://herbertofury.github.io/Athena/#projects)
choose **Import backup**, select the JSON, review the two proposed names, then
choose **Import reviewed projects**. Find them under **Following**.
Cancel leaves your workspace unchanged. An unchanged re-import is a no-op; a
same-ID import that conflicts with your edits is refused. Keep your local edits.
The file is not included in the public runtime package and does not load on
startup. It has no private records, binaries, images, or copied model assets.

## Public identity and scope

- **[DokiMobs model series](https://mcmodels.net/vendors/307/mmixelart).** MCModels identifies its vendor as 映素作坊MMixelArt (vendor 307). The storefront directly links [Equilibre256](https://x.com/Equilibre256) and [@mixel.art0](https://www.youtube.com/@mixel.art0); the [YouTube channel record](https://www.youtube.com/channel/UCog4dBKjooSBFbYRhRQ7xMQ) identifies the latter handle. A [Patreon profile](https://www.patreon.com/cw/u94643123) shows matching studio branding and Minecraft model work, but the storefront did not directly link it, so it is not in the verified account set. The storefront's [Creaking Girl listing](https://mcmodels.net/products/18042/dokimobscreaking-girl) describes different selection poses, independent expressions and a particle toggle. It is a paid model listing, not a JAR or a grant to copy assets.
- **[Kiwi’s Mobs](https://www.curseforge.com/minecraft/mc-mods/kiwis-mobs).** CurseForge identifies project 1765329 and lists [kiwi_2238](https://www.curseforge.com/members/kiwi_2238/projects) as owner. The project description itself points to [@New_Zeal_kiwi](https://x.com/New_Zeal_kiwi) for contact. It recommends Minecraft 1.21.1 and flags 1.20.1 as unstable. [File 9667926](https://www.curseforge.com/minecraft/mc-mods/kiwis-mobs/files/9667926) is the observed November 17, 2026 Fabric 1.21.1 build, version 1.46.240, explicitly a beta and Nether test version. The author describes Axolotl and structure entries and improved compendium previews. This is not a tested release or install recommendation.

The separately published [dokimobs JAR](https://www.curseforge.com/minecraft/mc-mods/dokimobs)
lists QinQianjiu as owner. That publisher is **not** joined to the marketplace
studio by these sources. [DokiMobs Chat](https://modrinth.com/modpack/dokimobs-chat)
is a separate modpack. Neither is included as a followed-project row. No claim
is made about the contents of unavailable X clips or the completeness of any
channel's video inventory.

## Try the design ideas on original assets

1. **Readability:** In a clean test world, record an original mob under sunlight,
   torchlight and fog at close and combat distances. Verify its silhouette and
   its idle, alert and attack states are recognizable without changing models.
2. **Expression and feedback:** Confirm one original action plays through from
   its wind-up to recovery with no frozen limbs. Toggle an optional effect on
   and off; the animation must remain readable in both modes.
3. **Bestiary:** Check that one preview and its trait text match the same
   observed in-game behavior. Verify the preview can stop when closed and can
   be reopened without duplicating controls or drawing after navigation.
4. **Cold client/server join:** Using original test assets and the pinned target
   game/loader, record first render on joining a disposable dedicated server
   before issuing a resource reload. Missing textures, silent fallback or
   animation errors fail this check.

These are proposed acceptance checks, not observations from running either
creator's package. The source note's links can be revisited manually. Inline
creator evidence in the JSON is preserved as reference metadata, not executable
instructions, social-account linking, or a source of download rights.
