import { Grid } from "@mui/material";
import { CurrentMaterialHeader } from "./currentMaterialHeader";
import { MaterialTotals_MaterialPricesPanel } from "./materialTotals";
import ContentPanel from "../../../../../../Styled Components/Paper/ContentPanel";
import { useMaterialPricingModel } from "./Hooks/useMaterialPricingModel";

/**
 * What the build is worth and what it comes to.
 *
 * All that is left of the panel that used to carry the material rows as well.
 * Materials & Sourcing took those; Returns takes what remains, so this is a
 * holding place for two figures rather than a panel with a job of its own.
 *
 * @param {object} props
 */
export function MaterialCostPanel(props) {
  const { state } = props;
  const {
    marketSelect,
    listingSelect,
    hasSetupToEdit,
    totals,
  } = useMaterialPricingModel({ state, actions: props.actions });

  if (!hasSetupToEdit) return null;

  return (
    <ContentPanel
      title="Estimated Market Costs"
      paperSx={{ position: "relative", height: "auto" }}
      titleMarginBottom={6}
    >
      <CurrentMaterialHeader
        {...props}
        marketSelect={marketSelect}
        listingSelect={listingSelect}
      />
      <Grid container size={12}>
        <MaterialTotals_MaterialPricesPanel
          state={state}
          totals={totals}
          listingSelect={listingSelect}
        />
      </Grid>
    </ContentPanel>
  );
}
