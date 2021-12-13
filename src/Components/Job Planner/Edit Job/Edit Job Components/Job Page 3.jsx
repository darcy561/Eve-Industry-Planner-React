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
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);

  const linkedJobs = apiJobs.filter((job) =>
    activeJob.apiJobs.includes(job.job_id)
  );
  const jobMatches = apiJobs.filter(
    (job) =>
      activeJob.itemID == job.product_type_id && !activeJob.apiJobs.includes(job.job_id)
  );

  console.log(jobMatches);
  function LinkedJobs() {
    return (
      <>
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
                    <IconButton color="primary" size="small" onClick={() => {
                      const newArray = activeJob.apiJobs
                      const index = newArray.findIndex(x => x == job.job_id)
                      newArray.splice(index, 1);
                      updateActiveJob((prevObj) => ({
                        ...prevObj,
                        apiJobs: newArray
                      }))
                      setJobModified(true);
                    }}>
                      <MdOutlineLinkOff />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            );
          })}
          </>
    )
  }

  function AvailableJobs() {
    return (
      <>
          <Grid item xs={12}>
            <Typography variant="body2">Available Jobs</Typography>
          </Grid>
          {jobMatches.map((job) => {
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
                  <Tooltip title="Click to link to job">
                    <IconButton color="primary" size="small" onClick={() => {
                      const newArray = activeJob.apiJobs
                      newArray.push(job.job_id);
                      updateActiveJob((prevObj) => ({
                        ...prevObj,
                        apiJobs: newArray
                      }))
                      setJobModified(true);
                    }}>
                      <MdOutlineAddLink />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            );
          })}
          </>
    )
  }

  return (
    <Container>
      <Grid container direction="row">
        <Grid item xs={6}>
          {activeJob.apiJobs.length > 0 ? <LinkedJobs/> : <AvailableJobs/> }
      </Grid>        
        <Grid item xs={6}>
          {activeJob.apiJobs.length > 0 && jobMatches.length > 0 ? <AvailableJobs/> : null}
        </Grid>
      </Grid>
    </Container>
  );
}
