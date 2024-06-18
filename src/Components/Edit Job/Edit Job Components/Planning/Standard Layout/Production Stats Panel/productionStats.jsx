import { useCallback, useContext } from "react";
import { Grid, Paper, Typography } from "@mui/material";
import { JobArrayContext } from "../../../../../../Context/JobContext";
import { UserJobSnapshotContext } from "../../../../../../Context/AuthContext";

export function ProductionStats({ activeJob, setupToEdit, parentChildToEdit }) {
  const { jobArray } = useContext(JobArrayContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);

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

    const parentJobSelection = [
      ...new Set(
        [...activeJob.parentJob, ...parentChildToEdit.parentJobs.add].filter(
          (i) => !parentChildToEdit.parentJobs.remove.includes(i)
        )
      ),
    ];

    for (let jobID of parentJobSelection) {
      const job = jobArray.find((i) => i.jobID === jobID);

      if (!job) continue;

      const material = job.build.materials.find(
        (i) => i.typeID === activeJob.itemID
      );
      if (!material) continue;
      returnObject.parentTotal += material.quantity;

      const flag = job.build.childJobs[material.typeID].some(
        (i) => i !== activeJob.jobID
      );

      if (flag) {
        for (let childID of job.build.childJobs[material.typeID]) {
          if (childID === activeJob.jobID) continue;
          let childJob = jobArray.find((i) => i.jobID === childID);
          if (!childJob) continue;
          returnObject.multipleChildren = true;
          returnObject.childrenTotal += childJob.build.products.totalQuantity;
        }
      }
    }
    return returnObject;
  }, [jobArray, parentChildToEdit]);

  if (!activeJob.build.setup[setupToEdit]) return null;

  const timeDisplayFigure = timeDisplay();
  const parentRequirements = calculateParentRequirements();

  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: "100%",
        padding: "20px",
      }}
      square
    >
      <Grid container direction="column" sx={{}}>
        <Grid container item>
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
          <Grid container item xs={12} sx={{ marginBottom: "5px" }}>
            <Grid item xs={10}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Total Produced Items For Setup
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography
                sx={{ typography: { xs: "caption", sm: "body2" } }}
                align="right"
              >
                {(
                  activeJob.itemsProducedPerRun *
                  activeJob.build.setup[setupToEdit].runCount *
                  activeJob.build.setup[setupToEdit].jobCount
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
                Total Produced Items For Job
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
