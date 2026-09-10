import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProportionBar, RangeBar } from "./bars";

describe("RangeBar", () => {
  const bar = (props) =>
    render(<RangeBar low={100} high={200} value={150} label="range" {...props} />);

  it("places this build within the range", () => {
    const { container } = bar();

    expect(container.querySelector("[data-testid='range-value']")).toHaveStyle({
      left: "50%",
    });
  });

  it("marks the average separately where there is one", () => {
    bar({ average: 175 });

    expect(screen.getByTestId("range-average")).toHaveStyle({ left: "75%" });
  });

  it("leaves the average unmarked where there is none", () => {
    bar();

    expect(screen.queryByTestId("range-average")).toBeNull();
  });

  it("keeps a build outside the range on the bar rather than off it", () => {
    bar({ value: 400 });

    expect(screen.getByTestId("range-value")).toHaveStyle({ left: "100%" });
  });

  it("sits in the middle when every build cost the same", () => {
    // Dividing by a range of nothing would put it nowhere.
    bar({ low: 100, high: 100, value: 100 });

    expect(screen.getByTestId("range-value")).toHaveStyle({ left: "50%" });
  });

  it("describes itself to a reader who cannot see it", () => {
    bar({ label: "This build is mid-range of 7" });

    expect(screen.getByRole("img", { name: /mid-range of 7/ })).toBeInTheDocument();
  });
});

describe("ProportionBar", () => {
  const parts = [
    { id: "materials", label: "Materials", value: 750 },
    { id: "install", label: "Install", value: 250 },
  ];

  it("sizes each part by its share of the total", () => {
    render(<ProportionBar parts={parts} />);

    expect(screen.getByTestId("proportion-materials")).toHaveStyle({ width: "75%" });
    expect(screen.getByTestId("proportion-install")).toHaveStyle({ width: "25%" });
  });

  it("leaves out a part that is nothing", () => {
    render(<ProportionBar parts={[...parts, { id: "extras", label: "Extras", value: 0 }]} />);

    expect(screen.queryByTestId("proportion-extras")).toBeNull();
  });

  it("draws nothing at all when the total is nothing", () => {
    const { container } = render(
      <ProportionBar parts={[{ id: "a", label: "A", value: 0 }]} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
