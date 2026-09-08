import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  computeRootCorrection,
  computeRootScale,
  retargetClip,
} from "@game/bolt/retarget";

/**
 * Regression cover for "Luna runs upright but jumps, lands and dies on her side".
 *
 * The game ships one set of jump/land/strafe/die clips authored on Bolt's Mixamo
 * skeleton and reuses them for every hero. The previous code bound them to another
 * rig by renaming the tracks — dropping the "mixamorig" prefix — which is not
 * retargeting. A quaternion track sets a bone's local rotation absolutely, so when
 * two rigs hold their root at different rest orientations (Bolt's and Luna's
 * differ by ~90 degrees about X) the borrowed clip rotates the entire body,
 * because every child bone inherits the root.
 *
 * These tests work on synthetic tracks rather than the real GLBs: the correction
 * is pure quaternion algebra, and asserting on numbers we construct makes the
 * failure legible. They prove the maths, not the pixels — confirming Luna looks
 * right in motion needs the device.
 */

/**
 * The armature holding Bolt's root, rotated 90 degrees about X as his is.
 * These are the root bone's PARENT orientations — what the correction is built
 * from, since a bone's own world orientation folds in the local value the clip is
 * about to overwrite.
 */
const BOLT_PARENT = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  Math.PI / 2,
);
/** Luna's armature, unrotated. */
const LUNA_PARENT = new THREE.Quaternion();

/** Float32Array-backed track values; a round trip costs ~4e-4 rad. */
const F32 = 1e-3;

const LUNA_BONES = new Set(["Hips", "Spine", "Head", "LeftUpLeg"]);

function quatTrack(name: string, q: THREE.Quaternion) {
  return new THREE.QuaternionKeyframeTrack(name, [0], [q.x, q.y, q.z, q.w]);
}

function vecTrack(name: string, v: THREE.Vector3) {
  return new THREE.VectorKeyframeTrack(name, [0], [v.x, v.y, v.z]);
}

function clipOf(...tracks: THREE.KeyframeTrack[]) {
  return new THREE.AnimationClip("test", 1, tracks);
}

const opts = {
  stripPrefix: "mixamorig",
  targetBones: LUNA_BONES,
  rootBone: "Hips",
};

describe("computeRootCorrection", () => {
  it("is identity when both rigs share a root frame", () => {
    const c = computeRootCorrection(BOLT_PARENT, BOLT_PARENT);
    expect(c.angleTo(new THREE.Quaternion())).toBeLessThan(1e-6);
  });

  it("is the rotation between the two rigs' root frames", () => {
    const c = computeRootCorrection(BOLT_PARENT, LUNA_PARENT);
    expect(THREE.MathUtils.radToDeg(c.angleTo(new THREE.Quaternion()))).toBeCloseTo(90, 4);
  });

  it("carries a source-frame pose onto the target so world orientation is preserved", () => {
    // This is the property the whole module exists for:
    //   targetParent * (correction * q)  ==  sourceParent * q
    const c = computeRootCorrection(BOLT_PARENT, LUNA_PARENT);
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.7);
    const onTarget = LUNA_PARENT.clone().multiply(c.clone().multiply(q));
    const onSource = BOLT_PARENT.clone().multiply(q);
    expect(onTarget.angleTo(onSource)).toBeLessThan(1e-6);
  });

  it("preserves world orientation for rigs differing about two axes", () => {
    // Bolt's and Luna's frames differ about X alone, which makes several
    // plausible orderings numerically identical — the real rigs cannot tell a
    // correct formula from a transposed one. This case can.
    const source = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0.9, 0));
    const target = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0, 1.1));
    const c = computeRootCorrection(source, target);
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0.3, 0.5, 0.8).normalize(), 1.2);
    const onTarget = target.clone().multiply(c.clone().multiply(q));
    const onSource = source.clone().multiply(q);
    expect(onTarget.angleTo(onSource)).toBeLessThan(1e-6);
  });

  it("does not mutate its arguments", () => {
    const a = BOLT_PARENT.clone();
    const b = LUNA_PARENT.clone();
    computeRootCorrection(a, b);
    expect(a.equals(BOLT_PARENT)).toBe(true);
    expect(b.equals(LUNA_PARENT)).toBe(true);
  });
});

describe("retargetClip", () => {
  it("strips the prefix so tracks address the target rig's bones", () => {
    const out = retargetClip(clipOf(quatTrack("mixamorigSpine.quaternion", new THREE.Quaternion())), opts);
    expect(out?.tracks.map(t => t.name)).toEqual(["Spine.quaternion"]);
  });

  it("drops tracks for bones the target rig does not have", () => {
    // Luna's rig has 24 bones to Bolt's 34 — the fingers are legitimately absent,
    // and binding them would warn once per missing bone, every frame.
    const out = retargetClip(
      clipOf(
        quatTrack("mixamorigSpine.quaternion", new THREE.Quaternion()),
        quatTrack("mixamorigLeftHandIndex1.quaternion", new THREE.Quaternion()),
      ),
      opts,
    );
    expect(out?.tracks.map(t => t.name)).toEqual(["Spine.quaternion"]);
  });

  it("returns null when nothing binds, rather than an empty clip", () => {
    // An empty clip registers an action that plays nothing, which is how Luna
    // shipped with no jump, land, strafe or die at all.
    const out = retargetClip(
      clipOf(quatTrack("mixamorigLeftHandIndex1.quaternion", new THREE.Quaternion())),
      opts,
    );
    expect(out).toBeNull();
  });

  it("rotates the root's rotation into the target rig's frame", () => {
    const correction = computeRootCorrection(BOLT_PARENT, LUNA_PARENT);
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.4);
    const out = retargetClip(clipOf(quatTrack("mixamorigHips.quaternion", q)), {
      ...opts,
      correction,
    });
    const v = out!.tracks[0].values;
    const got = new THREE.Quaternion(v[0], v[1], v[2], v[3]);
    // Hung off Luna's armature, the corrected key must reach the same world
    // orientation the original reached off Bolt's.
    const onTarget = LUNA_PARENT.clone().multiply(got);
    const onSource = BOLT_PARENT.clone().multiply(q);
    expect(onTarget.angleTo(onSource)).toBeLessThan(F32);
  });

  it("leaves non-root bones untouched", () => {
    const correction = computeRootCorrection(BOLT_PARENT, LUNA_PARENT);
    // The limbs are a shared Mixamo hierarchy; their local rotations already
    // agree once the root is right. Correcting them too would double-apply.
    const spine = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.5);
    const out = retargetClip(clipOf(quatTrack("mixamorigSpine.quaternion", spine)), {
      ...opts,
      correction,
    });
    const v = out!.tracks[0].values;
    expect(new THREE.Quaternion(v[0], v[1], v[2], v[3]).angleTo(spine)).toBeLessThan(F32);
  });

  it("rotates the root's position, so root motion stays in-plane", () => {
    const correction = computeRootCorrection(BOLT_PARENT, LUNA_PARENT);
    // Bolt's jump travels forward in his frame. Applied raw to Luna that forward
    // travel landed on her vertical axis and she took off: hips y went 0 -> 2.17.
    const out = retargetClip(
      clipOf(new THREE.VectorKeyframeTrack("mixamorigHips.position", [0], [0, 0, 1])),
      { ...opts, correction },
    );
    const v = out!.tracks[0].values;
    const moved = new THREE.Vector3(v[0], v[1], v[2]);
    expect(moved.length()).toBeCloseTo(1, 5); // length preserved — a rotation
    // The correction is +90 degrees about X, which maps (0,0,1) to (0,-1,0):
    // travel that ran forward in Bolt's frame runs along Luna's vertical axis.
    expect(moved.y).toBeCloseTo(-1, 5);
  });

  it("renames without rotating when no correction is supplied", () => {
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.4);
    const out = retargetClip(clipOf(quatTrack("mixamorigHips.quaternion", q)), opts);
    const v = out!.tracks[0].values;
    expect(new THREE.Quaternion(v[0], v[1], v[2], v[3]).angleTo(q)).toBeLessThan(F32);
  });

  it("does not mutate the source clip", () => {
    // The clip is cached and reused across every hero that borrows it, so a
    // mutating retarget would corrupt the next hero's copy.
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.4);
    const clip = clipOf(quatTrack("mixamorigHips.quaternion", q));
    retargetClip(clip, { ...opts, correction: computeRootCorrection(BOLT_PARENT, LUNA_PARENT) });
    expect(clip.tracks[0].name).toBe("mixamorigHips.quaternion");
    const v = clip.tracks[0].values;
    expect(new THREE.Quaternion(v[0], v[1], v[2], v[3]).angleTo(q)).toBeLessThan(F32);
  });
});

describe("computeRootScale", () => {
  it("is 1 when both rigs share a parent scale (Bolt -> Luna)", () => {
    const s = computeRootScale(new THREE.Vector3(0.01, 0.01, 0.01), new THREE.Vector3(0.01, 0.01, 0.01));
    expect(s).toBe(1);
  });

  it("is the source/target ratio for a metre-native target (Bolt -> Rex)", () => {
    // Bolt's clips sit under a 0.01 armature (cm data); Rex's Meshy export is
    // metre-native at 1.0. Without this his borrowed hip travel of ~49 landed as
    // 49 metres and he shot off-screen.
    const s = computeRootScale(new THREE.Vector3(0.01, 0.01, 0.01), new THREE.Vector3(1, 1, 1));
    expect(s).toBeCloseTo(0.01, 12);
  });

  it("degrades to 1 rather than dividing by a zero-scale parent", () => {
    expect(computeRootScale(new THREE.Vector3(0.01, 0.01, 0.01), new THREE.Vector3(0, 0, 0))).toBe(1);
  });
});

describe("retargetClip — rootScale", () => {
  const correction = computeRootCorrection(BOLT_PARENT, LUNA_PARENT);

  it("scales the root's translation into the target's units", () => {
    const out = retargetClip(
      clipOf(vecTrack("mixamorigHips.position", new THREE.Vector3(0, 0, 100))),
      { ...opts, correction, rootScale: 0.01 },
    );
    const v = out!.tracks[0].values;
    // 100 in the clip's cm frame, rotated (+90 about X: +Z -> -Y), then x0.01.
    expect(new THREE.Vector3(v[0], v[1], v[2]).length()).toBeCloseTo(1, 5);
    expect(v[1]).toBeCloseTo(-1, 5);
  });

  it("scales non-root position tracks too, without rotating them", () => {
    // These are bone rest offsets in the clip rig's units. Bolt's cm-scale leg
    // offsets were pushing Rex's feet ~48 metres underground until they were
    // rescaled; they must NOT also be rotated (they are not directions).
    const out = retargetClip(
      clipOf(vecTrack("mixamorigLeftUpLeg.position", new THREE.Vector3(0, 0, 40))),
      { ...opts, targetBones: new Set(["Hips", "LeftUpLeg"]), correction, rootScale: 0.01 },
    );
    const v = out!.tracks[0].values;
    expect([v[0], v[1], v[2]]).toEqual([0, 0, expect.closeTo(0.4, 5)]);
  });

  it("passes non-root position tracks straight through at rootScale 1", () => {
    // The Bolt -> Luna case: identical units, so Bolt's foot positioning is kept
    // exactly (that is what keeps Luna's feet planted through a borrowed jump).
    const offset = new THREE.Vector3(1, 2, 3);
    const out = retargetClip(
      clipOf(vecTrack("mixamorigLeftUpLeg.position", offset)),
      { ...opts, targetBones: new Set(["Hips", "LeftUpLeg"]), correction },
    );
    const v = out!.tracks[0].values;
    expect([v[0], v[1], v[2]]).toEqual([1, 2, 3]);
  });

  it("drops the constant .scale tracks on a cross-rig retarget", () => {
    const out = retargetClip(
      clipOf(
        quatTrack("mixamorigHips.quaternion", new THREE.Quaternion()),
        new THREE.VectorKeyframeTrack("mixamorigHips.scale", [0], [1, 1, 1]),
      ),
      { ...opts, correction },
    );
    expect(out!.tracks.map(t => t.name)).toEqual(["Hips.quaternion"]);
  });
});
