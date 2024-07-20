import { Grid, Typography } from "@mui/material";
import { useMaterialCostCalculations } from "../../../../../../../Hooks/GeneralHooks/useMaterialCostCalculations";
import {
  SMALL_TEXT_FORMAT,
  TWO_DECIMAL_PLACES,
} from "../../../../../../../Context/defaultValues";

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
          <Typography sx={{ typography: SMALL_TEXT_FORMAT }}>
            {material.name}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography sx={{ typography: SMALL_TEXT_FORMAT }} align="right">
            {calculatedMaterialPrice.toLocaleString(
              undefined,
              TWO_DECIMAL_PLACES
            )}
          </Typography>
        </Grid>
      </Grid>
    );
  });
}
