import React, { useContext, useState } from "react";
import {
  JobArrayContext,
  JobStatusContext,
  ActiveJobContext,
  JobSettingsTriggerContext,
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
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
} from "@material-ui/core";
import { jobTypes } from "../JobPlanner";
import { useFirebase } from "../../../Hooks/useFirebase";
import { IsLoggedInContext } from "../../../Context/AuthContext";

export function EditJob() {
  const { jobStatus, updateJobStatus } = useContext(JobStatusContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { JobSettingsTrigger, ToggleJobSettingsTrigger } = useContext(JobSettingsTriggerContext);
  const [activeStep, changeStep] = useState(1);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { removeJob, uploadJob } = useFirebase();

  function StepContentSelector() {
    switch (activeJob.jobStatus) {
      case 0:
        return <EditPage1 />;
      case 1:
        return <EditPage2 />;
      case 2:
        return <EditPage3 />;
      case 3:
        return <EditPage4 />;
      case 4:
        return <EditPage5 />;
      default:
        return <EditPage1 />;
    }
  }

  function stepBack() {
    updateActiveJob((prevState) => ({
      ...prevState,
      jobStatus: prevState.jobStatus - 1,
    }));
    changeStep((prevActiveStep) => prevActiveStep - 1);
  }

  function stepForward() {
    updateActiveJob((prevState) => ({
      ...prevState,
      jobStatus: prevState.jobStatus + 1,
    }));
    changeStep((prevActiveStep) => prevActiveStep + 1);
  }

  function closeJob() {
    const index = jobArray.findIndex((x) => activeJob.jobID === x.jobID);
    const newArray = [...jobArray];
    newArray[index] = activeJob;
    // isLoggedIn && uploadJob(activeJob);
    updateJobArray(newArray);
    setSnackbarData((prev) => ({
      ...prev, open: true, message: `${activeJob.name} Updated`, severity: "info", autoHideDuration: 1000,
    }));
    ToggleJobSettingsTrigger((prev) => !prev);
    
  }

  function deleteJob() {
    const newArray = jobArray.filter((job) => job.jobID !== activeJob.jobID);
    updateJobArray(newArray);
    isLoggedIn && removeJob(activeJob);
    setSnackbarData((prev) => ({
      ...prev, open: true, message: `${activeJob.name} Deleted`, severity: "error", autoHideDuration: 3000,
    }));
    ToggleJobSettingsTrigger((prev) => !prev);
  }

  return (
    <>
      <Container maxWidth={false} disableGutters={true}>
        <Grid container direction="row">
          <Grid item xs={12}></Grid>
          <Grid item xs={12}>
            <Typography variant="h4" align="center">
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
              style={{ width: "90%" }}
              variant="contained"
              color="primary"
              onClick={closeJob}
            >
              Close
            </Button>
          </Grid>
          <Grid item xs={9} sm={11}>
          </Grid>
          <Grid item xs={2} sm={1}>
            <Button
              style={{ width: "90%" }}
              variant="contained"
              color="primary"
              onClick={deleteJob}
            >
              Delete
            </Button>
          </Grid>
          <Grid item xs={0} sm={4}></Grid>
          <Grid item xs={8} sm={3}><Typography variant="body2">Items Produced Per Blueprint Run</Typography></Grid>
          <Grid item xs={3} sm={5}>
            {activeJob.jobType === jobTypes.manufacturing ?
              <Typography variant="body2">{Number(activeJob.manufacturing.products[0].quantity).toLocaleString()}</Typography>
              : <></>}
            {activeJob.jobType === jobTypes.reaction ?
              <Typography variant="body2">{Number(activeJob.reaction.products[0].quantity).toLocaleString()}</Typography>
              : <></>}
          </Grid>
          <Grid item xs={0} sm={4}></Grid>
          <Grid item xs={8} sm={3}><Typography variant="body2">Total Items Per Job Slot</Typography></Grid>
          <Grid item xs={3} sm={5}>
              <Typography variant="body2">{activeJob.job.products.quantityPerJob.toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={0} sm={4}></Grid>
          <Grid item xs={8} sm={3}><Typography variant="body2">Total Items Being Produced</Typography></Grid>
          <Grid item xs={3} sm={5}>
              <Typography variant="body2">{activeJob.job.products.totalQuantity.toLocaleString()}</Typography>
          </Grid>
        </Grid>
        <Stepper activeStep={activeJob.jobStatus} orientation="vertical" style={{background:"none"}}>
          {jobStatus.map((status) => {
            return (
              <Step key={status.id} >
                <StepLabel>{status.name}</StepLabel>
                <StepContent>
                  <StepContentSelector />
                  <Button
                    disabled={activeJob.jobStatus === 0}
                    variant="contained"
                    color="primary"
                    onClick={stepBack}
                  >
                    Back
                  </Button>
                  <Button
                    disabled={activeStep === jobStatus.length}
                    variant="contained"
                    color="primary"
                    onClick={stepForward}
                  >
                    Next
                  </Button>
                </StepContent>
              </Step>
            );
          })}
        </Stepper>
      </Container>
    </>
  );
};