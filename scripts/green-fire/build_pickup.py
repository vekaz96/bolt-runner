"""Original animated green-fire pickup. Run with Blender 5 --background --python."""
import bpy
import json
import math
import struct
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'mobile-game-assests' / 'green-fire-pickup-v1'
FPS, END = 24, 49


def merge_gltf_clips(path):
    """Combine Blender's per-object scene clips into one synchronized idle action."""
    data = path.read_bytes()
    size, kind = struct.unpack_from('<II',data,12)
    assert kind == 0x4E4F534A
    document = json.loads(data[20:20+size])
    merged = {'name':'GreenFire_Idle','samplers':[],'channels':[]}
    for animation in document['animations']:
        offset = len(merged['samplers'])
        merged['samplers'].extend(animation['samplers'])
        for channel in animation['channels']:
            merged['channels'].append({**channel,'sampler':channel['sampler']+offset})
    document['animations'] = [merged]
    encoded = json.dumps(document,separators=(',',':')).encode()
    encoded += b' '*((-len(encoded))%4)
    remainder = data[20+size:]
    path.write_bytes(struct.pack('<III',0x46546C67,2,20+len(encoded)+len(remainder)) + struct.pack('<II',len(encoded),kind) + encoded + remainder)


def material(name, color, emission=0):
    def linear(value):
        return value / 12.92 if value <= .04045 else ((value + .055) / 1.055) ** 2.4
    rgb = tuple(linear(int(color[i:i+2], 16) / 255) for i in (1, 3, 5))
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = (*rgb, 1)
    node = mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = (*rgb, 1)
    node.inputs['Roughness'].default_value = .48
    node.inputs['Emission Color'].default_value = (*rgb, 1)
    node.inputs['Emission Strength'].default_value = emission
    return mat


def flame(name, profile, mat, parent, y=0):
    # Curved ring loft: genuinely volumetric, with a sculpted asymmetric tip.
    # Catmull-Rom interpolation rounds the tongue silhouette between authored rings.
    smooth_profile = []
    for i in range(len(profile)-1):
        p0,p1,p2,p3 = [profile[max(0,min(len(profile)-1,j))] for j in (i-1,i,i+1,i+2)]
        for step in range(3):
            t = step/3
            row = [0.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t) for a,b,c,d in zip(p0,p1,p2,p3)]
            row[2],row[3] = max(.002,row[2]),max(.002,row[3])
            smooth_profile.append(row)
    profile = smooth_profile + [profile[-1]]
    segments = 12
    vertices, faces = [], []
    for z, cx, radius, depth in profile:
        for i in range(segments):
            angle = i * math.tau / segments
            vertices.append((cx + radius * math.cos(angle), y + depth * math.sin(angle), z))
    for row in range(len(profile)-1):
        for i in range(segments):
            a, b = row*segments+i, row*segments+(i+1)%segments
            faces.append((a, b, b+segments, a+segments))
    faces += [tuple(range(segments-1,-1,-1)), tuple(range((len(profile)-1)*segments,len(profile)*segments))]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj.parent = parent
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    # Bend the tips independently, preserving the rounded lower silhouette.
    obj.shape_key_add(name='Basis')
    sway = obj.shape_key_add(name='Flame sway')
    ripple = obj.shape_key_add(name='Flame flicker')
    min_z, max_z = profile[0][0], profile[-1][0]
    for i, vertex in enumerate(mesh.vertices):
        t = (vertex.co.z-min_z)/(max_z-min_z)
        sway.data[i].co.x += .09 * t*t
        sway.data[i].co.z += .055 * t*t
        ripple.data[i].co.x -= .07 * t*t
        ripple.data[i].co.z -= .045 * t
        ripple.data[i].co.y = y + (vertex.co.y-y)*(1-.1*t)
    for frame in range(1, END+1, 2):
        t = (frame-1)/(END-1)
        sway.value = .5 + .5*math.sin(math.tau*t*2)
        ripple.value = .5 + .5*math.sin(math.tau*t*3+.9)
        sway.keyframe_insert('value', frame=frame)
        ripple.keyframe_insert('value', frame=frame)
    return obj


def main():
    for folder in ('models','source','previews'):
        (OUT/folder).mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_start, scene.frame_end = 1, END
    root = bpy.data.objects.new('GreenFire_Pickup', None)
    bpy.context.collection.objects.link(root)
    emerald = material('Fire emerald', '#05B64C', .35)
    jade = material('Fire deep emerald', '#087A48', .15)
    green = material('Fire fresh green', '#45E529', .55)
    lime = material('Fire lime core', '#BDFF4B', .9)
    hot = material('Fire pale lime', '#E4FF9E', .7)

    flame('Emerald flame', [
        (.13,0,.025,.02),(.2,-.015,.2,.115),(.32,-.025,.30,.16),
        (.48,-.015,.28,.165),(.64,.025,.20,.125),(.82,.10,.115,.078),
        (1.0,.17,.055,.045),(1.15,.12,.004,.004),
    ], emerald, root)
    flame('Left flame tongue', [
        (.18,-.13,.035,.025),(.27,-.20,.14,.085),(.43,-.27,.125,.085),
        (.58,-.31,.07,.055),(.74,-.34,.04,.026),(.84,-.29,.003,.003),
    ], jade, root, .015)
    flame('Right flame tongue', [
        (.16,.11,.02,.02),(.26,.23,.13,.09),(.4,.29,.105,.07),
        (.54,.31,.065,.05),(.70,.27,.032,.025),(.80,.34,.003,.003),
    ], green, root, .015)
    # Two raised cores give the pickup a readable flame motif on both sides.
    core_profile = [(.18,-.01,.012,.012),(.25,-.005,.11,.045),(.35,.01,.145,.055),
                    (.47,.035,.115,.05),(.60,.065,.072,.035),(.75,.035,.003,.003)]
    for side in (-1,1):
        flame('Lime heart front' if side == -1 else 'Lime heart back', core_profile, lime, root, side*.15)
        flame('Pale core front' if side == -1 else 'Pale core back', [
            (.21,.005,.009,.009),(.28,.02,.055,.023),(.36,.033,.066,.025),
            (.44,.055,.04,.018),(.54,.035,.003,.003),
        ], hot, root, side*.20)

    bpy.ops.mesh.primitive_torus_add(major_radius=.29, minor_radius=.012, major_segments=32, minor_segments=6, location=(0,0,.06))
    orbit = bpy.context.object
    orbit.name = 'Collectible halo'
    orbit.parent = root
    orbit.data.materials.append(green)
    for polygon in orbit.data.polygons:
        polygon.use_smooth = True

    for frame in range(1,END+1,2):
        t = (frame-1)/(END-1)
        root.location.z = .06 + .045*math.sin(math.tau*t)
        root.rotation_euler.z = .12*math.sin(math.tau*t)
        root.keyframe_insert('location',frame=frame)
        root.keyframe_insert('rotation_euler',frame=frame)
        orbit.scale = (1+.07*math.sin(math.tau*t*2),)*3
        orbit.keyframe_insert('scale',frame=frame)

    # Small green embers rise and shrink. No transparent billboard sorting or textures.
    for i in range(7):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1)
        spark = bpy.context.object
        spark.name = f'Rising ember {i+1:02}'
        spark.parent = root
        spark.data.materials.append(lime if i%2 else green)
        for frame in range(1,END+1):
            t = ((frame-1)/(END-1) + i/7) % 1
            angle = i*2.399 + t*.65
            distance = .34 + .11*math.sin(math.pi*t)
            spark.location = (math.cos(angle)*distance,math.sin(angle)*distance*.65,.18+t*1.12)
            size = .024*math.sin(math.pi*t)**2
            spark.scale = (size,size,size*1.9)
            spark.keyframe_insert('location',frame=frame)
            spark.keyframe_insert('scale',frame=frame)

    scene.frame_set(1)
    # All transform and morph actions are merged by SCENE mode into one portable loop.
    bpy.ops.object.select_all(action='SELECT')
    model_path = OUT/'models'/'green-fire-pickup.glb'
    bpy.ops.export_scene.gltf(
        filepath=str(model_path),export_format='GLB',use_selection=True,
        export_yup=True,export_animations=True,export_animation_mode='SCENE',
        export_nla_strips_merged_animation_name='GreenFire_Idle',
        export_frame_range=True,export_frame_step=1,export_force_sampling=True,
        export_anim_slide_to_zero=True,
        export_morph=True,export_morph_normal=False,
        export_cameras=False,export_lights=False,
    )
    merge_gltf_clips(model_path)
    scene['asset_notes'] = 'Phase 1 only: 2-second idle loop, hover, morph flame flicker and 7 rising embers. No attack/collection logic.'
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'source'/'green-fire-pickup.blend'))
    meshes = [o for o in scene.objects if o.type=='MESH']
    triangles = 0
    for obj in meshes:
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
    manifest = {
        'name':'Green Fire Pickup','phase':1,'generator':'Blender 5 original geometry and animation',
        'model':'models/green-fire-pickup.glb','source':'source/green-fire-pickup.blend',
        'preview':'previews/green-fire-pickup.png',
        'animatedPreview':'previews/green-fire-idle.gif',
        'mapPreviews':{'current':'previews/current-map-gameplay.png','boulevard':'previews/boulevard-gameplay.png'},
        'animation':'GreenFire_Idle','bytes':model_path.stat().st_size,
        'triangles':triangles,'meshes':len(meshes),'durationSeconds':2,'fps':FPS,
        'upAxis':'Y','frontAxis':'+Z','units':'meters','recommendedScale':.7,
        'textures':[],'notes':'Palette, emissive materials, geometry, morph targets and animation are embedded in the GLB.',
    }
    (OUT/'asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    render_preview(scene)
    print('GREEN_FIRE_COMPLETE', json.dumps(manifest), flush=True)


def render_preview(scene, render=True):
    scene.frame_set(9)
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = 'Standard'
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.025,.065,.048,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .5
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.05))
    bpy.context.object.data.materials.append(material('Studio floor', '#102C27'))
    target = Vector((0,0,.67))
    for loc,power,size in [((-2,-3,4),160,4),((2,-1,2),70,3)]:
        bpy.ops.object.light_add(type='AREA', location=loc)
        light = bpy.context.object
        light.data.energy, light.data.size = power,size
        light.rotation_euler = (target-light.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(1.25,-4.5,1.6))
    camera = bpy.context.object
    camera.rotation_euler = (target-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO'
    camera.data.ortho_scale=1.95
    scene.camera=camera
    scene.render.image_settings.file_format='PNG'
    scene.render.filepath=str(OUT/'previews'/'green-fire-pickup.png')
    if render:
        bpy.ops.render.render(write_still=True)


if __name__ == '__main__':
    main()
