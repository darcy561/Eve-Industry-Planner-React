import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock(
  "../../../../../../Hooks/Planner/useEffectiveMarketHubFromLayout.js",
  () => ({
    useEffectiveMarketHubFromLayout: () => ({
      marketDisplay: "jita",
      orderDisplay: "sell",
    }),
  }),
);
vi.mock("../../../../../../Functions/MarketData/marketPriceForType", () => ({
  getMarketPriceForType: (typeID, hub, basis) =>
    ({ sell: 10, buy: 8, buyP95: 9, sellP05: 11 })[basis] ?? 0,
}));
// Set per test rather than remocked, so a case with linked children does not
// need the module registry reset around it.
let linkedChildJobs = [];

vi.mock("./Helpers/materialChildJobs", () => ({
  resolveMaterialChildJobs: () => ({
    childJobsById: new Map(linkedChildJobs.map((job) => [job.jobID, job])),
    childJobIDs: linkedChildJobs.map((job) => job.jobID),
    hasChildJobs: linkedChildJobs.length > 0,
  }),
  resolveMaterialChildJobStatus: () => ({
    hasLinked: linkedChildJobs.length > 0,
    hasTemp: false,
    hasPendingAdd: false,
  }),
}));
let automaticRecalculation = true;

vi.mock("../../../../../../Zustand/usersStore.js", () => {
  const storeState = {
    applicationSettings: {
      // Read per render: the mock factory runs once, so a plain value would
      // freeze whatever the first test set.
      get enableAutomaticJobRecalculation() {
        return automaticRecalculation;
      },
      actions: { checkTypeIDisExempt: () => false },
    },
    worldData: { actions: { findMarketData: () => undefined } },
  };
  const useUsersStore = (selector) => selector(storeState);
  useUsersStore.getState = () => storeState;
  return { default: useUsersStore };
});
vi.mock(
  "../../../../../../Functions/Helper/checkJobTypeIsBuildable.js",
  () => ({
    default: (jobType) => jobType === 1,
  }),
);
// The child jobs behind a row are costed for what they actually make, so the
// stub answers per job rather than per material.
vi.mock("../../../../../../Functions/Groups/childJobTotals", () => ({
  calculateChildJobTotals: (job) => ({
    totalCostOfMaterials: 0,
    totalInstallCosts: 0,
    quantityProduced: job?.totalQuantityProduced ?? 100,
    totalCostPerItem: job?.unitCost ?? 7,
  }),
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
      ].sort(),
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
    expect(rows[0].buildPrice).toBe(7);
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

// A child job is sized to the requirement when it is created and not again until
// the parent closes, so the two drift apart whenever the parent changes. The row
// has to carry that rather than quietly costing the requirement at the child's
// rate as though it had been resized.
describe("a row whose child jobs no longer cover it", () => {
  afterEach(() => {
    linkedChildJobs = [];
    automaticRecalculation = true;
  });

  function renderLinked(...jobs) {
    linkedChildJobs = jobs;
    return render(setup());
  }

  it("says how much of the requirement the child actually makes", () => {
    const { rows } = renderLinked({
      jobID: "child-1",
      totalQuantityProduced: 40,
      unitCost: 7,
    });

    expect(rows[0].coverage).toMatchObject({
      required: 100,
      produced: 40,
      covered: 40,
      shortfall: 60,
      isShort: true,
    });
  });

  it("buys the shortfall when nothing will resize the child on close", () => {
    automaticRecalculation = false;

    const { rows } = renderLinked({
      jobID: "child-1",
      totalQuantityProduced: 40,
      unitCost: 7,
    });

    // 40 built at 7, 60 bought at the sell price of 10.
    expect(rows[0].coverage.buildCost).toBe(280);
    expect(rows[0].coverage.buyCost).toBe(600);
    expect(rows[0].buildPrice).toBe(8.8);
    expect(rows[0].coverage.assumed).toBe(false);
  });

  it("extrapolates and flags it when the child will be resized on close", () => {
    const { rows } = renderLinked({
      jobID: "child-1",
      totalQuantityProduced: 40,
      unitCost: 7,
    });

    expect(rows[0].buildPrice).toBe(7);
    expect(rows[0].coverage.assumed).toBe(true);
  });

  it("carries no shortfall when the child still covers the requirement", () => {
    const { rows } = renderLinked({
      jobID: "child-1",
      totalQuantityProduced: 100,
      unitCost: 7,
    });

    expect(rows[0].coverage.isShort).toBe(false);
    expect(rows[0].coverage.assumed).toBe(false);
  });

  // Two jobs each making half were each costed for the whole requirement, so a
  // material built by siblings cost twice what it should.
  it("splits the requirement between siblings rather than giving each all of it", () => {
    const { rows } = renderLinked(
      { jobID: "child-1", totalQuantityProduced: 50, unitCost: 7 },
      { jobID: "child-2", totalQuantityProduced: 50, unitCost: 7 },
    );

    expect(rows[0].coverage.covered).toBe(100);
    expect(rows[0].coverage.total).toBe(700);
    expect(rows[0].buildPrice).toBe(7);
  });
});
