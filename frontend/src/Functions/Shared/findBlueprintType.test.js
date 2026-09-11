import { beforeEach, describe, expect, it, vi } from "vitest";

const { collection } = vi.hoisted(() => ({ collection: { current: null } }));

vi.mock("../../Hooks/EveEsi/useBlueprintIndex", () => ({
  BLUEPRINT_SCOPE: { ALL: "all" },
  getCachedBlueprintIndex: () => collection.current,
}));

import findBlueprintType from "./findBlueprintType";
import buildBlueprintRows from "../Blueprints/buildBlueprintRows";
import {
  blueprintSearchIndex,
  characterBlueprintRows,
  reactionFormulaStackRow,
} from "../../tests/blueprintFixtures";

const AN_ORIGINAL = 7001;
const A_COPY = 7003;

beforeEach(() => {
  collection.current = buildBlueprintRows(
    [...characterBlueprintRows, reactionFormulaStackRow],
    blueprintSearchIndex,
  );
});

describe("findBlueprintType", () => {
  it("calls an original an original", () => {
    expect(findBlueprintType(AN_ORIGINAL, null)).toBe("bp");
  });

  it("calls a copy a copy", () => {
    expect(findBlueprintType(A_COPY, null)).toBe("bpc");
  });

  // A reaction formula carries no copy state at all, so it is never a copy.
  it("calls a reaction formula an original", () => {
    expect(findBlueprintType(reactionFormulaStackRow.item_id, null)).toBe("bp");
  });

  // A job built from a blueprint the account does not hold is not built from an original.
  it("calls a blueprint it does not hold a copy", () => {
    expect(findBlueprintType(999999999, null)).toBe("bpc");
  });

  it("calls a missing id a copy without consulting the collection", () => {
    collection.current = null;

    expect(findBlueprintType(undefined, null)).toBe("bpc");
    expect(findBlueprintType(0, null)).toBe("bpc");
  });
});
