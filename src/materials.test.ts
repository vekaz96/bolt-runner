import { describe, expect, it } from "vitest";
import { applyToyMaterialLook } from "@game/bolt/trackUtils";

/**
 * Regression cover for the "all models are black" bug.
 *
 * Every GLB from the FBX → GLB conversion carries glTF's *default* metallicFactor
 * of 1, because Blender's exporter omits the value when the source material never
 * set one. A fully metallic surface has no diffuse response — it shows only
 * reflected environment — and the game scene deliberately has no environment map
 * (ambient + directional only, for the device GPU budget). The models therefore
 * rendered solid black on device.
 *
 * These use a plain material-shaped stub rather than real three objects: the
 * function only reads `isMeshStandardMaterial` and writes three numbers, so a stub
 * keeps the test honest about what is being verified and avoids pulling three's
 * types into the suite.
 *
 * They prove the mechanism, not the pixels — confirming the models look right
 * needs a device.
 */
type MaterialStub = {
  isMeshStandardMaterial?: boolean;
  metalness?: number;
  roughness?: number;
  needsUpdate?: boolean;
  map?: unknown;
};

/** As shipped by the converter: fully metallic, fully rough, baked colour map. */
const converted = (over: MaterialStub = {}): MaterialStub => ({
  isMeshStandardMaterial: true,
  metalness: 1,
  roughness: 1,
  needsUpdate: false,
  ...over,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apply = (m: MaterialStub) => applyToyMaterialLook(m as any);

describe("applyToyMaterialLook", () => {
  it("removes the metalness that made converted models render black", () => {
    const mat = converted();
    apply(mat);
    expect(mat.metalness).toBe(0);
  });

  it("softens the exporter's default full roughness", () => {
    const mat = converted();
    apply(mat);
    expect(mat.roughness).toBe(0.85);
  });

  it("leaves an intentionally authored roughness alone", () => {
    const mat = converted({ roughness: 0.2 });
    apply(mat);
    expect(mat.roughness).toBe(0.2); // only the 1.0 exporter default is corrected
    expect(mat.metalness).toBe(0);
  });

  it("keeps the baked colour texture — the fix must not discard the artwork", () => {
    const map = { id: "colour-map" };
    const mat = converted({ map });
    apply(mat);
    expect(mat.map).toBe(map);
  });

  it("flags the material for a GPU update", () => {
    const mat = converted();
    apply(mat);
    expect(mat.needsUpdate).toBe(true);
  });

  it("ignores non-standard materials rather than throwing", () => {
    const basic: MaterialStub = { isMeshStandardMaterial: false, metalness: 1 };
    expect(() => apply(basic)).not.toThrow();
    expect(basic.metalness).toBe(1); // untouched
  });
});
