import { Grid } from "@mui/material";
import { useContext } from "react";
import { ClassicGroupJobCardFrame } from "./ClassicGroupJobCardFrame";
import { ActiveJobContext, JobArrayContext } from "../../../../Context/JobContext";

export function ClassicGroupAccordionContent({ status, statusJobs }) {
  const { activeGroup } = useContext(ActiveJobContext);
  const { groupArray } = useContext(JobArrayContext);

  const activeGroupObject = groupArray.find((i) => i.groupID === activeGroup);

  return (
    <Grid container item xs={12} spacing={2}>
      {statusJobs.map((job) => {
        if (!activeGroupObject.showComplete) {
          if (!activeGroupObject.areComplete.has(job.jobID)) {
            return <ClassicGroupJobCardFrame key={job.jobID} job={job} />;
          } else return null;
        } else {
          return <ClassicGroupJobCardFrame key={job.jobID} job={job} />;
        }
      })}
    </Grid>
  );
}
