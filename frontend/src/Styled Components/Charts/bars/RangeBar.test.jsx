import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { RangeBar } from "./RangeBar";

// MUI compiles sx to a class, so the value is only on the computed style.
const percent = (element) =>
  Number.parseFloat(window.getComputedStyle(element).left);

const bar = (props) =>
  render(<RangeBar low={100} high={200} value={150} label="range" {...props} />);

describe("RangeBar", () => {

  it("places this build within the range", () => {
    const { container } = bar();

    expect(container.querySelector("[data-testid='range-value']")).toHaveStyle({
      left: "50%",
    });
  });

  it("marks the average separately where there is one", () => {
    bar({ average: 175 });

    // Three quarters of the way along the range, which the padded scale places
    // short of three quarters of the track.
    expect(screen.getByTestId("range-average")).toHaveStyle({
      left: `${((175 - 85) / 130) * 100}%`,
    });
  });

  it("leaves the average unmarked where there is none", () => {
    bar();

    expect(screen.queryByTestId("range-average")).toBeNull();
  });

  // The whole reason the scale is wider than the range: a build dearer than
  // every previous one has to look dearer than every previous one, not equal to
  // the dearest.
  it("draws a build outside the range beyond the end of it", () => {
    bar({ value: 400 });

    const highTick = percent(screen.getAllByTestId("range-tick")[1]);
    const marker = percent(screen.getByTestId("range-value"));

    expect(marker).toBeGreaterThan(highTick);
    expect(marker).toBeLessThan(100);
  });

  it("draws a build under the range short of the start of it", () => {
    bar({ value: 40 });

    const lowTick = percent(screen.getAllByTestId("range-tick")[0]);
    const marker = percent(screen.getByTestId("range-value"));

    expect(marker).toBeLessThan(lowTick);
    expect(marker).toBeGreaterThan(0);
  });

  // Without room either side the span covers the whole track and the ticks sit
  // on its ends, which says nothing about where the range is.
  it("insets the range so it reads as a range", () => {
    bar();

    expect(percent(screen.getAllByTestId("range-tick")[0])).toBeGreaterThan(0);
    expect(percent(screen.getAllByTestId("range-tick")[1])).toBeLessThan(100);
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

// The average is optional, and a consumer with no history to average can hand
// over something that is not a number. The marker is skipped for that already —
// the scale has to skip it too, or every position on the bar becomes NaN.
describe("an average that is not a number", () => {
  const positions = () =>
    ["range-value", "range-tick"].flatMap((id) =>
      screen.getAllByTestId(id).map(percent),
    );

  it.each([NaN, null, undefined])("still places the range with %s", (average) => {
    bar({ average });

    for (const at of positions()) {
      expect(Number.isFinite(at)).toBe(true);
      expect(at).toBeGreaterThanOrEqual(0);
      expect(at).toBeLessThanOrEqual(100);
    }
  });

  it("marks no average for one that is not a number", () => {
    bar({ average: NaN });

    expect(screen.queryByTestId("range-average")).toBeNull();
  });
});
