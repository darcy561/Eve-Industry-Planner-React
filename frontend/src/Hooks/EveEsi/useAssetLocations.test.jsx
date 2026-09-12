import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const { store, characterRows, resolveCalls, resolved, pending } = vi.hoisted(
  () => ({
    store: {
      account: { characters: [], corporations: [] },
      worldData: { universeIDs: {}, actions: { addUniverseIDs: () => {} } },
    },
    characterRows: new Map(),
    resolveCalls: [],
    pending: { current: new Set() },
    resolved: { current: {} },
  }),
);

vi.mock("../../Zustand/usersStore", () => ({
  default: Object.assign((selector) => selector(store), {
    getState: () => store,
  }),
}));

vi.mock("../React Query/Character/assets", () => ({
  characterAssetsQueryKey: "characterAssets",
  characterAssetsQuery: (characterHash) => ({
    queryKey: ["characterAssets", characterHash],
    queryFn: async () => characterRows.get(characterHash) ?? [],
    enabled: true,
  }),
}));

vi.mock("../React Query/Corporation/assets", () => ({
  corporationAssetsQueryKey: "corporationAssets",
  corporationAssetsQuery: (characterHash) => ({
    queryKey: ["corporationAssets", characterHash],
    queryFn: async () => [],
    enabled: true,
  }),
}));

vi.mock("../../Functions/EveESI/World/nameLoader", () => ({
  requestName: async (id) => {
    resolveCalls.push([id]);
    // An id left pending stands for one still being asked about.
    if (pending.current.has(id)) await new Promise(() => {});
    return resolved.current[id] ?? { id, resolutionStatus: "unnamed" };
  },
}));

import useAssetLocations from "./useAssetLocations";
import {
  ASSET_SAFETY_ID,
  characterAssetRows,
  JITA_STATION_ID,
  RAITARU_STRUCTURE_ID,
} from "../../tests/assetFixtures";

function render(request) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return renderHook(() => useAssetLocations(request), {
    wrapper: ({ children }) =>
      createElement(QueryClientProvider, { client }, children),
  });
}

beforeEach(() => {
  store.account = {
    characters: [{ CharacterHash: "hash-a" }],
    corporations: [],
  };
  // The names the walk resolves land in the store, which is what the hook reads back.
  store.worldData = {
    universeIDs: {
      [JITA_STATION_ID]: { id: JITA_STATION_ID, name: "Jita IV-4" },
      [RAITARU_STRUCTURE_ID]: {
        id: RAITARU_STRUCTURE_ID,
        name: "Abbey Raitaru",
      },
      [ASSET_SAFETY_ID]: { id: ASSET_SAFETY_ID, name: "Asset Safety" },
    },
    actions: { addUniverseIDs: () => {} },
  };
  characterRows.clear();
  characterRows.set("hash-a", characterAssetRows);
  resolveCalls.length = 0;
  pending.current = new Set();
  resolved.current = {};
});

describe("the asset locations offered to a dropdown", () => {
  it("names each location and orders them alphabetically", async () => {
    const { result } = render();

    await waitFor(() =>
      expect(result.current.locations.length).toBeGreaterThan(0),
    );
    expect(result.current.locations.map(({ name }) => name)).toEqual([
      "Abbey Raitaru",
      "Jita IV-4",
    ]);
    expect(result.current.locations[0].locationId).toBe(RAITARU_STRUCTURE_ID);
  });

  // Dropping it instead would read as the account holding nothing there, which is the opposite of
  // what an unreadable structure means: the assets are in it, and no character can name it.
  it("offers a structure the account cannot read, last and saying so", async () => {
    store.worldData.universeIDs[RAITARU_STRUCTURE_ID] = {
      id: RAITARU_STRUCTURE_ID,
      name: "No Access To Location - 1035466617946",
    };

    const { result } = render();

    await waitFor(() => expect(result.current.locations.length).toBe(2));
    expect(
      result.current.locations.map(({ locationId }) => locationId),
    ).toEqual([JITA_STATION_ID, RAITARU_STRUCTURE_ID]);
    expect(result.current.locations[1]).toMatchObject({
      unreadable: true,
      name: "No Access To Location - 1035466617946",
    });
  });

  it("holds a location back until its name is known", async () => {
    delete store.worldData.universeIDs[RAITARU_STRUCTURE_ID];
    pending.current.add(RAITARU_STRUCTURE_ID);

    const { result } = render();

    await waitFor(() => expect(result.current.locations.length).toBe(1));
    expect(result.current.locations[0].locationId).toBe(JITA_STATION_ID);
    // One ask per id now, rather than one ask per set. The ship holding item 1010 is in space and
    // so absent from the set; its id sits in the structure range and is asked for as well.
    await waitFor(() =>
      expect(resolveCalls.flat()).toContain(RAITARU_STRUCTURE_ID),
    );
  });

  it("asks for nothing while disabled", async () => {
    const { result } = render({ enabled: false });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.locations).toEqual([]);
    expect(resolveCalls).toHaveLength(0);
  });
});
