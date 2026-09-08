# Bolt Boulevard — original 3D model kit

Twelve separate models authored in Blender from the Bolt Boulevard concept. These are real meshes, not image planes. The kit is a stylized recreation; it is not an exact reconstruction of the concept image.

Each asset has a runtime `models/<name>.glb`, editable `source/<name>.blend`, and individually rendered `previews/<name>.png`. All GLBs use meters, Y up, +Z front, with origins at ground level (road surface at Y=0). Materials are embedded, with no external texture downloads.

| Asset | Use in game | Triangles |
| --- | --- | ---: |
| clock-tower | Landmark replacing two house slots in the repeating street | 14,968 |
| house-yellow | Yellow residential building | 17,152 |
| shop-coral | Coral storefront with striped awning | 18,868 |
| house-mint | Mint residential building | 16,124 |
| tree-round | Rounded sidewalk trees | 2,192 |
| banner | Gold-trimmed lightning banners | 2,400 |
| fence | Alternating sidewalk furniture | 1,948 |
| planter | Alternating sidewalk furniture | 4,608 |
| bench | Alternating sidewalk furniture | 2,408 |
| road-section | Six seamless 12 m sections with three lanes | 3,948 |
| lightning-pickup | Boulevard's bolt collectible visual | 164 |
| toy-crate | Boulevard's extra static obstacle | 1,084 |

Total model payload: 5,477,660 bytes (5.22 MiB). The machine-readable `asset-manifest.json` contains bounds, material counts and file sizes. Some building meshes exceed the original 12,000-triangle target; runtime instances share geometry/materials, but device performance still needs profiling.

## Regenerate

From the mobile project root, using Blender 5.0:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/boulevard/build_assets.py
```

For one asset only:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/boulevard/build_assets.py -- toy-crate
```

The generator updates the GLB, Blender source, preview, and manifest together. `pnpm build` copies only GLBs into `public/models/boulevard` and the production bundle. Editable sources and preview gallery are not shipped. Do not edit the copied public GLBs directly.

## Integration

Hero selection leads to Current Map / Bolt Boulevard selection. The selected route is saved in `bolt-map`. Shared `BoltGame3D` uses `bolt/world/BoulevardWorld.tsx` for Boulevard, keeping the existing scenery for Current Map. Six pooled road sections and attached scenery move only during active play. GPU resources are owned by the world and released on unmount; a failed map load shows a return-to-menu action.

The hero, controls, score rules, difficulty and original star/robot/gold-brick models remain shared. Boulevard uses its new lightning model for bolt pickups and its crate as the extra obstacle. The map selection artwork is explicitly labeled as concept artwork.

## Validation

- All 12 GLBs parsed in Three.js: finite attributes and bounds, valid indices, manifest counts and no external assets.
- Crate rail intersections and chevron corrected in the mesh, then re-exported.
- Mobile type check and 59 tests passed; production build passed. Three additional road-pool tests passed, including 10,000 frames of recycling and pause/resume checks.
- Boulevard loaded and replayed in the browser. `gameplay-preview.png` is an actual game screenshot; `index.html` is the individual asset gallery.
- Switched from Boulevard to Current Map and back; both loaded. Original-map play, pause, and return-to-hero selection were checked in the browser.
- Full shared type check still reports seven existing errors in older game files, including the character ground-alignment guard and unused declarations. No errors were reported in the new map files.
- Physical iOS/Android performance and a native release build are not yet verified.
- `cap sync` completed both web-asset copies and the Android plugin update, then was stopped after prolonged local dependency reads before iOS sync completed. The verified `dist` web build was also copied into both native projects' generated `public` folders, preserving native bridge/config files. Complete the normal native sync/build pipeline before release.

Run `node scripts/boulevard/inspect-assets.mjs` from the mobile root to validate every GLB and rebuild the gallery from the manifest.
