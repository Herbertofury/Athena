"""Generate the original offline morph QA pair; run only via Blender background."""
from pathlib import Path
import sys

import bpy


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    if len(args) != 1:
        raise ValueError("Supply one new output directory after --")
    destination = Path(args[0])
    destination.mkdir(exist_ok=False)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mesh = bpy.data.meshes.new("Research geometry")
    mesh.from_pydata([(0, 0, 0), (1, 0, 0), (1, 1, 0), (0, 1, 0)], [], [(0, 1, 2, 3)])
    mesh.update()
    obj = bpy.data.objects.new("Review specimen", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    obj.shape_key_add(name="Basis")
    for name, vertex, delta in [("Raise corners", 1, 0.45), ("Drop corner", 2, -0.35)]:
        key = obj.shape_key_add(name=name)
        key.data[vertex].co.z += delta
        for frame, weight in [(1, 0.0), (8, 1.0), (16, 0.25)]:
            key.value = weight
            key.keyframe_insert(data_path="value", frame=frame)
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 16
    options = {"export_format": "GLB", "export_morph": True, "export_animations": True}
    bpy.ops.export_scene.gltf(filepath=str(destination / "review-morph-reference.glb"), **options)
    bpy.context.scene.frame_set(8)
    modifier = obj.modifiers.new("Visible geometry subdivision", "SUBSURF")
    modifier.levels = 1
    bpy.ops.export_scene.gltf(filepath=str(destination / "review-morph-baked.glb"), export_apply=True, **options)


if __name__ == "__main__":
    main()
