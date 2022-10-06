import React, { useContext, useState } from "react";
import {
  ApiJobsContext,
  JobStatusContext,
  LinkedIDsContext,
} from "../../../Context/JobContext";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
} from "../../../Context/AuthContext";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SettingsIcon from "@mui/icons-material/Settings";
import AddIcon from "@mui/icons-material/Add";
import { JobCardFrame } from "../Job Cards/JobCard";
import { StatusSettings } from "./StatusSettings";
import { useFirebase } from "../../../Hooks/useFirebase";
import { ApiJobCard } from "../Job Cards/ApiJobCard";
import { MultiSelectJobPlannerContext } from "../../../Context/LayoutContext";
import { makeStyles } from "@mui/styles";
import { useMemo } from "react";

const useStyles = makeStyles((theme) => ({
  Accordion: {
    "& .MuiAccordionSummary-root:hover": {
      cursor: "default",
    },
  },
  Header: {
    color:
      theme.palette.type === "dark" ? "secondary" : theme.palette.primary.main,
  },
}));

export function PlannerAccordion({ updateEditJobTrigger }) {
  const { jobStatus, setJobStatus } = useContext(JobStatusContext);
  const { users } = useContext(UsersContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { apiJobs } = useContext(ApiJobsContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { linkedJobIDs } = useContext(LinkedIDsContext);
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
  const classes = useStyles();

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

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
      {jobStatus.map((status, index) => {
        return (
          <Accordion
            className={classes.Accordion}
            expanded={status.expanded === true}
            square={true}
            spacing={1}
            id={status.id}
            key={status.id}
            disableGutters={true}
          >
            <AccordionSummary
              expandIcon={
                <Tooltip title="Collapse/Expand Stage" arrow placement="bottom">
                  <IconButton
                    color="secondary"
                    onClick={() => handleExpand(status.id)}
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                </Tooltip>
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
                    flexDirection: "row",
                  }}
                >
                  <Typography variant="h4" className={classes.Header}>
                    {status.name}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                  }}
                >
                  <Tooltip
                    title={`Select all jobs in the ${status.name} stage.`}
                    arrow
                    placement="bottom"
                  >
                    <IconButton
                      color="secondary"
                      onClick={() => {
                        let newMultiArray = new Set([...multiSelectJobPlanner]);
                        userJobSnapshot.forEach((job) => {
                          if (job.jobStatus === status.id) {
                            newMultiArray.add(job.jobID);
                          }
                        });
                        updateMultiSelectJobPlanner([...newMultiArray]);
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                  {isLoggedIn && (
                    <Tooltip
                      title="Change status settings"
                      arrow
                      placement="bottom"
                    >
                      <IconButton
                        color="secondary"
                        onClick={() => {
                          updateStatusData(status);
                          updateStatusSettingsTrigger(true);
                        }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container direction="row" item xs={12} spacing={2}>
                {userJobSnapshot.map((job) => {
                  if (job.jobStatus === status.id) {
                    return (
                      <JobCardFrame
                        key={job.jobID}
                        job={job}
                        updateEditJobTrigger={updateEditJobTrigger}
                      />
                    );
                  } else {
                    return null;
                  }
                })}

                {status.openAPIJobs &&
                  apiJobs.map((j) => {
                    if (
                      !parentUser.linkedJobs.has(j.job_id) &&
                      !linkedJobIDs.includes(j.job_id) &&
                      j.status === "active"
                    ) {
                      return <ApiJobCard key={j.job_id} job={j} />;
                    } else {
                      return null;
                    }
                  })}

                {status.completeAPIJobs &&
                  apiJobs.map((j) => {
                    if (
                      !parentUser.linkedJobs.has(j.job_id) &&
                      !linkedJobIDs.includes(j.job_id) &&
                      j.status === "delivered"
                    ) {
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
