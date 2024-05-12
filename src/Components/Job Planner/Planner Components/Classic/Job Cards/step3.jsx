import { Grid, Typography } from "@mui/material";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";
import { STANDARD_TEXT_FORMAT } from "../../../../../Context/defaultValues";

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
      <Grid container item xs={12} sx={{ alignItems: "center" }}>
        <Grid item xs={10}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
            ESI Jobs Linked
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }} align="right">
            {job.apiJobs.length.toLocaleString()}/{job.totalJobCount}
          </Typography>
        </Grid>

        {job.apiJobs.length > 0 ? (
          timeRemaining === "complete" ? (
            <Grid item xs={12}>
              <Typography
                sx={{ typography: STANDARD_TEXT_FORMAT }}
                align="left"
              >
                Complete
              </Typography>
            </Grid>
          ) : (
            <>
              <Grid item xs={4}>
                <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
                  Ends In:
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography
                  sx={{ typography: STANDARD_TEXT_FORMAT }}
                  align="right"
                >
                  {timeRemaining}
                </Typography>
              </Grid>
            </>
          )
        ) : null}
      </Grid>
    </Grid>
  );
}
