import React, { useContext } from "react";
import {
  ActiveJobContext,
  ApiJobsContext,
} from "../../../../Context/JobContext";
import { Grid } from "@mui/material";
import { LinkedJobs } from "./Page 3 Components/Linked Jobs";
import { AvailableJobs } from "./Page 3 Components/Available Jobs";

export function EditPage3({ setJobModified }) {
  const { activeJob } = useContext(ActiveJobContext);
  const { apiJobs } = useContext(ApiJobsContext);

  const linkedJobs = apiJobs.filter((job) =>
    activeJob.apiJobs.includes(job.job_id)
  );
  const jobMatches = apiJobs.filter(
    (job) =>
      activeJob.itemID === job.product_type_id &&
      !activeJob.apiJobs.includes(job.job_id) &&
      job.linked === false &&
      job.activity_id === 1
  );

  return (
    <Grid container direction="row" spacing={2}>
      <Grid item xs={12} md={6}>
        <AvailableJobs
          jobMatches={jobMatches}
          setJobModified={setJobModified}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <LinkedJobs linkedJobs={linkedJobs} setJobModified={setJobModified} />
      </Grid>
    </Grid>
  );
}
