import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import ShortfallChip from "./shortfallChip";
import { COVERAGE_MODE } from "../../../../../../Functions/Groups/childJobCoverage";

const coverage = (overrides = {}) => ({
  required: 100,
  produced: 40,
  shortfall: 60,
  isShort: true,
  mode: COVERAGE_MODE.EXTRAPOLATE,
  ...overrides,
});

describe("the shortfall tag on a material row", () => {
  it("says how far short the row is without being opened", () => {
    render(<ShortfallChip coverage={coverage()} />);

    expect(screen.getByText("60 short")).toBeInTheDocument();
  });

  it("names the jobs behind the row, so a reader knows where to go", () => {
    render(
      <ShortfallChip
        coverage={coverage()}
        childJobs={[{ name: "Tritanium job" }, { name: "Spare job" }]}
      />,
    );

    expect(
      screen.getByLabelText(
        /Tritanium job, Spare job makes 40 of the 100 needed/,
      ),
    ).toBeInTheDocument();
  });

  it("says the missing units are bought when nothing will resize the job", () => {
    render(
      <ShortfallChip coverage={coverage({ mode: COVERAGE_MODE.SPLIT })} />,
    );

    expect(
      screen.getByLabelText(/costed at the market price/),
    ).toBeInTheDocument();
  });

  it("says the missing units assume a resize when one is coming", () => {
    render(<ShortfallChip coverage={coverage()} />);

    expect(
      screen.getByLabelText(/on the assumption it is resized/),
    ).toBeInTheDocument();
  });

  it("shows nothing for a row its jobs still cover", () => {
    const { container } = render(
      <ShortfallChip coverage={coverage({ isShort: false })} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows nothing for a row nothing builds", () => {
    const { container } = render(<ShortfallChip />);

    expect(container).toBeEmptyDOMElement();
  });
});
