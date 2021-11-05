import React, { useContext, useState } from "react";
import {
  JobArrayContext,
  JobStatusContext,
  ActiveJobContext,
  JobSettingsTriggerContext,
} from "../../../Context/JobContext";
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

//This is the function to render the contents of the edit job popup window
// export function EditJobOld() {
//   const [jobStatus, updateJobStatus] = useContext(JobStatusContext);
//   const { jobArray, updateJobArray } = useContext(JobArrayContext);
//   const [activeJob, updateActiveJob] = useContext(ActiveJobContext);
//   const [JobSettingsTrigger, ToggleJobSettingsTrigger] = useContext(JobSettingsTriggerContext);
//   const [SelectedPage, ChangeSelectedPage] = useContext(SelectedPageContext);

//   function PageSelector() {
//     if (SelectedPage === 1) {
//       return <EditPage1 />;
//     } else if (SelectedPage === 2) {
//       return <EditPage2 />;
//     } else if (SelectedPage === 3) {
//       return <EditPage3 />
//     } else if (SelectedPage === 4) {
//       return <EditPage4 />
//     } else if (SelectedPage === 5) {
//       return <EditPage5 />
//     }
//   }

//   if (JobSettingsTrigger) {
//     return (
//       <>
//         <div className="jobSettingsOverlay" onClick={() => {
//                   const index = jobArray.findIndex(
//                     (x) => activeJob.jobID === x.jobID
//                   );
//                   const newArray = [...jobArray];
//                   newArray[index] = activeJob;
//                   updateJobArray(newArray);
//                   ToggleJobSettingsTrigger((prev) => !prev);
//                   ChangeSelectedPage(activeJob.jobStatus);
//                 }}></div>
//         <div id="jobSettings" className="jobSettings">
//           <div id="jobSettingsHeader" className="jobSettingsHeader">
//             <div className="jobSettingsHeaderButtons">
//               {/* Delete Job Button */}
//               <div
//                 className="deleteJob"
//                 onClick={() => {
//                   const newArray = jobArray.filter(
//                     (job) => job.jobID !== activeJob.jobID
//                   );
//                   updateJobArray(newArray);
//                   ToggleJobSettingsTrigger((prev) => !prev);
//                 }}
//               ><MdDelete/></div>
//               {/* close Job Button */}
//               <div
//                 className="closeJob"
//                 onClick={() => {
//                   const index = jobArray.findIndex(
//                     (x) => activeJob.jobID === x.jobID
//                   );
//                   const newArray = [...jobArray];
//                   newArray[index] = activeJob;
//                   updateJobArray(newArray);
//                   ToggleJobSettingsTrigger((prev) => !prev);
//                   ChangeSelectedPage(activeJob.jobStatus);
//                 }}
//               >
//                 <MdClose/>
//               </div>
//             </div>
//             <div className="settingsName">
//               <h2>{activeJob.name}</h2>
//             </div>
//             <div className="jobNav">
//               {/* this calls the build of the nav bar  */}
//               {jobStatus.map((status) => {
//                 return activeJob.jobType === jobTypes.manufacturing ? (
//                     <div key={status.id} className={`jobNavButtonM ${activeJob.jobStatus === status.id ? `jobNavButtonCurrentStage`: ``} ${status.id === SelectedPage ?`jobNavButtonActive`: ``}`} onClick={() => { ChangeSelectedPage(status.id) }}>
//                     {status.name}
//                   </div>
//                 ) : activeJob.jobType === jobTypes.reaction ? (
//                       <div key={status.id} className={`jobNavButtonR ${activeJob.jobStatus === status.id ? `jobNavButtonCurrentStage`: ``} ${status.id === SelectedPage ?`jobNavButtonActive`: ``}`} onClick={() => { ChangeSelectedPage(status.id) }}>
//                     {status.name}
//                   </div>
//                 ) : activeJob.jobType === jobTypes.pi ? (
//                         <div key={status.id} className={`jobNavButtonP ${activeJob.jobStatus === status.id ? `jobNavButtonCurrentStage`: ``} ${status.id === SelectedPage ?`jobNavButtonActive`: ``}`} onClick={() => { ChangeSelectedPage(status.id) }}>
//                     {status.name}
//                   </div>
//                 ) : (
//                   ""
//                 );
//               })}
//             </div>
//           </div>
//           <div id="jobSettingsContent" className="settingsWrapper">
//               <PageSelector />
//             {/* this calls the build of the buttons along the left hand side of the popup */}
//             <JobSettingsButtons />
//           </div>
//         </div>
//       </>
//     );
//   }
//   return <></>;
// }

export function EditJob() {
  const { jobStatus, updateJobStatus } = useContext(JobStatusContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { JobSettingsTrigger, ToggleJobSettingsTrigger } = useContext(
    JobSettingsTriggerContext
  );
  const [activeStep, changeStep] = useState(1);

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
    updateJobArray(newArray);
    ToggleJobSettingsTrigger((prev) => !prev);
  }

  function deleteJob() {
    const newArray = jobArray.filter((job) => job.jobID !== activeJob.jobID);
    updateJobArray(newArray);
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
          <Grid item xs={8} sm={3}><Typography variant="body2">Items Produced Per Run</Typography></Grid>
          <Grid item xs={3} sm={5}>
            {activeJob.jobType === jobTypes.manufacturing ?
              <Typography variant="body2">{Number(activeJob.manufacturing.products[0].quantity).toLocaleString()}</Typography>
              : <></>}
            {activeJob.jobType === jobTypes.reaction ?
              <Typography variant="body2">{Number(activeJob.reaction.products[0].quantity).toLocaleString()}</Typography>
              : <></>}
          </Grid>
          <Grid item xs={0} sm={4}></Grid>
          <Grid item xs={8} sm={3}><Typography variant="body2">Total Items Per Job</Typography></Grid>
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