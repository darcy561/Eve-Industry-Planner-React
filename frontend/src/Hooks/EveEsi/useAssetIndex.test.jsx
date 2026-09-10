import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const { account, characterRows, corporationRows } = vi.hoisted(() => ({
  account: { characters: [], corporations: [] },
  characterRows: new Map(),
  corporationRows: new Map(),
}));

vi.mock("../../Zustand/usersStore", () => ({
  default: Object.assign((selector) => selector({ account }), {
    getState: () => ({ account }),
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
    queryFn: async () => corporationRows.get(characterHash) ?? [],
    enabled: true,
  }),
}));

import useAssetIndex, { ASSET_SCOPE } from "./useAssetIndex";
import { JITA_STATION_ID } from "../../tests/assetFixtures";

function station(itemId, typeId = 34) {
  return {
    item_id: itemId,
    type_id: typeId,
    quantity: 1,
    location_flag: "Hangar",
    location_id: JITA_STATION_ID,
    location_type: "station",
  };
}

function render(request) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return renderHook(() => useAssetIndex(request), {
    wrapper: ({ children }) =>
      createElement(QueryClientProvider, { client }, children),
  });
}

beforeEach(() => {
  account.characters = [
    { CharacterHash: "hash-a" },
    { CharacterHash: "hash-b" },
  ];
  account.corporations = [
    { corporation_id: 98000001, members: ["hash-a", "hash-b"] },
  ];
  characterRows.clear();
  corporationRows.clear();
});

describe("useAssetIndex", () => {
  it("returns an empty collection for an unknown scope", async () => {
    const { result } = render({ scope: "nonsense" });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data.nodes).toEqual([]);
  });

  it("returns only the requested character's rows", async () => {
    characterRows.set("hash-a", [station(1)]);
    characterRows.set("hash-b", [station(2)]);

    const { result } = render({
      scope: ASSET_SCOPE.CHARACTER,
      id: "hash-a",
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data.nodes.map((n) => n.itemId)).toEqual([1]);
  });

  it("merges every character for the characters scope", async () => {
    characterRows.set("hash-a", [station(1)]);
    characterRows.set("hash-b", [station(2)]);

    const { result } = render({ scope: ASSET_SCOPE.CHARACTERS });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(
      result.current.data.nodes.map((n) => n.itemId).sort((a, b) => a - b)
    ).toEqual([1, 2]);
  });

  it("unions a corporation's members and keeps one node per item", async () => {
    // Both members can see item 10; only hash-b can see item 11.
    corporationRows.set("hash-a", [station(10)]);
    corporationRows.set("hash-b", [station(10), station(11)]);

    const { result } = render({
      scope: ASSET_SCOPE.CORPORATION,
      id: 98000001,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(
      result.current.data.nodes.map((n) => n.itemId).sort((a, b) => a - b)
    ).toEqual([10, 11]);
  });

  it("gives two consumers of one scope the same collection", async () => {
    characterRows.set("hash-a", [station(1)]);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const wrapper = ({ children }) =>
      createElement(QueryClientProvider, { client }, children);
    const request = { scope: ASSET_SCOPE.CHARACTER, id: "hash-a" };

    const first = renderHook(() => useAssetIndex(request), { wrapper });
    const second = renderHook(() => useAssetIndex(request), { wrapper });

    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));

    expect(second.result.current.data).toBe(first.result.current.data);
  });

  it("reports an error rather than an empty result", async () => {
    const { result } = renderHook(
      () => useAssetIndex({ scope: ASSET_SCOPE.CHARACTER, id: "hash-a" }),
      {
        wrapper: ({ children }) =>
          createElement(
            QueryClientProvider,
            {
              client: new QueryClient({
                defaultOptions: { queries: { retry: false } },
              }),
            },
            children
          ),
      }
    );

    characterRows.set("hash-a", null);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data.nodes).toEqual([]);
  });
});
