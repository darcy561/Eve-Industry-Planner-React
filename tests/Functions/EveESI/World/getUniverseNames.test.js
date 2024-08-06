import { describe, it, expect, vi, beforeEach } from "vitest";
import getUniverseNames from "../../../../src/Functions/EveESI/World/getUniverseNames";

describe("getUniverseNames", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockClear();
    global.fetch = mockFetch;
  });

  it("returns universe names for valid input array", async () => {
    const mockResponse = [
      { id: 1, name: "Location1" },
      { id: 2, name: "Location2" },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await getUniverseNames([1, 2]);

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://esi.evetech.net/latest/universe/names/?datasource=tranquility",
      {
        method: "POST",
        body: JSON.stringify([1, 2]),
      }
    );
  });

  it("returns universe names for valid input set", async () => {
    const mockResponse = [
      { id: 1, name: "Location1" },
      { id: 2, name: "Location2" },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await getUniverseNames(new Set([1, 2]));

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://esi.evetech.net/latest/universe/names/?datasource=tranquility",
      {
        method: "POST",
        body: JSON.stringify([1, 2]),
      }
    );
  });

  it("throws error for missing input", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getUniverseNames();

    expect(result).toEqual({});
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error retrieving universe data: Error: Input information is incomplete."
    );

    consoleSpy.mockRestore();
  });

  it("handles API failure", async () => {
    mockFetch.mockRejectedValue(new Error("API request failed"));

    const result = await getUniverseNames([1, 2]);

    expect(result).toEqual({});
  });
});
