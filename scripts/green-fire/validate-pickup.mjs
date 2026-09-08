import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const root = fileURLToPath(new URL("../../mobile-game-assests/green-fire-pickup-v1/", import.meta.url));
const manifest = JSON.parse(await fs.readFile(path.join(root, "asset-manifest.json"), "utf8"));
const data = await fs.readFile(path.join(root, manifest.model));
assert.equal(data.readUInt32LE(0), 0x46546c67, "Expected GLB magic header");
assert.equal(data.readUInt32LE(4), 2, "Expected glTF 2.0");
assert.equal(data.readUInt32LE(8), data.length, "GLB byte length must match its header");
assert.equal(data.readUInt32LE(16), 0x4e4f534a, "GLB first chunk must be JSON");
const jsonLength = data.readUInt32LE(12);
const document = JSON.parse(data.subarray(20, 20 + jsonLength).toString("utf8"));
assert(!(document.buffers ?? []).some(buffer => buffer.uri), "All buffers must be embedded");
assert(!(document.images ?? []).some(image => image.uri), "All images must be embedded");
assert.equal(document.animations?.length, 1, "Expected exactly one portable animation clip");
assert.equal(document.animations[0].name, "GreenFire_Idle", "Unexpected animation clip name");

const gltf = await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), "");
assert.equal(gltf.animations.length, 1);
const clip = gltf.animations[0];
assert.equal(clip.name, "GreenFire_Idle");
assert(Math.abs(clip.duration - 2) < 1e-5, `Expected 2 second loop, received ${clip.duration}`);
assert(clip.tracks.length > 0, "Clip has no animated tracks");
for (const track of clip.tracks) {
  assert(Array.from(track.times).every(Number.isFinite), `${track.name}: non-finite key time`);
  assert(Array.from(track.values).every(Number.isFinite), `${track.name}: non-finite key value`);
  assert(Math.abs(track.times[0]) < 1e-5, `${track.name}: first key must start at zero`);
  assert(Math.abs(track.times.at(-1) - 2) < 1e-5, `${track.name}: last key must end at two seconds`);
}

let triangles = 0;
let meshes = 0;
let morphTargets = 0;
const materials = new Set();
const nodes = [];
const morphNodes = [];
const sparkNodes = [];
gltf.scene.traverse(object => {
  nodes.push(object);
  if (/^Rising[ _]ember/.test(object.name)) sparkNodes.push(object);
  if (!(object instanceof THREE.Mesh)) return;
  meshes++;
  const position = object.geometry.getAttribute("position");
  assert(position && position.count > 0, `${object.name}: empty geometry`);
  assert.equal(position.itemSize, 3, `${object.name}: positions must have three coordinates`);
  assert(Array.from(position.array).every(Number.isFinite), `${object.name}: non-finite vertex`);
  const indices = object.geometry.index;
  if (indices) {
    assert(Array.from(indices.array).every(index => Number.isInteger(index) && index >= 0 && index < position.count), `${object.name}: invalid vertex index`);
  }
  const vertices = indices?.count ?? position.count;
  assert.equal(vertices % 3, 0, `${object.name}: triangle index count is not divisible by three`);
  triangles += vertices / 3;
  for (const [semantic, attributes] of Object.entries(object.geometry.morphAttributes)) {
    for (const attribute of attributes) {
      assert.equal(attribute.count, position.count, `${object.name}: ${semantic} morph count mismatch`);
      assert(Array.from(attribute.array).every(Number.isFinite), `${object.name}: non-finite ${semantic} morph`);
    }
  }
  if (object.morphTargetInfluences?.length) {
    morphNodes.push(object);
    morphTargets += object.morphTargetInfluences.length;
  }
  (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
});
const pickupRoot = gltf.scene.getObjectByName("GreenFire_Pickup");
assert(pickupRoot, "Missing named pickup transform anchor");
assert(morphNodes.length > 0, "Pickup must contain morph-animated flames");
assert.equal(sparkNodes.length, 7, "Expected seven rising ember meshes");

function samplePose(time) {
  // LoopOnce samples the exact final pose; LoopRepeat would wrap t=2 to t=0
  // and could conceal a broken loop seam.
  const mixer = new THREE.AnimationMixer(gltf.scene);
  const action = mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
  mixer.setTime(time);
  gltf.scene.updateMatrixWorld(true);
  const transforms = nodes.map(object => ({
    name: object.name,
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
    morphs: [...(object.morphTargetInfluences ?? [])],
  }));
  const bounds = new THREE.Box3().setFromObject(gltf.scene, true);
  assert(!bounds.isEmpty(), `Pose ${time}: empty bounds`);
  [...bounds.min.toArray(), ...bounds.max.toArray()].forEach(value => assert(Number.isFinite(value), `Pose ${time}: non-finite bounds`));
  const result = {
    transforms,
    rootY: pickupRoot.position.y,
    morphs: morphNodes.flatMap(object => [...object.morphTargetInfluences]),
    sparks: sparkNodes.map(object => object.position.clone()),
    bounds,
  };
  mixer.stopAllAction();
  mixer.uncacheRoot(gltf.scene);
  return result;
}

const poses = Array.from({ length: 9 }, (_, index) => samplePose(index / 4));
const first = poses[0];
const last = poses.at(-1);
const hoverRange = Math.max(...poses.map(pose => pose.rootY)) - Math.min(...poses.map(pose => pose.rootY));
assert(hoverRange > 0.04, `Hover is not moving in glTF Y: range ${hoverRange}`);
assert(poses.some(pose => pose.morphs.some((weight, index) => Math.abs(weight - first.morphs[index]) > 0.1)), "Flame morph weights do not change over the loop");
for (let index = 0; index < sparkNodes.length; index++) {
  assert(poses.some(pose => pose.sparks[index].distanceTo(first.sparks[index]) > 0.1), `${sparkNodes[index].name}: spark is not rising`);
}

let maxLoopPositionError = 0;
let maxLoopScaleError = 0;
let maxLoopMorphError = 0;
let maxLoopRotationError = 0;
first.transforms.forEach((start, index) => {
  const end = last.transforms[index];
  const positionError = start.position.distanceTo(end.position);
  const scaleError = start.scale.distanceTo(end.scale);
  const rotationError = start.quaternion.angleTo(end.quaternion);
  const morphError = Math.max(0, ...start.morphs.map((weight, i) => Math.abs(weight - end.morphs[i])));
  maxLoopPositionError = Math.max(maxLoopPositionError, positionError);
  maxLoopScaleError = Math.max(maxLoopScaleError, scaleError);
  maxLoopRotationError = Math.max(maxLoopRotationError, rotationError);
  maxLoopMorphError = Math.max(maxLoopMorphError, morphError);
  assert(positionError < 1e-5, `${start.name}: position loop seam ${positionError}`);
  assert(scaleError < 1e-5, `${start.name}: scale loop seam ${scaleError}`);
  assert(rotationError < 1e-3, `${start.name}: rotation loop seam ${rotationError}`);
  assert(morphError < 1e-5, `${start.name}: morph loop seam ${morphError}`);
});

assert.equal(data.length, manifest.bytes, `Manifest bytes are stale; actual ${data.length}`);
assert.equal(triangles, manifest.triangles, `Manifest triangles are stale; actual ${triangles}`);
assert.equal(meshes, manifest.meshes, `Manifest meshes are stale; actual ${meshes}`);
assert.equal(clip.duration, manifest.durationSeconds, `Manifest duration is stale; actual ${clip.duration}`);
assert.equal(manifest.upAxis, "Y");
assert.equal(manifest.frontAxis, "+Z");
assert.equal(manifest.units, "meters");
assert.equal((document.images ?? []).length, manifest.textures.length, "Manifest texture count mismatch");
await fs.access(path.join(root, manifest.source));
await fs.access(path.join(root, manifest.preview));

const animatedBounds = new THREE.Box3();
poses.forEach(pose => animatedBounds.union(pose.bounds));
console.log(`Green Fire validated: ${triangles.toLocaleString("en")} triangles, ${meshes} meshes, ${materials.size} materials, ${(data.length / 1024).toFixed(1)} KiB.`);
console.log(`One ${clip.name} clip · ${clip.duration.toFixed(1)} seconds · ${morphTargets} morph targets · 7 moving sparks · ${(hoverRange * 100).toFixed(1)} cm hover range.`);
console.log(`Exact first/last pose continuity passed: position ${maxLoopPositionError.toExponential(2)} m, scale ${maxLoopScaleError.toExponential(2)}, morph ${maxLoopMorphError.toExponential(2)}, rotation ${maxLoopRotationError.toExponential(2)} rad.`);
console.log(`Sampled animated bounds XYZ: ${animatedBounds.getSize(new THREE.Vector3()).toArray().map(value => value.toFixed(3)).join(" × ")} m. All geometry, keyframes and manifest metrics passed.`);

const geometries = new Set();
gltf.scene.traverse(object => { if (object instanceof THREE.Mesh) geometries.add(object.geometry); });
geometries.forEach(geometry => geometry.dispose());
materials.forEach(material => material.dispose());
