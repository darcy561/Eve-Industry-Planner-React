import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock("../../../Functions/EveESI/World/locationNameLoader", () => ({
  requestLocationName: (...args) => requestMock(...args),
}));

import { fetchLocationNames, locationNameQuery } from "./locationNames";
import { LOCATION_OUTCOME } from "../../../Functions/EveESI/World/locationOutcome";

const JITA = 60003760;
const characters = [{ CharacterHash: "hash-a" }];

function client() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
}

beforeEach(() => {
  requestMock.mockReset();
});

describe("locationNameQuery", () => {
  it("keys on the id alone, so two callers share one entry", async () => {
    requestMock.mockResolvedValue({
      id: JITA,
      name: "Jita IV-4",
      resolutionStatus: LOCATION_OUTCOME.NAMED,
    });
    const queryClient = client();

    const [first, second] = await Promise.all([
      queryClient.fetchQuery(locationNameQuery(JITA, characters)),
      // A second consumer, asking with a different character list, wants the same fact.
      queryClient.fetchQuery(
        locationNameQuery(JITA, [{ CharacterHash: "hash-b" }])
      ),
    ]);

    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  // The defect the whole project exists for: a lookup that did not settle must not be remembered as
  // the answer, or the id is never asked about again for the rest of the session.
  it("caches nothing when the lookup fails", async () => {
    requestMock.mockRejectedValue(new Error("esi down"));
    const queryClient = client();

    // Retries are switched off here so the failure is one call: that the shipped config asks for
    // them is pinned below.
    await expect(
      queryClient.fetchQuery({
        ...locationNameQuery(JITA, characters),
        retry: false,
      })
    ).rejects.toThrow();

    requestMock.mockResolvedValue({
      id: JITA,
      name: "Jita IV-4",
      resolutionStatus: LOCATION_OUTCOME.NAMED,
    });
    const retried = await queryClient.fetchQuery({
      ...locationNameQuery(JITA, characters),
      retry: false,
    });

    expect(retried.name).toBe("Jita IV-4");
    expect(requestMock).toHaveBeenCalledTimes(2);
  });

  it("keeps a refusal, which is an answer", async () => {
    requestMock.mockResolvedValue({
      id: JITA,
      name: `No Access To Location - ${JITA}`,
      resolutionStatus: LOCATION_OUTCOME.NO_ACCESS,
    });
    const queryClient = client();

    await queryClient.fetchQuery(locationNameQuery(JITA, characters));
    await queryClient.fetchQuery(locationNameQuery(JITA, characters));

    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it("asks again before giving up on a failure", () => {
    expect(locationNameQuery(JITA, characters).retry).toBe(2);
  });

  it("asks for nothing without an id or a character", () => {
    expect(locationNameQuery(0, characters).enabled).toBe(false);
    expect(locationNameQuery(JITA, []).enabled).toBe(false);
  });
});

describe("fetchLocationNames", () => {
  it("answers with what was named, keyed by id", async () => {
    requestMock.mockImplementation(async (id) => ({
      id,
      name: `Place ${id}`,
      resolutionStatus: LOCATION_OUTCOME.NAMED,
    }));

    const names = await fetchLocationNames(client(), [JITA, 60008494], characters);

    expect(names[JITA].name).toBe(`Place ${JITA}`);
    expect(names[60008494].name).toBe("Place 60008494");
  });

  // These callers resolve names as a side errand inside a flow that has other work to finish.
  it("leaves out an id that failed rather than failing the set", async () => {
    requestMock.mockImplementation(async (id) => {
      if (id === JITA) throw new Error("esi down");
      return { id, name: "Amarr VIII", resolutionStatus: LOCATION_OUTCOME.NAMED };
    });

    const names = await fetchLocationNames(
      { ...client(), fetchQuery: (options) => options.queryFn() },
      [JITA, 60008494],
      characters
    );

    expect(names[JITA]).toBeUndefined();
    expect(names[60008494].name).toBe("Amarr VIII");
  });

  it("asks for nothing without ids or characters", async () => {
    await expect(fetchLocationNames(client(), [], characters)).resolves.toEqual({});
    await expect(fetchLocationNames(client(), [JITA], [])).resolves.toEqual({});
    expect(requestMock).not.toHaveBeenCalled();
  });
});
