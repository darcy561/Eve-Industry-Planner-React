import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchWithCustomHeaders = vi.fn();

vi.mock("../fetchWithCustomHeaders", () => ({
  default: (...args) => fetchWithCustomHeaders(...args),
}));
vi.mock("../../Auth/esiCredentials/provider.js", () => ({
  getEsiAccessToken: async () => ({ accessToken: "token" }),
}));
vi.mock("../../../RawData/bpSkills.json", () => ({
  default: { 3446: { id: 3446 }, 16622: { id: 16622 } },
}));

const { default: getCharacterSkills } = await import("./getSkills");

const character = { CharacterHash: "hash-1", CharacterID: 90000001 };

const respond = ({ status = 200, body = { skills: [] } } = {}) =>
  fetchWithCustomHeaders.mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    headers: { get: () => "tag" },
    json: async () => body,
  });

beforeEach(() => vi.clearAllMocks());

/**
 * The broker fee and the sales tax are both quoted from these levels, so a
 * failed read that arrives as an empty map quotes the untrained rate for a
 * character who may hold both skills at five.
 */
describe("reading a character's skills", () => {
  it("maps the levels the character has trained", async () => {
    respond({
      body: {
        skills: [
          { skill_id: 3446, active_skill_level: 4, trained_skill_level: 5 },
        ],
      },
    });

    const { data } = await getCharacterSkills({ character });

    expect(data[3446]).toMatchObject({ activeLevel: 4, trainedLevel: 5 });
  });

  it("reads a skill the character has not trained as zero", async () => {
    respond({ body: { skills: [] } });

    const { data } = await getCharacterSkills({ character });

    expect(data[16622].activeLevel).toBe(0);
  });

  // Null is "we could not read"; a map of zeroes is "trained none of them". A
  // caller given the second for the first quotes a confident, wrong fee.
  it("gives no map at all when the token may not read them", async () => {
    respond({ status: 403 });

    const { data } = await getCharacterSkills({ character });

    expect(data).toBeNull();
  });

  it("throws on a server error rather than reporting untrained", async () => {
    respond({ status: 500 });

    await expect(getCharacterSkills({ character })).rejects.toThrow();
  });

  it("throws when the network is gone", async () => {
    fetchWithCustomHeaders.mockRejectedValue(new Error("offline"));

    await expect(getCharacterSkills({ character })).rejects.toThrow("offline");
  });

  it("throws rather than guessing for an incomplete character", async () => {
    await expect(
      getCharacterSkills({ character: { CharacterHash: "hash-1" } }),
    ).rejects.toThrow();
  });
});
