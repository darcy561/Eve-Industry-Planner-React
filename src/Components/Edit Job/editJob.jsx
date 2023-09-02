import { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { JobStatusContext } from "../../Context/JobContext";
import { useJobManagement } from "../../Hooks/useJobManagement";
import {
  Avatar,
  Divider,
  Grid,
  IconButton,
  Paper,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Tooltip,
  Typography,
} from "@mui/material";
import { CloseJobIcon } from "./closeIcon";
import { SaveJobIcon } from "./saveIcon";
import { DeleteJobIcon } from "./deleteIcon";
import { LinkedJobBadge } from "./Linked Job Badge";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { useOpenEditJob_New } from "../../Hooks/JobHooks/useOpenEditJob_New";
import { LoadingPage } from "../loadingPage";
import { EditPage1 } from "./Edit Job Components/Page 1/Job Page 1";
// import { EditPage2 } from "./Edit Job Components/Page 2/Job Page 2";
// import { EditPage3 } from "./Edit Job Components/Page 3/Job Page 3";
// import { EditPage4 } from "./Edit Job Components/Page 4/Job Page 4";
// import { EditPage5 } from "./Edit Job Components/Page 5/Job Page 5";

export function EditJob_New() {
  const { jobStatus } = useContext(JobStatusContext);
  const [activeJob, updateActiveJob] = useState(null);
  const [jobModified, setJobModified] = useState(false);
  const { deepCopyJobObject } = useJobManagement();
  const { openEditJob } = useOpenEditJob_New();
  const { jobID } = useParams();
  let backupJob = useRef(null);

  useEffect(() => {
    async function openJobProcess() {
      const matchedJob = await openEditJob(jobID);
      updateActiveJob(deepCopyJobObject(matchedJob));
      backupJob.current = deepCopyJobObject(matchedJob);
    }
    openJobProcess();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  function stepBack() {
    updateActiveJob((prevState) => ({
      ...prevState,
      jobStatus: prevState.jobStatus - 1,
    }));
    setJobModified(true);
  }
  function stepForward() {
    updateActiveJob((prevState) => ({
      ...prevState,
      jobStatus: prevState.jobStatus + 1,
    }));
    setJobModified(true);
  }

  function StepContentSelector() {
    switch (activeJob.jobStatus) {
      case 0:
        return (
          <EditPage1
            activeJob={activeJob}
            updateActiveJob={updateActiveJob}
            jobModified={jobModified}
            setJobModified={setJobModified}
          />
        );
      case 1:
        return null;
      // return (
      //   <EditPage2
      //     activeJob={activeJob}
      //     updateActiveJob={updateActiveJob}
      //     setJobModified={setJobModified}
      //     updateShoppingListTrigger={updateShoppingListTrigger}
      //     updateShoppingListData={updateShoppingListData}
      //   />
      // );
      case 2:
        return null;
      // return (
      //   <EditPage3
      //     activeJob={activeJob}
      //     updateActiveJob={updateActiveJob}
      //     setJobModified={setJobModified}
      //   />
      // );
      case 3:
        return null;
      // return (
      //   <EditPage4
      //     activeJob={activeJob}
      //     updateActiveJob={updateActiveJob}
      //     setJobModified={setJobModified}
      //     updateEditJobTrigger={updateEditJobTrigger}
      //   />
      // );
      case 4:
        return null;
      // return (
      //   <EditPage5
      //     activeJob={activeJob}
      //     updateActiveJob={updateActiveJob}
      //     setJobModified={setJobModified}
      //     updateEditJobTrigger={updateEditJobTrigger}
      //   />
      // );
      default:
        return (
          <EditPage1
            activeJob={activeJob}
            updateActiveJob={updateActiveJob}
            setJobModified={setJobModified}
          />
        );
    }
  }

  if (!activeJob) return <LoadingPage />;

  return (
    <Paper
      elevation={3}
      sx={{
        padding: "10px",
        marginTop: "20px",
        marginBottom: "20px",
        width: "100%",
      }}
      square
    >
      <Grid container>
        <Grid item xs={7} md={9} lg={10} />
        <Grid item xs={5} md={3} lg={2} align="right">
          <DeleteJobIcon activeJob={activeJob} />
          <SaveJobIcon jobModified={jobModified} />
          <CloseJobIcon />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h3" color="primary" align="left">
            {activeJob.name}
          </Typography>
        </Grid>
        <Grid item xs={2} />
        <Grid
          item
          xs={12}
          sm={5}
          align="center"
          sx={{ marginTop: { xs: "20px", md: "30px" } }}
        >
          <Avatar
            src={`https://images.evetech.net/types/${activeJob.itemID}/icon?size=32`}
            alt={activeJob.name}
            variant="square"
            sx={{
              height: { xs: "32px", sm: "64px" },
              width: { xs: "32px", sm: "64px" },
            }}
          />
        </Grid>
        <Grid item xs={12} sm={5} sx={{ marginTop: { xs: "10px", sm: "0px" } }}>
          <LinkedJobBadge
            activeJob={activeJob}
            updateActiveJob={updateActiveJob}
            jobModified={jobModified}
            setJobModified={setJobModified}
          />
        </Grid>
        <Grid item xs={12}>
          <Stepper activeStep={activeJob.jobStatus} orientation="vertical">
            {jobStatus.map((status) => {
              return (
                <Step
                  key={status.id}
                  sx={{
                    "& MuiStepIcon-text": {
                      fill: "#000",
                    },
                  }}
                >
                  <StepLabel>{status.name}</StepLabel>
                  <StepContent>
                    <Divider />
                    {activeJob.jobStatus !== 0 && (
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
                    )}
                    <StepContentSelector />
                    {activeJob.jobStatus !== jobStatus.length - 1 && (
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
                            disabled={
                              activeJob.groupID &&
                              !activeJob.isReadyToSell &&
                              activeJob.jobStatus === jobStatus.length - 2
                            }
                          >
                            <ArrowDownwardIcon />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    )}
                    <Divider />
                  </StepContent>
                </Step>
              );
            })}
          </Stepper>
        </Grid>
      </Grid>
    </Paper>
  );
}
