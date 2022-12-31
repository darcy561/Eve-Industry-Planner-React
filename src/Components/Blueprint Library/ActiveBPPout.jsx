import { Grid, Paper, Popover, Typography } from "@mui/material";
import { useJobManagement } from "../../Hooks/useJobManagement";

export function ActiveBPPopout({
  blueprint,
  esiJob,
  displayPopover,
  updateDisplayPopover,
}) {
  const {timeRemainingCalc} = useJobManagement()

  const timeRemaining = timeRemainingCalc();

  return (
    <Popover
      id={blueprint.item_id}
      open={Boolean(displayPopover)}
      anchorEl={displayPopover}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      onClose={() => {
        updateDisplayPopover(null);
      }}
    >
      <Paper
        square
        sx={{ padding: "20px", maxWidth: { xs: "350px", sm: "450px" } }}
      >
        <Grid container direction="row">
          <Grid item xs={12} sx={{ marginBottom: "10px" }}>
            <Typography variant="h5" align="center" color="primary">
              {esiJob.activity_id === 1
                ? "Manufacturing Job"
                : esiJob.activity_id === 3
                ? "Time Efficiency Research"
                : esiJob.activity_id === 4
                ? "Material Efficiency Research"
                : esiJob.activity_id === 9
                ? "Reaction Job"
                : null}
            </Typography>
          </Grid>
          <Grid container item xs={12} align="center">
            <Grid item xs={12}>
              <Typography>Runs: {esiJob.runs}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>{esiJob.facility_name}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                Install Cost:{" "}
                {esiJob.cost.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                Status:{" "}
                {timeRemaining.days === 0 &&
                timeRemaining.hours === 0 &&
                timeRemaining.mins === 0
                  ? "Ready to Deliver"
                  : "Active"}
              </Typography>
            </Grid>
            {timeRemaining.days !== 0 &&
            timeRemaining.hours !== 0 &&
            timeRemaining.mins !== 0 ? (
              <Grid item xs={12}>
                <Typography>
                  Time Remaining: {timeRemaining.days}D, {timeRemaining.hours}H,{" "}
                  {timeRemaining.mins}M
                </Typography>
              </Grid>
            ) : null}
          </Grid>
        </Grid>
      </Paper>
    </Popover>
  );
}
