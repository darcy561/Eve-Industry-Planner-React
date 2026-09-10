import { Paper, Popover, Typography, Grid } from "@mui/material";
import { ImportingStateLayout_ChildJobPopoverFrame } from "./fetchState";
import { ChildJobMaterials_ChildJobPopoverFrame } from "./childJobMaterials";
import { ChildJobSwitcher_ChildJobPopoverFrame } from "./switchChildJob";
import { DisplayMismatchedChildTotals_ChildJobPopoverFrame } from "./misMatchedTotals";
import { ChildJobMaterialTotalCosts_ChildJobPopoverFrame } from "./childJobTotalCosts";
import { calculateChildJobTotals } from "../../../../../../../Functions/Groups/childJobTotals.js";
import { ButtonSelectionLogic_ChildJobPopoverFrame } from "./buttonSelectionLogic";
import { STANDARD_TEXT_FORMAT } from "../../../../../../../Context/defaultValues";
import useUsersStore from "../../../../../../../Zustand/usersStore";
import { useChildJobBuildActions } from "../Hooks/useChildJobBuildActions";
import { useChildJobPopoverData } from "../Hooks/useChildJobPopoverData";

export function ChildJobPopoverFrame(props) {
  const {
    state,
    displayPopover,
    updateDisplayPopover,
    material,
    marketSelect,
    listingSelect,
    currentMaterialPrice,
    matchedChildJobs,
  } = props;
  const checkTypeIDisExempt =
    useUsersStore.getState().applicationSettings.actions.checkTypeIDisExempt;
  // Subscribed, not read: a price refresh has to re-render this so the shared
  // totals are worked out again.
  useUsersStore((state) => state.worldData.marketData);
  const { buildSingleChildJobPreview } = useChildJobBuildActions({
    state,
    actions: props.actions,
  });

  const childJobsLocation = state.activeJob.build.childJobs[material.typeID] || [];
  const {
    jobImportState,
    jobDisplay,
    setJobDisplay,
    childJobObjects,
    fetchError,
    isExistingJobInGroup,
  } = useChildJobPopoverData({
    state,
    isOpen: Boolean(displayPopover),
    material,
    matchedChildJobs,
    childJobsLocation,
    buildSingleChildJobPreview,
  });
  const currentJob = childJobObjects[jobDisplay];
  const handleClosePopover = () => {
    const activeElement = document.activeElement;
    if (activeElement && typeof activeElement.blur === "function") {
      activeElement.blur();
    }

    if (displayPopover && typeof displayPopover.focus === "function") {
      displayPopover.focus();
    }

    updateDisplayPopover(null);
  };

  const {
    totalCostOfMaterials,
    totalInstallCosts,
    quantityProduced,
    totalCostPerItem,
  } = calculateChildJobTotals(
    currentJob,
    state.temporaryChildJobs,
    marketSelect,
    listingSelect
  );

  return (
    <Popover
      id={material.typeID}
      open={Boolean(displayPopover)}
      anchorEl={displayPopover}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      onClose={handleClosePopover}
    >
      <Paper
        square
        elevation={3}
        sx={{ padding: "20px", maxWidth: { xs: "350px", sm: "450px" } }}
      >
        {jobImportState ? (
          <Grid container sx={{ flexDirection: "row" }}>
            <Grid sx={{ marginBottom: "10px" }} size={12}>
              <Typography
                sx={{ typography: STANDARD_TEXT_FORMAT }}
                align="center"
              >
                {material.name}
              </Typography>
              {checkTypeIDisExempt(material.typeID) && (
                <Typography
                  align="center"
                  sx={{
                    color: "warning.main",
                    typography: STANDARD_TEXT_FORMAT
                  }}>
                  Material has been marked as exempt from builds.
                </Typography>
              )}
            </Grid>
            <Grid container sx={{ marginBottom: "10px" }} size={12}>
              <Grid size={6}>
                <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
                  <b>Item Quantity Required: {material.quantity}</b>
                </Typography>
              </Grid>
            </Grid>
            <Grid container size={12}>
              <ChildJobMaterials_ChildJobPopoverFrame
                {...props}
                childJobObjects={childJobObjects}
                jobDisplay={jobDisplay}
              />
            </Grid>
            <ChildJobMaterialTotalCosts_ChildJobPopoverFrame
              currentMaterialPrice={currentMaterialPrice}
              totalCostOfMaterials={totalCostOfMaterials}
              totalInstallCosts={totalInstallCosts}
              totalCostPerItem={totalCostPerItem}
            />
            <DisplayMismatchedChildTotals_ChildJobPopoverFrame
              materialQuantity={material?.quantity || 0}
              totalItemsProduced={quantityProduced}
              totalCostPerItem={totalCostPerItem}
            />
            <ChildJobSwitcher_ChildJobPopoverFrame
              childJobObjects={childJobObjects}
              jobDisplay={jobDisplay}
              setJobDisplay={setJobDisplay}
            />

            <Grid align="center" sx={{ marginTop: "10px" }} size={12}>
              <ButtonSelectionLogic_ChildJobPopoverFrame
                {...props}
                childJobsLocation={childJobsLocation}
                childJobObjects={childJobObjects}
                jobDisplay={jobDisplay}
                isExistingJobInGroup={isExistingJobInGroup}
              />
            </Grid>
          </Grid>
        ) : (
          <ImportingStateLayout_ChildJobPopoverFrame
            fetchError={fetchError}
            material={material}
          />
        )}
      </Paper>
    </Popover>
  );
}
