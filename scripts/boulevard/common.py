"""Shared original toy-model primitives. Blender Z-up; facade faces -Y."""
import math
import bpy


PALETTE = {
    'gold': '#E7AC32', 'cream': '#FFF1CE', 'green': '#34895D',
    'dark_green': '#185849', 'teal': '#207B7D', 'teal_light': '#3D9690',
    'glass': '#245764', 'yellow': '#E9BC62', 'coral': '#DC815F',
    'mint': '#A6C6A0', 'bark': '#8D6338', 'leaf': '#629B32',
    'leaf_light': '#91B744', 'road': '#596D80', 'sidewalk': '#D6C5A1',
    'red': '#CF553A', 'soil': '#695238',
}
M = {}


def srgb(v):
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def init_materials():
    M.clear()
    for name, color in PALETTE.items():
        mat = bpy.data.materials.new('Boulevard_' + name)
        mat.use_nodes = True
        rgb = tuple(srgb(int(color[i:i+2], 16) / 255) for i in (1, 3, 5))
        mat.diffuse_color = (*rgb, 1)
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = (*rgb, 1)
        bsdf.inputs['Roughness'].default_value = .38 if name == 'gold' else .7
        bsdf.inputs['Metallic'].default_value = .25 if name == 'gold' else 0
        M[name] = mat


def finish(obj, name, material, bevel=0):
    obj.name = name
    obj.data.materials.append(material)
    if bevel:
        mod = obj.modifiers.new('Toy edge bevel', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
        mod.affect = 'EDGES'
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
        weighted = obj.modifiers.new('Weighted face normals', 'WEIGHTED_NORMAL')
        weighted.keep_sharp = True
        bpy.ops.object.modifier_apply(modifier=weighted.name)
    return obj


def box(name, location, dimensions, material, bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, material, min(bevel, min(dimensions) * .24))


def uvball(name, location, scale, material, segments=12, rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=1, location=location)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for p in obj.data.polygons:
        p.use_smooth = True
    return finish(obj, name, material)


def cylinder(name, location, radius, depth, material, vertices=16, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    if rotation is not None:
        obj.rotation_euler = rotation
    return finish(obj, name, material, min(.025, radius * .15, depth * .2))


def mesh(name, vertices, faces, material, bevel=0):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    return finish(obj, name, material, bevel)


def extrude_xz(name, points, center, depth, material, bevel=0):
    cx, cy, cz = center
    verts = [(cx+x, cy-depth/2, cz+z) for x,z in points]
    verts += [(cx+x, cy+depth/2, cz+z) for x,z in points]
    n = len(points)
    faces = [tuple(range(n-1, -1, -1)), tuple(range(n, 2*n))]
    faces += [(i, (i+1)%n, (i+1)%n+n, i+n) for i in range(n)]
    return mesh(name, verts, faces, material, bevel)


def arch(name, center, width, height, depth, material):
    radius = width / 2
    shoulder = height-radius
    points = [(-radius, 0), (radius, 0), (radius, shoulder)]
    points += [(math.cos(i*math.pi/12)*radius, shoulder+math.sin(i*math.pi/12)*radius) for i in range(1, 13)]
    return extrude_xz(name, points, center, depth, material, .015)


def hip_roof(name, center, width, depth, height, material):
    x,y,z = center
    points = [(x+sx*width/2,y+sy*depth/2,z) for sx,sy in [(-1,-1),(1,-1),(1,1),(-1,1)]]
    points += [(x+sx*width*.2,y+sy*depth*.175,z+height) for sx,sy in [(-1,-1),(1,-1),(1,1),(-1,1)]]
    return mesh(name, points, [(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],material,.035)


def lightning(name, center, height, depth, material):
    points = [(.12,.5),(-.32,-.06),(-.04,-.06),(-.13,-.5),(.34,.13),(.04,.13)]
    return extrude_xz(name, [(x*height,z*height) for x,z in points], center,depth,material,.025)
