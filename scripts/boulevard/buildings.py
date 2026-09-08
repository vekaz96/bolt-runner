"""Rounded, reusable Bolt Boulevard houses. Front is -Y, ground is Z=0."""

import math

import bpy
from mathutils import Matrix, Vector

from common import M, arch, box, cylinder, hip_roof, mesh, uvball


def _window(name, x, y, bottom, width=0.76, height=1.10,
            frame="gold", sill="gold"):
    """Layered arches retain a deep, readable frame at mobile-game scale."""
    arch(name + "_outer_arch", (x, y, bottom), width, height, 0.13, M[frame])
    arch(name + "_glass", (x, y - 0.077, bottom + 0.075),
         width - 0.17, height - 0.16, 0.055, M["glass"])
    box(name + "_center_mullion", (x, y - 0.115, bottom + height / 2),
        (0.045, 0.05, height - 0.18), M[frame], bevel=0.016)
    box(name + "_cross_mullion", (x, y - 0.12, bottom + height * 0.43),
        (width - 0.15, 0.055, 0.048), M[frame], bevel=0.013)
    box(name + "_deep_sill", (x, y - 0.045, bottom + 0.005),
        (width + 0.15, 0.26, 0.15), M[sill], bevel=0.035)


def _side_window(name, side_x, y, bottom, width=0.76, height=1.10,
                 frame="gold", sill="gold"):
    previous = set(bpy.data.objects)
    _window(name, 0, 0, bottom, width, height, frame, sill)
    angle = math.pi / 2 if side_x > 0 else -math.pi / 2
    transform = Matrix.Translation((side_x, y, 0)) @ Matrix.Rotation(angle, 4, "Z")
    for obj in set(bpy.data.objects) - previous:
        obj.matrix_world = transform @ obj.matrix_world


def _door(name, x, y, bottom=0.13, width=0.9, height=1.68,
          frame="gold", door="dark_green"):
    arch(name + "_arched_surround", (x, y, bottom), width + 0.14,
         height + 0.07, 0.18, M[frame])
    arch(name + "_door_leaf", (x, y - 0.105, bottom + 0.035),
         width - 0.05, height - 0.045, 0.055, M[door])
    arch(name + "_upper_glass", (x, y - 0.141, bottom + 0.70),
         width - 0.31, height - 0.87, 0.03, M["glass"])
    box(name + "_glass_mullion", (x, y - 0.164, bottom + 1.04),
        (0.045, 0.032, height - 0.99), M[frame], bevel=0.012)
    box(name + "_bottom_panel", (x, y - 0.15, bottom + 0.36),
        (width - 0.25, 0.06, 0.42), M["green"], bevel=0.06)
    uvball(name + "_brass_knob", (x + width * 0.30, y - 0.215, bottom + 0.76),
           (0.048, 0.055, 0.048), M["gold"], segments=12, rings=6)
    box(name + "_doorstep", (x, y - 0.14, 0.075),
        (width + 0.29, 0.48, 0.15), M["cream"], bevel=0.045)


def _chamfered_prism(name, quad, normal, material):
    """A single lightly chamfered shingle: 28 triangles, no modifiers."""
    points = [Vector(p) for p in quad]
    clipped = []
    for index, point in enumerate(points):
        clipped.append(point.lerp(points[index - 1], 0.075))
        clipped.append(point.lerp(points[(index + 1) % 4], 0.075))
    normal = Vector(normal)
    lower = [p + normal * 0.012 for p in clipped]
    upper = [p + normal * 0.052 for p in clipped]
    vertices = [tuple(v) for v in lower + upper]
    faces = [tuple(reversed(range(8))), tuple(range(8, 16))]
    faces.extend((i, (i + 1) % 8, (i + 1) % 8 + 8, i + 8)
                 for i in range(8))
    mesh(name, vertices, faces, material)


def _roof(name, base=3.71, width=3.62, depth=3.04, height=1.05,
          shingle="teal", alternate="teal_light"):
    hip_roof(name + "_roof_underlay", (0, 0, base), width, depth, height,
             M["dark_green"])
    half_width, half_depth = width / 2, depth / 2
    top_width, top_depth = half_width * 0.40, half_depth * 0.35
    rows = 5
    # All four trapezoid slopes receive staggered individual shingle courses.
    for side in range(4):
        front_back = side < 2
        sign = -1 if side in (0, 2) else 1
        bottom_span = half_width if front_back else half_depth
        top_span = top_width if front_back else top_depth
        bottom_run = half_depth if front_back else half_width
        top_run = top_depth if front_back else top_width
        run = bottom_run - top_run
        slope_normal = Vector((0, sign * height, run) if front_back
                              else (sign * height, 0, run)).normalized()
        for row in range(rows):
            t0 = row / rows + 0.008
            t1 = (row + 1) / rows - 0.008
            span0 = bottom_span + (top_span - bottom_span) * t0
            span1 = bottom_span + (top_span - bottom_span) * t1
            run0 = bottom_run + (top_run - bottom_run) * t0
            run1 = bottom_run + (top_run - bottom_run) * t1
            columns = max(3, round((span0 + span1) / 0.47))
            boundaries = [0.0]
            offset = 0.5 if row % 2 else 0.0
            boundaries.extend((i + offset) / columns for i in range(1 if not offset else 0, columns)
                              if 0 < (i + offset) / columns < 1)
            boundaries.append(1.0)
            for tile, (left, right) in enumerate(zip(boundaries, boundaries[1:])):
                left += 0.010 / columns
                right -= 0.010 / columns
                a0, b0 = -span0 + 2 * span0 * left, -span0 + 2 * span0 * right
                a1, b1 = -span1 + 2 * span1 * left, -span1 + 2 * span1 * right
                z0, z1 = base + height * t0, base + height * t1
                if front_back:
                    quad = [(a0, sign * run0, z0), (b0, sign * run0, z0),
                            (b1, sign * run1, z1), (a1, sign * run1, z1)]
                else:
                    quad = [(sign * run0, a0, z0), (sign * run0, b0, z0),
                            (sign * run1, b1, z1), (sign * run1, a1, z1)]
                material = alternate if (row + tile * 3 + side) % 7 == 0 else shingle
                _chamfered_prism(name + "_shingle_%d_%d_%d" % (side, row, tile),
                                quad, slope_normal, M[material])
    box(name + "_round_eave", (0, 0, base - 0.035),
        (width + 0.12, depth + 0.12, 0.23), M["green"], bevel=0.075)
    box(name + "_flat_ridge_cap", (0, 0, base + height + 0.04),
        (top_width * 2 + 0.10, top_depth * 2 + 0.10, 0.12), M[shingle], bevel=0.047)
    # Rounded hip caps keep the silhouette soft and conceal the tile joins.
    for sx in (-1, 1):
        for sy in (-1, 1):
            start = Vector((sx * half_width, sy * half_depth, base + 0.025))
            end = Vector((sx * top_width, sy * top_depth, base + height + 0.045))
            direction = end - start
            cylinder(name + "_hip_cap_%d_%d" % (sx, sy), tuple((start + end) / 2),
                     0.055, direction.length, M[shingle], vertices=10,
                     rotation=direction.to_track_quat("Z", "Y").to_euler())


def _scallop(name, x, y, top, width, material):
    radius = width / 2
    center_z = top - 0.10
    outline = [(x - radius, top), (x + radius, top)]
    outline.extend((x + math.cos(-math.pi * i / 8) * radius,
                    center_z + math.sin(-math.pi * i / 8) * radius)
                   for i in range(9))
    count = len(outline)
    verts = [(px, y - 0.037, pz) for px, pz in outline]
    verts.extend((px, y + 0.037, pz) for px, pz in outline)
    faces = [tuple(reversed(range(count))), tuple(range(count, count * 2))]
    faces.extend((i, (i + 1) % count, (i + 1) % count + count, i + count)
                 for i in range(count))
    mesh(name, verts, faces, material, bevel=0.01)


def _awning(name, x, y=-1.39, width=1.78, top=2.07,
            projection=0.62, drop=0.40, color="gold", stripes=9):
    stripe_width = width / stripes
    for index in range(stripes):
        left = x - width / 2 + stripe_width * index
        right = left + stripe_width
        front = y - projection
        material = M[color] if index % 2 == 0 else M["cream"]
        vertices = [(left, y, top), (right, y, top),
                    (right, front, top - drop), (left, front, top - drop),
                    (left, y, top - 0.055), (right, y, top - 0.055),
                    (right, front, top - drop - 0.055), (left, front, top - drop - 0.055)]
        faces = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1),
                 (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
        mesh(name + "_stripe_%02d" % index, vertices, faces, material, bevel=0.012)
        _scallop(name + "_scallop_%02d" % index, (left + right) / 2,
                 front, top - drop, stripe_width - 0.008, material)
    box(name + "_mounting_rail", (x, y + 0.025, top - 0.02),
        (width + 0.10, 0.15, 0.12), M["gold"], bevel=0.028)


def _shell(name, wall="yellow", trim="gold", belt="green", height=3.72):
    box(name + "_wall_body", (0, 0, height / 2),
        (3.20, 2.60, height), M[wall], bevel=0.09)
    box(name + "_foundation", (0, 0, 0.125),
        (3.36, 2.76, 0.25), M["cream"], bevel=0.055)
    # Long pilasters meet the string course and roof cornice in rounded corners.
    for x in (-1.48, 1.48):
        for y in (-1.25, 1.25):
            box(name + "_pilaster_%s_%s" % (x, y), (x, y, height / 2 + 0.045),
                (0.23, 0.23, height - 0.15), M[trim], bevel=0.045)
            box(name + "_column_foot_%s_%s" % (x, y), (x, y, 0.23),
                (0.31, 0.31, 0.29), M[trim], bevel=0.035)
    box(name + "_storey_belt", (0, 0, 2.01),
        (3.41, 2.80, 0.24), M[belt], bevel=0.045)
    box(name + "_roof_cornice", (0, 0, height - 0.095),
        (3.43, 2.82, 0.20), M[trim], bevel=0.048)
    # Rear detail makes every asset usable on either side of the street.
    previous = set(bpy.data.objects)
    for x in (-0.77, 0.77):
        _window(name + "_rear_upper_%s" % x, x, -1.325, 2.32, 0.70, 1.0,
                "green", "green")
    for obj in set(bpy.data.objects) - previous:
        obj.matrix_world = Matrix.Rotation(math.pi, 4, "Z") @ obj.matrix_world


def _chimney(name, x=0.86, y=0.50, roof_base=3.71, roof_height=1.05,
             color="yellow"):
    box(name + "_chimney_shaft", (x, y, roof_base + roof_height - 0.05),
        (0.33, 0.39, 0.64), M[color], bevel=0.04)
    box(name + "_chimney_cap", (x, y, roof_base + roof_height + 0.29),
        (0.43, 0.48, 0.14), M["gold"], bevel=0.055)
    box(name + "_chimney_dark_opening", (x, y, roof_base + roof_height + 0.365),
        (0.22, 0.26, 0.015), M["dark_green"], bevel=0.025)


def make_house_yellow():
    """Sunny townhouse with green window frames and a striped entrance canopy."""
    name = "YellowHouse"
    _shell(name, "yellow", "gold")
    for x in (-0.76, 0.76):
        _window(name + "_front_upper_%s" % x, x, -1.326, 2.29,
                0.78, 1.14, "green", "green")
    _door(name + "_front_door", -0.70, -1.35, width=0.82, height=1.66,
          frame="gold")
    _window(name + "_front_lower", 0.73, -1.33, 0.42, 0.75, 1.22,
            "green", "green")
    _awning(name + "_door_canopy", -0.70, width=1.44, top=2.075,
            projection=0.49, drop=0.28, color="coral", stripes=7)
    for side in (-1, 1):
        for y in (-0.63, 0.65):
            _side_window(name + "_side_upper_%s_%s" % (side, y), side * 1.625,
                         y, 2.30, 0.70, 1.09, "green", "green")
        _side_window(name + "_side_lower_%s" % side, side * 1.625,
                     0.30, 0.55, 0.84, 1.18, "green", "green")
    _roof(name)
    _chimney(name, color="yellow")


def make_shop_coral():
    """Coral corner shop with gold arches and a wide gold-and-cream awning."""
    name = "CoralShop"
    _shell(name, "coral", "coral")
    box(name + "_gold_cornice", (0, 0, 3.585),
        (3.44, 2.85, 0.18), M["gold"], bevel=0.04)
    for x in (-0.77, 0.77):
        _window(name + "_front_upper_%s" % x, x, -1.33, 2.30,
                0.82, 1.12, "gold", "gold")
    _door(name + "_shop_door", 0.79, -1.36, width=0.81, height=1.66,
          frame="gold", door="green")
    _window(name + "_display", -0.66, -1.34, 0.36, 1.10, 1.33,
            "gold", "gold")
    _awning(name + "_shop_awning", 0, width=3.01, top=2.075,
            projection=0.76, drop=0.43, color="gold", stripes=13)
    for side in (-1, 1):
        for y in (-0.66, 0.65):
            _side_window(name + "_side_upper_%s_%s" % (side, y), side * 1.627,
                         y, 2.31, 0.72, 1.11, "gold", "gold")
        _side_window(name + "_side_display_%s" % side, side * 1.627,
                     0.17, 0.35, 1.06, 1.36, "gold", "gold")
    _roof(name, height=1.12)
    _chimney(name, x=-0.91, y=0.57, roof_height=1.12, color="coral")


def make_house_mint():
    """Mint townhouse with twin gold arch windows and a broad entry surround."""
    name = "MintHouse"
    _shell(name, "mint", "green")
    for x in (-0.77, 0.77):
        _window(name + "_front_upper_%s" % x, x, -1.33, 2.30,
                0.78, 1.12, "gold", "gold")
    _door(name + "_entry", 0, -1.35, width=0.92, height=1.72,
          frame="gold", door="green")
    for x in (-1.05, 1.05):
        _window(name + "_entry_sidelight_%s" % x, x, -1.33, 0.59,
                0.44, 1.01, "green", "gold")
    box(name + "_entry_canopy", (0, -1.51, 1.88),
        (1.28, 0.54, 0.15), M["green"], bevel=0.065)
    box(name + "_entry_canopy_gold_edge", (0, -1.76, 1.87),
        (1.28, 0.065, 0.11), M["gold"], bevel=0.025)
    for side in (-1, 1):
        for y in (-0.65, 0.66):
            _side_window(name + "_side_upper_%s_%s" % (side, y), side * 1.627,
                         y, 2.30, 0.72, 1.12, "gold", "gold")
        _side_window(name + "_side_lower_%s" % side, side * 1.627,
                     0.28, 0.43, 0.86, 1.24, "gold", "gold")
    _roof(name, height=0.98)
    _chimney(name, x=0.83, y=0.62, roof_height=0.98, color="mint")
