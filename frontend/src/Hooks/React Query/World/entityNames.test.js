import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

const getUniverseNames = vi.fn();

vi.mock("../../../Functions/EveESI/World/getUniverseNames", () => ({
  default: (...args) => getUniverseNames(...args),
}));

const { entityNamesQuery } = await import("./entityNames");

const client = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

beforeEach(() => vi.clearAllMocks());

/**
 * Ids are what the app works in and what a reader cannot check. Without the name
 * behind one, a standing the seller does not hold reads the same whichever
 * entity was asked about — so a right answer and a lookup pointed at the wrong
 * entity are indistinguishable.
 */
describe("the names behind a set of ids", () => {
  it("keys ESI's list by id, because a lookup against a list finds nothing", async () => {
    getUniverseNames.mockResolvedValue([
      { id: 500001, name: "Caldari State", category: "faction" },
      { id: 1000035, name: "Caldari Navy", category: "corporation" },
    ]);

    const named = await client().fetchQuery(entityNamesQuery([500001, 1000035]));

    expect(named[500001].name).toBe("Caldari State");
    expect(named[1000035].name).toBe("Caldari Navy");
  });

  it("asks for each id once, however many times it is named", async () => {
    getUniverseNames.mockResolvedValue([]);

    await client().fetchQuery(entityNamesQuery([500001, 500001, null, 500001]));

    expect(getUniverseNames).toHaveBeenCalledWith([500001]);
  });

  // The key is built from the ids, so two callers wanting the same pair share a
  // result whichever order they name them in.
  it("gives the same key whichever order the ids arrive in", () => {
    expect(entityNamesQuery([2, 1]).queryKey).toEqual(
      entityNamesQuery([1, 2]).queryKey,
    );
  });

  // `fetchQuery` fetches whatever it is given and never consults `enabled`, so
  // the empty case has to be refused inside the query itself.
  it("asks ESI for nothing when there is nothing to name", async () => {
    const named = await client().fetchQuery(entityNamesQuery([null, undefined]));

    expect(getUniverseNames).not.toHaveBeenCalled();
    expect(named).toEqual({});
  });

  // Held for the session, since names do not change — so an answer the app could
  // not read must not be kept as though it were an empty one. A rejected query is
  // retried; a cached empty is not.
  it("fails on a shape it cannot read rather than caching it as no names", async () => {
    getUniverseNames.mockResolvedValue(undefined);

    await expect(
      client().fetchQuery({ ...entityNamesQuery([500001]), retry: false }),
    ).rejects.toThrow("expected a list");
  });
});

// The lookup throws rather than answering with nothing: a failed call and a set
// of ids ESI knows nothing about are different answers, and only one of them is
// worth remembering. The query has to let that through rather than turn it back
// into an empty result, or every caller caches the failure for the session.
describe("a lookup that fails", () => {
  it("fails the query rather than resolving to no names", async () => {
    getUniverseNames.mockRejectedValue(new Error("universe names: request failed"));

    await expect(
      client().fetchQuery({ ...entityNamesQuery([500001]), retry: false }),
    ).rejects.toThrow("request failed");
  });

  // It throws on an empty request too, which is why the empty case never
  // reaches it.
  it("never asks it for nothing", async () => {
    getUniverseNames.mockRejectedValue(new Error("nothing requested"));

    await expect(
      client().fetchQuery(entityNamesQuery([])),
    ).resolves.toEqual({});
  });
});
