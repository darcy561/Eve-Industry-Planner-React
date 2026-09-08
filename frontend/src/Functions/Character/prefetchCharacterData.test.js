import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockStartQueryTracking, mockLogWaterfall } = vi.hoisted(() => ({
  mockStartQueryTracking: vi.fn(() => () => 1),
  mockLogWaterfall: vi.fn(),
}));
vi.mock("../Debugging/queryWaterfallLogger", () => ({
  ENABLE_QUERY_WATERFALL_LOGGING: false,
  logWaterfall: mockLogWaterfall,
  startQueryTracking: mockStartQueryTracking,
}));

import {
  CHARACTER_PREFETCH_QUERIES,
  prefetchCharacterData,
  prefetchMultipleCharacters,
} from "./prefetchCharacterData.js";

function queryClientSpy(impl = async () => ({})) {
  return { fetchQuery: vi.fn(impl) };
}

// Pinned by name, not by the table's own length: a count taken from the implementation cannot
// notice a query being dropped from it.
const EXPECTED_QUERIES = [
  "Character Skills",
  "Character Standings",
  "Character Blueprints",
  "Character Historic Market Orders",
  "Character Industry Jobs",
  "Character Journal",
  "Character Market Orders",
  "Character Transactions",
  "Corporation Transactions",
  "Corporation Market Orders",
  "Corporation Historic Market Orders",
  "Corporation Industry Jobs",
  "Corporation Blueprints",
  "Corporation Journal",
];

describe("the queries a character contributes", () => {
  it("is the character and corporation set", () => {
    expect(CHARACTER_PREFETCH_QUERIES.map(([name]) => name)).toEqual(EXPECTED_QUERIES);
  });

  it("names a query factory for each", () => {
    for (const [name, factory] of CHARACTER_PREFETCH_QUERIES) {
      expect(typeof factory, `${name} has no query factory`).toBe("function");
    }
  });

  // A collection missing from a character with nothing in the console is the failure this guards.
  it("reports a failed query even with waterfall logging off", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const queryClient = queryClientSpy(async () => {
      throw new Error("esi down");
    });

    await prefetchCharacterData(queryClient, "owner-hash");

    expect(consoleError).toHaveBeenCalledTimes(CHARACTER_PREFETCH_QUERIES.length);
    consoleError.mockRestore();
  });
});

describe("prefetching one character", () => {
  beforeEach(() => {
    mockStartQueryTracking.mockReset().mockReturnValue(() => 1);
    mockLogWaterfall.mockClear();
  });

  it("fetches every query the character contributes", async () => {
    const queryClient = queryClientSpy();

    await prefetchCharacterData(queryClient, "owner-hash");

    expect(queryClient.fetchQuery).toHaveBeenCalledTimes(CHARACTER_PREFETCH_QUERIES.length);
    expect(mockStartQueryTracking).toHaveBeenCalledTimes(CHARACTER_PREFETCH_QUERIES.length);
  });

  // Both would skip a query whose hook is not mounted, which at prefetch time is all of them.
  it("forces enabled so a query with no mounted hook still runs", async () => {
    const queryClient = queryClientSpy();

    await prefetchCharacterData(queryClient, "owner-hash");

    for (const [config] of queryClient.fetchQuery.mock.calls) {
      expect(config.enabled).toBe(true);
    }
  });

  // One endpoint being unavailable must not deny the character the other thirteen.
  it("settles rather than stopping at the first failure", async () => {
    let call = 0;
    const queryClient = queryClientSpy(async () => {
      call += 1;
      if (call === 1) throw new Error("esi down");
      return {};
    });

    await expect(prefetchCharacterData(queryClient, "owner-hash")).resolves.toBeUndefined();
    expect(queryClient.fetchQuery).toHaveBeenCalledTimes(CHARACTER_PREFETCH_QUERIES.length);
  });

  // fetchQuery can reject before its queryFn ever runs. Timing starts before the promise exists so
  // that case is still measured, rather than left open in the waterfall.
  it("closes the timing for a query that fails synchronously", async () => {
    const finish = vi.fn(() => 1);
    mockStartQueryTracking.mockReturnValue(finish);
    const queryClient = queryClientSpy(() => {
      throw new Error("threw before fetching");
    });

    await prefetchCharacterData(queryClient, "owner-hash");

    expect(finish).toHaveBeenCalledTimes(CHARACTER_PREFETCH_QUERIES.length);
  });

  it("logs the waterfall only when asked", async () => {
    const queryClient = queryClientSpy();

    await prefetchCharacterData(queryClient, "owner-hash");
    expect(mockLogWaterfall).not.toHaveBeenCalled();

    await prefetchCharacterData(queryClient, "owner-hash", true);
    expect(mockLogWaterfall).toHaveBeenCalledTimes(1);
  });
});

describe("prefetching several characters", () => {
  beforeEach(() => {
    mockLogWaterfall.mockClear();
  });

  it("does nothing for an empty roster", async () => {
    const queryClient = queryClientSpy();

    await prefetchMultipleCharacters(queryClient, [], true);

    expect(queryClient.fetchQuery).not.toHaveBeenCalled();
    expect(mockLogWaterfall).not.toHaveBeenCalled();
  });

  // Each character contributes fourteen queries, so an unbatched roster would open a hundred ESI
  // requests at once.
  it("runs at most three characters at a time", async () => {
    let inFlight = 0;
    let peak = 0;
    const queryClient = queryClientSpy(async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      return {};
    });
    const hashes = ["a", "b", "c", "d", "e", "f", "g"];

    await prefetchMultipleCharacters(queryClient, hashes);

    // Exactly three, not merely at most: a bound alone passes for a regression to one at a time.
    expect(peak).toBe(3 * CHARACTER_PREFETCH_QUERIES.length);
    expect(queryClient.fetchQuery).toHaveBeenCalledTimes(
      hashes.length * CHARACTER_PREFETCH_QUERIES.length
    );
  });

  it("logs the waterfall once for the whole run", async () => {
    const queryClient = queryClientSpy();

    await prefetchMultipleCharacters(queryClient, ["a", "b"], true);

    expect(mockLogWaterfall).toHaveBeenCalledTimes(1);
  });
});
