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
  Tooltip,
  Typography,
} from "@material-ui/core";
import { MdOutlineAddLink } from "react-icons/md";

export function AvailableJobs({ jobMatches, setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { mainUser, updateMainUser } = useContext(MainUserContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);

  if (jobMatches.length !== 0 && activeJob.apiJobs.length < activeJob.jobCount) {
    return (
      <>
        {jobMatches.map((job) => {
          return (
            <Grid item container direction="row" xs={6}>
              <Grid item xs={2}>
                <Avatar
                  src={`https://images.evetech.net/characters/${job.installer_id}/portrait`}
                  variant="circular"
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

                      const newActiveJobArray = activeJob.apiJobs;
                      newActiveJobArray.push(job.job_id);
                      updateActiveJob((prevObj) => ({
                        ...prevObj,
                        apiJobs: newActiveJobArray,
                        job: {
                          ...prevObj.job,
                          costs: {
                            ...prevObj.job.costs,
                            installCosts: (activeJob.job.costs.installCosts +=
                              job.cost),
                          },
                        },
                      }));

                      const newUserArray = mainUser.linkedJobs;
                      newUserArray.push(job.job_id);
                      updateMainUser((prevObj) => ({
                        ...prevObj,
                        linkedJobs: newUserArray,
                      }));

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
      </>
    );
  } else if (activeJob.apiJobs.length >= activeJob.jobCount) {
    return (

            <Grid item container direction="row" xs={6}>
            <Typography variant="body2">
              You have linked the maximum number of API jobs, if you need to link
              more increase the number of job slots used.
            </Typography>
          </Grid>
    )
  } else{
    return (
      <Grid item container direction="row" xs={6}>
        <Typography variant="body2">
          No matching API jobs are currently found.
        </Typography>
      </Grid>
    )
  }
}
