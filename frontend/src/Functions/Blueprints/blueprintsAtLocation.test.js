import { describe, expect, it } from "vitest";
import blueprintsAtLocation from "./blueprintsAtLocation";

const rows = [{ itemId: 1 }, { itemId: 2 }, { itemId: 3 }];
const locationIds = new Map([
  [1, 60003760],
  [2, 60003760],
]);

describe("the blueprints held at a location", () => {
  it("offers every blueprint when no location is asked for", () => {
    expect(blueprintsAtLocation(rows, locationIds)).toBe(rows);
  });

  it("offers the ones held there", () => {
    expect(
      blueprintsAtLocation(rows, locationIds, 60003760).map((r) => r.itemId)
    ).toEqual([1, 2]);
  });

  // Row 3's location is unknown, which is not an answer to "what is at this station".
  it("leaves out a blueprint the assets do not place", () => {
    expect(
      blueprintsAtLocation(rows, locationIds, 60003760).some(
        (r) => r.itemId === 3
      )
    ).toBe(false);
  });

  it("offers nothing for a location holding none", () => {
    expect(blueprintsAtLocation(rows, locationIds, 60008494)).toEqual([]);
  });
});
