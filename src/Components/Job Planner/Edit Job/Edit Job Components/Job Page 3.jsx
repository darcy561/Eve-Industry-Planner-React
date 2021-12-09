import React, { useContext } from "react";
import {
  ActiveJobContext,
  ApiJobsContext,
} from "../../../../Context/JobContext";
import {
  Avatar,
  Container,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { MdOutlineAddLink, MdOutlineLinkOff } from "react-icons/md";

export function EditPage3({ setJobModified }) {
  const { activeJob } = useContext(ActiveJobContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);

  const linkedJobs = apiJobs.filter((job) =>
    activeJob.apiJobs.includes(job.job_id)
  );
  const jobMatches = apiJobs.filter(
    (job) => activeJob.itemID == job.product_type_id
  );

  console.log(jobMatches);

  return (
    <Container>
      <Grid container direction="row">
        <Grid item xs={8}>
          <Grid item xs={12}>
            <Typography variant="body2">Linked Jobs</Typography>
          </Grid>
          {linkedJobs.map((job) => {
            return (
              <Grid item container direction="row" xs={6}>
                <Grid item xs={2}>
                  <Avatar
                    src={`https://images.evetech.net/characters/${job.installer_id}/portrait`}
                    variant="circular"
                  />
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2">{`${job.runs} Runs`}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2">
                    {job.end_date}end date
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2">{job.status}</Typography>
                </Grid>
                <Grid item xs={1}>
                  <Tooltip title="Click to unlink from job">
                    <IconButton color="primary" size="small" onClick={() => {}}>
                      <MdOutlineLinkOff />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            );
          })}
        </Grid>
        <Grid item xs={4}>
          ggd
        </Grid>
      </Grid>
    </Container>
  );
}
