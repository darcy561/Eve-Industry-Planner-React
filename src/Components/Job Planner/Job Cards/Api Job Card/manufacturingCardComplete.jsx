import React from "react";
import {
  Avatar,
  Badge,
  Box,
  Grid,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  Card: {
    borderRadius: "10px",
    backgroundColor: "rgba(0,0,0,0.5)",
    border: "1px dashed #E0E0E0;",
    padding: "5px",
    postion: "relative",
  },
  Image: {
    margin: "auto",
    display: "block",
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
}));

export function IndustryESICardComplete({ job }) {
  const classes = useStyles();


  return (
    <Tooltip title="Api Job, manually link this job to an existing job card.">
      <Grid key={job.job_id} item xs={16} sm={6} md={4} lg={3}>
        <Paper className={classes.Card} elevation={3}>
          <Grid container item xs={12}>
            <Grid className={classes.Header} item xs={12}>
              <Typography variant="h6" align="center">
                {job.product_name}
              </Typography>
            </Grid>
            <Grid container item xs={12}>
                <Grid item sm={3}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                    badgeContent={
                      <Avatar
                        src={`https://images.evetech.net/characters/${job.installer_id}/portrait`}
                        variant="circular"
                        sx={{
                          height: "32px",
                          width: "32px",
                        }}
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
                </Grid>
              <Grid container item xs={12} sm={9}>
                <Grid container item xs={12}>
                  <Grid item xs={10}>
                    <Typography variant="body1">Runs:</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{job.runs}</Typography>
                  </Grid>
                </Grid>
                <Grid container item xs={12}>
                  <Grid item xs={4}>
                    <Typography variant="body1">Complete</Typography>
                  </Grid>
                  <Grid item xs={8}>

                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid container item xs={12}>
              <Grid item xs={12} className={classes.JobTypeBg}>
                <Box>
                  <Typography align="center" variant="body2">
                    ESI Industry Job
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Tooltip>
  );
}
