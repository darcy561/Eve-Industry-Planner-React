import { describe, it, expect } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithTheme } from "../../../../../../tests/archiveHarness.jsx";
import CostOverTime from "./costOverTime.jsx";

/**
 * The chart Build History and Cost Breakdown both draw. What it owes either of
 * them is the keys over its cost components — materials bury install and
 * invention on a per-unit chart as surely as they do anywhere else.
 */

const timelineData = {
  months: [
    {
      year: 2026,
      month: 7,
      complete: true,
      quantityProduced: 10,
      materialCostTotal: 3000,
      installCostTotal: 1000,
      inventionCostTotal: 500,
      extrasTotal: 500,
    },
  ],
};

describe("CostOverTime", () => {
  it("gives each cost component a key to press", () => {
    renderWithTheme(<CostOverTime timelineData={timelineData} />);

    const key = screen.getByRole("button", { name: "Materials" });
    expect(key).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(key);

    expect(key).toHaveAttribute("aria-pressed", "false");
  });

  // Keys over a chart that is not there name nothing.
  it("shows no keys before there is anything to draw", () => {
    renderWithTheme(<CostOverTime timelineData={{ months: [] }} />);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(
      screen.getByText("No monthly figures for this item yet."),
    ).toBeInTheDocument();
  });
});
