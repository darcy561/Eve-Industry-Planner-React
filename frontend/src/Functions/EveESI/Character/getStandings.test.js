import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchWithCustomHeaders = vi.fn();

vi.mock("../fetchWithCustomHeaders", () => ({
  default: (...args) => fetchWithCustomHeaders(...args),
}));
vi.mock("../../Auth/esiCredentials/provider.js", () => ({
  getEsiAccessToken: async () => ({ accessToken: "token" }),
}));

const { default: getCharacterStandings } = await import("./getStandings");

const character = { CharacterHash: "hash-1", CharacterID: 90000001 };

const respond = ({ status = 200, body = [], etag = "tag" } = {}) =>
  fetchWithCustomHeaders.mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    headers: { get: () => etag },
    json: async () => body,
  });

beforeEach(() => vi.clearAllMocks());

/**
 * What a caller can tell apart matters more here than what is returned: a fee
 * quoted from standings that failed to load is wrong, and for a long time every
 * failure arrived as an empty list that read as "this character has no standing
 * anywhere".
 */
describe("reading a character's standings", () => {
  it("returns the standings the character holds", async () => {
    respond({ body: [{ from_id: 500001, from_type: "faction", standing: 5 }] });

    const { data } = await getCharacterStandings({ character });

    expect(data).toHaveLength(1);
  });

  it("treats an empty body as a character who holds none", async () => {
    respond({ status: 204 });

    const { data } = await getCharacterStandings({ character });

    expect(data).toEqual([]);
  });

  // The distinction the whole fix rests on: null is "we could not read", [] is
  // "there are none". A caller that gets [] for both quotes the wrong fee.
  it("gives no list at all when the token may not read them", async () => {
    respond({ status: 403 });

    const { data } = await getCharacterStandings({ character });

    expect(data).toBeNull();
  });

  it("throws on a server error rather than reporting no standings", async () => {
    respond({ status: 500 });

    await expect(getCharacterStandings({ character })).rejects.toThrow();
  });

  it("throws on a client error it cannot interpret", async () => {
    respond({ status: 420 });

    await expect(getCharacterStandings({ character })).rejects.toThrow();
  });

  it("throws when the network is gone", async () => {
    fetchWithCustomHeaders.mockRejectedValue(new Error("offline"));

    await expect(getCharacterStandings({ character })).rejects.toThrow("offline");
  });

  it("throws rather than guessing for an incomplete character", async () => {
    await expect(
      getCharacterStandings({ character: { CharacterHash: "hash-1" } }),
    ).rejects.toThrow();
  });
});
