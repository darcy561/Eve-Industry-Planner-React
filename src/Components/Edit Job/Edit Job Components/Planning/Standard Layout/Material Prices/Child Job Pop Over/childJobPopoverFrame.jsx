import { useContext, useEffect, useMemo, useState } from "react";
import {
  Button,
  CircularProgress,
  Grid,
  Paper,
  Popover,
  Typography,
} from "@mui/material";

import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../../../Context/JobContext";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
} from "../../../../../../../Context/AuthContext";
import { useFirebase } from "../../../../../../../Hooks/useFirebase";
import { EvePricesContext } from "../../../../../../../Context/EveDataContext";
import { SnackBarDataContext } from "../../../../../../../Context/LayoutContext";
import { useJobBuild } from "../../../../../../../Hooks/useJobBuild";
import { useJobManagement } from "../../../../../../../Hooks/useJobManagement";
import { useJobSnapshotManagement } from "../../../../../../../Hooks/JobHooks/useJobSnapshots";
import { useSwitchActiveJob } from "../../../../../../../Hooks/JobHooks/useSwitchActiveJob";
import { useManageGroupJobs } from "../../../../../../../Hooks/GroupHooks/useManageGroupJobs";
import { ImportingStateLayout_ChildJobPopoverFrame } from "./fetchState";
import { ChildJobMaterials_ChildJobPopoverFrame } from "./childJobMaterials";
import { ChildJobSwitcher_ChildJobPopoverFrame } from "./switchChildJob";
import { DisplayMismatchedChildTotals_ChildJobPopoverFrame } from "./mismatchedTotals";
import { ChildJobMaterialTotalCosts_ChildJobPopoverFrame } from "./childJobTotalCosts";

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
  currentInstallCost,
  updateCurrentInstallCost,
  temporaryChildJobs,
  updateTemporaryChildJobs,
  currentMaterialPrice,
  calculatedChildPrice,
}) {
  const { jobArray, groupArray, updateGroupArray, updateJobArray } =
    useContext(JobArrayContext);
  const { evePrices, updateEvePrices } = useContext(EvePricesContext);
  const { activeGroup, updateActiveGroup } = useContext(ActiveJobContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { users } = useContext(UsersContext);
  const [tempPrices, updateTempPrices] = useState([]);
  const [jobImportState, updateJobImportState] = useState(false);
  const [jobDisplay, setJobDisplay] = useState(0);
  const [childJobObjects, updateChildJobObjects] = useState([]);
  const [buildLoad, updateBuildLoad] = useState(false);
  const [recalculateTotal, updateRecalculateTotal] = useState(false);
  const [fetchError, updateFetchError] = useState(false);
  const {
    addNewJob,
    downloadCharacterJobs,
    getItemPrices,
    uploadUserJobSnapshot,
  } = useFirebase();
  const { buildJob } = useJobBuild();
  const { generatePriceRequestFromJob } = useJobManagement();
  const { newJobSnapshot, replaceSnapshot } = useJobSnapshotManagement();
  const { switchActiveJob } = useSwitchActiveJob();
  const { addJobToGroup } = useManageGroupJobs();

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);
  const childJobsLocation = activeJob.build.childJobs[material.typeID];

  useEffect(() => {
    async function fetchData() {
      if (!displayPopover) return;
      const jobs = [];
      if (childJobsLocation.length > 0) {
        for (let childJobID of childJobsLocation) {
          let matchedChildJob = jobArray.find((i) => i.jobID === childJobID);
          if (!matchedChildJob) {
            let matchedSnapshot = userJobSnapshot.find(
              (i) => i.jobID === childJobID
            );
            if (!matchedSnapshot) {
              matchedChildJob = await downloadCharacterJobs(childJobID);
              replaceSnapshot(matchedChildJob);
            }
            if (!matchedChildJob) continue;
          }
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

    function disMountPopUp() {
      if (childJobsLocation) updateTemporaryChildJobs();
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

    const totalInstallCost = Object.values(currentJob.build.setup).reduce(
      (prev, { estimatedInstallCost }) => {
        return (prev += estimatedInstallCost);
      },
      0
    );

    calculatedChildPrice =
      totalMaterialPrice / currentJob.build.products.totalQuantity;
    // updateCurrentMaterialPrice(
    //   totalMaterialPrice / currentJob.build.products.totalQuantity
    // );
    updateCurrentInstallCost(totalInstallCost);
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
                  <b>Item Quantity: {material.quantity}</b>
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
              material={material}
              currentPurchasePrice={currentPurchasePrice}
              currentInstallCost={currentInstallCost}
              listingSelect={listingSelect}
            />
            <DisplayMismatchedChildTotals_ChildJobPopoverFrame
              material={material}
              childJobObjects={childJobObjects}
              jobDisplay={jobDisplay}
              calculatedChildPrice={calculatedChildPrice}
              currentInstallCost={currentInstallCost}
              listingSelect={listingSelect}
            />
            <ChildJobSwitcher_ChildJobPopoverFrame
              childJobObjects={childJobObjects}
              jobDisplay={jobDisplay}
              setJobDisplay={setJobDisplay}
            />

            <Grid item xs={12} align="center" sx={{ marginTop: "10px" }}>
              {childJobsLocation.length > 0 ? (
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
              ) : !buildLoad ? (
                <Button
                  size="small"
                  onClick={async () => {
                    updateBuildLoad((prev) => !prev);
                    const inputJob = childJobObjects[jobDisplay];
                    const newJobArray = [...jobArray];
                    const newChildJobArray = [
                      ...activeJob.build.childJobs[material.typeID],
                    ];

                    newJobArray.push(inputJob);
                    newChildJobArray.push(inputJob.jobID);

                    if (isLoggedIn) {
                      addNewJob(inputJob);
                    }

                    if (!inputJob.groupID) {
                      let newUserJobSnapshot = newJobSnapshot(inputJob, [
                        ...userJobSnapshot,
                      ]);

                      if (isLoggedIn) {
                        uploadUserJobSnapshot(newUserJobSnapshot);
                      }
                      updateUserJobSnapshot(newUserJobSnapshot);
                    } else {
                      let newGroupArray = addJobToGroup(
                        inputJob,
                        [...groupArray],
                        newJobArray
                      );
                      let updatedGroupObject = newGroupArray.find(
                        (i) => i.groupID === inputJob.groupID
                      );

                      if (updatedGroupObject) {
                        updateActiveGroup(updatedGroupObject);
                      }
                      updateGroupArray(newGroupArray);
                    }
                    updateActiveJob((prev) => ({
                      ...prev,
                      build: {
                        ...prev.build,
                        childJobs: {
                          ...prev.build.childJobs,
                          [material.typeID]: newChildJobArray,
                        },
                      },
                    }));
                    updateEvePrices((prev) => {
                      const prevIds = new Set(prev.map((item) => item.typeID));
                      const uniqueNewEvePrices = tempPrices.filter(
                        (item) => !prevIds.has(item.typeID)
                      );
                      return [...prev, ...uniqueNewEvePrices];
                    });
                    updateJobArray(newJobArray);
                    setSnackbarData((prev) => ({
                      ...prev,
                      open: true,
                      message: `${inputJob.name} Added`,
                      severity: "success",
                      autoHideDuration: 3000,
                    }));
                    setJobModified(true);
                    updateBuildLoad((prev) => !prev);
                  }}
                >
                  Create Job
                </Button>
              ) : (
                <CircularProgress
                  color="primary"
                  size={30}
                  sx={{ marginTop: "20px" }}
                />
              )}
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
