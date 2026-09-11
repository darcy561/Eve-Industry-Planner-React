import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

vi.mock("../fetchWithCustomHeaders", () => ({
  default: (...args) => fetchMock(...args),
}));

import getUniverseNames from "./getUniverseNames";
import { LocationResolutionError } from "./locationOutcome";

const JITA = 60003760;

beforeEach(() => {
  fetchMock.mockReset();
});

describe("getUniverseNames", () => {
  it("answers with ESI's list", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: JITA, name: "Jita IV-4", category: "station" }],
    });

    await expect(getUniverseNames([JITA])).resolves.toEqual([
      { id: JITA, name: "Jita IV-4", category: "station" },
    ]);
  });

  // The names never change, so a caller caches this answer for the session: an empty list must mean
  // "ESI knows nothing about these ids", never "the request did not work".
  it.each([404, 420, 500, 503])(
    "throws rather than answering with nothing on %i",
    async (status) => {
      fetchMock.mockResolvedValue({ ok: false, status, statusText: "no" });

      await expect(getUniverseNames([JITA])).rejects.toBeInstanceOf(
        LocationResolutionError
      );
    }
  );

  // A lenient shape guard here is worse than a strict one: the caller settles what it did not hear
  // about as unnamed, and keeps that for the session.
  it.each([{}, null, "not a list"])(
    "throws rather than answering with an empty list on an unreadable body (%s)",
    async (body) => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => body,
      });

      await expect(getUniverseNames([JITA])).rejects.toBeInstanceOf(
        LocationResolutionError
      );
    }
  );

  it("throws when the request fails outright", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(getUniverseNames([JITA])).rejects.toBeInstanceOf(
      LocationResolutionError
    );
  });

  it("refuses ids it cannot work with", async () => {
    await expect(getUniverseNames()).rejects.toBeInstanceOf(
      LocationResolutionError
    );
    await expect(getUniverseNames("60003760")).rejects.toBeInstanceOf(
      LocationResolutionError
    );
  });

  it("takes a Set as well as an array", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [] });

    await getUniverseNames(new Set([JITA]));

    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify([JITA]));
  });
});
