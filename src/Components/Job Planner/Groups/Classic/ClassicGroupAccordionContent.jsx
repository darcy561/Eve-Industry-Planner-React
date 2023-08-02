import { Grid } from "@mui/material";
import { useContext } from "react";
import { ClassicGroupJobCardFrame } from "./ClassicGroupJobCardFrame";
import { ActiveJobContext } from "../../../../Context/JobContext";

export function ClassicGroupAccordionContent({ status, statusJobs }) {
  const { activeGroup } = useContext(ActiveJobContext);

  return (
    <Grid container item xs={12} spacing={2}>
      {statusJobs.map((job) => {
        if (!activeGroup.showComplete) {
          if (!activeGroup.areComplete.includes(job.jobID)) {
            return <ClassicGroupJobCardFrame key={job.jobID} job={job} />;
          } else return null;
        } else {
          return <ClassicGroupJobCardFrame key={job.jobID} job={job} />;
        }
      })}
    </Grid>
  );
}
