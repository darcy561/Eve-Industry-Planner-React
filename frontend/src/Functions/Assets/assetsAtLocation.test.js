import { describe, expect, it } from "vitest";
import assetsAtLocation from "./assetsAtLocation";
import buildAssetNodes from "./buildAssetNodes";
import {
  characterAssetRows,
  corporationAssetRows,
  JITA_STATION_ID,
} from "../../tests/assetFixtures";

const characters = buildAssetNodes(characterAssetRows);
const corporation = buildAssetNodes(corporationAssetRows);

const quantityOf = (byTypeId, typeId) =>
  (byTypeId.get(typeId) ?? []).reduce((total, node) => total + node.quantity, 0);

describe("the assets at a location", () => {
  it("groups them by what they are", () => {
    const byTypeId = assetsAtLocation(characters, JITA_STATION_ID);

    expect(byTypeId.get(34).map((node) => node.itemId).sort()).toEqual([
      1001, 1006,
    ]);
  });

  // 1003 sits in a container and 1005 in a container inside that one. Both are at the station,
  // which is what the node's resolved location says.
  it("counts what is inside containers there", () => {
    const byTypeId = assetsAtLocation(characters, JITA_STATION_ID);

    expect(byTypeId.has(35)).toBe(true);
    expect(byTypeId.has(36)).toBe(true);
    expect(quantityOf(byTypeId, 36)).toBe(10);
  });

  it("leaves out another location's assets", () => {
    const byTypeId = assetsAtLocation(characters, JITA_STATION_ID);
    const everyItemId = [...byTypeId.values()].flat().map((node) => node.itemId);

    // 1009 is in asset safety and 1011 in a structure.
    expect(everyItemId).not.toContain(1009);
    expect(everyItemId).not.toContain(1011);
  });

  it("answers nothing for a location holding nothing", () => {
    expect(assetsAtLocation(characters, 60000001).size).toBe(0);
  });

  it("answers nothing without a location or a collection", () => {
    expect(assetsAtLocation(characters, undefined).size).toBe(0);
    expect(assetsAtLocation(null, JITA_STATION_ID).size).toBe(0);
  });

  describe("narrowed to a compartment", () => {
    it("takes only that hangar division", () => {
      const byTypeId = assetsAtLocation(
        corporation,
        JITA_STATION_ID,
        "CorpSAG1"
      );

      expect([...byTypeId.values()].flat().map((n) => n.itemId)).toEqual([2004]);
    });

    // 2003 sits in a crate that sits in division three. It is in division three.
    it("counts what is inside a container in that division", () => {
      const byTypeId = assetsAtLocation(
        corporation,
        JITA_STATION_ID,
        "CorpSAG3"
      );

      const itemIds = [...byTypeId.values()].flat().map((n) => n.itemId).sort();
      expect(itemIds).toEqual([2002, 2003]);
    });

    it("answers nothing for a division holding nothing", () => {
      expect(
        assetsAtLocation(corporation, JITA_STATION_ID, "CorpSAG7").size
      ).toBe(0);
    });
  });
});
