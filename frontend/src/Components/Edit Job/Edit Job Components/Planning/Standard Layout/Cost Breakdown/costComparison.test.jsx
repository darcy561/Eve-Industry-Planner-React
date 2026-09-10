import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import CostComparison from "./costComparison";
import { compareToHistory } from "../../../../../../Functions/MarketData/buildComparison";

const history = (overrides = {}) => ({
  buildCount: 4,
  cheapestCostPerItem: 228,
  dearestCostPerItem: 236,
  lastCostPerItem: 230,
  lastCostMonth: { year: 2026, month: 5 },
  ...overrides,
});

const formatIsk = (value) => String(Math.round(value));

const renderFor = (h, perUnit) =>
  render(
    <CostComparison
      comparison={compareToHistory(h, perUnit)}
      formatIsk={formatIsk}
    />,
  );

describe("the cost comparison", () => {
  it("places the build on a range drawn from the archive's own ends", () => {
    renderFor(history(), 234);

    expect(screen.getByText("228")).toBeInTheDocument();
    expect(screen.getByText("236")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "Cost per unit 234, against 228 to 236 across 4 builds",
    );
  });

  it("names the month the last build's cost is filed under", () => {
    renderFor(history(), 234);

    expect(screen.getByText("vs last build (May 2026)")).toBeInTheDocument();
    expect(screen.getByText("+1.7%")).toBeInTheDocument();
  });

  // A dot pinned to an end says nothing about how far past it the build is.
  it("says so when the build falls outside every previous one", () => {
    renderFor(history(), 200);

    expect(
      screen.getByText("Cheaper than any build you have archived"),
    ).toBeInTheDocument();
  });

  it("draws no range against a single previous build", () => {
    renderFor(
      history({ buildCount: 1, cheapestCostPerItem: 230, dearestCostPerItem: 230 }),
      240,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("+4.3%")).toBeInTheDocument();
  });

  // A first build is information rather than an absence: it says the estimate
  // has nothing to be checked against. It is also what a signed-out reader sees,
  // so there is one path and not two.
  it("says there is nothing to compare against rather than rendering nothing", () => {
    renderFor(undefined, 234);

    expect(
      screen.getByText(/No archived builds of this item yet/),
    ).toBeInTheDocument();
  });

  it("names the span the ends describe", () => {
    renderFor(history(), 234);

    expect(screen.getByText("your 4 builds")).toBeInTheDocument();
  });

  // Where this build sits between the ends means little without the average to
  // read it against.
  it("states the average and this build beneath the bar", () => {
    renderFor(history(), 234);

    expect(screen.getByText("Average 232 · this build 234")).toBeInTheDocument();
  });
});
