import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { RangeBar } from "./RangeBar";

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

  it("labels the ends of the range where a panel gives it words", () => {
    bar({ labels: ["46.1M", "58.4M"] });

    expect(screen.getByText("46.1M")).toBeInTheDocument();
    expect(screen.getByText("58.4M")).toBeInTheDocument();
  });

  it("shows what a panel offers instead when there is no range", () => {
    // A first build has nothing to be placed among.
    render(
      <RangeBar
        low={undefined}
        high={undefined}
        value={undefined}
        label="range"
        empty={<span>No previous builds</span>}
      />
    );

    expect(screen.getByText("No previous builds")).toBeInTheDocument();
  });

  it("takes its marker the way a chart series does", () => {
    bar({ marker: { colour: "rgb(1, 2, 3)" } });

    expect(screen.getByTestId("range-value")).toHaveStyle({
      backgroundColor: "rgb(1, 2, 3)",
    });
  });
});
