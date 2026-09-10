import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const { store, resolveCalls, resolveResult } = vi.hoisted(() => ({
  store: { account: { characters: [] }, worldData: { universeIDs: {} } },
  resolveCalls: [],
  resolveResult: { current: {} },
}));

vi.mock("../../Zustand/usersStore", () => ({
  default: Object.assign((selector) => selector(store), {
    getState: () => store,
  }),
}));

vi.mock("../../Functions/EveESI/World/resolveLocationNames", () => ({
  default: async (ids) => {
    resolveCalls.push([...ids]);
    if (resolveResult.current === null) throw new Error("esi down");
    return resolveResult.current;
  },
}));

import useLocationNames from "./useLocationNames";

const JITA = 60003760;
const RAITARU = 1035466617946;

function render(ids) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return renderHook(() => useLocationNames(ids), {
    wrapper: ({ children }) =>
      createElement(QueryClientProvider, { client }, children),
  });
}

beforeEach(() => {
  store.account = { characters: [{ CharacterHash: "hash-a" }] };
  store.worldData = { universeIDs: {} };
  resolveCalls.length = 0;
  resolveResult.current = {};
});

describe("useLocationNames", () => {
  it("asks for nothing when given nothing", async () => {
    const { result } = render([]);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(resolveCalls).toHaveLength(0);
    expect(result.current.names).toEqual({});
  });

  it("asks only for what the store does not already hold", async () => {
    store.worldData.universeIDs = { [JITA]: { id: JITA, name: "Jita IV-4" } };

    const { result } = render([JITA, RAITARU]);

    await waitFor(() => expect(resolveCalls).toHaveLength(1));
    expect(resolveCalls[0]).toEqual([RAITARU]);
    // What the store already knew is returned without being asked for again.
    expect(result.current.names[JITA].name).toBe("Jita IV-4");
  });

  it("does not resolve when the store already holds every location", async () => {
    store.worldData.universeIDs = {
      [JITA]: { id: JITA, name: "Jita IV-4" },
      [RAITARU]: { id: RAITARU, name: "Home Raitaru" },
    };

    const { result } = render([JITA, RAITARU]);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(resolveCalls).toHaveLength(0);
    expect(Object.keys(result.current.names)).toHaveLength(2);
  });

  it("waits for the account's characters before asking", async () => {
    store.account = { characters: [] };

    const { result } = render([RAITARU]);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(resolveCalls).toHaveLength(0);
  });

  it("reports a failure rather than an empty result", async () => {
    resolveResult.current = null;
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const { result } = renderHook(() => useLocationNames([RAITARU]), {
      wrapper: ({ children }) =>
        createElement(QueryClientProvider, { client }, children),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
    expect(result.current.names).toEqual({});
  });

  it("asks once when two consumers want the same locations", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const wrapper = ({ children }) =>
      createElement(QueryClientProvider, { client }, children);
    const ids = [JITA, RAITARU];

    const first = renderHook(() => useLocationNames(ids), { wrapper });
    const second = renderHook(() => useLocationNames(ids), { wrapper });

    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));

    expect(resolveCalls).toHaveLength(1);
  });
});
