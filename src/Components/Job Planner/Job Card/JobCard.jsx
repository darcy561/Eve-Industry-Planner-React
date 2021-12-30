import { useContext } from "react";
import { ActiveJobContext } from "../../../Context/JobContext";
import { jobTypes } from "..";
import {
  Box,
  Card,
  Grid,
  Hidden,
  Tooltip,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useFirebase } from "../../../Hooks/useFirebase";
import { LoadingTextContext, PageLoadContext } from "../../../Context/LayoutContext";

const useStyles = makeStyles((theme) => ({
  Card: {
    borderRadius: "10px",
    background: "none",
    border: "1px solid #E0E0E0;",
    padding: "5px",
    postion: "relative",
    cursor: "pointer",
    "&:hover $focusHighlight": {
      opacity: 1,
      color: "blue",
    },
  },
  Image: {
    width: "80%",
    margin: "auto",
    display: "block",
  },
  Grid: {
    background: "none",
  },
  Box: {
    position: "absolute",
    height: "100%",
    width: "100%",
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
  focusHighlight: {},
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
      jobData: true
    }));
    updatePageLoad(true)
    if (job.isSnapshot) {
      const jobEdit = await downloadCharacterJobs(job);
      job = jobEdit;
      job.isSnapshot = false;
    }
    updateActiveJob(job);
    updatePageLoad(false);
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobDataComp: true
    }));
    updateJobSettingsTrigger((prev) => !prev);
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: false,
      jobDataComp: false
    }));
    // This function sets up the correct job to be changed and displays the popup window.
  }

  //Adds the coloured bar at the base of a job card and switches based on the jobtype
  function SwitchJobTypeStyle({ job }) {
    if (job.jobType === jobTypes.manufacturing) {
      return (
        <Grid item xs={12} className={classes.JobTypeMan}>
          <Box className={classes.Grid}>
            <Typography align="center" variant="body2">
              Manufacturing
            </Typography>
          </Box>
        </Grid>
      );
    }
    if (job.jobType === jobTypes.reaction) {
      return (
        <Grid item xs={12} className={classes.JobTypeReact}>
          <Box className={classes.Grid}>
            <Typography align="center" variant="body2">
              Reaction
            </Typography>
          </Box>
        </Grid>
      );
    }
    if (job.jobType === jobTypes.pi) {
      return (
        <Grid item xs={12} className={classes.JobTypePI}>
          <Box className={classes.Grid}>
            <Typography variant="body2">Planetary Interaction</Typography>
          </Box>
        </Grid>
      );
    }
  }
  return (
    <Tooltip title="Click to open">
      <Grid key={job.jobID} className={classes.Grid} item xs={12} sm={6} md={4} lg={3}>
        <Card className={classes.Card} onClick={() => EditJobProcess(job)}>
          <Grid className={classes.Grid} container item xs={12}>
            <Grid className={classes.Header} item xs={12}>
              <Typography variant="h6" color="secondary" align="center">
                {job.name}
              </Typography>
            </Grid>
            <Grid className={classes.Grid} container item xs={12}>
              <Hidden smDown>
                <Grid className={classes.Grid} item sm={3}>
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
              <Grid className={classes.Grid} container item xs={12} sm={9}>
                <Grid className={classes.Grid} container item xs={12}>
                  <Grid className={classes.Grid} item xs={10}>
                    <Typography variant="body2">Runs</Typography>
                  </Grid>
                  <Grid className={classes.Grid} item xs={2}>
                    <Typography variant="body2">{job.runCount}</Typography>
                  </Grid>
                </Grid>
                <Grid className={classes.Grid} container item xs={12}>
                  <Grid className={classes.Grid} item xs={10}>
                    <Typography variant="body2">Job Slots</Typography>
                  </Grid>
                  <Grid className={classes.Grid} item xs={2}>
                    <Typography variant="body2">{job.jobCount}</Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid className={classes.Grid} container item xs={12}>
              <SwitchJobTypeStyle job={job} />
            </Grid>
          </Grid>
        </Card>
      </Grid>
    </Tooltip>
  );
}
