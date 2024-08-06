// getWorldData.test.js

import { describe, it, expect, vi, beforeEach } from "vitest";
import getWorldData from "../../../../src/Functions/EveESI/World/getWorldData";
import getCitadelData from "../../../../src/Functions/EveESI/World/getCitadelData";
import getUniverseNames from "../../../../src/Functions/EveESI/World/getUniverseNames";

vi.mock("../../../../src/Functions/EveESI/World/getCitadelData");
vi.mock("../../../../src/Functions/EveESI/World/getUniverseNames");

const inputIDs = [60003760, 60010000];
const userObj = { aToken: "valid-token" };
const universeResponse = [
  { id: 60003760, name: "Jita" },
  { id: 60010000, name: "Amarr" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getWorldData", () => {
  it("should retrieve world data successfully with array input", async () => {
    getUniverseNames.mockResolvedValueOnce(universeResponse);

    const result = await getWorldData(inputIDs, userObj);

    expect(result).toEqual({
      60003760: { id: 60003760, name: "Jita" },
      60010000: { id: 60010000, name: "Amarr" },
    });
  });

  it("should retrieve world data successfully with set input", async () => {
    const inputAsSet = new Set(inputIDs);
    getUniverseNames.mockResolvedValueOnce(universeResponse);

    const result = await getWorldData(inputAsSet, userObj);

    expect(result).toEqual({
      60003760: { id: 60003760, name: "Jita" },
      60010000: { id: 60010000, name: "Amarr" },
    });
  });

  it("should handle invalid input types and return an empty object", async () => {
    await expect(getWorldData(null, userObj)).resolves.toEqual({});
    await expect(getWorldData([60003760], null)).resolves.toEqual({});
    await expect(getWorldData({}, userObj)).resolves.toEqual({});
    await expect(getWorldData(true, userObj)).resolves.toEqual({});
  });

  it("should handle API errors for universe names and return an empty object", async () => {
    getUniverseNames.mockResolvedValueOnce([]);
    getCitadelData.mockResolvedValueOnce([]);

    const result = await getWorldData(inputIDs, userObj);
    expect(result).toEqual({});

    // Simulate network error
    getUniverseNames.mockRejectedValueOnce(new Error("Network Error"));
    const result2 = await getWorldData(inputIDs, userObj);
    expect(result2).toEqual({});
  });
});
