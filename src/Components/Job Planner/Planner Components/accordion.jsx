import React, { useContext, useState } from "react";
import { JobArrayContext, JobStatusContext } from "../../../Context/JobContext";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../Context/AuthContext";
import { makeStyles } from "@material-ui/styles";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Container,
  FormControlLabel,
  Grid,
  Typography,
  IconButton,
  Tooltip,
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import SettingsIcon from "@material-ui/icons/Settings";
import { JobCard } from "../Job Card/JobCard";
import { StatusSettings } from "./StatusSettings";
import { useFirebase } from "../../../Hooks/useFirebase";
import { ApiJobCard } from "../Job Card/ApiJobCard";

const useStyles = makeStyles((theme) => ({
  Accordion: {
    width: "100%",
    background: "none",
    marginBottom: "16px",
  },
  Expand: {},
  Settings: {},
}));

export function PlannerAccordion({ updateJobSettingsTrigger }) {
  const { jobStatus, setJobStatus } = useContext(JobStatusContext);
  const { jobArray } = useContext(JobArrayContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users } = useContext(UsersContext);
  const [statusSettingsTrigger, updateStatusSettingsTrigger] = useState(false);
  const [statusData, updateStatusData] = useState({
    id: 0,
    name: "",
    sortOrder: 0,
    expanded: true,
    openAPIJobs: false,
    completeAPIJobs: false,
  });
  const { uploadJobStatus } = useFirebase();
  const classes = useStyles();

  function handleExpand(statusID) {
    const index = jobStatus.findIndex((x) => x.id === statusID);
    let newStatusArray = [...jobStatus];
    newStatusArray[index].expanded = !newStatusArray[index].expanded;
    isLoggedIn && uploadJobStatus(newStatusArray);
    setJobStatus(newStatusArray);
  }

  const openAPIJobs = [];
  users.forEach((u) => {
    u.apiJobs.map((j) => {
      if (j.status === "active") {
        openAPIJobs.push(j)
      }
    })
  });

  const completeAPIJobs = [];
  users.forEach((u) => {
    u.apiJobs.map((j) => {
      if (j.status === "ready" || j.status === "delivered") {
        completeAPIJobs.push(j)
      }
    })
  });

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
              expandIcon={
                <ExpandMoreIcon color="secondary" className={classes.Expand} />
              }
              IconButtonProps={{ onClick: () => handleExpand(status.id) }}
              aria-label="Expand Icon"
            >
              <Typography variant="h4" className={classes.Title}>
                {status.name}
              </Typography>
              {isLoggedIn && (
                <Tooltip title="Change status settings">
                <FormControlLabel
                  aria-label="Acknowledge"
                  onClick={() => {
                    updateStatusData(status);
                    updateStatusSettingsTrigger(true);
                  }}
                  control={
                    <IconButton className={classes.Settings}>
                      <SettingsIcon color="secondary" fontSize="small" />
                    </IconButton>
                  }
                />
                </Tooltip>
              )}
            </AccordionSummary>
            <AccordionDetails>
              <Grid container direction="row" item xs={12} spacing={1}>

                {status.openAPIJobs &&
                  openAPIJobs.map((j) => {
                    return <ApiJobCard job={j} />;
                  })}
                
                {status.completeAPIJobs &&
                  completeAPIJobs.map((j) => {
                    return <ApiJobCard job={j} />;
                  })}

                {jobArray.map((job) => {
                  if (job.jobStatus == status.id) {
                    return (
                      <JobCard
                        job={job}
                        updateJobSettingsTrigger={updateJobSettingsTrigger}
                      />
                    );
                  }
                })}

              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}
      <StatusSettings
        statusData={statusData}
        updateStatusData={updateStatusData}
        statusSettingsTrigger={statusSettingsTrigger}
        updateStatusSettingsTrigger={updateStatusSettingsTrigger}
      />
    </Container>
  );
}
