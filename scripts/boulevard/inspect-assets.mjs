import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { Box3, Mesh } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const root = fileURLToPath(new URL("../../mobile-game-assests/bolt-boulevard-v1/", import.meta.url));
const manifest = JSON.parse(await fs.readFile(path.join(root, "asset-manifest.json"), "utf8"));
const loader = new GLTFLoader();
let bytes = 0;
for (const asset of manifest.assets) {
  const data = await fs.readFile(path.join(root, asset.model));
  const jsonLength = data.readUInt32LE(12);
  const json = JSON.parse(data.subarray(20, 20 + jsonLength).toString());
  assert(!(json.buffers ?? []).some(buffer => buffer.uri), `${asset.id}: external buffer`);
  assert(!(json.images ?? []).some(image => image.uri), `${asset.id}: external image`);
  const gltf = await loader.parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), "");
  const bounds = new Box3().setFromObject(gltf.scene);
  let triangles = 0;
  let meshes = 0;
  gltf.scene.traverse(object => {
    if (!(object instanceof Mesh)) return;
    meshes++;
    const position = object.geometry.getAttribute("position");
    assert(Array.from(position.array).every(Number.isFinite), `${asset.id}: invalid vertex`);
    const indices = object.geometry.index;
    if (indices) assert(Array.from(indices.array).every(index => index < position.count), `${asset.id}: invalid index`);
    triangles += (indices?.count ?? position.count) / 3;
  });
  for (const edge of ["min", "max"]) {
    bounds[edge].toArray().forEach((value, axis) => {
      assert(Math.abs(value - asset.gltfBounds[edge][axis]) < 0.001, `${asset.id}: ${edge} bounds mismatch`);
    });
  }
  assert.equal(data.length, asset.bytes, `${asset.id}: byte count`);
  assert.equal(triangles, asset.triangles, `${asset.id}: triangle count`);
  assert.equal(meshes, asset.meshCount, `${asset.id}: mesh count`);
  await fs.access(path.join(root, asset.source));
  await fs.access(path.join(root, asset.preview));
  bytes += data.length;
}

const cards = manifest.assets.map(asset => `<article>
  <a href="${asset.preview}"><img src="${asset.preview}" alt="Rendered 3D model: ${asset.id}" loading="lazy"></a>
  <div class="body"><h2>${asset.id.replaceAll("-", " ")}</h2>
  <p>${asset.triangles.toLocaleString("en")} triangles · ${(asset.bytes / 1024).toFixed(0)} KB</p>
  <nav><a href="${asset.model}" download>GLB model ↓</a><a href="${asset.source}" download>Blender source ↓</a></nav></div>
</article>`).join("\n");

await fs.writeFile(path.join(root, "index.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bolt Boulevard — 3D asset gallery</title><style>
*{box-sizing:border-box}body{margin:0;background:#102b23;color:#f9edc9;font:16px/1.5 system-ui,sans-serif}
main{max-width:1280px;margin:auto;padding:48px 24px}h1{font-size:clamp(28px,5vw,48px);margin:0 0 10px}header p{max-width:750px;color:#c6d9ca}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:22px;margin-top:32px}
article{background:#1d4034;border:1px solid #42634c;border-radius:20px;overflow:hidden}img{display:block;width:100%;aspect-ratio:9/10;object-fit:contain;background:#c8d3d7}
.body{padding:18px}h2{margin:0;font-size:21px;text-transform:capitalize}.body p{color:#c6d9ca;font-size:14px}
nav{display:flex;gap:14px;flex-wrap:wrap}a{color:#ffe07d;text-underline-offset:4px}a:focus-visible{outline:3px solid #ffe07d;outline-offset:4px}
</style></head><body><main><header><p>BOLT RUNNER / MODEL KIT V1</p><h1>Bolt Boulevard</h1>
<p>Twelve separate 3D models, built in Blender before assembling the map. Each preview below is rendered from its actual model. Download the game-ready GLB or editable Blender source.</p>
<p>${manifest.assets.length} assets · ${(bytes / 1024 / 1024).toFixed(2)} MiB total · Y up · meters<br>A stylized recreation of the concept artwork.</p></header>
<section class="grid" aria-label="3D models">${cards}</section></main></body></html>`);
console.log(`Validated ${manifest.assets.length} GLBs, ${bytes.toLocaleString("en")} bytes. Asset gallery: ${path.join(root, "index.html")}`);
