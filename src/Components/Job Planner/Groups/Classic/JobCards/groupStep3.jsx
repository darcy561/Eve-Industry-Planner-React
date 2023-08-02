import { useMemo } from "react";
import { Grid, Typography } from "@mui/material";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";

export default function GroupStep3JobCard({ job }) {
  const { timeRemainingCalc } = useJobManagement();

  let timeRemaining = useMemo(() => {
    let tempJobs = [...job.build.costs.linkedJobs];
    if (tempJobs.length === 0) {
      return null;
    }
    tempJobs.sort((a, b) => {
      if (Date.parse(a.end_date) > Date.parse(b.end_date)) {
        return 1;
      }
      if (Date.parse(a.end_date) < Date.parse(b.end_date)) {
        return -1;
      }
      return 0;
    });
    return timeRemainingCalc(Date.parse(tempJobs[0].end_date));
  }, [job]);

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
            {job.apiJobs.size.toLocaleString()}/{job.jobCount}
          </Typography>
        </Grid>

        {job.apiJobs.size > 0 ? (
          timeRemaining === "complete" ? (
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
