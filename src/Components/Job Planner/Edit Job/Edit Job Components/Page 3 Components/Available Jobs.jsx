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
import { MdOutlineAddLink } from "react-icons/md";

export function AvailableJobs({ jobMatches, setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);

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
                  src={`https://images.evetech.net/characters/${job.installer_id}/portrait`}
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
                <Typography variant="body2">{job.status}</Typography>
              </Grid>
              <Grid item xs={1}>
                <Tooltip title="Click to link to job">
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => {
                      setJobModified(true);

                      const ParentUserIndex = users.findIndex((u) => u.ParentUser === true);

                      let newUsersArray = users

                      const newActiveJobArray = activeJob.apiJobs;
                      newActiveJobArray.push(job.job_id);
                      updateActiveJob((prevObj) => ({
                        ...prevObj,
                        apiJobs: newActiveJobArray,
                        build: {
                          ...prevObj.build,
                          costs: {
                            ...prevObj.build.costs,
                            installCosts: (activeJob.build.costs.installCosts +=
                              job.cost),
                          },
                        },
                      }));

                      newUsersArray[ParentUserIndex].linkedJobs.push(job.job_id);
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
            You have linked the maximum number of jobs from the API, if you need to link
            more increase the number of job slots used.
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
        <Grid container >
          <Grid container direction="row" item sx={{ marginBottom: "20px" }}>
            <Grid item xs={12}>
              <Typography variant="h5" color="primary" align="center">
                Available Jobs
              </Typography>
            </Grid>
          </Grid>
          <Grid item xs={12} >
            <Typography variant="body1" align="center">
              There are no matching industry jobs from the API that match this job.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    );
  }
}
