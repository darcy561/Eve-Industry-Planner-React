import { beforeEach, describe, expect, it, vi } from "vitest";

const jobsById = new Map();

vi.mock("../../Zustand/usersStore.js", () => ({
  default: {
    getState: () => ({
      jobData: {
        actions: {
          findJobInJobArray: (id) => jobsById.get(id) ?? null,
        },
      },
    }),
  },
}));

vi.mock("../Installation Costs/installCosts.js", () => ({
  getJobInstallCostForPlanning: (job) => job.plannedInstallCost ?? 0,
}));

const { calculateCurrentJobBuildCostFromChildren } = await import(
  "./calculateJobBuildCostFromChildren.js"
);

/**
 * @param {object} overrides
 */
function job({
  id,
  produced = 1,
  installCost = 0,
  actualInstallCost = 0,
  extras = 0,
  materials = [],
  childJobs = {},
} = {}) {
  const built = {
    plannedInstallCost: installCost,
    totalInstallCost: actualInstallCost,
    totalExtrasCost: extras,
    totalQuantityProduced: produced,
    build: { materials, childJobs },
  };
  if (id) jobsById.set(id, built);
  return built;
}

/** A material with no child job behind it: the job bought it. */
const bought = (typeID, cost, quantity = 1) => ({
  typeID,
  quantity,
  purchasedCost: cost,
  purchaseComplete: true,
});

/** A material the job intends to build rather than buy. */
const toBuild = (typeID, quantity, fallbackCost = 0) => ({
  typeID,
  quantity,
  purchasedCost: fallbackCost,
  purchaseComplete: false,
});

beforeEach(() => {
  jobsById.clear();
});

describe("build cost from children", () => {
  it("is nothing for a job with no build", () => {
    expect(calculateCurrentJobBuildCostFromChildren({})).toBe(0);
    expect(calculateCurrentJobBuildCostFromChildren(null)).toBe(0);
  });

  it("is nothing for a job that produces nothing, rather than dividing by zero", () => {
    const outputJob = job({ produced: 0, installCost: 100 });

    expect(calculateCurrentJobBuildCostFromChildren(outputJob)).toBe(0);
  });

  it("is quoted per unit produced, not as the whole job", () => {
    const outputJob = job({ produced: 10, installCost: 500, extras: 500 });

    expect(calculateCurrentJobBuildCostFromChildren(outputJob)).toBe(100);
  });

  it("charges a bought material at what was paid", () => {
    const outputJob = job({
      produced: 1,
      materials: [bought(34, 250)],
    });

    expect(calculateCurrentJobBuildCostFromChildren(outputJob)).toBe(250);
  });

  it("charges a built material at what its child job costs per unit", () => {
    job({
      id: "child-1",
      produced: 100,
      installCost: 300,
      extras: 200,
      materials: [bought(34, 500)],
    });
    const outputJob = job({
      produced: 1,
      materials: [toBuild(35, 10)],
      childJobs: { 35: ["child-1"] },
    });

    // Child costs 300 + 200 + 500 = 1000 for 100 units, so 10 units cost 100.
    expect(calculateCurrentJobBuildCostFromChildren(outputJob)).toBe(100);
  });

  it("walks a child's own children rather than stopping a level down", () => {
    job({
      id: "grandchild",
      produced: 10,
      installCost: 100,
      materials: [bought(34, 900)],
    });
    job({
      id: "child-1",
      produced: 10,
      installCost: 0,
      materials: [toBuild(35, 10)],
      childJobs: { 35: ["grandchild"] },
    });
    const outputJob = job({
      produced: 1,
      materials: [toBuild(36, 10)],
      childJobs: { 36: ["child-1"] },
    });

    // Grandchild: (100 + 900) / 10 = 100 per unit, so 10 units cost 1000.
    // Child: 1000 for 10 units = 100 per unit, so 10 units cost 1000.
    expect(calculateCurrentJobBuildCostFromChildren(outputJob)).toBe(1000);
  });

  it("uses what was paid when a material is already bought in full, children or not", () => {
    job({ id: "child-1", produced: 100, installCost: 99_999 });
    const outputJob = job({
      produced: 1,
      materials: [bought(35, 42)],
      childJobs: { 35: ["child-1"] },
    });

    expect(calculateCurrentJobBuildCostFromChildren(outputJob)).toBe(42);
  });

  it("falls back to what was paid when a named child job cannot be found", () => {
    const outputJob = job({
      produced: 1,
      materials: [toBuild(35, 10, 777)],
      childJobs: { 35: ["missing-job"] },
    });

    expect(calculateCurrentJobBuildCostFromChildren(outputJob)).toBe(777);
  });

  it("falls back to what was paid when the children produce nothing", () => {
    job({ id: "child-1", produced: 0, installCost: 500 });
    const outputJob = job({
      produced: 1,
      materials: [toBuild(35, 10, 640)],
      childJobs: { 35: ["child-1"] },
    });

    expect(calculateCurrentJobBuildCostFromChildren(outputJob)).toBe(640);
  });

  it("spreads several children of one material over their combined output", () => {
    job({ id: "child-1", produced: 50, installCost: 250 });
    job({ id: "child-2", produced: 50, installCost: 750 });
    const outputJob = job({
      produced: 1,
      materials: [toBuild(35, 10)],
      childJobs: { 35: ["child-1", "child-2"] },
    });

    // 1000 across 100 units is 10 each, so 10 units cost 100.
    expect(calculateCurrentJobBuildCostFromChildren(outputJob)).toBe(100);
  });

  it("charges the install cost actually incurred when asked for actuals", () => {
    const outputJob = job({
      produced: 1,
      installCost: 100,
      actualInstallCost: 250,
    });

    expect(
      calculateCurrentJobBuildCostFromChildren(outputJob, {
        installCostMode: "actual",
      })
    ).toBe(250);
  });
});
