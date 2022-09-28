import { Grid, Typography } from "@mui/material";
import { useJobManagement } from "../../../../Hooks/useJobManagement";

export default function Step3JobCard({ job }) {
  const { timeRemainingCalc } = useJobManagement();

  const timeRemaining = timeRemainingCalc(job.endDateDisplay);

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
