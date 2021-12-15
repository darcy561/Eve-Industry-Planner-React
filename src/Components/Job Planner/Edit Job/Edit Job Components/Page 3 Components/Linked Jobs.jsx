import React, { useContext } from "react";
import { MainUserContext } from "../../../../../Context/AuthContext";
import { ActiveJobContext, ApiJobsContext } from "../../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import { Avatar, Grid, IconButton, Tooltip, Typography } from "@material-ui/core";
import { MdOutlineLinkOff} from "react-icons/md"

export function LinkedJobs({linkedJobs, setJobModified}) {
    const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
    const { mainUser, updateMainUser } = useContext(MainUserContext);
    const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
    const { setSnackbarData } = useContext(SnackBarDataContext);

    if (linkedJobs != 0) {
        return (
            <>
                {linkedJobs.map((job) => {
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
                                <Tooltip title="Click to unlink from job">
                                    <IconButton
                                        color="primary"
                                        size="small"
                                        onClick={() => {
                                            setJobModified(true);

                                            const newActiveJobArray = activeJob.apiJobs;
                                            const aJ = newActiveJobArray.findIndex(
                                                (x) => x == job.job_id
                                            );
                                            newActiveJobArray.splice(aJ, 1);
                                            updateActiveJob((prevObj) => ({
                                                ...prevObj,
                                                apiJobs: newActiveJobArray,
                                                job: {
                                                    ...prevObj.job,
                                                    costs: {
                                                        ...prevObj.job.costs,
                                                        installCosts: activeJob.job.costs.installCosts -= job.cost
                                                    }
                                                }
                                            }));

                                            const newUserArray = mainUser.linkedJobs;
                                            const uA = newUserArray.findIndex((y) => y == job.job_id);
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
                                                ...prev, open: true, message: "Unlinked", severity: "success", autoHideDuration: 1000,
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
            </>
        )
    } else {
        return (
            <Grid item container direction="row" xs={6}>
            <Typography variant="body2">
              You currently have no linked jobs.
            </Typography>
          </Grid>
        )
    }
  }