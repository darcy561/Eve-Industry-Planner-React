import { Grid, Typography } from "@mui/material";
import { useMaterialCostCalculations } from "../../../../../../Hooks/GeneralHooks/useMaterialCostCalculations";
import { useJobManagement } from "../../../../../../Hooks/useJobManagement";
import { MaterialTotalsWithMarketPrices_MaterialPrices } from "./Material Totals/withMarketPrices";
import { MaterialTotalsWithChildJobs_MaterialPrices } from "./Material Totals/withChildJobs";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";

export function MaterialTotals_MaterialPricesPanel({
  activeJob,
  marketSelect,
  listingSelect,
  temporaryChildJobs,
  parentChildToEdit,
}) {
  const { calculateMaterialCostFromChildJobs } = useMaterialCostCalculations();
  const { findAllChildJobCountOrIDs } = useJobManagement();
  const { findItemPriceObject } = useHelperFunction();

  const totalInstallCosts = Object.values(activeJob.build.setup).reduce(
    (prev, setup) => {
      return (prev += setup.estimatedInstallCost * setup.jobCount);
    },
    0
  );

  const totalMaterialCost = activeJob.build.materials.reduce(
    (prev, { typeID, quantity }) => {
      const materialPriceObject = findItemPriceObject(typeID);
      if (!materialPriceObject) return prev;
      const currentMaterialPrice =
        materialPriceObject[marketSelect][listingSelect];

      return prev + currentMaterialPrice * quantity;
    },
    0
  );

  const totalBuildCost = activeJob.build.materials.reduce((prev, material) => {
    const matchedChildJobIDs = [
      ...activeJob.build.childJobs[material.typeID],
      ...(temporaryChildJobs[material.typeID]
        ? [temporaryChildJobs[material.typeID].jobID]
        : []),
    ];
    return (prev += calculateMaterialCostFromChildJobs(
      material,
      matchedChildJobIDs,
      temporaryChildJobs[material.typeID],
      [],
      marketSelect,
      listingSelect
    ));
  }, 0);

  const totalMarketPrice =
    findItemPriceObject(activeJob.itemID)?.[marketSelect][listingSelect] *
      activeJob.build.products.totalQuantity || 0;

  const { childJobCount } = findAllChildJobCountOrIDs(
    activeJob.build.childJobs,
    temporaryChildJobs,
    parentChildToEdit.childJobs
  );

  return (
    <Grid container item xs={12} sx={{ marginTop: 2 }}>
      <Grid container item xs={12} sm={6} align="center" spacing={1}>
        <MaterialTotalsWithChildJobs_MaterialPrices
          childJobCount={childJobCount}
          totalBuildCost={totalBuildCost}
          totalInstallCosts={totalInstallCosts}
          totalMarketPrice={totalMarketPrice}
          totalMaterialCost={totalMaterialCost}
          activeJob={activeJob}
        />
      </Grid>
      <Grid container item xs={12} sm={6} align="center" spacing={1}>
        <MaterialTotalsWithMarketPrices_MaterialPrices
          listingSelect={listingSelect}
          activeJob={activeJob}
          totalMaterialCost={totalMaterialCost}
          totalInstallCosts={totalInstallCosts}
          totalMarketPrice={totalMarketPrice}
          totalBuildCost={totalBuildCost}
        />
      </Grid>
    </Grid>
  );
}
