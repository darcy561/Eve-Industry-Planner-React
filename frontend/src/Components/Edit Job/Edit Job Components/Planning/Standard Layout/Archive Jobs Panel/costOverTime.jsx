import { useMemo } from "react";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";

import {
  TimeSeriesChart,
  timeSeriesSurfaceStyle,
} from "../../../../../../Styled Components/Charts";
import { appShellInsetSurfaceSx } from "../../../../../../Context/appShell";
import {
  COST_SERIES,
  toBuildCostPerUnitRows,
} from "../../../../../../Components/Archive Statistics/chartAdapters";
import { shortMonthLabel } from "./buildHistoryFigures";

/**
 * What this item has cost to build, month by month.
 *
 * Shared because two panels want the same chart: Build History, where it is the
 * record, and Cost Breakdown, where it is the history behind the figure the
 * panel leads with. Drawing it twice would let the two drift.
 *
 * @param {object} props
 * @param {object} [props.timelineData] - From useAccountTimelineQuery
 */
export default function CostOverTime({ timelineData }) {
  const theme = useTheme();
  const deviceNotMobile = useMediaQuery(theme.breakpoints.up("sm"));
  const surfaceSx = useMemo(
    () => timeSeriesSurfaceStyle(deviceNotMobile),
    [deviceNotMobile],
  );

  const rows = useMemo(
    () => toBuildCostPerUnitRows(timelineData),
    [timelineData],
  );

  return (
    <Box sx={[appShellInsetSurfaceSx, { p: 1.5 }]}>
      {/* The chart sizes itself from its container, which it can only measure
          once laid out. Holding that height keeps a collapse growing to the
          size the chart settles at. */}
      <Box sx={surfaceSx}>
        {rows.length === 0 ? (
          <Typography sx={{ typography: "body2" }} align="center">
            No monthly figures for this item yet.
          </Typography>
        ) : (
          <TimeSeriesChart
            rows={rows}
            categoryKey="month"
            series={COST_SERIES}
            formatCategory={shortMonthLabel}
            leftAxisLabel="Cost per unit"
          />
        )}
      </Box>
    </Box>
  );
}
