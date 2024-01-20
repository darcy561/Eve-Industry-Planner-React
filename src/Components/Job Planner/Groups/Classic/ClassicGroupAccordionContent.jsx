import { Grid } from "@mui/material";
import { useContext } from "react";
import { ClassicGroupJobCardFrame } from "./ClassicGroupJobCardFrame";
<<<<<<< HEAD
import { ActiveJobContext } from "../../../../Context/JobContext";

export function ClassicGroupAccordionContent({ status, statusJobs }) {
  const { activeGroup } = useContext(ActiveJobContext);
=======
import { ActiveJobContext, JobArrayContext } from "../../../../Context/JobContext";

export function ClassicGroupAccordionContent({ status, statusJobs }) {
  const { activeGroup } = useContext(ActiveJobContext);
  const { groupArray } = useContext(JobArrayContext);

  const activeGroupObject = groupArray.find((i) => i.groupID === activeGroup);
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569

  return (
    <Grid container item xs={12} spacing={2}>
      {statusJobs.map((job) => {
<<<<<<< HEAD
        if (!activeGroup.showComplete) {
          if (!activeGroup.areComplete.includes(job.jobID)) {
=======
        if (!activeGroupObject.showComplete) {
          if (!activeGroupObject.areComplete.includes(job.jobID)) {
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
            return <ClassicGroupJobCardFrame key={job.jobID} job={job} />;
          } else return null;
        } else {
          return <ClassicGroupJobCardFrame key={job.jobID} job={job} />;
        }
      })}
    </Grid>
  );
}
