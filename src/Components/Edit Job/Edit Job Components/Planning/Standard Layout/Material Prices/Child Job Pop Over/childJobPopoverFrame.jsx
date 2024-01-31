import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Grid, Paper, Popover, Typography } from "@mui/material";
import { JobArrayContext } from "../../../../../../../Context/JobContext";
import { UsersContext } from "../../../../../../../Context/AuthContext";
import { useFirebase } from "../../../../../../../Hooks/useFirebase";
import { useJobBuild } from "../../../../../../../Hooks/useJobBuild";
import { useJobManagement } from "../../../../../../../Hooks/useJobManagement";
import { ImportingStateLayout_ChildJobPopoverFrame } from "./fetchState";
import { ChildJobMaterials_ChildJobPopoverFrame } from "./childJobMaterials";
import { ChildJobSwitcher_ChildJobPopoverFrame } from "./switchChildJob";
import { DisplayMismatchedChildTotals_ChildJobPopoverFrame } from "./mismatchedTotals";
import { ChildJobMaterialTotalCosts_ChildJobPopoverFrame } from "./childJobTotalCosts";
import { useMaterialCostCalculations } from "../../../../../../../Hooks/GeneralHooks/useMaterialCostCalculations";
import { useManageGroupJobs } from "../../../../../../../Hooks/GroupHooks/useManageGroupJobs";
import { ButtonSelectionLogic_ChildJobPopoverFrame } from "./buttonSelectionLogic";

export function ChildJobPopoverFrame({
  activeJob,
  updateActiveJob,
  displayPopover,
  updateDisplayPopover,
  material,
  marketSelect,
  listingSelect,
  jobModified,
  setJobModified,
  temporaryChildJobs,
  updateTemporaryChildJobs,
  currentMaterialPrice,
  matchedChildJobs,
  setupToEdit,
  esiDataToLink,
  updateEsiDataToLink,
  parentChildToEdit,
  updateParentChildToEdit,
}) {
  const { users } = useContext(UsersContext);
  const { jobArray } = useContext(JobArrayContext);
  const [tempPrices, updateTempPrices] = useState([]);
  const [jobImportState, updateJobImportState] = useState(false);
  const [jobDisplay, setJobDisplay] = useState(0);
  const [childJobObjects, updateChildJobObjects] = useState([]);
  const [fetchError, updateFetchError] = useState(false);
  const { getItemPrices } = useFirebase();
  const { buildJob } = useJobBuild();
  const { generatePriceRequestFromJob } = useJobManagement();
  const { calculateMaterialCostFromChildJobs } = useMaterialCostCalculations();
  const { findJobIDOfMaterialFromGroup } = useManageGroupJobs();

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);
  const childJobsLocation = activeJob.build.childJobs[material.typeID];
  const currentJob = childJobObjects[jobDisplay];
  const isExistingJobInGroup = useRef(false);

  useEffect(() => {
    async function fetchData() {
      if (!displayPopover) return;
      const matchedGroupJobID = findJobIDOfMaterialFromGroup(
        material.typeID,
        activeJob.groupID
      );
      if (matchedGroupJobID && matchedChildJobs.length === 0) {
        const matchedJob = jobArray.find((i) => i.jobID === matchedGroupJobID);
        if (!matchedJob) return;

        matchedChildJobs.push(matchedJob);
        isExistingJobInGroup.current = true;
      } else if (matchedChildJobs.length === 0) {
        const newJob = await buildJob({
          itemID: material.typeID,
          itemQty: material.quantity,
          parentJobs: [activeJob.jobID],
          groupID: activeJob.groupID,
          systemID: activeJob.build.setup[setupToEdit].systemID,
        });
        if (!newJob) {
          updateFetchError(true);
        }

        const itemPriceResult = await getItemPrices(
          generatePriceRequestFromJob(newJob),
          parentUser
        );

        updateTempPrices((prev) => ({ ...prev, ...itemPriceResult }));
        matchedChildJobs.push(newJob);
      }

      if (matchedChildJobs.length > 0) {
        updateChildJobObjects(matchedChildJobs);
      }
      updateJobImportState(true);
    }
    fetchData();

    return;
  }, [displayPopover]);

  const totalCostOfMaterials = (currentJob?.build?.materials || []).reduce(
    (prev, material) => {
      const childJobs = currentJob.build.childJobs[material.typeID];
      return (prev += calculateMaterialCostFromChildJobs(
        material,
        childJobs,
        temporaryChildJobs[currentJob.itemID],
        tempPrices,
        marketSelect,
        listingSelect
      ));
    },
    0
  );

  const totalInstallCosts = Object.values(
    currentJob?.build?.setup || []
  ).reduce((prev, { estimatedInstallCost }) => {
    return (prev += estimatedInstallCost);
  }, 0);

  const totalCostPerItem =
    (currentJob?.build?.products?.totalQuantity || 0) !== 0
      ? (totalCostOfMaterials + totalInstallCosts) /
        currentJob.build.products.totalQuantity
      : 0;

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
      onClose={() => {
        updateDisplayPopover(null);
      }}
    >
      <Paper
        square
        elevation={3}
        sx={{ padding: "20px", maxWidth: { xs: "350px", sm: "450px" } }}
      >
        {jobImportState ? (
          <Grid container direction="row">
            <Grid item xs={12} sx={{ marginBottom: "10px" }}>
              <Typography
                sx={{ typography: { xs: "caption", sm: "body2" } }}
                align="center"
              >
                {material.name}
              </Typography>
            </Grid>
            <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
              <Grid item xs={6}>
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                  <b>Item Quantity Required: {material.quantity}</b>
                </Typography>
              </Grid>
            </Grid>
            <Grid container item xs={12}>
              <ChildJobMaterials_ChildJobPopoverFrame
                childJobObjects={childJobObjects}
                temporaryChildJobs={temporaryChildJobs}
                jobDisplay={jobDisplay}
                tempPrices={tempPrices}
                marketSelect={marketSelect}
                listingSelect={listingSelect}
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
              totalItemsProduced={
                currentJob?.build?.products?.totalQuantity || 0
              }
              totalCostPerItem={totalCostPerItem}
            />
            <ChildJobSwitcher_ChildJobPopoverFrame
              childJobObjects={childJobObjects}
              jobDisplay={jobDisplay}
              setJobDisplay={setJobDisplay}
            />

            <Grid item xs={12} align="center" sx={{ marginTop: "10px" }}>
              <ButtonSelectionLogic_ChildJobPopoverFrame
                activeJob={activeJob}
                updateActiveJob={updateActiveJob}
                material={material}
                jobModified={jobModified}
                childJobsLocation={childJobsLocation}
                childJobObjects={childJobObjects}
                jobDisplay={jobDisplay}
                temporaryChildJobs={temporaryChildJobs}
                updateTemporaryChildJobs={updateTemporaryChildJobs}
                tempPrices={tempPrices}
                setJobModified={setJobModified}
                isExistingJobInGroup={isExistingJobInGroup}
                esiDataToLink={esiDataToLink}
                updateEsiDataToLink={updateEsiDataToLink}
                parentChildToEdit={parentChildToEdit}
                updateParentChildToEdit={updateParentChildToEdit}
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
