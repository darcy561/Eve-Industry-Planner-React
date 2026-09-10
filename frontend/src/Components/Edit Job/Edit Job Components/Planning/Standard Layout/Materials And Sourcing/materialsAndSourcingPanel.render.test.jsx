import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MATERIAL_PLAN } from "../../../../../../Functions/MarketData/materialSourcingRow";

const sourcing = {
  rows: [
    {
      typeID: 34,
      name: "Tritanium",
      quantity: 1000,
      buyPrice: 5.4,
      buildPrice: 4.95,
      delta: -0.083,
      plan: MATERIAL_PLAN.BUY,
      isBuildable: true,
      isLinked: false,
      volume: 10,
      material: { typeID: 34, name: "Tritanium" },
      matchedChildJobs: [],
      marketSelect: "jita",
      listingSelect: "sell",
    },
  ],
  summary: {
    materials: 1,
    buildable: 1,
    linked: 0,
    volume: 10,
    savingAvailable: 450,
    cheaperToBuild: 1,
  },
  marketSelect: "jita",
  listingSelect: "sell",
  basisUsage: { overridden: 1, purchased: 0 },
  basisOptions: [
    { id: "sell", label: "Sell Orders", total: 5400, delta: 0, isCurrent: true },
    { id: "buy", label: "Buy Orders", total: 4950, delta: -450, isCurrent: false },
  ],
};

vi.mock("./useMaterialsSourcing", () => ({
  useMaterialsSourcing: () => sourcing,
}));

// Stood in for, so the test proves the panel reaches the drawer rather than
// standing up the whole child-job stack.
vi.mock("./materialDrawer", () => ({
  default: ({ isOpen, material, marketSelect, pricing }) => (
    <div data-testid={`drawer-${material.typeID}`}>
      {isOpen ? `open at ${marketSelect}` : "shut"}
      <span data-testid={`pricing-${material.typeID}`}>
        {pricing ? `panel ${pricing.panelMarket}/${pricing.panelListing}` : "none"}
      </span>
    </div>
  ),
}));

const { default: MaterialsAndSourcingPanel } = await import(
  "./materialsAndSourcingPanel.jsx"
);

const state = {
  activeJob: {
    selectedSetup: { id: "setup-1" },
    layout: { materialPriceOverrides: {} },
    build: { materials: [] },
  },
};

function renderPanel(props = {}) {
  render(
    <MaterialsAndSourcingPanel
      state={state}
      actions={{ updateActiveJob: () => {} }}
      onChangeBasis={() => {}}
      onApplyBuildable={() => {}}
      {...props}
    />
  );
}

describe("the Materials and Sourcing panel", () => {
  it("titles itself and lists the materials", () => {
    renderPanel();

    expect(screen.getByText("Materials & Sourcing")).toBeInTheDocument();
    expect(screen.getByText("Tritanium")).toBeInTheDocument();
  });

  it("offers what building the cheaper rows would save", () => {
    renderPanel();

    expect(screen.getByRole("alert")).toHaveTextContent(/Building 1 of 1 saves/);
  });

  it("counts the list beneath it", () => {
    renderPanel();

    expect(
      screen.getByText("1 material · 1 buildable · 0 linked")
    ).toBeInTheDocument();
  });

  it("gives each row a drawer, and opens it when the row is clicked", async () => {
    // The drawer was built and never wired in; only rendering the panel sees
    // that, which is why this test exists rather than a helper test beside it.
    const user = userEvent.setup();
    renderPanel();

    expect(screen.getByTestId("drawer-34")).toHaveTextContent("shut");

    await user.click(screen.getByText("Tritanium").closest("tr"));

    expect(screen.getByTestId("drawer-34")).toHaveTextContent("open at jita");
  });

  it("closes a drawer that is open when its row is clicked again", async () => {
    const user = userEvent.setup();
    renderPanel();
    const row = () => screen.getByText("Tritanium").closest("tr");

    await user.click(row());
    await user.click(row());

    expect(screen.getByTestId("drawer-34")).toHaveTextContent("shut");
  });

  it("says how many rows are off the panel's basis", async () => {
    // An override is invisible on the row, so the picker is where it surfaces.
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /Sell Orders/ }));

    expect(screen.getByText("1 overridden")).toBeInTheDocument();
  });

  it("gives each row the means to price itself differently", () => {
    // Setting an override was the last thing the old panel could do that this
    // one could not.
    renderPanel();

    expect(screen.getByTestId("pricing-34")).toHaveTextContent(
      "panel jita/sell"
    );
  });

  it("draws nothing at all without a setup to cost", () => {
    const { container } = render(
      <MaterialsAndSourcingPanel
        state={{ activeJob: {} }}
        actions={{ updateActiveJob: () => {} }}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe("how the panel sits in the stage's layout", () => {
  it("does not try to fill a height the Masonry has not decided", () => {
    // AppShellPanel is full height by default. In a Masonry that measures its
    // children, a panel filling 100% of an undecided height renders as a huge
    // empty box and pushes its siblings into a phantom column — a blank page
    // that scrolls. Every other panel on this stage sets height auto too.
    renderPanel();

    const paper = document.querySelector(".MuiPaper-root");
    expect(paper).not.toHaveStyle({ height: "100%" });
  });
});
