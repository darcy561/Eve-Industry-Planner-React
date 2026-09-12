import { useCallback, useMemo, useState } from "react";
import { useHasChanged } from "../../Hooks/useHasChanged";

/**
 * Series a reader can take off a chart, for any chart drawn from a series list.
 *
 * A chart whose series differ by orders of magnitude — cost components against
 * materials, extras against the category that dwarfs them — scales its axis to
 * the largest and leaves the rest on the floor. Taking the large one off is what
 * makes the others readable, because the axis then scales to what is left.
 *
 * Pair it with [ChartKeys], which draws the keys and is where the pressing
 * happens, and turn the chart's own legend off:
 *
 * ```jsx
 * const { series, toggle } = useChartKeys(SERIES);
 * <ChartKeys series={series} seed={SEED} onToggle={toggle} />
 * <TimeSeriesChart series={series} paletteSeed={SEED} showLegend={false} … />
 * ```
 *
 * The series come back in the order they were given, each carrying whether it is
 * hidden, so a key and the mark it names take the same place in the colour
 * rotation whatever a reader has set aside.
 *
 * @param {Array<{key: string}>} series - memoise a list built from data, or the
 *   hidden set would be reasoning about a new list on every render
 * @returns {{series: Array<Object>, hidden: Set<string>, toggle: (key: string) => void}}
 */
export function useChartKeys(series) {
  const [hidden, setHidden] = useState(() => new Set());
  const total = series.length;

  // A list built from data changes with the window a reader asks for: a
  // category with nothing in the new period is gone from it. What was set aside
  // is about the chart in front of them, so a key that is no longer drawn is
  // forgotten — and a set that would leave nothing on the chart is dropped
  // whole, because a plain change of range must never blank it.
  const keys = series.map((s) => s.key).join("\u0000");
  if (useHasChanged(keys)) {
    setHidden((current) => {
      const kept = series.filter((s) => current.has(s.key));
      if (kept.length === current.size && kept.length < total) return current;
      return kept.length >= total ? new Set() : new Set(kept.map((s) => s.key));
    });
  }

  const toggle = useCallback(
    (key) =>
      setHidden((current) => {
        const next = new Set(current);
        if (next.has(key)) {
          next.delete(key);
        } else if (next.size < total - 1) {
          // A chart with nothing on it draws nothing and says nothing about
          // why, so the last series standing stays.
          next.add(key);
        }
        return next;
      }),
    [total],
  );

  const withHidden = useMemo(
    () => series.map((s) => ({ ...s, hidden: hidden.has(s.key) })),
    [series, hidden],
  );

  return { series: withHidden, hidden, toggle };
}

export default useChartKeys;
