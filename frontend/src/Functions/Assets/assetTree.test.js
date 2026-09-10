import { describe, expect, it } from "vitest";
import buildAssetNodes from "./buildAssetNodes";
import {
  assetRowsByLocation,
  namedContainerIds,
  rowsByCompartment,
  sortNodesByName,
} from "./assetTree";
import {
  characterAssetRows,
  corporationAssetRows,
  JITA_STATION_ID,
} from "../../tests/assetFixtures";

const characters = buildAssetNodes(characterAssetRows);
const corporation = buildAssetNodes(corporationAssetRows);

const itemIds = (nodes) => nodes.map((node) => node.itemId).sort((a, b) => a - b);

describe("the top rows at a location", () => {
  it("takes what sits directly there and not what is inside a container", () => {
    const rows = assetRowsByLocation(characters).get(JITA_STATION_ID);

    // 1003 and 1005 are inside container 1002, and 1008 inside 1007.
    expect(itemIds(rows)).toEqual([1001, 1002, 1006, 1007]);
  });

  it("narrows on the compartment a row sits in", () => {
    const deliveries = assetRowsByLocation(characters, {
      rootFlags: ["Deliveries"],
    });

    expect(itemIds(deliveries.get(JITA_STATION_ID))).toEqual([1006, 1007]);
  });

  // The raw location_flag cannot express this: item 1008 sits inside the delivered container and
  // carries "Unlocked", so a filter on the raw flag would leave it in the Assets view.
  it("keeps a container's contents with the compartment holding it", () => {
    const assets = assetRowsByLocation(characters, {
      excludeRootFlags: ["Deliveries", "AssetSafety"],
    });
    const shown = assets.get(JITA_STATION_ID);

    expect(itemIds(shown)).toEqual([1001, 1002]);
    expect(characters.byItemId.get(1008).rootFlag).toBe("Deliveries");
  });

  it("reads an office folder through rather than as a row", () => {
    const rows = assetRowsByLocation(corporation).get(JITA_STATION_ID);

    // 2001 is the folder itself; 2002 and 2004 are the hangar contents inside it.
    expect(itemIds(rows)).toEqual([2002, 2004]);
  });

  // Blueprints are left out of the asset views, so a location holding only those is not a location
  // the view has anything to show for.
  it("leaves out the items it was told to exclude", () => {
    const rows = assetRowsByLocation(characters, {
      excludeItemIds: new Set([1001]),
    }).get(JITA_STATION_ID);

    expect(itemIds(rows)).toEqual([1002, 1006, 1007]);
  });

  // A corporation renting an office it has emptied still rents it.
  it("keeps a named location that holds nothing", () => {
    const rows = assetRowsByLocation(corporation, {
      includeLocations: [60008494],
    });

    expect(rows.get(60008494)).toEqual([]);
  });

  it("answers nothing without a collection", () => {
    expect(assetRowsByLocation(null).size).toBe(0);
  });
});

describe("a location's rows split by compartment", () => {
  it("keys each hangar division by its flag", () => {
    const rows = assetRowsByLocation(corporation).get(JITA_STATION_ID);
    const byFlag = rowsByCompartment(rows);

    expect(itemIds(byFlag.get("CorpSAG1"))).toEqual([2004]);
    expect(itemIds(byFlag.get("CorpSAG3"))).toEqual([2002]);
    expect(byFlag.has("CorpSAG7")).toBe(false);
  });
});

describe("ordering rows for display", () => {
  const fullItemList = { 34: { name: "Tritanium" }, 3465: { name: "Container" } };

  it("orders by the name of what the row is", () => {
    const rows = [
      characters.byItemId.get(1001),
      characters.byItemId.get(1002),
    ];

    expect(sortNodesByName(rows, fullItemList).map((n) => n.itemId)).toEqual([
      1002, 1001,
    ]);
  });

  // The collection is shared by every consumer of the scope.
  it("leaves the collection's own ordering alone", () => {
    const rows = assetRowsByLocation(characters).get(JITA_STATION_ID);
    const before = rows.map((node) => node.itemId);

    sortNodesByName(rows, fullItemList);

    expect(rows.map((node) => node.itemId)).toEqual(before);
  });
});

describe("the containers worth naming", () => {
  it("offers what holds something", () => {
    expect(namedContainerIds(characters).sort((a, b) => a - b)).toEqual([
      1002, 1004, 1007,
    ]);
  });

  // The folder carries no player-given name; its hangars are not containers.
  it("leaves out an office folder", () => {
    expect(namedContainerIds(corporation)).toEqual([2002]);
  });
});
