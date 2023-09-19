import { useContext, useEffect, useMemo, useState } from "react";
import {
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Popover,
  Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../../Context/JobContext";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
} from "../../../../../../Context/AuthContext";
import { useFirebase } from "../../../../../../Hooks/useFirebase";
import { EvePricesContext } from "../../../../../../Context/EveDataContext";
import { SnackBarDataContext } from "../../../../../../Context/LayoutContext";
import { useJobBuild } from "../../../../../../Hooks/useJobBuild";
import { useJobManagement } from "../../../../../../Hooks/useJobManagement";
import { useJobSnapshotManagement } from "../../../../../../Hooks/JobHooks/useJobSnapshots";
import { useSwitchActiveJob } from "../../../../../../Hooks/JobHooks/useSwitchActiveJob";
import { useManageGroupJobs } from "../../../../../../Hooks/GroupHooks/useManageGroupJobs";
import { jobTypes } from "../../../../../../Context/defaultValues";

export function ChildJobPopover({
  activeJob,
  updateActiveJob,
  displayPopover,
  updateDisplayPopover,
  material,
  marketSelect,
  listingSelect,
  jobModified,
  setJobModified,
  currentMaterialPrice,
  updateCurrentMaterialPrice,
  currentInstallCost,
  updateCurrentInstallCost,
  currentPurchasePrice,
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
  const [jobImport, updateJobImport] = useState(false);
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
    const fetchData = async () => {
      if (!displayPopover) {
        return;
      }

      const jobs = [];

      if (childJobsLocation.length > 0) {
        for (let id of childJobsLocation) {
          let childJob = jobArray.find((i) => i.jobID === id);
          if (!childJob) {
            let snap = userJobSnapshot.find((i) => i.jobID === id);
            if (!snap) {
              childJob = await downloadCharacterJobs(snap.jobID);
              replaceSnapshot(childJob);
            }
            if (!childJob) continue;
          }
          if (!jobs.some((i) => i.jobID === childJob.jobID)) {
            jobs.push(childJob);
          }
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
      updateJobImport(true);
    };

    fetchData();
  }, [displayPopover]);

  useEffect(() => {
    if (!recalculateTotal) {
      return;
    }

    const currentJob = childJobObjects[jobDisplay];

    const totalMaterialPrice = currentJob.build.materials.reduce(
      (prev, mat) => {
        const materialPrice =
          evePrices.find((i) => i.typeID === mat.typeID) ||
          tempPrices.find((i) => i.typeID === mat.typeID);

        if (materialPrice) {
          prev += materialPrice[marketSelect][listingSelect] * mat.quantity;
        }
        return prev;
      },
      0
    );

    const totalInstallCost = Object.values(currentJob.build.setup).reduce(
      (prev, setup) => {
        return (prev += setup.estimatedInstallCost);
      },
      0
    );

    updateCurrentMaterialPrice(
      totalMaterialPrice / currentJob.build.products.totalQuantity
    );
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
        sx={{ padding: "20px", maxWidth: { xs: "350px", sm: "450px" } }}
      >
        {!jobImport ? (
          !fetchError ? (
            <Grid container direction="row">
              <Grid item xs={12} sx={{ marginBottom: "30px" }}>
                <Typography variant="body2" align="center">
                  {material.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sx={{ marginBottom: "20px" }} align="center">
                <CircularProgress color="primary" />
              </Grid>
            </Grid>
          ) : (
            <Grid container direction="row">
              <Grid item xs={12} sx={{ marginBottom: "30px" }}>
                <Typography variant="body2" align="center">
                  {material.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sx={{ marginBottom: "20px" }} align="center">
                <Typography variant="body2" align="center" color="error">
                  Error Importing Job Data
                </Typography>
              </Grid>
            </Grid>
          )
        ) : (
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
              {childJobObjects[jobDisplay].build.materials.map((mat) => {
                let materialPrice = evePrices.find(
                  (i) => i.typeID === mat.typeID
                );
                if (materialPrice === undefined) {
                  materialPrice = tempPrices.find(
                    (i) => i.typeID === mat.typeID
                  );
                }

                return (
                  <Grid key={mat.typeID} container item xs={12}>
                    <Grid item xs={8}>
                      <Typography
                        sx={{ typography: { xs: "caption", sm: "body2" } }}
                      >
                        {mat.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography
                        sx={{ typography: { xs: "caption", sm: "body2" } }}
                        align="right"
                      >
                        {materialPrice !== undefined
                          ? (
                              materialPrice[marketSelect][listingSelect] *
                              mat.quantity
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : 0}
                      </Typography>
                    </Grid>
                  </Grid>
                );
              })}
            </Grid>
            <Grid container item xs={12} sx={{ marginTop: "20px" }}>
              <Grid item xs={12} sm={8}>
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                  Total Material{" "}
                  {listingSelect.charAt(0).toUpperCase() +
                    listingSelect.slice(1)}{" "}
                  Price Per Item
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4} align="right">
                {currentMaterialPrice && currentInstallCost !== null ? (
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                    align="right"
                    color={
                      currentPurchasePrice <=
                      currentMaterialPrice + currentInstallCost
                        ? "error.main"
                        : "success.main"
                    }
                  >
                    {currentMaterialPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                ) : null}
              </Grid>
            </Grid>
            <Grid container item xs={12} sx={{marginTop: "5px"}}>
              <Grid item xs={12} sm={8}>
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                  Total Material{" "}
                  {listingSelect.charAt(0).toUpperCase() +
                    listingSelect.slice(1)}{" "}
                  Price
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4} align="right">
                {currentMaterialPrice && currentInstallCost !== null ? (
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                    align="right"
                    color={
                      currentPurchasePrice <=
                      currentMaterialPrice + currentInstallCost
                        ? "error.main"
                        : "success.main"
                    }
                  >
                    {(currentMaterialPrice * material.quantity).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </Typography>
                ) : null}
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                  Total Install Cost
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4} align="right">
                {currentMaterialPrice && currentInstallCost !== null ? (
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                    align="right"
                    color={
                      currentPurchasePrice <=
                      currentMaterialPrice + currentInstallCost
                        ? "error.main"
                        : "success.main"
                    }
                  >
                    {currentInstallCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                ) : null}
                </Grid>
                <Grid item xs={12} sm={8}>
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                  Total Estimated Cost
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4} align="right">
                {currentMaterialPrice && currentInstallCost !== null ? (
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                    align="right"
                    color={
                      currentPurchasePrice <=
                      currentMaterialPrice + currentInstallCost
                        ? "error.main"
                        : "success.main"
                    }
                  >
                    {(currentMaterialPrice + currentInstallCost).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                ) : null}
              </Grid>
            </Grid>
            {material.quantity !==
            childJobObjects[jobDisplay].build.products.totalQuantity ? (
              <>
                <Grid container item xs={12} sx={{ marginTop: "20px" }}>
                  <Grid item xs={12} sm={8}>
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      Total Items Produced By Child Job{" "}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4} align="right">
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      {childJobObjects[jobDisplay].build.products.totalQuantity}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid container item xs={12}>
                  <Grid item xs={12} sm={8}>
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      Child Job Total Material{" "}
                      {listingSelect.charAt(0).toUpperCase() +
                        listingSelect.slice(1)}{" "}
                      Price
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4} align="right">
                    {currentMaterialPrice && currentInstallCost !== null ? (
                      <>
                        <Typography
                          sx={{ typography: { xs: "caption", sm: "body2" } }}
                          align="right"
                        >
                          {(
                            currentMaterialPrice *
                            childJobObjects[jobDisplay].build.products
                              .totalQuantity
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Typography>
                      </>
                    ) : null}
                  </Grid>
                </Grid>
              </>
            ) : null}

            {childJobObjects.length > 1 && (
              <Grid container item xs={12} sx={{ marginTop: "10px" }}>
                <Grid item xs={1}>
                  <IconButton
                    disabled={jobDisplay === 0}
                    onClick={() => {
                      setJobDisplay((prev) => prev - 1);
                    }}
                  >
                    <ArrowBackOutlinedIcon />
                  </IconButton>
                </Grid>
                <Grid
                  container
                  item
                  xs={10}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    Toggle Child Jobs
                  </Typography>
                </Grid>
                <Grid item xs={1}>
                  <IconButton
                    disabled={jobDisplay === childJobObjects.length}
                    onClick={() => {
                      setJobDisplay((prev) => prev + 1);
                    }}
                  >
                    <ArrowForwardOutlinedIcon />
                  </IconButton>
                </Grid>
              </Grid>
            )}

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
        )}
      </Paper>
    </Popover>
  );
}
