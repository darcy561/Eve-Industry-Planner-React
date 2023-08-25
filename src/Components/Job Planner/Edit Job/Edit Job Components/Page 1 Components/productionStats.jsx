import { useCallback, useContext } from "react";
import { Grid, Paper, Typography } from "@mui/material";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../Context/JobContext";

export function ProductionStats({ setupToEdit }) {
  const { activeJob } = useContext(ActiveJobContext);
  const { jobArray } = useContext(JobArrayContext);

  function timeDisplay() {
    let returnArray = [];
    let d = Math.floor(
      activeJob.build.setup[setupToEdit].estimatedTime / (3600 * 24)
    );
    let h = Math.floor(
      (activeJob.build.setup[setupToEdit].estimatedTime % (3600 * 24)) / 3600
    );
    let m = Math.floor(
      (activeJob.build.setup[setupToEdit].estimatedTime % 3600) / 60
    );
    let s = Math.floor(activeJob.build.setup[setupToEdit].estimatedTime % 60);

    if (d > 0) {
      returnArray.push(`${d}D`);
    }
    if (h > 0) {
      returnArray.push(`${h}H`);
    }
    if (m > 0) {
      returnArray.push(`${m}M`);
    }
    if (s > 0) {
      returnArray.push(`${s}S`);
    }

    return returnArray.join(" ");
  }
  const calculateParentRequirements = useCallback(() => {
    let returnObject = {
      parentTotal: 0,
      multipleChildren: false,
      childrenTotal: 0,
    };

    let total = 0;
    for (let jobID of activeJob.parentJob) {
      let job = jobArray.find((i) => i.jobID === jobID);
      if (!job) continue;
      let material = job.build.materials.find(
        (i) => i.typeID === activeJob.itemID
      );
      if (!material) continue;
      returnObject.parentTotal += material.quantity;

      let flag = material.childJob.some((i) => i !== activeJob.jobID);

      if (flag) {
        for (let childID of material.childJob) {
          if (childID === activeJob.jobID) continue;
          let childJob = jobArray.find((i) => i.jobID === childID);
          if (!childJob) continue;
          returnObject.multipleChildren = true;
          returnObject.childrenTotal += childJob.build.products.totalQuantity;
        }
      }
    }
    return returnObject;
  }, [jobArray]);

  const timeDisplayFigure = timeDisplay();
  const parentRequirements = calculateParentRequirements();

  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: "100%",
        padding: "20px",
      }}
      square={true}
    >
      <Grid container direction="column" sx={{}}>
        <Grid container direction="row" item>
          <Grid container item xs={12} sx={{ marginBottom: "5px" }}>
            <Grid item xs={10}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Items Produced Per Blueprint Run
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography
                sx={{ typography: { xs: "caption", sm: "body2" } }}
                align="right"
              >
                {Number(activeJob.itemsProducedPerRun).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
          <Grid container item xs={12} sx={{ marginBottom: "5px" }}>
            <Grid item xs={10}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Total Items Per Job Slot
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography
                sx={{ typography: { xs: "caption", sm: "body2" } }}
                align="right"
              >
                {(
                  activeJob.itemsProducedPerRun *
                  activeJob.build.setup[setupToEdit].runCount
                ).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
          <Grid container item xs={12}>
            <Grid item xs={10}>
              <Typography
                sx={{ typography: { xs: "caption", sm: "body2" } }}
                color={
                  activeJob.build.products.totalQuantity +
                    parentRequirements.childrenTotal <
                  parentRequirements.parentTotal
                    ? "error.main"
                    : null
                }
              >
                Total Items Being Produced
              </Typography>
            </Grid>

            <Grid item xs={2}>
              <Typography
                sx={{ typography: { xs: "caption", sm: "body2" } }}
                align="right"
                color={
                  activeJob.build.products.totalQuantity +
                    parentRequirements.childrenTotal <
                  parentRequirements.parentTotal
                    ? "error.main"
                    : null
                }
              >
                {activeJob.build.products.totalQuantity.toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
          {activeJob.parentJob.length > 0 && activeJob.groupID !== null ? (
            <>
              <Grid container item xs={12} sx={{ marginTop: "10px" }}>
                <Grid item xs={10}>
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    Parent Job(s) Require
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                    align="right"
                  >
                    {parentRequirements.parentTotal.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
              {parentRequirements.multipleChildren ? (
                <Grid container item xs={12} sx={{ marginTop: "5px" }}>
                  <Grid item xs={10}>
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                      color={
                        activeJob.build.products.totalQuantity +
                          parentRequirements.childrenTotal <
                        parentRequirements.parentTotal
                          ? "error.main"
                          : null
                      }
                    >
                      Parents Other Children Produce
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                      align="right"
                      color={
                        activeJob.build.products.totalQuantity +
                          parentRequirements.childrenTotal <
                        parentRequirements.parentTotal
                          ? "error.main"
                          : null
                      }
                    >
                      {parentRequirements.childrenTotal.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              ) : null}
            </>
          ) : null}
          <Grid container item xs={12}>
            <Grid item xs={12} sx={{ marginTop: "20px" }}>
              <Typography
                align="center"
                sx={{ typography: { xs: "caption", sm: "body2" } }}
              >
                Time Per Job Slot
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography
                sx={{ typography: { xs: "caption", sm: "body2" } }}
                align="center"
              >
                {timeDisplayFigure}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
