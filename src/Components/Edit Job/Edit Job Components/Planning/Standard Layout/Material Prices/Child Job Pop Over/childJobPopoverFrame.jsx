import { useContext, useEffect, useMemo, useState } from "react";
import { Button, Grid, Paper, Popover, Typography } from "@mui/material";
import { JobArrayContext } from "../../../../../../../Context/JobContext";
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
import { useInstallCostsCalc } from "../../../../../../../Hooks/GeneralHooks/useInstallCostCalc";

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
  matchedChildJobs,
  setupToEdit,
}) {
  const { evePrices } = useContext(EvePricesContext);
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
  const { calculateInstallCostFromJob } = useInstallCostsCalc();

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);
  const childJobsLocation = activeJob.build.childJobs[material.typeID];

  useEffect(() => {
    async function fetchData() {
      if (!displayPopover) return;

      if (temporaryChildJobs[material.typeID]) {
        if (
          !matchedChildJobs.some(
            (i) => i.jobID === temporaryChildJobs[material.typeID].jobID
          )
        ) {
          matchedChildJobs.push(temporaryChildJobs[material.typeID]);
        }
      } else {
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

        const itemPrices = await getItemPrices(
          generatePriceRequestFromJob(newJob),
          parentUser
        );

        updateTempPrices((prev) => prev.concat(itemPrices));
        matchedChildJobs.push(newJob);
      }

      if (matchedChildJobs.length > 0) {
        updateChildJobObjects(matchedChildJobs);
      }
      updateRecalculateTotal(true);
      updateJobImportState(true);
    }
    fetchData();

    return;
  }, [displayPopover]);

  useEffect(() => {
    async function runCalculations() {
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
      let installCosts = 0;

      for (const setup of Object.values(currentJob.build.setup)) {
        if (setup.estimatedInstallCost === 0) {
          const cost = await calculateInstallCostFromJob(setup, tempPrices);
          installCosts += cost;
        } else {
          installCosts += setup.estimatedInstallCost;
        }
      }

      // const installCosts = Object.values(currentJob.build.setup).reduce(
      //   (prev, { estimatedInstallCost }) => {
      //     return (prev += estimatedInstallCost);
      //   },
      //   0
      // );

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
    }

    runCalculations();
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
