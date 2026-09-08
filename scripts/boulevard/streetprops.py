"""Toy-like street furniture for Bolt Boulevard; Blender Z up, front -Y."""

from math import cos, sin, pi, sqrt

from common import box, uvball, cylinder, mesh, lightning, M


def _outline(name, points, y, depth, material, bevel=0.015):
    """Extrude an X/Z outline, keeping its decorative face toward -Y."""
    count = len(points)
    vertices = [(x, y - depth / 2, z) for x, z in points]
    vertices += [(x, y + depth / 2, z) for x, z in points]
    faces = [tuple(range(count)), tuple(reversed(range(count, count * 2)))]
    faces += [(i + count, (i + 1) % count + count, (i + 1) % count, i)
              for i in range(count)]
    return mesh(name, vertices, faces, material, bevel=bevel)


def _branch(name, start, end, radius0, radius1, material, sides=9):
    """A low-poly tapered cylinder between arbitrary points."""
    direction = [end[i] - start[i] for i in range(3)]
    length = sqrt(sum(v * v for v in direction))
    axis = [v / length for v in direction]
    helper = (1, 0, 0) if abs(axis[0]) < 0.8 else (0, 1, 0)
    u = (axis[1] * helper[2] - axis[2] * helper[1],
         axis[2] * helper[0] - axis[0] * helper[2],
         axis[0] * helper[1] - axis[1] * helper[0])
    norm = sqrt(sum(v * v for v in u))
    u = [v / norm for v in u]
    v = (axis[1] * u[2] - axis[2] * u[1],
         axis[2] * u[0] - axis[0] * u[2],
         axis[0] * u[1] - axis[1] * u[0])
    vertices = []
    for center, radius in ((start, radius0), (end, radius1)):
        for index in range(sides):
            angle = index * 2 * pi / sides
            vertices.append(tuple(center[j] + radius * (u[j] * cos(angle) + v[j] * sin(angle))
                                  for j in range(3)))
    faces = [tuple(reversed(range(sides))), tuple(range(sides, sides * 2))]
    faces += [(i, (i + 1) % sides, (i + 1) % sides + sides, i + sides)
              for i in range(sides)]
    return mesh(name, vertices, faces, material)


def make_tree_round():
    """Broad 3.2 m rounded canopy with a clearly visible branching trunk."""
    uvball("tree_grass_foot", (0, 0, 0.055), (0.49, 0.40, 0.055), M["dark_green"], 12, 5)
    _branch("tree_trunk_lower", (0, 0, 0.02), (-0.055, 0.025, 1.12), 0.19, 0.135, M["bark"], 10)
    _branch("tree_trunk_upper", (-0.055, 0.025, 1.08), (0.04, 0.045, 2.34), 0.135, 0.06, M["bark"], 10)
    # Low roots ground the otherwise airy, umbrella-shaped crown.
    for i, angle in enumerate((0.15, 2.05, 3.62, 5.12)):
        _branch("tree_root_%02d" % i, (0, 0, 0.22),
                (cos(angle) * 0.37, sin(angle) * 0.30, 0.07),
                0.12, 0.035, M["bark"], 7)
    branches = [((-0.02, 0.02, 1.10), (-0.61, 0.025, 2.04)),
                ((-0.01, 0.05, 1.30), (0.63, 0.09, 2.09)),
                ((0.00, 0.03, 1.51), (-0.30, 0.49, 2.35)),
                ((0.02, 0.03, 1.64), (0.28, -0.32, 2.44))]
    for i, (start, end) in enumerate(branches):
        _branch("tree_branch_%02d" % i, start, end, 0.095, 0.035, M["bark"], 8)
    clusters = [((-0.56, 0.07, 2.03), (0.56, 0.53, 0.39), "leaf"),
                ((0.50, 0.12, 2.08), (0.61, 0.53, 0.44), "leaf"),
                ((-0.06, 0.38, 2.31), (0.68, 0.52, 0.51), "leaf"),
                ((-0.43, -0.30, 2.39), (0.60, 0.54, 0.44), "leaf"),
                ((0.44, -0.27, 2.42), (0.60, 0.51, 0.48), "leaf"),
                ((0.01, 0.015, 2.66), (0.91, 0.71, 0.54), "leaf_light")]
    for i, (location, scale, mat) in enumerate(clusters):
        uvball("tree_canopy_%02d" % i, location, scale, M[mat], 14, 8)
    # Shallow overlapping leaf pads make the crown read as foliage, not balloons.
    pads = [(-0.49, -0.43, 2.78, 0.30, 0.25, 0.14),
            (-0.09, -0.56, 2.81, 0.31, 0.20, 0.14),
            (0.37, -0.45, 2.87, 0.29, 0.23, 0.13),
            (-0.23, -0.30, 3.075, 0.33, 0.25, 0.095),
            (0.26, -0.22, 3.09, 0.30, 0.25, 0.085),
            (-0.67, -0.30, 2.23, 0.25, 0.27, 0.14),
            (0.55, -0.43, 2.27, 0.28, 0.24, 0.14),
            (0.52, 0.40, 2.83, 0.30, 0.23, 0.15)]
    for i, (x, y, z, sx, sy, sz) in enumerate(pads):
        uvball("tree_leaf_pad_%02d" % i, (x, y, z), (sx, sy, sz), M["leaf_light"], 10, 5)


def make_planter():
    """Low golden masonry planter, 1.2 m across, with six toy flowers."""
    box("planter_foot", (0, 0, 0.055), (1.20, 0.94, 0.11), M["gold"], bevel=0.03)
    box("planter_soil", (0, 0, 0.245), (1.07, 0.81, 0.34), M["soil"], bevel=0.025)
    # Separate masonry pieces leave useful shadows along the block joints.
    for side in (-1, 1):
        for i, x in enumerate((-0.448, -0.15, 0.15, 0.448)):
            box("planter_long_block_%s_%s" % (side, i), (x, side * 0.403, 0.215),
                (0.29, 0.134, 0.245), M["gold"], bevel=0.018)
        for i, y in enumerate((-0.246, 0.0, 0.246)):
            box("planter_end_block_%s_%s" % (side, i), (side * 0.535, y, 0.215),
                (0.13, 0.237, 0.245), M["gold"], bevel=0.018)
        box("planter_long_rim_%s" % side, (0, side * 0.400, 0.356),
            (1.20, 0.15, 0.075), M["gold"], bevel=0.022)
        box("planter_short_rim_%s" % side, (side * 0.525, 0, 0.356),
            (0.15, 0.70, 0.075), M["gold"], bevel=0.022)
    mounds = [(-0.32, -0.16, 0.42, .24, .21, .18),
              (0.03, -0.12, .44, .27, .23, .19),
              (.34, -.15, .41, .22, .22, .16),
              (-.28, .17, .45, .26, .20, .20),
              (.14, .15, .43, .30, .22, .18)]
    for i, (x, y, z, sx, sy, sz) in enumerate(mounds):
        uvball("planter_foliage_%02d" % i, (x, y, z), (sx, sy, sz),
               M["leaf" if i % 2 else "leaf_light"], 12, 6)
    flower_positions = [(-.37, -.20, .58), (-.12, -.27, .56), (.28, -.21, .58),
                        (-.22, .12, .66), (.12, .14, .62), (.39, .11, .55)]
    for i, (x, y, z) in enumerate(flower_positions):
        _branch("planter_flower_stem_%02d" % i, (x, y, .40), (x, y, z),
                .012, .009, M["leaf"], 6)
        for p in range(5):
            angle = p * 2 * pi / 5 + i * .2
            uvball("planter_flower_%02d_petal_%d" % (i, p),
                   (x + .047 * cos(angle), y + .036 * sin(angle), z),
                   (.040, .035, .019), M["coral" if i % 2 else "yellow"], 8, 4)
        uvball("planter_flower_%02d_center" % i, (x, y, z + .015),
               (.025, .025, .019), M["yellow"], 8, 4)


def make_fence():
    """Cream picket fence with a golden foundation, approximately 2 m wide."""
    box("fence_foundation", (0, 0.02, 0.065), (2.04, .34, .13), M["gold"], bevel=.035)
    for z in (.35, .70):
        box("fence_cross_rail_%s" % z, (0, .072, z), (1.93, .13, .105), M["cream"], bevel=.018)
    for i in range(7):
        x = (i - 3) * .286
        h = 1.04 if i in (0, 6) else .97
        halfwidth = .094 if i in (0, 6) else .080
        shape = [(x - halfwidth, .11), (x + halfwidth, .11),
                 (x + halfwidth, h - .105), (x, h), (x - halfwidth, h - .105)]
        _outline("fence_picket_%02d" % i, shape, -.025, .14, M["cream"], bevel=.018)
        for z in (.35, .70):
            uvball("fence_peg_%02d_%s" % (i, z), (x, -.098, z), (.016, .007, .016), M["gold"], 8, 4)


def make_banner():
    """Emerald 2.7 m banner post with a gold-rimmed lightning pennant."""
    pole_x = -.47
    box("banner_base_plinth", (pole_x, .035, .055), (.44, .43, .11), M["gold"], bevel=.035)
    box("banner_base_green_step", (pole_x, .035, .145), (.32, .31, .11), M["green"], bevel=.025)
    _branch("banner_tapered_foot", (pole_x, .035, .18), (pole_x, .035, .43),
            .139, .081, M["green"], 8)
    cylinder("banner_gold_foot_collar", (pole_x, .035, .415), .10, .085, M["gold"], 12)
    cylinder("banner_post", (pole_x, .035, 1.49), .044, 2.10, M["green"], 12)
    for z in (.49, 2.34, 2.48):
        cylinder("banner_post_collar_%s" % z, (pole_x, .035, z), .064, .07, M["gold"], 12)
    cylinder("banner_crossbar", (.015, .035, 2.33), .041, .97, M["green"], 12,
             rotation=(0, pi / 2, 0))
    uvball("banner_crossbar_end", (.50, .035, 2.33), (.054, .054, .054), M["gold"], 10, 6)
    cylinder("banner_finial_stem", (pole_x, .035, 2.575), .04, .13, M["gold"], 12)
    uvball("banner_finial", (pole_x, .035, 2.60), (.095, .095, .10), M["gold"], 12, 8)
    outer = [(-.397, 2.26), (.43, 2.26), (.43, 1.40), (.017, 1.09), (-.397, 1.40)]
    inner = [(-.346, 2.207), (.379, 2.207), (.379, 1.425), (.017, 1.155), (-.346, 1.425)]
    _outline("banner_golden_border", outer, .002, .07, M["gold"], bevel=.022)
    _outline("banner_emerald_panel", inner, -.041, .024, M["green"], bevel=.012)
    # Twin attachment tabs make the hanging construction legible in silhouette.
    for x in (-.27, .30):
        box("banner_hanger_%s" % x, (x, .015, 2.29), (.075, .075, .105), M["gold"], bevel=.015)
    lightning("banner_lightning", (.017, -.086, 1.775), .67, .045, M["yellow"])


def make_bench():
    """Emerald slatted park bench with gold frame and round fasteners."""
    # Four tapered feet support the two longitudinal side frames.
    for side in (-1, 1):
        x = side * .59
        for row in (-1, 1):
            _branch("bench_leg_%s_%s" % (side, row), (x + side * .025, row * .24, .025),
                    (x, row * .205, .445), .052, .036, M["gold"], 8)
            box("bench_foot_%s_%s" % (side, row), (x + side * .025, row * .24, .027),
                (.14, .125, .054), M["gold"], bevel=.020)
        box("bench_seat_support_%s" % side, (x, 0, .421), (.083, .62, .071), M["gold"], bevel=.018)
        _branch("bench_back_upright_%s" % side, (x, .215, .42), (x, .315, .98),
                .035, .029, M["gold"], 8)
        _branch("bench_arm_front_support_%s" % side, (x, -.20, .445), (x, -.20, .70),
                .029, .025, M["gold"], 8)
        box("bench_armrest_%s" % side, (x, .007, .71), (.13, .61, .064), M["green"], bevel=.026)
    for i in range(4):
        box("bench_seat_slat_%02d" % i, (0, -.2175 + i * .145, .477),
            (1.53, .125, .078), M["green"], bevel=.020)
    for i in range(3):
        z = .675 + i * .139
        y = .225 + (z - .42) * .18
        box("bench_back_slat_%02d" % i, (0, y, z), (1.53, .071, .115), M["green"], bevel=.021)
        for x in (-.59, .59):
            uvball("bench_back_bolt_%02d_%s" % (i, x), (x, y - .038, z),
                   (.016, .008, .016), M["gold"], 8, 4)
    cylinder("bench_lower_crossbrace", (0, .19, .22), .026, 1.22, M["gold"], 10,
             rotation=(0, pi / 2, 0))
