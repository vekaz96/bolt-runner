# Green Fire pickup · Phase 1

An original animated 3D pickup for Bolt Runner: an emerald flame, raised lime core, floating halo and seven rising sparks. This phase provides **pickup artwork and its idle animation only**. Collection, stored fire charges, casting and smoke impacts belong to later phases.

Open [the offline gallery](index.html) to inspect the animation and screenshots. Each map screenshot includes a **390px-wide gameplay canvas inside the preview UI**, showing the actual Current Map or Bolt Boulevard scene. These images do not indicate that pickup gameplay has been installed.

| File | Purpose |
| --- | --- |
| [models/green-fire-pickup.glb](models/green-fire-pickup.glb) | Portable animated model |
| [source/green-fire-pickup.blend](source/green-fire-pickup.blend) | Editable Blender source |
| [previews/green-fire-idle.gif](previews/green-fire-idle.gif) | Two-second rendered animation preview |
| [previews/green-fire-pickup.png](previews/green-fire-pickup.png) | Still render of the model |
| [asset-manifest.json](asset-manifest.json) | Export metrics and orientation |

The GLB is **126,848 bytes (123.9 KiB)**: 3,184 triangles, 15 meshes and five materials. Geometry, emissive materials, 14 morph targets and animation are embedded; no texture files or external resources are required. One looping clip, **`GreenFire_Idle`**, lasts exactly **2 seconds** and combines hovering, flame flicker and spark motion.

## Placement and playback

- Coordinates: meters, **Y up**, **+Z front**.
- Recommended gameplay scale: **0.7**.
- The preview places the pickup at `[4, 0.23, 0]`. Rotation `[0, -Math.PI / 2, 0]` faces its front toward the game's **−X** camera direction.
- Put placement, orientation and scale on an **outer wrapper group**. Keep the animated `GreenFire_Pickup` root inside it, since the clip controls that root's hover and rotation.
- Use a Three.js `AnimationMixer` to play `GreenFire_Idle` in `LoopRepeat`. Advance the mixer using frame delta; stop advancing it when paused. Dispose owned resources when the preview is removed.

The isolated live preview offers close-up orbit controls, animation pause and both actual map scenes. From the mobile repository run `pnpm dev --port 5181`, then open [the live preview](http://localhost:5181/green-fire-preview.html). It does not change gameplay or account state.

## Rebuild and validate

Run these commands from the **`kidsvolt-bolt-mobile` repository root**. They require Blender 5, Node with the repository dependencies installed, and Python 3 with Pillow. The Blender executable below is its standard macOS location.

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/green-fire/build_pickup.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/green-fire/render_loop.py
python3 scripts/green-fire/pack_loop.py
node scripts/green-fire/validate-pickup.mjs
```

The builder regenerates the GLB, Blender source, still render and manifest. The loop renderer writes 24 frames to a temporary directory; `pack_loop.py` reads its saved path, produces the two-second GIF and removes the temporary path pointer after success. Map screenshots are captured separately from the live preview.

Validation checks geometry and indices, embedded resources, manifest metrics, the single two-second clip, sampled hover/morph/spark movement, and matching first/last animation poses. The current asset passes these checks. Phone GPU performance remains a later integration check.
