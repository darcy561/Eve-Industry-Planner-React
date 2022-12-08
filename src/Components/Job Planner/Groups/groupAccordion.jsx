import { Paper } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { UserJobSnapshotContext } from "../../../Context/AuthContext";
import {
  ActiveJobContext,
  JobArrayContext,
  JobStatusContext,
} from "../../../Context/JobContext";
import { useJobManagement } from "../../../Hooks/useJobManagement";
import { GroupAccordionContent } from "./groupAccordionContent";

export function GroupAccordion() {
  const { jobStatus } = useContext(JobStatusContext);
  const { activeGroup } = useContext(ActiveJobContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { jobArray } = useContext(JobArrayContext);
  const [groupJobs, updateGroupJobs] = useState([]);
  const { findJobData } = useJobManagement();

  useEffect(() => {
    async function findAllJobs() {
      let newGroupJobs = [];
      for (let jobID of activeGroup.includedJobIDs) {
        let [job] = await findJobData(jobID, userJobSnapshot, jobArray);
        newGroupJobs.push(job);
      }
      updateGroupJobs(newGroupJobs);
    }
    findAllJobs();
  }, [userJobSnapshot, activeGroup]);

  return (
    <Paper
      elevation={3}
      square
      sx={{ marginRight: { md: "10px" }, marginLeft: { md: "10px" } }}
    >
      {jobStatus.map((status) => {
        let statusJobs = groupJobs.filter((i) => i.jobStatus === status.id);
        return (
          <GroupAccordionContent
            key={status.id}
            status={status}
            statusJobs={statusJobs}
          />
        );
      })}
    </Paper>
  );
}
