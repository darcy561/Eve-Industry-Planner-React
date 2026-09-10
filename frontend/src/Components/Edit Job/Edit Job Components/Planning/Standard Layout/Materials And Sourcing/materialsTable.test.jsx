import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MaterialsTable from "./materialsTable";
import { MATERIAL_PLAN } from "../../../../../../Functions/MarketData/materialSourcingRow";

const formatIsk = (value) => value.toFixed(2);
const formatQuantity = (value) => value.toLocaleString("en-GB");

const row = (overrides) => ({
  typeID: 34,
  name: "Tritanium",
  quantity: 10_000_000,
  buyPrice: 5.4,
  buildPrice: 4.95,
  delta: -0.083,
  plan: MATERIAL_PLAN.BUILD,
  isBuildable: true,
  isLinked: true,
  volume: 100,
  ...overrides,
});

function renderTable(rows, props = {}) {
  render(
    <MaterialsTable
      rows={rows}
      formatIsk={formatIsk}
      formatQuantity={formatQuantity}
      {...props}
    />
  );
}

/** The row for a material, by its name cell. */
const rowFor = (name) => screen.getByText(name).closest("tr");

describe("the materials table", () => {
  it("names every column the design asks for, in order", () => {
    renderTable([row()]);

    const headers = screen
      .getAllByRole("columnheader")
      .map((cell) => cell.textContent);

    expect(headers).toEqual(["Material", "Qty", "Buy", "Build", "Δ", "Plan"]);
  });

  it("says so rather than rendering an empty table when there are no materials", () => {
    renderTable([]);

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText(/needs no materials/i)).toBeInTheDocument();
  });

  it("states both prices and the comparison on one line", () => {
    renderTable([row()]);
    const cells = within(rowFor("Tritanium")).getAllByRole("cell");

    expect(cells[1]).toHaveTextContent("10,000,000");
    expect(cells[2]).toHaveTextContent("5.40");
    expect(cells[3]).toHaveTextContent("4.95");
    expect(cells[4]).toHaveTextContent("−8.3%");
  });

  it("shows a dash where a material cannot be built", () => {
    renderTable([
      row({ typeID: 38, name: "Nocxium", buildPrice: null, delta: null, isBuildable: false, plan: MATERIAL_PLAN.BASE }),
    ]);
    const cells = within(rowFor("Nocxium")).getAllByRole("cell");

    expect(cells[3]).toHaveTextContent("—");
    expect(cells[4]).toHaveTextContent("—");
    expect(cells[5]).toHaveTextContent("base");
  });

  describe("the plan column", () => {
    it("says Build for a row being built", () => {
      renderTable([row({ plan: MATERIAL_PLAN.BUILD })]);

      expect(within(rowFor("Tritanium")).getByText("Build")).toBeInTheDocument();
    });

    it("says Buy for a row being bought", () => {
      renderTable([row({ plan: MATERIAL_PLAN.BUY, delta: 0.104, isLinked: false })]);

      expect(within(rowFor("Tritanium")).getByText("Buy")).toBeInTheDocument();
    });

    it("says Paid once the material has been bought", () => {
      renderTable([
        row({ plan: MATERIAL_PLAN.PAID, buildPrice: null, delta: null }),
      ]);

      expect(within(rowFor("Tritanium")).getByText("Paid")).toBeInTheDocument();
    });
  });

  it("marks a row that is being bought while building would cost less", () => {
    // The chip carries the warning, so the row says it once rather than twice.
    renderTable([
      row({ plan: MATERIAL_PLAN.BUY, delta: -0.077, isLinked: false }),
    ]);

    const chip = within(rowFor("Tritanium")).getByText("Buy").closest(".MuiChip-root");
    expect(chip.className).toMatch(/colorWarning/);
  });

  it("does not mark a row being bought that is genuinely cheaper to buy", () => {
    renderTable([
      row({ plan: MATERIAL_PLAN.BUY, delta: 0.104, isLinked: false }),
    ]);

    const chip = within(rowFor("Tritanium")).getByText("Buy").closest(".MuiChip-root");
    expect(chip.className).not.toMatch(/colorWarning/);
  });

  describe("opening a row", () => {
    it("reports which material was asked for", async () => {
      const onToggleRow = vi.fn();
      const user = userEvent.setup();
      renderTable([row()], { onToggleRow });

      await user.click(rowFor("Tritanium"));

      expect(onToggleRow).toHaveBeenCalledWith(34);
    });

    it("does not offer to open a row with nothing to show", async () => {
      const onToggleRow = vi.fn();
      const user = userEvent.setup();
      renderTable(
        [
          row({
            name: "Nocxium",
            buildPrice: null,
            delta: null,
            isBuildable: false,
            isLinked: false,
            plan: MATERIAL_PLAN.BASE,
          }),
        ],
        { onToggleRow }
      );

      await user.click(rowFor("Nocxium"));

      expect(onToggleRow).not.toHaveBeenCalled();
    });

    it("opens a buildable row that has never been linked", async () => {
      // Opening one is how a first child job gets created, so gating on whether
      // anything is linked yet makes that unreachable.
      const onToggleRow = vi.fn();
      const user = userEvent.setup();
      renderTable(
        [row({ isLinked: false, buildPrice: null, delta: null, plan: MATERIAL_PLAN.BUY })],
        { onToggleRow }
      );

      await user.click(rowFor("Tritanium"));

      expect(onToggleRow).toHaveBeenCalledWith(34);
    });

    it("marks the rows that are open", () => {
      renderTable([row()], { openTypeIDs: [34] });

      expect(rowFor("Tritanium").className).toMatch(/Mui-selected/);
    });
  });
});

describe("the drawer under a row", () => {
  const drawerFor = (row, isOpen) => (
    <div data-testid={`drawer-${row.typeID}`}>{isOpen ? "open" : "shut"}</div>
  );

  it("gives every row somewhere of its own to open", () => {
    renderTable([row(), row({ typeID: 35, name: "Isogen" })], {
      renderDrawer: drawerFor,
    });

    expect(screen.getByTestId("drawer-34")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-35")).toBeInTheDocument();
  });

  it("tells the drawer whether its row is open", () => {
    renderTable([row(), row({ typeID: 35, name: "Isogen" })], {
      renderDrawer: drawerFor,
      openTypeIDs: [35],
    });

    expect(screen.getByTestId("drawer-34")).toHaveTextContent("shut");
    expect(screen.getByTestId("drawer-35")).toHaveTextContent("open");
  });

  it("lets more than one row be open at once", () => {
    // The popover this replaces could only ever show one material.
    renderTable([row(), row({ typeID: 35, name: "Isogen" })], {
      renderDrawer: drawerFor,
      openTypeIDs: [34, 35],
    });

    expect(screen.getByTestId("drawer-34")).toHaveTextContent("open");
    expect(screen.getByTestId("drawer-35")).toHaveTextContent("open");
  });

  it("spans the table so the drawer sits under its own row", () => {
    renderTable([row()], { renderDrawer: drawerFor });

    const cell = screen.getByTestId("drawer-34").closest("td");
    expect(cell).toHaveAttribute("colspan", "6");
  });

  it("draws no extra rows when nothing renders a drawer", () => {
    renderTable([row()]);

    expect(screen.getAllByRole("row")).toHaveLength(2);
  });
});
