import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { monthLabel, useCostComponentStack } from "./panelParts";
import { COST_COMPONENTS } from "./chartAdapters";

// The two panels that plot months each solved half of this and lost the other
// half. Combined, both statements hold wherever months are drawn.
describe("monthLabel", () => {
  const short = [
    { month: "2026-07", complete: true },
    { month: "2026-08", complete: false },
  ];

  it("marks a month still in progress", () => {
    const label = monthLabel(short);

    expect(label("2026-07")).toBe("2026-07");
    // A partial month standing lower than the rest is not a decline, so it says
    // what it is.
    expect(label("2026-08")).toBe("2026-08 (so far)");
  });

  it("drops the century once there are too many months to fit", () => {
    const many = Array.from({ length: 13 }, (_, i) => ({
      month: `2026-${String(i + 1).padStart(2, "0")}`,
      complete: true,
    }));

    expect(monthLabel(many)("2026-01")).toBe("26-01");
  });

  // The case that needed the two halves joined: a long window whose last month
  // is still running.
  it("shortens and marks at the same time", () => {
    const many = Array.from({ length: 13 }, (_, i) => ({
      month: `2026-${String(i + 1).padStart(2, "0")}`,
      complete: i < 12,
    }));

    expect(monthLabel(many)("2026-01")).toBe("26-01");
    expect(monthLabel(many)("2026-13")).toBe("26-13 (so far)");
  });

  // A row the chart has no entry for is still labelled, rather than throwing.
  it("labels a value it has no row for", () => {
    expect(monthLabel(short)("2025-01")).toBe("2025-01");
    expect(monthLabel()("2025-01")).toBe("2025-01");
  });
});

// Both panels that draw the cost split — the account's months and an item's own
// — take the stack from here, so what a reader sets aside behaves the same on
// either of them.
describe("the cost component stack", () => {
  const data = {
    months: [
      {
        year: 2026,
        month: 3,
        complete: true,
        materialCostTotal: 100,
        installCostTotal: 10,
        inventionCostTotal: 5,
        extrasTotal: 7,
        brokersFeeTotal: 2,
        transactionFeeTotal: 3,
      },
    ],
  };

  it("names every component, in ISK, beside one another", () => {
    const { result } = renderHook(() => useCostComponentStack(data));

    expect(result.current.series.map((s) => s.key)).toEqual(
      COST_COMPONENTS.map((c) => c.key),
    );
    expect(result.current.series.every((s) => s.stackId === undefined)).toBe(
      true,
    );
    expect(result.current.rows[0].materialCostTotal).toBe(100);
  });

  // An item's own composition is one column a month; the account's is a column
  // per component. The rows are the same either way.
  it("stacks them into one column a month when asked", () => {
    const { result } = renderHook(() =>
      useCostComponentStack(data, { stacked: true }),
    );

    expect(result.current.series.every((s) => s.stackId === "cost")).toBe(true);
  });

  // Taking materials off is what lets the axis scale to what is left, which is
  // the whole point of the keys on these charts.
  it("marks what a reader has taken off the chart", () => {
    const { result } = renderHook(() => useCostComponentStack(data));

    act(() => result.current.toggle("materialCostTotal"));

    expect(
      result.current.series.find((s) => s.key === "materialCostTotal").hidden,
    ).toBe(true);
    // The figure stays on the row: the key can be pressed again.
    expect(result.current.rows[0].materialCostTotal).toBe(100);
  });
});
