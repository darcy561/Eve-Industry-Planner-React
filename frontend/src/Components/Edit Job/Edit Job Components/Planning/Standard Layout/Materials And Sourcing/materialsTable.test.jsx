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
  mark: { kind: "linked", label: "Manufacturing Job Linked", jobType: 1, isUnsettled: false, isExempt: false },
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

    expect(headers).toEqual(["Material", "Qty", "Buy", "Build", "Δ", "Source", "Plan"]);
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
    expect(cells[6]).toHaveTextContent("base");
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
    // Comparing two materials means having both open together.
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
    expect(cell).toHaveAttribute("colspan", "7");
  });

  it("draws no extra rows when nothing renders a drawer", () => {
    renderTable([row()]);

    expect(screen.getAllByRole("row")).toHaveLength(2);
  });
});

describe("the mark at the head of a row", () => {
  it("says what the material is and whether anything builds it", () => {
    renderTable([row()]);

    expect(screen.getByLabelText("Manufacturing Job Linked")).toBeInTheDocument();
  });

  it("marks a material the account excludes from builds", () => {
    // An exempt material is worth stating on the row: it is why a build the
    // player expected to be offered is not.
    renderTable([
      row({
        mark: {
          kind: "plain",
          label: "Manufacturing Job — exempt from builds",
          jobType: 1,
          isUnsettled: false,
          isExempt: true,
        },
      }),
    ]);

    const glyph = screen.getByLabelText("Manufacturing Job — exempt from builds");
    expect(glyph).toBeInTheDocument();
    // Legible without hovering: a long list is scanned rather than hovered row
    // by row.
    expect(glyph.querySelector("svg")).toHaveAttribute(
      "data-testid",
      "BlockIcon"
    );
  });

  it("does not say the same thing for exempt as for pending", () => {
    // They were two icons in two panels before those panels merged, and they
    // mean opposite things: pending wants a decision, exempt wants nothing.
    const pending = {
      kind: "pending",
      label: "Manufacturing Job Pending",
      jobType: 1,
      isUnsettled: true,
      isExempt: false,
    };
    const exemptAndPending = { ...pending, isExempt: true, label: "exempt too" };

    const first = render(
      <MaterialsTable
        rows={[row({ mark: pending })]}
        formatIsk={formatIsk}
        formatQuantity={formatQuantity}
      />
    );
    const pendingGlyph = screen
      .getByLabelText("Manufacturing Job Pending")
      .querySelector("svg")
      .getAttribute("data-testid");
    first.unmount();

    render(
      <MaterialsTable
        rows={[row({ mark: exemptAndPending })]}
        formatIsk={formatIsk}
        formatQuantity={formatQuantity}
      />
    );
    const exemptGlyph = screen
      .getByLabelText("exempt too")
      .querySelector("svg")
      .getAttribute("data-testid");

    expect(exemptGlyph).not.toBe(pendingGlyph);
  });

  it("draws no mark for a row that carries none", () => {
    renderTable([row({ mark: null })]);

    expect(screen.getByText("Tritanium")).toBeInTheDocument();
  });
});

// The row's buy figure is one of four the server publishes per hub, and until
// the row says which, two rows priced differently look like the same figure.
describe("the source column", () => {
  it("names the hub and the price mode behind the buy figure", () => {
    renderTable([
      row({ marketSelect: "jita", listingSelect: "buyP95" }),
    ]);

    expect(
      within(rowFor("Tritanium")).getByText("Jita · Buy 95%"),
    ).toBeInTheDocument();
  });

  // A row priced from a real purchase has no market figure behind it, and
  // repeating the plan chip's "Paid" would say the same thing twice.
  it("names Price Entry for a row that was actually bought", () => {
    renderTable([row({ plan: MATERIAL_PLAN.PAID })]);

    const cells = within(rowFor("Tritanium")).getAllByRole("cell");
    expect(cells[5]).toHaveTextContent("Price Entry");
    expect(cells[6]).toHaveTextContent("Paid");
  });
});

// A player picks a row out by its icon before reading the name beside it.
describe("the item artwork", () => {
  it("shows each material's own icon", () => {
    renderTable([row({ typeID: 34 })]);

    expect(
      rowFor("Tritanium").querySelector('img[src*="/types/34/icon"]'),
    ).toBeTruthy();
  });

  // The image server answers a non-power-of-two size with a 400 and no image.
  it("asks for a size the image server will actually serve", () => {
    renderTable([row({ typeID: 34 })]);

    const src = document.querySelector('img[src*="/types/34/icon"]').getAttribute("src");
    const size = Number(new URL(src).searchParams.get("size"));
    expect(Number.isInteger(Math.log2(size))).toBe(true);
  });
});

// The drawer states a shortfall in full, but a row has to be opened to reach it,
// and a player with thirty materials has no reason to open the one that drifted.
describe("a row whose child jobs no longer make enough", () => {
  const shortRow = (overrides) =>
    row({
      coverage: {
        required: 10_000_000,
        produced: 4_000_000,
        shortfall: 6_000_000,
        isShort: true,
        mode: "extrapolate",
      },
      matchedChildJobs: [{ name: "Tritanium job" }],
      ...overrides,
    });

  it("says so on the row itself", () => {
    renderTable([shortRow()]);

    expect(screen.getByText("6,000,000 short")).toBeInTheDocument();
  });

  it("keeps the plan chip beside it, since the row is still building", () => {
    renderTable([shortRow()]);

    // Scoped to the row: "Build" is also a column header.
    const cells = screen.getByText("Tritanium").closest("tr");
    expect(within(cells).getByText("Build")).toBeInTheDocument();
    expect(within(cells).getByText("6,000,000 short")).toBeInTheDocument();
  });

  it("marks the row so it is findable in a long list", () => {
    renderTable([shortRow()]);

    // The same stripe a row that is cheaper to build carries: both mean the row
    // wants a second look.
    const cell = screen.getByText("Tritanium").closest("td");
    expect(cell).toHaveStyle({ boxShadow: expect.stringContaining("inset") });
  });

  // A linked job producing nothing has no build price, so the row falls back to
  // the Buy plan — and that is the row most in need of the tag, not least.
  it("says so on a linked row whose job now makes nothing", () => {
    renderTable([
      shortRow({
        plan: MATERIAL_PLAN.BUY,
        buildPrice: null,
        delta: null,
        coverage: {
          required: 10_000_000,
          produced: 0,
          shortfall: 10_000_000,
          isShort: true,
          mode: "extrapolate",
        },
      }),
    ]);

    expect(screen.getByText("10,000,000 short")).toBeInTheDocument();
  });

  it("says nothing on a row its jobs still cover", () => {
    renderTable([
      shortRow({
        coverage: {
          required: 10_000_000,
          produced: 10_000_000,
          shortfall: 0,
          isShort: false,
          mode: "extrapolate",
        },
      }),
    ]);

    expect(screen.queryByText(/short/)).not.toBeInTheDocument();
  });
});
