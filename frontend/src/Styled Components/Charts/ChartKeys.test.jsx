import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ChartKeys } from "./ChartKeys";
import { resolveSeriesColour } from "./chartTheme";

const theme = createTheme();

const series = [
  { key: "materialCostTotal", label: "Materials" },
  { key: "installCostTotal", label: "Install" },
  { key: "extrasTotal", label: "Extras" },
];

function draw(props) {
  return render(
    <ThemeProvider theme={theme}>
      <ChartKeys series={series} onToggle={() => {}} {...props} />
    </ThemeProvider>,
  );
}

describe("ChartKeys", () => {
  // The reason these exist rather than recharts' own legend: a key there is not
  // reachable by pointer or by keyboard, because the chart surface takes the
  // click. A button is both.
  it("gives every series a key that can be pressed", () => {
    draw();

    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Materials" })).toBeEnabled();
  });

  it("reports the series a reader pressed", () => {
    const onToggle = vi.fn();
    draw({ onToggle });

    fireEvent.click(screen.getByRole("button", { name: "Install" }));

    expect(onToggle).toHaveBeenCalledWith("installCostTotal");
  });

  // The key is the way back to a series that is not being drawn, so it says
  // which state it is in rather than leaving.
  it("says which series are on show", () => {
    draw({
      series: series.map((s) => ({
        ...s,
        hidden: s.key === "materialCostTotal",
      })),
    });

    expect(screen.getByRole("button", { name: "Materials" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Install" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  // The state has to read from across the panel, not only in the swatch: a key
  // that is off is an empty outline with its label struck through, and a key
  // that is on is filled in its own colour.
  it("shows at a glance which are on the chart", () => {
    draw({
      series: series.map((s) => ({
        ...s,
        hidden: s.key === "materialCostTotal",
      })),
    });

    expect(screen.getByRole("button", { name: "Materials" })).toHaveStyle({
      textDecoration: "line-through",
      backgroundColor: "rgba(0, 0, 0, 0)",
    });
    expect(screen.getByRole("button", { name: "Install" })).not.toHaveStyle({
      textDecoration: "line-through",
    });
  });

  // A chart with nothing on it draws nothing and says nothing about why.
  it("will not let the last series be taken away", () => {
    draw({
      series: series.map((s) => ({ ...s, hidden: s.key !== "extrasTotal" })),
    });

    expect(screen.getByRole("button", { name: "Extras" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Install" })).toBeEnabled();
  });

  // A disabled button leaves the tab order, taking the explanation of why it is
  // disabled with it unless something beside it holds the focus.
  it("keeps the reason the last key cannot be pressed reachable", () => {
    draw({
      series: series.map((s) => ({ ...s, hidden: s.key !== "extrasTotal" })),
    });

    const anchor = (label) =>
      screen.getByRole("button", { name: label }).parentElement;

    expect(anchor("Extras")).toHaveAttribute("tabindex", "0");
    // The button beside it is focusable itself; a second stop would be noise.
    expect(anchor("Install")).not.toHaveAttribute("tabindex");
  });

  // A key and the mark it names must agree, so both read the same rotation.
  it("takes a swatch from the chart's own colours", () => {
    const { container } = draw({ seed: "archive-cost-breakdown" });
    const swatch = screen
      .getByRole("button", { name: "Install" })
      .querySelector("span,div");

    expect(container).toBeTruthy();
    expect(swatch).toHaveStyle({
      backgroundColor: resolveSeriesColour(
        theme,
        series[1],
        1,
        "archive-cost-breakdown",
      ),
    });
  });
});
