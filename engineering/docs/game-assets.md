# Game assets and animation: separate the gates

A concept image proves an artistic direction, not topology, animation, collision, export or gameplay correctness.

1. Establish source identity and intended behavior.
2. Validate geometry, pivots, scale, sockets and swept motion.
3. Define ownership transitions for held props and interruption recovery.
4. Keep confirmed gameplay events authoritative for effects and resources.
5. Validate export and resource loading in the target engine.
6. Test native gameplay, networking, saves, performance and visual quality.

Use a representative vertical slice before scaling the pipeline. Preserve earlier concepts as alternates and keep art acceptance separate from implementation acceptance. Test normal hands and proportions rather than shrinking a character to hide clipping. Numerical samples are not continuous collision proof; inspect interpolation/extrema and the real game camera.

An interchange format does not specify all runtime behavior. The glTF registry/specification describes asset delivery and animation data; playback policy, interruption, gameplay timing and engine integration still require an application contract. [A01](sources.md#a01)

Profile CPU, GPU and IO separately. Godot's optimization guidance distinguishes continuous low throughput, intermittent stalls and load-time delays; a single FPS average can hide the problem the user actually sees. [A02](sources.md#a02)

## Research backlog

Engine-specific import/export compatibility, material/texture budgets, mesh compression, animation retargeting, GPU-driven rendering and accessibility-aware effects require separate dated experiments. Do not mark them solved because a tool advertises support.
