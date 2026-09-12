import { useMemo } from "react";
import { Typography } from "@mui/material";
// Imported from the module rather than the folder's index: a panel test that
// stands in for the chart components replaces that index, and the state behind
// the keys is not one of them.
import { useChartKeys } from "../../Styled Components/Charts/useChartKeys";
import { COST_COMPONENTS, toCostComponentRows } from "./chartAdapters";

/**
 * Where the cost components sit in the colour rotation. Named rather than left
 * to the category, so both panels that draw the split agree on which colour
 * materials are, and so a month chart does not start where the fixed-series ones
 * do.
 */
const COST_COMPONENT_SEED = "cost-components";

/**
 * Axis labels for a set of month rows: a month still in progress says so, and a
 * long window drops the century so the labels fit.
 *
 * @param {{month: string, complete?: boolean}[]} rows
 * @returns {(value: string) => string}
 */
export function monthLabel(rows = []) {
  const many = rows.length > 12;
  return (value) => {
    const row = rows.find((r) => r.month === value);
    const text = many ? value.slice(2) : value;
    return row && row.complete === false ? `${text} (so far)` : text;
  };
}

/** Empty state, so a panel with no rows says why rather than drawing nothing. */
export function NoData({ children }) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ py: 4 }}
      align="center"
    >
      {children}
    </Typography>
  );
}

/**
 * The cost components as a chart a reader can take keys off, and the rows for
 * it. Both panels that draw the split — the account's month by month and an
 * item's own — ask for it here, so a component added to [COST_COMPONENTS] lands
 * on both, in the same colours.
 *
 * @param {Object} data - `GET /statistics/{owner}/timeline`
 * @param {{stacked?: boolean}} [options] - bars stacked into one column per
 *   month rather than drawn beside one another
 */
export function useCostComponentStack(data, { stacked = false } = {}) {
  const rows = useMemo(() => toCostComponentRows(data), [data]);

  const components = useMemo(
    () =>
      COST_COMPONENTS.map(({ key, label }) => ({
        key,
        label,
        type: "bar",
        ...(stacked ? { stackId: "cost" } : {}),
      })),
    [stacked],
  );

  const { series, toggle } = useChartKeys(components);

  return { rows, series, toggle, seed: COST_COMPONENT_SEED };
}
