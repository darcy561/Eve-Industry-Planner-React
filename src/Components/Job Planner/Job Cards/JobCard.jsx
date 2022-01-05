import { useContext } from "react";
import { ActiveJobContext } from "../../../Context/JobContext";
import { jobTypes } from "..";
import { Box, Card, Grid, Hidden, Tooltip, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useFirebase } from "../../../Hooks/useFirebase";
import {
  LoadingTextContext,
  PageLoadContext,
} from "../../../Context/LayoutContext";

const useStyles = makeStyles((theme) => ({
  Card: {
    borderRadius: "10px",
    background: "none",
    border: "1px solid #E0E0E0;",
    padding: "5px",
    postion: "relative",
    cursor: "pointer",
  },
  Image: {
    margin: "auto",
    display: "block",
  },
  Header: {
    marginBottom: "10px",
  },
  JobTypeMan: {
    backgroundColor: theme.palette.manufacturing.main,
    marginTop: "10px",
    borderBottomLeftRadius: "5px",
    borderBottomRightRadius: "5px",
  },
  JobTypeReact: {
    backgroundColor: theme.palette.reaction.main,
    marginTop: "10px",
    borderBottomLeftRadius: "5px",
    borderBottomRightRadius: "5px",
  },
  JobTypePI: {
    backgroundColor: theme.palette.pi.main,
    marginTop: "10px",
    borderBottomLeftRadius: "5px",
    borderBottomRightRadius: "5px",
  },
}));

// builds a single job card for each job in the job array, This is displayed on the job planner page. Called from jobplanner.jsx
export function JobCard({ job, updateJobSettingsTrigger }) {
  const { updateActiveJob } = useContext(ActiveJobContext);
  const { downloadCharacterJobs } = useFirebase();
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const classes = useStyles();

  async function EditJobProcess(job) {
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: true,
    }));
    updatePageLoad(true);
    if (job.isSnapshot) {
      const jobEdit = await downloadCharacterJobs(job);
      job = jobEdit;
      job.isSnapshot = false;
    }
    updateActiveJob(job);
    updatePageLoad(false);
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobDataComp: true,
    }));
    updateJobSettingsTrigger((prev) => !prev);
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: false,
      jobDataComp: false,
    }));
    // This function sets up the correct job to be changed and displays the popup window.
  }

  //Adds the coloured bar at the base of a job card and switches based on the jobtype
  function SwitchJobTypeStyle({ job }) {
    if (job.jobType === jobTypes.manufacturing) {
      return (
        <Grid item xs={12} className={classes.JobTypeMan}>
          <Typography align="center" variant="body1">
            Manufacturing
          </Typography>
        </Grid>
      );
    }
    if (job.jobType === jobTypes.reaction) {
      return (
        <Grid item xs={12} className={classes.JobTypeReact}>
          <Typography align="center" variant="body1">
            Reaction
          </Typography>
        </Grid>
      );
    }
    if (job.jobType === jobTypes.pi) {
      return (
        <Grid item xs={12} className={classes.JobTypePI}>
          <Typography variant="body1">Planetary Interaction</Typography>
        </Grid>
      );
    }
  }
  return (
    <Tooltip title="Click to open">
      <Grid key={job.jobID} item xs={12} sm={6} md={4} lg={3}>
        <Card className={classes.Card} onClick={() => EditJobProcess(job)}>
          <Grid container item xs={12}>
            <Grid className={classes.Header} item xs={12}>
              <Typography variant="h6" color="secondary" align="center">
                {job.name}
              </Typography>
            </Grid>
            <Grid container item xs={12}>
              <Hidden smDown>
                <Grid item sm={3}>
                  <Box>
                    <picture className={classes.Image}>
                      <source
                        media="(max-width:700px)"
                        srcSet={`https://image.eveonline.com/Type/${job.itemID}_32.png`}
                        alt=""
                        className={classes.Image}
                      />
                      <img
                        src={`https://image.eveonline.com/Type/${job.itemID}_64.png`}
                        alt=""
                        className={classes.Image}
                      />
                    </picture>
                  </Box>
                </Grid>
              </Hidden>
              <Grid container item xs={12} sm={9}>
                <Grid container item xs={12}>
                  <Grid item xs={10}>
                    <Typography variant="body1">Runs</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body1">
                      {job.runCount.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid container item xs={12}>
                  <Grid item xs={10}>
                    <Typography variant="body1">Job Slots</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body1">
                      {job.jobCount.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid container item xs={12}>
              <SwitchJobTypeStyle job={job} />
            </Grid>
          </Grid>
        </Card>
      </Grid>
    </Tooltip>
  );
}
