import React, { useContext } from "react";
import {
  ActiveJobContext,
  ApiJobsContext,
} from "../../../../Context/JobContext";
import {
  Container,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
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
    <Container maxWidth="xl" disableGutters={true}>
      <Grid container direction="row">
        <Grid item xs={6}>
          <Grid item xs={12}>
            <Typography variant="body2">Available Jobs</Typography>
          </Grid>
          <Divider />
          <AvailableJobs
            jobMatches={jobMatches}
            setJobModified={setJobModified}
          />
          <Divider />
        </Grid>
        <Grid item xs={6}>
          <Grid item xs={12}>
            <Typography variant="body2">
              Linked Jobs {activeJob.apiJobs.length}/{activeJob.jobCount}
            </Typography>
          </Grid>
          <Divider />
          <LinkedJobs linkedJobs={linkedJobs} setJobModified={setJobModified} />
          <Divider />
        </Grid>
      </Grid>
    </Container>
  );
}
