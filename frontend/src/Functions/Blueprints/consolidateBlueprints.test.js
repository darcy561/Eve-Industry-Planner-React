import { describe, expect, it } from "vitest";
import consolidateBlueprints, { stackCount } from "./consolidateBlueprints";
import buildBlueprintRows from "./buildBlueprintRows";
import {
  blueprintSearchIndex,
  CAPACITOR_BLUEPRINT_TYPE_ID,
  characterBlueprintRows,
  identicalCopyRows,
  RIFTER_BLUEPRINT_TYPE_ID,
} from "../../tests/blueprintFixtures";

const rowsFor = (raw) => buildBlueprintRows(raw, blueprintSearchIndex).rows;

const copies = rowsFor(identicalCopyRows);
const rifters = rowsFor(characterBlueprintRows).filter(
  (row) => row.typeId === RIFTER_BLUEPRINT_TYPE_ID
);

const activeJobOn = (itemId) => [
  { blueprint_id: itemId, status: "active", runs: 1 },
];

describe("the cards a blueprint panel shows", () => {
  it("puts interchangeable blueprints on one card", () => {
    const stacks = consolidateBlueprints(copies);

    expect(stacks).toHaveLength(1);
    expect(stacks[0].blueprints).toHaveLength(3);
  });

  // A panel filters to one type before it asks, but nothing in the grouping should depend on that:
  // two untouched originals of different hulls look identical in every other field.
  it("keeps different blueprint types apart", () => {
    const mixed = rowsFor([
      ...identicalCopyRows.slice(0, 1),
      { ...identicalCopyRows[1], type_id: CAPACITOR_BLUEPRINT_TYPE_ID },
    ]);

    const stacks = consolidateBlueprints(mixed);

    expect(stacks).toHaveLength(2);
    expect(stacks.map((stack) => stack.blueprint.typeId).sort()).toEqual(
      [CAPACITOR_BLUEPRINT_TYPE_ID, RIFTER_BLUEPRINT_TYPE_ID].sort()
    );
  });

  it("keeps differently researched blueprints apart", () => {
    const stacks = consolidateBlueprints(rifters);

    // ME 5 original, ME 10 original, and an ME 10 copy are three different things.
    expect(stacks).toHaveLength(3);
  });

  // The one being built is unavailable until the job finishes, and the job's figures belong to it.
  it("takes a blueprint with a job running on it out of the stack", () => {
    const stacks = consolidateBlueprints(copies, activeJobOn(7021));

    expect(stacks).toHaveLength(2);
    const building = stacks.find((stack) => stack.esiJob);
    expect(building.blueprints.map((b) => b.itemId)).toEqual([7021]);
    expect(stacks.find((stack) => !stack.esiJob).blueprints).toHaveLength(2);
  });

  it("gives every blueprint being built its own card", () => {
    const stacks = consolidateBlueprints(copies, [
      ...activeJobOn(7020),
      ...activeJobOn(7021),
      ...activeJobOn(7022),
    ]);

    expect(stacks).toHaveLength(3);
    expect(stacks.every((stack) => stack.esiJob)).toBe(true);
  });

  // A finished job is not holding anything: the blueprint is available again.
  it("ignores a job that is no longer active", () => {
    const stacks = consolidateBlueprints(copies, [
      { blueprint_id: 7021, status: "delivered", runs: 1 },
    ]);

    expect(stacks).toHaveLength(1);
  });

  it("carries the blueprint a card is drawn from", () => {
    const [stack] = consolidateBlueprints(copies);

    expect(stack.blueprint).toBe(stack.blueprints[0]);
    expect(stack.blueprint.me).toBe(10);
  });

  // An untouched original arrives from the market as one row carrying a quantity, and each of
  // those can take its own job, so counting rows would undercount the shelf.
  it("counts a market stack by the blueprints in it, not the rows", () => {
    const [stack] = consolidateBlueprints(
      rowsFor(characterBlueprintRows).filter((row) => row.quantity === 5)
    );

    expect(stack.blueprints).toHaveLength(1);
    expect(stackCount(stack)).toBe(5);
  });

  it("counts copies one apiece", () => {
    expect(stackCount(consolidateBlueprints(copies)[0])).toBe(3);
  });

  it("answers nothing for nothing held", () => {
    expect(consolidateBlueprints()).toEqual([]);
    expect(consolidateBlueprints([], [])).toEqual([]);
  });
});
