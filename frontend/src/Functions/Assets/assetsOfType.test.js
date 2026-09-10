import { describe, expect, it } from "vitest";
import assetsOfType from "./assetsOfType";
import buildAssetNodes from "./buildAssetNodes";
import {
  ASSET_SAFETY_ID,
  characterAssetRows,
  corporationAssetRows,
  JITA_STATION_ID,
  RAITARU_STRUCTURE_ID,
} from "../../tests/assetFixtures";

const characters = buildAssetNodes(characterAssetRows);
const corporation = buildAssetNodes(corporationAssetRows);

const flatten = (branches = []) =>
  branches.flatMap(({ node, children }) => [node.itemId, ...flatten(children)]);

describe("where a type is held", () => {
  // Asset safety is one of them: the stack is still the account's, and the dialogue is asking
  // where the material is.
  it("offers every location holding it", () => {
    const byLocation = assetsOfType(characters, 34);

    expect([...byLocation.keys()].sort((a, b) => a - b)).toEqual(
      [ASSET_SAFETY_ID, JITA_STATION_ID, RAITARU_STRUCTURE_ID].sort(
        (a, b) => a - b
      )
    );
  });

  // 1005 is Mexallon inside container 1004, itself inside container 1002 at the station. Both
  // containers are shown so the player can see which one to open.
  it("keeps the containers above a stack", () => {
    const byLocation = assetsOfType(characters, 36);

    expect(flatten(byLocation.get(JITA_STATION_ID))).toEqual([1002, 1004, 1005]);
  });

  it("leaves out what is not on a path to it", () => {
    const branches = assetsOfType(characters, 36).get(JITA_STATION_ID);

    // 1003 sits in the same container and is a different type.
    expect(flatten(branches)).not.toContain(1003);
  });

  // A matched container's contents are part of what the player was shown.
  it("keeps what is inside a match", () => {
    const branches = assetsOfType(characters, 3465).get(JITA_STATION_ID);

    expect(flatten(branches)).toEqual([1002, 1003, 1004, 1005, 1007, 1008]);
  });

  it("reads a corporation's office folder through to its hangar", () => {
    const branches = assetsOfType(corporation, 34).get(JITA_STATION_ID);

    // 2003 is in a crate in division three; the folder above them is not a row.
    expect(flatten(branches)).toEqual([2002, 2003]);
  });

  it("answers nothing for a type that is not held", () => {
    expect(assetsOfType(characters, 11399).size).toBe(0);
    expect(assetsOfType(characters, undefined).size).toBe(0);
    expect(assetsOfType(null, 34).size).toBe(0);
  });
});
