import React, { useContext, useState } from "react";
import {
  ApiJobsContext,
  JobArrayContext,
  JobStatusContext,
} from "../../../Context/JobContext";
import { IsLoggedInContext } from "../../../Context/AuthContext";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  FormControlLabel,
  Grid,
  Paper,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SettingsIcon from "@mui/icons-material/Settings";
import { JobCard } from "../Job Card/JobCard";
import { StatusSettings } from "./StatusSettings";
import { useFirebase } from "../../../Hooks/useFirebase";
import { ApiJobCard } from "../Job Card/ApiJobCard";

export function PlannerAccordion({ updateJobSettingsTrigger }) {
  const { jobStatus, setJobStatus } = useContext(JobStatusContext);
  const { jobArray } = useContext(JobArrayContext);
  const { apiJobs } = useContext(ApiJobsContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const [statusSettingsTrigger, updateStatusSettingsTrigger] = useState(false);
  const [statusData, updateStatusData] = useState({
    id: 0,
    name: "",
    sortOrder: 0,
    expanded: true,
    openAPIJobs: false,
    completeAPIJobs: false,
  });
  const { updateMainUserDoc } = useFirebase();

  function handleExpand(statusID) {
    const index = jobStatus.findIndex((x) => x.id === statusID);
    let newStatusArray = [...jobStatus];
    newStatusArray[index].expanded = !newStatusArray[index].expanded;
    isLoggedIn && updateMainUserDoc(newStatusArray);
    setJobStatus(newStatusArray);
  }

  return (
    <Paper
      elevation={3}
      sx={{ marginRight: { md: "10px" }, marginLeft: { md: "10px" } }}
      square={true}
    >
      {jobStatus.map((status) => {
        return (
          <Accordion
            expanded={status.expanded === true}
            square={true}
            spacing={1}
            id={status.id}
            key={status.id}
            disableGutters={true}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon
                  color="secondary"
                  onClick={() => handleExpand(status.id)}
                />
              }
              aria-label="Expand Icon"
            >
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flex: "1 1 95%",
                  }}
                >
                  <Typography variant="h4" color="primary">
                    {status.name}
                  </Typography>
                </Box>
                {isLoggedIn && (
                  <Box
                    sx={{
                      display: "flex",
                      flex: "1 1 5%",
                    }}
                  >
                    <Tooltip title="Change status settings">
                      <FormControlLabel
                        label=""
                        onClick={() => {
                          updateStatusData(status);
                          updateStatusSettingsTrigger(true);
                        }}
                        control={
                          <IconButton size="large">
                            <SettingsIcon color="secondary" fontSize="small" />
                          </IconButton>
                        }
                      />
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container direction="row" item xs={12} spacing={1}>
                {jobArray.map((job) => {
                  if (job.jobStatus === status.id) {
                    return (
                      <JobCard
                        key={job.jobID}
                        job={job}
                        updateJobSettingsTrigger={updateJobSettingsTrigger}
                      />
                    );
                  } else {
                    return null;
                  }
                })}

                {status.openAPIJobs &&
                  apiJobs.map((j) => {
                    if (!j.linked) {
                      if (j.status === "active" && j.linked === false) {
                        return <ApiJobCard key={j.job_id} job={j} />;
                      } else {
                        return null;
                      }
                    } else {
                      return null;
                    }
                  })}

                {status.completeAPIJobs &&
                  apiJobs.map((j) => {
                    if (!j.linked && j.status === "delivered") {
                      return <ApiJobCard key={j.job_id} job={j} />;
                    } else {
                      return null;
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
    </Paper>
  );
}
