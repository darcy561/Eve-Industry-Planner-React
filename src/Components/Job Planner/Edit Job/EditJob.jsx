import { useContext, useEffect, useState } from "react";
import {
  JobStatusContext,
  ActiveJobContext,
} from "../../../Context/JobContext";
import { EditPage1 } from "./Edit Job Components/Job Page 1";
import { EditPage2 } from "./Edit Job Components/Job Page 2";
import { EditPage3 } from "./Edit Job Components/Job Page 3";
import { EditPage4 } from "./Edit Job Components/Job Page 4";
import { EditPage5 } from "./Edit Job Components/Job Page 5";
import {
  Box,
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
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { LinkedJobBadge } from "./Linked Job Badge";
import { useDeleteSingleJob } from "../../../Hooks/JobHooks/useDeleteSingleJob";
import { useCloseActiveJob } from "../../../Hooks/JobHooks/useCloseActiveJob";


function EditJob({
  updateEditJobTrigger,
  updateShoppingListTrigger,
  updateShoppingListData,
}) {
  const { jobStatus } = useContext(JobStatusContext);
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { closeActiveJob } = useCloseActiveJob();
  const { deleteSingleJob } = useDeleteSingleJob();
  const [jobModified, setJobModified] = useState(false);


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

  function StepContentSelector() {
    switch (activeJob.jobStatus) {
      case 0:
        return (
          <EditPage1
            jobModified={jobModified}
            setJobModified={setJobModified}
          />
        );
      case 1:
        return (
          <EditPage2
            setJobModified={setJobModified}
            updateShoppingListTrigger={updateShoppingListTrigger}
            updateShoppingListData={updateShoppingListData}
          />
        );
      case 2:
        return <EditPage3 setJobModified={setJobModified} />;
      case 3:
        return (
          <EditPage4
            setJobModified={setJobModified}
            updateEditJobTrigger={updateEditJobTrigger}
          />
        );
      case 4:
        return (
          <EditPage5
            setJobModified={setJobModified}
            updateEditJobTrigger={updateEditJobTrigger}
          />
        );
      default:
        return <EditPage1 setJobModified={setJobModified} />;
    }
  }

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

  if (!activeJob) return null;

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
      <Grid container direction="row">
        <Grid item xs={7} md={9} lg={10} />
        <Grid item xs={5} md={3} lg={2} align="right">
          <Tooltip arrow title="Deletes the job from your job planner.">
            <IconButton
              variant="contained"
              color="error"
              onClick={async () => {
                await deleteSingleJob(activeJob.jobID);
                updateEditJobTrigger((prev) => !prev);
              }}
              size="medium"
              sx={{ marginRight: { xs: "20px", sm: "40px" } }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip
            arrow
            title="Saves all changes and returns to the job planner page."
          >
            <IconButton
              color="primary"
              onClick={async () => {
                closeActiveJob(activeJob, jobModified);
                updateEditJobTrigger((prev) => !prev);
              }}
              size="medium"
              sx={{ marginRight: { sm: "10px" } }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
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
          <Box>
            <picture>
              <source
                media="(max-width:700px)"
                srcSet={`https://images.evetech.net/types/${activeJob.itemID}/icon?size=32`}
                alt=""
              />
              <img
                src={`https://images.evetech.net/types/${activeJob.itemID}/icon?size=64`}
                alt=""
              />
            </picture>
          </Box>
        </Grid>

        <Grid item xs={12} sm={5} sx={{ marginTop: { xs: "10px", sm: "0px" } }}>
          <LinkedJobBadge
            jobModified={jobModified}
            setJobModified={setJobModified}
          />
        </Grid>
        <Grid item xs={12}>
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

export default EditJob;
