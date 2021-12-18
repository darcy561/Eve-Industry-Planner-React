import React from "react";
import { Avatar, Badge, Box, Card, Grid, Hidden, Tooltip, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  Card: {
    borderRadius: "10px",
    backgroundColor: "rgba(0,0,0,0.5)",
    border: "1px dashed #E0E0E0;",
    padding: "5px",
    postion: "relative",
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
  JobTypeBg: {
    backgroundColor: "rgba(204,204,204,0.5)",
    marginTop: "10px",
    borderBottomLeftRadius: "5px",
    borderBottomRightRadius: "5px",
  },
  focusHighlight: {},
  CharAvatar: {
    height: "125%",
    width: "125%",
  }
}));

export function ApiJobCard({ job }) {
  const classes = useStyles();
  if (job.activity_id === 1) {
    return (
      <Tooltip title="Api Job, manually link this job to an existing job card." >
        <Grid key={job.job_id} className={classes.Grid} item xs={6} md={4} lg={3} xl={2}>
          <Card className={classes.Card}>
            <Grid className={classes.Grid} container item xs={12}>
              <Grid className={classes.Header} item xs={12}>
                <Typography variant="h6" align="center">
                  {job.product_name}
                </Typography>
              </Grid>
              <Grid className={classes.Grid} container item xs={12}>
                <Hidden smDown>
                  <Grid className={classes.Grid} item sm={3}>
                    <Box>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: "top", horizontal: "right" }}
                        badgeContent={
                          <Avatar
                            className={classes.CharAvatar}
                            src={`https://images.evetech.net/characters/${job.installer_id}/portrait`}
                            variant="circular"
                          />
                        }
                      >
                        <picture className={classes.Image}>
                          <source
                            media="(max-width:700px)"
                            srcSet={`https://image.eveonline.com/Type/${job.blueprint_type_id}_32.png`}
                            alt=""
                            className={classes.Image}
                          />
                          <img
                            src={`https://image.eveonline.com/Type/${job.blueprint_type_id}_64.png`}
                            alt=""
                            className={classes.Image}
                          />
                        </picture>
                      </Badge>
                    </Box>
                  </Grid>
                </Hidden>
                <Grid className={classes.Grid} container item xs={12} sm={9}>
                  <Grid className={classes.Grid} container item xs={12}>
                    <Grid className={classes.Grid} item xs={10}>
                      <Typography variant="body2">Runs</Typography>
                    </Grid>
                    <Grid className={classes.Grid} item xs={2}>
                      <Typography variant="body2">{job.runs}</Typography>
                    </Grid>
                  </Grid>
                  <Grid className={classes.Grid} container item xs={12}>
                    <Grid className={classes.Grid} item xs={4}>
                      <Typography variant="body2">End</Typography>
                    </Grid>
                    <Grid className={classes.Grid} item xs={8}>
                      <Typography variant="body2">{`${new Date(job.end_date).toLocaleDateString()} ${new Date(job.end_date).toLocaleTimeString()}`}</Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Grid className={classes.Grid} container item xs={12}>
                <Grid item xs={12} className={classes.JobTypeBg}>
                  <Box className={classes.Grid}>
                    <Typography align="center" variant="body2">
                      API Job
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Tooltip>
    );
  } else {
    return null
  }
}
