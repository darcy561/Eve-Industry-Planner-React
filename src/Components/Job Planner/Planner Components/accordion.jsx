import React, { useContext, useState } from "react";
import { JobArrayContext, JobStatusContext } from "../../../Context/JobContext";
import { IsLoggedInContext } from "../../../Context/AuthContext";
import { StatusSettingsTriggerContext } from "../../../Context/LayoutContext";
import { makeStyles } from "@material-ui/styles";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  Typography,
  IconButton,
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import SettingsIcon from "@material-ui/icons/Settings";
import { JobCard } from "../Job Card";
import { StatusSettings } from "./StatusSettings";

const useStyles = makeStyles((theme) => ({
  Accordion: {
    width: "100%",
    background: "none",
    marginBottom: "16px",
  },
  Expand: {
    
  },
  Settings: {

  }
}));



export function PlannerAccordion() {
  const { jobStatus, setJobStatus } = useContext(JobStatusContext);
  const { jobArray } = useContext(JobArrayContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { statusSettingsTrigger, updateStatusSettingsTrigger }  = useContext(StatusSettingsTriggerContext);
  const classes = useStyles();

  function handleExpand(statusID) {
    const index = jobStatus.findIndex(x => x.id === statusID);
    let newStatusArray = [...jobStatus];
    newStatusArray[index].expanded = !newStatusArray[index].expanded;
    setJobStatus(newStatusArray);
  };

  return (
    <Container maxWidth="xl" disableGutters={true}>
      {/* Builds each status accordion on the job planner main page */}
      {jobStatus.map((status) => {
        return (
            <Accordion
              className={classes.Accordion}
              expanded={status.expanded === true}
              square={true}
              spacing={1}
              id={status.id}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon color="secondary" className={classes.Expand} />}
                IconButtonProps={{ onClick: () => handleExpand(status.id) }}
                aria-label="Expand Icon"
              >
                <Typography variant="h4" className={classes.Title}>{status.name}</Typography>
                {isLoggedIn && (
                  <FormControlLabel
                    aria-label="Acknowledge"
                  onClick={() => updateStatusSettingsTrigger({id:status.id, display:true})}
                    control={
                      <IconButton className={classes.Settings}>
                        <SettingsIcon color="secondary" fontSize="small"   />
                      </IconButton>
                    }
                  />
                )}
              </AccordionSummary> 
              <AccordionDetails>
                <Grid container direction="row" item xs={12} spacing={1}>
                  {jobArray.map((job) => {
                    if (job.jobStatus == status.id) {
                      return <JobCard key={job.JobID} job={job} />;
                    }
                  })}
                </Grid>
              </AccordionDetails>
            </Accordion>
        );
      })}
      <StatusSettings />
    </Container>
  );
};