import { describe, expect, it } from "vitest";
import assembledShipIds from "./assembledShipIds";
import buildAssetNodes from "./buildAssetNodes";
import {
  assembledShipAssetRows,
  assetFixtureItemList,
  characterAssetRows,
  corporationOwnedStructureRows,
} from "../../tests/assetFixtures";

const hangar = buildAssetNodes(assembledShipAssetRows);
const shipIds = (collection = hangar, itemList = assetFixtureItemList) =>
  assembledShipIds(collection, itemList);

describe("the assembled ships in a collection", () => {
  it("takes a fitted ship", () => {
    expect(shipIds().has(7001)).toBe(true);
  });

  // Nothing about what it holds says it is a ship, because it holds nothing.
  it("takes a hull with nothing fitted and nothing aboard", () => {
    expect(shipIds().has(7008)).toBe(true);
  });

  // Stock rather than a ship in use: it stacks, and ESI marks it as not singleton.
  it("leaves a packaged hull alone", () => {
    expect(shipIds().has(7005)).toBe(false);
  });

  it("leaves a container alone", () => {
    expect(shipIds().has(7006)).toBe(false);
  });

  // A citadel carries rigs the way a ship does, and a corporation's assets include the structures
  // it owns, so rigs alone must not read as a ship.
  it("leaves a rigged structure alone", () => {
    expect(shipIds().has(7010)).toBe(false);
    expect(shipIds(buildAssetNodes(corporationOwnedStructureRows)).size).toBe(0);
  });

  it("answers nothing without a collection", () => {
    expect(assembledShipIds(null, assetFixtureItemList).size).toBe(0);
  });

  // The static item list is versioned and a hull can be newer than the build the browser holds, or
  // sit in a group the SDE gives no category for.
  describe("for a hull the item list cannot name", () => {
    it("falls back to the fittings it holds", () => {
      expect(shipIds(hangar, {}).has(7001)).toBe(true);
    });

    it("still leaves a container and a rigged structure alone", () => {
      const found = shipIds(hangar, {});
      expect(found.has(7006)).toBe(false);
      expect(found.has(7010)).toBe(false);
    });

    // Without a category and without fittings there is nothing left to go on, and a crate must not
    // be mistaken for a ship.
    it("leaves an empty hull it cannot name", () => {
      expect(shipIds(hangar, {}).has(7008)).toBe(false);
    });

    // The endpoint returns a ship's fitting but not the ship while it is in space, so the module is
    // a top row with no holder to hide.
    it("finds nothing to hide in a fitting whose ship is in space", () => {
      expect(shipIds(buildAssetNodes(characterAssetRows), {}).size).toBe(0);
    });
  });
});
