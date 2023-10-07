import { useContext, useEffect, useMemo, useState } from "react";
import { Button, Grid, Paper, Popover, Typography } from "@mui/material";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../../../Context/JobContext";
import { UsersContext } from "../../../../../../../Context/AuthContext";
import { useFirebase } from "../../../../../../../Hooks/useFirebase";
import { EvePricesContext } from "../../../../../../../Context/EveDataContext";
import { useJobBuild } from "../../../../../../../Hooks/useJobBuild";
import { useJobManagement } from "../../../../../../../Hooks/useJobManagement";
import { useSwitchActiveJob } from "../../../../../../../Hooks/JobHooks/useSwitchActiveJob";
import { ImportingStateLayout_ChildJobPopoverFrame } from "./fetchState";
import { ChildJobMaterials_ChildJobPopoverFrame } from "./childJobMaterials";
import { ChildJobSwitcher_ChildJobPopoverFrame } from "./switchChildJob";
import { DisplayMismatchedChildTotals_ChildJobPopoverFrame } from "./mismatchedTotals";
import { ChildJobMaterialTotalCosts_ChildJobPopoverFrame } from "./childJobTotalCosts";
import { CreateChildJobsButtons_ChildJobPopoverFrame } from "./createJobsButton";

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
  childJobProductionCosts,
  updateChildJobProductionCosts,
}) {
  const { jobArray } = useContext(JobArrayContext);
  const { evePrices } = useContext(EvePricesContext);
  const { activeGroup } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const [tempPrices, updateTempPrices] = useState([]);
  const [jobImportState, updateJobImportState] = useState(false);
  const [jobDisplay, setJobDisplay] = useState(0);
  const [childJobObjects, updateChildJobObjects] = useState([]);
  const [recalculateTotal, updateRecalculateTotal] = useState(false);
  const [fetchError, updateFetchError] = useState(false);
  const { getItemPrices } = useFirebase();
  const { buildJob } = useJobBuild();
  const { generatePriceRequestFromJob } = useJobManagement();
  const { switchActiveJob } = useSwitchActiveJob();

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);
  const childJobsLocation = activeJob.build.childJobs[material.typeID];

  useEffect(() => {
    async function fetchData() {
      if (!displayPopover) return;
      const jobs = [];
      if (childJobsLocation.length > 0) {
        for (let childJobID of childJobsLocation) {
          let matchedChildJob = jobArray.find((i) => i.jobID === childJobID);
          if (!jobs.some((i) => i.jobID === matchedChildJob.jobID)) {
            jobs.push(matchedChildJob);
          }
        }
      } else if (temporaryChildJobs[material.typeID]) {
        if (
          !jobs.some(
            (i) => i.jobID === temporaryChildJobs[material.typeID].jobID
          )
        ) {
          jobs.push(temporaryChildJobs[material.typeID]);
        }
      } else {
        const newJob = await buildJob({
          itemID: material.typeID,
          itemQty: material.quantity,
          parentJobs: [activeJob.jobID],
          groupID: activeGroup?.groupID,
        });

        if (!newJob) {
          updateFetchError(true);
        }

        const itemPrices = await getItemPrices(
          generatePriceRequestFromJob(newJob),
          parentUser
        );

        updateTempPrices((prev) => prev.concat(itemPrices));
        jobs.push(newJob);
      }

      if (jobs.length > 0) {
        updateChildJobObjects(jobs);
      }

      updateRecalculateTotal(true);
      updateJobImportState(true);
    }
    fetchData();

    return;
  }, [displayPopover]);

  useEffect(() => {
    if (!recalculateTotal) {
      return;
    }

    const currentJob = childJobObjects[jobDisplay];

    const totalMaterialPrice = currentJob.build.materials.reduce(
      (prev, { typeID, quantity }) => {
        const priceObject =
          evePrices.find((i) => i.typeID === typeID) ||
          tempPrices.find((i) => i.typeID === typeID);

        if (priceObject) {
          prev += priceObject[marketSelect][listingSelect] * quantity;
        }
        return prev;
      },
      0
    );

    const installCosts = Object.values(currentJob.build.setup).reduce(
      (prev, { estimatedInstallCost }) => {
        return (prev += estimatedInstallCost);
      },
      0
    );

    updateChildJobProductionCosts((prev) => ({
      ...prev,
      materialCost: totalMaterialPrice,
      installCost: installCosts,
      finalCost: totalMaterialPrice + installCosts,
      finalCostPerItem:
        (totalMaterialPrice + installCosts) /
        currentJob.build.products.totalQuantity,
    }));
    updateRecalculateTotal(false);
  }, [childJobObjects, recalculateTotal]);

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
                jobDisplay={jobDisplay}
                tempPrices={tempPrices}
                marketSelect={marketSelect}
                listingSelect={listingSelect}
              />
            </Grid>
            <ChildJobMaterialTotalCosts_ChildJobPopoverFrame
              currentMaterialPrice={currentMaterialPrice}
              childJobProductionCosts={childJobProductionCosts}
            />
            <DisplayMismatchedChildTotals_ChildJobPopoverFrame
              material={material}
              childJobObjects={childJobObjects}
              jobDisplay={jobDisplay}
              childJobProductionCosts={childJobProductionCosts}
            />
            <ChildJobSwitcher_ChildJobPopoverFrame
              childJobObjects={childJobObjects}
              jobDisplay={jobDisplay}
              setJobDisplay={setJobDisplay}
            />

            <Grid item xs={12} align="center" sx={{ marginTop: "10px" }}>
              {childJobsLocation.length > 0 && (
                <Button
                  size="small"
                  onClick={() => {
                    switchActiveJob(
                      activeJob,
                      childJobObjects[jobDisplay].jobID,
                      jobModified
                    );
                  }}
                >
                  Open Child Job
                </Button>
              )}
              <CreateChildJobsButtons_ChildJobPopoverFrame
                childJobsLocation={childJobsLocation}
                childJobObjects={childJobObjects}
                jobDisplay={jobDisplay}
                temporaryChildJobs={temporaryChildJobs}
                updateTemporaryChildJobs={updateTemporaryChildJobs}
                tempPrices={tempPrices}
                setJobModified={setJobModified}
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
