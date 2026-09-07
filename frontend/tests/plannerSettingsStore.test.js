import { beforeEach, describe, expect, it, vi } from "vitest";

const fetched = [];
let nextResponse = null;
let nextError = null;

vi.mock("../src/Functions/Endpoints/Private/planners.js", () => ({
  fetchPlannerSettingsFromApi: async (handle) => {
    fetched.push(handle);
    if (nextError) throw nextError;
    return nextResponse;
  },
}));

const { default: useUsersStore } = await import(
  "../src/Zustand/usersStore.js"
);

const OWNER = "corporation:98000001";

function actions() {
  return useUsersStore.getState().plannerSettings.actions;
}

describe("planner settings slice", () => {
  beforeEach(() => {
    fetched.length = 0;
    nextResponse = null;
    nextError = null;
    actions().clearPlannerSettings();
  });

  it("falls back to defaults for a planner it has not read", () => {
    const settings = actions().getPlannerSettings(OWNER);
    expect(settings.extrasCategories.length).toBeGreaterThan(0);
    expect(actions().isPlannerSeeded(OWNER)).toBe(false);
  });

  it("holds settings per owner, so one planner does not overwrite another", () => {
    actions().setPlannerSettings(
      OWNER,
      { extrasCategories: [{ id: "a", name: "Freight" }] },
      true
    );
    actions().setPlannerSettings(
      "account:acct-1",
      { extrasCategories: [{ id: "b", name: "Fees" }] },
      true
    );

    expect(actions().getPlannerSettings(OWNER).extrasCategories).toEqual([
      { id: "a", name: "Freight" },
    ]);
    expect(
      actions().getPlannerSettings("account:acct-1").extrasCategories
    ).toEqual([{ id: "b", name: "Fees" }]);
  });

  it("reads a planner's settings and records that they are its own", async () => {
    nextResponse = {
      owner: OWNER,
      seeded: true,
      settings: { defaultCitadelBrokersFee: 3 },
    };

    await actions().loadPlannerSettings(OWNER);

    expect(fetched).toEqual([OWNER]);
    expect(actions().getPlannerSettings(OWNER).defaultCitadelBrokersFee).toBe(3);
    expect(actions().isPlannerSeeded(OWNER)).toBe(true);
  });

  it("keeps defaults for fields the server omits", async () => {
    nextResponse = { owner: OWNER, seeded: true, settings: {} };

    await actions().loadPlannerSettings(OWNER);

    const settings = actions().getPlannerSettings(OWNER);
    expect(settings.defaultCitadelBrokersFee).toBe(1);
    expect(settings.customStructures.manufacturing).toEqual([]);
    expect(settings.extrasCategories.length).toBeGreaterThan(0);
  });

  it("records an unseeded planner as falling back", async () => {
    nextResponse = { owner: OWNER, seeded: false, settings: {} };

    await actions().loadPlannerSettings(OWNER);

    expect(actions().isPlannerSeeded(OWNER)).toBe(false);
  });

  it("offers extras categories without the deleted ones", () => {
    actions().setPlannerSettings(
      OWNER,
      {
        extrasCategories: [
          { id: "a", name: "Freight" },
          { id: "b", name: "Gone", deleted: true },
        ],
      },
      true
    );

    expect(actions().getPlannerExtrasCategories(OWNER)).toEqual([
      { id: "a", name: "Freight" },
    ]);
  });

  it("survives a failed read rather than throwing at the caller", async () => {
    nextError = new Error("network");

    const result = await actions().loadPlannerSettings(OWNER);

    expect(result).toBeNull();
    expect(actions().isPlannerSeeded(OWNER)).toBe(false);
  });

  it("leaves the account's own application settings untouched", async () => {
    const before =
      useUsersStore.getState().applicationSettings.extrasCategories;
    nextResponse = {
      owner: OWNER,
      seeded: true,
      settings: { extrasCategories: [{ id: "a", name: "Freight" }] },
    };

    await actions().loadPlannerSettings(OWNER);

    expect(useUsersStore.getState().applicationSettings.extrasCategories).toBe(
      before
    );
  });
});
