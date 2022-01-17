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
    backgroundColor: "rgba(22,22,22,0.5)",
    border: "1px solid #E0E0E0;",
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

export function IndustryESICardActive({ job }) {
  const classes = useStyles();

  function timeRemainingcalc() {
    let now = new Date().getTime();
    let timeLeft = Date.parse(job.end_date) - now;

    let day = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    let hour = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    let min = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (day < 0) {
      day = 0;
    }
    if (hour < 0) {
      hour = 0;
    }
    if (min < 0) {
      min = 0;
    }

    return { days: day, hours: hour, mins: min };
  }

  const timeRemaining = timeRemainingcalc();

  return (
    <Tooltip title="ESI Job, manually link this job to an existing job card.">
      <Grid key={job.job_id} item xs={16} sm={6} md={4} lg={3}>
        <Paper className={classes.Card} elevation={3}>
          <Grid container item xs={12}>
            <Grid className={classes.Header} item xs={12}>
              <Typography variant="h6" align="center">
                {job.product_name}
              </Typography>
            </Grid>
            <Grid container item xs={12}>
              <Grid item xs={3} align="center">
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
                    <img
                      src={`https://image.eveonline.com/Type/${job.blueprint_type_id}_64.png`}
                      alt=""
                      className={classes.Image}
                    />
                  </picture>
                </Badge>
              </Grid>
              <Grid container item xs={9}>
                <Grid container item xs={12}>
                  <Grid item xs={4}>
                    <Typography variant="body1">Runs:</Typography>
                  </Grid>
                  <Grid item xs={8} sx={{ paddingRight: "20px" }}>
                    <Typography variant="body2" align="right">
                      {job.runs}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid container item xs={12}>
                  <Grid item xs={4}>
                    <Typography variant="body1">Remaining:</Typography>
                  </Grid>
                  <Grid item xs={8} sx={{ paddingRight: "20px" }}>
                    {timeRemaining.days === 0 &&
                    timeRemaining.hours === 0 &&
                    timeRemaining.mins === 0 ? (
                      <Typography variant="body2" align="right">
                        Ready to Deliver
                      </Typography>
                    ) : (
                      <Typography variant="body2" align="right">
                        {timeRemaining.days}D, {timeRemaining.hours}H,{" "}
                        {timeRemaining.mins}M
                      </Typography>
                    )}
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
