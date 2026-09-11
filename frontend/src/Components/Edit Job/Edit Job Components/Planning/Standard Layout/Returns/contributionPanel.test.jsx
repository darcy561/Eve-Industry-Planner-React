import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import ContributionPanel from "./contributionPanel";

const commitment = (overrides = {}) => ({
  hasParents: true,
  outstanding: 100,
  committed: 100,
  surplus: 0,
  ...overrides,
});

const renderPanel = (props = {}) =>
  render(
    <ContributionPanel
      commitment={commitment()}
      contributedCost={800}
      marketPrice={12}
      {...props}
    />,
  );

describe("the contribution panel", () => {
  it("leads with what the committed output cost, against buying it", () => {
    renderPanel();

    expect(screen.getByText("Cost contributed")).toBeInTheDocument();
    expect(screen.getByText("800.00")).toBeInTheDocument();
    expect(screen.getByText("If bought at market")).toBeInTheDocument();
    expect(screen.getByText("1,200.00")).toBeInTheDocument();
  });

  it("states the saving the parent gets from this job building it", () => {
    renderPanel();

    expect(
      screen.getByText("Building it here saves 400.00 against buying it"),
    ).toBeInTheDocument();
  });

  // The comparison has to be able to come out the other way, or it is not a
  // comparison — building is sometimes the dearer option.
  it("says so when building it costs more than buying it", () => {
    renderPanel({ contributedCost: 1500 });

    expect(
      screen.getByText("Building it here costs 300.00 more than buying it"),
    ).toBeInTheDocument();
  });

  // A player has to know why there is no sale price on this job.
  it("says why there is no fee or tax", () => {
    renderPanel();

    expect(
      screen.getByText(/carries no broker fee and no sales tax/),
    ).toBeInTheDocument();
  });

  it("names the spare output when the job makes more than is owed", () => {
    renderPanel({ commitment: commitment({ committed: 100, surplus: 40 }) });

    expect(screen.getByText("40 spare")).toBeInTheDocument();
  });

  it("draws nothing for a job with no parents", () => {
    const { container } = renderPanel({
      commitment: commitment({ hasParents: false, committed: 0, surplus: 100 }),
    });

    expect(container).toBeEmptyDOMElement();
  });

  // Where siblings already cover the parents' requirement this job owes nothing,
  // and a contribution of zero is not a contribution.
  it("draws nothing when nothing is actually owed", () => {
    const { container } = renderPanel({
      commitment: commitment({ outstanding: 0, committed: 0, surplus: 100 }),
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("takes its own height rather than its parent's", () => {
    const { container } = renderPanel();

    expect(container.querySelector(".MuiPaper-root")).not.toHaveStyle({
      height: "100%",
    });
  });
});
