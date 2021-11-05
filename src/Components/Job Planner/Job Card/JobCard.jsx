import React, { useContext } from "react";
import {
  JobArrayContext,
  ActiveJobContext,
  JobSettingsTriggerContext,
} from "../../../Context/JobContext";
import { jobTypes } from "..";
import { Box, Card, Grid, Hidden, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

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
      color:"blue"
    }
  },  
  Image: {
    width: "80%",
    margin: "auto",
    display: "block",
  },
  Grid: {
    background: "none"
  },
  Box: {
      position: "absolute",
      height: "100%",
      width: "100%",
  },
  Header: {
   marginBottom:"10px" 
 },
  JobTypeMan: {
    backgroundColor: "rgba(164,219,45,0.5)",
    marginTop: "10px",
    borderBottomLeftRadius: "5px",
    borderBottomRightRadius: "5px",
  },
  JobTypeReact: {
    backgroundColor: "rgba(219,45,164,0.5)",
    marginTop: "10px",
    borderBottomLeftRadius: "5px",
    borderBottomRightRadius: "5px",
  },
  JobTypePI: {
    backgroundColor: "rgba(100,45,219,0.5)",
    marginTop: "10px",
    borderBottomLeftRadius: "5px",
    borderBottomRightRadius: "5px",
  },
  focusHighlight: {},
}));

// builds a single job card for each job in the job array, This is displayed on the job planner page. Called from jobplanner.jsx
export function JobCard(props) {
  const { updateActiveJob } = useContext(ActiveJobContext);
  const { ToggleJobSettingsTrigger } = useContext(JobSettingsTriggerContext);
  const classes = useStyles();

  function EditJobProcess(job) {
    updateActiveJob(job);
    ToggleJobSettingsTrigger((prev) => !prev);
    // This function sets up the correct job to be changed and displays the popup window.
  };

  //Adds the coloured bar at the base of a job card and switches based on the jobtype
  function SwitchJobTypeStyle(job) {
    if (job.job.jobType === jobTypes.manufacturing) {
      return (
        <Grid item xs={12} className={classes.JobTypeMan}>
          <Box className={classes.Grid}>
            <Typography align="center" variant="body2">Manufacturing</Typography>
          </Box>
        </Grid>
      );
    };
    if (job.job.jobType === jobTypes.reaction) {
      return (
        <Grid item xs={12} className={classes.JobTypeReact}>
          <Box className={classes.Grid}>
            <Typography align="center" variant="body2">Reaction</Typography>
          </Box>
        </Grid>
      );
    };
    if (job.job.jobType === jobTypes.pi) {
      return (
        <Grid item xs={12} className={classes.JobTypePI}>
          <Box className={classes.Grid}>
            <Typography variant="body2">Planetary Interaction</Typography>
          </Box>
        </Grid>
      );
    };
  };
  return (
      <>
        <Grid key={props.job.jobID} className={classes.Grid}item xs={6} md={4} lg={2}>
          <Card  className={classes.Card} onClick={() => EditJobProcess(props.job)}>
            <Grid className={classes.Grid} container item xs={12} >
              <Grid className={classes.Header} item xs={12}>
                <Typography variant="h6" align="center">{props.job.name}</Typography>
              </Grid>
              <Grid className={classes.Grid} container item xs={12}>
              <Hidden xsDown>
                <Grid className={classes.Grid} item sm={3}>
                  <Box>
                    <picture className={classes.Image}>
                      <source
                        media="(max-width:700px)"
                        srcSet={`https://image.eveonline.com/Type/${props.job.itemID}_32.png`}
                        alt=""
                        className={classes.Image}
                      />
                      <img
                        src={`https://image.eveonline.com/Type/${props.job.itemID}_64.png`}
                        alt=""
                        className={classes.Image}
                      />
                    </picture>
                  </Box>
                </Grid>
                </Hidden>
                <Grid className={classes.Grid} container item xs={12} sm={9}>
                  <Grid className={classes.Grid} container item xs={12}>
                    <Grid className={classes.Grid} item xs={11}>
                      <Typography variant="body2">Run Count</Typography>
                    </Grid>
                    <Grid className={classes.Grid} item xs={1}>
                      <Typography variant="body2">{props.job.runCount}</Typography>
                    </Grid>
                  </Grid>
                  <Grid className={classes.Grid} container item xs={12}>
                    <Grid className={classes.Grid} item xs={11}>
                      <Typography variant="body2">Job Count</Typography>
                    </Grid>
                    <Grid className={classes.Grid} item xs={1}>
                      <Typography variant="body2">{props.job.jobCount}</Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Grid className={classes.Grid} container item xs={12}>
                {<SwitchJobTypeStyle job={props.job} />}
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </>
    );
};