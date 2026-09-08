# Bolt Runner: Toy City world plan

## Capability and scope

Yes: I can generate concept images and then build a playable Three.js environment using those images as the visual reference. I can create procedural meshes, assemble existing GLB props, implement materials/lighting, and integrate the world into the current runner. A concept image is not a complete 3D model: unseen sides, dimensions, topology, colliders, and mobile performance must be authored and tested. Matching a picture exactly from every camera angle is not something a single image establishes.

This document plans the running environment. It does not introduce a level-selection map, open-world exploration, new purchases, new character abilities, or new controls. No map implementation or concept generation has been performed as part of this planning step.

## Creative direction: Bolt's Toy City

A cheerful miniature city built from rounded toy blocks. Green trim and gold lightning emblems connect it to the new UI, with blue sky, warm-colored buildings, and a calm neutral running surface. Bolt and the collectible lightning remain the brightest visual focus. Avoid coating the entire environment in reflective gold: the UI can be glossy while the world is softer and easier to read.

The player should recognize where they are from one landmark and a change in scenery, without needing a text label. Scenery sits outside the playable lanes. Do not use hazard models as harmless decorations close to the running path.

| District | What the player sees | Signature landmark | Gameplay role |
| --- | --- | --- | --- |
| Bolt Boulevard | Rounded houses, colorful shops, low garden fences, striped awnings, gold lightning banners | A green-and-gold neighborhood clock tower beside the route | Calm opening with clear sightlines and familiar existing obstacle vocabulary |
| Spark Park | Broad trees, flower beds, toy windmills, pond scenery, picnic areas | A large lightning sculpture across the pond | Visual breathing room; current lane switches and jumps continue on a level path |
| Power Plaza | Friendly workshops, chunky pipes outside the path, small turbines, colorful energy cells behind fences | A softly glowing energy tower | A stronger visual finale before the endless route returns to Boulevard; no new mechanic required |

Use a planted avenue between Boulevard and Park, and a landscaped plaza between Park and Power Plaza. Landmark placements stay off the road. Any decorative gate spanning the route must have enough visual clearance and must not resemble a jump/duck obstacle. Avoid tunnels until visibility and lighting transitions are tested.

## Route and fairness

- Retain the existing three-lane runner. All districts use the same flat collision surface and lane positions in the first release.
- Use a handcrafted opening sequence, followed by compatible reusable sections. Let scenery variation supply novelty before adding more hazard types.
- Choose district changes from actual traveled world distance, not score: score is affected by difficulty and collectibles. Pause freezes progress.
- Target roughly 30–45 seconds per district at the initial Easy pace as a design starting point; tune distances after playtesting. Higher speeds naturally reach district changes sooner.
- District changes do not automatically raise difficulty. Keep the current Easy/Medium/Hard tuning as the sole source of speed and obstacle difficulty in the first pass.
- Keep existing obstacle generation during the scenery prototype. If introducing authored hazard patterns later, integrate them as the sole spawn scheduler and validate reachable safe routes across successive patterns, including at maximum speed.
- Never place collectibles behind an unavoidable collision or imply that a route is safe solely through a pickup trail. Keep an unobstructed preview area at every section boundary.
- Start with straight playable sections. Curves, slopes, bridges with fall hazards, and branching routes require coordinated camera, collision, and movement work and are later features.

## First deliverable: one playable section

Build a short Bolt Boulevard prototype before building all three districts:

1. One neutral three-lane road module with green curb accents and a continuous walk surface.
2. Two house shapes and one shop variation, reusing current GLB props where their style fits.
3. A few trees, planters, fences, and banners outside the lanes.
4. One original procedural clock-tower landmark with a gold lightning badge.
5. Existing Bolt, pickups, obstacles, and gameplay camera for an honest in-game comparison.

Judge the prototype from the portrait gameplay camera, not only from an attractive overhead view. Confirm that landmarks actually enter the narrow field of view, trees do not hide approaching hazards, and the colors support readable movement.

## Visual approval package

Generate separate reference images when the user requests the visual stage:

1. **Portrait gameplay concept** for Bolt Boulevard: main approval image, matching the real elevated trailing camera and three-lane layout.
2. **Isometric layout concept**: explains the road, shoulders, repeated sections, and landmark placement; design reference only, not a promised gameplay camera.
3. **Modular asset reference**: separate views of the proposed road, clock tower, house, shop, tree, and banner for modeling. Existing hero art should be supplied as identity reference if Bolt appears in the concept.

Approve the prototype district first. Generate Park and Power Plaza references after the 3D prototype confirms a style that works on-device. Keep model detail in the references achievable with low-complexity geometry and modest textures.

### Draft prompt for the first concept image

Create a portrait gameplay environment concept for Bolt Runner, a friendly three-lane mobile endless runner for a broad family audience. Show Bolt Boulevard, a sunny miniature toy-city neighborhood, from an elevated camera just behind the runner looking forward along a straight, level road. The road has exactly three clearly readable lanes. Keep the foreground path open and give distant obstacles generous visual separation. Rounded toy houses and small shops line the shoulders, with green trim, warm yellow and coral walls, teal roofs, a few broad trees, low fences, and gold lightning banners. Place one green-and-gold clock tower beside the road as the district landmark, visible ahead without blocking the route. Use soft matte toy materials, restrained glossy gold accents, blue sky, and simple fluffy clouds. Keep lane and hazard contrast clear at phone size. The design should be feasible as a lightweight real-time 3D game environment. No UI, no text labels, no giant structures covering the running lanes, no realistic traffic, no road turns, no terrain gaps, no intricate photorealistic detail. Treat this as an art-direction concept, not a screenshot of an already implemented game. If a supplied Bolt character reference is included, preserve that character design.

## Implementation architecture

Shared gameplay is in `/Users/vekazhadzic/Desktop/kidsvolt-web/client/src/components/`. The mobile shell consumes it through `@game`. The running direction is world X, lateral lane movement is world Z, and Y is height. Existing lanes are Z = -1.2, 0, 1.2; Bolt stays near X = -3. Preserve those conventions.

Proposed shared files under `bolt/world/`:

- `worldTypes.ts`: district, section, prop-placement, and landmark definitions with explicit units.
- `districts.ts`: palettes and allowed scenery modules for each district.
- `sections.ts`: reusable section definitions with length, entry/exit surface alignment, and off-lane prop placement.
- `WorldTrack.tsx`: bounded pool of recycled road/scenery sections driven by the existing game speed and play/pause state.
- `WorldLandmarks.tsx`: low-complexity original landmark geometry, built once and reused.

Integrate the world renderer into `BoltGame3D.tsx` behind an optional world configuration so existing web callers retain their current environment. Keep the current fallback ground available until the world is ready. Replace the scenery stack for the new world rather than draw the new district on top of RoadsideProps, SideHouses, and ToyCityDecor simultaneously.

Keep road and attached scenery within the same recyclable section group. Use one traveled-distance reference and one section boundary convention; independently wrapping roads, curbs, and fences can create mismatched seams. Recycle sections only after their complete bounding boxes pass behind the camera. Pool enough distance ahead for the current camera/fog range and maximum speed, with measured headroom.

Reuse existing houses, shops, cars, trees, planters, and fences when appropriate; audit the actual files and credits before packaging. Current `RoadsideProps.tsx` already loads GLBs as templates and clones them, and `ToyCityDecor.tsx` already demonstrates procedural landmarks/backdrops and parallax. Adapt these techniques without copying unverified lifecycle assumptions.

Give templates clear ownership of shared geometries/materials/textures. Recycling a section must not dispose buffers used by another section. Release all owned resources on world teardown, including any pending-load results that arrive after cancellation. Preload only the next needed district; avoid loading every future world asset at startup.

The mobile build copies game models using `scripts/sync-mobile-assets.mjs`. Add any new exported GLBs/textures to that allowlist. Procedural scene modules are bundled as code. Keep original image concepts in the design asset folder; do not load large concept images as scenery textures.

## Phone performance and verification

The project has explicit native memory constraints, and the current native path disables the GLB track (`NATIVE_USE_TRACK_GLB=false`). Prefer a simple procedural road for the prototype. A new world must be measured on the actual iOS and Android paths, including the existing low-power configuration.

- Aim for smooth 60 fps on target phones; agree on a 30 fps floor for lower-end test devices after establishing a baseline. These are goals, not measured results.
- Reuse materials, pool meshes, and instance repeated simple props where useful. Keep expensive transparency, shadow casters, reflective effects, and large textures limited.
- Capture frame time, draw calls, triangles, texture counts, and native memory during a continuous run and repeated restarts. Define budgets from the baseline/prototype measurements rather than treating arbitrary polygon/file-size targets as guarantees.
- Test section seams at maximum speed, pause/resume, district boundaries, app background/foreground, and repeated restart/hero changes.
- Verify 320×568 and 390×844 portrait readability, plus short landscape layouts for any supported orientation. Check the actual camera; an overhead composition cannot establish visibility.
- Compare collision and scoring behavior before and after enabling the world. The first implementation changes scenery, not gameplay rules.
- Deliver the concept, a real gameplay capture, and measured device results side by side before claiming the map matches the intended look or is ready for release.

## Delivery order

1. Agree on the three-district direction and the Boulevard prototype.
2. Generate the portrait and layout concepts for that prototype.
3. Build simple 3D geometry and road sections; verify scale, camera, and seams.
4. Apply the approved art direction and reuse suitable existing props.
5. Test the playable prototype on iOS and Android; reduce cost where measurements require it.
6. Expand the same system to Spark Park and Power Plaza, then add transitions and section variation.

A deliverable 3D world can be authored as code plus reusable GLB assets. An exported static GLB is possible for mesh/material geometry, but Three.js-specific animation, pooling, gameplay rules, and shader effects require the runtime code and are not represented by a single model file.
