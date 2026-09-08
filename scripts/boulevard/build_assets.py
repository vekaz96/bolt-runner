"""Run with Blender --background --factory-startup --python this_file -- [asset-id]."""
import json
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from common import init_materials
from landmarks import make_clock_tower, make_road_section, make_lightning_pickup, make_toy_crate

ROOT = HERE.parents[1]
OUT = ROOT / 'mobile-game-assests' / 'bolt-boulevard-v1'


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for material in list(bpy.data.materials):
        if material.users == 0:
            bpy.data.materials.remove(material)
    init_materials()


def bounds(objects):
    points = [o.matrix_world @ Vector(v) for o in objects for v in o.bound_box]
    lo = Vector([min(p[i] for p in points) for i in range(3)])
    hi = Vector([max(p[i] for p in points) for i in range(3)])
    return lo, hi


def batch_materials():
    """One mesh per material for predictable runtime draw calls, preserving geometry."""
    grouped = {}
    for obj in list(bpy.context.scene.objects):
        if obj.type != 'MESH':
            continue
        mat = obj.data.materials[0]
        grouped.setdefault(mat.name, []).append(obj)
    for name, objects in grouped.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        bpy.ops.object.join()
        obj = bpy.context.object
        obj.name = name
        # Normalize winding, including custom extruded outlines.
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.normals_make_consistent(inside=False)
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.scene.cursor.location = (0,0,0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')


def render_preview(name, model_objects):
    lo, hi = bounds(model_objects)
    center = (lo+hi)/2
    size = hi-lo
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.film_transparent = False
    scene.view_settings.view_transform = 'Standard'
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.67,.76,.82,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .6
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0,0,lo.z-.025))
    ground = bpy.context.object
    mat=bpy.data.materials.new('Preview ground (not exported)')
    mat.diffuse_color=(.055,.085,.09,1)
    ground.data.materials.append(mat)
    maxsize=max(size)
    for label, loc, power, light_size in [
        ('Key',(-maxsize*1.2,-maxsize*1.5,maxsize*1.8),maxsize*maxsize*55,maxsize),
        ('Fill',(maxsize*1.3,-maxsize*.6,maxsize*.85),maxsize*maxsize*22,maxsize*.8),
        ('Rim',(0,maxsize,maxsize*1.2),maxsize*maxsize*32,maxsize*.8),
    ]:
        bpy.ops.object.light_add(type='AREA',location=loc)
        light=bpy.context.object
        light.name='Preview '+label
        light.data.energy=power
        light.data.shape='DISK'
        light.data.size=light_size
        light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=center+Vector((1.15,-1.85,.9))*maxsize)
    camera=bpy.context.object
    camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO'
    camera.data.ortho_scale=max(size.z*1.35, max(size.x,size.y)*1.55)
    camera.data.lens=50
    scene.camera=camera
    scene.render.filepath=str(OUT/'previews'/f'{name}.png')
    bpy.ops.render.render(write_still=True)


def build(name, function):
    clear_scene()
    function()
    batch_materials()
    objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
    bpy.context.view_layer.update()
    lo,hi=bounds(objects)
    triangles=0
    for obj in objects:
        obj.data.calc_loop_triangles()
        triangles+=len(obj.data.loop_triangles)
    glb=OUT/'models'/f'{name}.glb'
    bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False)
    # Editable model saved before preview-only lights, camera and ground are added.
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'source'/f'{name}.blend'))
    result={
        'id':name,'model':f'models/{name}.glb','source':f'source/{name}.blend',
        'preview':f'previews/{name}.png','bytes':glb.stat().st_size,'triangles':triangles,
        'meshCount':len(objects),'materials':sorted({m.name for o in objects for m in o.data.materials}),
        'gltfBounds':{'min':[lo.x,lo.z,-hi.y],'max':[hi.x,hi.z,-lo.y]},
        'upAxis':'Y','frontAxis':'+Z','units':'meters',
    }
    render_preview(name,objects)
    return result


def main():
    builders={
        'clock-tower':make_clock_tower,
        'road-section':make_road_section,
        'lightning-pickup':make_lightning_pickup,
        'toy-crate':make_toy_crate,
    }
    try:
        from buildings import make_house_yellow, make_shop_coral, make_house_mint
        builders.update({'house-yellow':make_house_yellow,'shop-coral':make_shop_coral,'house-mint':make_house_mint})
    except ImportError:
        pass
    try:
        from streetprops import make_tree_round,make_planter,make_fence,make_banner,make_bench
        builders.update({'tree-round':make_tree_round,'planter':make_planter,'fence':make_fence,'banner':make_banner,'bench':make_bench})
    except ImportError:
        pass
    names=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else list(builders)
    for folder in ('models','source','previews'):
        (OUT/folder).mkdir(parents=True,exist_ok=True)
    path=OUT/'asset-manifest.json'
    previous=json.loads(path.read_text()) if path.exists() else {'generator':'Blender procedural modeling','assets':[]}
    records={a['id']:a for a in previous['assets']}
    for name in names:
        if name not in builders:
            raise ValueError('Unknown asset '+name)
        records[name]=build(name,builders[name])
        previous['assets']=list(records.values())
        path.write_text(json.dumps(previous,indent=2)+'\n')
        print('ASSET_COMPLETE',name,records[name]['triangles'],records[name]['bytes'],flush=True)


if __name__=='__main__':
    main()
