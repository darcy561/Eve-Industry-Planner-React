import React, { useContext } from "react";
import { IsLoggedInContext, UsersContext } from "../../../../../Context/AuthContext";
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
import { MdOutlineAddLink } from "react-icons/md";
import {getAnalytics, logEvent} from "firebase/analytics"

export function AvailableJobs({ jobMatches, setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const analytics = getAnalytics();

  class ESIJob {
    constructor(originalJob, owner) {
      this.status = originalJob.status;
      this.CharacterHash = owner.CharacterHash;
      this.runs = originalJob.runs;
      this.job_id = originalJob.job_id;
      this.completed_date = originalJob.completed_date || null;
      this.station_id = originalJob.station_id;
      this.station_name = originalJob.facility_name;
      this.start_date = originalJob.start_date;
      this.end_date = originalJob.end_date;
      this.cost = originalJob.cost;
      this.linked = true
      this.product_name = originalJob.product_name;
      this.blueprint_type_id = originalJob.blueprint_type_id;
      this.product_type_id = originalJob.product_type_id;
      this.activity_id = originalJob.activity_id;
      this.duration = originalJob.duration;
    }
  }

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

  if (
    jobMatches.length !== 0 &&
    activeJob.apiJobs.length < activeJob.jobCount
  ) {
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
              Available Jobs
            </Typography>
          </Grid>
        </Grid>
        {jobMatches.map((job) => {
          const jobOwner = users.find((i) => i.CharacterID === job.installer_id);

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
                <Typography variant="body2">{`${job.runs} Runs`}</Typography>
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
                <Tooltip title="Click to link to job">
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => {
                      setJobModified(true);

                      const ParentUserIndex = users.findIndex(
                        (u) => u.ParentUser === true
                      );

                      let newUsersArray = [...users];

                      const newActiveJobArray = [...activeJob.apiJobs];
                      newActiveJobArray.push(job.job_id);

                      let newLinkedJobsArray = [
                        ...activeJob.build.costs.linkedJobs,
                      ];

                      newLinkedJobsArray.push(
                        Object.assign({}, new ESIJob(job, jobOwner))
                      );

                      updateActiveJob((prevObj) => ({
                        ...prevObj,
                        apiJobs: newActiveJobArray,
                        build: {
                          ...prevObj.build,
                          costs: {
                            ...prevObj.build.costs,
                            linkedJobs: newLinkedJobsArray,
                            installCosts: (activeJob.build.costs.installCosts +=
                              job.cost),
                          },
                        },
                      }));

                      newUsersArray[ParentUserIndex].linkedJobs.push(
                        job.job_id
                      );
                      updateUsers(newUsersArray);

                      const newApiArray = apiJobs;
                      const aA = newApiArray.findIndex(
                        (z) => z.job_id === job.job_id
                      );
                      newApiArray[aA].linked = true;
                      updateApiJobs(newApiArray);

                      setSnackbarData((prev) => ({
                        ...prev,
                        open: true,
                        message: "Linked",
                        severity: "success",
                        autoHideDuration: 1000,
                      }));
                      logEvent(analytics, "linkESIJob", {
                        UID: users[ParentUserIndex].accountID,
                        isLoggedIn: isLoggedIn
                      })
                    }}
                  >
                    <MdOutlineAddLink />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          );
        })}
      </Paper>
    );
  } else if (activeJob.apiJobs.length >= activeJob.jobCount) {
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
              Available Jobs
            </Typography>
          </Grid>
        </Grid>
        <Grid item xs={12} align="center">
          <Typography variant="body1">
            You have linked the maximum number of jobs from the API, if you need
            to link more increase the number of job slots used.
          </Typography>
        </Grid>
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
          <Grid container direction="row" item sx={{ marginBottom: "20px" }}>
            <Grid item xs={12}>
              <Typography variant="h5" color="primary" align="center">
                Available Jobs
              </Typography>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1" align="center">
              There are no matching industry jobs from the API that match this
              job.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    );
  }
}
