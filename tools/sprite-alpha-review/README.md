# Read-only sprite atlas alpha audit

Checks a known rectangular grid for alpha at its reserved gutters, low
nonzero alpha, empty or visually duplicate tiles, and stored RGB below zero
alpha. It never changes pixels. Low alpha can be legitimate antialiasing,
and transparent RGB can be deliberate edge extension. Neither is by itself
a failure, nor does a clean report prove a renderer at scale, sequence timing,
identity, visibility on every background, ownership, or reproduction rights.

`python audit.py PATH.png --cols 8 --rows 1 --gutter 2`

Defaults to a mathematically equal grid. An explicitly supplied `--estimate`
divides odd dimensions for preliminary comparison only; the report flags
geometry as estimated, not an approved frame manifest. Non-interlaced RGBA8 PNG
only. Compressed payload, decoded dimensions, filter handling and chunk
checks are bounded. This is a restricted audit parser, not a replacement for
a production PNG decoder.

Use the [PNG Third Edition specification](https://www.w3.org/TR/png-3/) for
scanlines and alpha. The [Aseprite export documentation](https://www.aseprite.org/docs/cli/)
describes external sheet metadata and optional edge extrusion. [Godot's image
import documentation](https://docs.godotengine.org/en/latest/tutorials/assets_pipeline/importing_images.html)
describes alpha-border processing; that processing is not applied by this tool.
Preserve the editor source and actual runtime tuning evidence separately.

## Authored frame geometry

Use `python audit.py sheet.png --manifest frames.json --gutter 0 --min-gap 2`
when you already have approved frame positions and durations. The small
manifest is Athena's own interchange shape, not an Aseprite importer:

```json
{
  "schema": "athena-sprite-frames-v1",
  "source_sha256": "<SHA-256 of the exact sheet bytes>",
  "frames": [
    {"x": 0, "y": 0, "width": 16, "height": 16, "duration_ms": 80}
  ]
}
```

Entries keep their authored order and exact millisecond durations. Rectangles
must be non-overlapping and wholly inside the PNG. A minimum gap checks only
rectangle separation on at least one axis; it does not certify transparent
padding or edge extrusion. Packed/trimmed content may intentionally touch
its declared rectangle, so manifest mode defaults to a zero internal gutter.
This audit does not infer offsets, edit pixels, drop duplicate poses, or verify
animation playback. Do not fabricate a manifest from a rough grid estimate.
