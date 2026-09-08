"""Render the original pickup model as a transparent, reusable HUD icon.

Run with Blender --background --factory-startup --python scripts/green-fire/render_icon.py.
The editable source and GLB remain unchanged.
"""
from pathlib import Path

import bpy
from mathutils import Vector

KIT = Path(__file__).resolve().parents[2] / "mobile-game-assests/green-fire-pickup-v1"

bpy.ops.wm.open_mainfile(filepath=str(KIT / "source/green-fire-pickup.blend"))
scene = bpy.context.scene
scene.frame_set(9)
scene.render.engine = "CYCLES"
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "Standard"
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (.06, .1, .07, 1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value = .5

target = Vector((0, 0, .64))
for location, power, size in [((-2, -3, 4), 160, 4), ((2, -1, 2), 70, 3)]:
    bpy.ops.object.light_add(type="AREA", location=location)
    light = bpy.context.object
    light.data.energy, light.data.size = power, size
    light.rotation_euler = (target - light.location).to_track_quat("-Z", "Y").to_euler()

bpy.ops.object.camera_add(location=(.4, -4.5, 1.2))
camera = bpy.context.object
camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.type = "ORTHO"
camera.data.ortho_scale = 1.45
scene.camera = camera

output = KIT / "ui/green-fire-icon.png"
output.parent.mkdir(parents=True, exist_ok=True)
scene.render.filepath = str(output)
bpy.ops.render.render(write_still=True)
print("GREEN_FIRE_ICON", output, flush=True)
