import { beforeEach, describe, expect, it, vi } from "vitest";

const { collection } = vi.hoisted(() => ({ collection: { current: null } }));

vi.mock("../../Hooks/EveEsi/useBlueprintIndex", () => ({
  BLUEPRINT_SCOPE: { ALL: "all" },
  getCachedBlueprintIndex: () => collection.current,
}));

import { getAvailableBlueprintsByMaterialID } from "./getAvailableBlueprints";
import buildBlueprintRows from "../Blueprints/buildBlueprintRows";
import {
  blueprintSearchIndex,
  characterBlueprintRows,
  RIFTER_TYPE_ID,
} from "../../tests/blueprintFixtures";

beforeEach(() => {
  collection.current = buildBlueprintRows(
    characterBlueprintRows,
    blueprintSearchIndex
  );
});

describe("the blueprints an account can build from", () => {
  it("names what those blueprints produce", () => {
    const producible = getAvailableBlueprintsByMaterialID(null);

    expect(producible.has(RIFTER_TYPE_ID)).toBe(true);
  });

  // It used to await the cached search index to perform this join. The product is resolved onto the
  // row when the collection is built, so there is nothing left to await.
  it("answers without awaiting", () => {
    expect(getAvailableBlueprintsByMaterialID(null)).toBeInstanceOf(Set);
  });

  it("leaves out a blueprint whose product is not in the search index", () => {
    const producible = getAvailableBlueprintsByMaterialID(null);

    expect(producible.has(null)).toBe(false);
    expect(producible.has(undefined)).toBe(false);
  });

  it("answers empty when the account holds no blueprints", () => {
    collection.current = buildBlueprintRows([], blueprintSearchIndex);

    expect(getAvailableBlueprintsByMaterialID(null).size).toBe(0);
  });
});
