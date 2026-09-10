import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("../../../../../../Hooks/Planner/useEffectiveMarketHubFromLayout.js", () => ({
  useEffectiveMarketHubFromLayout: () => ({
    marketDisplay: "jita",
    orderDisplay: "sell",
  }),
}));
vi.mock("../Material Prices/marketPriceHelpers", () => ({
  getMarketPriceForType: (typeID, hub, basis) =>
    ({ sell: 10, buy: 8, buyP95: 9, sellP05: 11 })[basis] ?? 0,
}));
vi.mock("../Material Prices/Helpers/materialChildJobs", () => ({
  resolveMaterialChildJobs: () => ({
    childJobsById: new Map(),
    childJobIDs: [],
    hasChildJobs: false,
  }),
  resolveMaterialChildJobStatus: () => ({
    hasLinked: false,
    hasTemp: false,
    hasPendingAdd: false,
  }),
}));
vi.mock("../../../../../../Zustand/usersStore.js", () => {
  const storeState = {
    applicationSettings: { actions: { checkTypeIDisExempt: () => false } },
    worldData: { actions: { findMarketData: () => undefined } },
  };
  const useUsersStore = (selector) => selector(storeState);
  useUsersStore.getState = () => storeState;
  return { default: useUsersStore };
});
vi.mock("../../../../../../Functions/Helper/checkJobTypeIsBuildable.js", () => ({
  default: (jobType) => jobType === 1,
}));
vi.mock("../../../../../../Functions/Groups/materialCostFromChildJobs.js", () => ({
  calculateMaterialCostFromChildJobs: (material) => 700 * material.quantity,
}));

const { useMaterialsSourcing } = await import("./useMaterialsSourcing.js");

const material = (typeID, jobType = 1, overrides = {}) => ({
  typeID,
  name: `Material ${typeID}`,
  jobType,
  quantity: 100,
  volume: 0.01,
  purchasing: [],
  quantityPurchased: 0,
  purchasedCost: 0,
  purchaseComplete: false,
  ...overrides,
});

function setup({
  materials = [material(34)],
  layout = {},
  speculativeChildJobs = {},
} = {}) {
  return {
    activeJob: {
      build: { materials, childJobs: {} },
      layout,
      selectedSetup: { materialCount: {} },
    },
    parentChildToEdit: { childJobs: {} },
    temporaryChildJobs: {},
    speculativeChildJobs,
  };
}

const render = (state) =>
  renderHook(() => useMaterialsSourcing({ state, actions: {} })).result.current;

describe("useMaterialsSourcing", () => {
  it("gives the panel every part it draws", () => {
    // The panel destructures each of these; one missing is a feature that
    // silently never renders.
    const result = render(setup());

    expect(Object.keys(result).sort()).toEqual(
      [
        "basisOptions",
        "basisUsage",
        "listingSelect",
        "marketSelect",
        "priceAge",
        "rows",
        "summary",
      ].sort()
    );
  });

  it("builds a row per material", () => {
    const result = render(setup({ materials: [material(34), material(35)] }));

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({ typeID: 34, buyPrice: 10 });
  });

  it("marks each row with what kind of material it is", () => {
    expect(render(setup()).rows[0].mark).toMatchObject({
      label: "Manufacturing Job",
      isExempt: false,
    });
  });

  it("carries what a drawer opened on a row needs", () => {
    const result = render(setup());

    expect(result.rows[0]).toMatchObject({
      marketSelect: "jita",
      listingSelect: "sell",
      matchedChildJobs: [],
    });
    expect(result.rows[0].material).toBeDefined();
  });

  it("counts no overrides when every row is on the panel's basis", () => {
    expect(render(setup()).basisUsage).toMatchObject({ overridden: 0 });
  });

  it("counts a row that carries its own hub", () => {
    const state = setup({
      layout: { materialPriceOverrides: { 34: { marketDisplay: "amarr" } } },
    });

    expect(render(state).basisUsage.overridden).toBe(1);
  });

  it("costs the job on every basis the picker offers", () => {
    const result = render(setup());

    expect(result.basisOptions).toHaveLength(4);
    expect(result.basisOptions.find((o) => o.isCurrent).id).toBe("sell");
  });
});

// A speculative job prices a row without committing it, which is what lets the
// panel offer the switch. If it counted as linked the row would read as planned
// to build the moment it was costed, and there would be nothing left to offer.
describe("a row costed from a speculative job", () => {
  it("takes its build price from the speculative job", () => {
    const { rows } = render(
      setup({ speculativeChildJobs: { 34: { jobID: "spec-34", itemID: 34 } } }),
    );

    expect(rows[0].isSpeculative).toBe(true);
    expect(rows[0].buildPrice).not.toBeNull();
  });

  it("stays unlinked, and so stays planned to buy", () => {
    const { rows } = render(
      setup({ speculativeChildJobs: { 34: { jobID: "spec-34", itemID: 34 } } }),
    );

    expect(rows[0].isLinked).toBe(false);
    expect(rows[0].plan).toBe("buy");
  });

  it("is not speculative when nothing has costed it", () => {
    const { rows } = render(setup());

    expect(rows[0].isSpeculative).toBe(false);
  });
});
