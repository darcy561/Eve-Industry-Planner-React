import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChartKeys } from "./useChartKeys";

const SERIES = [
  { key: "materials", label: "Materials", type: "bar" },
  { key: "install", label: "Install", type: "bar" },
  { key: "extras", label: "Extras", type: "bar" },
];

describe("useChartKeys", () => {
  it("hands the series back as they were, with nothing set aside", () => {
    const { result } = renderHook(() => useChartKeys(SERIES));

    expect(result.current.series.map((s) => s.key)).toEqual([
      "materials",
      "install",
      "extras",
    ]);
    expect(result.current.series.some((s) => s.hidden)).toBe(false);
  });

  // What the series carried before — mark type, stack, axis — is the chart's,
  // and hiding one must not quietly drop any of it.
  it("keeps what each series already said about itself", () => {
    const { result } = renderHook(() => useChartKeys(SERIES));

    act(() => result.current.toggle("materials"));

    expect(result.current.series[0]).toMatchObject({
      key: "materials",
      label: "Materials",
      type: "bar",
      hidden: true,
    });
  });

  it("gives a series back when its key is pressed again", () => {
    const { result } = renderHook(() => useChartKeys(SERIES));

    act(() => result.current.toggle("install"));
    act(() => result.current.toggle("install"));

    expect(result.current.hidden.size).toBe(0);
  });

  // A chart with nothing on it draws nothing and says nothing about why.
  it("keeps one series on the chart", () => {
    const { result } = renderHook(() => useChartKeys(SERIES));

    act(() => result.current.toggle("materials"));
    act(() => result.current.toggle("install"));
    act(() => result.current.toggle("extras"));

    expect([...result.current.hidden]).toEqual(["materials", "install"]);
  });

  // The series a chart draws follow the window a reader asked for, and the
  // component stays mounted across that change.
  describe("when the series list itself changes", () => {
    const hauling = { key: "hauling", label: "Hauling", type: "bar" };
    const copies = { key: "copies", label: "Copies", type: "bar" };
    const fuel = { key: "fuel", label: "Fuel", type: "bar" };

    function keysFor(initial) {
      return renderHook(({ list }) => useChartKeys(list), {
        initialProps: { list: initial },
      });
    }

    it("keeps what a reader set aside while it is still on the chart", () => {
      const { result, rerender } = keysFor([hauling, copies, fuel]);

      act(() => result.current.toggle("hauling"));
      rerender({ list: [hauling, copies] });

      expect([...result.current.hidden]).toEqual(["hauling"]);
    });

    // The hidden set is about the chart in front of the reader, so a category
    // that was not in the window they asked for is not still being refused.
    it("forgets a series that is no longer drawn", () => {
      const { result, rerender } = keysFor([hauling, copies, fuel]);

      act(() => result.current.toggle("hauling"));
      rerender({ list: [copies, fuel] });
      rerender({ list: [hauling, copies, fuel] });

      expect(result.current.hidden.size).toBe(0);
    });

    // The trap this guards: two categories set aside, then a window that holds
    // only those two. Nothing would be left to draw.
    it("never leaves the chart with nothing on it", () => {
      const { result, rerender } = keysFor([hauling, copies, fuel]);

      act(() => result.current.toggle("hauling"));
      act(() => result.current.toggle("copies"));
      rerender({ list: [hauling, copies] });

      expect(result.current.hidden.size).toBe(0);
      expect(result.current.series.some((s) => s.hidden)).toBe(false);
    });
  });

  // Colours come from a series' place in the list, so the list keeps its order
  // and its length whatever a reader has set aside.
  it("leaves every series in its own place", () => {
    const { result } = renderHook(() => useChartKeys(SERIES));

    act(() => result.current.toggle("install"));

    expect(result.current.series.map((s) => s.key)).toEqual(
      SERIES.map((s) => s.key),
    );
  });
});
