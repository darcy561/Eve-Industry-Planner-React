import { describe, expect, it } from "vitest";

import reactionFormulaCalculation from "./reactionMaterialCalculation";

/**
 * A reaction has no blueprint and no structure material term — only the rig,
 * scaled by its system. These pin that narrower rule, and the rounding and
 * single-unit exemption it shares with manufacturing.
 */
describe("reaction material quantities", () => {
  it("needs base × runs × slots when nothing modifies it", () => {
    expect(reactionFormulaCalculation(100, 10, 2, 0, 0)).toBe(2000);
  });

  it("scales the rig's reduction by the system it is in", () => {
    // 100 × (1 − 0.02×1.1) = 97.8, rounded up
    expect(reactionFormulaCalculation(100, 1, 1, 2, 1.1)).toBe(98);
    expect(reactionFormulaCalculation(1000, 1, 1, 2, 1.1)).toBe(978);
  });

  it("removes nothing when the rig is in a system that does not amplify it", () => {
    expect(reactionFormulaCalculation(100, 1, 1, 2, 0)).toBe(100);
  });

  it("never reduces a material the recipe needs exactly one of", () => {
    expect(reactionFormulaCalculation(1, 1, 1, 2, 1.1)).toBe(1);
    expect(reactionFormulaCalculation(1, 5, 3, 2, 1.1)).toBe(15);
  });

  it("rounds each slot up on its own before counting the slots", () => {
    // 9 × (1 − 0.5×1) = 4.5 per slot, so two slots need 5 each rather than 9.
    expect(reactionFormulaCalculation(9, 1, 2, 50, 1)).toBe(10);
  });

  it("never asks for less than one unit", () => {
    expect(reactionFormulaCalculation(2, 0, 1, 0, 0)).toBe(1);
    expect(reactionFormulaCalculation(2, 1, 0, 0, 0)).toBe(1);
  });
});
