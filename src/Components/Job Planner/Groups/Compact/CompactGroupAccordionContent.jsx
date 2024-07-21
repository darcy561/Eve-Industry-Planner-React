import { Grid } from "@mui/material";
import { useContext } from "react";
import { ActiveJobContext, JobArrayContext } from "../../../../Context/JobContext";
import { CompactGroupJobCardFrame } from "./CompactGroupJobCardFrame";

export function CompactGroupAccordionContent({ status, statusJobs }) {
  const { activeGroup } = useContext(ActiveJobContext);
  const { groupArray } = useContext(JobArrayContext);

  const activeGroupObject = groupArray.find((i) => i.groupID === activeGroup);

  return (
    <Grid container>
      <Grid item xs={12}>
        {statusJobs.map((job) => {
          if (!activeGroupObject.showComplete) {
            if (!activeGroupObject.areComplete.has(job.jobID)) {
              return <CompactGroupJobCardFrame key={job.jobID} job={job} />;
            } else return null;
          } else {
            return <CompactGroupJobCardFrame key={job.jobID} job={job} />;
          }
        })}
      </Grid>
    </Grid>
  );
}