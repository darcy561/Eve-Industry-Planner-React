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
import { useSwitchActiveJob } from "../../../../../Hooks/JobHooks/useSwitchActiveJob";

export function ChildJobPopover({
  displayPopover,
  updateDisplayPopover,
  material,
  marketSelect,
  listingSelect,
  jobModified,
  setJobModified,
  currentBuildPrice,
  updateCurrentBuildPrice,
  currentPurchasePrice,
  materialIndex,
}) {
  const { jobArray, groupArray, updateGroupArray, updateJobArray } =
    useContext(JobArrayContext);
  const { evePrices, updateEvePrices } = useContext(EvePricesContext);
  const { activeJob, activeGroup, updateActiveJob } =
    useContext(ActiveJobContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { users } = useContext(UsersContext);
  const {
    addNewJob,
    downloadCharacterJobs,
    getItemPrices,
    uploadUserJobSnapshot,
  } = useFirebase();
  const { buildJob } = useJobBuild();
  const { newJobSnapshot, replaceSnapshot, generatePriceRequestFromJob } =
    useJobManagement();
  const { switchActiveJob } = useSwitchActiveJob();
  const [tempPrices, updateTempPrices] = useState([]);
  const [jobImport, updateJobImport] = useState(false);
  const [jobDisplay, setJobDisplay] = useState(0);
  const [childJobObjects, updateChildJobObjects] = useState([]);
  const [buildLoad, updateBuildLoad] = useState(false);
  const [recalculateTotal, updateRecalculateTotal] = useState(false);
  const [fetchError, updateFetchError] = useState(false);

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  useEffect(async () => {
    const fetchData = async () => {
      if (!displayPopover) {
        return;
      }

      const jobs = [];

      if (material.childJob.length > 0) {
        for (let id of material.childJob) {
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
    let totalPrice = 0;
    const currentJob = childJobObjects[jobDisplay];
    currentJob.build.materials.forEach((mat) => {
      const materialPrice =
        evePrices.find((i) => i.typeID === mat.typeID) ||
        tempPrices.find((i) => i.typeID === mat.typeID);

      if (materialPrice) {
        totalPrice += materialPrice[marketSelect][listingSelect] * mat.quantity;
      }
    });
    updateCurrentBuildPrice(
      totalPrice / currentJob.build.products.totalQuantity
    );
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
              {childJobObjects[jobDisplay].jobType ===
              jobTypes.manufacturing ? (
                <Grid item xs={6}>
                  <Typography
                    align="right"
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    <b>ME: {childJobObjects[jobDisplay].bpME}</b>
                  </Typography>
                </Grid>
              ) : null}
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
            <Grid container item xs={12}>
              <Grid item xs={12} sm={8}>
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                  Total Material{" "}
                  {listingSelect.charAt(0).toUpperCase() +
                    listingSelect.slice(1)}{" "}
                  Price
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
                    {(currentBuildPrice * material.quantity).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
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
                    {currentBuildPrice !== null ? (
                      <>
                        <Typography
                          sx={{ typography: { xs: "caption", sm: "body2" } }}
                          align="right"
                        >
                          {(
                            currentBuildPrice *
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
              {material.childJob.length > 0 ? (
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
                    let newJobArray = [...jobArray];
                    let newMaterialArray = [...activeJob.build.materials];

                    newJobArray.push(inputJob);
                    if (isLoggedIn) {
                      addNewJob(inputJob);
                    }
                    newMaterialArray[materialIndex].childJob.push(
                      inputJob.jobID
                    );

                    if (!inputJob.groupID) {
                      let newUserJobSnapshot = newJobSnapshot(inputJob, [
                        ...userJobSnapshot,
                      ]);

                      if (isLoggedIn) {
                        uploadUserJobSnapshot(newUserJobSnapshot);
                      }
                      updateUserJobSnapshot(newUserJobSnapshot);
                    } else {
                      
                    }
                    updateActiveJob((prev) => ({
                      ...prev,
                      build: {
                        ...prev.build,
                        materials: newMaterialArray,
                      },
                    }));
                    updateEvePrices((prev) => {
                      let newItemPrices = tempPrices.filter(
                        (n) => !prev.some((p) => p.typeID === n.typeID)
                      );
                      return prev.concat(newItemPrices);
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
