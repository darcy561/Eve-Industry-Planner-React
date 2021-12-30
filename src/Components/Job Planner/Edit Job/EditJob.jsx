import React, { useContext, useState } from "react";
import {
  JobArrayContext,
  JobStatusContext,
  ActiveJobContext,
  ApiJobsContext,
} from "../../../Context/JobContext";
import { SnackBarDataContext } from "../../../Context/LayoutContext";
import { EditPage1 } from "./Edit Job Components/Job Page 1";
import { EditPage2 } from "./Edit Job Components/Job Page 2";
import { EditPage3 } from "./Edit Job Components/Job Page 3";
import { EditPage4 } from "./Edit Job Components/Job Page 4";
import { EditPage5 } from "./Edit Job Components/Job Page 5";
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tooltip,
  Typography,
} from "@mui/material";
import { useFirebase } from "../../../Hooks/useFirebase";
import {
  IsLoggedInContext,
  MainUserContext,
} from "../../../Context/AuthContext";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

export default function EditJob({ updateJobSettingsTrigger }) {
  const { jobStatus } = useContext(JobStatusContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { mainUser, updateMainUser } = useContext(MainUserContext);
  const { removeJob, uploadJob, updateMainUserDoc } = useFirebase();
  const [jobModified, setJobModified] = useState(false);

  function StepContentSelector() {
    switch (activeJob.jobStatus) {
      case 0:
        return <EditPage1 setJobModified={setJobModified} />;
      case 1:
        return <EditPage2 setJobModified={setJobModified} />;
      case 2:
        return <EditPage3 setJobModified={setJobModified} />;
      case 3:
        return <EditPage4 setJobModified={setJobModified} />;
      case 4:
        return <EditPage5 setJobModified={setJobModified} />;
      default:
        return <EditPage1 setJobModified={setJobModified} />;
    }
  }

  function stepBack() {
    updateActiveJob((prevState) => ({
      ...prevState,
      jobStatus: prevState.jobStatus -1,
    }));
    setJobModified(true);
  }

  function stepForward() {
    updateActiveJob((prevState) => ({
      ...prevState,
      jobStatus: prevState.jobStatus +1,
    }));
    setJobModified(true);
  }

  function closeJob() {
    const index = jobArray.findIndex((x) => activeJob.jobID === x.jobID);
    const newArray = [...jobArray];
    newArray[index] = activeJob;
    if (isLoggedIn && jobModified) {
      uploadJob(activeJob);
      updateMainUserDoc();
    }
    updateJobArray(newArray);
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${activeJob.name} Updated`,
      severity: "info",
      autoHideDuration: 1000,
    }));
    updateJobSettingsTrigger((prev) => !prev);
  }

  function deleteJob() {
    if (isLoggedIn) {
      removeJob(activeJob);
      const newMainUserArray = mainUser.linkedJobs;
      const newApiJobsArary = apiJobs;
      activeJob.apiJobs.forEach((job) => {
        const x = mainUser.linkedJobs.findIndex((i) => i === job);
        const y = apiJobs.findIndex((u) => u.job_id === job);
        newMainUserArray.splice(x, 1);
        newApiJobsArary[y].linked = false;
      });
      updateMainUser((prevObj) => ({
        ...prevObj,
        linkedJobs: newMainUserArray,
      }));
      updateApiJobs(newApiJobsArary);
      updateMainUserDoc();
    }

    const newJobArray = jobArray.filter((job) => job.jobID !== activeJob.jobID);
    updateJobArray(newJobArray);

    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${activeJob.name} Deleted`,
      severity: "error",
      autoHideDuration: 3000,
    }));
    updateJobSettingsTrigger((prev) => !prev);
  }

  return (
    <>
      <Paper
        elevation={3}
        style={{
          padding: "10px",
          marginBottom: "20px",
        }}
        square={true}
      >
        <Container maxWidth="false" disableGutters={true}>
          <Grid container direction="row">
            <Grid marginTop="10px" item xs={12}>
              <Typography variant="h3" color="primary" align="left">
                {activeJob.name}
              </Typography>
            </Grid>
            <Grid item xs={1} sm={1}></Grid>
            <Grid item xs={1} sm={2}>
              <Box>
                <picture>
                  <source
                    media="(max-width:700px)"
                    srcSet={`https://image.eveonline.com/Type/${activeJob.itemID}_32.png`}
                    alt=""
                  />
                  <img
                    src={`https://image.eveonline.com/Type/${activeJob.itemID}_64.png`}
                    alt=""
                  />
                </picture>
              </Box>
            </Grid>
            <Grid item xs={7} sm={8}></Grid>
            <Grid item xs={2} sm={1}>
              <Button
                variant="contained"
                color="secondary"
                onClick={closeJob}
                size="small"
              >
                Close
              </Button>
            </Grid>
            <Grid item xs={9} sm={11}></Grid>
            <Grid item xs={2} sm={1}>
              <Button
                variant="contained"
                color="error"
                onClick={deleteJob}
                size="small"
              >
                Delete
              </Button>
            </Grid>
            <Grid item sm={4}></Grid>
          </Grid>
          <Stepper activeStep={activeJob.jobStatus} orientation="vertical">
            {jobStatus.map((status) => {
              return (
                <Step key={status.id}>
                  <StepLabel>{status.name}</StepLabel>
                  <StepContent>
                    <Divider />
                    {activeJob.jobStatus !== 0 && (
                      <Grid
                        container
                        sx={{
                          marginTop: "10px",
                          marginBottom: "20px",
                        }}
                      >
                        <Grid item xs={12} align="center">
                          <Tooltip
                            title="Move to previous step"
                            arrow
                            placement="right"
                          >
                            <IconButton
                              color="primary"
                              onClick={stepBack}
                              size="large"
                            >
                              <ArrowUpwardIcon />
                            </IconButton>
                          </Tooltip>
                        </Grid>
                      </Grid>
                    )}
                    <StepContentSelector />
                    {activeJob.jobStatus !== jobStatus.length - 1 && (
                      <Grid
                        container
                        sx={{
                          marginTop: "20px",
                          marginBottom: "10px",
                        }}
                      >
                        <Grid item xs={12} align="center">
                          <Tooltip
                            title="Move to next step"
                            arrow
                            placement="right"
                          >
                            <IconButton
                              color="primary"
                              onClick={stepForward}
                              size="large"
                            >
                              <ArrowDownwardIcon />
                            </IconButton>
                          </Tooltip>
                        </Grid>
                      </Grid>
                    )}
                    <Divider />
                  </StepContent>
                </Step>
              )
            })}
          </Stepper>
        </Container>
      </Paper>
    </>
  )
}
