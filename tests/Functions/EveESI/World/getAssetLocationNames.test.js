import { describe, it, expect, vi, beforeEach } from "vitest";
import getAssetLocationNames from "../../../../src/Functions/EveESI/World/getAssetLocationNames";

const mockFetch = vi.fn();

const character = {
  CharacterID: 12345,
  corporation_id: 67890,
  aToken: "valid-token",
};

beforeEach(() => {
  mockFetch.mockClear();
  global.fetch = mockFetch;
});

describe("getAssetLocationNames", () => {
  it("should retrieve asset names successfully", async () => {
    const locationIDs = [1, 2, 3, 4, 5];
    const mockResponse = [
      { item_id: 1, name: "Asset1" },
      { item_id: 2, name: "Asset2" },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await getAssetLocationNames(character, locationIDs);

    expect(result.size).toBe(2);
    expect(result.get(1).name).toBe("Asset1");
    expect(result.get(2).name).toBe("Asset2");
  });

  it("should handle any error and return an empty map", async () => {
    // Simulate API error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const result = await getAssetLocationNames(character, [1, 2, 3]);
    expect(result).toEqual(new Map());

    mockFetch.mockRejectedValueOnce(new Error("Network Error"));
    const result2 = await getAssetLocationNames(character, [1, 2, 3]);
    expect(result2).toEqual(new Map());
  });

  it("should handle invalid token and return an empty map", async () => {
    const locationIDs = [1, 2, 3];

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });

    const result = await getAssetLocationNames(character, locationIDs);
    expect(result).toEqual(new Map());
  });

  it("should handle invalid inputs and return an empty map", async () => {
    await expect(getAssetLocationNames(character, null)).resolves.toEqual(
      new Map()
    );
    await expect(getAssetLocationNames(null, [1, 2, 3])).resolves.toEqual(
      new Map()
    );
    await expect(getAssetLocationNames(character, {})).resolves.toEqual(
      new Map()
    );
  });

  it("should convert a Set of locationIDs to an array successfully", async () => {
    const locationIDsSet = new Set([1, 2, 3, 4, 5]);
    const mockResponse = [
      { item_id: 1, name: "Asset1" },
      { item_id: 2, name: "Asset2" },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await getAssetLocationNames(character, locationIDsSet);

    expect(result.size).toBe(2);
    expect(result.get(1).name).toBe("Asset1");
    expect(result.get(2).name).toBe("Asset2");
  });
});
