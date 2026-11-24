# Mod development: compatibility is a first-class requirement

## Pin the target tuple

Game release + loader + loader version + mappings/API + language runtime + dependency versions + packaging/export format. Keep source observations, test fixtures and actual native-game evidence separate.

The current Fabric and NeoForge setup pages target modern Minecraft releases and specify JDK 25. The Forge 1.20.1 documentation belongs to a different lane. Do not copy the newest setup instructions into a pinned older modpack or assume one loader's APIs work in another. Recheck the version selector and exact upstream source before changing code. [M01](sources.md#m01)[M02](sources.md#m02)[M03](sources.md#m03)

## Build one complete vertical slice

One feature through load, resource discovery, gameplay, cancellation/interruption, world save/reload, networking and performance before mass-producing variants. Preserve registry IDs and save formats. Use migrations and explicit versioned contracts when changes are necessary.

## Profile the right loop

Separate startup discovery, resource reload, world generation, per-tick server work, client render work and occasional spikes. Batch or precompute only where semantics remain intact. Do not remove entities, disable compatibility, reduce visual fidelity or weaken gameplay checks and call it an equivalent performance improvement.

## Other games and extension ecosystems

For Sims and other proprietary games, record the exact supported scripting/runtime and package format from version-appropriate documentation and verified source observations. Do not assume desktop Python or a general-purpose engine is a drop-in replacement. Respect asset licenses and redistribution boundaries. This section is a research queue, not a claim of complete ecosystem coverage.

## Native proof

Use the actual target runtime, normal installed launch path, real assets, both successful and failing scenarios, multiplayer authority where relevant, and long-lived save compatibility. A successful compile, JSON validator or pretty render is only one gate.
