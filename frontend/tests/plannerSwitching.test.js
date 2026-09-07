import { beforeEach, describe, expect, it, vi } from "vitest";

const storeState = {
  account: { isLoggedIn: true, corporations: [], characters: [] },
};

vi.mock("../src/Zustand/usersStore.js", () => ({
  default: { getState: () => storeState },
}));

const { plannerDisplayName } = await import("../src/Hooks/React Query/planners.js");

const CORP_OWNER = "corporation:corp_56_J_DzQdPpjXwi9Xtp3C8bri9Bfi0Z94qUulkbKCac";

describe("naming a planner for display", () => {
  beforeEach(() => {
    storeState.account.corporations = [];
    storeState.account.characters = [];
  });

  // The server names a planner when somebody opens it, so a name it sends is the
  // planner's own and outranks anything the client would work out.
  it("uses the name the server sent", () => {
    expect(
      plannerDisplayName({
        owner: CORP_OWNER,
        kind: "corporation",
        name: "Karkur Industries",
        named: true,
      })
    ).toBe("Karkur Industries");
  });

  // An account reaches every corporation it is in before any has a document, so
  // an unnamed one is ordinary. The client already knows what the entity is
  // called and says so rather than showing an owner key.
  it("falls back to the corporation the client already knows", () => {
    storeState.account.characters = [{ corporation_id: 98000001 }];
    storeState.account.corporations = [
      { corporation_id: 98000001, corporationName: "Karkur Industries" },
    ];

    expect(
      plannerDisplayName({ owner: CORP_OWNER, kind: "corporation", name: "", named: false })
    ).toBe("Karkur Industries");
  });

  // Two corporations and one handle: the handle carries a ref rather than an id,
  // so nothing here can say which. A generic label beats naming the wrong one.
  it("does not guess when the account holds more than one corporation", () => {
    storeState.account.characters = [
      { corporation_id: 98000001 },
      { corporation_id: 98000002 },
    ];
    storeState.account.corporations = [
      { corporation_id: 98000001, corporationName: "First" },
      { corporation_id: 98000002, corporationName: "Second" },
    ];

    expect(
      plannerDisplayName({ owner: CORP_OWNER, kind: "corporation", name: "", named: false })
    ).toBe("Corporation");
  });

  it("names an account's own planner without asking anything", () => {
    expect(
      plannerDisplayName({ owner: "account:abc", kind: "account", name: "", named: false })
    ).toBe("My planner");
  });

  it("labels an unnamed alliance", () => {
    expect(
      plannerDisplayName({
        owner: "alliance:alliance_abc",
        kind: "alliance",
        name: "",
        named: false,
      })
    ).toBe("Alliance");
  });
});

vi.mock("../src/Functions/Endpoints/Private/applyPrivateHeaders.js", () => ({
  requestWithPrivateHeaders: vi.fn(),
}));

const { requestWithPrivateHeaders } = await import(
  "../src/Functions/Endpoints/Private/applyPrivateHeaders.js"
);
const { ensurePlannerViaApi, fetchPlannersFromApi } = await import(
  "../src/Functions/Endpoints/Private/planners.js"
);

describe("addressing a planner over the API", () => {
  beforeEach(() => {
    requestWithPrivateHeaders.mockReset();
  });

  // An owner handle is `kind:id` and the colon is the separator, so escaping the
  // whole handle would escape it too and address a planner that does not exist.
  it("escapes the id and leaves the separator alone", async () => {
    requestWithPrivateHeaders.mockResolvedValue({
      ok: true,
      json: async () => ({ owner: CORP_OWNER }),
    });

    await ensurePlannerViaApi(CORP_OWNER);

    const [url] = requestWithPrivateHeaders.mock.calls[0];
    expect(url).toContain("/api/v1/planners/corporation:corp_56_J_");
    expect(url).not.toContain("%3A");
  });

  it("refuses to address a planner without a handle", async () => {
    await expect(ensurePlannerViaApi("")).rejects.toThrow();
    expect(requestWithPrivateHeaders).not.toHaveBeenCalled();
  });

  // A listing with no planners is an account that holds no membership rows, not
  // a failure, so it reads as an empty list rather than throwing.
  it("reads an empty listing as no planners", async () => {
    requestWithPrivateHeaders.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    expect(await fetchPlannersFromApi()).toEqual([]);
  });

  it("throws when the listing is refused", async () => {
    requestWithPrivateHeaders.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      text: async () => "",
    });

    await expect(fetchPlannersFromApi()).rejects.toThrow(/503/);
  });
});
