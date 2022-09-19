import { Grid, Typography } from "@mui/material";
import { useContext } from "react";
import { JobArrayContext } from "../../../../Context/JobContext";

export default function Step3JobCard({ job }) {
  const { jobArray } = useContext(JobArrayContext);
  let endDate = null;
  let inputJob = null;

  function timeRemainingcalc(inputTime) {
    let now = Date.now();
    let timeLeft = inputTime - now;
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

  if (!job.isSnapshot) {
    inputJob = jobArray.find((i) => i.jobID === job.jobID);
    if (inputJob.build.costs.linkedJobs.length > 0) {
      let tempJobs = [...inputJob.build.costs.linkedJobs];
      tempJobs.sort((a, b) => {
        if (Date.parse(a.end_date) > Date.parse(b.end_date)) {
          return 1;
        }
        if (Date.parse(a.end_date) < Date.parse(b.end_date)) {
          return -1;
        }
        return 0;
      });
      endDate = Date.parse(tempJobs[0].end_date);
    }
  }

  if (job.isSnapshot) {
    endDate = job.endDateDisplay;
  }

  const timeRemaining = timeRemainingcalc(endDate);

  return (
    <Grid
      container
      item
      xs={10}
      sm={9}
      sx={{ paddingLeft: { xs: "0px", sm: "5px" } }}
    >
      <Grid container item xs={12}>
        <Grid item xs={10}>
          <Typography sx={{ typography: { xs: "body2", md: "body1" } }}>
            ESI Jobs Linked
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography
            sx={{ typography: { xs: "body2", md: "body1" } }}
            align="right"
          >
            {job.apiJobs.length.toLocaleString()}/{job.jobCount}
          </Typography>
        </Grid>

        {job.apiJobs.length > 0 ? (
          timeRemaining.days === 0 &&
          timeRemaining.hours === 0 &&
          timeRemaining.mins === 0 ? (
            <Grid item xs={12}>
              <Typography
                sx={{ typography: { xs: "body2", md: "body1" } }}
                align="left"
              >
                Complete
              </Typography>
            </Grid>
          ) : (
            <>
              <Grid item xs={4}>
                <Typography sx={{ typography: { xs: "body2", md: "body1" } }}>
                  Ends In:
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography
                  sx={{ typography: { xs: "body2", md: "body1" } }}
                  align="right"
                >
                  {timeRemaining.days}D, {timeRemaining.hours}H,{" "}
                  {timeRemaining.mins}M
                </Typography>
              </Grid>
            </>
          )
        ) : null}
      </Grid>
    </Grid>
  );
}
