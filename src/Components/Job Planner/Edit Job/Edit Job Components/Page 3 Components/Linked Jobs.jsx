import React, { useContext } from "react";
import { UsersContext } from "../../../../../Context/AuthContext";
import {
  ActiveJobContext,
  ApiJobsContext,
} from "../../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import {
  Avatar,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdOutlineLinkOff } from "react-icons/md";

export function LinkedJobs({ setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);

  function timeRemainingcalc(job) {
    let now = new Date().getTime();
    let timeLeft = Date.parse(job.end_date) - now;

    let day = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    let hour = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    let min = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (day < 0) {
      day = 0;
    }
    if (hour < 0) {
      hour = 0;
    }
    if (min < 0) {
      min = 0;
    }

    return { days: day, hours: hour, mins: min };
  }

  activeJob.build.costs.linkedJobs.forEach((job) => {
    if (job.status === "active") {
      const latestData = apiJobs.find((i) => i.job_id === job.job_id);
      job.status = latestData.status;
      job.completed_date = latestData.completed_date || null;
      job.end_date = latestData.end_date;
    }
  });

  if (activeJob.build.costs.linkedJobs !== 0) {
    return (
      <Paper
        sx={{
          padding: "20px",
          minHeight: "25vh",
        }}
        elevation={3}
        square={true}
      >
        <Grid container direction="row" sx={{ marginBottom: "10px" }}>
          <Grid item xs={12}>
            <Typography variant="h5" color="primary" align="center">
              Linked Jobs {activeJob.apiJobs.length}/{activeJob.jobCount}
            </Typography>
          </Grid>
        </Grid>
        {activeJob.build.costs.linkedJobs.map((job) => {
          const jobOwner = users.find(
            (i) => i.CharacterHash === job.CharacterHash
          );
          const timeRemaining = timeRemainingcalc(job);
          return (
            <Grid
              key={job.job_id}
              item
              container
              direction="row"
              xs={12}
              sx={{ marginBottom: "10px" }}
            >
              <Grid item xs={2}>
                <Avatar
                  src={`https://images.evetech.net/characters/${jobOwner.CharacterID}/portrait`}
                  variant="circular"
                  sx={{
                    height: "32px",
                    width: "32px",
                  }}
                />
              </Grid>
              <Grid item xs={5}>
                <Typography variant="body1">{`${job.runs} Runs`}</Typography>
              </Grid>
              <Grid item xs={4}>
                {job.status === "active" ? (
                  timeRemaining.days === 0 &&
                  timeRemaining.hours === 0 &&
                  timeRemaining.mins === 0 ? (
                    <Typography variant="body2">Ready to Deliver</Typography>
                  ) : (
                    <Typography variant="body2">
                      {timeRemaining.days}D, {timeRemaining.hours}H,{" "}
                      {timeRemaining.mins}M
                    </Typography>
                  )
                ) : (
                  <Typography variant="body2">Delivered</Typography>
                )}
              </Grid>
              <Grid item xs={1}>
                <Tooltip title="Click to unlink from job">
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => {
                      const ParentUserIndex = users.findIndex(
                        (u) => u.ParentUser === true
                      );

                      let newUsersArray = users;

                      setJobModified(true);

                      const newActiveJobArray = activeJob.apiJobs;
                      const aJ = newActiveJobArray.findIndex(
                        (x) => x === job.job_id
                      );
                      newActiveJobArray.splice(aJ, 1);
                      const linkedJobsArrayIndex =
                        activeJob.build.costs.linkedJobs.findIndex(
                          (i) => i.job_id === job.job_id
                        );
                      let newLinkedJobsArray = activeJob.build.costs.linkedJobs;

                      newLinkedJobsArray.splice(linkedJobsArrayIndex, 1);

                      updateActiveJob((prevObj) => ({
                        ...prevObj,
                        apiJobs: newActiveJobArray,
                        build: {
                          ...prevObj.build,
                          costs: {
                            ...prevObj.build.costs,
                            linkedJobs: newLinkedJobsArray,
                            installCosts: (activeJob.build.costs.installCosts -=
                              job.cost),
                          },
                        },
                      }));

                      const uA = newUsersArray[
                        ParentUserIndex
                      ].linkedJobs.findIndex((y) => y === job.job_id);
                      newUsersArray[ParentUserIndex].linkedJobs.splice(uA, 1);

                      updateUsers(newUsersArray);

                      const newApiArray = apiJobs;
                      const aA = newApiArray.findIndex(
                        (z) => z.job_id === job.job_id
                      );
                      newApiArray[aA].linked = false;
                      updateApiJobs(newApiArray);

                      setSnackbarData((prev) => ({
                        ...prev,
                        open: true,
                        message: "Unlinked",
                        severity: "success",
                        autoHideDuration: 1000,
                      }));
                    }}
                  >
                    <MdOutlineLinkOff />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          );
        })}
      </Paper>
    );
  } else {
    return (
      <Paper
        sx={{
          padding: "20px",
          minHeight: "25vh",
        }}
        elevation={3}
        square={true}
      >
        <Grid container>
          <Grid item sx={{ marginBottom: "20px" }} xs={12}>
            <Typography variant="h5" color="primary" align="center">
              Linked Jobs
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1" align="center">
              You currently have no industry jobs from the API linked to the
              this job.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    );
  }
}
