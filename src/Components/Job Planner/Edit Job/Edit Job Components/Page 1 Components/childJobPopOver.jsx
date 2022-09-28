import {
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Popover,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { EvePricesContext } from "../../../../../Context/EveDataContext";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../Context/JobContext";
import { useFirebase } from "../../../../../Hooks/useFirebase";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
} from "../../../../../Context/AuthContext";
import { useJobBuild } from "../../../../../Hooks/useJobBuild";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import { jobTypes } from "../../../../../Context/defaultValues";

export function ChildJobPopover({
  displayPopover,
  updateDisplayPopover,
  material,
  marketSelect,
  listingSelect,
  jobModified,
  currentBuildPrice,
  updateCurrentBuildPrice,
  currentPurchasePrice,
}) {
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { evePrices, updateEvePrices } = useContext(EvePricesContext);
  const { activeJob } = useContext(ActiveJobContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { users } = useContext(UsersContext);
  const {
    addNewJob,
    downloadCharacterJobs,
    updateMainUserDoc,
    uploadJob,
    getItemPrices,
    uploadUserJobSnapshot,
  } = useFirebase();
  const { buildJob } = useJobBuild();
  const { newJobSnapshot, replaceSnapshot, closeEditJob, openEditJob } =
    useJobManagement();
  const [tempPrices, updateTempPrices] = useState([]);
  const [jobImport, updateJobImport] = useState(false);
  const [jobDisplay, setJobDisplay] = useState(0);
  const [childJobObjects, updateChildJobObjects] = useState([]);
  const [buildLoad, updateBuildLoad] = useState(false);
  const [recalculateTotal, updateRecalculateTotal] = useState(false);
  const [fetchError, updateFetchError] = useState(false);

  const parentUser = useMemo(
    () => users.find((i) => i.ParentUser === true),
    [users]
  );

  useEffect(async () => {
    if (displayPopover !== null) {
      let jobs = [];
      if (material.childJob.length > 0) {
        for (let id of material.childJob) {
          let childJob = jobArray.find((i) => i.jobID === id);
          if (childJob.isSnapshot) {
            childJob = await downloadCharacterJobs(childJob);
            childJob.isSnapshot = false;
            replaceSnapshot(childJob);
          }
          if (!jobs.some((i) => i.jobID === childJob.jobID)) {
            jobs.push(childJob);
          }
        }
      } else {
        let newJob = await buildJob({
          itemID: material.typeID,
          itemQty: material.quantity,
          parentJobs: [activeJob.jobID],
        });
        if (newJob !== undefined) {
          let priceIDRequest = new Set();
          let promiseArray = [];
          priceIDRequest.add(newJob.itemID);
          newJob.build.materials.forEach((mat) => {
            priceIDRequest.add(mat.typeID);
          });
          let itemPrices = getItemPrices([...priceIDRequest], parentUser);
          promiseArray.push(itemPrices);
          let returnPromiseArray = await Promise.all(promiseArray);
          updateTempPrices((prev) => prev.concat(returnPromiseArray[0]));
          jobs.push(newJob);
        } else {
          updateFetchError(true);
        }
      }
      if (jobs.length > 0) {
        updateChildJobObjects(jobs);
      }
      updateRecalculateTotal(true);
      updateJobImport(true);
    }
  }, [displayPopover]);

  useEffect(() => {
    if (recalculateTotal) {
      let totalPrice = 0;
      childJobObjects[jobDisplay].build.materials.forEach((mat) => {
        let materialPrice = evePrices.find((i) => i.typeID === mat.typeID);
        if (materialPrice === undefined) {
          materialPrice = tempPrices.find((i) => i.typeID === mat.typeID);
        }
        totalPrice += materialPrice[marketSelect][listingSelect] * mat.quantity;
      });
      updateCurrentBuildPrice(
        totalPrice / childJobObjects[jobDisplay].build.products.totalQuantity
      );
      updateRecalculateTotal(false);
    }
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
            {childJobObjects[jobDisplay].jobType === jobTypes.manufacturing ? (
              <Grid item xs={12} sx={{ marginBottom: "10px" }}>
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                  ME: {childJobObjects[jobDisplay].bpME}
                </Typography>
              </Grid>
            ) : null}
            {childJobObjects[jobDisplay].build.materials.map((mat) => {
              let materialPrice = evePrices.find(
                (i) => i.typeID === mat.typeID
              );
              if (materialPrice === undefined) {
                materialPrice = tempPrices.find((i) => i.typeID === mat.typeID);
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
                      {(
                        materialPrice[marketSelect][listingSelect] *
                        mat.quantity
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Grid>
                </Grid>
              );
            })}
            <Grid container item xs={12} sx={{ marginTop: "10px" }}>
              <Grid item xs={12} sm={8}>
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                  Total Material{" "}
                  {listingSelect.charAt(0).toUpperCase() +
                    listingSelect.slice(1)}{" "}
                  Price Per Item
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4} align="right">
                {currentBuildPrice !== null ? (
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                    align="right"
                    color={
                      currentPurchasePrice <= currentBuildPrice
                        ? "error.main"
                        : "success.main"
                    }
                  >
                    {currentBuildPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                ) : null}
              </Grid>
            </Grid>

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
              {material.childJob.length > 0 ? (
                <Button
                  size="small"
                  onClick={() => {
                    if (isLoggedIn && jobModified) {
                      uploadJob(activeJob);
                    }
                    closeEditJob(activeJob);
                    openEditJob(childJobObjects[jobDisplay].jobID);
                  }}
                >
                  Open Child Job
                </Button>
              ) : !buildLoad ? (
                <Button
                  size="small"
                  onClick={async () => {
                    updateBuildLoad((prev) => !prev);
                    let newUserJobSnapshot = newJobSnapshot(
                      childJobObjects[jobDisplay],
                      [...userJobSnapshot]
                    );
                    let newJobArray = [...jobArray];
                    newJobArray.push(childJobObjects[jobDisplay]);
                    if (isLoggedIn) {
                      await uploadUserJobSnapshot(newUserJobSnapshot);
                      await addNewJob(childJobObjects[jobDisplay]);
                    }
                    material.childJob.push(childJobObjects[jobDisplay].jobID);
                    updateUserJobSnapshot(newUserJobSnapshot);
                    updateEvePrices((prev) => prev.concat(tempPrices));
                    updateJobArray(newJobArray);
                    setSnackbarData((prev) => ({
                      ...prev,
                      open: true,
                      message: `${childJobObjects[jobDisplay].name} Added`,
                      severity: "success",
                      autoHideDuration: 3000,
                    }));
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
