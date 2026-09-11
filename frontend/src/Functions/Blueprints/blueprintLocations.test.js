import { describe, expect, it } from "vitest";
import blueprintLocations from "./blueprintLocations";
import buildBlueprintRows from "./buildBlueprintRows";
import buildAssetNodes from "../Assets/buildAssetNodes";
import { blueprintSearchIndex } from "../../tests/blueprintFixtures";
import { JITA_STATION_ID } from "../../tests/assetFixtures";

const BLUEPRINT_ITEM_ID = 7001;
const CONTAINER_ITEM_ID = 8001;

const blueprints = buildBlueprintRows(
  [
    {
      item_id: BLUEPRINT_ITEM_ID,
      type_id: 686,
      location_id: CONTAINER_ITEM_ID,
      location_flag: "Unlocked",
      quantity: -1,
      material_efficiency: 5,
      time_efficiency: 10,
      runs: -1,
    },
  ],
  blueprintSearchIndex,
);

// The blueprint is in a container at the station, so its own location_id names the container.
const assets = buildAssetNodes([
  {
    item_id: CONTAINER_ITEM_ID,
    type_id: 3465,
    quantity: 1,
    location_flag: "Hangar",
    location_id: JITA_STATION_ID,
    location_type: "station",
  },
  {
    item_id: BLUEPRINT_ITEM_ID,
    type_id: 686,
    quantity: -1,
    location_flag: "Unlocked",
    location_id: CONTAINER_ITEM_ID,
    location_type: "item",
  },
]);

describe("where a blueprint sits", () => {
  it("reads the place through the assets rather than the raw holder", () => {
    const byItemId = blueprintLocations(blueprints, assets);

    expect(blueprints.byItemId.get(BLUEPRINT_ITEM_ID).locationId).toBe(
      CONTAINER_ITEM_ID,
    );
    expect(byItemId.get(BLUEPRINT_ITEM_ID)).toBe(JITA_STATION_ID);
  });

  it("says nothing for a blueprint the loaded assets do not cover", () => {
    expect(blueprintLocations(blueprints, buildAssetNodes([])).size).toBe(0);
    expect(blueprintLocations(blueprints, null).size).toBe(0);
    expect(blueprintLocations(null, assets).size).toBe(0);
  });
});
