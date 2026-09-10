import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import CostBreakdownPanel from "./costBreakdownPanel";

const cost = (overrides = {}) => ({
  toBuild: {
    lines: [
      { id: "bought", label: "Materials bought at market", value: 400, perUnit: 40 },
    ],
    total: 400,
    perUnit: 40,
  },
  toSell: { lines: [], total: 0, perUnit: 0 },
  total: 400,
  perUnit: 40,
  ...overrides,
});

describe("the Cost Breakdown panel", () => {
  it("leads with what a unit costs", () => {
    render(<CostBreakdownPanel cost={cost()} />);

    expect(screen.getByText("Cost per unit")).toBeInTheDocument();
    expect(screen.getByText("Cost Breakdown")).toBeInTheDocument();
  });

  it("draws the breakdown beneath it", () => {
    render(<CostBreakdownPanel cost={cost()} />);

    expect(screen.getByText("Materials bought at market")).toBeInTheDocument();
    expect(screen.getByText("Cost to build")).toBeInTheDocument();
  });

  it("says nothing rather than a zero when the job makes nothing", () => {
    render(<CostBreakdownPanel cost={cost({ perUnit: null })} />);

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("holds whatever a caller puts beside the headline", () => {
    render(
      <CostBreakdownPanel cost={cost()} aside={<span>range bar</span>} />
    );

    expect(screen.getByText("range bar")).toBeInTheDocument();
  });

  it("does not try to fill a height the Masonry has not decided", () => {
    // The stage measures its panels; one filling 100% of an undecided height
    // renders as a tall empty box and pushes its siblings out of the column.
    const { container } = render(<CostBreakdownPanel cost={cost()} />);

    expect(container.querySelector(".MuiPaper-root")).not.toHaveStyle({
      height: "100%",
    });
  });

  it("draws nothing without figures to draw", () => {
    const { container } = render(<CostBreakdownPanel cost={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
