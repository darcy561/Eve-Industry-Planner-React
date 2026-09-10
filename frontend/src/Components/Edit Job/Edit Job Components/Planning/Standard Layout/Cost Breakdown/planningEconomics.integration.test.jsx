import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * The two hooks that make this stage's figures, run together for real.
 *
 * Every other test in this folder mocks one of them, so nothing exercised the
 * seam where `useMaterialsSourcing`'s rows flow into `useJobEconomics`. A change
 * to the row shape — a renamed field, a dropped one — passes every unit test and
 * breaks the page. Only the boundaries are faked here: the store, and the two
 * queries that leave the browser.
 */

const marketPrices = {
  34: { jita: { sell: 200, buy: 150, buyP95: 160, sellP05: 190 } },
  35: { jita: { sell: 5, buy: 4, buyP95: 4.2, sellP05: 4.8 } },
};

vi.mock("../Material Prices/marketPriceHelpers", () => ({
  getMarketPriceForType: (typeID, hub, listing) =>
    marketPrices[typeID]?.[hub]?.[listing] ?? 0,
}));

vi.mock("../../../../../../Functions/Installation Costs/installCosts", () => ({
  getJobInstallCostForPlanning: () => 100,
}));

vi.mock("../../../../../../Hooks/React Query/Character/useSellingRates", () => ({
  useSellingRates: () => ({
    data: {
      brokerFee: { kind: "structure", base: null, rate: 1.5, terms: [] },
      salesTax: { base: 7.5, accounting: 0, rate: 7.5 },
    },
    isLoading: false,
  }),
}));

vi.mock("../../../../../../Hooks/React Query/Backend/statisticsTotals", () => ({
  useAccountTotalsQuery: () => ({ data: undefined }),
}));

vi.mock("../../../../../../Hooks/React Query/Backend/statisticsTimeline", () => ({
  useAccountTimelineQuery: () => ({ data: undefined }),
}));

vi.mock("../../../../../../Functions/MarketOrders/sellerCharacter", () => ({
  resolveSellerCharacter: () => ({
    hash: "trader",
    name: "Market Alt",
    isDefault: true,
  }),
}));

vi.mock("../../../../../../Zustand/usersStore", () => {
  const storeState = {
    applicationSettings: {
      defaultMarketLocation: "jita",
      defaultOrderType: "sell",
      actions: {
        getCurrentLocale: () => "en-GB",
        checkTypeIDisExempt: () => false,
      },
    },
    account: { actions: { findCharacterByHash: () => null } },
    jobData: { jobArray: [], actions: { findJobInJobArray: () => undefined } },
    worldData: { actions: { findMarketData: () => undefined } },
  };
  const useUsersStore = (selector) => selector(storeState);
  useUsersStore.getState = () => storeState;
  return { default: useUsersStore };
});

const { default: PlanningEconomics } = await import("./planningEconomics");
const { jobFixture, materialFixture } = await import(
  "../../../../../../tests/jobFixture"
);

const state = {
  activeJob: jobFixture({
    materials: [materialFixture({ typeID: 35, name: "Pyerite", quantity: 100 })],
    childJobs: { 35: [] },
  }),
  temporaryChildJobs: {},
  speculativeChildJobs: {},
  parentChildToEdit: { childJobs: {} },
};

const actions = {
  updateActiveJob: vi.fn(),
  getCurrentParentJobs: () => [],
  getCurrentMaterialChildJobs: () => [],
};

const panelNamed = (title) => screen.getByText(title).closest(".MuiPaper-root");

beforeEach(() => vi.clearAllMocks());

describe("the Planning stage's figures, end to end", () => {
  it("prices the materials through to a cost to build", () => {
    render(<PlanningEconomics state={state} actions={actions} />);

    // 100 Pyerite at the sell price of 5 is 500, plus 100 install.
    const cost = within(panelNamed("Cost Breakdown"));
    expect(cost.getByText("600.00")).toBeInTheDocument();
  });

  // The plan's own words: a cost to build stated on one panel and subtracted on
  // the other has to be the same number.
  it("subtracts on Returns exactly what Cost Breakdown states", async () => {
    render(<PlanningEconomics state={state} actions={actions} />);

    const stated = within(panelNamed("Cost Breakdown")).getByText("600.00");
    expect(stated).toBeInTheDocument();

    // The ledger is behind a disclosure that unmounts when closed.
    await userEvent.click(screen.getByText("How this is worked out"));

    // The ledger states it as a subtraction.
    const returns = within(panelNamed("Returns"));
    expect(returns.getByText("\u2212600.00")).toBeInTheDocument();
  });

  it("charges the fee and tax on what the listing is worth", () => {
    render(<PlanningEconomics state={state} actions={actions} />);

    // 200 a unit across 10 is a 2,000 listing: the 1.5% fee is under the 100
    // floor, and tax is 7.5%. Asserted against their own rows, since the install
    // cost is also 100.
    const cost = within(panelNamed("Cost Breakdown"));
    const feeRow = cost.getByText("Broker fee to list").closest("tr");
    const taxRow = cost.getByText("Sales tax").closest("tr");

    expect(within(feeRow).getByText("100.00")).toBeInTheDocument();
    expect(within(taxRow).getByText("150.00")).toBeInTheDocument();
  });

  it("nets the sale down to a return", () => {
    render(<PlanningEconomics state={state} actions={actions} />);

    // 2,000 revenue less 250 of charges less 600 to build.
    // Stated as the headline and again on the route it belongs to.
    expect(
      within(panelNamed("Returns")).getAllByText("1,150.00").length,
    ).toBeGreaterThan(0);
  });
});
