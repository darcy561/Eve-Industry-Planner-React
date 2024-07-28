import { describe, it, expect, vi, beforeEach } from "vitest";
import getUniverseNames from "../../../../src/Functions/EveESI/World/getUniverseNames";

const mockFetch = vi.fn();

const inputIDs = [60003760, 60010000];
const userObj = { aToken: "valid-token" };
const universeResponse = [
  { id: 60003760, name: "Jita" },
  { id: 60010000, name: "Amarr" },
];

beforeEach(() => {
  mockFetch.mockClear();
  global.fetch = mockFetch;
});

describe("getUniverseNames", () => {
  it("should retrieve universe names successfully with array input", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => universeResponse,
    });

    const result = await getUniverseNames(inputIDs, userObj);

    expect(result).toEqual({
      60003760: { id: 60003760, name: "Jita" },
      60010000: { id: 60010000, name: "Amarr" },
    });
  });

  it("should retrieve universe names successfully with set input", async () => {
    const inputAsSet = new Set(inputIDs);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => universeResponse,
    });

    const result = await getUniverseNames(inputAsSet, userObj);

    expect(result).toEqual({
      60003760: { id: 60003760, name: "Jita" },
      60010000: { id: 60010000, name: "Amarr" },
    });
  });

  it("should handle invalid input types and return an empty object", async () => {
    await expect(getUniverseNames(null, userObj)).resolves.toEqual({});
    await expect(getUniverseNames([60003760], null)).resolves.toEqual({});
    await expect(getUniverseNames({}, userObj)).resolves.toEqual({});
    await expect(getUniverseNames(true, userObj)).resolves.toEqual({});
  });

  it("should handle API errors for universe names and return an empty object", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const result = await getUniverseNames(inputIDs, userObj);
    expect(result).toEqual({});

    // Simulate network error
    mockFetch.mockRejectedValueOnce(new Error("Network Error"));
    const result2 = await getUniverseNames(inputIDs, userObj);
    expect(result2).toEqual({});
  });
});
