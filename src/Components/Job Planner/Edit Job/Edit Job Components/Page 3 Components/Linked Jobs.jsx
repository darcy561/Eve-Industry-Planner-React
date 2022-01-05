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

export function LinkedJobs({ linkedJobs, setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);

  if (linkedJobs != 0) {
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
        {linkedJobs.map((job) => {
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
                <Typography variant="body1">{`${job.runs} Runs`}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body1">{job.status}</Typography>
              </Grid>
              <Grid item xs={1}>
                <Tooltip title="Click to unlink from job">
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => {

                      const ParentUserIndex = users.findIndex((u) => u.ParentUser === true);

                      let newUsersArray = users

                      setJobModified(true);

                      const newActiveJobArray = activeJob.apiJobs;
                      const aJ = newActiveJobArray.findIndex(
                        (x) => x === job.job_id
                      );
                      newActiveJobArray.splice(aJ, 1);
                      updateActiveJob((prevObj) => ({
                        ...prevObj,
                        apiJobs: newActiveJobArray,
                        build: {
                          ...prevObj.build,
                          costs: {
                            ...prevObj.build.costs,
                            installCosts: (activeJob.build.costs.installCosts -=
                              job.cost),
                          },
                        },
                      }));

                      
                      const uA = newUsersArray[ParentUserIndex].linkedJobs.findIndex(
                        (y) => y === job.job_id
                      );
                      newUsersArray[ParentUserIndex].linkedJobs.splice(uA, 1);

                      updateUsers(newUsersArray)

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
              You currently have no industry jobs from the API linked to the this job.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    );
  }
}
