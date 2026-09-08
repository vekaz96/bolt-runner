"""Original clock tower and modular track modeled from the Boulevard concept."""
import math
import bpy
from common import M, box, cylinder, uvball, arch, hip_roof, lightning


def make_clock_tower():
    box('Tower plinth', (0,0,.15),(2.35,2.1,.3),M['gold'],.08)
    box('Tower pedestal', (0,0,.43),(2.08,1.84,.28),M['green'])
    box('Tower shaft', (0,0,2.8),(1.65,1.5,4.55),M['green'],.07)
    for x in (-.8,.8):
        for y in (-.72,.72):
            box('Corner pier',(x,y,2.65),(.12,.12,4.3),M['dark_green'],.025)
    # Entrance and paired long arched windows on both street-facing sides.
    for side in (-1,1):
        front=side*.79
        arch('Tower arch surround',(0,front,.63),.8,1.6,.16,M['gold'])
        arch('Tower door',(0,front+side*.095,.71),.62,1.44,.07,M['glass'])
        box('Door mullion',(0,front+side*.15,1.28),(.045,.06,1.0),M['gold'],.007)
        arch('Upper window surround',(0,front,2.95),.52,1.2,.14,M['gold'])
        arch('Upper window glass',(0,front+side*.08,3.04),.35,1.03,.08,M['glass'])
    for z in (.65,2.45,4.7):
        box('Gold belt',(0,0,z),(1.98,1.83,.12),M['gold'],.025)
        box('Belt green cap',(0,0,z+.12),(1.88,1.73,.1),M['teal'],.025)
    box('Clock chamber',(0,0,5.48),(2.06,1.94,1.35),M['green'],.055)
    for x in (-1,1):
        for y in (-.95,.95):
            box('Clock chamber corner',(x,y,5.46),(.12,.12,1.42),M['gold'],.03)
    # Four real modeled clock faces; no textures or baked imagery.
    for angle in (0,math.pi/2,math.pi,3*math.pi/2):
        created=set(bpy.context.scene.objects)
        face_y=-1.02
        cylinder('Clock gold rim',(0,face_y,5.51),.61,.13,M['gold'],32,(math.pi/2,0,0))
        cylinder('Clock cream dial',(0,face_y-.08,5.51),.52,.035,M['cream'],32,(math.pi/2,0,0))
        for hour in range(12):
            a=hour*math.tau/12
            tick=box('Clock hour tick',(math.sin(a)*.44,face_y-.108,5.51+math.cos(a)*.44),(.035,.025,.09 if hour%3==0 else .055),M['dark_green'],.005)
            tick.rotation_euler.y=a
        minute=box('Minute hand',(0,face_y-.14,5.68),(.045,.035,.35),M['dark_green'],.009)
        hand=box('Hour hand',(.11,face_y-.15,5.54),(.24,.04,.065),M['dark_green'],.01)
        hand.rotation_euler.y=-.5
        uvball('Clock pin',(0,face_y-.17,5.51),(.065,.035,.065),M['gold'])
        for obj in set(bpy.context.scene.objects)-created:
            # The helper geometry is centered differently; rotate actual geometry about origin.
            from mathutils import Matrix
            obj.matrix_world=Matrix.Rotation(angle,4,'Z') @ obj.matrix_world
    box('Roof gold cornice',(0,0,6.23),(2.42,2.3,.18),M['gold'],.04)
    box('Roof green eave',(0,0,6.36),(2.32,2.2,.14),M['teal'],.035)
    hip_roof('Clock roof',(0,0,6.4),2.25,2.1,.95,M['teal'])
    # Layered roof courses echo the bevelled tile silhouette without excessive geometry.
    for i in range(1,5):
        f=i/5
        box('Roof tile course',(0,0,6.4+f*.95),(2.25*(1-.6*f),2.1*(1-.65*f),.055),M['teal_light'],.016)
    box('Roof top trim',(0,0,7.36),(1.05,.86,.13),M['gold'],.045)
    cylinder('Finial stem',(0,0,7.56),.09,.32,M['gold'])
    uvball('Finial globe',(0,0,7.73),(.16,.16,.14),M['gold'])
    lightning('Lightning tower finial',(0,0,8.22),.92,.16,M['gold'])


def make_road_section():
    # Blender Y length becomes GLTF Z length; runner rotates the GLB 90 degrees about Y.
    box('Road',(0,0,-.13),(4.4,12,.26),M['road'],0)
    for x in (-.6,.6):
        for y in (-5.25,-3.75,-2.25,-.75,.75,2.25,3.75,5.25):
            box('Lane stripe',(x,y,.004),(.045,.62,.008),M['cream'],0)
    for side in (-1,1):
        box('Sidewalk base',(side*2.97,0,-.07),(1.5,12,.24),M['sidewalk'],0)
        for y in [i*.75-5.625 for i in range(16)]:
            box('Green curb',(side*2.28,y,.06),(.16,.72,.24),M['green'],.035)
        # Sparse pavement seams remain visible without separate tile draw calls.
        for y in range(-5,6):
            box('Pavement seam',(side*2.99,y,.055),(1.25,.018,.008),M['soil'],0)


def make_lightning_pickup():
    lightning('Gold pickup',(0,0,.45),.86,.14,M['gold'])


def make_toy_crate():
    from common import extrude_xz

    box('Toy red crate',(0,0,.46),(.84,.74,.88),M['red'],.07)
    # Corner posts end inside the rims and sit slightly behind their outer faces.
    # This avoids coplanar overlap where the cream rails meet.
    for x in (-.3925,.3925):
        for y in (-.3425,.3425):
            box('Cream safety corner',(x,y,.45),(.10,.10,.62),M['cream'],.025)
    for z in (.075,.815):
        box('Crate cream rim',(0,0,z),(.92,.82,.15),M['cream'],.035)
    # A continuous extruded upward chevron has no overlapping strip faces.
    points=[(0,.68),(.30,.34),(.20,.26),(0,.48),(-.20,.26),(-.30,.34)]
    for side in (-1,1):
        extrude_xz('Hazard upward chevron',points,(0,side*.384,0),.04,M['cream'],.015)
