import { describe, expect, it } from "vitest";
import assetLocationIds from "./assetLocationIds";
import buildAssetNodes from "./buildAssetNodes";
import {
  ASSET_SAFETY_ID,
  characterAssetRows,
  inSpaceAssetRows,
  JITA_STATION_ID,
  RAITARU_STRUCTURE_ID,
} from "../../tests/assetFixtures";

describe("the locations a collection's assets sit at", () => {
  it("offers a station and a structure once each, however deep the asset is", () => {
    const ids = assetLocationIds(buildAssetNodes(characterAssetRows));

    expect(ids).toContain(JITA_STATION_ID);
    expect(ids).toContain(RAITARU_STRUCTURE_ID);
    expect(ids.filter((id) => id === JITA_STATION_ID)).toHaveLength(1);
  });

  // Items there are held by CONCORD awaiting delivery, not somewhere a player can work from.
  it("leaves out asset safety", () => {
    const ids = assetLocationIds(buildAssetNodes(characterAssetRows));

    expect(ids).not.toContain(ASSET_SAFETY_ID);
  });

  it("offers a system an asset sits in", () => {
    const ids = assetLocationIds(buildAssetNodes(inSpaceAssetRows));

    expect(ids).toEqual([31000123, 32000456]);
  });

  it("answers nothing for an empty collection", () => {
    expect(assetLocationIds(buildAssetNodes([]))).toEqual([]);
    expect(assetLocationIds(undefined)).toEqual([]);
  });
});
