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
    actions().resetPlannerSettingsStore();
  });

  it("falls back to defaults for a planner it has not read", () => {
    const settings = actions().getPlannerSettings(OWNER);
    expect(settings.extrasCategories.length).toBeGreaterThan(0);
    expect(actions().isPlannerSeeded(OWNER)).toBe(false);
  });

  it("holds settings per owner, so one planner does not overwrite another", () => {
    actions().setPlannerSettings(
      OWNER,
      { extrasCategories: [{ id: "a", label: "Freight" }] },
      true
    );
    actions().setPlannerSettings(
      "account:acct-1",
      { extrasCategories: [{ id: "b", label: "Fees" }] },
      true
    );

    expect(actions().getPlannerSettings(OWNER).extrasCategories).toEqual([
      { id: "a", label: "Freight" },
    ]);
    expect(
      actions().getPlannerSettings("account:acct-1").extrasCategories
    ).toEqual([{ id: "b", label: "Fees" }]);
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
          { id: "a", label: "Freight" },
          { id: "b", label: "Gone", deleted: true },
        ],
      },
      true
    );

    expect(actions().getPlannerExtrasCategories(OWNER)).toEqual([
      { id: "a", label: "Freight" },
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
      settings: { extrasCategories: [{ id: "a", label: "Freight" }] },
    };

    await actions().loadPlannerSettings(OWNER);

    expect(useUsersStore.getState().applicationSettings.extrasCategories).toBe(
      before
    );
  });

  it("holds exemptTypeIDs as a Set, as the account's own settings do", async () => {
    nextResponse = {
      owner: OWNER,
      seeded: true,
      settings: { exemptTypeIDs: [34, 35] },
    };

    await actions().loadPlannerSettings(OWNER);

    const held = actions().getPlannerSettings(OWNER).exemptTypeIDs;
    expect(held).toBeInstanceOf(Set);
    expect([...held]).toEqual([34, 35]);
  });

  it("rebuilds structure rows with their classes, so their methods survive", async () => {
    nextResponse = {
      owner: OWNER,
      seeded: true,
      settings: {
        customStructures: {
          manufacturing: [{ id: "s1", name: "Raitaru" }],
          reprocessing: [{ id: "s2", name: "Athanor" }],
        },
      },
    };

    await actions().loadPlannerSettings(OWNER);

    const { manufacturing, reprocessing, invention } =
      actions().getPlannerSettings(OWNER).customStructures;
    expect(manufacturing[0].constructor.name).toBe("CustomStructure");
    expect(reprocessing[0].constructor.name).toBe("ReprocessingStructure");
    // A lane the server omits is empty rather than missing.
    expect(invention).toEqual([]);
  });

  it("resets every planner on sign-out", () => {
    actions().setPlannerSettings(OWNER, { defaultCitadelBrokersFee: 5 }, true);
    expect(actions().isPlannerSeeded(OWNER)).toBe(true);

    actions().resetPlannerSettingsStore();

    expect(actions().isPlannerSeeded(OWNER)).toBe(false);
    expect(actions().getPlannerSettings(OWNER).defaultCitadelBrokersFee).toBe(1);
  });
});
