import { Grid, Typography } from "@mui/material";
import { useMaterialCostCalculations } from "../../../../../../../Hooks/GeneralHooks/useMaterialCostCalculations";

export function ChildJobMaterials_ChildJobPopoverFrame({
  jobDisplay,
  childJobObjects,
  temporaryChildJobs,
  tempPrices,
  marketSelect,
  listingSelect,
}) {
  const { calculateMaterialCostFromChildJobs } = useMaterialCostCalculations();

  return childJobObjects[jobDisplay].build.materials.map((material) => {
    const childJobs =
      childJobObjects[jobDisplay].build.childJobs[material.typeID];

    const calculatedMaterialPrice = calculateMaterialCostFromChildJobs(
      material,
      childJobs,
      temporaryChildJobs[material.typeID],
      tempPrices,
      marketSelect,
      listingSelect
    );

    return (
      <Grid key={material.typeID} container item xs={12}>
        <Grid item xs={8}>
          <Typography sx={{ typography: { xs: "caption", sm: "caption" } }}>
            {material.name}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography
            sx={{ typography: { xs: "caption", sm: "caption" } }}
            align="right"
          >
            {calculatedMaterialPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Grid>
      </Grid>
    );
  });
}
