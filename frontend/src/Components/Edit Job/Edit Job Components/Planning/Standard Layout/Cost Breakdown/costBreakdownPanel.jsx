import { Stack, useTheme } from "@mui/material";

import AppShellPanel from "../../../../../../Styled Components/Paper/AppShellPanel";
import { ProportionBar } from "../../../../../../Styled Components/Charts";
import {
  HeadlineStat,
  PanelHeadline,
} from "../../../../../../Styled Components/Typography/figures";
import { formatIsk } from "../../../../../../Functions/Helper/numberParser";
import CostTable from "./costTable";
import { costParts } from "./costParts";

/**
 * What the build costs, and what each part of that is.
 *
 * One pricing model at a time, named in the header, so every figure beneath it
 * has one meaning.
 *
 * @param {object} props
 * @param {import("../../../../../../Functions/MarketData/costBreakdown").CostBreakdown} props.cost
 * @param {React.ReactNode} [props.aside] - Shown beside the headline figure
 * @param {React.ReactNode} [props.children] - Shown under the table
 * @param {React.ReactNode} [props.action] - Shown in the panel header
 * @param {Array<{label: string, onClick: Function, disabled?: boolean}>} [props.menuItems]
 */
export default function CostBreakdownPanel({
  cost,
  aside,
  action,
  children,
  menuItems = [],
}) {
  const theme = useTheme();

  if (!cost) return null;

  return (
    <AppShellPanel
      title="Cost Breakdown"
      componentName="CostBreakdownPanel"
      // Every panel on this stage sits in a Masonry that measures it, and a
      // panel filling an undecided height grows without bound.
      paperSx={{ height: "auto" }}
      action={action}
      enableMenu={menuItems.length > 0}
      menuItems={menuItems}
    >
      <Stack spacing={2}>
        <PanelHeadline aside={aside}>
          <HeadlineStat
            caption="Cost per unit"
            value={cost.perUnit === null ? null : formatIsk(cost.perUnit)}
          />
        </PanelHeadline>

        {/* The shape of the cost before its figures: which band dominates is
            readable here in a glance, and the dots in the table say which row
            is which segment. */}
        <ProportionBar
          parts={costParts(cost, theme)}
          describe={(part) => `${part.label} — ${formatIsk(part.value)}`}
        />

        <CostTable cost={cost} formatIsk={formatIsk} />

        {children}
      </Stack>
    </AppShellPanel>
  );
}
