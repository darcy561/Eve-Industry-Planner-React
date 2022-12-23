import { Grid, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useContext, useEffect, useState } from "react";
import { ActiveJobContext, JobArrayContext } from "../../../Context/JobContext";
import { OutputJobsPanel } from "./OutputJobs";
import { GroupAccordion } from "./groupAccordion";
import { useGroupManagement } from "../../../Hooks/useGroupManagement";
import { UserJobSnapshotContext } from "../../../Context/AuthContext";

export default function GroupPage() {
  const { activeGroup } = useContext(ActiveJobContext);
  const { jobArray } = useContext(JobArrayContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const [groupJobs, updateGroupJobs] = useState([]);
  const [groupPageRefresh, updateGroupPageRefresh] = useState(false);
  const { closeGroup } = useGroupManagement();

  useEffect(() => {
    if (activeGroup !== null) {
      let returnArray = [];
      console.log(activeGroup);
      updateGroupPageRefresh((prev) => !prev);
      for (let jobID of activeGroup.includedJobIDs) {
        let job = jobArray.find((i) => i.jobID === jobID);
        if (job === undefined) {
          continue;
        }
        returnArray.push(job);
      }
      updateGroupJobs(returnArray);
      updateGroupPageRefresh((prev) => !prev);
    }
  }, [activeGroup, jobArray, userJobSnapshot]);

  if (!groupPageRefresh) {
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
          <Grid item xs={5} md={3} lg={2}>
            <Tooltip
              arrow
              title="Saves all changes and returns to the job planner page."
              placement="bottom"
            >
              <IconButton
                color="primary"
                onClick={async () => {
                  closeGroup();
                }}
                size="medium"
                sx={{ marginRight: { sm: "10px" } }}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs={12}>
            <Typography>{activeGroup.groupName}</Typography>
            <Typography>{activeGroup.groupID}</Typography>
          </Grid>
          <Grid container item xs={12} spacing={2}>
            <Grid item xs={12}>
              <OutputJobsPanel
                groupJobs={groupJobs}
                groupPageRefresh={groupPageRefresh}
              />
            </Grid>
            <Grid item xs={12}>
              <GroupAccordion
                groupJobs={groupJobs}
                groupPageRefresh={groupPageRefresh}
              />
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    );
  } else {
    <Paper>Refresh</Paper>;
  }
}
