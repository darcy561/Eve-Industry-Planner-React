import { describe, expect, it } from "vitest";
import filterLibraryBlueprints, {
  LIBRARY_FILTER,
} from "./filterLibraryBlueprints";
import buildBlueprintRows from "./buildBlueprintRows";
import {
  blueprintSearchIndex,
  characterBlueprintRows,
  corporationBlueprintRows,
  reactionFormulaStackRow,
} from "../../tests/blueprintFixtures";

const { rows } = buildBlueprintRows(
  [
    ...characterBlueprintRows,
    ...corporationBlueprintRows,
    reactionFormulaStackRow,
  ],
  blueprintSearchIndex,
);

const ids = (result) => result.map((row) => row.itemId).sort((a, b) => a - b);

describe("the blueprint library's filters", () => {
  it("offers everything held", () => {
    expect(filterLibraryBlueprints(rows, LIBRARY_FILTER.ALL)).toHaveLength(
      rows.length,
    );
  });

  it("offers everything for a filter it does not know", () => {
    expect(filterLibraryBlueprints(rows, "nonsense")).toHaveLength(rows.length);
  });

  it("narrows to what a job type builds", () => {
    const manufacturing = filterLibraryBlueprints(
      rows,
      LIBRARY_FILTER.MANUFACTURING,
    );
    const reactions = filterLibraryBlueprints(rows, LIBRARY_FILTER.REACTIONS);

    expect(manufacturing.every((row) => row.jobType === 1)).toBe(true);
    expect(reactions.every((row) => row.jobType === 2)).toBe(true);
    // A blueprint whose product the search index does not carry belongs to neither.
    expect(manufacturing.length + reactions.length).toBeLessThan(rows.length);
  });

  it("separates originals from copies within manufacturing", () => {
    const originals = filterLibraryBlueprints(rows, LIBRARY_FILTER.BPO);
    const copies = filterLibraryBlueprints(rows, LIBRARY_FILTER.BPC);

    expect(originals.every((row) => !row.isCopy && row.jobType === 1)).toBe(
      true,
    );
    expect(copies.every((row) => row.isCopy && row.jobType === 1)).toBe(true);
    expect(ids(originals).some((id) => ids(copies).includes(id))).toBe(false);
  });

  // A reaction formula is never a copy, so it belongs to neither original nor copy view — both are
  // manufacturing-only.
  it("leaves reaction formulas out of the original and copy views", () => {
    const formula = reactionFormulaStackRow.item_id;

    expect(
      ids(filterLibraryBlueprints(rows, LIBRARY_FILTER.BPO)),
    ).not.toContain(formula);
    expect(
      ids(filterLibraryBlueprints(rows, LIBRARY_FILTER.BPC)),
    ).not.toContain(formula);
  });

  describe("the blueprints currently building", () => {
    it("offers the ones an active job names", () => {
      const running = rows[0];
      const result = filterLibraryBlueprints(rows, LIBRARY_FILTER.ACTIVE, [
        { blueprint_id: running.itemId, status: "active" },
        { blueprint_id: rows[1].itemId, status: "delivered" },
      ]);

      expect(ids(result)).toEqual([running.itemId]);
    });

    it("offers nothing when no job is running", () => {
      expect(filterLibraryBlueprints(rows, LIBRARY_FILTER.ACTIVE, [])).toEqual(
        [],
      );
      expect(filterLibraryBlueprints(rows, LIBRARY_FILTER.ACTIVE)).toEqual([]);
    });
  });
});
