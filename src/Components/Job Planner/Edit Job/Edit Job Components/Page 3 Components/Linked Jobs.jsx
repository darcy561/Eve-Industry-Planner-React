import React, { useContext } from "react";
import { MainUserContext } from "../../../../../Context/AuthContext";
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
import MoreVertIcon from "@mui/icons-material/MoreVert";

export function LinkedJobs({ linkedJobs, setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { mainUser, updateMainUser } = useContext(MainUserContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);

  if (linkedJobs !== 0) {
    return (
      <Paper
        sx={{
          padding: "10px",
          paddingTop: "10px",
          minHeight: "25vh"
        }}
        elevation={3}
        square={true}
      >
        <Grid container direction="row" sx={{marginBottom: "10px"}}>
          <Grid item xs={12} md={11}>
            <Typography variant="h5" color="primary" align="center">
              Linked Jobs {activeJob.apiJobs.length}/{activeJob.jobCount}
            </Typography>
          </Grid>
          <Grid
            item
            md={1}
            sx={{ display: { xs: "none", md: "block" } }}
            align="right"
          >
            <IconButton>
              <MoreVertIcon size="small" color="Secondary" />
            </IconButton>
          </Grid>
        </Grid>
        {linkedJobs.map((job) => {
          return (
            <Grid key={job.job_id} item container direction="row" xs={12} sx={{ marginBottom: "10px" }}>
              <Grid item xs={2}>
                <Avatar
                  src={`https://images.evetech.net/characters/${job.installer_id}/portrait`}
                  variant="circular"
                  sx={{
                    height: "32px",
                    width: "32px"
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
                <Tooltip title="Click to unlink from job">
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => {
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

                      const newUserArray = mainUser.linkedJobs;
                      const uA = newUserArray.findIndex(
                        (y) => y === job.job_id
                      );
                      newUserArray.splice(uA, 1);
                      updateMainUser((prevObj) => ({
                        ...prevObj,
                        linkedJobs: newUserArray,
                      }));

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
      <Grid item container direction="row" xs={6}>
        <Typography variant="body2">
          You currently have no linked jobs.
        </Typography>
      </Grid>
    );
  }
}
