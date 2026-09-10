import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

// The bar shows the shape of the cost and the table states the figures. On a
// build with six components it is not obvious which line a segment belongs to,
// and the colour dot alone asks a reader to match two small squares by eye.
describe("looking at a segment of the bar", () => {
  const renderPanel = () =>
    render(
      <CostBreakdownPanel
        cost={cost({
          toBuild: {
            lines: [
              {
                id: "bought",
                label: "Materials bought at market",
                value: 400,
                perUnit: 40,
              },
              { id: "install", label: "Install cost", value: 100, perUnit: 10 },
            ],
            total: 500,
            perUnit: 50,
          },
        })}
      />,
    );

  it("marks the row that states the same part in words", async () => {
    const { container } = renderPanel();

    await userEvent.hover(screen.getByTestId("proportion-bought"));

    expect(
      container.querySelector("tr[data-active='true']"),
    ).toHaveTextContent("Materials bought at market");
  });

  it("lets the rest of the bar recede so the eye can carry it", async () => {
    renderPanel();

    await userEvent.hover(screen.getByTestId("proportion-bought"));

    expect(screen.getByTestId("proportion-bought")).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByTestId("proportion-install")).not.toHaveAttribute(
      "data-active",
    );
  });

  it("puts everything back when the pointer leaves", async () => {
    const { container } = renderPanel();

    await userEvent.hover(screen.getByTestId("proportion-bought"));
    await userEvent.unhover(screen.getByTestId("proportion-bought"));

    expect(container.querySelector("tr[data-active='true']")).toBeNull();
  });

  // The link runs the other way too: a reader who has found the row wants to
  // know how much of the bar it is, which is the question the bar answers.
  it("marks the segment when the row is hovered instead", async () => {
    const { container } = renderPanel();

    await userEvent.hover(
      container.querySelector("tr td")?.closest("tr"),
    );

    expect(screen.getByTestId("proportion-bought")).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("puts the bar back when the pointer leaves the row", async () => {
    const { container } = renderPanel();
    const row = container.querySelector("tr td")?.closest("tr");

    await userEvent.hover(row);
    await userEvent.unhover(row);

    expect(screen.getByTestId("proportion-bought")).not.toHaveAttribute(
      "data-active",
    );
  });

  // Hover is a mouse, and the bar is the only way to reach some of these parts.
  it("marks the row from the keyboard too", async () => {
    const { container } = renderPanel();

    await userEvent.tab();
    await userEvent.tab();

    expect(
      container.querySelector("tr[data-active='true']"),
    ).toHaveTextContent("Install cost");
  });
});
