"""Render a portable preview loop from the editable Blender source."""
import bpy
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
from build_pickup import OUT, render_preview

bpy.ops.wm.open_mainfile(filepath=str(OUT/'source'/'green-fire-pickup.blend'))
scene = bpy.context.scene
render_preview(scene,render=False)
scene.cycles.samples = 8
scene.render.resolution_x = 360
scene.render.resolution_y = 400
folder = Path(tempfile.mkdtemp(prefix='bolt-green-fire-frames-'))
for index,frame in enumerate(range(1,49,2)):
    scene.frame_set(frame)
    scene.render.filepath = str(folder/f'{index:03}.png')
    bpy.ops.render.render(write_still=True)
    print('LOOP_FRAME',index+1,24,flush=True)
(OUT/'previews'/'loop-frames-path.txt').write_text(str(folder))
print('LOOP_FRAMES_READY',folder,flush=True)
