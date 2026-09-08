import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetchWithCustomHeaders, mockGetEsiAccessToken } = vi.hoisted(() => ({
  mockFetchWithCustomHeaders: vi.fn(),
  mockGetEsiAccessToken: vi.fn(),
}));
vi.mock("../fetchWithCustomHeaders", () => ({ default: mockFetchWithCustomHeaders }));
vi.mock("../../Auth/esiCredentials/provider.js", () => ({
  getEsiAccessToken: mockGetEsiAccessToken,
}));

import getCharacterSkills from "./getSkills.js";

describe("character skills fetcher", () => {
  beforeEach(() => {
    mockFetchWithCustomHeaders.mockReset();
    mockGetEsiAccessToken.mockReset();
    mockFetchWithCustomHeaders.mockResolvedValue({
      status: 200,
      headers: { get: () => "etag-1" },
      json: async () => ({ skills: [] }),
    });
  });

  // A fetcher acquires its own token rather than reading one someone else kept fresh. That is what
  // makes the background refresh clocks unnecessary.
  it("acquires a token and sends it", async () => {
    mockGetEsiAccessToken.mockResolvedValue({ accessToken: "fresh-token", exp: 1 });

    await getCharacterSkills({ character: { CharacterID: 42, CharacterHash: "owner-hash" } });

    expect(mockGetEsiAccessToken).toHaveBeenCalledWith("owner-hash");
    const [, options] = mockFetchWithCustomHeaders.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer fresh-token");
  });

  it("does not call ESI when no token can be acquired", async () => {
    mockGetEsiAccessToken.mockRejectedValue(new Error("no credentials"));

    const result = await getCharacterSkills({
      character: { CharacterID: 42, CharacterHash: "owner-hash" },
    });

    expect(mockFetchWithCustomHeaders).not.toHaveBeenCalled();
    expect(result).toEqual({ data: {} });
  });
});
