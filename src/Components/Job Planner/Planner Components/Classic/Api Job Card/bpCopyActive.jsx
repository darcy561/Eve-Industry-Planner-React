import { Grid, Typography } from "@mui/material";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";
import { STANDARD_TEXT_FORMAT } from "../../../../../Context/defaultValues";

export function BpCopyESICardActive({ job }) {
  const { timeRemainingCalc } = useJobManagement();

  const timeRemaining = timeRemainingCalc(Date.parse(job.end_date));
  return (
    <Grid container item xs={12} sx={{ paddingLeft: { xs: "0px", sm: "5px" } }}>
      <Grid container item xs={12}>
        <Grid item xs={8}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
            Copies/Runs Per Copy
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }} align="right">
            {job.runs}/{job.licensed_runs}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={4}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
            Remaining:
          </Typography>
        </Grid>
        <Grid item xs={8}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }} align="right">
            {timeRemaining !== "complete" ? timeRemaining : "Ready To Deliver"}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
