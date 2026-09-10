import { Stack } from "@mui/material";

import AppShellPanel from "../../../../../../Styled Components/Paper/AppShellPanel";
import {
  HeadlineStat,
  PanelHeadline,
} from "../../../../../../Styled Components/Typography/figures";
import { formatNumberForLocale } from "../../../../../../Functions/Helper/numberParser";
import CostTable from "./costTable";

/**
 * What the build costs, and what each part of that is.
 *
 * Replaces the totals block that printed both pricing models at once and marked
 * neither as the one in effect.
 *
 * @param {object} props
 * @param {import("../../../../../../Functions/MarketData/costBreakdown").CostBreakdown} props.cost
 * @param {React.ReactNode} [props.aside] - Shown beside the headline figure
 * @param {React.ReactNode} [props.children] - Shown under the table
 * @param {Array<{label: string, onClick: Function, disabled?: boolean}>} [props.menuItems]
 */
export default function CostBreakdownPanel({
  cost,
  aside,
  children,
  menuItems = [],
}) {
  if (!cost) return null;

  return (
    <AppShellPanel
      title="Cost Breakdown"
      componentName="CostBreakdownPanel"
      // Every panel on this stage sits in a Masonry that measures it, and a
      // panel filling an undecided height grows without bound.
      paperSx={{ height: "auto" }}
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

        <CostTable cost={cost} formatIsk={formatIsk} />

        {children}
      </Stack>
    </AppShellPanel>
  );
}

/** ISK, at the precision the block this replaces used. */
const formatIsk = (value) => formatNumberForLocale(value);
