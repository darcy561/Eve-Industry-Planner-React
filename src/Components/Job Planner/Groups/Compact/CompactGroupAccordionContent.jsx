import { Grid } from "@mui/material";
import { useContext } from "react";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { CompactGroupJobCardFrame } from "./CompactGroupJobCardFrame";

export function CompactGroupAccordionContent({ status, statusJobs }) {
  const { activeGroup } = useContext(ActiveJobContext);

  return (
    <Grid container>
      <Grid item xs={12}>
        {statusJobs.map((job) => {
          if (!activeGroup.showComplete) {
            if (!activeGroup.areComplete.includes(job.jobID)) {
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