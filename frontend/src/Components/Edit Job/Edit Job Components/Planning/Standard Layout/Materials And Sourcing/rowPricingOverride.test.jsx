import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../../../../../../Zustand/usersStore.js", () => ({
  default: (selector) =>
    selector({
      applicationSettings: {
        defaultMarketLocation: "jita",
        defaultOrderType: "sell",
      },
    }),
}));

const { default: RowPricingOverride } = await import("./rowPricingOverride.jsx");

function renderControl(props = {}) {
  render(
    <RowPricingOverride
      typeID={34}
      panelMarket="jita"
      panelListing="sell"
      onMarketCommit={() => {}}
      onListingCommit={() => {}}
      onReset={() => {}}
      {...props}
    />
  );
}

describe("where a single material is priced", () => {
  it("offers a market and a listing to change", () => {
    renderControl();

    expect(screen.getByText("Market")).toBeInTheDocument();
    expect(screen.getByText("Listing")).toBeInTheDocument();
  });

  it("offers no way back while the row follows the panel", () => {
    // Nothing to undo, so an undo would be a control that does nothing.
    renderControl();

    expect(screen.queryByRole("button", { name: /follow panel/i })).toBeNull();
  });

  it("offers a way back once the row has its own hub", () => {
    renderControl({ overrideMarket: "amarr" });

    expect(
      screen.getByRole("button", { name: /follow panel/i })
    ).toBeInTheDocument();
  });

  it("offers a way back once the row has its own basis", () => {
    renderControl({ overrideListing: "buyP95" });

    expect(
      screen.getByRole("button", { name: /follow panel/i })
    ).toBeInTheDocument();
  });

  it("names the material when putting it back on the panel's basis", async () => {
    const onReset = vi.fn();
    const user = userEvent.setup();
    renderControl({ overrideMarket: "amarr", onReset });

    await user.click(screen.getByRole("button", { name: /follow panel/i }));

    expect(onReset).toHaveBeenCalledWith(34);
  });

  it("cannot be changed while the job is read only", () => {
    renderControl({ overrideMarket: "amarr", disabled: true });

    expect(screen.getByRole("button", { name: /follow panel/i })).toBeDisabled();
  });
});
