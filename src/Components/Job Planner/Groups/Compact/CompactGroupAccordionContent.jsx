import { Grid } from "@mui/material";
import { useContext } from "react";
<<<<<<< HEAD
import { ActiveJobContext } from "../../../../Context/JobContext";
=======
import { ActiveJobContext, JobArrayContext } from "../../../../Context/JobContext";
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
import { CompactGroupJobCardFrame } from "./CompactGroupJobCardFrame";

export function CompactGroupAccordionContent({ status, statusJobs }) {
  const { activeGroup } = useContext(ActiveJobContext);
<<<<<<< HEAD
=======
  const { groupArray } = useContext(JobArrayContext);

  const activeGroupObject = groupArray.find((i) => i.groupID === activeGroup);
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569

  return (
    <Grid container>
      <Grid item xs={12}>
        {statusJobs.map((job) => {
<<<<<<< HEAD
          if (!activeGroup.showComplete) {
            if (!activeGroup.areComplete.includes(job.jobID)) {
=======
          if (!activeGroupObject.showComplete) {
            if (!activeGroupObject.areComplete.includes(job.jobID)) {
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
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